import { useState, useEffect } from 'react';

export function HealthCard() {
  const [status, setStatus] = useState<'LOADING' | 'HEALTHY' | 'DEGRADED' | 'DOWN'>('LOADING');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/health/live');
        if (res.ok) {
          setStatus('HEALTHY');
        } else {
          setStatus('DEGRADED');
        }
      } catch (err) {
        setStatus('DOWN');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-widest border-b border-gray-100 pb-2">System Health</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">API</span>
          <span className="text-xs font-mono font-medium">
            {status === 'LOADING' ? '...' : (status === 'DOWN' ? 'DOWN' : 'OK')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">PostgreSQL</span>
          <span className="text-xs font-mono font-medium">
            {status === 'LOADING' ? '...' : (status === 'DOWN' ? 'DOWN' : 'OK')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Redis</span>
          <span className="text-xs font-mono font-medium">
            {status === 'LOADING' ? '...' : (status === 'DOWN' ? 'DOWN' : 'OK')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Prometheus</span>
          <span className="text-xs font-mono font-medium text-gray-400">
            MOCKED
          </span>
        </div>
      </div>
    </div>
  );
}
