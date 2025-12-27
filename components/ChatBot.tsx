
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, LiveServerMessage, Modality } from "@google/genai";
import Button from './common/Button';
import Spinner from './common/Spinner';
import Icon from './common/Icon';
import { User } from '../types';

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

const VoiceVisualizer: React.FC<{ level: number; color: string; count?: number }> = ({ level, color, count = 12 }) => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-16 w-full">
      {[...Array(count)].map((_, i) => (
        <div 
          key={i}
          className={`w-1.5 rounded-full transition-all duration-75 ${color}`}
          style={{ 
            height: `${20 + (Math.random() * level * 80)}%`,
            opacity: 0.3 + (level * 0.7)
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
      text: `Protocol initiated. Greetings, ${user.fullName.split(' ')[0]}. I am your CareerDev Intelligence Kernel. State your query for analysis.`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);

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

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    setIsSpeaking(false);
    setCurrentlySpeakingId(null);
    setAudioLevel(0);
  }, []);

  const generateAndPlaySpeech = async (text: string, messageIndex?: number) => {
    if (!text.trim()) return;
    
    stopAllAudio();
    setIsSpeaking(true);
    if (messageIndex !== undefined) setCurrentlySpeakingId(messageIndex);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this analytical advice firmly and professionally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, 
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
          outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const ctx = outputAudioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        
        const analyzer = ctx.createAnalyser();
        analyzer.fftSize = 256;
        analyzerRef.current = analyzer;
        
        source.connect(analyzer);
        analyzer.connect(ctx.destination);
        
        source.onended = () => {
          setIsSpeaking(false);
          setCurrentlySpeakingId(null);
          setAudioLevel(0);
          sourcesRef.current.delete(source);
        };
        
        sourcesRef.current.add(source);
        source.start(0);
        
        const updateVisuals = () => {
          if (analyzerRef.current && isSpeaking) {
            const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
            analyzerRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average / 128);
            visualizerRequestRef.current = requestAnimationFrame(updateVisuals);
          }
        };
        updateVisuals();
      }
    } catch (err) {
      console.error("TTS failed:", err);
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    }
  };

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
    try {
      setIsVoiceMode(true);
      setIsLoading(true);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      audioContextRef.current = inputAudioCtx;
      outputAudioContextRef.current = outputAudioCtx;

      const analyzer = outputAudioCtx.createAnalyser();
      analyzer.fftSize = 256;
      analyzerRef.current = analyzer;

      const inputAnalyzer = inputAudioCtx.createAnalyser();
      inputAnalyzer.fftSize = 256;
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
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => stopVoiceMode(),
          onerror: (e) => {
            console.warn("Live Audio Error, falling back...", e);
            setIsSpeechFallback(true);
            setIsLoading(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are an Encouraging Career Intelligence Kernel. Use brief, analytical voice protocols.',
        }
      });

      liveSessionRef.current = sessionPromise;

      const updateVisualizer = () => {
        if (analyzerRef.current) {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 128);
        }

        if (inputAnalyzerRef.current) {
          const dataArray = new Uint8Array(inputAnalyzerRef.current.frequencyBinCount);
          inputAnalyzerRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setInputAudioLevel(average / 128);
        }

        visualizerRequestRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

    } catch (err) {
      console.warn("Starting voice failed, falling back to TTS:", err);
      setIsSpeechFallback(true);
      setIsLoading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    const userMsg: Message = { role: 'user', text: currentInput };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: `You are a high-level Career Intelligence Kernel (CareerDev AI). 
          You provide scientific, data-driven career advice. 
          Your tone is professional, analytical, and encouraging. 
          Use industry-specific terminology where appropriate. 
          Structure your responses cleanly.`,
        },
        history: history
      });

      const streamResponse = await chat.sendMessageStream({ message: currentInput });
      
      let fullText = "";
      const modelMsg: Message = { role: 'model', text: "", isStreaming: true };
      setMessages(prev => [...prev, modelMsg]);

      for await (const chunk of streamResponse) {
        fullText += (chunk.text || "");
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], text: fullText };
          return newMsgs;
        });
      }

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], isStreaming: false };
        return newMsgs;
      });

      if (isSpeechFallback || isAutoSpeak) {
        generateAndPlaySpeech(fullText, messages.length + 1);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Protocol error. Neural link unstable." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto min-h-[500px] h-[calc(100vh-10rem)] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-700 mb-8 backdrop-blur-xl ${
      isVoiceMode && !isSpeechFallback 
      ? 'bg-slate-950 border-indigo-500/30' 
      : 'bg-white dark:bg-slate-950/80 border-slate-200 dark:border-slate-800'
    }`}>
      {/* Header */}
      <div className={`px-8 py-5 border-b flex items-center justify-between flex-shrink-0 transition-colors duration-500 ${
        isVoiceMode && !isSpeechFallback ? 'bg-slate-900/50 border-indigo-500/20' : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-lg shadow-lg transition-all duration-500 ${
            isVoiceMode && !isSpeechFallback ? 'bg-indigo-600 shadow-indigo-500/40' : 'bg-slate-900 dark:bg-slate-100'
          }`}>
            <Icon name="logo" className={`h-6 w-6 ${isVoiceMode && !isSpeechFallback ? 'text-white' : 'text-white dark:text-slate-900'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-mono font-bold leading-tight uppercase tracking-tight transition-colors duration-500 ${
              isVoiceMode && !isSpeechFallback ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}>Intelligence_Kernel</h2>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full transition-all duration-500 ${
                isVoiceMode && !isSpeechFallback ? 'bg-indigo-400 animate-pulse' : 
                isSpeechFallback ? 'bg-amber-500' : 
                isAutoSpeak ? 'bg-fuchsia-500' : 'bg-slate-400'
              }`}></span>
              <span className={isVoiceMode && !isSpeechFallback ? 'text-indigo-400' : 'text-slate-500'}>
                {isSpeechFallback ? 'FALLBACK_TTS' : isVoiceMode ? 'NEURAL_LINK' : isAutoSpeak ? 'VOICE_FEEDBACK' : 'IDLE'}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isVoiceMode && (
            <button
              onClick={() => setIsAutoSpeak(!isAutoSpeak)}
              className={`p-2.5 rounded-xl transition-all border shadow-sm ${isAutoSpeak ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' : 'text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title={isAutoSpeak ? "Disable Auto-speak" : "Enable Auto-speak"}
            >
              <Icon name="volume" className={`h-4 w-4 ${isAutoSpeak ? 'animate-pulse' : ''}`} />
            </button>
          )}
          <button 
            onClick={isVoiceMode ? stopVoiceMode : startVoiceMode}
            className={`px-5 py-2 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${
              isVoiceMode 
              ? 'bg-slate-800 text-indigo-400 border-indigo-500/30 hover:bg-slate-700' 
              : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
            }`}
          >
            {isVoiceMode ? <Icon name="moon" className="h-3.5 w-3.5" /> : <Icon name="mic" className="h-3.5 w-3.5" />}
            {isVoiceMode ? 'GO_SILENT' : 'VOICE_LINK'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        {isVoiceMode && !isSpeechFallback ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            {/* Immersive Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div 
                className="absolute inset-0 bg-indigo-600/5 transition-opacity duration-1000"
                style={{ opacity: 0.1 + (audioLevel * 0.4) }}
              />
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] transition-transform duration-500"
                style={{ transform: `translate(-50%, -50%) scale(${1 + (audioLevel * 2)})` }}
              />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12 max-w-lg w-full">
              {/* Responsive Neural Avatar */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl animate-pulse" />
                
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute inset-0 rounded-full border border-indigo-500/10 transition-all duration-150"
                    style={{ 
                      transform: `scale(${1.2 + (i * 0.2) + (audioLevel * (i + 1) * 0.15)})`,
                      opacity: 0.4 - (i * 0.1),
                      borderWidth: isSpeaking ? '2px' : '1px'
                    }}
                  />
                ))}

                <div className={`h-48 w-48 md:h-64 md:w-64 rounded-full bg-slate-900 border-2 border-indigo-500/30 flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.3)] transition-transform duration-100 ${isSpeaking ? 'scale-105' : 'scale-100'}`}>
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:20px_20px]" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`transition-all duration-150 ${isSpeaking ? 'scale-110' : 'opacity-80'}`}>
                      <Icon name="logo" className="h-20 w-20 md:h-24 md:w-24 text-indigo-400" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 h-1 bg-indigo-500/20 top-0 animate-scanline pointer-events-none" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.4em] mb-2 transition-colors duration-500 ${isSpeaking ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {isLoading ? 'ESTABLISHING_LINK' : isSpeaking ? 'TRANSMITTING' : 'LISTENING'}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-mono font-black text-white uppercase tracking-tighter leading-none">
                    {isLoading ? <Spinner /> : isSpeaking ? 'ANALYZING' : 'IDLE_WAIT'}
                  </h3>
                </div>

                <div className="pt-8">
                   <VoiceVisualizer level={isSpeaking ? audioLevel : inputAudioLevel} color={isSpeaking ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-slate-700'} count={24} />
                </div>
              </div>

              <button 
                onClick={stopVoiceMode}
                className="mt-4 text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors py-2 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50"
              >
                DISCONNECT_LINK
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`flex flex-col max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`group relative px-6 py-4 rounded-3xl shadow-xl transition-all duration-300 ${
                      msg.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-900 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-800'
                    } ${msg.isStreaming ? 'ring-4 ring-indigo-500/20' : ''}`}>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed font-medium">
                        {msg.text}
                        {msg.isStreaming && <span className="inline-block h-5 w-2 bg-indigo-500 ml-2 align-middle animate-pulse shadow-[0_0_15px_rgba(99,102,241,1)]"></span>}
                      </div>

                      {msg.role === 'model' && !msg.isStreaming && (
                        <div className="absolute -bottom-2 -right-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={() => currentlySpeakingId === i ? stopAllAudio() : generateAndPlaySpeech(msg.text, i)}
                            className={`p-2.5 rounded-full border transition-all shadow-lg ${currentlySpeakingId === i ? 'bg-indigo-600 text-white border-indigo-500 scale-110' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-600'}`}
                          >
                            <Icon name={currentlySpeakingId === i ? "logo" : "volume"} className={`h-4 w-4 ${currentlySpeakingId === i ? 'animate-pulse' : ''}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 backdrop-blur-md">
              <form onSubmit={sendMessage} className="relative flex items-center gap-4 max-w-5xl mx-auto">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Query_input >"
                  className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-8 py-5 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 dark:text-white shadow-xl"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-2xl shadow-xl transition-all active:scale-95"
                >
                  {isLoading ? <Spinner /> : <Icon name="send" className="h-6 w-6" />}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        
        @keyframes scanline {
          0% { top: 0; opacity: 0; }
          50% { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scanline {
          animation: scanline 4s linear infinite;
        }
      `}} />
    </div>
  );
};

export default ChatBot;
