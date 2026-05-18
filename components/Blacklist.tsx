
import React, { useState } from 'react';
import { BlacklistItem } from '../types';

interface BlacklistProps {
  blacklist: BlacklistItem[];
  onAdd: (item: Omit<BlacklistItem, 'id' | 'lastReported' | 'reportsCount'>) => void;
}

const Blacklist: React.FC<BlacklistProps> = ({ blacklist, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredList = blacklist.filter(item => 
    item.value.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Qora Ro'yxat</h2>
          <p className="text-slate-500 text-sm">Real vaqtda yangilanuvchi firibgarlar bazasi</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
             Jami: {blacklist.length}
           </span>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Raqam, URL yoki Telegram profilni izlang..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tur</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ma'lumot</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Kategoriya</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Shikoyatlar</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Oxirgi faollik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors animate-in fade-in duration-300">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      item.type === 'PHONE' ? 'bg-green-100 text-green-700' :
                      item.type === 'URL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.value}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">{item.category}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                      {item.reportsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{item.lastReported}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredList.length === 0 && (
            <div className="p-10 text-center text-slate-400 italic">
              Ma'lumot topilmadi
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
        <div className="space-y-2">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-500">⚡</span> Avtomatik Sinxronizatsiya
          </h3>
          <p className="text-slate-400 text-sm max-w-lg">
            Telegram monitoring boti orqali aniqlangan barcha firibgarlar real vaqt rejimida ushbu ro'yxatga qo'shilib boriladi.
          </p>
        </div>
        <div className="flex gap-4">
           <div className="text-center">
             <div className="text-2xl font-bold text-blue-500">{blacklist.length}</div>
             <div className="text-[10px] text-slate-500 uppercase">Bazadagi jami</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Blacklist;
