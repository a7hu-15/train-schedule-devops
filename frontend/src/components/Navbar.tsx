import React from 'react';
import { Train, Star, RefreshCw, Layers } from 'lucide-react';

interface NavbarProps {
  activeMode: 'PASSENGER' | 'OPERATIONS';
  onModeToggle: (mode: 'PASSENGER' | 'OPERATIONS') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  favoritesCount: number;
  onToggleFavorites: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeMode,
  onModeToggle,
  onRefresh, 
  isRefreshing, 
  favoritesCount,
  onToggleFavorites 
}) => {
  return (
    <header className="sticky top-0 z-50 w-full liquid-glass border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center space-x-3.5 cursor-pointer group" 
          onClick={() => window.location.reload()}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/25 transition group-hover:scale-105">
            <div className="w-full h-full bg-slate-950/80 backdrop-blur-xl rounded-[15px] flex items-center justify-center">
              <Train className="w-5 h-5 text-cyan-300 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                RailPulse
              </span>
              <span className="text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm">
                INDIA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Cloud-Native Train Journey & Operations Platform</p>
          </div>
        </div>

        {/* Segue Control Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-inner">
          <button
            onClick={() => onModeToggle('PASSENGER')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 ${
              activeMode === 'PASSENGER'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/30 scale-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Passenger Tracker
          </button>
          <button
            onClick={() => onModeToggle('OPERATIONS')}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center space-x-1.5 ${
              activeMode === 'OPERATIONS'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/30 scale-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Operations Center</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onToggleFavorites}
            className="liquid-pill px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 text-slate-200 text-xs font-semibold"
          >
            <Star className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Favorites</span>
            {favoritesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-amber-400/20 text-amber-300 rounded-full font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="liquid-pill px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 text-cyan-300 text-xs font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>

      </div>
    </header>
  );
};
