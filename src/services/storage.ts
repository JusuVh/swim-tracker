import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type Stroke = 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'medley';
export type Distance = 50 | 100 | 200 | 400 | 800 | 1500;
export type PoolLength = 25 | 50;

export interface Meet {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
}

export interface Performance {
  id: string;
  meetId: string;     
  date: string;       // ISO format YYYY-MM-DD
  stroke: Stroke;
  distance: Distance;
  poolLength: PoolLength;
  timeMs: number;
}

export interface Swimmer {
  id: string;
  name: string;
  performances: Performance[];
}

// We add a main container so the DB has everything.
// If we want to keep it simple to avoid a complete overhaul, we use different keys.
const SWIMMERS_KEY = '@swim_tracker_swimmers_v3';
const MEETS_KEY = '@swim_tracker_meets_v3';

// Pure Functional Helpers for AsyncStorage
export const loadData = async (): Promise<Swimmer[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SWIMMERS_KEY); // Changed here to avoid conflicts with @swim_tracker_data (if corrupted)
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to load swimmers', e);
    return [];
  }
};

export const loadMeets = async (): Promise<Meet[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(MEETS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to load meets', e);
    return [];
  }
};

export const saveData = async (data: Swimmer[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(SWIMMERS_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save data', e);
  }
};

export const saveMeets = async (meets: Meet[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(meets);
    await AsyncStorage.setItem(MEETS_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save meets', e);
  }
};

// Pure CRUD Functions for Meets
export const addMeet = (meets: Meet[], newMeet: Omit<Meet, 'id'>): Meet[] => [
  ...meets,
  { ...newMeet, id: Date.now().toString() }
];

export const removeMeet = (meets: Meet[], meetId: string): Meet[] => 
  meets.filter((m) => m.id !== meetId);

export const updateMeet = (meets: Meet[], meetId: string, name: string): Meet[] =>
  meets.map((m) => m.id === meetId ? { ...m, name } : m);

// Pure CRUD Functions for Swimmers
export const addSwimmer = (swimmers: Swimmer[], newSwimmerName: string): Swimmer[] => [
  ...swimmers,
  {
    id: Date.now().toString(),
    name: newSwimmerName,
    performances: []
  }
];

export const removeSwimmer = (swimmers: Swimmer[], swimmerId: string): Swimmer[] => 
  swimmers.filter((s) => s.id !== swimmerId);

// Pure Function to add a performance to a specific swimmer
export const addPerformance = (
  swimmers: Swimmer[],
  swimmerId: string,
  performance: Omit<Performance, 'id'>
): Swimmer[] => 
  swimmers.map((swimmer) => 
    swimmer.id === swimmerId
      ? {
          ...swimmer,
          performances: [
            ...swimmer.performances,
            { ...performance, id: Date.now().toString() }
          ]
        }
      : swimmer
  );

export const removePerformance = (
  swimmers: Swimmer[],
  swimmerId: string,
  performanceId: string
): Swimmer[] =>
  swimmers.map((swimmer) =>
    swimmer.id === swimmerId
      ? {
          ...swimmer,
          performances: swimmer.performances.filter((p) => p.id !== performanceId)
        }
      : swimmer
  );

export const updatePerformance = (
  swimmers: Swimmer[],
  swimmerId: string,
  performanceId: string,
  newTimeMs: number
): Swimmer[] =>
  swimmers.map((swimmer) =>
    swimmer.id === swimmerId
      ? {
          ...swimmer,
          performances: swimmer.performances.map((p) =>
            p.id === performanceId ? { ...p, timeMs: newTimeMs } : p
          )
        }
      : swimmer
  );

// --- SYNC FUNCTIONS (Cloud) ---

export const syncPush = async (): Promise<void> => {
  const [swimmers, meets] = await Promise.all([loadData(), loadMeets()]);

  // Upsert Meets
  if (meets.length > 0) {
    const { error: meetError } = await supabase
      .from('meets')
      .upsert(meets.map(m => ({
        id: m.id,
        name: m.name,
        start_date: m.startDate,
        end_date: m.endDate
      })));
    if (meetError) throw meetError;
  }

  // Upsert Swimmers
  if (swimmers.length > 0) {
    const { error: swimmerError } = await supabase
      .from('swimmers')
      .upsert(swimmers.map(s => ({
        id: s.id,
        name: s.name
      })));
    if (swimmerError) throw swimmerError;

    // Flatten and Upsert Performances
    const performances = swimmers.flatMap(s => 
      s.performances.map(p => ({
        id: p.id,
        swimmer_id: s.id,
        meet_id: p.meetId,
        date: p.date,
        stroke: p.stroke,
        distance: p.distance,
        pool_length: p.poolLength,
        time_ms: p.timeMs
      }))
    );

    if (performances.length > 0) {
      const { error: perfError } = await supabase
        .from('performances')
        .upsert(performances);
      if (perfError) throw perfError;
    }
  }
};

export const syncPull = async (): Promise<{ swimmers: Swimmer[], meets: Meet[] }> => {
  const [
    { data: swimmersData, error: sErr },
    { data: meetsData, error: mErr },
    { data: perfsData, error: pErr }
  ] = await Promise.all([
    supabase.from('swimmers').select('*'),
    supabase.from('meets').select('*'),
    supabase.from('performances').select('*')
  ]);

  if (sErr) throw sErr;
  if (mErr) throw mErr;
  if (pErr) throw pErr;

  const meets: Meet[] = (meetsData || []).map(m => ({
    id: m.id,
    name: m.name,
    startDate: m.start_date,
    endDate: m.end_date || undefined
  }));

  const swimmers: Swimmer[] = (swimmersData || []).map(s => {
    const perfs = (perfsData || [])
      .filter(p => p.swimmer_id === s.id)
      .map(p => ({
        id: p.id,
        meetId: p.meet_id,
        date: p.date,
        stroke: p.stroke as Stroke,
        distance: p.distance as Distance,
        poolLength: p.pool_length as PoolLength,
        timeMs: p.time_ms
      }));
    
    return {
      id: s.id,
      name: s.name,
      performances: perfs
    };
  });

  // Persist locally
  await Promise.all([
    saveData(swimmers),
    saveMeets(meets)
  ]);

  return { swimmers, meets };
};
