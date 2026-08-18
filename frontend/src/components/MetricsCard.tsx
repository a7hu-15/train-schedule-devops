import { useState, useEffect } from 'react';

interface Stats {
  events_processed: number;
  platform_conflicts: number;
  recommendations: number;
  average_processing_time_ms: number;
}

export function MetricsCard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/v1/operations/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-widest border-b border-gray-100 pb-2">Pipeline Statistics</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Processed</p>
          <p className="text-xl font-mono text-black">{stats?.events_processed || 0}</p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Conflicts</p>
          <p className="text-xl font-mono text-black">{stats?.platform_conflicts || 0}</p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Recommendations</p>
          <p className="text-xl font-mono text-black">{stats?.recommendations || 0}</p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Avg Process</p>
          <p className="text-xl font-mono text-black">{stats?.average_processing_time_ms || 0} <span className="text-xs text-gray-400">ms</span></p>
        </div>
      </div>
    </div>
  );
}
