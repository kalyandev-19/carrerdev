
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, LiveServerMessage, Modality } from "@google/genai";
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

const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSpeechFallback, setIsSpeechFallback] = useState(false);
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Hi ${user.fullName.split(' ')[0]}! I'm your CareerDev Assistant. How can I help you today? You can ask me about resume tips, interview prep, or career paths.`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);

  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Voice & TTS Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const inputAnalyzerRef = useRef<AnalyserNode | null>(null);

  // Initialize standard chat session on mount
  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    chatRef.current = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: `You are an expert career coach named CareerDev Assistant. Help students with professional advice. Be encouraging and concise.`,
      },
    });
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

  // Fallback TTS Logic using Gemini TTS model
  const generateAndPlaySpeech = async (text: string, messageIndex?: number) => {
    if (!text.trim()) return;
    
    stopAllAudio();
    setIsSpeaking(true);
    if (messageIndex !== undefined) setCurrentlySpeakingId(messageIndex);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this career advice warmly and professionally: ${text}` }] }],
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
        
        if (!analyzerRef.current) {
          analyzerRef.current = ctx.createAnalyser();
          analyzerRef.current.fftSize = 256;
        }
        source.connect(analyzerRef.current);
        analyzerRef.current.connect(ctx.destination);
        
        source.onended = () => {
          setIsSpeaking(false);
          setCurrentlySpeakingId(null);
          setAudioLevel(0);
          sourcesRef.current.delete(source);
        };
        
        sourcesRef.current.add(source);
        source.start(0);
        
        // Start visualization loop
        const updateFallbackVisuals = () => {
          if (analyzerRef.current && isSpeaking) {
            const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
            analyzerRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average / 128);
            requestAnimationFrame(updateFallbackVisuals);
          }
        };
        updateFallbackVisuals();
      }
    } catch (err) {
      console.error("TTS failed:", err);
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    }
  };

  // Voice Interaction Logic
  const stopVoiceMode = useCallback(() => {
    setIsVoiceMode(false);
    setIsSpeechFallback(false);
    stopAllAudio();
    if (liveSessionRef.current) {
      liveSessionRef.current = null;
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setInputAudioLevel(0);
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
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
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
            console.error("Live session error:", e);
            setIsSpeechFallback(true);
            setIsLoading(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are a career coach. Answer via voice briefly.',
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

        if (liveSessionRef.current) requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

    } catch (err) {
      console.warn("Real-time voice unavailable, switching to speech fallback.");
      setIsSpeechFallback(true);
      setIsLoading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatRef.current) throw new Error("Chat not initialized");
      const streamResponse = await chatRef.current.sendMessageStream({ message: textToSend });
      
      let fullText = "";
      const modelMsg: Message = { role: 'model', text: "", isStreaming: true };
      setMessages(prev => [...prev, modelMsg]);

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        fullText += c.text;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], text: fullText };
          return newMsgs;
        });
      }

      setMessages(prev => {
        const newMsgs = [...prev];
        const lastIdx = newMsgs.length - 1;
        newMsgs[lastIdx] = { ...newMsgs[lastIdx], isStreaming: false };
        return newMsgs;
      });

      if (isSpeechFallback || isAutoSpeak) {
        generateAndPlaySpeech(fullText, messages.length + 1);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-[500px] h-[calc(100vh-10rem)] flex flex-col bg-white dark:bg-slate-950/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 mb-8 backdrop-blur-xl">
      {/* Header */}
      <div className="bg-slate-50/50 dark:bg-slate-900/50 px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-fuchsia-500 to-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
            <Icon name="chat" className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Career Assistant</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isVoiceMode && !isSpeechFallback ? 'bg-emerald-500 animate-pulse' : isSpeechFallback || isAutoSpeak ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
              {isSpeechFallback ? 'Speech Fallback Active' : isVoiceMode ? 'Live Voice Mode' : isAutoSpeak ? 'Auto-speak ON' : 'Gemini 3 Pro Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isVoiceMode && (
            <button
              onClick={() => setIsAutoSpeak(!isAutoSpeak)}
              className={`p-2.5 rounded-xl transition-all border shadow-sm ${isAutoSpeak ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' : 'text-slate-400 border-transparent hover:bg-slate-100'}`}
              title={isAutoSpeak ? "Disable Auto-speak" : "Enable Auto-speak"}
            >
              <Icon name="volume" className={`h-4 w-4 ${isAutoSpeak ? 'animate-pulse' : ''}`} />
            </button>
          )}
          <button 
            onClick={isVoiceMode ? stopVoiceMode : startVoiceMode}
            className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${
              isVoiceMode 
              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
              : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {isVoiceMode ? <Icon name="send" className="h-3 w-3" /> : <Icon name="mic" className="h-3 w-3" />}
            {isVoiceMode ? 'Exit Voice' : 'Voice Mode'}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        {isVoiceMode ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in zoom-in-95 overflow-y-auto">
            {isSpeechFallback && (
              <div className="absolute top-4 left-4 right-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 p-3 rounded-2xl z-20 animate-in slide-in-from-top-4 duration-500">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2">
                  <Icon name="volume" className="h-3.5 w-3.5" />
                  Live Voice Unavailable. Using Speech-Enabled Text mode.
                </p>
              </div>
            )}

            <div className="relative">
              {[1, 2, 3].map(i => (
                <div 
                  key={`out-${i}`}
                  className="absolute inset-0 rounded-full bg-indigo-500/20"
                  style={{ 
                    transform: `scale(${1 + (audioLevel * i * 0.5)})`,
                    opacity: isSpeaking ? 0.4 : 0,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
              ))}

              {!isSpeaking && !isSpeechFallback && [1, 2].map(i => (
                <div 
                  key={`in-${i}`}
                  className="absolute inset-0 rounded-full bg-emerald-500/20"
                  style={{ 
                    transform: `scale(${1 + (inputAudioLevel * i * 0.4)})`,
                    opacity: inputAudioLevel > 0.1 ? 0.5 : 0,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
              ))}
              
              <div className={`h-40 w-40 md:h-56 md:w-56 rounded-full bg-gradient-to-br from-fuchsia-500 via-indigo-600 to-sky-500 shadow-2xl flex items-center justify-center relative z-10 transition-transform duration-75`}
                   style={{ transform: `scale(${1 + (isSpeaking ? audioLevel * 0.2 : inputAudioLevel * 0.15)})` }}>
                <div className="bg-white/10 backdrop-blur-xl rounded-full p-8 border border-white/20">
                  <Icon name="logo" className={`h-16 w-16 md:h-24 md:w-24 text-white drop-shadow-lg ${isSpeaking ? 'animate-bounce' : ''}`} />
                </div>
              </div>
            </div>

            <div className="space-y-4 max-w-sm">
              <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-tighter ${isSpeaking ? 'text-indigo-600 dark:text-sky-400' : 'text-slate-900 dark:text-white'}`}>
                {isLoading ? 'Connecting...' : isSpeaking ? 'Assistant Speaking' : isSpeechFallback ? 'Ready for Input' : 'Listening...'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-widest opacity-60">
                {isLoading ? 'Low-latency session setup' : isSpeaking ? 'Transmitting career data' : isSpeechFallback ? 'Type and I will respond' : 'Speak clearly into your mic'}
              </p>
              
              {!isLoading && (
                <div className="flex justify-center gap-2 h-10 items-center">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-75 ${isSpeaking ? 'bg-indigo-500' : isSpeechFallback ? 'bg-slate-200 dark:bg-slate-800' : 'bg-emerald-500'}`}
                      style={{ 
                        height: isSpeaking 
                          ? `${30 + Math.random() * 70 * audioLevel}%` 
                          : isSpeechFallback ? '10%' : `${15 + Math.random() * 60 * inputAudioLevel}%`,
                        opacity: isSpeaking ? 1 : (inputAudioLevel > 0.05 ? 0.8 : 0.1)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {isSpeechFallback && (
              <div className="w-full max-w-md pt-8">
                <form onSubmit={sendMessage} className="relative flex items-center gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white shadow-xl"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white rounded-2xl shadow-xl transition-all active:scale-90"
                  >
                    <Icon name="send" className="h-6 w-6" />
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`flex flex-col max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`group relative px-6 py-4 rounded-3xl shadow-xl transition-all duration-300 ${
                    msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white rounded-tr-none shadow-indigo-500/10' 
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-800 shadow-slate-900/5'
                  } ${msg.isStreaming ? 'animate-bubble-pulse ring-4 ring-indigo-500/20' : ''}`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap relative z-10 leading-relaxed font-medium">
                      {msg.text}
                      {msg.isStreaming && <span className="inline-block h-5 w-2 bg-indigo-500 ml-2 align-middle animate-cursor-blink shadow-[0_0_15px_rgba(99,102,241,1)]"></span>}
                    </div>

                    {msg.role === 'model' && !msg.isStreaming && (
                      <div className="absolute -bottom-2 -right-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <button
                          onClick={() => currentlySpeakingId === i ? stopAllAudio() : generateAndPlaySpeech(msg.text, i)}
                          className={`p-2.5 rounded-full border transition-all shadow-lg ${currentlySpeakingId === i ? 'bg-indigo-600 text-white border-indigo-500 scale-110' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-600'}`}
                        >
                          <Icon name={currentlySpeakingId === i ? "logo" : "volume"} className={`h-4 w-4 ${currentlySpeakingId === i ? 'animate-pulse' : ''}`} />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mt-2 px-3 tracking-widest">
                    {msg.role === 'user' ? 'You' : 'CareerDev Assistant'}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1].role === 'user' && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-3xl rounded-tl-none border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xl">
                  <div className="flex gap-2 items-center">
                    <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-fuchsia-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-sky-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Processing...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Input Area (Only for Text Mode) */}
      {!isVoiceMode && (
        <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 backdrop-blur-md">
          <form onSubmit={sendMessage} className="relative flex items-center gap-4 group max-w-5xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for advice, resume tips, or interview help..."
              className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-8 py-5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 dark:text-white shadow-xl dark:shadow-black/20"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-5 bg-indigo-600 hover:bg-fuchsia-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 group-hover:rotate-1"
            >
              {isLoading ? <Spinner /> : <Icon name="send" className="h-6 w-6" />}
            </button>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); }
        
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; transform: scaleY(1); }
          50% { opacity: 0; transform: scaleY(0.7); }
        }
        
        .animate-cursor-blink {
          animation: cursor-blink 0.6s step-end infinite;
        }

        @keyframes bubble-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.05); }
          50% { transform: scale(1.005); box-shadow: 0 15px 25px -5px rgba(99, 102, 241, 0.15); }
        }

        .animate-bubble-pulse {
          animation: bubble-pulse 1.5s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default ChatBot;
