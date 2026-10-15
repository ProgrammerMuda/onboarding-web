import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatDateKey,
  getWeekDates,
  resolveShift,
  OFF_SHIFT,
  setEmployeeShift,
  bulkAssignEmployeeShifts,
  calculateEmployeeWeekStats,
  calculateRosterSummary,
  readWorkSchedules,
  persistWorkSchedules,
  WORK_SCHEDULE_STORAGE_KEY
} from './WorkScheduleModel';

describe('WorkScheduleModel', () => {
  const MOCK_SHIFTS = [
    { id: 's-1', code: 'P1', name: 'Shift Pagi 1', period: 'pagi', workHours: 8, color: '#F59E0B' },
    { id: 's-3', code: 'S1', name: 'Shift Siang 1', period: 'siang', workHours: 8, color: '#0284C7' },
    { id: 's-9', code: 'M1', name: 'Shift Malam 1', period: 'malam', workHours: 12, color: '#6366F1' }
  ];

  let store = {};

  beforeEach(() => {
    store = {};
    global.window = {
      localStorage: {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { store = {}; }
      }
    };
  });

  it('formats Date to YYYY-MM-DD correctly', () => {
    const d = new Date(2026, 9, 14); // Oct 14 2026
    expect(formatDateKey(d)).toBe('2026-10-14');
  });

  it('generates 7 consecutive dates starting from Monday', () => {
    const d = new Date(2026, 9, 14); // Oct 14 2026 is Wednesday
    const week = getWeekDates(d);
    expect(week).toHaveLength(7);
    expect(week[0].getDay()).toBe(1); // Monday
    expect(week[6].getDay()).toBe(0); // Sunday
    expect(formatDateKey(week[0])).toBe('2026-10-12');
    expect(formatDateKey(week[6])).toBe('2026-10-18');
  });

  it('resolves shift data from shiftTypeId', () => {
    const resolved = resolveShift('s-1', MOCK_SHIFTS);
    expect(resolved.code).toBe('P1');
    expect(resolved.workHours).toBe(8);

    const off = resolveShift('off', MOCK_SHIFTS);
    expect(off).toEqual(OFF_SHIFT);

    const unknown = resolveShift('unknown-id', MOCK_SHIFTS);
    expect(unknown).toEqual(OFF_SHIFT);
  });

  it('sets and updates individual employee shift on a date', () => {
    const base = {};
    const updated = setEmployeeShift(base, 'emp-001', '2026-10-12', 's-1', 'Notes');
    expect(updated['emp-001_2026-10-12']).toEqual({
      id: 'emp-001_2026-10-12',
      employeeId: 'emp-001',
      date: '2026-10-12',
      shiftTypeId: 's-1',
      note: 'Notes'
    });
  });

  it('bulk assigns shifts across multiple employees and dates', () => {
    const base = {};
    const bulk = bulkAssignEmployeeShifts(base, ['emp-1', 'emp-2'], ['2026-10-12', '2026-10-13'], 's-3');
    expect(bulk['emp-1_2026-10-12'].shiftTypeId).toBe('s-3');
    expect(bulk['emp-1_2026-10-13'].shiftTypeId).toBe('s-3');
    expect(bulk['emp-2_2026-10-12'].shiftTypeId).toBe('s-3');
    expect(bulk['emp-2_2026-10-13'].shiftTypeId).toBe('s-3');
  });

  it('calculates employee weekly stats based on connected shift types', () => {
    const week = getWeekDates(new Date(2026, 9, 14)); // Oct 12 - 18
    let schedules = {};
    // Mon: P1 (8h), Tue: S1 (8h), Wed: M1 (12h), Thu: OFF, Fri: P1 (8h), Sat: OFF, Sun: OFF
    schedules = setEmployeeShift(schedules, 'emp-1', '2026-10-12', 's-1');
    schedules = setEmployeeShift(schedules, 'emp-1', '2026-10-13', 's-3');
    schedules = setEmployeeShift(schedules, 'emp-1', '2026-10-14', 's-9');
    schedules = setEmployeeShift(schedules, 'emp-1', '2026-10-15', 'off');
    schedules = setEmployeeShift(schedules, 'emp-1', '2026-10-16', 's-1');
    schedules = setEmployeeShift(schedules, 'emp-1', '2026-10-17', 'off');
    schedules = setEmployeeShift(schedules, 'emp-1', '2026-10-18', 'off');

    const stats = calculateEmployeeWeekStats('emp-1', week, schedules, MOCK_SHIFTS);
    expect(stats.totalHours).toBe(36); // 8 + 8 + 12 + 8
    expect(stats.workDays).toBe(4);
    expect(stats.offDays).toBe(3);
  });

  it('calculates roster overall summary', () => {
    const week = getWeekDates(new Date(2026, 9, 14));
    let schedules = {};
    schedules = setEmployeeShift(schedules, 'emp-1', '2026-10-12', 's-1'); // morning 8h
    schedules = setEmployeeShift(schedules, 'emp-1', '2026-10-13', 's-3'); // afternoon 8h
    schedules = setEmployeeShift(schedules, 'emp-1', '2026-10-14', 's-9'); // night 12h

    const summary = calculateRosterSummary(week, [{ id: 'emp-1' }], schedules, MOCK_SHIFTS);
    expect(summary.totalScheduledHours).toBe(28);
    expect(summary.morningCount).toBe(1);
    expect(summary.afternoonCount).toBe(1);
    expect(summary.nightCount).toBe(1);
    expect(summary.offCount).toBe(4); // 7 - 3
  });

  it('persists and restores work schedules from localStorage', () => {
    const testData = {
      'emp-1_2026-10-14': { id: 'test-1', employeeId: 'emp-1', date: '2026-10-14', shiftTypeId: 's-1' }
    };
    persistWorkSchedules(testData);
    expect(store[WORK_SCHEDULE_STORAGE_KEY]).toBeDefined();

    const loaded = readWorkSchedules();
    expect(loaded['emp-1_2026-10-14'].shiftTypeId).toBe('s-1');
  });
});
