import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Train, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  onSelectTrain: (trainNumber: string) => void;
  isLoading: boolean;
}

const FLAGSHIP_TRAINS = [
  { number: '12951', name: 'Mumbai Rajdhani Express', route: 'MMCT → NDLS', type: 'Rajdhani' },
  { number: '22436', name: 'Vande Bharat Express', route: 'NDLS → BSB', type: 'Vande Bharat' },
  { number: '12002', name: 'Bhopal Shatabdi Express', route: 'NDLS → RKMP', type: 'Shatabdi' },
  { number: '12259', name: 'Sealdah Duronto Express', route: 'SDAH → NDLS', type: 'Duronto' },
  { number: '12626', name: 'Kerala Superfast Express', route: 'NDLS → TVC', type: 'Express' },
  { number: '12301', name: 'Howrah Rajdhani Express', route: 'HWH → NDLS', type: 'Rajdhani' },
];

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectTrain, isLoading }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredTrains = FLAGSHIP_TRAINS.filter(
    (t) =>
      t.number.includes(query) ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.route.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSelectTrain(query.trim());
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 relative" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative flex items-center group">
        <div className="absolute left-4.5 text-cyan-400/90 pointer-events-none group-focus-within:text-cyan-300 transition">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search train by number or name (e.g., 12951, Rajdhani, Vande Bharat)..."
          className="w-full pl-12 pr-36 py-4 liquid-glass rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/15 text-sm font-semibold shadow-2xl transition-all duration-300"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 text-slate-950 font-extrabold text-xs hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center space-x-1.5"
        >
          {isLoading ? (
            <span>Searching...</span>
          ) : (
            <>
              <span>Track Train</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Auto-suggestions Dropdown */}
      {isOpen && query.trim() !== '' && (
        <div className="absolute left-0 right-0 top-full mt-2 liquid-glass rounded-2xl border border-cyan-500/30 shadow-2xl z-50 overflow-hidden backdrop-blur-2xl">
          <div className="p-2 border-b border-white/10 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3">
            Matching Flagship Trains
          </div>
          {filteredTrains.length > 0 ? (
            <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
              {filteredTrains.map((t) => (
                <button
                  key={t.number}
                  onClick={() => {
                    setQuery(t.number);
                    onSelectTrain(t.number);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-cyan-500/15 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold group-hover:border-cyan-400">
                      <Train className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white group-hover:text-cyan-300">
                        {t.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{t.route}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    {t.number}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 font-medium">
              Press Enter or click "Track Train" to search <span className="font-mono text-cyan-300 font-bold">"{query}"</span> directly.
            </div>
          )}
        </div>
      )}

      {/* Suggested Quick Select Pills */}
      <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center space-x-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest shrink-0 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Flagship Trains:</span>
        </div>
        {FLAGSHIP_TRAINS.map((t) => (
          <button
            key={t.number}
            onClick={() => {
              setQuery(t.number);
              onSelectTrain(t.number);
              setIsOpen(false);
            }}
            className="shrink-0 px-3.5 py-1.5 rounded-full liquid-pill hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 text-xs font-semibold transition-all duration-200 hover:scale-105"
          >
            <span className="font-mono text-cyan-400 font-extrabold mr-1.5">{t.number}</span>
            <span>{t.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

