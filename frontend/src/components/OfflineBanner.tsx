import React from 'react';
import { WifiOff, Database } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  return (
    <div className="w-full bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between text-rose-200">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30">
          <WifiOff className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-300">Offline Mode — Local Device Snapshot</h4>
          <p className="text-xs text-rose-200/80 mt-0.5">
            Backend API is unreachable. Serving previously saved journey snapshot from browser localStorage.
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-1 text-xs font-mono font-bold text-rose-300 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30">
        <Database className="w-3.5 h-3.5" />
        <span>LOCALSTORAGE</span>
      </div>
    </div>
  );
};
