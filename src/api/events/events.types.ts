// src/api/events/events.types.ts

export interface EventFilters {
  device_id?: string;
  type?: number | number[] | string;
  start_time?: number;
  end_time?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedEvents {
  events: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Live Monitoring Types
export interface LiveMonitoringFilters {
  device_id?: string;
  hhid?: string;
  date?: string; // YYYY-MM-DD format
  page?: number;
  limit?: number;
}

export interface LiveMonitoringItem {
  device_id: string;
  hhid: string;
  last_event_timestamp: number | null;
}

export interface PaginatedLiveMonitoring {
  data: LiveMonitoringItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Viewership Types
// Viewership Types
export interface ViewershipFilters {
  device_id?: string;
  hhid?: string;
  date?: string;       // single-day shortcut, kept for backward compatibility
  dateFrom?: string;   // YYYY-MM-DD
  dateTo?: string;     // YYYY-MM-DD
  region?: string;
  status?: "Yes" | "No";
  page?: number;
  limit?: number;
}

export interface ViewershipItem {
  device_id: string;
  hhid: string;
  viewership: "Yes" | "No";
  date: string;
}

export interface PaginatedViewership {
  data: ViewershipItem[];
  stats: {
    active: number;
    total: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Connectivity Report Types
export interface ConnectivityReportItem {
  device_id: string;
  hhid: string;
  connectivity: "Yes" | "No";
  date: string;
}

export interface PaginatedConnectivityReport {
  data: ConnectivityReportItem[];
  stats: {
    active: number;
    total: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Button Pressed Report Types
export interface ButtonPressedReportItem {
  device_id: string;
  hhid: string;
  button_pressed: "Yes" | "No";
  date: string;
}

export interface PaginatedButtonPressedReport {
  data: ButtonPressedReportItem[];
  stats: {
    active: number;
    total: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// All Household Visualization (Assigned meters -> household -> members -> latest type 3)
export interface HouseholdVisualizationFilters {
  device_id?: string;
  hhid?: string;
  page?: number;
  limit?: number;
}

export interface HouseholdVisualizationItem {
  device_id: string;
  hhid: string;
  household_id: string;
  total_members: number;
  last_type3_timestamp: number | null;
  last_type3_details: Record<string, any> | null;
  active_users: number;
}

export interface PaginatedHouseholdVisualization {
  data: HouseholdVisualizationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Weekly Connectivity Report ──────────────────────────────────────────────

export interface WeeklyConnectivityFilters {
  device_id?: string;
  hhid?: string;
  region?: string;
  week_start?: string;
  status?: "connected" | "disconnected" | "partial";
  page?: number;
  limit?: number;
}

export interface DayConnectivity {
  date: string;
  day: string;
  connected: boolean;
}

export interface WeeklyConnectivityItem {
  device_id: string;
  hhid: string;
  region: string;
  days: DayConnectivity[];
  connected_days: number;
  total_days: number;
  connectivity_rate: number;
}

export interface PaginatedWeeklyConnectivity {
  data: WeeklyConnectivityItem[];
  week_start: string;
  week_end: string;
  stats: {
    total_meters: number;
    fully_connected: number;
    partially_connected: number;
    not_connected: number;
    avg_connectivity_rate: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Weekly Button Pressed Report (Type 3 & 4 events) ────────────────────────

export interface WeeklyButtonPressedFilters {
  device_id?: string;
  hhid?: string;
  region?: string;
  week_start?: string;
  status?: "connected" | "disconnected" | "partial";
  page?: number;
  limit?: number;
}

export interface WeeklyButtonPressedItem {
  device_id: string;
  hhid: string;
  region: string;
  days: DayConnectivity[];
  connected_days: number;
  total_days: number;
  connectivity_rate: number;
}

export interface PaginatedWeeklyButtonPressed {
  data: WeeklyButtonPressedItem[];
  week_start: string;
  week_end: string;
  stats: {
    total_meters: number;
    fully_connected: number;
    partially_connected: number;
    not_connected: number;
    avg_connectivity_rate: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Weekly Viewership Report (Image Recognition & Audio Fingerprint) ────────
// Unlike connectivity/button-pressed, each day is a 3-state value: a device
// can be "Yes" (recognized/matched), "No" (event received but not matched),
// or "No Data" (no relevant event at all that day).

export type ViewershipMetric = "image" | "audio";

export interface WeeklyViewershipFilters {
  device_id?: string;
  hhid?: string;
  region?: string;
  week_start?: string; // YYYY-MM-DD (Monday of the desired week)
  metric?: ViewershipMetric; // defaults to "image"
  status?: "connected" | "disconnected" | "partial" | "no_data"; // no_data = audio only: all 7 days had no Type 42 event
  page?: number;
  limit?: number;
}

export interface DayViewership {
  date: string;
  day: string;
  status: "Yes" | "No" | "No Data";
}

export interface WeeklyViewershipItem {
  device_id: string;
  hhid: string;
  region: string;
  days: DayViewership[];
  matched_days: number;
  no_data_days: number;
  total_days: number;
  match_rate: number;
}

export interface PaginatedWeeklyViewership {
  data: WeeklyViewershipItem[];
  week_start: string;
  week_end: string;
  metric: ViewershipMetric;
  stats: {
    total_meters: number;
    fully_matched: number;
    partially_matched: number;
    not_matched: number;
    avg_match_rate: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}