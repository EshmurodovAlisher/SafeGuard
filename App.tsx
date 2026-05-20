
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MessageAnalyzer from './components/MessageAnalyzer';
import VishingDetector from './components/VishingDetector';
import Blacklist from './components/Blacklist';
import TelegramBot from './components/TelegramBot';
import { BlacklistItem, BotLogEntry, AnalysisResult } from './types';
import { MOCK_BLACKLIST } from './constants';
import { analyzeMessage } from './services/geminiService';

const BOT_TOKEN = (import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string) || "8830437639:AAHZxi1rIKwMlJRSCaHqvrvtKL2B_8GH9_c";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const App: React.FC = () => {
  // --- Persistent Tab State ---
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('safeguard_active_tab') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('safeguard_active_tab', activeTab);
  }, [activeTab]);
  
  // --- Blacklist State ---
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>(() => {
    const saved = localStorage.getItem('safeguard_blacklist');
    return saved ? JSON.parse(saved) : MOCK_BLACKLIST;
  });

  useEffect(() => {
    localStorage.setItem('safeguard_blacklist', JSON.stringify(blacklist));
  }, [blacklist]);

  const addToBlacklist = (item: Omit<BlacklistItem, 'id' | 'lastReported' | 'reportsCount'>) => {
    const existingIndex = blacklist.findIndex(i => i.value.toLowerCase() === item.value.toLowerCase());
    if (existingIndex !== -1) {
      const newList = [...blacklist];
      newList[existingIndex] = {
        ...newList[existingIndex],
        reportsCount: newList[existingIndex].reportsCount + 1,
        lastReported: new Date().toISOString().split('T')[0]
      };
      setBlacklist(newList);
    } else {
      const newItem: BlacklistItem = {
        id: Date.now().toString(),
        ...item,
        reportsCount: 1,
        lastReported: new Date().toISOString().split('T')[0]
      };
      setBlacklist([newItem, ...blacklist]);
    }
  };

  // --- Telegram Bot Background Logic ---
  const [botLogs, setBotLogs] = useState<BotLogEntry[]>(() => {
    const savedLogs = localStorage.getItem('safeguard_bot_logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });

  const [isScanning, setIsScanning] = useState(() => {
    return JSON.parse(localStorage.getItem('safeguard_is_scanning') || 'true');
  });

  const [isSilentMode, setIsSilentMode] = useState(() => {
    return JSON.parse(localStorage.getItem('safeguard_is_silent') || 'false');
  });

  const [offset, setOffset] = useState<number>(() => {
    return JSON.parse(localStorage.getItem('safeguard_bot_offset') || '0');
  });

  const [botInfo, setBotInfo] = useState({ username: 'Yuklanmoqda...', name: 'Bot...' });
  const [lastPollTime, setLastPollTime] = useState<string>('');
  
  const processedKeys = useRef<Set<string>>(new Set());
  const pollingRef = useRef<number | null>(null);
  const isPollingBusy = useRef(false);

  // Initialize processedKeys from logs on load
  useEffect(() => {
    botLogs.forEach(log => processedKeys.current.add(log.id));
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('safeguard_bot_logs', JSON.stringify(botLogs));
  }, [botLogs]);

  useEffect(() => {
    localStorage.setItem('safeguard_is_scanning', JSON.stringify(isScanning));
  }, [isScanning]);

  useEffect(() => {
    localStorage.setItem('safeguard_is_silent', JSON.stringify(isSilentMode));
  }, [isSilentMode]);

  useEffect(() => {
    localStorage.setItem('safeguard_bot_offset', JSON.stringify(offset));
  }, [offset]);

  useEffect(() => {
    fetch(`${TELEGRAM_API}/getMe`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setBotInfo({ username: `@${data.result.username}`, name: data.result.first_name });
        }
      })
      .catch(() => setBotInfo({ username: '@bot_error', name: 'Bot Token O\'chirilgan' }));
  }, []);

  const sendWarning = async (chatId: number, analysis: AnalysisResult, replyToId: number) => {
    if (isSilentMode) return;

    const warningText = `⚠️ *SafeGuard AI Tahlili*\n\n` +
      `🛡️ *Xavf darajasi:* ${analysis.riskLevel}\n` +
      `🔍 *Sabab:* ${analysis.reasoning[0]}\n\n` +
      `_Ushbu ma'lumot qora ro'yxatga kiritildi._`;
    
    try {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: warningText,
          parse_mode: 'Markdown',
          reply_to_message_id: replyToId
        })
      });
    } catch (e) { console.error("Warning error", e); }
  };

  const pollUpdates = async () => {
    if (isPollingBusy.current) return;
    isPollingBusy.current = true;

    try {
      const allowedUpdates = JSON.stringify(["message", "edited_message", "channel_post"]);
      const url = `${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=15&allowed_updates=${encodeURIComponent(allowedUpdates)}`;
      const response = await fetch(url);
      const data = await response.json();

      setLastPollTime(new Date().toLocaleTimeString());

      if (data.ok && data.result.length > 0) {
        let newOffset = offset;
        for (const update of data.result) {
          newOffset = Math.max(newOffset, update.update_id + 1);
          const msg = update.message || update.edited_message || update.channel_post;
          if (!msg) continue;

          const chatId = msg.chat.id;
          const messageId = msg.message_id;
          const messageContent = msg.text || msg.caption || "";
          const messageKey = `${chatId}_${messageId}`;

          if (processedKeys.current.has(messageKey)) continue;
          processedKeys.current.add(messageKey);

          if (messageContent.trim().length > 0) {
            const chatTitle = msg.chat.title || msg.chat.username || msg.chat.first_name || "Guruh";
            const senderUsername = msg.from?.username ? `@${msg.from.username}` : "";
            const senderName = msg.from?.first_name || "Noma'lum";
            const senderDisplay = senderUsername || senderName;
            
            const analysis = await analyzeMessage(messageContent);
            const newEntry: BotLogEntry = {
              id: messageKey,
              source: `${chatTitle} | ${senderDisplay}`,
              message: messageContent,
              timestamp: new Date().toLocaleTimeString(),
              status: analysis.isFraud ? 'THREAT' : 'SAFE',
              details: analysis
            };

            setBotLogs(prev => [newEntry, ...prev].slice(0, 100));

            if (analysis.isFraud) {
              await sendWarning(chatId, analysis, messageId);
              
              let type: 'PHONE' | 'URL' | 'TELEGRAM' = 'TELEGRAM';
              let value = senderDisplay;
              
              // Extract URL or use sender name
              const urlMatch = messageContent.match(/https?:\/\/([^\s/]+)/i);
              if (urlMatch) {
                type = 'URL';
                value = urlMatch[1];
              } else if (senderUsername) {
                type = 'TELEGRAM';
                value = senderUsername;
              } else {
                type = 'TELEGRAM';
                value = `${senderName} (ID: ${msg.from?.id || '?'})`;
              }

              addToBlacklist({
                type,
                value,
                category: analysis.reasoning[0] || "Aniqlangan firibgarlik"
              });
            }
          }
        }
        setOffset(newOffset);
      }
    } catch (error) {
      console.error("Polling error:", error);
    } finally {
      isPollingBusy.current = false;
    }
  };

  useEffect(() => {
    if (isScanning) {
      pollUpdates();
      pollingRef.current = window.setInterval(pollUpdates, 5000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [isScanning, offset]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'analyzer': return <MessageAnalyzer onAddThreat={addToBlacklist} />;
      case 'telegram': 
        return (
          <TelegramBot 
            logs={botLogs} 
            isScanning={isScanning} 
            setIsScanning={setIsScanning}
            isSilentMode={isSilentMode}
            setIsSilentMode={setIsSilentMode}
            botInfo={botInfo}
            lastPollTime={lastPollTime}
            clearLogs={() => setBotLogs([])}
          />
        );
      case 'vishing': return <VishingDetector />;
      case 'blacklist': return <Blacklist blacklist={blacklist} onAdd={addToBlacklist} />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="animate-in fade-in duration-700">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
