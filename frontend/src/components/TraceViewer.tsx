import { useState } from 'react';

interface TraceEvent {
  event_id: string;
  type: string;
  severity: string;
  status: string;
  timestamp: string;
}

export function TraceViewer() {
  const [correlationId, setCorrelationId] = useState('');
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correlationId.trim()) return;
    
    setLoading(true);
    setError(null);
    setTrace([]);

    try {
      const res = await fetch(`/api/v1/events/${correlationId.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setTrace(data.trace || []);
      } else {
        setError('Trace not found.');
      }
    } catch (err) {
      setError('Error fetching trace.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-widest border-b border-gray-100 pb-2">Trace Lookup</h2>

      <form onSubmit={fetchTrace} className="flex gap-3 mb-6">
        <input
          type="text"
          value={correlationId}
          onChange={(e) => setCorrelationId(e.target.value)}
          placeholder="Enter Correlation ID..."
          className="flex-1 bg-white border border-gray-300 rounded-sm px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500"
        />
        <button
          type="submit"
          disabled={loading || !correlationId.trim()}
          className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-sm text-sm font-medium transition-colors disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {error && <p className="text-gray-500 text-xs mb-4">{error}</p>}
      
      {trace.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-6 overflow-x-auto">
          <div className="flex items-center space-x-2 text-sm">
            {trace.map((evt, idx) => (
              <div key={evt.event_id} className="flex items-center shrink-0">
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-sm p-3 min-w-[140px] shadow-sm">
                  <span className="font-semibold text-gray-900 mb-1">{evt.type}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                {idx < trace.length - 1 && (
                  <div className="mx-3 text-gray-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
