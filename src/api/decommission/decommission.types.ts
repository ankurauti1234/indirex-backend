// src/api/decommission/decommission.types.ts
export interface DecommissionMeterDto {
  meterId: string;
  reason?: string;
}

export interface GetAssignedMetersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetDecommissionLogsQuery {
  page?: number;
  limit?: number;
  meterId?: string;
  hhid?: string;
}