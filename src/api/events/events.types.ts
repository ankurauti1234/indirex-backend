export interface EventFilters {
  device_id?: string;
  type?: string | number | number[];
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