import React from 'react';
import { TrainStop } from '../types';
import { CheckCircle2, Train, MapPin, Circle } from 'lucide-react';

interface JourneyTimelineProps {
  stops: TrainStop[];
  currentStationCode: string;
  nextStationCode: string;
  progress: number;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  stops,
  currentStationCode,
  nextStationCode,
  progress,
}) => {
  const currentStopIndex = stops.findIndex((s) => s.station_code === currentStationCode);
  const activeIndex = currentStopIndex !== -1 ? currentStopIndex : 0;

  return (
    <div className="w-full liquid-glass rounded-3xl p-6 sm:p-8">
      
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2.5">
            <Train className="w-5 h-5 text-cyan-400" />
            <span>Route & Station Timeline</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Scheduled sequence across total {stops[stops.length - 1]?.distance_km || 0} km</p>
        </div>
        <span className="text-xs font-mono text-cyan-300 font-bold px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 shadow-sm">
          {stops.length} Stations
        </span>
      </div>

      {/* Station List Timeline */}
      <div className="relative pl-6 space-y-7">
        
        {/* Continuous Route Backline */}
        <div className="absolute left-9 top-4 bottom-4 w-1 bg-slate-800/80 rounded-full" />

        {stops.map((stop, idx) => {
          const isPassed = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isNext = stop.station_code === nextStationCode;

          return (
            <div key={stop.station_code} className="relative flex items-center justify-between group">
              
              {/* Timeline Indicator Node */}
              <div className="absolute -left-6 flex items-center justify-center">
                {isPassed ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-9 h-9 rounded-full bg-cyan-500/25 border-2 border-cyan-400 flex items-center justify-center live-beacon z-10 shadow-xl shadow-cyan-500/40">
                    <Train className="w-4.5 h-4.5 text-cyan-300 stroke-[2.5]" />
                  </div>
                ) : isNext ? (
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shadow-md shadow-amber-500/20">
                    <MapPin className="w-4 h-4 text-amber-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-950/80 border border-slate-700/80 flex items-center justify-center">
                    <Circle className="w-2.5 h-2.5 text-slate-500" />
                  </div>
                )}
              </div>

              {/* Station Info Row */}
              <div className="pl-7 flex-1 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl transition duration-200 hover:bg-white/5 border border-transparent hover:border-white/10">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-black text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-white/10 shadow-sm">
                      {stop.station_code}
                    </span>
                    <span className={`font-bold text-base ${
                      isCurrent ? 'text-cyan-300 font-black' : isPassed ? 'text-slate-400' : 'text-slate-100'
                    }`}>
                      {stop.station_name}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        LIVE POSITION
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-mono mt-1 block">
                    {stop.distance_km} km • Stop {stop.sequence}
                  </span>
                </div>

                {/* Arrival / Departure Times */}
                <div className="text-right font-mono text-xs">
                  <div className="text-slate-200 font-semibold">
                    Arr: <span className="text-white font-bold">{stop.scheduled_arrival}</span>
                  </div>
                  <div className="text-slate-400 font-medium">
                    Dep: <span>{stop.scheduled_departure}</span>
                  </div>
                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
};
