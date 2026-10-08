/**
 * ShiftTypeModel - Model Layer (MVP)
 * Manages shift type entity structures, preset defaults, department scopes, period categorizations, and calculations.
 */

export const SHIFT_STORAGE_KEY = 'proapps.hr.shift_types.v5';

export const SHIFT_PERIODS = [
  { value: 'pagi', label: 'Morning', icon: 'Sun', color: '#F59E0B', bg: '#FEF3C7' },
  { value: 'siang', label: 'Afternoon', icon: 'SunDim', color: '#0284C7', bg: '#E0F2FE' },
  { value: 'sore', label: 'Evening', icon: 'CloudSun', color: '#D97706', bg: '#FFEDD5' },
  { value: 'malam', label: 'Night', icon: 'MoonStars', color: '#6366F1', bg: '#EEF2FF' }
];

export const SHIFT_DEPARTMENTS = [
  { code: 'ENG', name: 'Engineering', color: '#0284C7', bg: '#E0F2FE' },
  { code: 'HK', name: 'Housekeeping', color: '#10B981', bg: '#ECFDF5' },
  { code: 'SEC', name: 'Security', color: '#DC2626', bg: '#FEF2F2' },
  { code: 'FIN', name: 'Finance', color: '#D97706', bg: '#FEF3C7' },
  { code: 'HR', name: 'Human Resources', color: '#8B5CF6', bg: '#F3E8FF' },
  { code: 'GA', name: 'General Affairs', color: '#64748B', bg: '#F1F5F9' },
  { code: 'TR', name: 'Tenant Relation', color: '#002B7F', bg: '#EFF6FF' }
];

export const PRESET_SHIFT_COLORS = [
  '#002B7F', // Deep Proapps Navy
  '#0284C7', // Sky Blue
  '#10B981', // Emerald Green
  '#F59E0B', // Amber Gold
  '#D97706', // Orange
  '#DC2626', // Crimson Red
  '#8B5CF6', // Purple Violet
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#64748B'  // Slate
];

/**
 * Calculate net work hours between check-in and check-out, supporting overnight shifts.
 */
export function calculateWorkHours(checkIn, checkOut, breakMinutes = 0) {
  if (!checkIn || !checkOut) return 0;
  
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  
  let inMinutes = (inH || 0) * 60 + (inM || 0);
  let outMinutes = (outH || 0) * 60 + (outM || 0);
  
  // Crosses midnight (overnight shift)
  if (outMinutes <= inMinutes) {
    outMinutes += 24 * 60;
  }
  
  const totalMinutes = outMinutes - inMinutes;
  const netMinutes = Math.max(0, totalMinutes - (Number(breakMinutes) || 0));
  const hours = netMinutes / 60;
  
  return Number.isInteger(hours) ? hours : Number(hours.toFixed(1));
}

export function isOvernightShift(checkIn, checkOut) {
  if (!checkIn || !checkOut) return false;
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  const inMinutes = inH * 60 + (inM || 0);
  const outMinutes = outH * 60 + (outM || 0);
  return outMinutes <= inMinutes;
}

/**
 * Auto-detect shift period (Morning, Afternoon, Evening, Night) based on Check In time.
 */
export function detectPeriodFromTime(checkInTime) {
  if (!checkInTime) return 'pagi';
  const [hStr] = checkInTime.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return 'pagi';
  
  if (h >= 5 && h < 12) {
    return 'pagi'; // Morning (05:00 - 11:59)
  } else if (h >= 12 && h < 16) {
    return 'siang'; // Afternoon (12:00 - 15:59)
  } else if (h >= 16 && h < 19) {
    return 'sore'; // Evening (16:00 - 18:59)
  } else {
    return 'malam'; // Night (19:00 - 04:59)
  }
}

