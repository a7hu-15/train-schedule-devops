import { useState } from 'react';

export function EventGenerator() {
  const [loading, setLoading] = useState<string | null>(null);

  const generateEvent = async (type: string) => {
    setLoading(type);
    try {
      const payload: any = {
        type: type,
        source: 'SIMULATOR',
      };
      
      if (type === 'TrainDelayed') {
        payload.payload = { train_number: '12951', station_code: 'NDLS', delay_minutes: 25 };
        payload.severity = 'WARNING';
      } else if (type === 'TrainArrived') {
        payload.payload = { train_number: '12952', station_code: 'NDLS', platform_assigned: '4' };
        payload.severity = 'INFO';
      } else if (type === 'ProviderUnavailable') {
        payload.payload = { provider: 'railradar', error: 'TIMEOUT' };
        payload.severity = 'CRITICAL';
      }

      await fetch('/api/v1/events/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([payload]),
      });
      
    } catch (err) {
      console.error(err);
    }
    setLoading(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-widest border-b border-gray-100 pb-2">Inject Events</h2>
      
      <div className="space-y-2">
        <button 
          onClick={() => generateEvent('TrainDelayed')}
          disabled={loading !== null}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-sm transition-colors disabled:opacity-50"
        >
          <span className="text-sm font-medium text-gray-800">Train Delayed</span>
          <span className="text-[10px] text-gray-500 font-mono">delay: 25m</span>
        </button>

        <button 
          onClick={() => generateEvent('TrainArrived')}
          disabled={loading !== null}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-sm transition-colors disabled:opacity-50"
        >
          <span className="text-sm font-medium text-gray-800">Train Arrived</span>
          <span className="text-[10px] text-gray-500 font-mono">pf: 4</span>
        </button>

        <button 
          onClick={() => generateEvent('ProviderUnavailable')}
          disabled={loading !== null}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-sm transition-colors disabled:opacity-50"
        >
          <span className="text-sm font-medium text-gray-800">Provider Down</span>
          <span className="text-[10px] text-gray-500 font-mono">err: timeout</span>
        </button>
      </div>
    </div>
  );
}
