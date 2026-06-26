import { Injectable } from '@angular/core';
import { ClipResult, SearchCriteria } from '../models/cctv.models';

@Injectable({ providedIn: 'root' })
export class ClipSearchService {
  private readonly clips: ClipResult[] = [
    {
      id: 'clip-001',
      cameraName: 'cctv01',
      timestamp: '2026-06-25T09:30:00+07:00',
      duration: '05:00',
      fileName: 'cctv01_2026-06-25_09-30.mp4',
      videoUrl: '/mock-clips/cctv01_2026-06-25_09-30.mp4'
    },
    {
      id: 'clip-002',
      cameraName: 'cctv01',
      timestamp: '2026-06-25T10:00:00+07:00',
      duration: '05:00',
      fileName: 'cctv01_2026-06-25_10-00.mp4',
      videoUrl: '/mock-clips/cctv01_2026-06-25_10-00.mp4'
    },
    {
      id: 'clip-003',
      cameraName: 'cctv01',
      timestamp: '2026-06-25T10:15:00+07:00',
      duration: '05:00',
      fileName: 'cctv01_2026-06-25_10-15.mp4',
      videoUrl: '/mock-clips/cctv01_2026-06-25_10-15.mp4'
    },
    {
      id: 'clip-004',
      cameraName: 'cctv02',
      timestamp: '2026-06-25T11:00:00+07:00',
      duration: '10:00',
      fileName: 'cctv02_2026-06-25_11-00.mp4',
      videoUrl: '/mock-clips/cctv02_2026-06-25_11-00.mp4'
    },
    {
      id: 'clip-005',
      cameraName: 'cctv03',
      timestamp: '2026-06-24T16:45:00+07:00',
      duration: '08:00',
      fileName: 'cctv03_2026-06-24_16-45.mp4',
      videoUrl: '/mock-clips/cctv03_2026-06-24_16-45.mp4'
    },
    {
      id: 'clip-006',
      cameraName: 'cctv04',
      timestamp: '2026-05-18T08:00:00+07:00',
      duration: '12:00',
      fileName: 'cctv04_2026-05-18_08-00.mp4',
      videoUrl: '/mock-clips/cctv04_2026-05-18_08-00.mp4'
    }
  ];

  async search(criteria: SearchCriteria): Promise<ClipResult[]> {
    try {
      const response = await fetch(`/videos/${criteria.cameraName}/`);
      if (!response.ok) {
        throw new Error(`Failed to fetch clips: ${response.statusText}`);
      }
      const items = await response.json() as Array<{ name: string; type: string }>;

      // Nginx autoindex may list files with no directory prefix
      const videoFiles = items.filter(item => item.type === 'file' && item.name.endsWith('.mp4'));
      const results: ClipResult[] = [];
      const regex = /^([a-zA-Z0-9_-]+)_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})\.mp4$/;

      for (const file of videoFiles) {
        const match = file.name.match(regex);
        if (!match) continue;

        const [, fileCamName, yearStr, monthStr, dayStr, hourStr, minStr] = match;
        const fileYear = parseInt(yearStr, 10);
        const fileMonth = parseInt(monthStr, 10);
        const fileDay = parseInt(dayStr, 10);
        const fileHour = parseInt(hourStr, 10);
        const fileMin = parseInt(minStr, 10);

        // Filter based on criteria
        if (fileYear !== criteria.year) continue;
        if (fileMonth !== criteria.month) continue;
        if (fileDay !== criteria.day) continue;
        if (criteria.hour !== undefined && fileHour !== criteria.hour) continue;
        if (criteria.minute !== undefined && fileMin !== criteria.minute) continue;

        // Format ISO timestamp for Bangkok timezone (UTC+7)
        const timestamp = `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minStr}:00+07:00`;

        results.push({
          id: file.name,
          cameraName: fileCamName,
          timestamp,
          duration: '--:--', // Duration is not in the filename/directory listing
          fileName: file.name,
          videoUrl: `/videos/${criteria.cameraName}/${file.name}`
        });
      }

      // Sort clips by time ascending
      return results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    } catch (error) {
      console.warn('Could not fetch dynamic clips, using fallback mock clips:', error);
      return this.clips.filter((clip) => {
        const clipDate = new Date(clip.timestamp);

        return (
          clip.cameraName === criteria.cameraName &&
          clipDate.getFullYear() === criteria.year &&
          clipDate.getMonth() + 1 === criteria.month &&
          clipDate.getDate() === criteria.day &&
          (criteria.hour === undefined || clipDate.getHours() === criteria.hour) &&
          (criteria.minute === undefined || clipDate.getMinutes() === criteria.minute)
        );
      });
    }
  }
}

