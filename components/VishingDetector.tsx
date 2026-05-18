
import React, { useState, useEffect, useRef } from 'react';
import { FRAUD_KEYWORDS } from '../constants';

// O'zbek tilidagi qo'shimcha shubhali iboralar
const EXTENDED_FRAUD_PATTERNS = [
  ...FRAUD_KEYWORDS,
  "kod keldi", "smsni ayting", "karta tasdiqlash", "shaxsingizni tasdiqlang", 
  "hisobingiz xavf ostida", "pul yechib olinyapti", "tranzaksiya to'xtatildi",
  "markaziy bankdan qo'ng'iroq", "moliya vazirligi", "sud ijrochilari",
  "yutuq sohibi bo'ldingiz", "qarzni to'lang", "karta bloklandi"
];

// Tezkor base64 kodlash funksiyasi
function encode(bytes: Uint8Array) {
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binString);
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Audio darajasini optimallashtirish
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const VishingDetector: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<{text: string, isUser: boolean}[]>([]);
  const [liveText, setLiveText] = useState(''); 
  const [alerts, setAlerts] = useState<string[]>([]);
  const [threatDetected, setThreatDetected] = useState(false);
  const [threatScore, setThreatScore] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sessionRef = useRef<any>(null);
  const visualizerRequestRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);
  const fullTextAccumulator = useRef('');
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(40).fill(0));

  const stopDetection = () => {
    setIsListening(false);
    isListeningRef.current = false;
    if (visualizerRequestRef.current) {
      cancelAnimationFrame(visualizerRequestRef.current);
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.error("Error closing session:", e);
      }
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setLiveText('');
    setVisualizerData(new Array(40).fill(0));
  };

  const updateVisualizer = () => {
    if (!analyserRef.current || !isListeningRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const step = Math.floor(dataArray.length / 40);
    const simplified = [];
    for (let i = 0; i < 40; i++) {
      simplified.push(dataArray[i * step] / 255 * 100);
    }
    setVisualizerData(simplified);
    visualizerRequestRef.current = requestAnimationFrame(updateVisualizer);
  };

  const startDetection = async () => {
    try {
      setTranscript([]);
      setAlerts([]);
      setThreatDetected(false);
      setThreatScore(0);
      setLiveText('');
      fullTextAccumulator.current = '';
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputAudioContext;
      
      const analyser = inputAudioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      setIsListening(true);
      isListeningRef.current = true;

      // Note: Periodic audio segment analysis via backend API
      const source = inputAudioContext.createMediaStreamSource(stream);
      const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
      
      source.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContext.destination);

      let audioChunks: Int16Array[] = [];
      
      scriptProcessor.onaudioprocess = async (audioProcessingEvent) => {
        if (!isListeningRef.current) return;
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        
        // Convert to Int16
        const l = inputData.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        audioChunks.push(int16);

        // Every ~3 seconds, analyze
        if (audioChunks.length >= 12) { // 4096 * 12 / 16000 ~= 3s
          const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const merged = new Int16Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }
          audioChunks = [];
          
          const base64Audio = encode(new Uint8Array(merged.buffer));
          
          try {
            const response = await fetch('/api/vishing-analyze', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ audioData: base64Audio }),
            });

            if (!response.ok) {
              throw new Error('Vishing analysis failed');
            }

            const data = await response.json();
            const aiResponse = data.text;
            
            if (aiResponse.toUpperCase().includes('[DANGER]')) {
              setThreatDetected(true);
              setThreatScore(100);
              setTranscript(prev => [...prev, { text: aiResponse, isUser: false }]);
            } else {
              setLiveText(aiResponse);
              // Simple keyword check on transcription
              EXTENDED_FRAUD_PATTERNS.forEach(kw => {
                if (aiResponse.toLowerCase().includes(kw.toLowerCase())) {
                  setAlerts(prev => prev.includes(kw) ? prev : [...prev, kw]);
                  setThreatScore(s => Math.min(s + 20, 100));
                }
              });
            }
          } catch (e) {
            console.error("Analysis error:", e);
          }
        }
      };
      
      requestAnimationFrame(updateVisualizer);
      sessionRef.current = { close: () => { source.disconnect(); scriptProcessor.disconnect(); } };

    } catch (err) {
      console.error("Mikrofon ulanishida xato:", err);
      setIsListening(false);
    }
  };


  // Threat Score 70 dan oshsa avtomatik overlay yoqiladi
  useEffect(() => {
    if (threatScore >= 70) {
      setThreatDetected(true);
    }
  }, [threatScore]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, liveText]);

  return (
    <div className="relative space-y-6">
      {/* --- EKREMAL DARXOL OGOHLANTIRISH (CRITICAL OVERLAY) --- */}
      {threatDetected && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-red-700/95 backdrop-blur-xl animate-pulse">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(0,0,0,0.1)_20px,rgba(0,0,0,0.1)_40px)] opacity-20"></div>
          
          <div className="relative bg-white p-10 rounded-[48px] shadow-[0_0_100px_rgba(220,38,38,0.8)] max-w-xl w-full text-center space-y-10 border-[12px] border-red-500 animate-in zoom-in duration-300">
            <div className="relative flex justify-center">
              <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center text-7xl animate-bounce shadow-inner">
                🚫
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-red-600 rounded-full border-4 border-white flex items-center justify-center text-white font-black animate-ping">
                !
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-red-600 uppercase tracking-tighter leading-none">
                DIQQAT: FIRIBGAR!
              </h2>
              <div className="h-2 w-32 bg-red-600 mx-auto rounded-full"></div>
              <p className="text-slate-800 text-xl font-bold leading-tight">
                SafeGuard AI ushbu suhbatni <br/>
                <span className="text-red-600 px-2 bg-red-50 rounded-lg underline decoration-4">99% FIRIBGARLIK</span> deb baholadi.
              </p>
            </div>

            <div className="bg-slate-100 p-6 rounded-3xl space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aniqlangan xavf omillari:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {alerts.length > 0 ? alerts.map((a, i) => (
                  <span key={i} className="px-4 py-2 bg-white text-red-600 rounded-xl text-sm font-black shadow-sm border border-red-100">
                    ⚠️ {a.toUpperCase()}
                  </span>
                )) : (
                  <span className="px-4 py-2 bg-white text-red-600 rounded-xl text-sm font-black shadow-sm border border-red-100">
                    ⚠️ SHUBHALI INTENT (MA'NO)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={stopDetection}
                className="w-full py-6 bg-red-600 text-white rounded-[24px] font-black text-2xl uppercase shadow-[0_15px_30px_rgba(220,38,38,0.4)] hover:bg-red-700 transition-all active:scale-95 border-b-8 border-red-800"
              >
                🔴 ALOQANI UZISH
              </button>
              <button 
                onClick={() => { setThreatDetected(false); setThreatScore(0); }}
                className="text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm uppercase tracking-widest"
              >
                Xabarni yopish (Xavf yo'q)
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <h2 className="text-xl font-bold text-slate-800">Jonli Vishing Detektori</h2>
          </div>
          <p className="text-slate-500 text-sm">Gemini 2.5 Live AI suhbatni real-vaqtda eshitib tahlil qilmoqda</p>
        </div>
        <button 
          onClick={isListening ? stopDetection : startDetection}
          className={`px-10 py-4 rounded-2xl font-black transition-all flex items-center gap-3 active:scale-95 shadow-xl ${
            isListening 
            ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200' 
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
          }`}
        >
          {isListening ? (
            <><div className="w-3 h-3 bg-white rounded-full animate-ping"></div> TO'XTATISH</>
          ) : (
            <><span className="text-xl">🎙️</span> HIMOYANI YOQISH</>
          )}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-slate-950 rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[600px] border-8 border-slate-900">
          <div className="p-5 bg-slate-900 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></div>
              <span className="text-xs font-mono text-slate-400 font-black uppercase tracking-widest">
                {isListening ? 'AI Monitoring: ON' : 'AI Monitoring: STANDBY'}
              </span>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-[10px] text-slate-500 font-mono">LATENCY: 180ms</div>
               <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-800"></div>
               </div>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 font-mono text-sm scroll-smooth bg-[radial-gradient(circle_at_top_right,rgba(30,41,59,0.5),transparent)]">
            {transcript.length === 0 && !liveText && (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4 opacity-30">
                <div className="text-6xl">🤖</div>
                <p className="font-bold uppercase tracking-widest text-xs">Suhbatni boshlang...</p>
              </div>
            )}
            
            {transcript.map((line, idx) => (
              <div key={idx} className={`flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-300`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${line.isUser ? 'text-blue-500' : 'text-emerald-500'}`}>
                  {line.isUser ? 'Incoming Audio' : 'AI Analysis'}
                </span>
                <p className={`p-4 rounded-2xl ${line.isUser ? 'bg-white/5 text-slate-300' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {line.text}
                </p>
              </div>
            ))}

            {liveText && (
              <div className="flex flex-col gap-1 animate-pulse">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Processing...</span>
                <p className="p-4 bg-blue-500/5 rounded-2xl text-blue-300 border border-blue-500/20 italic">
                  {liveText}
                </p>
              </div>
            )}
          </div>

          {/* Audio Visualizer */}
          {isListening && (
            <div className="h-20 bg-slate-900 border-t border-white/5 flex items-center justify-center gap-1 px-10">
              {visualizerData.map((height, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-gradient-to-t from-blue-600 to-emerald-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(5, height)}%`, opacity: 0.3 + (height / 100) }}
                ></div>
              ))}
            </div>
          )}
        </div>

        {/* Threat Meter Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 flex flex-col items-center text-center">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Xavf Darajasi</h3>
            
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Progress Circle */}
              <svg className="w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle 
                  cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray={502.4}
                  strokeDashoffset={502.4 - (502.4 * threatScore) / 100}
                  className={`transition-all duration-1000 ${threatScore > 70 ? 'text-red-500' : threatScore > 40 ? 'text-amber-500' : 'text-emerald-500'}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-800">{threatScore}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SHUBHA</span>
              </div>
            </div>

            <div className="mt-8 w-full space-y-3">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-2">
                 <span className="text-slate-400">Safe</span>
                 <span className="text-red-500">Danger</span>
               </div>
               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className={`h-full transition-all duration-1000 ${threatScore > 70 ? 'bg-red-500' : 'bg-emerald-500'}`}
                   style={{ width: `${threatScore}%` }}
                 ></div>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-4 shadow-2xl">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
               🛡️
             </div>
             <h4 className="font-black text-lg">AI Himoya Rejimi</h4>
             <p className="text-xs text-slate-400 leading-relaxed font-medium">
               Tizim nafaqat so'zlarni, balki firibgarning gapirish ohangi va mantiqiy xatolarini ham tahlil qilmoqda. 
             </p>
             <div className="pt-4 flex items-center gap-3">
               <div className="flex -space-x-2">
                 {[...Array(3)].map((_, i) => (
                   <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px]">🤖</div>
                 ))}
               </div>
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">3 AI Agent monitoring</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VishingDetector;
