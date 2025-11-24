// src/api/events/event-mapping.types.ts
export interface EventMappingDTO {
  id?: number;
  type: number;
  name: string;
  description?: string;
  is_alert: boolean;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

export interface CreateEventMappingDTO
  extends Omit<EventMappingDTO, "id"> {}

export interface UpdateEventMappingDTO
  extends Partial<CreateEventMappingDTO> {}