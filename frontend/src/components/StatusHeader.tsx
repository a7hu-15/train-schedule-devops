import React, { useState, useEffect } from 'react';
import { JourneyStatus } from '../types';
import { Clock, MapPin, AlertTriangle, Star, Activity } from 'lucide-react';

interface StatusHeaderProps {
  status: JourneyStatus;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onSimulateOutageToggle: () => void;
  isSimulatingOutage: boolean;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  status,
  isFavorite,
  onToggleFavorite,
  onSimulateOutageToggle,
  isSimulatingOutage
}) => {
  const [secondsAgo, setSecondsAgo] = useState<number>(status.freshness_seconds || 0);

  useEffect(() => {
    setSecondsAgo(status.freshness_seconds || 0);
    const interval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status.source_updated_at, status.freshness_seconds]);

  const isDelay = status.delay_minutes > 0;
  const next = status.next_station;

  return (
    <div className="w-full liquid-glass rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden">
      
      {/* Liquid Mesh Backlight Orbs */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Top Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="font-mono text-2xl font-black px-4 py-1.5 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-lg shadow-cyan-500/10">
              {status.train_number}
            </span>
            <button
              onClick={onToggleFavorite}
              className="p-2.5 rounded-2xl liquid-pill hover:border-amber-400/60 text-slate-400 hover:text-amber-400 transition"
              title="Bookmark favorite train"
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
            </button>
            
            {/* Liquid Status Badge */}
            <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center space-x-1.5 ${
              status.source === 'SIMULATED' 
                ? 'liquid-badge-emerald' 
                : 'liquid-badge-amber'
            }`}>
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{status.source}</span>
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Journey Intelligence
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Operating Date: <span className="font-mono text-cyan-300 font-bold">{status.journey_date}</span>
          </p>
        </div>

        {/* Live Freshness & Outage Control */}
        <div className="flex flex-col items-end space-y-2.5 relative z-10">
          <div className="flex items-center space-x-2 bg-slate-950/80 border border-white/10 px-4 py-2 rounded-full shadow-lg backdrop-blur-xl">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span className="text-xs font-bold text-slate-300">
              Updated <span className="font-mono text-cyan-300 font-black">{secondsAgo}s</span> ago
            </span>
          </div>

          <button
            onClick={onSimulateOutageToggle}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all duration-300 ${
              isSimulatingOutage 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/20' 
                : 'liquid-pill text-slate-400 hover:text-slate-200'
            }`}
          >
            {isSimulatingOutage ? '⚠️ Outage Test Active' : 'Simulate Upstream Outage'}
          </button>
        </div>
      </div>

      {/* Grid Status Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        
        {/* Next Station Box */}
        <div className="liquid-glass-interactive rounded-2xl p-5 flex items-center space-x-4 border border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
            <MapPin className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">Next Station</span>
            <span className="text-lg font-bold text-white block">{next.name}</span>
            <span className="font-mono text-xs text-cyan-300 font-semibold">{next.code} • {next.distance_km} km remaining</span>
          </div>
        </div>

        {/* ETA Box */}
        <div className="liquid-glass-interactive rounded-2xl p-5 flex items-center space-x-4 border border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
            <Clock className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">Estimated Arrival</span>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-black text-emerald-300">{next.estimated_arrival}</span>
              <span className="font-mono text-xs text-slate-500 line-through">Sched: {next.scheduled_arrival}</span>
            </div>
          </div>
        </div>

        {/* Delay Status Box */}
        <div className="liquid-glass-interactive rounded-2xl p-5 flex items-center space-x-4 border border-white/10">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            isDelay ? 'bg-amber-500/15 border-amber-400/30 text-amber-300 shadow-lg shadow-amber-500/10' : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 shadow-lg shadow-emerald-500/10'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">Live Delay</span>
            <span className={`text-lg font-black block ${isDelay ? 'text-amber-300' : 'text-emerald-300'}`}>
              {isDelay ? `${status.delay_minutes} min late` : 'On Time'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Normal operational window</span>
          </div>
        </div>

      </div>

    </div>
  );
};
