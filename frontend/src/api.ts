import { TrainSummary, JourneyStatus } from './types';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api/v1';

export async function searchTrains(query: string): Promise<TrainSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/trains?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Search trains API error:", err);
    // Return sample local trains if API is completely offline
    const sampleTrains: TrainSummary[] = [
      { train_number: "12951", name: "Mumbai Rajdhani Express", source_station_code: "MMCT", destination_station_code: "NDLS", runs_on: "DAILY" },
      { train_number: "12002", name: "Bhopal Shatabdi Express", source_station_code: "NDLS", destination_station_code: "RKMP", runs_on: "DAILY" },
      { train_number: "22436", name: "Vande Bharat Express", source_station_code: "NDLS", destination_station_code: "BSB", runs_on: "EXCEPT THU" },
      { train_number: "12626", name: "Kerala Express", source_station_code: "NDLS", destination_station_code: "TVC", runs_on: "DAILY" },
      { train_number: "12259", name: "Sealdah Duronto Express", source_station_code: "SDAH", destination_station_code: "NDLS", runs_on: "SUN,MON,WED,THU" },
    ];
    return sampleTrains.filter(t => t.train_number.includes(query) || t.name.toLowerCase().includes(query.toLowerCase()));
  }
}

export async function getJourneyStatus(
  trainNumber: string, 
  dateStr: string,
  simulateFailure: boolean = false
): Promise<JourneyStatus> {
  const url = `${API_BASE}/journeys/${trainNumber}/${dateStr}/status${simulateFailure ? '?simulate_failure=true' : ''}`;
  const localStorageKey = `railpulse_journey_${trainNumber}_${dateStr}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: JourneyStatus = await res.json();
    
    // Save to localStorage for offline fallback
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(data));
    } catch (e) {
      // Ignore quota errors
    }
    
    return data;
  } catch (err) {
    console.warn("Failed to fetch journey status from API. Checking localStorage fallback...", err);
    const cachedLocal = localStorage.getItem(localStorageKey);
    if (cachedLocal) {
      const parsed: JourneyStatus = JSON.parse(cachedLocal);
      parsed.source = 'OFFLINE_LOCAL';
      parsed.degraded = true;
      return parsed;
    }
    throw err;
  }
}
