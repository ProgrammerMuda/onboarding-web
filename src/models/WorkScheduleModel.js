/**
 * WorkScheduleModel.js - Model Layer (MVP)
 * Manages employee work schedules, roster matrices, and data connection to Shift Types.
 */

import { readShiftTypes, INITIAL_SHIFT_TYPES } from './ShiftTypeModel';
import { EMPLOYEES } from './ApprovalFlowModel';
import { HOLIDAY_STORAGE_KEY, INITIAL_HOLIDAYS_2026, getHolidayDepartmentIds } from './PermitTypeModel';

export const WORK_SCHEDULE_STORAGE_KEY = 'proapps.hr.work_schedules.v2';

export const OFF_SHIFT = {
  id: 'off',
  code: 'OFF',
  name: 'Day Off',
  offType: 'regular',
  period: 'off',
  checkIn: '—',
  checkOut: '—',
  workHours: 0,
  color: '#94A3B8',
  isActive: true
};

export const HOLIDAY_SHIFT = {
  id: 'off-holiday',
  code: 'LBR',
  name: 'National Holiday',
  offType: 'holiday',
  period: 'holiday',
  quotaNote: 'Hari libur • Mengurangi kuota',
  checkIn: '—',
  checkOut: '—',
  workHours: 0,
  color: '#0284c7',
  isActive: true
};

export const CUTI_BERSAMA_SHIFT = {
  id: 'off-cuti-bersama',
  code: 'CUTI',
  name: 'Collective Leave',
  offType: 'cuti_bersama',
  period: 'cuti_bersama',
  quotaNote: 'Cuti bersama • Mengurangi kuota',
  checkIn: '—',
  checkOut: '—',
  workHours: 0,
  color: '#0284c7',
  isActive: true
};

export const ALL_OFF_SHIFTS = [OFF_SHIFT, HOLIDAY_SHIFT, CUTI_BERSAMA_SHIFT];

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
  if (shiftTypeId === 'off-holiday') {
    return HOLIDAY_SHIFT;
  }
  if (shiftTypeId === 'off-cuti-bersama') {
    return CUTI_BERSAMA_SHIFT;
  }
  const found = shiftTypes.find((s) => s.id === shiftTypeId || s.code === shiftTypeId);
  return found || OFF_SHIFT;
}

let holidayCache = { raw: undefined, byDate: new Map() };

/**
 * Holidays come from the Leave Calendar (Permit Type module), so the roster
 * always reflects what HR configured there. Parsed lazily and re-parsed only
 * when the stored value changes.
 */
function getHolidayShiftMap() {
  let raw = null;
  try {
    raw = typeof localStorage !== 'undefined' ? localStorage.getItem(HOLIDAY_STORAGE_KEY) : null;
  } catch {
    raw = null;
  }
  if (raw === holidayCache.raw) return holidayCache.byDate;

  let list = INITIAL_HOLIDAYS_2026;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
    } catch { /* keep defaults */ }
  }

  const byDate = new Map();
  list.forEach((holiday) => {
    if (!holiday?.date) return;
    const shift = holiday.isCutiBersama
      ? { ...CUTI_BERSAMA_SHIFT, name: holiday.name }
      : { ...HOLIDAY_SHIFT, name: holiday.name };
    byDate.set(holiday.date, { shift, deptIds: getHolidayDepartmentIds(holiday) });
  });
  holidayCache = { raw, byDate };
  return byDate;
}

/**
 * Resolves the assigned shift for a specific employee on a date.
 * If not already explicitly set in schedules, calculates default based on rotational/regular pattern.
 */
export function getEmployeeShiftForDate(schedules, employee, dateStr, shiftTypes = INITIAL_SHIFT_TYPES) {
  if (!employee) return OFF_SHIFT;
  const key = `${employee.id}_${dateStr}`;
  const holiday = getHolidayShiftMap().get(dateStr);
  const holidayShift = holiday && (!holiday.deptIds || holiday.deptIds.includes(employee.departmentId))
    ? holiday.shift
    : null;
  if (schedules && schedules[key]?.shiftTypeId) {
    const assigned = resolveShift(schedules[key].shiftTypeId, shiftTypes);
    // A holiday overrides a plain day off, but never a shift someone was assigned to work.
    return holidayShift && assigned.id === 'off' ? holidayShift : assigned;
  }
  if (holidayShift) return holidayShift;

  // Deterministic fallback based on department and date
  const d = new Date(dateStr);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const isShiftWorker = ['dept-eng', 'dept-sec', 'dept-hk'].includes(employee.departmentId);
  const rotationalShifts = ['s-1', 's-3', 's-9', 'off'];
  const regularShifts = ['s-5', 's-6'];

  let hash = 0;
  for (let i = 0; i < (employee.id || '').length; i++) {
    hash += employee.id.charCodeAt(i);
  }
  hash += (d.getDate() || 1) * 3 + (d.getMonth() || 0) * 7;

  let shiftId = 'off';
  if (isShiftWorker) {
    shiftId = rotationalShifts[Math.abs(hash) % rotationalShifts.length];
  } else {
    shiftId = isWeekend ? 'off' : regularShifts[Math.abs(hash) % regularShifts.length];
  }

  return resolveShift(shiftId, shiftTypes);
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
      // Holidays are derived from the Leave Calendar; drop copies stored by older builds.
      const staleKeys = Object.keys(parsed).filter((k) => {
        const id = parsed[k]?.shiftTypeId;
        return id === 'off-holiday' || id === 'off-cuti-bersama';
      });
      if (staleKeys.length > 0) {
        staleKeys.forEach((k) => { delete parsed[k]; });
        window.localStorage.setItem(WORK_SCHEDULE_STORAGE_KEY, JSON.stringify(parsed));
      }
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
 * Compute employee's total work hours and shift counts for the selected date range.
 */
export function calculateEmployeeWeekStats(employee, weekDates, schedules, shiftTypes) {
  let totalHours = 0;
  let workDays = 0;
  let offDays = 0;

  const empObj = typeof employee === 'object' && employee !== null
    ? employee
    : (EMPLOYEES.find((e) => e.id === employee) || { id: employee });

  weekDates.forEach((dateObj) => {
    const dStr = formatDateKey(dateObj);
    const shift = getEmployeeShiftForDate(schedules, empObj, dStr, shiftTypes);

    const isOffShift = shift.id === 'off' || shift.id === 'off-holiday' || shift.id === 'off-cuti-bersama' || !shift.workHours;
    if (isOffShift) {
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
 * Calculate department and roster overall statistics for the displayed date range.
 */
export function calculateRosterSummary(weekDates, employees, schedules, shiftTypes) {
  let totalScheduledHours = 0;
  let morningCount = 0;
  let afternoonCount = 0;
  let nightCount = 0;
  let offCount = 0;

  employees.forEach((emp) => {
    const empObj = typeof emp === 'object' && emp !== null
      ? emp
      : (EMPLOYEES.find((e) => e.id === emp) || { id: emp });

    weekDates.forEach((dateObj) => {
      const dStr = formatDateKey(dateObj);
      const shift = getEmployeeShiftForDate(schedules, empObj, dStr, shiftTypes);
      const isOffShift = shift.id === 'off' || shift.id === 'off-holiday' || shift.id === 'off-cuti-bersama' || !shift.workHours;

      if (isOffShift) {
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
