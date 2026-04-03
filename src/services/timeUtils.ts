import { Performance, Stroke, Distance, PoolLength } from './storage';

/**
 * Formats milliseconds into a readable string (e.g. 1:02.34)
 */
export const formatTimeMS = (ms: number): string => {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((ms % 1000) / 10);

  const secondsStr = seconds.toString().padStart(2, '0');
  const hundredthsStr = hundredths.toString().padStart(2, '0');

  if (minutes > 0) {
    return `${minutes}:${secondsStr}.${hundredthsStr}`;
  }
  return `${seconds}.${hundredthsStr}`;
};

/**
 * Parses a string (like "1:02.34" or "25.12") into milliseconds.
 * Functional approach avoiding regex state if possible.
 */
export const parseTimeToMS = (timeStr: string): number => {
  const parts = timeStr.split(':');
  
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const secParts = parts[1].split('.');
    const seconds = parseInt(secParts[0], 10);
    const hundredths = secParts.length > 1 ? parseInt(secParts[1], 10) : 0;
    
    return (minutes * 60 * 1000) + (seconds * 1000) + (hundredths * 10);
  }
  
  // No minutes, just seconds and hundredths
  const secParts = timeStr.split('.');
  const seconds = parseInt(secParts[0], 10);
  const hundredths = secParts.length > 1 ? parseInt(secParts[1], 10) : 0;
  
  // Provide default 0 to avoid NaN
  return ((seconds || 0) * 1000) + ((hundredths || 0) * 10);
};

// Find personal best (functional - no loops)
export const getPersonalBest = (
  performances: Performance[],
  stroke: Stroke,
  distance: Distance,
  poolLength: PoolLength
): Performance | null => {
  const relevantPerformances = performances.filter(
    (p) => p.stroke === stroke && p.distance === distance && p.poolLength === poolLength
  );

  return relevantPerformances.reduce<Performance | null>((best, current) => {
    if (!best) return current;
    return current.timeMs < best.timeMs ? current : best;
  }, null);
};
