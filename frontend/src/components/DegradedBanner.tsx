import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DegradedBannerProps {
  freshnessSeconds: number;
}

export const DegradedBanner: React.FC<DegradedBannerProps> = ({ freshnessSeconds }) => {
  return (
    <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between text-amber-200">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-300">Server Degraded Mode — Serving Redis Cache</h4>
          <p className="text-xs text-amber-200/80 mt-0.5">
            Live train data provider is currently experiencing higher latency. Showing last valid status from {Math.round(freshnessSeconds / 60)} minutes ago.
          </p>
        </div>
      </div>
      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 hidden sm:inline-block">
        STALE-WHILE-REVALIDATE
      </span>
    </div>
  );
};
