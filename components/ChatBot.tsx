
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, LiveServerMessage, Modality } from "@google/genai";
import Button from './common/Button.tsx';
import Spinner from './common/Spinner.tsx';
import Icon from './common/Icon.tsx';
import { User } from '../types.ts';

interface Message {
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

interface ChatBotProps {
  user: User;
}

// Helper functions for audio processing
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

const VoiceVisualizer: React.FC<{ level: number; color: string; count?: number }> = ({ level, color, count = 24 }) => {
  return (
    <div className="flex items-center justify-center gap-2 h-32 w-full perspective-[1000px]">
      {[...Array(count)].map((_, i) => (
        <div 
          key={i}
          className={`w-2 rounded-full transition-all duration-75 shadow-lg ${color} shadow-indigo-500/20`}
          style={{ 
            height: `${20 + (Math.random() * level * 100)}%`,
            opacity: 0.3 + (level * 0.7),
            transform: `translateZ(${level * 50}px) rotateY(${i * 10}deg)`
          }}
        />
      ))}
    </div>
  );
};

const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSpeechFallback, setIsSpeechFallback] = useState(false);
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Hello, ${user.fullName.split(' ')[0]}! I'm your career assistant. How can I help you with your job search or resume today?`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const inputAnalyzerRef = useRef<AnalyserNode | null>(null);
  const visualizerRequestRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopAllAudio();
      if (visualizerRequestRef.current) cancelAnimationFrame(visualizerRequestRef.current);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFatalError = (err: any) => {
    const msg = err?.message || "Something went wrong.";
    setApiError(msg);
  };

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  const stopVoiceMode = useCallback(() => {
    setIsVoiceMode(false);
    setIsSpeechFallback(false);
    stopAllAudio();
    if (liveSessionRef.current) liveSessionRef.current = null;
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setInputAudioLevel(0);
    if (visualizerRequestRef.current) cancelAnimationFrame(visualizerRequestRef.current);
  }, [stopAllAudio]);

  const startVoiceMode = async () => {
    setApiError(null);
    try {
      setIsVoiceMode(true);
      setIsLoading(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputAudioCtx;
      outputAudioContextRef.current = outputAudioCtx;

      const analyzer = outputAudioCtx.createAnalyser();
      analyzerRef.current = analyzer;
      const inputAnalyzer = inputAudioCtx.createAnalyser();
      inputAnalyzerRef.current = inputAnalyzer;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const micSource = inputAudioCtx.createMediaStreamSource(stream);
      micSource.connect(inputAnalyzer);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsLoading(false);
            const scriptProcessor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            micSource.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputAudioCtx, 24000, 1);
              const source = outputAudioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(analyzer);
              analyzer.connect(outputAudioCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => stopVoiceMode(),
          onerror: (e) => handleFatalError(e),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are an Encouraging Career Assistant.',
        }
      });

      const updateVisualizer = () => {
        if (analyzerRef.current) {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          setAudioLevel(dataArray.reduce((a, b) => a + b) / dataArray.length / 128);
        }
        if (inputAnalyzerRef.current) {
          const dataArray = new Uint8Array(inputAnalyzerRef.current.frequencyBinCount);
          inputAnalyzerRef.current.getByteFrequencyData(dataArray);
          setInputAudioLevel(dataArray.reduce((a, b) => a + b) / dataArray.length / 128);
        }
        visualizerRequestRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();
    } catch (err) {
      handleFatalError(err);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    const currentInput = input;
    setMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setInput('');
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const chat = ai.chats.create({ model: 'gemini-3-pro-preview' });
      const streamResponse = await chat.sendMessageStream({ message: currentInput });
      let fullText = "";
      setMessages(prev => [...prev, { role: 'model', text: "", isStreaming: true }]);
      for await (const chunk of streamResponse) {
        fullText += (chunk.text || "");
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = fullText;
          return newMsgs;
        });
      }
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].isStreaming = false;
        return newMsgs;
      });
    } catch (error) {
      handleFatalError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`max-w-5xl mx-auto h-[calc(100vh-10rem)] flex flex-col rounded-[40px] shadow-3d overflow-hidden transition-all duration-700 glass-panel border-t-2 border-l-2 border-white/50 ${
      isVoiceMode ? 'bg-slate-950 ring-4 ring-indigo-500/20' : ''
    }`}>
      {/* Understandable Header */}
      <div className="px-10 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg tilt-card">
            <Icon name="logo" className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Career AI</h2>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isVoiceMode ? 'bg-indigo-400 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isVoiceMode ? 'On Air' : 'Ready'}</span>
            </div>
          </div>
        </div>
        <button onClick={isVoiceMode ? stopVoiceMode : startVoiceMode} className={`btn-3d px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest ${isVoiceMode ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-600 text-white'}`}>
          {isVoiceMode ? 'Stop Voice' : 'Voice Mode'}
        </button>
      </div>

      <div className="flex-grow flex flex-col relative overflow-hidden">
        {isVoiceMode ? (
          <div className="flex-grow flex flex-col items-center justify-center p-12">
            <div className="relative mb-20 group">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
              <div className={`h-64 w-64 rounded-full glass-panel border-2 border-indigo-500/30 flex items-center justify-center transition-transform duration-300 shadow-3d ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
                <div className="flex flex-col items-center">
                   <div className="h-32 w-32 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl tilt-card">
                      <Icon name="logo" className="h-16 w-16 text-white" />
                   </div>
                </div>
              </div>
            </div>
            <VoiceVisualizer level={isSpeaking ? audioLevel : inputAudioLevel} color={isSpeaking ? 'bg-indigo-500' : 'bg-slate-600'} />
            <div className="mt-12 text-center">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">{isSpeaking ? 'AI Speaking' : 'Listening...'}</span>
            </div>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} tilt-card`}>
                <div className={`max-w-[80%] px-8 py-5 rounded-[30px] shadow-3d border-t-2 border-l-2 ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white border-white/20' 
                  : 'glass-panel text-slate-900 dark:text-white border-white/40'
                }`}>
                  <p className="text-base font-semibold leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {!isVoiceMode && (
        <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={sendMessage} className="relative flex gap-4 max-w-5xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-grow glass-panel border-2 border-slate-100 dark:border-slate-700 rounded-3xl px-10 py-6 text-base font-semibold shadow-inner-soft focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
            <button type="submit" className="p-6 bg-indigo-600 hover:bg-indigo-500 rounded-3xl btn-3d shadow-xl transition-all">
              <Icon name="send" className="h-7 w-7 text-white" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
