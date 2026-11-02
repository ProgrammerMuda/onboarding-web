import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { buildAttendanceWorkbook } from './attendanceExcel';
import { INITIAL_ATTENDANCE, filterAttendance, resolvePeriod } from '../models/AttendanceReportModel';
import { INITIAL_SHIFT_TYPES } from '../models/ShiftTypeModel';

const decorate = (r) => {
  const shiftType = INITIAL_SHIFT_TYPES.find((st) => st.id === r.shiftId);
  const from = INITIAL_SHIFT_TYPES.find((st) => st.id === r.changedFromShiftId);
  const extra = INITIAL_SHIFT_TYPES.find((st) => st.id === r.bkoShiftId);
  return {
    ...r, shiftType, shift: shiftType?.name || 'No shift', departmentName: 'Department',
    changedFromShift: from?.name || '', changedFromShiftType: from || null,
    bkoShift: extra?.name || '', bkoShiftType: extra || null
  };
};

describe('buildAttendanceWorkbook', () => {
  const [from, to] = ['2026-10-26', '2026-11-08'];
  const logs = filterAttendance(INITIAL_ATTENDANCE, { from, to }).map(decorate);
  const workbook = buildAttendanceWorkbook({ logs, from, to, exportedOn: '2026-11-02' });
  const nips = new Set(logs.map((r) => r.nip));

  it('has a summary sheet and one sheet per employee', () => {
    expect(workbook.worksheets[0].name).toBe('Attendance Summary');
    expect(workbook.worksheets).toHaveLength(1 + nips.size);
    const names = workbook.worksheets.map((w) => w.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    workbook.worksheets.forEach((w) => expect(w.name.length).toBeLessThanOrEqual(31));
  });

  it('lists one summary line per employee under grouped headers', () => {
    const sheet = workbook.worksheets[0];
    expect(sheet.getCell('A1').value).toBe('PROAPPS | REPORT ATTENDANCE');
    expect(sheet.getRow(5).values.slice(1, 5)).toEqual(['NIP', 'Employee', 'Position', 'Department']);
    expect(sheet.rowCount - 5).toBe(nips.size);
  });

  it('gives every employee sheet a line for each date of the period', () => {
    const days = 14;
    workbook.worksheets.slice(1).forEach((sheet) => {
      expect(sheet.getRow(11).values.slice(1, 4)).toEqual(['Date', 'Day', 'Shift']);
      expect(sheet.rowCount - 11).toBe(days);
      expect(sheet.getCell('A12').value).toBe('2026-10-26');
    });
  });

  it('writes a file that opens again', async () => {
    const buffer = await workbook.xlsx.writeBuffer();
    const reopened = new ExcelJS.Workbook();
    await reopened.xlsx.load(buffer);
    expect(reopened.worksheets).toHaveLength(workbook.worksheets.length);
  });

  it('uses the period of the report in its banner', () => {
    expect(resolvePeriod('this_week')).toHaveLength(2);
    expect(workbook.worksheets[1].getCell('A3').value).toContain('26 Oct 2026 to 8 Nov 2026');
  });

  it('prints the filters on every sheet', () => {
    const filtered = buildAttendanceWorkbook({ logs, from, to, exportedOn: '2026-11-02', filterText: 'Filters: Department: Engineering' });
    expect(filtered.worksheets[0].getCell('A3').value).toContain('Filters: Department: Engineering');
    filtered.worksheets.slice(1).forEach((sheet) => expect(sheet.getCell('A3').value).toContain('Filters: Department: Engineering'));
  });

  it('with a shift filter lists only the logged days, not the days of other shifts as days off', () => {
    const one = logs.filter((r) => r.name === 'Bayu Prakoso');
    const shiftId = one[0].shiftId;
    const mine = one.filter((r) => r.shiftId === shiftId);
    const wb = buildAttendanceWorkbook({ logs: mine, from, to, exportedOn: '2026-11-02', onlyLoggedDays: true });
    expect(wb.worksheets).toHaveLength(2);
    const sheet = wb.worksheets[1];
    expect(sheet.rowCount - 11).toBe(new Set(mine.map((r) => r.date)).size);
    const shifts = [];
    sheet.eachRow((row, n) => { if (n > 11) shifts.push(row.getCell(3).value); });
    expect(shifts.includes('OFF')).toBe(false);
  });
});
