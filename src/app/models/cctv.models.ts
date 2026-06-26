export interface Camera {
  id: string;
  name: string;
  location?: string;
  status?: 'online' | 'offline' | 'maintenance';
}

export interface SearchCriteria {
  cameraName: string;
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
}

export interface ClipResult {
  id: string;
  cameraName: string;
  timestamp: string;
  duration: string;
  fileName: string;
  videoUrl: string;
}
