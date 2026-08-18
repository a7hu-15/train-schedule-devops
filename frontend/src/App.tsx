import { HealthCard } from './components/HealthCard';
import { MetricsCard } from './components/MetricsCard';
import { EventGenerator } from './components/EventGenerator';
import { RecentEvents } from './components/RecentEvents';
import { TraceViewer } from './components/TraceViewer';

export function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-black">
            RailPulse Cloud
          </h1>
          <p className="text-sm text-gray-500 mt-1">Operations Console</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <HealthCard />
          <MetricsCard />
          <EventGenerator />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TraceViewer />
          </div>
          <div className="lg:col-span-1 h-[400px]">
            <RecentEvents />
          </div>
        </div>

      </div>
    </div>
  );
}
