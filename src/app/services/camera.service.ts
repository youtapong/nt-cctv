import { Injectable } from '@angular/core';
import { Camera } from '../models/cctv.models';

@Injectable({ providedIn: 'root' })
export class CameraService {
  private readonly cameras: Camera[] = [
    { id: 'cam-001', name: 'cctv01', location: 'Main Gate', status: 'online' },
    { id: 'cam-002', name: 'cctv02', location: 'Warehouse A', status: 'online' },
    { id: 'cam-003', name: 'cctv03', location: 'Parking Area', status: 'maintenance' },
    { id: 'cam-004', name: 'cctv04', location: 'Office Lobby', status: 'online' }
  ];

  getCameras(): Camera[] {
    return [...this.cameras];
  }

  async fetchCameras(): Promise<Camera[]> {
    try {
      const response = await fetch('/videos/');
      if (!response.ok) {
        throw new Error(`Failed to fetch cameras: ${response.statusText}`);
      }
      const items = await response.json() as Array<{ name: string; type: string }>;
      
      // Filter out files, keep only directories
      const directories = items.filter(item => item.type === 'directory');
      
      if (directories.length === 0) {
        return this.getCameras();
      }

      return directories.map((dir, index) => {
        const cleanName = dir.name.replace(/\/$/, '');
        return {
          id: `cam-dyn-${index + 1}`,
          name: cleanName,
          location: `Camera at ${cleanName}`,
          status: 'online'
        };
      });
    } catch (error) {

      console.warn('Could not fetch cameras from server. Using fallback mock cameras.', error);
      return this.getCameras();
    }
  }
}

