import { describe, it, expect } from 'vitest';
import {
  INITIAL_ATTENDANCE,
  IN_RESULTS,
  OUT_RESULTS,
  REMARKS,
  formatDuration,
  getWorkMinutes,
  formatPunch,
  formatTotal,
  getRemarks,
  getPunchOffsets,
  getPermissionDetails,
  describeInResult,
  describeOutResult,
  GEOFENCE_RADIUS,
  listDates,
  formatHm,
  summarizeLogs,
  buildDayRows,
  describeExportPermission,
  selectExportLogs,
  filterAttendance
} from './AttendanceReportModel';
import { INITIAL_SHIFT_TYPES } from './ShiftTypeModel';

describe('AttendanceReportModel', () => {
  it('counts a night shift across midnight', () => {
    expect(formatDuration('20:00', '09:15')).toBe('13h 15m');
    expect(formatDuration('08:02', '17:03')).toBe('9h 01m');
    expect(formatDuration(null, null)).toBe('0h 00m');
  });

  it('prints No Record for Alpha and Off day for leave, both with zero hours', () => {
    const alpha = { inResult: 'alpha', checkIn: null, checkOut: null };
    const leave = { inResult: null, checkIn: null, checkOut: null };
    expect(formatPunch(alpha, 'checkIn')).toBe('No Record');
    expect(formatPunch(alpha, 'checkOut')).toBe('No Record');
    expect(formatTotal(alpha)).toBe('0h 00m');
    expect(formatPunch(leave, 'checkIn')).toBe('Off day');
    expect(formatTotal(leave)).toBe('0h 00m');
    expect(formatPunch({ inResult: 'on_time', checkIn: '08:02' }, 'checkIn')).toBe('08:02 AM');
  });

  it('counts work minutes, and none without both punches', () => {
    expect(getWorkMinutes('08:02', '17:03')).toBe(541);
    expect(getWorkMinutes('20:00', '09:15')).toBe(795);
    expect(getWorkMinutes('08:00', null)).toBe(0);
  });

  it('only uses known results and remarks', () => {
    INITIAL_ATTENDANCE.forEach((r) => {
      if (r.inResult) expect(IN_RESULTS).toHaveProperty(r.inResult);
      if (r.outResult) expect(OUT_RESULTS).toHaveProperty(r.outResult);
      r.remarks.forEach((t) => expect(REMARKS).toHaveProperty(t));
    });
  });

  it('leave and alpha have no punches, no clock out has only a check in, every other log has both', () => {
    INITIAL_ATTENDANCE.forEach((r) => {
      const noPunch = r.remarks.includes('leave_permit') || r.inResult === 'alpha';
      expect(Boolean(r.checkIn)).toBe(!noPunch);
      expect(Boolean(r.checkOut)).toBe(!noPunch && r.outResult !== 'no_clock_out');
    });
  });

  it('a missing check out prints No Record and counts zero hours', () => {
    const row = { inResult: 'late', outResult: 'no_clock_out', checkIn: '08:30', checkOut: null };
    expect(formatPunch(row, 'checkIn')).toBe('08:30 AM');
    expect(formatPunch(row, 'checkOut')).toBe('No Record');
    expect(formatTotal(row)).toBe('0h 00m');
  });

  it('alpha is never combined with leave or a check out result', () => {
    INITIAL_ATTENDANCE.filter((r) => r.inResult === 'alpha').forEach((r) => {
      expect(r.outResult).toBeNull();
      expect(r.remarks).not.toContain('leave_permit');
    });
    expect(INITIAL_ATTENDANCE.some((r) => r.inResult === 'alpha')).toBe(true);
  });

  it('a changed shift names the shift it came from, and differs from it', () => {
    INITIAL_ATTENDANCE.filter((r) => r.remarks.includes('change_shift')).forEach((r) => {
      expect(r.changedFromShiftId).toBeTruthy();
      expect(r.changedFromShiftId).not.toBe(r.shiftId);
    });
  });

  it('gives every employee a mix of cases', () => {
    const byPerson = new Map();
    INITIAL_ATTENDANCE.forEach((r) => {
      const set = byPerson.get(r.nip) || new Set();
      set.add(`${r.inResult}|${r.outResult}|${r.remarks.join(',')}`);
      byPerson.set(r.nip, set);
    });
    expect(byPerson.size).toBeGreaterThanOrEqual(19);
    byPerson.forEach((cases) => expect(cases.size).toBeGreaterThanOrEqual(4));
  });

  it('page 1 of the default view shows every status and permission', () => {
    const page = INITIAL_ATTENDANCE.slice(0, 10);
    const dates = new Set(page.map((r) => r.date));
    expect(dates.size).toBe(1);
    const seen = new Set();
    page.forEach((r) => {
      if (r.inResult) seen.add(`in:${r.inResult}`);
      if (r.outResult) seen.add(`out:${r.outResult}`);
      r.remarks.forEach((t) => seen.add(`remark:${t}`));
    });
    Object.keys(IN_RESULTS).forEach((k) => expect(seen).toContain(`in:${k}`));
    Object.keys(OUT_RESULTS).forEach((k) => expect(seen).toContain(`out:${k}`));
    Object.keys(REMARKS).forEach((k) => expect(seen).toContain(`remark:${k}`));
  });

  it('lists remarks in a stable order', () => {
    const ids = getRemarks({ remarks: ['manual', 'overtime_bko'] }).map((t) => t.id);
    expect(ids).toEqual(['overtime_bko', 'manual']);
  });

  it('measures punches against the shift, across midnight too', () => {
    const day = { checkIn: '08:18', checkOut: '16:40', shiftType: { checkIn: '08:00', checkOut: '17:00' } };
    expect(getPunchOffsets(day)).toEqual({ inMinutes: 18, outMinutes: -20 });
    const night = { checkIn: '19:55', checkOut: '08:10', shiftType: { checkIn: '20:00', checkOut: '08:00' } };
    expect(getPunchOffsets(night)).toEqual({ inMinutes: -5, outMinutes: 10 });
    expect(getPunchOffsets({ checkIn: null, checkOut: null, shiftType: day.shiftType })).toEqual({ inMinutes: null, outMinutes: null });
  });

  it('describes the in and out result in minutes', () => {
    const shiftType = { checkIn: '08:00', checkOut: '17:00' };
    expect(describeInResult({ inResult: 'late', checkIn: '08:18', shiftType })).toBe('18m after the shift start');
    expect(describeInResult({ inResult: 'early_in', checkIn: '07:40', shiftType })).toBe('20m before the shift start');
    expect(describeOutResult({ outResult: 'early_out', checkOut: '16:35', shiftType })).toBe('25m before the shift end');
    expect(describeOutResult({ outResult: 'no_clock_out', checkOut: null, shiftType })).toBe('No check out was recorded');
    expect(describeInResult({ inResult: 'alpha', checkIn: null, shiftType })).toBe('');
  });

  it('builds permission details for every permission on a log', () => {
    INITIAL_ATTENDANCE.filter((r) => r.remarks.length > 0).forEach((r) => {
      const details = getPermissionDetails({
        ...r,
        shift: 'Shift Reguler 1',
        changedFromShift: 'Shift Malam 1',
        shiftType: { checkIn: '08:00', checkOut: '17:00' }
      });
      expect(details.map((d) => d.id)).toEqual(getRemarks(r).map((t) => t.id));
      details.forEach((d) => {
        expect(d.scope).toBeTruthy();
        expect(d.rows.length).toBeGreaterThan(0);
        d.rows.forEach(([label, value]) => {
          expect(label).toBeTruthy();
          expect(value).toBeTruthy();
        });
      });
    });
  });

  it('gives a location and method to every tapped clock in', () => {
    INITIAL_ATTENDANCE.forEach((r) => {
      expect(Boolean(r.inSpot)).toBe(Boolean(r.checkIn));
      expect(Boolean(r.checkInPhoto)).toBe(Boolean(r.checkIn));
      expect(Boolean(r.method)).toBe(Boolean(r.checkIn));
    });
  });

  it('manual attendance covers the clock out only', () => {
    const manual = INITIAL_ATTENDANCE.filter((r) => r.remarks.includes('manual'));
    expect(manual.length).toBeGreaterThan(0);
    manual.forEach((r) => {
      expect(r.checkIn).toBeTruthy();
      expect(r.checkOut).toBeTruthy();
      expect(r.inSpot).toBeTruthy();
      expect(r.checkInPhoto).toBeTruthy();
      expect(r.outSpot).toBeNull();
      expect(r.checkOutPhoto).toBeNull();
    });
    INITIAL_ATTENDANCE.filter((r) => r.checkOut && !r.remarks.includes('manual')).forEach((r) => {
      expect(r.outSpot).toBeTruthy();
      expect(r.checkOutPhoto).toBeTruthy();
    });
  });

  it('a shift change is either a plain change or a swap with another employee', () => {
    const changes = INITIAL_ATTENDANCE.filter((r) => r.remarks.includes('change_shift'));
    expect(changes.some((r) => r.shiftChange.type === 'swap')).toBe(true);
    expect(changes.some((r) => r.shiftChange.type === 'change')).toBe(true);
    changes.forEach((r) => {
      expect(['swap', 'change']).toContain(r.shiftChange.type);
      if (r.shiftChange.type === 'swap') {
        expect(r.shiftChange.partner.name).toBeTruthy();
        expect(r.shiftChange.partner.name).not.toBe(r.name);
      } else {
        expect(r.shiftChange.partner).toBeNull();
      }
    });
  });

  it('a swap is mutual: the colleague is in the same department and trades back', () => {
    const swaps = INITIAL_ATTENDANCE.filter((r) => r.shiftChange?.type === 'swap');
    expect(swaps.length).toBeGreaterThan(0);
    swaps.forEach((r) => {
      const partner = INITIAL_ATTENDANCE.find((o) => o.name === r.shiftChange.partner.name && o.date === r.date);
      expect(partner).toBeTruthy();
      expect(partner.departmentId).toBe(r.departmentId);
      expect(partner.shiftChange.type).toBe('swap');
      expect(partner.shiftChange.partner.name).toBe(r.name);
      expect(partner.shiftId).toBe(r.changedFromShiftId);
      expect(r.shiftId).toBe(partner.changedFromShiftId);
      expect(partner.remarks).toContain('change_shift');
    });
  });

  it('overtime BKO is one more whole shift after a night shift', () => {
    const bko = INITIAL_ATTENDANCE.filter((r) => r.remarks.includes('overtime_bko'));
    expect(bko.length).toBeGreaterThan(0);
    bko.forEach((r) => {
      expect(['s-9', 's-10']).toContain(r.shiftId);
      expect(r.bkoShiftId).toBeTruthy();
      expect(r.bkoShiftId).not.toBe(r.shiftId);
      // Working the scheduled night shift plus a whole extra shift is far longer than the night shift alone.
      const hours = getWorkMinutes(r.checkIn, r.checkOut) / 60;
      expect(hours).toBeGreaterThan(15);
    });
  });

  it('overtime staff runs whole hours past the end of the shift, and never with an early out', () => {
    const staff = INITIAL_ATTENDANCE.filter((r) => r.remarks.includes('overtime_staff'));
    expect(staff.length).toBeGreaterThan(0);
    staff.forEach((r) => {
      expect(r.outResult).not.toBe('early_out');
      const { outMinutes } = getPunchOffsets({ ...r, shiftType: INITIAL_SHIFT_TYPES.find((st) => st.id === r.shiftId) });
      expect([60, 120, 180]).toContain(outMinutes);
    });
    INITIAL_ATTENDANCE.filter((r) => r.remarks.some((t) => t.startsWith('overtime'))).forEach((r) => {
      expect(r.outResult).not.toBe('early_out');
    });
  });

  it('describes BKO overtime per shift and staff overtime by the hour', () => {
    const base = INITIAL_ATTENDANCE.find((r) => r.checkOut);
    const shiftType = { checkIn: '20:00', checkOut: '08:00' };
    const bko = getPermissionDetails({
      ...base, remarks: ['overtime_bko'], checkOut: '16:05', shiftType,
      shift: 'Shift Malam 1', bkoShift: 'Shift Middle 1', bkoShiftType: { checkIn: '08:00', checkOut: '16:00' }
    })[0];
    expect(bko.scope).toBe('Per shift');
    expect(bko.hero).toBeUndefined();
    expect(bko.flow.from.name).toBe('Shift Malam 1');
    expect(bko.flow.to.name).toBe('Shift Middle 1');
    const day = { checkIn: '08:00', checkOut: '17:00' };
    const staff = getPermissionDetails({ ...base, remarks: ['overtime_staff'], checkOut: '20:00', shiftType: day })[0];
    expect(staff.scope).toBe('Hourly');
    expect(staff.hero).toBeUndefined();
    expect(staff.rows).toContainEqual(['Shift ends', '17:00 WIB']);
    expect(staff.rows).toContainEqual(['Left at', '20:00 WIB']);
    expect(staff.rows).toContainEqual(['Overtime duration', '3h 00m']);
    const partial = getPermissionDetails({ ...base, remarks: ['overtime_staff'], checkOut: '18:15', shiftType: day })[0];
    expect(partial.rows).toContainEqual(['Overtime duration', '1h 15m']);
  });

  it('each employee shows one face in two poses, women with their own pair', () => {
    const women = ['Sari Wulandari', 'Wati Susanti', 'Nadia Putri', 'Dewi Lestari', 'Lina Marlina', 'Rina Anggraini', 'Gita Maharani'];
    const pairs = new Map();
    INITIAL_ATTENDANCE.filter((r) => r.checkInPhoto && r.checkOutPhoto).forEach((r) => {
      const key = women.includes(r.name) ? 'female' : 'male';
      const pair = `${r.checkInPhoto}|${r.checkOutPhoto}`;
      expect(pairs.get(key) ?? pair).toBe(pair);
      pairs.set(key, pair);
      expect(r.checkInPhoto).not.toBe(r.checkOutPhoto);
    });
    expect(pairs.size).toBe(2);
    expect(pairs.get('female')).not.toBe(pairs.get('male'));
  });

  it('keeps every tap inside the geofence, and some logs span two sites', () => {
    const spots = INITIAL_ATTENDANCE.flatMap((r) => [r.inSpot, r.outSpot]).filter(Boolean);
    expect(spots.length).toBeGreaterThan(0);
    spots.forEach((spot) => {
      expect(spot.distance).toBeGreaterThan(0);
      expect(spot.distance).toBeLessThanOrEqual(GEOFENCE_RADIUS);
    });
    const crossSite = INITIAL_ATTENDANCE.filter((r) => r.inSpot && r.outSpot && r.inSpot.siteName !== r.outSpot.siteName);
    expect(crossSite.length).toBeGreaterThan(0);
  });

  it('lists every date of a period and formats hours and minutes', () => {
    expect(listDates('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(formatHm(125)).toBe('2h 05m');
    expect(formatHm(0)).toBe('0h 00m');
    expect(formatHm(-5)).toBe('0h 00m');
  });

  it('summarises a month of logs', () => {
    const shiftType = { checkIn: '08:00', checkOut: '17:00', workHours: 9 };
    const day = (date, extra) => ({
      date, shiftType, remarks: [], inResult: 'on_time', outResult: 'on_time', checkIn: '08:00', checkOut: '17:00', ...extra
    });
    const logs = [
      day('2026-11-02'),
      day('2026-11-03', { inResult: 'late', checkIn: '08:20' }),
      day('2026-11-04', { outResult: 'early_out', checkOut: '16:30' }),
      day('2026-11-05', { outResult: 'no_clock_out', checkOut: null }),
      day('2026-11-06', { inResult: 'alpha', outResult: null, checkIn: null, checkOut: null }),
      day('2026-11-09', { remarks: ['overtime_staff'], checkOut: '20:00' }),
      day('2026-11-10', { remarks: ['leave_permit'], inResult: null, outResult: null, checkIn: null, checkOut: null })
    ];
    const dates = listDates('2026-11-02', '2026-11-12');
    const sum = summarizeLogs(logs, dates, '2026-11-10');
    expect(sum.calendarDays).toBe(11);
    expect(sum.scheduledDays).toBe(7);
    // Up to the 10th two dates have no log. The 11th and 12th have not come yet, so they are not off days.
    expect(sum.offDays).toBe(2);
    expect(sum.workDays).toBe(5);
    expect(sum.expectedMinutes).toBe(7 * 9 * 60);
    expect(sum.lateCount).toBe(1);
    expect(sum.lateMinutes).toBe(20);
    expect(sum.earlyOutCount).toBe(1);
    expect(sum.earlyOutMinutes).toBe(30);
    expect(sum.noClockOut).toBe(1);
    expect(sum.alpha).toBe(1);
    expect(sum.overtimeStaffMinutes).toBe(180);
    expect(sum.leave).toBe(1);
    // 9h + 8h40m + 8h30m + 0 (no clock out) + 0 (alpha) + 12h + 0 (leave)
    expect(sum.workedMinutes).toBe(540 + 520 + 510 + 720);
  });

  it('builds a line for every date, a day off where there is no log', () => {
    const rows = buildDayRows([{
      date: '2026-11-02', shift: 'Shift Reguler 1', shiftType: { checkIn: '08:00', checkOut: '17:00', workHours: 9 },
      remarks: ['manual'], inResult: 'late', outResult: 'on_time', checkIn: '08:20', checkOut: '17:02'
    }], ['2026-11-01', '2026-11-02']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ weekday: 'Sunday', shift: 'OFF', checkIn: 'Off day', total: '0h 00m', permission: 'No permission' });
    expect(rows[1]).toMatchObject({ weekday: 'Monday', shiftHours: '9h 00m', inStatus: 'Late', outStatus: 'On Time Out' });
    expect(rows[1].permission).toBe('Manual Attendance (clock out only)');
  });

  it('does not call a date that has not come yet a day off', () => {
    const [past, future] = buildDayRows([], ['2026-11-01', '2026-11-05'], '2026-11-02');
    expect(past.shift).toBe('OFF');
    expect(future).toMatchObject({ shift: 'No schedule yet', checkIn: 'Not checkin yet', checkOut: 'Not checkout yet', total: '0h 00m' });
  });

  it('describes each permission with what sets it apart in the export', () => {
    const swap = describeExportPermission({
      remarks: ['change_shift'], shiftChange: { type: 'swap', partner: { name: 'Eko Prasetyo' } }
    });
    expect(swap).toBe('Change Shift (Shift Swap with Eko Prasetyo)');
    expect(describeExportPermission({ remarks: ['change_shift'], shiftChange: { type: 'change' } })).toBe('Change Shift (Shift Change)');
    expect(describeExportPermission({ remarks: ['overtime_bko'], bkoShift: 'Shift Middle 1' })).toBe('Overtime BKO (1 shift, Shift Middle 1)');
    expect(describeExportPermission({
      remarks: ['overtime_staff'], checkOut: '20:00', shiftType: { checkIn: '08:00', checkOut: '17:00' }
    })).toBe('Overtime Staff (3h 00m)');
  });

  it('exports what the filters show', () => {
    const [from, to] = ['2026-10-19', '2026-11-08'];
    const periodLogs = filterAttendance(INITIAL_ATTENDANCE, { from, to });
    const decorated = periodLogs.map((r) => ({ ...r, shiftType: { checkIn: '08:00', checkOut: '17:00', workHours: 9 } }));

    // Department filter: only that department's employees, each with all their logs of the period.
    const eng = decorated.filter((r) => r.departmentId === 'dept-eng');
    const byDept = selectExportLogs({ filtered: eng, allLogs: decorated, from, to, shiftFilter: '' });
    expect(byDept.onlyLoggedDays).toBe(false);
    expect(byDept.logs.every((r) => r.departmentId === 'dept-eng')).toBe(true);
    expect(byDept.logs.length).toBe(eng.length);
    expect(byDept.employees).toBe(new Set(eng.map((r) => r.nip)).size);

    // Search on one employee that also has logs the shift filter drops: still all of them without a shift filter.
    const one = decorated.filter((r) => r.name === 'Bayu Prakoso');
    const mine = one.filter((r) => r.shiftId === one[0].shiftId);
    expect(mine.length).toBeLessThan(one.length);
    const noShift = selectExportLogs({ filtered: one, allLogs: decorated, from, to, shiftFilter: '' });
    expect(noShift.logs).toHaveLength(one.length);

    // Shift filter: only the filtered logs, and no padding with days of other shifts.
    const withShift = selectExportLogs({ filtered: mine, allLogs: decorated, from, to, shiftFilter: one[0].shiftId });
    expect(withShift.onlyLoggedDays).toBe(true);
    expect(withShift.logs).toHaveLength(mine.length);
    expect(withShift.rows).toBe(mine.length);
  });
});
