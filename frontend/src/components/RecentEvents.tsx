import { useState, useEffect } from 'react';

interface Event {
  event_id: string;
  correlation_id: string;
  type: string;
  severity: string;
  status: string;
  timestamp: string;
}

export function RecentEvents() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/v1/events');
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-gray-100 shrink-0">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Recent Events</h2>
      </div>
      
      <div className="p-0 overflow-y-auto flex-1 min-h-0">
        {events.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No events found.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {events.map((evt) => (
              <li key={evt.event_id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{evt.type}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-gray-200 uppercase tracking-wider text-gray-600">
                    {evt.severity}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400 font-mono" title={evt.correlation_id}>
                    {evt.correlation_id.substring(0, 8)}...
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
