/**
 * AttendanceReportModel.js - Model Layer (MVP)
 * Attendance log rows for Report Attendance, with filtering and paging helpers.
 */

import { INITIAL_SHIFT_TYPES } from './ShiftTypeModel';
import clockInSelfie from '../assets/attendance-clockin-selfie.jpg';
import clockOutSelfie from '../assets/attendance-clockout-selfie.jpg';
import clockInSelfieFemale from '../assets/attendance-clockin-selfie-female.jpg';
import clockOutSelfieFemale from '../assets/attendance-clockout-selfie-female.jpg';

// A log carries one result for check in, one for check out, and any number of remarks.
// 'alpha' is an absence with no leave: it stands in for both results and the log has no punches.
export const IN_RESULTS = { early_in: 'Early In', on_time: 'On Time In', late: 'Late', alpha: 'Alpha' };
// 'no_clock_out' is a check in that never got a check out, so the day counts zero hours.
export const OUT_RESULTS = { early_out: 'Early Out', on_time: 'On Time Out', no_clock_out: 'No Clock Out' };
export const REMARKS = {
  overtime_bko: 'Overtime BKO',
  overtime_staff: 'Overtime Staff',
  manual: 'Manual Attendance',
  change_shift: 'Change Shift',
  leave_permit: 'Leave Permit'
};

export const WORK_RELATIONS = [
  { id: 'permanent', label: 'Permanent' },
  { id: 'contract', label: 'Contract' },
  { id: 'outsource', label: 'Outsource' }
];

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
];

const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// female picks which pair of selfies the log carries.
// role is the position plus its division, like Staff Engineering; Building Manager stands alone.
// shifts: the shift ids a person rotates through, one per working day.
const PEOPLE = {
  e1035: { departmentId: 'dept-sec', name: 'Employee 1035', email: 'employee_1035@proapps.id', nip: '3171035000001035', role: 'Staff Security', relation: 'outsource', shifts: ['s-1', 's-9', 's-10'] },
  e1032: { departmentId: 'dept-sec', name: 'Employee 1032', email: 'employee_1032@proapps.id', nip: '1233333333223', role: 'Danru Security', relation: 'permanent', shifts: ['s-1', 's-9'] },
  rudi: { departmentId: 'dept-sec', name: 'Rudi Hermawan', email: 'rudi.hermawan@proapps.demo', nip: '3171035000001041', role: 'Staff Security', relation: 'outsource', shifts: ['s-10', 's-1'] },
  dimas: { departmentId: 'dept-eng', name: 'Dimas Saputra', email: 'dimas.saputra@proapps.demo', nip: '3171020000000412', role: 'Admin Engineering', relation: 'contract', shifts: ['s-5', 's-7'] },
  bayu: { departmentId: 'dept-eng', name: 'Bayu Prakoso', email: 'bayu.prakoso@proapps.demo', nip: '3171020000000436', role: 'Chief Engineering', relation: 'permanent', shifts: ['s-7', 's-5', 's-9'] },
  agus: { departmentId: 'dept-hk', name: 'Agus Setiawan', email: 'agus.setiawan@proapps.demo', nip: '3171030000000587', role: 'SPV Housekeeping', relation: 'permanent', shifts: ['s-2', 's-3'] },
  sari: { departmentId: 'dept-hk', female: true, name: 'Sari Wulandari', email: 'sari.wulandari@proapps.demo', nip: '3171030000000612', role: 'Staff Housekeeping', relation: 'outsource', shifts: ['s-2', 's-8'] },
  wati: { departmentId: 'dept-hk', female: true, name: 'Wati Susanti', email: 'wati.susanti@proapps.demo', nip: '3171030000000640', role: 'Staff Housekeeping', relation: 'outsource', shifts: ['s-3', 's-10'] },
  nadia: { departmentId: 'dept-tr', female: true, name: 'Nadia Putri', email: 'nadia.putri@proapps.demo', nip: '3171040000000118', role: 'Staff Tenant Relation', relation: 'permanent', shifts: ['s-6'] },
  fajar: { departmentId: 'dept-fin', name: 'Fajar Nugroho', email: 'fajar.nugroho@proapps.demo', nip: '3171050000000203', role: 'Staff Finance', relation: 'contract', shifts: ['s-6'] },
  lina: { departmentId: 'dept-hrd', female: true, name: 'Lina Marlina', email: 'lina.marlina@proapps.demo', nip: '3171060000000077', role: 'Staff HRD', relation: 'permanent', shifts: ['s-6'] },
  budi: { departmentId: 'dept-bm', name: 'Budi Hartono', email: 'budi.hartono@proapps.demo', nip: '3171070000000009', role: 'Building Manager', relation: 'permanent', shifts: ['s-5'] },
  tomi: { departmentId: 'dept-eng', name: 'Tomi Wijaya', email: 'tomi.wijaya@proapps.demo', nip: '3171020000000451', role: 'Staff Engineering', relation: 'permanent', shifts: ['s-5', 's-7'] },
  eko: { departmentId: 'dept-eng', name: 'Eko Prasetyo', email: 'eko.prasetyo@proapps.demo', nip: '3171020000000468', role: 'Staff Engineering', relation: 'contract', shifts: ['s-7', 's-9'] },
  hendra: { departmentId: 'dept-sec', name: 'Hendra Gunawan', email: 'hendra.gunawan@proapps.demo', nip: '3171035000001052', role: 'Staff Security', relation: 'outsource', shifts: ['s-9', 's-10', 's-1'] },
  yoga: { departmentId: 'dept-sec', name: 'Yoga Pratama', email: 'yoga.pratama@proapps.demo', nip: '3171035000001066', role: 'Staff Security', relation: 'outsource', shifts: ['s-1', 's-10'] },
  rina: { departmentId: 'dept-hk', female: true, name: 'Rina Anggraini', email: 'rina.anggraini@proapps.demo', nip: '3171030000000655', role: 'Staff Housekeeping', relation: 'outsource', shifts: ['s-2', 's-3', 's-8'] },
  dewi: { departmentId: 'dept-fin', female: true, name: 'Dewi Lestari', email: 'dewi.lestari@proapps.demo', nip: '3171050000000219', role: 'Staff Finance', relation: 'permanent', shifts: ['s-6'] },
  gita: { departmentId: 'dept-tr', female: true, name: 'Gita Maharani', email: 'gita.maharani@proapps.demo', nip: '3171040000000131', role: 'Staff Tenant Relation', relation: 'contract', shifts: ['s-6'] }
};

