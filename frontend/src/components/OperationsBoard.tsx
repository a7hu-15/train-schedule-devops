import React, { useState, useEffect } from 'react';
import { Layers, AlertTriangle, CheckCircle2, ArrowRight, Clock, Sparkles, ShieldAlert } from 'lucide-react';

interface ResolutionOption {
  type: string;
  target_platform?: number;
  adjusted_time?: string;
  description: string;
}

interface ConflictAlert {
  station_code: string;
  platform_number: number;
  train_a_number: string;
  train_a_name: string;
  train_b_number: string;
  train_b_name: string;
  overlap_minutes: number;
  suggestions: ResolutionOption[];
}

interface PlatformOccupancy {
  platform_number: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CONFLICT';
  train_number?: string;
  train_name?: string;
  arrival_time?: string;
  departure_time?: string;
}

interface StationOperationsResponse {
  station_code: string;
  station_name: string;
  journey_date: string;
  platforms: PlatformOccupancy[];
  conflicts: ConflictAlert[];
}

const STATIONS = [
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'MMCT', name: 'Mumbai Central' },
  { code: 'RKMP', name: 'Rani Kamlapati (Bhopal)' },
  { code: 'BSB', name: 'Varanasi Junction' },
  { code: 'TVC', name: 'Thiruvananthapuram' },
];

