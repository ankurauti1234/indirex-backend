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
export interface ViewershipFilters {
  device_id?: string;
  hhid?: string;
  date?: string; // YYYY-MM-DD format
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
