
import React from 'react';
import { BotLogEntry } from '../types';

interface TelegramBotProps {
  logs: BotLogEntry[];
  isScanning: boolean;
  setIsScanning: (val: boolean) => void;
  isSilentMode: boolean;
  setIsSilentMode: (val: boolean) => void;
  botInfo: { username: string; name: string };
  lastPollTime: string;
  clearLogs?: () => void;
}

const TelegramBot: React.FC<TelegramBotProps> = ({ 
  logs, 
  isScanning, 
  setIsScanning, 
  isSilentMode,
  setIsSilentMode,
  botInfo, 
  lastPollTime,
  clearLogs
}) => {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-3xl shadow-lg border-4 border-blue-100">
            🤖
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{botInfo.name}</h2>
            <p className="text-blue-600 font-mono text-sm">{botInfo.username}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isScanning ? `Aktiv • Yangilanish: ${lastPollTime}` : 'Monitoring To\'xtatilgan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsSilentMode(!isSilentMode)}
            className={`px-4 py-3 rounded-xl font-bold transition-all text-sm border ${
              isSilentMode 
              ? 'bg-amber-50 border-amber-200 text-amber-700' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {isSilentMode ? '🔇 Ovozsiz rejim' : '🔊 Ogohlantirish YOQIQ'}
          </button>
          
          <button 
            onClick={() => setIsScanning(!isScanning)}
            className={`px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
              isScanning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isScanning ? '⏹️ To\'xtatish' : '▶️ Boshlash'}
          </button>
        </div>
      </header>

      {isSilentMode && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
          <span className="text-lg">ℹ️</span>
          <p>
            <b>Ovozsiz rejim (Silent Mode) yoqilgan.</b> Bot xavfli xabarlarni aniqlaydi va qora ro'yxatga qo'shadi, lekin Telegram guruhlariga ogohlantirish yubormaydi.
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3 text-blue-800 text-sm">
        <span className="text-lg">💡</span>
        <div>
          <p className="font-bold mb-1">Bot guruh xabarlarini o'qimayaptimi?</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Botni guruhga <b>Admin</b> qilib tayinlang.</li>
            <li>BotFather orqali <b>Privacy Mode</b> ni 'Disabled' holatiga o'tkazing.</li>
            <li>Botga barcha xabarlarni o'qish huquqini bering.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg">
            <h4 className="font-bold text-blue-400 text-xs uppercase mb-3 tracking-wider">Xavfsizlik Protokoli</h4>
            <div className="space-y-4 text-[11px]">
              <div>
                <p className="text-slate-400 mb-1 italic">Tizim ma'lumotlari xotirada saqlanadi:</p>
                <ul className="space-y-2">
                  <li className="flex gap-2 text-emerald-400"><span>✅</span> Blacklist saqlanadi</li>
                  <li className="flex gap-2 text-emerald-400"><span>✅</span> Loglar o'chib ketmaydi</li>
                  <li className="flex gap-2 text-emerald-400"><span>✅</span> Sozlamalar eslab qolinadi</li>
                </ul>
              </div>
            </div>
          </div>
          {clearLogs && (
            <button 
              onClick={clearLogs}
              className="w-full py-3 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-300 transition-colors"
            >
              Loglarni tozalash
            </button>
          )}
        </div>

        <div className="lg:col-span-3 bg-slate-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-slate-800">
          <div className="p-4 bg-slate-900/80 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-blue-500 animate-ping' : 'bg-slate-600'}`}></div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Live Monitoring Console</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Barcha xabarlar saqlangan</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[12px] scrollbar-thin scrollbar-thumb-slate-800">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center px-10">
                <p className="text-sm">Xabarlar oqimi bo'sh...</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`p-4 rounded-xl border transition-all animate-in fade-in duration-300 ${
                  log.status === 'THREAT' 
                  ? 'bg-red-900/10 border-red-500/30 text-red-100' 
                  : 'bg-white/5 border-white/10 text-slate-300'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-blue-400 font-bold">{log.source}</span>
                    <span className="text-[10px] opacity-30">{log.timestamp}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed mb-3 italic opacity-80">"{log.message}"</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${log.status === 'THREAT' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      {log.status === 'THREAT' ? '❗ Aniqlangan xavf' : '✅ Toza'}
                    </span>
                    {log.status === 'THREAT' && isSilentMode && (
                      <span className="text-[9px] text-amber-500 font-bold italic">[LOG ONLY]</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 bg-slate-900 border-t border-white/5 text-[9px] text-slate-500 flex justify-between px-6">
            <span>SafeGuard AI v1.5.0 - Persistence Enabled</span>
            <span className="flex items-center gap-2 text-blue-500 font-bold uppercase">
              Data Stored Locally
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramBot;