export const OperationsBoard: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<string>('NDLS');
  const [opsData, setOpsData] = useState<StationOperationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appliedResolution, setAppliedResolution] = useState<string | null>(null);

  const fetchOperations = async (stationCode: string) => {
    setIsLoading(true);
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/v1/operations/stations/${stationCode}?journey_date=${todayStr}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StationOperationsResponse = await res.json();
      setOpsData(data);
    } catch (err) {
      console.warn("Failed to fetch operations API, using fallback...", err);
      setOpsData({
        station_code: stationCode,
        station_name: STATIONS.find(s => s.code === stationCode)?.name || stationCode,
        journey_date: todayStr,
        platforms: [
          { platform_number: 1, status: 'AVAILABLE' },
          { platform_number: 2, status: 'OCCUPIED', train_number: '12002', train_name: 'Bhopal Shatabdi', arrival_time: '10:28', departure_time: '10:40' },
          { platform_number: 3, status: 'CONFLICT', train_number: '12951', train_name: 'Mumbai Rajdhani', arrival_time: '10:20', departure_time: '10:35' },
          { platform_number: 4, status: 'AVAILABLE' },
          { platform_number: 5, status: 'OCCUPIED', train_number: '22436', train_name: 'Vande Bharat', arrival_time: '11:00', departure_time: '11:15' },
        ],
        conflicts: [
          {
            station_code: stationCode,
            platform_number: 3,
            train_a_number: '12951',
            train_a_name: 'Mumbai Rajdhani Express',
            train_b_number: '12002',
            train_b_name: 'Bhopal Shatabdi Express',
            overlap_minutes: 7,
            suggestions: [
              { type: 'REASSIGN_PLATFORM', target_platform: 4, description: 'Move Train 12002 (Bhopal Shatabdi) -> Platform 4' },
              { type: 'ADJUST_TIMING', adjusted_time: '10:36', description: 'Adjust Train 12002 arrival slot to 10:36' }
            ]
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations(selectedStation);
  }, [selectedStation]);

  const handleApplyResolution = (desc: string, platformNumber?: number) => {
    setAppliedResolution(desc);
    if (opsData && platformNumber) {
      const updatedPlatforms = opsData.platforms.map(p => {
        if (p.platform_number === platformNumber) {
          return {
            ...p,
            status: 'OCCUPIED' as const,
            train_number: '12002',
            train_name: 'Bhopal Shatabdi',
            arrival_time: '10:28',
            departure_time: '10:40'
          };
        }
        if (p.platform_number === 3) {
          return {
            ...p,
            status: 'OCCUPIED' as const
          };
        }
        return p;
      });
      setOpsData({
        ...opsData,
        platforms: updatedPlatforms,
        conflicts: []
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Simulation Disclaimer Banner */}
      <div className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3.5 flex items-center justify-between text-cyan-200 text-xs shadow-lg">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-extrabold tracking-wide uppercase">
            SIMULATION MODE — Educational / Portfolio Demonstration
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Platform allocation rules simulated for RailPulse network
        </span>
      </div>

      {/* Header & Station Selector */}
      <div className="liquid-glass rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span className="font-extrabold text-xl bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Operations & Scheduling Intelligence
            </span>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
              OPERATIONS CENTER
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Real-time platform occupancy, interval overlap conflict detection, and automated dispatch recommendations.
          </p>
        </div>

        {/* Station Select Dropdown */}
        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-bold text-slate-300">Select Station:</span>
          <select
            value={selectedStation}
            onChange={(e) => {
              setAppliedResolution(null);
              setSelectedStation(e.target.value);
            }}
            className="bg-slate-950/90 border border-white/15 rounded-2xl px-4 py-2 text-xs font-black text-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 shadow-lg"
          >
            {STATIONS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applied Resolution Alert */}
      {appliedResolution && (
        <div className="w-full bg-emerald-500/15 border border-emerald-400/30 rounded-2xl p-4 flex items-center justify-between text-emerald-200 shadow-lg shadow-emerald-500/10">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold">
              Applied Schedule Optimization: <strong>{appliedResolution}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setAppliedResolution(null);
              fetchOperations(selectedStation);
            }}
            className="text-[11px] font-bold underline text-emerald-400 hover:text-emerald-300"
          >
            Reset Board
          </button>
        </div>
      )}

      {/* Platform Occupancy Grid */}
      {opsData && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Platform Occupancy Board — {opsData.station_name} ({opsData.station_code})</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono font-bold">Date: {opsData.journey_date}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
            {opsData.platforms.map((p) => {
              const isAvailable = p.status === 'AVAILABLE';
              const isConflict = p.status === 'CONFLICT';
              
              return (
                <div
                  key={p.platform_number}
                  className={`rounded-2xl p-4 border flex flex-col justify-between transition-all duration-300 ${
                    isConflict
                      ? 'liquid-badge-amber border-amber-400/40 shadow-lg shadow-amber-500/20'
                      : isAvailable
                      ? 'liquid-badge-emerald border-emerald-400/30 shadow-md shadow-emerald-500/10'
                      : 'liquid-badge-rose border-rose-400/30 shadow-md shadow-rose-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-sm">Platform {p.platform_number}</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isConflict
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 animate-pulse'
                        : isAvailable
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                        : 'bg-rose-500/25 text-rose-300 border border-rose-400/40'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  {isAvailable ? (
                    <div className="text-xs text-emerald-400/90 font-semibold py-2">
                      Ready for arrival
                    </div>
                  ) : (
                    <div className="space-y-1 py-1">
                      <div className="font-mono text-xs font-black text-white">{p.train_number}</div>
                      <div className="text-[11px] font-semibold text-slate-200 truncate">{p.train_name}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {p.arrival_time} → {p.departure_time}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conflict Alerts & Automated Suggestions Section */}
      {opsData && opsData.conflicts.length > 0 && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-amber-500/40 bg-amber-500/5 space-y-4 shadow-xl shadow-amber-500/10">
          <div className="flex items-center space-x-2.5 text-amber-400 font-extrabold text-base">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
            <span>Active Scheduling Conflict Detected</span>
          </div>

          {opsData.conflicts.map((c, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-xl">
              <div>
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/40">
                    Platform {c.platform_number}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Overlap Duration: <strong className="text-amber-400 font-mono text-sm">{c.overlap_minutes} minutes</strong>
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-100 mt-2">
                  Conflict between <span className="font-mono text-cyan-300 font-extrabold">{c.train_a_number} ({c.train_a_name})</span> and{' '}
                  <span className="font-mono text-cyan-300 font-extrabold">{c.train_b_number} ({c.train_b_name})</span> on Platform {c.platform_number}.
                </p>
              </div>

              {/* Resolution Options */}
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">
                  Suggested Resolutions (Rule-Based Engine):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {c.suggestions.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleApplyResolution(opt.description, opt.target_platform)}
                      className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-interactive text-left border border-white/10 group shadow-md"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                          {opt.description}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
