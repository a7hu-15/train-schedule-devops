import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSelectTrain: (trainNumber: string) => void;
  isLoading: boolean;
}

const QUICK_TRAINS = [
  { number: '12951', name: 'Mumbai Rajdhani' },
  { number: '12002', name: 'Bhopal Shatabdi' },
  { number: '22436', name: 'Vande Bharat' },
  { number: '12626', name: 'Kerala Express' },
  { number: '12259', name: 'Sealdah Duronto' },
];

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectTrain, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSelectTrain(query.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8">
      <form onSubmit={handleSubmit} className="relative flex items-center group">
        <div className="absolute left-4 text-cyan-400/80 pointer-events-none group-focus-within:text-cyan-300 transition">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search train by number or name (e.g. 12951, Rajdhani)..."
          className="w-full pl-12 pr-32 py-4 liquid-glass rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/15 text-sm font-semibold shadow-2xl transition-all duration-300"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 text-slate-950 font-extrabold text-xs hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Track Train'}
        </button>
      </form>

      {/* Suggested Quick Select Pills */}
      <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center space-x-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest shrink-0 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Select:</span>
        </div>
        {QUICK_TRAINS.map((t) => (
          <button
            key={t.number}
            onClick={() => {
              setQuery(t.number);
              onSelectTrain(t.number);
            }}
            className="shrink-0 px-3.5 py-1.5 rounded-full liquid-pill hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 text-xs font-semibold transition-all duration-200 hover:scale-105"
          >
            <span className="font-mono text-cyan-400 font-extrabold mr-1.5">{t.number}</span>
            <span>{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
