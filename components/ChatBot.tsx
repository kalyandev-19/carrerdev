
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './common/Button.tsx';
import Icon from './common/Icon.tsx';
import { User } from '../types.ts';
import { getAI } from '../services/geminiService.ts';

interface Message {
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  isError?: boolean;
}

interface ChatBotProps {
  user: User;
}

// Manual implementation of decode function for raw audio bytes as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual implementation of encode function for raw audio bytes as per guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decodes raw PCM audio data into an AudioBuffer for playback without using native decodeAudioData
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceVisualizer: React.FC<{ level: number; color: string; count?: number }> = ({ level, color, count = 32 }) => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-48 w-full perspective-[1500px]">
      {[...Array(count)].map((_, i) => (
        <motion.div 
          key={i}
          animate={{ 
            height: `${15 + (level * 160 * (0.6 + Math.random() * 0.4))}%`, 
            opacity: 0.2 + (level * 0.8) 
          }}
          transition={{ duration: 0.08 }}
          className={`w-1.5 rounded-full shadow-lg ${color} shadow-indigo-500/20`}
        />
      ))}
    </div>
  );
};

const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hello ${user.fullName.split(' ')[0]}! I'm your Career Assistant. How can I help you today?` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const inputAnalyzerRef = useRef<AnalyserNode | null>(null);
  const visualizerRequestRef = useRef<number | null>(null);
  const activeSessionRef = useRef<any>(null);
  
  // Track audio scheduling state and active sources for gapless playback
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const stopVoiceMode = useCallback(() => {
    setIsVoiceMode(false);
    if (activeSessionRef.current) {
        try { activeSessionRef.current.close(); } catch(e) {}
        activeSessionRef.current = null;
    }
    
    // Stop all active audio sources on session termination
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    if (visualizerRequestRef.current) cancelAnimationFrame(visualizerRequestRef.current);
  }, []);

  const handleKeyError = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  };

  const startVoiceMode = async () => {
    try {
      const ai = getAI();
      setIsVoiceMode(true);
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const analyzer = outputCtx.createAnalyser();
      analyzer.fftSize = 256;
      analyzerRef.current = analyzer;
      
      const inputAnalyzer = inputCtx.createAnalyser();
      inputAnalyzer.fftSize = 256;
      inputAnalyzerRef.current = inputAnalyzer;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const micSource = inputCtx.createMediaStreamSource(stream);
      micSource.connect(inputAnalyzer);

      // Initialize the Gemini Live session with the latest native audio model
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const data = e.inputBuffer.getChannelData(0);
              const pcm = encode(new Uint8Array(new Int16Array(data.map(v => v * 32768)).buffer));
              // Ensure data is sent only after the session promise resolves to avoid race conditions
              sessionPromise.then(s => {
                  activeSessionRef.current = s;
                  s.sendRealtimeInput({ media: { data: pcm, mimeType: 'audio/pcm;rate=16000' } });
              }).catch(err => {
                console.error("Realtime input failure:", err);
              });
            };
            micSource.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Process model audio output and schedule it for gapless playback
            const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              setIsSpeaking(true);
              const buffer = await decodeAudioData(decode(audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(analyzer);
              analyzer.connect(outputCtx.destination);
              
              // Maintain nextStartTime to ensure each chunk starts precisely at the end of the previous one
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              activeSourcesRef.current.add(source);
              source.addEventListener('ended', () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) {
                  setIsSpeaking(false);
                }
              });
            }

            // Handle session interruptions by stopping current playback
            const interrupted = msg.serverContent?.interrupted;
            if (interrupted) {
              activeSourcesRef.current.forEach(source => {
                try { source.stop(); } catch(e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (err: any) => {
            console.error("Live AI Error:", err);
            const msg = err?.message || "";
            if (msg.includes("API key") || msg.includes("entity was not found")) {
              handleKeyError();
            }
          },
          onclose: stopVoiceMode,
        },
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: "You are a helpful career advisor for students. Keep your spoken responses concise, encouraging, and natural."
        }
      });

      sessionPromise.catch(err => {
        console.error("Session connection rejected:", err);
        stopVoiceMode();
      });

      const update = () => {
        if (analyzerRef.current) {
          const data = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(data);
          const level = data.reduce((a, b) => a + b, 0) / data.length / 255;
          setAudioLevel(level);
        }
        if (inputAnalyzerRef.current) {
          const data = new Uint8Array(inputAnalyzerRef.current.frequencyBinCount);
          inputAnalyzerRef.current.getByteFrequencyData(data);
          const level = data.reduce((a, b) => a + b, 0) / data.length / 255;
          setInputAudioLevel(level);
        }
        visualizerRequestRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (e: any) { 
      console.error(e);
      setIsVoiceMode(false); 
      if (e.message.includes("API Key")) {
        setMessages(prev => [...prev, { role: 'model', text: e.message, isError: true }]);
      }
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const txt = input;
    setMessages(prev => [...prev, { role: 'user', text: txt }]);
    setInput('');
    setIsLoading(true);
    try {
      const ai = getAI();
      const chat = ai.chats.create({ 
          model: 'gemini-3-flash-preview',
          config: {
              systemInstruction: "You are a specialized career AI assistant. Provide insightful, helpful advice for students regarding their career path, resumes, and interviews."
          }
      });
      const stream = await chat.sendMessageStream({ message: txt });
      let full = "";
      setMessages(prev => [...prev, { role: 'model', text: "", isStreaming: true }]);
      for await (const chunk of stream) {
        full += chunk.text;
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length-1];
          if (last) last.text = full;
          return next;
        });
      }
      setMessages(prev => {
          const next = [...prev];
          const last = next[next.length-1];
          if (last) last.isStreaming = false;
          return next;
        });
    } catch (error: any) { 
        console.error(error);
        const errorMsg = error?.message || "Something went wrong with the connection.";
        setMessages(prev => [...prev, { role: 'model', text: errorMsg, isError: true }]);
        if (errorMsg.includes("API Key") || errorMsg.includes("entity was not found")) {
          handleKeyError();
        }
    } finally { 
        setIsLoading(false); 
    }
  };

  return (
    <div className={`max-w-5xl mx-auto h-[calc(100vh-10rem)] flex flex-col rounded-[40px] shadow-3d overflow-hidden glass-panel border-t-2 border-l-2 border-white/30 transition-all duration-700 ${isVoiceMode ? 'bg-slate-950 ring-8 ring-indigo-500/10' : ''}`}>
      <div className="px-10 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <motion.div animate={{ rotate: isVoiceMode ? 360 : 0 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="bg-indigo-600 p-2.5 rounded-xl shadow-lg">
            <Icon name="logo" className="h-6 w-6 text-white" />
          </motion.div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Career Assistant</h2>
            <div className="flex items-center gap-1.5 mt-1">
               <span className="h-1 w-1 rounded-full bg-indigo-400 animate-pulse" />
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Active & Ready</span>
            </div>
          </div>
        </div>
        <button 
            onClick={isVoiceMode ? stopVoiceMode : startVoiceMode} 
            className={`btn-3d px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] ${isVoiceMode ? 'bg-rose-600 shadow-rose-950' : 'bg-indigo-600'}`}
        >
          {isVoiceMode ? 'Stop Voice Chat' : 'Start Voice Chat'}
        </button>
      </div>

      <div className="flex-grow flex flex-col relative overflow-hidden">
        {isVoiceMode ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex flex-col items-center justify-center p-12">
            <div className="relative mb-16">
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.4, 0.1] }} 
                transition={{ duration: 3, repeat: Infinity }} 
                className="absolute inset-0 bg-indigo-500 rounded-full blur-[90px]" 
              />
              <motion.div 
                animate={{ 
                    scale: isSpeaking ? 1.05 : 1,
                    boxShadow: isSpeaking ? "0 0 50px 10px rgba(79, 70, 229, 0.3)" : "0 20px 50px rgba(0,0,0,0.1)"
                }}
                className="h-64 w-64 rounded-full glass-panel border-2 border-indigo-500/40 flex items-center justify-center shadow-3d relative z-10 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-transparent" />
                <Icon name="logo" className={`h-28 w-28 text-indigo-500 transition-all ${isSpeaking ? 'animate-pulse' : ''}`} />
              </motion.div>
            </div>
            <VoiceVisualizer level={isSpeaking ? audioLevel : inputAudioLevel} color={isSpeaking ? 'bg-indigo-400' : 'bg-slate-700'} />
            <p className="mt-8 text-xs font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">
                {isSpeaking ? "Assistant is speaking..." : "Listening to you..."}
            </p>
          </motion.div>
        ) : (
          <div className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-8 py-6 rounded-[35px] shadow-3d border-t-2 border-l-2 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white border-white/10' 
                      : msg.isError 
                        ? 'bg-rose-950/20 text-rose-500 border-rose-500/30'
                        : 'glass-panel text-slate-900 dark:text-white border-white/20'
                    }`}>
                    <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1.5 bg-indigo-500 animate-pulse rounded-full align-middle" />}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {!isVoiceMode && (
        <div className="p-8 bg-slate-950/20 backdrop-blur-lg border-t border-white/5">
          <form onSubmit={sendMessage} className="flex gap-4 max-w-5xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your career..."
              className="flex-grow glass-panel border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-8 py-5 text-sm font-bold shadow-inner-soft focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
            <button type="submit" className="p-5 bg-indigo-600 rounded-2xl btn-3d shadow-xl transition-all active:scale-90">
              <Icon name="send" className="h-6 w-6 text-white" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
