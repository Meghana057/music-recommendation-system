// src/utils/index.ts

import { Song, SortDirection, ChartDataPoint, HistogramData, BarChartData } from '../types';

/**
 * Format duration from milliseconds to MM:SS format
 */
export const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format number to specified decimal places
 */
export const formatNumber = (value: number, decimals: number = 3): string => {
  return value.toFixed(decimals);
};

/**
 * Convert musical key number to key name
 */
export const getKeyName = (key: number): string => {
  const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return keyNames[key] || 'Unknown';
};

/**
 * Get mode name (major/minor)
 */
export const getModeName = (mode: number): string => {
  return mode === 1 ? 'Major' : 'Minor';
};

/**
 * Sort songs array
 */
export const sortSongs = (songs: Song[], field: keyof Song, direction: SortDirection): Song[] => {
  return [...songs].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return direction === 'asc' ? comparison : -comparison;
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const comparison = aValue - bValue;
      return direction === 'asc' ? comparison : -comparison;
    }
    
    return 0;
  });
};

/**
 * Generate CSV content from songs array
 */
export const generateCSV = (songs: Song[]): string => {
  if (songs.length === 0) return '';

  const headers = [
    'Index', 'ID', 'Title', 'Danceability', 'Energy', 'Key', 'Loudness', 'Mode',
    'Acousticness', 'Instrumentalness', 'Liveness', 'Valence', 'Tempo', 'Duration (ms)',
    'Time Signature', 'Num Bars', 'Num Sections', 'Num Segments', 'Class Label', 'User Rating'
  ];

  const csvRows = [
    headers.join(','),
    ...songs.map(song => [
      song.index,
      `"${song.id}"`,
      `"${song.title.replace(/"/g, '""')}"`, // Escape quotes in title
      song.danceability,
      song.energy,
      song.key,
      song.loudness,
      song.mode,
      song.acousticness,
      song.instrumentalness,
      song.liveness,
      song.valence,
      song.tempo,
      song.duration_ms,
      song.time_signature,
      song.num_bars,
      song.num_sections,
      song.num_segments,
      song.class_label,
      song.user_rating || 0
    ].join(','))
  ];

  return csvRows.join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Generate scatter chart data for danceability
 */
export const generateScatterData = (songs: Song[]): ChartDataPoint[] => {
  return songs.map(song => ({
    x: song.danceability,
    y: song.energy,
    title: song.title,
  }));
};

/**
 * Generate histogram data for song duration
 */
export const generateHistogramData = (songs: Song[]): HistogramData[] => {
  const durationBins: { [key: string]: number } = {
    '0-60s': 0,
    '60-120s': 0,
    '120-180s': 0,
    '180-240s': 0,
    '240-300s': 0,
    '300s+': 0,
  };

  songs.forEach(song => {
    const durationSeconds = song.duration_ms / 1000;
    
    if (durationSeconds <= 60) {
      durationBins['0-60s']++;
    } else if (durationSeconds <= 120) {
      durationBins['60-120s']++;
    } else if (durationSeconds <= 180) {
      durationBins['120-180s']++;
    } else if (durationSeconds <= 240) {
      durationBins['180-240s']++;
    } else if (durationSeconds <= 300) {
      durationBins['240-300s']++;
    } else {
      durationBins['300s+']++;
    }
  });

  return Object.entries(durationBins).map(([range, count]) => ({
    label: range,
    count,
    range,
  }));
};

/**
 * Generate bar chart data for acoustics
 */
export const generateAcousticsData = (songs: Song[]): BarChartData[] => {
  const acousticsBins: { [key: string]: number } = {
    '0-0.2': 0,
    '0.2-0.4': 0,
    '0.4-0.6': 0,
    '0.6-0.8': 0,
    '0.8-1.0': 0,
  };

  songs.forEach(song => {
    const acoustics = song.acousticness;
    
    if (acoustics <= 0.2) {
      acousticsBins['0-0.2']++;
    } else if (acoustics <= 0.4) {
      acousticsBins['0.2-0.4']++;
    } else if (acoustics <= 0.6) {
      acousticsBins['0.4-0.6']++;
    } else if (acoustics <= 0.8) {
      acousticsBins['0.6-0.8']++;
    } else {
      acousticsBins['0.8-1.0']++;
    }
  });

  return Object.entries(acousticsBins).map(([label, value]) => ({
    label,
    value,
  }));
};

/**
 * Generate bar chart data for tempo
 */
export const generateTempoData = (songs: Song[]): BarChartData[] => {
  const tempoBins: { [key: string]: number } = {
    '0-80 BPM': 0,
    '80-100 BPM': 0,
    '100-120 BPM': 0,
    '120-140 BPM': 0,
    '140-160 BPM': 0,
    '160+ BPM': 0,
  };

  songs.forEach(song => {
    const tempo = song.tempo;
    
    if (tempo <= 80) {
      tempoBins['0-80 BPM']++;
    } else if (tempo <= 100) {
      tempoBins['80-100 BPM']++;
    } else if (tempo <= 120) {
      tempoBins['100-120 BPM']++;
    } else if (tempo <= 140) {
      tempoBins['120-140 BPM']++;
    } else if (tempo <= 160) {
      tempoBins['140-160 BPM']++;
    } else {
      tempoBins['160+ BPM']++;
    }
  });

  return Object.entries(tempoBins).map(([label, value]) => ({
    label,
    value,
  }));
};

/**
 * Debounce function for search input
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Error message formatter
 */
export const getErrorMessage = (error: any): string => {
  if (error?.detail) {
    return error.detail;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};