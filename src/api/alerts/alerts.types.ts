// src/api/alerts/alerts.types.ts

export interface InactivityAlertResponse {
    id: number;
    device_id: string;
    hhid: string | null;
    lastEventAt: string | null;
    detectedAt: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface InactivityListQuery {
    page?: string;
    limit?: string;
    device_id?: string;
  }
  
  export interface AddRecipientBody {
    email: string;
    name?: string;
  }
  
  export interface UpdateSettingsBody {
    inactivityThresholdHours?: number;
    emailFrequencyHours?: number;
  }
  