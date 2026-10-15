/**
 * WorkScheduleModel.js - Model Layer (MVP)
 * Manages employee work schedules, roster matrices, and data connection to Shift Types.
 */

import { readShiftTypes, INITIAL_SHIFT_TYPES } from './ShiftTypeModel';
import { EMPLOYEES } from './ApprovalFlowModel';

export const WORK_SCHEDULE_STORAGE_KEY = 'proapps.hr.work_schedules.v2';

export const OFF_SHIFT = {
  id: 'off',
  code: 'OFF',
  name: 'Day Off',
  period: 'off',
  checkIn: '—',
  checkOut: '—',
  workHours: 0,
  color: '#94A3B8',
  isActive: true
};

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get an array of 7 Date objects representing Monday to Sunday of a given reference date.
 */
export function getWeekDates(referenceDate = new Date()) {
  const curr = new Date(referenceDate);
  // Get day of week (0 is Sunday, 1 is Monday... 6 is Saturday)
  const dayOfWeek = curr.getDay();
  // Compute distance to Monday: if Sunday (0), distance is -6; else distance is 1 - dayOfWeek
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

/**
 * Resolves a shift object from shiftTypeId using available shift types.
 */
export function resolveShift(shiftTypeId, shiftTypes = []) {
  if (!shiftTypeId || shiftTypeId === 'off') {
    return OFF_SHIFT;
  }
  const found = shiftTypes.find((s) => s.id === shiftTypeId || s.code === shiftTypeId);
  return found || OFF_SHIFT;
}

/**
 * Generate initial mock schedule roster for employees across a 14-day window around today.
 */
export function generateInitialScheduleRoster(employees = EMPLOYEES, shiftTypes = INITIAL_SHIFT_TYPES) {
  const schedules = {};
  const today = new Date();
  
  // 14 days window (-7 days to +7 days)
  const dates = [];
  for (let i = -7; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatDateKey(d));
  }

  // Engineering & Security shifts (rotational: P1, S1, M1, OFF)
  const rotationalShifts = ['s-1', 's-3', 's-9', 'off'];
  // Office / Admin shifts (R1, R2 on Mon-Fri, OFF on Sat-Sun)
  const regularShifts = ['s-5', 's-6'];

  employees.forEach((emp, empIdx) => {
    const isShiftWorker = ['dept-eng', 'dept-sec', 'dept-hk'].includes(emp.departmentId);

    dates.forEach((dateStr, dateIdx) => {
      const d = new Date(dateStr);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      let shiftId = 'off';

      if (isShiftWorker) {
        // Deterministic rotational pattern based on employee index and date index
        const patternIdx = (empIdx * 2 + dateIdx) % rotationalShifts.length;
        shiftId = rotationalShifts[patternIdx];
      } else {
        // Office worker: Regular shift on weekdays, Day off on weekends
        shiftId = isWeekend ? 'off' : regularShifts[empIdx % regularShifts.length];
      }

      const key = `${emp.id}_${dateStr}`;
      schedules[key] = {
        id: key,
        employeeId: emp.id,
        date: dateStr,
        shiftTypeId: shiftId,
        note: ''
      };
    });
  });

  return schedules;
}

/**
 * Read work schedules from localStorage, or return generated initial roster.
 */
export function readWorkSchedules() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return generateInitialScheduleRoster();
    }
    const raw = window.localStorage.getItem(WORK_SCHEDULE_STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialScheduleRoster();
      window.localStorage.setItem(WORK_SCHEDULE_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
      return parsed;
    }
    const fallback = generateInitialScheduleRoster();
    window.localStorage.setItem(WORK_SCHEDULE_STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  } catch {
    return generateInitialScheduleRoster();
  }
}

/**
 * Save work schedules to localStorage.
 */
export function persistWorkSchedules(schedules) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(WORK_SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
    return true;
  } catch {
    return false;
  }
}

/**
 * Assign a single shift for an employee on a specific date.
 */
export function setEmployeeShift(schedules, employeeId, dateStr, shiftTypeId, note = '') {
  const key = `${employeeId}_${dateStr}`;
  return {
    ...schedules,
    [key]: {
      id: key,
      employeeId,
      date: dateStr,
      shiftTypeId,
      note
    }
  };
}

/**
 * Bulk assign a shift for multiple employees across a range of dates.
 */
export function bulkAssignEmployeeShifts(schedules, employeeIds = [], dateStrings = [], shiftTypeId) {
  const next = { ...schedules };
  employeeIds.forEach((empId) => {
    dateStrings.forEach((dStr) => {
      const key = `${empId}_${dStr}`;
      next[key] = {
        id: key,
        employeeId: empId,
        date: dStr,
        shiftTypeId,
        note: 'Bulk assigned'
      };
    });
  });
  return next;
}

/**
 * Compute employee's total work hours and shift counts for the selected week.
 */
export function calculateEmployeeWeekStats(employeeId, weekDates, schedules, shiftTypes) {
  let totalHours = 0;
  let workDays = 0;
  let offDays = 0;

  weekDates.forEach((dateObj) => {
    const dStr = formatDateKey(dateObj);
    const key = `${employeeId}_${dStr}`;
    const entry = schedules[key];
    const shift = resolveShift(entry?.shiftTypeId, shiftTypes);

    if (shift.id === 'off') {
      offDays += 1;
    } else {
      workDays += 1;
      totalHours += Number(shift.workHours || 0);
    }
  });

  return {
    totalHours: Number(totalHours.toFixed(1)),
    workDays,
    offDays
  };
}

/**
 * Calculate department and roster overall statistics for the displayed week.
 */
export function calculateRosterSummary(weekDates, employees, schedules, shiftTypes) {
  let totalScheduledHours = 0;
  let morningCount = 0;
  let afternoonCount = 0;
  let nightCount = 0;
  let offCount = 0;

  employees.forEach((emp) => {
    weekDates.forEach((dateObj) => {
      const dStr = formatDateKey(dateObj);
      const key = `${emp.id}_${dStr}`;
      const entry = schedules[key];
      const shift = resolveShift(entry?.shiftTypeId, shiftTypes);

      if (shift.id === 'off') {
        offCount += 1;
      } else {
        totalScheduledHours += Number(shift.workHours || 0);
        if (shift.period === 'pagi') morningCount += 1;
        else if (shift.period === 'siang' || shift.period === 'sore') afternoonCount += 1;
        else if (shift.period === 'malam') nightCount += 1;
      }
    });
  });

  return {
    totalScheduledHours: Number(totalScheduledHours.toFixed(1)),
    totalEmployees: employees.length,
    morningCount,
    afternoonCount,
    nightCount,
    offCount
  };
}
