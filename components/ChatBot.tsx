
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
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Hi ${user.fullName.split(' ')[0]}! I'm your CareerDev Assistant. How can I help you today? You can ask me about resume tips, interview prep, or career paths.`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  // Fallback TTS Logic using Gemini TTS model
  const generateAndPlaySpeech = async (text: string) => {
    if (!text.trim()) return;
    
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this career advice warmly and professionally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Use 'Kore' for a professional mentor tone
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
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        
        // Connect to visualizer for fallback mode too
        if (!analyzerRef.current) {
          analyzerRef.current = ctx.createAnalyser();
          analyzerRef.current.fftSize = 256;
        }
        source.connect(analyzerRef.current);
        analyzerRef.current.connect(ctx.destination);
        
        source.onended = () => {
          setIsSpeaking(false);
          setAudioLevel(0);
        };
        
        source.start(0);
        
        // Start visualization loop for fallback
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
      console.error("TTS Fallback failed:", err);
      setIsSpeaking(false);
    }
  };

  // Voice Interaction Logic
  const stopVoiceMode = useCallback(() => {
    setIsVoiceMode(false);
    setIsSpeechFallback(false);
    setIsSpeaking(false);
    if (liveSessionRef.current) {
      liveSessionRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setAudioLevel(0);
    setInputAudioLevel(0);
  }, []);

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
            // Initiate fallback logic
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
      // We don't call stopVoiceMode here yet because we want to stay in the "voice UI" state
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
        newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], isStreaming: false };
        return newMsgs;
      });

      // If in speech fallback mode, trigger TTS after receiving full text
      if (isSpeechFallback) {
        generateAndPlaySpeech(fullText);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-[500px] h-[calc(100vh-10rem)] flex flex-col bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 mb-8">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500/10 p-2 rounded-xl text-sky-500">
            <Icon name="chat" className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Career Assistant</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-500 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${isVoiceMode && !isSpeechFallback ? 'bg-green-500 animate-pulse' : isSpeechFallback ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
              {isSpeechFallback ? 'Speech Fallback Active' : isVoiceMode ? 'Live Voice Mode' : 'Gemini 3 Pro Online'}
            </p>
          </div>
        </div>
        <button 
          onClick={isVoiceMode ? stopVoiceMode : startVoiceMode}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${
            isVoiceMode 
            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
            : 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100'
          }`}
        >
          {isVoiceMode ? <Icon name="send" className="h-3 w-3" /> : <Icon name="mic" className="h-3 w-3" />}
          {isVoiceMode ? 'Exit Voice' : 'Voice Assistant'}
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        {isVoiceMode ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in zoom-in-95 overflow-y-auto">
            {isSpeechFallback && (
              <div className="absolute top-4 left-4 right-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 p-3 rounded-xl z-20 animate-in slide-in-from-top-4 duration-500">
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
                  className="absolute inset-0 rounded-full bg-sky-500/20"
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
              
              <div className={`h-40 w-40 md:h-48 md:w-48 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 shadow-2xl flex items-center justify-center relative z-10 transition-transform duration-75`}
                   style={{ transform: `scale(${1 + (isSpeaking ? audioLevel * 0.15 : inputAudioLevel * 0.1)})` }}>
                <div className="bg-white/10 backdrop-blur-md rounded-full p-6 border border-white/20">
                  <Icon name="logo" className={`h-12 w-12 md:h-16 md:w-16 text-white ${isSpeaking ? 'animate-bounce' : ''}`} />
                </div>
              </div>
            </div>

            <div className="space-y-4 max-w-sm">
              <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tighter ${isSpeaking ? 'text-indigo-600 dark:text-sky-400' : 'text-slate-900 dark:text-white'}`}>
                {isLoading ? 'Connecting...' : isSpeaking ? 'Assistant Speaking' : isSpeechFallback ? 'Ready for Input' : 'Listening to You'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {isLoading ? 'Setting up low-latency voice session' : isSpeaking ? 'I am responding to your query...' : isSpeechFallback ? 'Type below and I will speak back!' : 'I am listening. Go ahead, ask me anything!'}
              </p>
              
              {!isLoading && (
                <div className="flex justify-center gap-1.5 h-8 items-center">
                  {[...Array(16)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${isSpeaking ? 'bg-sky-500' : isSpeechFallback ? 'bg-slate-200 dark:bg-slate-700' : 'bg-emerald-500'}`}
                      style={{ 
                        height: isSpeaking 
                          ? `${20 + Math.random() * 60 * audioLevel}%` 
                          : isSpeechFallback ? '10%' : `${10 + Math.random() * 50 * inputAudioLevel}%`,
                        opacity: isSpeaking ? 1 : (inputAudioLevel > 0.05 ? 0.8 : 0.2)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* In fallback mode, we need the input visible even in the "center stage" view */}
            {isSpeechFallback && (
              <div className="w-full max-w-md pt-8">
                <form onSubmit={sendMessage} className="relative flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white shadow-xl"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    <Icon name="send" className="h-5 w-5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-200 ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                  } ${msg.isStreaming ? 'animate-message-streaming shadow-indigo-500/20' : ''}`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap relative z-10">
                      {msg.text}
                      {msg.isStreaming && <span className="inline-block h-[1.1em] w-[0.4em] bg-sky-500 ml-1.5 align-middle animate-cursor-blink shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span>}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase mt-1 px-2 tracking-tighter">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1].role === 'user' && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <div className="flex gap-1.5 items-center">
                    <div className="h-2 w-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-sky-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Input Area (Only for Text Mode) */}
      {!isVoiceMode && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <form onSubmit={sendMessage} className="relative flex items-center gap-2 group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-grow bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900 dark:text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white rounded-xl shadow-lg transition-all active:scale-95"
            >
              {isLoading ? <Spinner /> : <Icon name="send" className="h-5 w-5" />}
            </button>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
        
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; transform: scaleY(1); }
          50% { opacity: 0; transform: scaleY(0.8); }
        }
        
        .animate-cursor-blink {
          animation: cursor-blink 0.8s step-end infinite;
        }

        @keyframes message-streaming {
          0% { transform: scale(0.995) translateY(2px); opacity: 0.95; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        .animate-message-streaming {
          animation: message-streaming 0.3s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default ChatBot;
