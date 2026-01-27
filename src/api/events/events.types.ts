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
  page?: number;
  limit?: number;
}

export interface ViewershipItem {
  device_id: string;
  hhid: string;
  type2_count: number;
  type29_count: number;
  type42_count: number;
}

export interface PaginatedViewership {
  data: ViewershipItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
