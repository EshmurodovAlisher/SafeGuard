
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analyzer', label: 'Tahlilchi', icon: '🔍' },
    { id: 'telegram', label: 'Telegram Monitoring', icon: '🤖' },
    { id: 'vishing', label: 'Vishing (Jonli)', icon: '🎙️' },
    { id: 'blacklist', label: 'Qora Ro\'yxat', icon: '🚫' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar / Top Nav */}
      <nav className="w-full md:w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-500">🛡️</span> SafeGuard AI
          </h1>
          <p className="text-xs text-slate-400 mt-1">Firibgarlikdan himoya</p>
        </div>
        
        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 text-center text-[10px] text-slate-500 uppercase tracking-tighter">
          Bot Active: 7785149306 <br/>
          Powered by Gemini 2.5
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
