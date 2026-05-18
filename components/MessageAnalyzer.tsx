
import React, { useState } from 'react';
import { analyzeMessage } from '../services/geminiService';
import { AnalysisResult, RiskLevel, BlacklistItem } from '../types';

interface MessageAnalyzerProps {
  onAddThreat?: (item: Omit<BlacklistItem, 'id' | 'lastReported' | 'reportsCount'>) => void;
}

const MessageAnalyzer: React.FC<MessageAnalyzerProps> = ({ onAddThreat }) => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [addedToBlacklist, setAddedToBlacklist] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setAddedToBlacklist(false);
    
    try {
      const res = await analyzeMessage(inputText);
      setResult(res);

      if (res.isFraud && onAddThreat) {
        // Havolani matndan ajratib olish (yoki butun xabarni qiymat sifatida olish)
        const urlMatch = inputText.match(/https?:\/\/([^\s/]+)/i);
        const value = urlMatch ? urlMatch[1] : inputText.substring(0, 30).trim() + "...";
        const type = urlMatch ? 'URL' : 'TELEGRAM';

        onAddThreat({
          type: type as any,
          value: value,
          category: res.reasoning[0] || "Tahlilchi orqali aniqlangan"
        });
        setAddedToBlacklist(true);
      }
    } catch (error) {
      console.error("Tahlil xatosi:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.HIGH: return 'bg-red-50 border-red-200 text-red-700';
      case RiskLevel.MEDIUM: return 'bg-orange-50 border-orange-200 text-orange-700';
      default: return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    }
  };

  const containsUrl = (text: string) => {
    return /https?:\/\/[^\s]+/.test(text);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Havola va Matn Tahlilchisi</h2>
          <p className="text-slate-500 text-sm">To'lov havolalari, fake saytlar va phishing xabarlarni tekshiring</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
            AI: Gemini 2.5
          </span>
        </div>
      </header>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all focus-within:shadow-xl focus-within:border-blue-200">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Shubhali xabar yoki havolani shu yerga nusxalab joylang... (Masalan: 'Uzum yutuq: https://uzum-gift.uz')"
            className="w-full h-44 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-0 focus:border-transparent outline-none transition-all resize-none text-slate-700 font-medium placeholder:text-slate-400"
          />
          {containsUrl(inputText) && (
            <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-md font-bold animate-pulse shadow-lg">
              🔗 HAVOLA ANIQLANDI
            </div>
          )}
        </div>
        
        <div className="mt-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 italic">
            * Havolaning har bir harfiga e'tibor bering (masalan: payme.uz emas, payme.<b>cc</b> bo'lishi mumkin)
          </p>
          <button
            onClick={handleAnalyze}
            disabled={loading || !inputText.trim()}
            className="w-full md:w-auto px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                AI Tahlil qilmoqda...
              </>
            ) : (
              <>
                <span>🚀</span> Tekshirish
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className={`p-8 rounded-3xl border-2 ${getRiskColor(result.riskLevel)} animate-in fade-in zoom-in-95 duration-500 shadow-xl shadow-slate-200/50 relative overflow-hidden`}>
          {/* Background decoration */}
          <div className="absolute -right-10 -top-10 text-[120px] opacity-5 select-none pointer-events-none">
            {result.isFraud ? '🚫' : '🛡️'}
          </div>

          <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${result.isFraud ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {result.isFraud ? 'FIRIBGARLIK' : 'XAVFSIZ'}
                </span>
                <span className="text-slate-400 text-xs font-medium">Ishonch: {Math.round(result.confidence * 100)}%</span>
                
                {addedToBlacklist && (
                   <span className="px-3 py-1 bg-black text-white rounded-lg text-[9px] font-bold animate-bounce flex items-center gap-1">
                     ✅ QORA RO'YXATGA QO'SHILDI
                   </span>
                )}
              </div>
              <h3 className="text-2xl font-black mb-4">
                {result.isFraud ? 'Bu shubhali va xavfli havola!' : 'Xabar xavfsiz ko\'rinmoqda'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tahlil natijalari:</h4>
                  <ul className="space-y-2">
                    {result.reasoning.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-medium">
                        <span className="mt-1 text-xs">🔹</span> {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-current/10">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Xavfsizlik bo'yicha tavsiya:</h4>
                  <p className="text-sm italic font-bold">"{result.suggestedAction}"</p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-32 h-32 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm rounded-2xl border border-current/10 shadow-inner">
               <span className="text-[10px] font-bold opacity-60 uppercase mb-1">Xavf darajasi</span>
               <span className="text-2xl font-black">{result.riskLevel}</span>
               <div className={`w-12 h-1.5 rounded-full mt-3 ${
                 result.riskLevel === RiskLevel.HIGH ? 'bg-red-500' : 
                 result.riskLevel === RiskLevel.MEDIUM ? 'bg-orange-500' : 'bg-emerald-500'
               }`}></div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tip */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white flex items-center gap-5 border border-slate-800 shadow-2xl">
        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-2xl border border-blue-500/30">
          💡
        </div>
        <div>
          <h4 className="font-bold text-blue-400 text-sm">Bilishingiz muhim!</h4>
          <p className="text-xs text-slate-400 leading-relaxed mt-1">
            Haqiqiy banklar hech qachon SMS orqali kelgan kodni so'ramaydi va soxta havolalar orqali "yutuq" tarqatmaydi. 
            Shubhali havolalarni bosishdan oldin doimo SafeGuard AI orqali tekshiring.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageAnalyzer;