export const INITIAL_SHIFT_TYPES = [
  {
    id: 's-1',
    name: 'Shift Pagi 1',
    code: 'P1',
    period: 'pagi',
    checkIn: '08:00',
    checkOut: '20:00',
    breakMinutes: 0,
    workHours: 12,
    departments: ['ENG', 'SEC'],
    color: '#F59E0B',
    isActive: true
  },
  {
    id: 's-2',
    name: 'Shift Pagi 2',
    code: 'P2',
    period: 'pagi',
    checkIn: '06:00',
    checkOut: '14:00',
    breakMinutes: 0,
    workHours: 8,
    departments: ['HK'],
    color: '#10B981',
    isActive: true
  },
  {
    id: 's-3',
    name: 'Shift Siang 1',
    code: 'S1',
    period: 'siang',
    checkIn: '14:00',
    checkOut: '22:00',
    breakMinutes: 0,
    workHours: 8,
    departments: ['HK'],
    color: '#0284C7',
    isActive: true
  },
  {
    id: 's-4',
    name: 'Shift Siang 2',
    code: 'S2',
    period: 'siang',
    checkIn: '12:00',
    checkOut: '20:00',
    breakMinutes: 0,
    workHours: 8,
    departments: ['HK', 'ENG'],
    color: '#EC4899',
    isActive: true
  },
  {
    id: 's-5',
    name: 'Reguler 1',
    code: 'R1',
    period: 'pagi',
    checkIn: '08:00',
    checkOut: '17:00',
    breakMinutes: 0,
    workHours: 9,
    departments: ['ENG', 'SEC', 'HK'],
    color: '#0284C7',
    isActive: true
  },
  {
    id: 's-6',
    name: 'Reguler 2',
    code: 'R2',
    period: 'pagi',
    checkIn: '09:00',
    checkOut: '17:00',
    breakMinutes: 0,
    workHours: 8,
    departments: ['FIN', 'HR', 'GA', 'TR'],
    color: '#002B7F',
    isActive: true
  },
  {
    id: 's-7',
    name: 'Middle 1',
    code: 'MD1',
    period: 'pagi',
    checkIn: '08:00',
    checkOut: '16:00',
    breakMinutes: 0,
    workHours: 8,
    departments: ['ENG'],
    color: '#8B5CF6',
    isActive: true
  },
  {
    id: 's-8',
    name: 'Middle 2',
    code: 'MD2',
    period: 'siang',
    checkIn: '11:00',
    checkOut: '19:00',
    breakMinutes: 0,
    workHours: 8,
    departments: ['HK'],
    color: '#8B5CF6',
    isActive: true
  },
  {
    id: 's-9',
    name: 'Shift Malam 1',
    code: 'M1',
    period: 'malam',
    checkIn: '20:00',
    checkOut: '08:00',
    breakMinutes: 0,
    workHours: 12,
    departments: ['ENG', 'SEC'],
    color: '#6366F1',
    isActive: true
  },
  {
    id: 's-10',
    name: 'Shift Malam 2',
    code: 'M2',
    period: 'malam',
    checkIn: '21:00',
    checkOut: '07:00',
    breakMinutes: 0,
    workHours: 10,
    departments: ['HK', 'SEC'],
    color: '#6366F1',
    isActive: true
  }
];

export function validateShiftType(draft, existingShifts = []) {
  if (!draft) return 'Invalid shift data.';
  if (!draft.name || !draft.name.trim()) return 'Shift name is required.';
  if (draft.name.trim().length < 2) return 'Shift name must be at least 2 characters.';
  if (draft.name.trim().length > 100) return 'Shift name cannot exceed 100 characters.';
  
  if (!draft.code || !draft.code.trim()) return 'Shift code is required.';
  if (draft.code.trim().length > 10) return 'Shift code cannot exceed 10 characters.';
  
  if (!draft.checkIn) return 'Check-in time is required.';
  if (!draft.checkOut) return 'Check-out time is required.';
  
  if (!draft.departments || draft.departments.length === 0) {
    return 'Please select at least one applicable department.';
  }

  const duplicate = existingShifts.find((item) => 
    item.id !== draft.id && 
    (item.name.trim().toLowerCase() === draft.name.trim().toLowerCase() ||
     item.code.trim().toUpperCase() === draft.code.trim().toUpperCase())
  );
  
  if (duplicate) {
    if (duplicate.name.trim().toLowerCase() === draft.name.trim().toLowerCase()) {
      return `A shift type named “${draft.name}” already exists.`;
    }
    return `A shift type with code “${draft.code.toUpperCase()}” already exists.`;
  }

  return null;
}