const SHIFT_TIMES = Object.fromEntries(INITIAL_SHIFT_TYPES.map((st) => [st.id, st]));
const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const toClock = (m) => {
  const day = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(day / 60)).padStart(2, '0')}:${String(day % 60).padStart(2, '0')}`;
};

// [check in result, check out result, remarks]. Normal days come up more often than the exceptions.
const CASES = [
  ['on_time', 'on_time', []],
  ['on_time', 'on_time', []],
  ['on_time', 'on_time', []],
  ['early_in', 'on_time', []],
  ['late', 'on_time', []],
  ['on_time', 'early_out', []],
  ['late', 'early_out', []],
  ['on_time', 'on_time', ['overtime_staff']],
  ['early_in', 'on_time', ['overtime_bko']],
  ['on_time', 'on_time', ['manual']],
  ['late', 'on_time', ['manual']],
  ['on_time', 'on_time', ['change_shift']],
  ['late', 'early_out', ['change_shift']],
  ['early_in', 'on_time', ['overtime_bko', 'manual']],
  [null, null, ['leave_permit']],
  ['alpha', null, []],
  ['on_time', 'no_clock_out', []]
];

// The first ten people (by name) on the latest day, which is page 1 of the default view, together
// show every status and permission at least once.
const SHOWCASE = [
  ['early_in', 'on_time', ['overtime_bko']],
  ['on_time', 'on_time', ['change_shift']],
  ['late', 'no_clock_out', []],
  ['on_time', 'early_out', []],
  ['late', 'early_out', ['change_shift']],
  ['on_time', 'on_time', ['overtime_staff']],
  ['on_time', 'on_time', ['manual']],
  [null, null, ['leave_permit']],
  ['alpha', null, []],
  ['early_in', 'on_time', ['overtime_staff', 'manual']]
];

// Overtime BKO is one more whole shift worked straight after the scheduled one, so it lives on the night
// shifts: a night worker carries on into the morning. The extra shift is the one that starts soonest after
// the scheduled shift ends, and the shorter one when several start together.
const NIGHT_SHIFTS = ['s-9', 's-10'];
function bkoShiftAfter(shiftId) {
  const end = toMinutes(SHIFT_TIMES[shiftId].checkOut);
  const gap = (st) => (toMinutes(st.checkIn) - end + 1440) % 1440;
  const span = (st) => (toMinutes(st.checkOut) - toMinutes(st.checkIn) + 1440) % 1440;
  return INITIAL_SHIFT_TYPES
    .filter((st) => st.id !== shiftId)
    .sort((a, b) => gap(a) - gap(b) || span(a) - span(b))[0].id;
}

// Shift a person swaps onto, picked so it always differs from the one they were scheduled for.
const swapShift = (shifts, current) => shifts.find((id) => id !== current) || (current === 's-5' ? 's-7' : 's-5');

// Weekdays from 12 Oct to 2 Nov 2026. A person skips a day when its hash lands on a rest slot.
const WORK_DATES = (() => {
  const dates = [];
  for (let d = new Date(2026, 9, 12); d <= new Date(2026, 10, 2); d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(toKey(d));
  }
  return dates;
})();

const LATEST = WORK_DATES[WORK_DATES.length - 1];
const NAME_ORDER = Object.keys(PEOPLE).sort((a, b) => PEOPLE[a].name.localeCompare(PEOPLE[b].name));

function buildLogs() {
  const keys = Object.keys(PEOPLE);
  const logs = [];

  // Pass 1: who works when, which case they get, and which shift they were scheduled for.
  keys.forEach((key, p) => {
    WORK_DATES.forEach((date, i) => {
      const isLatest = date === LATEST;
      // Everyone has a log on the latest day; earlier days skip a person when the hash lands on a rest slot.
      if (!isLatest && (p * 7 + i * 3) % 10 < 2) return;
      const { shifts } = PEOPLE[key];
      // The latest day carries a night shift for the people who rotate onto one.
      const night = shifts.find((id) => id === 's-9' || id === 's-10');
      const rank = isLatest ? NAME_ORDER.indexOf(key) : -1;
      const [inResult, outResult, remarks] = rank >= 0 && rank < SHOWCASE.length
        ? SHOWCASE[rank]
        : CASES[(p * 4 + i * 7) % CASES.length];
      const scheduled = remarks.includes('overtime_bko')
        ? NIGHT_SHIFTS[(p + i) % NIGHT_SHIFTS.length]
        : isLatest && night && p % 2 === 0
          ? night
          : shifts[(i + p) % shifts.length];
      // Of the shift changes, the latest day alternates change and swap by rank so both show on page 1.
      const wantsSwap = remarks.includes('change_shift') && (isLatest ? rank % 2 === 1 : (p + i) % 2 === 0);
      logs.push({
        key, date, p, i, inResult, outResult,
        remarks: [...remarks],
        shiftId: scheduled,
        changedFromShiftId: null,
        shiftChange: null,
        wantsSwap,
        checkIn: null, checkOut: null
      });
    });
  });

  // Pass 2: shift changes. A plain change moves one person to another shift. A swap trades shifts with a
  // colleague from the same department who works that day, and the colleague's log records the trade too.
  const swappable = (log) => log.inResult && log.inResult !== 'alpha'
    && !log.remarks.includes('leave_permit') && !log.remarks.includes('change_shift')
    && !log.remarks.includes('overtime_bko');
  logs.forEach((log) => {
    if (!log.remarks.includes('change_shift') || log.shiftChange) return;
    const { shifts, departmentId } = PEOPLE[log.key];
    if (log.wantsSwap) {
      const partner = logs
        .filter((other) => other !== log && other.date === log.date && PEOPLE[other.key].departmentId === departmentId
          && swappable(other) && other.shiftId !== log.shiftId)
        .sort((a, b) => PEOPLE[a.key].name.localeCompare(PEOPLE[b.key].name))[0];
      if (partner) {
        const mine = log.shiftId;
        const theirs = partner.shiftId;
        log.changedFromShiftId = mine;
        log.shiftId = theirs;
        log.shiftChange = { type: 'swap', partnerKey: partner.key };
        partner.changedFromShiftId = theirs;
        partner.shiftId = mine;
        partner.remarks.push('change_shift');
        partner.shiftChange = { type: 'swap', partnerKey: log.key };
        return;
      }
    }
    log.changedFromShiftId = log.shiftId;
    log.shiftId = swapShift(shifts, log.shiftId);
    log.shiftChange = { type: 'change' };
  });

  // Pass 3: punch times follow the shift each person ended up working.
  logs.forEach((log) => {
    const { p, i, inResult, outResult, remarks } = log;
    if (!inResult || inResult === 'alpha') return;
    const shift = SHIFT_TIMES[log.shiftId];
    const start = toMinutes(shift.checkIn);
    const span = (toMinutes(shift.checkOut) - start + 1440) % 1440;
    const inOffset = inResult === 'early_in' ? -(15 + (i % 3) * 5)
      : inResult === 'late' ? 12 + (i % 4) * 8
      : [-4, 0, 3, 7][(p + i) % 4];
    const small = [0, 2, 5, 10][(p * 3 + i) % 4];
    let outMinute = start + span + small;
    if (outResult === 'early_out') {
      outMinute = start + span - (20 + (p % 3) * 15);
    } else if (remarks.includes('overtime_bko')) {
      // One more whole shift straight after this one, until the extra shift ends.
      const extra = SHIFT_TIMES[bkoShiftAfter(log.shiftId)];
      const gap = (toMinutes(extra.checkIn) - toMinutes(shift.checkOut) + 1440) % 1440;
      const extraSpan = (toMinutes(extra.checkOut) - toMinutes(extra.checkIn) + 1440) % 1440;
      log.bkoShiftId = extra.id;
      outMinute = start + span + gap + extraSpan + small;
    } else if (remarks.includes('overtime_staff')) {
      // Whole hours past the end of the shift: leave at 17:00 and stay 3 hours, out at 20:00.
      outMinute = start + span + (1 + (i % 3)) * 60;
    }
    log.checkIn = toClock(start + inOffset);
    log.checkOut = outResult === 'no_clock_out' ? null : toClock(outMinute);
  });

  return logs.map(({ p, i, wantsSwap, ...log }) => log);
}

// Offices with the spots where people tap in and out. `offset` is the spot's distance from the office
// centre in degrees, so every spot sits inside the geofence.
export const GEOFENCE_RADIUS = 140;

const SITES = [
  {
    name: 'Thamrin Executive Residences',
    coords: [-6.2275, 106.8058],
    spots: [
      { name: 'Lobby Tower A', offset: [0.00028, 0.00022] },
      { name: 'West Security Gate', offset: [-0.00041, -0.00035] },
      { name: 'Basement 1 Lobby', offset: [0.00018, -0.00042] }
    ]
  },
  {
    name: 'Paladian Park Apartment',
    coords: [-6.1575, 106.9062],
    spots: [
      { name: 'Main Lobby', offset: [-0.00025, 0.00031] },
      { name: 'North Gate', offset: [0.00044, -0.00018] },
      { name: 'Parking Lobby', offset: [-0.00036, -0.00039] }
    ]
  }
];

// Metres between two [lat, lng] points.
function distanceMeters([lat1, lng1], [lat2, lng2]) {
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(a)));
}

const METHODS = ['Face Photo', 'Scan QR'];

export const INITIAL_ATTENDANCE = buildLogs().map(({ key, ...log }, i) => {
  const { shifts, ...person } = PEOPLE[key];
  // Manual Attendance covers the clock out only: the clock in is still tapped in the app, with its
  // photo and location, while a manually entered clock out has neither.
  const manualOut = log.remarks.includes('manual');
  const hasPhoto = Boolean(log.checkIn);
  const hasOutPhoto = hasPhoto && log.checkOut && !manualOut;
  const personIndex = Object.keys(PEOPLE).indexOf(key);
  const homeSite = personIndex % SITES.length;
  // Some people tap out at the other office, so the map has a log with two sites.
  const outSite = (i + personIndex) % 3 === 0 ? (homeSite + 1) % SITES.length : homeSite;
  const spotAt = (siteIndex, n) => {
    const site = SITES[siteIndex];
    const spot = site.spots[n % site.spots.length];
    const coords = [site.coords[0] + spot.offset[0], site.coords[1] + spot.offset[1]];
    return { name: spot.name, siteName: site.name, siteCoords: site.coords, coords, distance: distanceMeters(coords, site.coords) };
  };
  const located = Boolean(log.checkIn);
  return {
    id: `att-${String(i + 1).padStart(3, '0')}`,
    ...person,
    avatar: AVATARS[Object.keys(PEOPLE).indexOf(key) % AVATARS.length],
    ...log,
    shiftChange: log.shiftChange && {
      type: log.shiftChange.type,
      partner: log.shiftChange.partnerKey
        ? { name: PEOPLE[log.shiftChange.partnerKey].name, role: PEOPLE[log.shiftChange.partnerKey].role }
        : null
    },
    method: located ? METHODS[i % METHODS.length] : null,
    inSpot: located ? spotAt(homeSite, i) : null,
    outSpot: located && log.checkOut && !manualOut ? spotAt(outSite, i + 1) : null,
    // The same face on both taps, in a different pose each time.
    checkInPhoto: hasPhoto ? (person.female ? clockInSelfieFemale : clockInSelfie) : null,
    checkOutPhoto: hasOutPhoto ? (person.female ? clockOutSelfieFemale : clockOutSelfie) : null
  };
}).sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));

// '09:01' -> '9h 01m', and zero hours when there is no punch. Check out earlier than check in means the shift ended after midnight.
export function getWorkMinutes(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  return (toMinutes(checkOut) - toMinutes(checkIn) + 1440) % 1440;
}

export function formatDuration(checkIn, checkOut) {
  const minutes = getWorkMinutes(checkIn, checkOut);
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

// Remark chips for a log, in the order they are listed in REMARKS.
export const getRemarks = (row) => Object.keys(REMARKS).filter((id) => row.remarks.includes(id)).map((id) => ({ id, label: REMARKS[id] }));
export const getRelationLabel = (id) => WORK_RELATIONS.find((r) => r.id === id)?.label || id;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-10-22' -> '22 Oct 2026'
export function formatLogDate(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// What the report prints for a punch and for the total. Nothing is ever printed as a dash: an Alpha day
// reads No Record, a day of leave reads Off day, a missing check out reads No Record, and all of them count zero hours.
export const formatPunch = (row, field) => {
  if (row[field]) return formatLogTime(row[field]);
  return row.inResult === 'alpha' || row.outResult === 'no_clock_out' ? 'No Record' : 'Off day';
};
export const formatTotal = (row) => formatDuration(row.checkIn, row.checkOut);

// '17:42' -> '17:42 PM'; rows follow the 24-hour clock with an AM/PM suffix.
export function formatLogTime(time) {
  if (!time) return 'No Record';
  const hour = Number(time.split(':')[0]);
  return `${time} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export const MAX_CUSTOM_DAYS = 30;

