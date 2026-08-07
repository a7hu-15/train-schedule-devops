export interface TrainSummary {
  train_number: string;
  name: string;
  source_station_code: string;
  destination_station_code: string;
  runs_on: string;
}

export interface TrainStop {
  station_code: string;
  station_name: string;
  sequence: number;
  scheduled_arrival: string;
  scheduled_departure: string;
  distance_km: number;
  day_offset: number;
}

export interface NextStationInfo {
  code: string;
  name: string;
  scheduled_arrival: string;
  estimated_arrival: string;
  delay_minutes: number;
  distance_km: number;
}

export interface JourneyStatus {
  train_number: string;
  journey_date: string;
  state: 'RUNNING' | 'COMPLETED' | 'SCHEDULED';
  source: 'SIMULATED' | 'CACHED' | 'OFFLINE_LOCAL';
  source_updated_at: string;
  freshness_seconds: number;
  degraded: boolean;
  current_station_code: string;
  next_station: NextStationInfo;
  progress: number;
  delay_minutes: number;
  stops: TrainStop[];
  request_id?: string;
}
