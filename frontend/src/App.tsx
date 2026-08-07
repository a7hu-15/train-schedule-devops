import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { StatusHeader } from './components/StatusHeader';
import { JourneyTimeline } from './components/JourneyTimeline';
import { DegradedBanner } from './components/DegradedBanner';
import { OfflineBanner } from './components/OfflineBanner';
import { FavoritesBar } from './components/FavoritesBar';
import { OperationsBoard } from './components/OperationsBoard';
import { JourneyStatus } from './types';
import { getJourneyStatus } from './api';

export const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'PASSENGER' | 'OPERATIONS'>('PASSENGER');
  const [selectedTrain, setSelectedTrain] = useState<string>('12951');
  const [status, setStatus] = useState<JourneyStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('railpulse_favorites');
      return saved ? JSON.parse(saved) : ['12951', '22436'];
    } catch {
      return ['12951', '22436'];
    }
  });
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  
  // Outage simulation state
  const [simulateOutage, setSimulateOutage] = useState<boolean>(false);

  const fetchStatus = async (trainNum: string, outage: boolean = false) => {
    setIsLoading(true);
    setError(null);
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const data = await getJourneyStatus(trainNum, todayStr, outage);
      setStatus(data);
    } catch (err: any) {
      console.error("Fetch journey error:", err);
      setError(err.message || 'Failed to load journey data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'PASSENGER') {
      fetchStatus(selectedTrain, simulateOutage);
    }
  }, [selectedTrain, simulateOutage, activeMode]);

  const toggleFavorite = (trainNum: string) => {
    const updated = favorites.includes(trainNum)
      ? favorites.filter((f) => f !== trainNum)
      : [...favorites, trainNum];
    setFavorites(updated);
    localStorage.setItem('railpulse_favorites', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Navigation Header */}
      <Navbar
        activeMode={activeMode}
        onModeToggle={setActiveMode}
        onRefresh={() => fetchStatus(selectedTrain, simulateOutage)}
        isRefreshing={isLoading}
        favoritesCount={favorites.length}
        onToggleFavorites={() => setShowFavorites(!showFavorites)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        
        {/* Favorites Bar Drawer */}
        {showFavorites && (
          <FavoritesBar
            favorites={favorites}
            onSelectFavorite={(num) => {
              setSelectedTrain(num);
              setActiveMode('PASSENGER');
              setShowFavorites(false);
            }}
            onRemoveFavorite={toggleFavorite}
            onClose={() => setShowFavorites(false)}
          />
        )}

        {/* PASSENGER TRACKER MODE */}
        {activeMode === 'PASSENGER' && (
          <>
            <SearchBar onSelectTrain={(num) => setSelectedTrain(num)} isLoading={isLoading} />

            {error && (
              <div className="w-full bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 mb-6 text-center text-rose-300 text-sm font-semibold">
                ⚠️ {error}
              </div>
            )}

            {status && (
              <>
                {status.source === 'OFFLINE_LOCAL' ? (
                  <OfflineBanner />
                ) : status.degraded ? (
                  <DegradedBanner freshnessSeconds={status.freshness_seconds} />
                ) : null}

                <StatusHeader
                  status={status}
                  isFavorite={favorites.includes(status.train_number)}
                  onToggleFavorite={() => toggleFavorite(status.train_number)}
                  onSimulateOutageToggle={() => setSimulateOutage(!simulateOutage)}
                  isSimulatingOutage={simulateOutage}
                />

                {status.stops && status.stops.length > 0 && (
                  <JourneyTimeline
                    stops={status.stops}
                    currentStationCode={status.current_station_code}
                    nextStationCode={status.next_station?.code}
                    progress={status.progress}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* OPERATIONS CENTER MODE */}
        {activeMode === 'OPERATIONS' && (
          <OperationsBoard />
        )}

      </main>

      {/* Footer / Stack Specs */}
      <footer className="w-full glass-panel border-t border-slate-800/80 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-bold text-slate-200">RailPulse India</span> — Intelligent Train Tracking & Scheduling Platform
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">React + Vite</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">FastAPI</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-blue-400">PostgreSQL</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-rose-400">Redis</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">Docker</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-400">Kubernetes</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-400">Terraform</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