export const PERIOD_OPTIONS = [
  { id: 'today', label: 'Today', hint: 'Today only' },
  { id: 'this_week', label: 'This Week', hint: 'Monday to Sunday' },
  { id: 'last_week', label: 'Last Week', hint: 'The week before' },
  { id: 'this_month', label: 'This Month', hint: 'First to last day' }
];

// Date keys [from, to] for a period mode. Custom comes from the picked dates.
export function resolvePeriod(mode, custom, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  if (mode === 'today') return [toKey(today), toKey(today)];
  if (mode === 'last_week') return [toKey(addDays(monday, -7)), toKey(addDays(monday, -1))];
  if (mode === 'this_month') {
    return [toKey(new Date(today.getFullYear(), today.getMonth(), 1)), toKey(new Date(today.getFullYear(), today.getMonth() + 1, 0))];
  }
  if (mode === 'custom' && custom) return [custom.from, custom.to];
  return [toKey(monday), toKey(addDays(monday, 6))];
}

// Days in an inclusive range of date keys; 0 when either is missing or the range is backwards.
export function countDays(from, to) {
  if (!from || !to) return 0;
  const diff = Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

// '22 Oct – 25 Oct 2026', or a single full date.
export function formatRange(from, to) {
  if (!from || !to) return '';
  if (from === to) return formatLogDate(from);
  const [fy, fm, fd] = from.split('-').map(Number);
  return `${fd} ${MONTHS[fm - 1]}${fy === Number(to.slice(0, 4)) ? '' : ` ${fy}`} – ${formatLogDate(to)}`;
}

export const EMPTY_FILTERS = { department: '', shift: '', query: '' };
export const DEFAULT_PERIOD = { mode: 'this_week', custom: null };

export function filterAttendance(rows, { from, to, department, shift, query }) {
  const q = (query || '').trim().toLowerCase();
  return rows.filter((r) => {
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    if (department && r.departmentId !== department) return false;
    if (shift && r.shiftId !== shift) return false;
    if (q && !`${r.name} ${r.nip} ${r.email}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

// Page numbers with 'gap' where a run of pages is skipped.
export function buildPageItems(totalPages, currentPage) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, 'gap', totalPages];
  if (currentPage >= totalPages - 3) return [1, 'gap', ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)];
  return [1, 'gap', currentPage - 1, currentPage, currentPage + 1, 'gap', totalPages];
}

// Minutes a punch landed from the shift's own time: negative is earlier, positive is later.
const offsetFrom = (time, base) => {
  const diff = (toMinutes(time) - toMinutes(base) + 1440) % 1440;
  return diff > 720 ? diff - 1440 : diff;
};

// { inMinutes, outMinutes } against the row's shift; null where there is no punch or no shift.
export function getPunchOffsets(row) {
  const shift = row.shiftType;
  if (!shift) return { inMinutes: null, outMinutes: null };
  return {
    inMinutes: row.checkIn ? offsetFrom(row.checkIn, shift.checkIn) : null,
    outMinutes: row.checkOut ? offsetFrom(row.checkOut, shift.checkOut) : null
  };
}

const minutesText = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`);

const APPROVERS = ['Hendra Wijaya, Building Manager', 'Maya Kusuma, HR Manager', 'Rizal Ananda, Department Head'];
const MANUAL_REASONS = [
  'The phone battery ran out at the gate',
  'GPS could not lock onto the geofence',
  'The face scan failed three times in a row'
];
const LEAVE_TYPES = ['Annual Leave', 'Sick Leave with doctor note', 'Permit for a family matter'];

// What the Permission section shows for each permission on a log: a title and label/value pairs.
const CHANGE_REASONS = [
  'Operational need on the day',
  'Covering a colleague who is on leave',
  'Roster adjusted by the supervisor'
];

const shiftWindow = (shift) => (shift ? `${shift.checkIn} – ${shift.checkOut}` : '');

// What the Permission section shows for each permission on a log. Each entry has a title, a scope that
// says what it applies to, optional extras (hero, flow, note) and label/value rows.
export function getPermissionDetails(row) {
  const pick = (list) => list[Number(row.nip.slice(-2)) % list.length];
  const approver = pick(APPROVERS);
  return getRemarks(row).map(({ id, label }) => {
    if (id === 'overtime_bko') {
      const extra = row.bkoShiftType;
      return {
        id, label,
        scope: 'Per shift',
        flow: {
          from: { label: 'Scheduled shift', name: row.shift, time: shiftWindow(row.shiftType) },
          to: { label: 'Extra shift', name: row.bkoShift || 'No shift', time: shiftWindow(extra) }
        },
        rows: [
          ['Worked until', row.checkOut ? `${row.checkOut} WIB` : 'No Record'],
          ['Approved by', approver]
        ]
      };
    }
    if (id === 'overtime_staff') {
      const { outMinutes } = getPunchOffsets(row);
      return {
        id, label,
        scope: 'Hourly',
        rows: [
          ['Shift ends', row.shiftType ? `${row.shiftType.checkOut} WIB` : 'No shift'],
          ['Left at', row.checkOut ? `${row.checkOut} WIB` : 'No Record'],
          ['Overtime duration', outMinutes > 0 ? minutesText(outMinutes) : 'Not calculated'],
          ['Approved by', approver]
        ]
      };
    }
    if (id === 'manual') {
      return {
        id, label,
        scope: 'Clock out only',
        note: 'The clock in was recorded in the app. Only the clock out was entered by hand.',
        rows: [
          ['Clock out entered', row.checkOut ? `${row.checkOut} WIB` : 'No Record'],
          ['Reason', pick(MANUAL_REASONS)],
          ['Approved by', approver]
        ]
      };
    }
    if (id === 'change_shift') {
      const swap = row.shiftChange?.type === 'swap';
      const partner = row.shiftChange?.partner;
      const rows = swap
        ? [
          ['Swapped with', partner ? `${partner.name}, ${partner.role}` : 'No colleague'],
          ['Colleague takes', row.changedFromShift || 'No shift'],
          ['Reason', 'Agreed between both employees'],
          ['Approved by', approver]
        ]
        : [
          ['Reason', pick(CHANGE_REASONS)],
          ['Approved by', approver]
        ];
      return {
        id, label,
        scope: swap ? 'Shift Swap' : 'Shift Change',
        flow: {
          from: { name: row.changedFromShift || 'No shift', time: shiftWindow(row.changedFromShiftType) },
          to: { name: row.shift, time: shiftWindow(row.shiftType) }
        },
        rows
      };
    }
    return {
      id, label,
      scope: 'Full day',
      rows: [
        ['Leave type', pick(LEAVE_TYPES)],
        ['Date', formatLogDate(row.date)],
        ['Approved by', approver]
      ]
    };
  });
}

// '08:12' against a shift start -> 'Late 12m'; the labels follow the status pills in the table.
export function describeInResult(row) {
  const { inMinutes } = getPunchOffsets(row);
  if (!row.inResult || row.inResult === 'alpha' || inMinutes == null) return '';
  if (row.inResult === 'late') return `${minutesText(Math.max(inMinutes, 0))} after the shift start`;
  if (row.inResult === 'early_in') return `${minutesText(Math.abs(inMinutes))} before the shift start`;
  return 'Within the grace window';
}

export function describeOutResult(row) {
  const { outMinutes } = getPunchOffsets(row);
  if (row.outResult === 'no_clock_out') return 'No check out was recorded';
  if (!row.outResult || outMinutes == null) return '';
  if (row.remarks?.includes('overtime_bko')) return 'Carried on into one more shift';
  if (row.outResult === 'early_out') return `${minutesText(Math.abs(outMinutes))} before the shift end`;
  return outMinutes > 60 ? `${minutesText(outMinutes)} after the shift end` : 'Left at the shift end';
}

// --- Excel report -----------------------------------------------------------------------------------

// Inclusive list of date keys from one day to another.
export function listDates(from, to) {
  const dates = [];
  const end = new Date(`${to}T00:00:00`);
  for (let d = new Date(`${from}T00:00:00`); d <= end; d.setDate(d.getDate() + 1)) dates.push(toKey(d));
  return dates;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const weekdayOf = (key) => WEEKDAYS[new Date(`${key}T00:00:00`).getDay()];

// 125 -> '2h 05m'. Always hours and minutes, so a column of totals lines up.
export function formatHm(minutes) {
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

// One employee's month: the totals the summary sheet and the top of each employee sheet show. `logs` are the
// employee's logs inside the period; any date up to `today` without a log is a day off.
export function summarizeLogs(logs, dates, today = '9999-12-31') {
  const sum = {
    calendarDays: dates.length, scheduledDays: 0, offDays: 0, workDays: 0,
    expectedMinutes: 0, workedMinutes: 0,
    lateCount: 0, lateMinutes: 0, earlyOutCount: 0, earlyOutMinutes: 0, noClockOut: 0, alpha: 0,
    overtimeBko: 0, overtimeStaffMinutes: 0, leave: 0, changeShift: 0, manual: 0
  };
  logs.forEach((r) => {
    const { inMinutes, outMinutes } = getPunchOffsets(r);
    sum.scheduledDays += 1;
    sum.expectedMinutes += (r.shiftType?.workHours || 0) * 60;
    if (r.checkIn) sum.workDays += 1;
    sum.workedMinutes += getWorkMinutes(r.checkIn, r.checkOut);
    if (r.inResult === 'late') { sum.lateCount += 1; sum.lateMinutes += Math.max(inMinutes ?? 0, 0); }
    if (r.outResult === 'early_out') { sum.earlyOutCount += 1; sum.earlyOutMinutes += Math.max(-(outMinutes ?? 0), 0); }
    if (r.outResult === 'no_clock_out') sum.noClockOut += 1;
    if (r.inResult === 'alpha') sum.alpha += 1;
    if (r.remarks.includes('overtime_bko')) sum.overtimeBko += 1;
    if (r.remarks.includes('overtime_staff')) sum.overtimeStaffMinutes += Math.max(outMinutes ?? 0, 0);
    if (r.remarks.includes('leave_permit')) sum.leave += 1;
    if (r.remarks.includes('change_shift')) sum.changeShift += 1;
    if (r.remarks.includes('manual')) sum.manual += 1;
  });
  // Days that have not come yet are neither worked nor off.
  sum.offDays = dates.filter((date) => date <= today).length - sum.scheduledDays;
  return sum;
}

// The Permission cell of a day in the export: each permission, with what sets it apart.
export function describeExportPermission(row) {
  const { outMinutes } = getPunchOffsets(row);
  const parts = getRemarks(row).map(({ id, label }) => {
    if (id === 'change_shift') {
      return row.shiftChange?.type === 'swap'
        ? `${label} (Shift Swap with ${row.shiftChange.partner?.name || 'a colleague'})`
        : `${label} (Shift Change)`;
    }
    if (id === 'overtime_bko') return `${label} (1 shift${row.bkoShift ? `, ${row.bkoShift}` : ''})`;
    if (id === 'overtime_staff') return `${label} (${formatHm(Math.max(outMinutes ?? 0, 0))})`;
    if (id === 'manual') return `${label} (clock out only)`;
    return label;
  });
  return parts.join(', ') || 'No permission';
}

// One line per date of the period for the employee sheet. A date with no log is a day off, unless it is
// after `today`: nothing has happened yet, so nothing is recorded.
export function buildDayRows(logs, dates, today = '9999-12-31') {
  const byDate = new Map(logs.map((r) => [r.date, r]));
  return dates.map((date) => {
    const r = byDate.get(date);
    const base = { date, weekday: weekdayOf(date) };
    if (!r && date > today) {
      return {
        ...base, shift: 'No schedule yet', shiftHours: 'No schedule yet', checkIn: 'Not checkin yet', checkOut: 'Not checkout yet',
        total: '0h 00m', inStatus: 'No status', outStatus: 'No status', permission: 'No permission'
      };
    }
    if (!r) {
      return {
        ...base, shift: 'OFF', shiftHours: 'Off day', checkIn: 'Off day', checkOut: 'Off day',
        total: '0h 00m', inStatus: 'No status', outStatus: 'No status', permission: 'No permission'
      };
    }
    return {
      ...base,
      shift: r.shift,
      shiftHours: r.shiftType?.workHours ? formatHm(r.shiftType.workHours * 60) : 'No shift',
      checkIn: formatPunch(r, 'checkIn'),
      checkOut: formatPunch(r, 'checkOut'),
      total: formatTotal(r),
      inStatus: IN_RESULTS[r.inResult] || 'No status',
      outStatus: OUT_RESULTS[r.outResult] || 'No status',
      permission: describeExportPermission(r)
    };
  });
}

// Which logs an export carries, from what the filters show. `filtered` is the filtered list; `allLogs` is every
// log. Without a shift filter each employee in the list gets all their logs of the period, so their sheet can
// show the days off too. With one, only the filtered logs go in: other shifts are not days off.
export function selectExportLogs({ filtered, allLogs, from, to, shiftFilter }) {
  const nips = new Set(filtered.map((r) => r.nip));
  const onlyLoggedDays = Boolean(shiftFilter);
  const logs = onlyLoggedDays ? filtered : filterAttendance(allLogs, { from, to }).filter((r) => nips.has(r.nip));
  return { logs, onlyLoggedDays, rows: filtered.length, employees: nips.size };
}
