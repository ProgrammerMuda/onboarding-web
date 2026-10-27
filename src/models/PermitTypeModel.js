/**
 * PermitTypeModel.js - Model Layer
 * Manages Permit / Leave policy definitions, National Holiday & Cuti Bersama configurations,
 * and Employee Leave Balances with full Transaction Ledger and Adjustments.
 */

import { EMPLOYEES, DEPARTMENTS } from './ApprovalFlowModel';

export const PERMIT_STORAGE_KEY = 'proapps.permit-types.v2';
export const HOLIDAY_STORAGE_KEY = 'proapps.leave-holidays.v5';
export const BALANCE_STORAGE_KEY = 'proapps.leave-balances.v5';
export const ADJUSTMENT_STORAGE_KEY = 'proapps.leave-adjustments.v8';

export const ALLOWED_DATE_OPTIONS = [
  { value: 'past', label: 'Past dates' },
  { value: 'future', label: 'Future dates' },
  { value: 'both', label: 'Both' },
];

export const PERMIT_CATEGORIES = [
  { value: 'annual', label: 'Annual Leave', badgeColor: '#002B7F', bg: '#EFF6FF' },
  { value: 'special', label: 'Special Leave', badgeColor: '#0D9488', bg: '#F0FDFA' },
  { value: 'unpaid', label: 'Unpaid Leave', badgeColor: '#D97706', bg: '#FFFBEB' },
];

export const DAY_COUNT_OPTIONS = [
  { value: 'work_days', label: 'Hari Kerja Saja (Mengabaikan akhir pekan & libur nasional)' },
  { value: 'calendar_days', label: 'Hari Kalender Berurutan (Termasuk Sabtu/Minggu & Libur)' },
];

// Calendar boundaries in Asia/Jakarta, independent of the browser's timezone.
export function getNextPermitReset(frequency, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  const year = Number(parts.year);
  const month = Number(parts.month) - 1;
  const day = Number(parts.day);
  let next;
  if (frequency === 'daily') next = Date.UTC(year, month, day + 1);
  else if (frequency === 'weekly') {
    const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
    next = Date.UTC(year, month, day + ((8 - weekday) % 7 || 7));
  } else {
    const months = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 }[frequency];
    if (!months) return null;
    next = Date.UTC(year, (Math.floor(month / months) + 1) * months, 1);
  }
  return new Date(next - 7 * 60 * 60 * 1000);
}

export function formatPermitReset(frequency, now = new Date()) {
  const date = getNextPermitReset(frequency, now);
  return date ? new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric',
  }).format(date) : '—';
}

export const RESET_FREQUENCIES = [
  { value: 'daily', label: 'Daily', detail: 'Every day', period: 'day', resetCycleNote: 'Tomorrow • 00:00 WIB' },
  { value: 'weekly', label: 'Weekly', detail: 'Every week', period: 'week', resetCycleNote: 'Next Monday • 00:00 WIB' },
  { value: 'monthly', label: 'Monthly', detail: 'Every month', period: 'month', resetCycleNote: 'Start of next month • 00:00 WIB' },
  { value: 'quarterly', label: 'Quarterly', detail: 'Every 3 months', period: 'quarter (3 months)', resetCycleNote: 'Start of next quarter (Q1) • 00:00 WIB' },
  { value: 'semiannual', label: 'Every 6 months', detail: 'Every 6 months', period: '6 months', resetCycleNote: 'Start of next semester (H1) • 00:00 WIB' },
  { value: 'annual', label: 'Annual', detail: 'Every year', period: 'year', resetCycleNote: 'Start of next year • 00:00 WIB' },
];

export const INITIAL_PERMIT_TYPES = [
  {
    id: 'permit-annual',
    name: 'Cuti Tahunan (Annual Leave)',
    category: 'annual',
    description: 'Jatah hak cuti tahunan resmi sesuai UU Ketenagakerjaan dan Peraturan Perusahaan.',
    hasQuota: true,
    quota: 12,
    isProrated: true,
    frequency: 'annual',
    allowedDates: 'both',
    dayCountType: 'work_days',
    allowHalfDay: true,
    requiresDocument: 'always',
    documentMinDays: 1,
    allowNegativeBalance: true,
    maxNegativeDays: 3,
    allowCarryOver: true,
    maxCarryOverDays: 6,
    carryOverExpiryMonths: 3,
    isActive: true
  },
  {
    id: 'permit-sick',
    name: 'Sick Leave (Izin Sakit)',
    category: 'special',
    description: 'Izin istirahat untuk pemulihan dari sakit atau perawatan medis dengan surat keterangan.',
    hasQuota: true,
    quota: 14,
    isProrated: false,
    frequency: 'annual',
    allowedDates: 'both',
    dayCountType: 'work_days',
    allowHalfDay: false,
    requiresDocument: 'always',
    documentMinDays: 1,
    allowNegativeBalance: false,
    maxNegativeDays: 0,
    allowCarryOver: false,
    maxCarryOverDays: 0,
    carryOverExpiryMonths: 0,
    isActive: true
  },
  {
    id: 'permit-marriage',
    name: 'Marriage Leave (Cuti Pernikahan Karyawan)',
    category: 'special',
    eventDurationDays: 3,
    description: 'Cuti khusus untuk pernikahan karyawan sendiri sesuai ketentuan perundang-undangan (3 hari).',
    hasQuota: true,
    quota: 3,
    isProrated: false,
    frequency: 'annual',
    allowedDates: 'future',
    dayCountType: 'work_days',
    allowHalfDay: false,
    requiresDocument: 'always',
    documentMinDays: 1,
    allowNegativeBalance: false,
    maxNegativeDays: 0,
    allowCarryOver: false,
    maxCarryOverDays: 0,
    carryOverExpiryMonths: 0,
    isActive: true
  },
  {
    id: 'permit-maternity',
    name: 'Maternity Leave (Cuti Melahirkan)',
    category: 'special',
    eventDurationDays: 90,
    description: 'Cuti melahirkan bagi karyawan perempuan selama 3 bulan (90 hari kalender).',
    hasQuota: true,
    quota: 90,
    isProrated: false,
    frequency: 'annual',
    allowedDates: 'future',
    dayCountType: 'calendar_days',
    allowHalfDay: false,
    requiresDocument: 'always',
    documentMinDays: 1,
    allowNegativeBalance: false,
    maxNegativeDays: 0,
    allowCarryOver: false,
    maxCarryOverDays: 0,
    carryOverExpiryMonths: 0,
    isActive: true
  },
  {
    id: 'permit-paternity',
    name: 'Paternity Leave (Cuti Istri Melahirkan)',
    category: 'special',
    eventDurationDays: 2,
    description: 'Pendampingan saat istri melahirkan atau mengalami keguguran kandungan (2 hari kerja).',
    hasQuota: true,
    quota: 2,
    isProrated: false,
    frequency: 'annual',
    allowedDates: 'both',
    dayCountType: 'work_days',
    allowHalfDay: false,
    requiresDocument: 'always',
    documentMinDays: 1,
    allowNegativeBalance: false,
    maxNegativeDays: 0,
    allowCarryOver: false,
    maxCarryOverDays: 0,
    carryOverExpiryMonths: 0,
    isActive: true
  },
  {
    id: 'permit-bereavement',
    name: 'Bereavement Leave (Cuti Duka Cita)',
    category: 'special',
    eventDurationDays: 2,
    description: 'Cuti duka cita atas meninggalnya anggota keluarga inti (orang tua, pasangan, anak).',
    hasQuota: true,
    quota: 2,
    isProrated: false,
    frequency: 'annual',
    allowedDates: 'both',
    dayCountType: 'work_days',
    allowHalfDay: false,
    requiresDocument: 'always',
    documentMinDays: 1,
    allowNegativeBalance: false,
    maxNegativeDays: 0,
    allowCarryOver: false,
    maxCarryOverDays: 0,
    carryOverExpiryMonths: 0,
    isActive: true
  },
  {
    id: 'permit-hajj',
    name: 'Hajj / Pilgrimage Leave (Ibadah Keagamaan)',
    category: 'special',
    eventDurationDays: 40,
    description: 'Penunaian kewajiban ibadah haji atau ziarah keagamaan resmi sekali selama masa kerja.',
    hasQuota: true,
    quota: 40,
    isProrated: false,
    frequency: 'annual',
    allowedDates: 'future',
    dayCountType: 'calendar_days',
    allowHalfDay: false,
    requiresDocument: 'always',
    documentMinDays: 1,
    allowNegativeBalance: false,
    maxNegativeDays: 0,
    allowCarryOver: false,
    maxCarryOverDays: 0,
    carryOverExpiryMonths: 0,
    isActive: true
  },
  {
    id: 'permit-unpaid',
    name: 'Unpaid Leave (Cuti di Luar Tanggungan)',
    category: 'unpaid',
    description: 'Izin meninggalkan pekerjaan tanpa menerima upah setelah jatah cuti tahunan habis.',
    hasQuota: false,
    quota: null,
    isProrated: false,
    frequency: null,
    allowedDates: 'future',
    dayCountType: 'work_days',
    allowHalfDay: true,
    requiresDocument: 'always',
    documentMinDays: 1,
    allowNegativeBalance: false,
    maxNegativeDays: 0,
    allowCarryOver: false,
    maxCarryOverDays: 0,
    carryOverExpiryMonths: 0,
    isActive: true
  }
];

export function validatePermitType(draft, permits) {
  if (!ALLOWED_DATE_OPTIONS.some((option) => option.value === draft.allowedDates)) return 'Invalid date policy on this leave type.';
  if (!draft.name?.trim()) return 'Enter a leave name.';
  if (!PERMIT_CATEGORIES.some((category) => category.value === draft.category)) return 'Choose Annual Leave, Special Leave, or Unpaid Leave.';
  if (draft.requiresDocument !== 'always') return 'A supporting document is required for every leave type.';
  if (permits.some((permit) => permit.id !== draft.id && permit.name.toLocaleLowerCase('id') === draft.name.trim().toLocaleLowerCase('id'))) {
    return 'This leave name is already in use.';
  }
  if (draft.category === 'annual' && (!Number.isSafeInteger(Number(draft.quota)) || Number(draft.quota) < 1)) {
    return 'Enter an annual allowance of at least 1 whole day.';
  }
  if (draft.category === 'special' && (!Number.isSafeInteger(Number(draft.eventDurationDays)) || Number(draft.eventDurationDays) < 1)) {
    return 'Enter a duration of at least 1 whole day per event.';
  }
  if (draft.category === 'annual' && draft.allowNegativeBalance && (!Number.isSafeInteger(Number(draft.maxNegativeDays)) || Number(draft.maxNegativeDays) < 1)) return 'Enter a negative balance limit.';
  if (draft.category === 'annual' && draft.allowCarryOver && (!Number.isSafeInteger(Number(draft.maxCarryOverDays)) || Number(draft.maxCarryOverDays) < 1 || !Number.isSafeInteger(Number(draft.carryOverExpiryMonths)) || Number(draft.carryOverExpiryMonths) < 1)) return 'Enter the carry-over limit and expiry.';
  return '';
}

// =========================================================================
// 2. HOLIDAYS & CUTI BERSAMA MODEL (SKB 3 MENTERI 2026)
// =========================================================================

export const TREATMENT_OPTIONS = [
  { value: 'deduct_annual', label: 'Holiday & Deduct Annual Leave Balance', title: 'Deduct annual leave', description: 'Employees are off. One day is taken from each annual leave balance.', badge: 'Deduct Annual', color: '#002B7F', bg: '#EFF6FF' },
  { value: 'free_leave', label: 'No Deduction (Annual Leave Balance Unchanged)', title: 'No deduction', description: 'Employees are off. Annual leave balances stay the same.', badge: 'No deduction', color: '#10B981', bg: '#ECFDF5' },
];

export const SCOPE_OPTIONS = [
  { value: 'all', label: 'All departments' },
  { value: 'departments', label: 'Selected departments' }
];

/**
 * Department ids a holiday applies to, or null when it covers everyone.
 * Only collective leave can be limited; national holidays always apply to all.
 */
export function getHolidayDepartmentIds(holiday) {
  if (!holiday?.isCutiBersama || holiday.scope !== 'departments') return null;
  return Array.isArray(holiday.scopeValue) ? holiday.scopeValue : [];
}

export const INITIAL_HOLIDAYS_2026 = [
  {
    id: 'hol-01',
    date: '2026-01-01',
    name: 'New Year 2026',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  },
  {
    id: 'hol-02',
    date: '2026-01-16',
    name: 'Isra Mi\'raj of the Prophet Muhammad',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  },
  {
    id: 'hol-03',
    date: '2026-02-17',
    name: 'Chinese New Year 2577',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  },
  {
    id: 'hol-04',
    date: '2026-02-18',
    name: 'Collective Leave: Chinese New Year',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'Collective leave applies automatically to all departments.'
  },
  {
    id: 'hol-05',
    date: '2026-03-03',
    name: 'Nyepi Day (Saka New Year 1948)',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  },
  {
    id: 'hol-06',
    date: '2026-03-04',
    name: 'Collective Leave: Nyepi Day',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'Collective leave applies automatically to all departments.'
  },
  {
    id: 'hol-07',
    date: '2026-03-20',
    name: 'Eid al-Fitr 1447 H (Day 1)',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  },
  {
    id: 'hol-08',
    date: '2026-03-21',
    name: 'Eid al-Fitr 1447 H (Day 2)',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  },
  {
    id: 'hol-09',
    date: '2026-03-23',
    name: 'Collective Leave: Eid al-Fitr 1447 H',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'All units apply collective leave and deduct annual allowance.'
  },
  {
    id: 'hol-10',
    date: '2026-03-24',
    name: 'Collective Leave: Eid al-Fitr 1447 H',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'All units apply collective leave and deduct annual allowance.'
  },
  {
    id: 'hol-11',
    date: '2026-05-01',
    name: 'International Labour Day',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  },
  {
    id: 'hol-12',
    date: '2026-05-14',
    name: 'Ascension of Jesus Christ',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  },
  {
    id: 'hol-13',
    date: '2026-05-15',
    name: 'Collective Leave: Ascension of Jesus Christ',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'No annual leave deduction.'
  },
  {
    id: 'hol-14',
    date: '2026-08-17',
    name: 'Indonesian Independence Day (81st)',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Indonesian National Day'
  },
  // Oct 29-30 sit in the current week so the roster shows holidays during testing; the real Maulid date is 25 Aug. Move before launch.
  {
    id: 'hol-17',
    date: '2026-10-29',
    name: 'Prophet Muhammad\'s Birthday',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  },
  {
    id: 'hol-18',
    date: '2026-10-30',
    name: 'Collective Leave: Prophet Muhammad\'s Birthday',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'Collective leave applies automatically to all departments.'
  },
  {
    id: 'hol-19',
    date: '2026-11-10',
    name: 'National Heroes\' Day',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Indonesian National Day'
  },
  {
    id: 'hol-15',
    date: '2026-12-25',
    name: 'Christmas Day',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  },
  {
    id: 'hol-16',
    date: '2026-12-26',
    name: 'Collective Leave: Christmas Day',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'Collective leave applies automatically to all departments.'
  },
  {
    id: 'hol-20',
    date: '2026-12-31',
    name: 'Collective Leave: New Year\'s Eve',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'No annual leave deduction.'
  },
  {
    id: 'hol-21',
    date: '2027-01-01',
    name: 'New Year 2027',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Joint Ministerial Decree No. 1017/2025'
  }
];

export function readHolidays() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(HOLIDAY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // "Normal work day" was retired; keep those dates as a free company holiday.
          return parsed.map((h) => (h.treatment === 'not_applied' ? { ...h, treatment: 'free_leave' } : h));
        }
      }
      localStorage.setItem(HOLIDAY_STORAGE_KEY, JSON.stringify(INITIAL_HOLIDAYS_2026));
    }
  } catch { /* fallback */ }
  return INITIAL_HOLIDAYS_2026;
}

export function persistHolidays(holidays) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HOLIDAY_STORAGE_KEY, JSON.stringify(holidays));
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Calculates impact preview for a Cuti Bersama configuration.
 * By default, Cuti Bersama automatically applies to all departments and employees.
 * Shift-specific work schedules can be configured separately in the Work Schedule module.
 */
export function calculateHolidayImpact(holiday, employees = EMPLOYEES) {
  if (!holiday.isCutiBersama) {
    return {
      affectedEmployeesCount: 0,
      totalDaysDeducted: 0,
      sampleAffectedEmployees: [],
      affectedDeptNames: []
    };
  }

  const deptIds = getHolidayDepartmentIds(holiday);
  const matchedEmployees = deptIds ? employees.filter(emp => deptIds.includes(emp.departmentId)) : employees;

  const deptSet = new Set();
  matchedEmployees.forEach(emp => {
    const dept = DEPARTMENTS.find(d => d.id === emp.departmentId);
    if (dept) deptSet.add(dept.name);
  });

  const isDeduct = holiday.treatment === 'deduct_annual';
  return {
    affectedEmployeesCount: matchedEmployees.length,
    totalDaysDeducted: isDeduct ? matchedEmployees.length : 0,
    sampleAffectedEmployees: matchedEmployees.slice(0, 5),
    affectedDeptNames: Array.from(deptSet)
  };
}

// =========================================================================
// 3. EMPLOYEE BALANCES & TRANSACTION LEDGER MODEL
// =========================================================================

export const LEDGER_ENTRY_TYPES = [
  { value: 'entitlement', label: 'Entitlement' },
  { value: 'carry_over', label: 'Carry-over' },
  { value: 'leave_taken', label: 'Leave taken' },
  { value: 'cuti_bersama', label: 'Collective leave' },
  { value: 'adjustment', label: 'Adjustment' }
];

const LEAVE_SAMPLE_DATES = ['2026-02-10', '2026-04-14', '2026-05-20', '2026-06-23', '2026-07-14', '2026-08-10', '2026-09-08', '2026-10-06'];
const COLLECTIVE_SAMPLE_DAYS = [
  { date: '2026-02-18', label: 'Chinese New Year', refNo: 'CB-2026-SKB01' },
  { date: '2026-03-04', label: 'Nyepi Day', refNo: 'CB-2026-SKB02' }
];

// Sample overdrawn employees: days taken beyond what the balance covered (allowed up to the negative-balance limit).
const OVERDRAWN_DAYS = { 'emp-004': 3, 'emp-007': 1 };

function buildBaseBalances() {
  const year = 2026;
  return EMPLOYEES.map((emp, index) => {
    // Generate realistic initial balances based on seniority and department
    const isShiftWorker = ['dept-eng', 'dept-sec', 'dept-hk'].includes(emp.departmentId);
    const baseEntitlement = 12;
    const carryOver = index % 3 === 0 ? 3 : (index % 2 === 0 ? 2 : 0);
    const cutiBersamaDeduction = isShiftWorker ? 0 : 2; // Shift workers don't get auto cuti bersama deduction
    const overdrawn = OVERDRAWN_DAYS[emp.id] || 0;
    const usedLeave = overdrawn
      ? baseEntitlement + carryOver - cutiBersamaDeduction + overdrawn
      : (index * 2) % 6;
    const debtDays = 0;
    const available = baseEntitlement + carryOver - usedLeave - cutiBersamaDeduction;

    const ledger = [
      {
        id: `tx-${emp.id}-01`,
        date: '2026-01-01',
        type: 'entitlement',
        amount: baseEntitlement,
        balanceAfter: 0,
        description: 'Annual leave entitlement 2026',
        refNo: 'SYS-GRANT-2026',
        approvedBy: 'Auto System'
      }
    ];

    if (carryOver > 0) {
      ledger.push({
        id: `tx-${emp.id}-02`,
        date: '2026-01-01',
        type: 'carry_over',
        amount: carryOver,
        balanceAfter: 0,
        description: 'Carry-over from 2025 (expires 31 Mar 2026)',
        refNo: 'SYS-CARRY-2025',
        approvedBy: 'Auto System'
      });
    }

    // Leave is taken in several short requests over the year, so longer histories exist.
    let remaining = usedLeave;
    LEAVE_SAMPLE_DATES.forEach((date, step) => {
      if (remaining <= 0) return;
      const days = Math.min(remaining, step === LEAVE_SAMPLE_DATES.length - 1 ? remaining : 2);
      remaining -= days;
      ledger.push({
        id: `tx-${emp.id}-03-${step + 1}`,
        date,
        type: 'leave_taken',
        amount: -days,
        balanceAfter: 0,
        description: `Leave taken (${days} working ${days === 1 ? 'day' : 'days'})`,
        refNo: `LV-2026-${String(index + 10).padStart(3, '0')}-${step + 1}`,
        approvedBy: 'Sarah Jenkins (HR Mgr)'
      });
    });

    if (cutiBersamaDeduction > 0) {
      COLLECTIVE_SAMPLE_DAYS.slice(0, cutiBersamaDeduction).forEach((day, step) => {
        ledger.push({
          id: `tx-${emp.id}-04-${step + 1}`,
          date: day.date,
          type: 'cuti_bersama',
          amount: -1,
          balanceAfter: 0,
          description: `Collective leave deduction: ${day.label}`,
          refNo: day.refNo,
          approvedBy: 'HR Policy System'
        });
      });
    }

    // Date order (stable), with the running balance rebuilt from the entries themselves.
    let running = 0;
    ledger.sort((x, y) => x.date.localeCompare(y.date));
    ledger.forEach((entry) => {
      running += entry.amount;
      entry.balanceAfter = running;
    });

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      nik: emp.nik,
      departmentId: emp.departmentId,
      position: emp.position,
      avatar: emp.avatar,
      year,
      baseEntitlement,
      carryOver,
      carryOverExpiry: '2026-03-31',
      usedLeave,
      cutiBersamaDeduction,
      debtDays,
      adjustmentTotal: 0,
      available,
      ledger
    };
  });
}

export function readEmployeeBalances() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(BALANCE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch { /* fallback */ }
  const initial = createInitialBalances();
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(initial));
    }
  } catch { /* ignore */ }
  return initial;
}

export function persistEmployeeBalances(balances) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(balances));
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

// =========================================================================
// 4. BALANCE ADJUSTMENT WORKFLOW (KOREKSI SALDO & APPROVAL)
// =========================================================================

/**
 * Who has to approve an adjustment depends on who asked for it:
 * - HR or Building Service file it in this dashboard: the Building Manager (BM) approves.
 * - The employee files it themselves: HR approves first, then the BM.
 */
export const ADJUSTMENT_APPROVER_LABELS = { hr: 'HR', bm: 'Building Manager' };
export const ADJUSTMENT_REQUESTER_LABELS = { hr: 'HR', bs: 'Building Service', employee: 'Employee' };
/** Roles that can file a request from this dashboard. */
export const ADJUSTMENT_DASHBOARD_REQUESTERS = ['hr', 'bs'];
/** Stand-in people for each role until the dashboard has real logins. */
export const ADJUSTMENT_MOCK_REQUESTER_IDS = { hr: 'emp-014', bs: 'emp-011' };

export function buildApprovalChain(requesterRole) {
  const roles = requesterRole === 'employee' ? ['hr', 'bm'] : ['bm'];
  return roles.map((role) => ({ role, status: 'pending', reviewedAt: null, reviewNote: '' }));
}

/** First step still waiting for a decision, or null once the ticket is closed. */
export function getCurrentApprovalStep(ticket) {
  if (!ticket || ticket.status !== 'pending') return null;
  return (ticket.approvalChain || []).find((step) => step.status === 'pending') || null;
}

// Builds a sample ticket. `steps` lists [status, reviewedAt, reviewNote] per approval step, in order.
function sampleAdjustment({ id, employeeId, type, amount, before, requesterRole, requestedById, requestedAt, reasonNote, steps }) {
  const employee = EMPLOYEES.find((e) => e.id === employeeId);
  const requester = EMPLOYEES.find((e) => e.id === (requestedById || employeeId));
  const roles = buildApprovalChain(requesterRole).map((step) => step.role);
  const approvalChain = roles.map((role, index) => {
    const [status = 'pending', reviewedAt = null, reviewNote = ''] = steps[index] || [];
    return { role, status, reviewedAt, reviewNote };
  });
  const rejected = approvalChain.find((step) => step.status === 'rejected');
  const status = rejected ? 'rejected' : approvalChain.every((step) => step.status === 'approved') ? 'approved' : 'pending';
  const closing = rejected || (status === 'approved' ? approvalChain[approvalChain.length - 1] : null);

  return {
    id,
    employeeId,
    employeeName: employee?.name || employeeId,
    permitTypeId: 'permit-annual',
    permitName: 'Annual Leave',
    type,
    amount,
    reasonNote,
    beforeBalance: before,
    afterBalance: before + (type === 'add' ? amount : -amount),
    status,
    requestedAt,
    requestedBy: requester?.name || '',
    requestedById: requester?.id || null,
    requesterRole,
    approvalChain,
    reviewedAt: closing?.reviewedAt || null,
    reviewNote: closing?.reviewNote || ''
  };
}

const ADJUSTMENT_SEEDS = [
  sampleAdjustment({ id: 'adj-001', employeeId: 'emp-001', type: 'add', amount: 2, requesterRole: 'employee', requestedAt: '2026-10-21 14:30', reasonNote: 'Compensation for generator maintenance standby on New Year\'s Eve 2026.', steps: [['approved', '2026-10-22 09:40', 'Matches the overtime log.'], ['pending']] }),
  sampleAdjustment({ id: 'adj-002', employeeId: 'emp-003', type: 'deduct', amount: 1, requesterRole: 'hr', requestedById: 'emp-014', requestedAt: '2026-10-18 09:15', reasonNote: 'Correction of last month\'s over-credited accrual.', steps: [['approved', '2026-10-19 11:20', 'Approved per attendance audit.']] }),
  sampleAdjustment({ id: 'adj-003', employeeId: 'emp-002', type: 'add', amount: 1, requesterRole: 'employee', requestedAt: '2026-10-26 08:05', reasonNote: 'Worked the 17 Aug event setup but it was recorded as a normal day.', steps: [] }),
  sampleAdjustment({ id: 'adj-004', employeeId: 'emp-006', type: 'add', amount: 1, requesterRole: 'bs', requestedById: 'emp-011', requestedAt: '2026-10-27 07:50', reasonNote: 'Covered the lift breakdown call-out on a public holiday.', steps: [] }),
  sampleAdjustment({ id: 'adj-005', employeeId: 'emp-003', type: 'add', amount: 2, before: 10, requesterRole: 'employee', requestedAt: '2026-10-27 08:10', reasonNote: 'Worked two Sundays for the chiller replacement but the roster showed day off.', steps: [] }),
  sampleAdjustment({ id: 'adj-006', employeeId: 'emp-009', type: 'add', amount: 1, before: 9, requesterRole: 'hr', requestedById: 'emp-014', requestedAt: '2026-10-26 16:45', reasonNote: 'Public holiday shift on 17 Aug was not credited as comp-off.', steps: [] }),
  sampleAdjustment({ id: 'adj-007', employeeId: 'emp-010', type: 'add', amount: 1, before: 7, requesterRole: 'bs', requestedById: 'emp-011', requestedAt: '2026-10-26 13:20', reasonNote: 'Security patrol covered the evacuation drill outside shift hours.', steps: [] }),
  sampleAdjustment({ id: 'adj-008', employeeId: 'emp-016', type: 'deduct', amount: 1, before: 8, requesterRole: 'hr', requestedById: 'emp-014', requestedAt: '2026-10-25 11:05', reasonNote: 'Leave taken on 9 Oct was not deducted from the balance.', steps: [] }),
  sampleAdjustment({ id: 'adj-009', employeeId: 'emp-020', type: 'add', amount: 2, before: 11, requesterRole: 'employee', requestedAt: '2026-10-24 09:30', reasonNote: 'Overtime on the Independence Day event cleanup.', steps: [['approved', '2026-10-24 14:10', 'Matches the overtime log.']] }),
  sampleAdjustment({ id: 'adj-010', employeeId: 'emp-024', type: 'deduct', amount: 2, before: 9, requesterRole: 'hr', requestedById: 'emp-014', requestedAt: '2026-10-23 15:00', reasonNote: 'Duplicate carry-over credit after the system migration.', steps: [['approved', '2026-10-23 17:25', 'Confirmed against the migration report.']] }),
  sampleAdjustment({ id: 'adj-011', employeeId: 'emp-026', type: 'add', amount: 1, before: 6, requesterRole: 'bs', requestedById: 'emp-011', requestedAt: '2026-10-23 10:15', reasonNote: 'Handled the generator failure on a public holiday.', steps: [['approved', '2026-10-23 13:40', 'Approved. Please log the incident report.']] }),
  sampleAdjustment({ id: 'adj-012', employeeId: 'emp-030', type: 'add', amount: 3, before: 12, requesterRole: 'employee', requestedAt: '2026-10-22 08:50', reasonNote: 'Standby on three public holidays for the cooling tower overhaul.', steps: [['approved', '2026-10-22 10:20', 'Verified with the duty roster.'], ['approved', '2026-10-22 15:05', 'Approved.']] }),
  sampleAdjustment({ id: 'adj-013', employeeId: 'emp-017', type: 'add', amount: 2, before: 8, requesterRole: 'employee', requestedAt: '2026-10-21 17:20', reasonNote: 'Extra leave requested as compensation for the tenant event weekend.', steps: [['rejected', '2026-10-22 09:00', 'No overtime record for those dates.']] }),
  sampleAdjustment({ id: 'adj-014', employeeId: 'emp-018', type: 'deduct', amount: 1, before: 10, requesterRole: 'hr', requestedById: 'emp-014', requestedAt: '2026-10-20 14:30', reasonNote: 'Half-day leave counted twice by the attendance system.', steps: [['rejected', '2026-10-20 16:50', 'Attendance log shows two separate half days. No correction needed.']] }),
  sampleAdjustment({ id: 'adj-015', employeeId: 'emp-022', type: 'add', amount: 1, before: 9, requesterRole: 'bs', requestedById: 'emp-011', requestedAt: '2026-10-19 09:05', reasonNote: 'Emergency elevator rescue call-out on a Saturday.', steps: [['approved', '2026-10-19 11:30', 'Approved.']] }),
  sampleAdjustment({ id: 'adj-016', employeeId: 'emp-025', type: 'deduct', amount: 2, before: 7, requesterRole: 'employee', requestedAt: '2026-10-18 12:40', reasonNote: 'Requesting a correction because last year\'s carry-over was credited twice.', steps: [['approved', '2026-10-18 15:00', 'Confirmed with payroll.'], ['pending']] }),
  sampleAdjustment({ id: 'adj-017', employeeId: 'emp-027', type: 'add', amount: 1, before: 5, requesterRole: 'hr', requestedById: 'emp-014', requestedAt: '2026-10-17 10:25', reasonNote: 'Probation end date was entered a month late, so one day of accrual is missing.', steps: [['approved', '2026-10-17 13:15', 'Approved per HR records.']] }),
  sampleAdjustment({ id: 'adj-018', employeeId: 'emp-029', type: 'add', amount: 2, before: 8, requesterRole: 'employee', requestedAt: '2026-10-16 08:25', reasonNote: 'Worked both days of the tenant relocation over the long weekend.', steps: [['approved', '2026-10-16 11:00', 'Matches the attendance record.'], ['rejected', '2026-10-16 16:30', 'The relocation was already compensated with overtime pay.']] })
];

// Approved tickets are applied in the order they were approved, so the balance each ticket shows
// is the same one the employee's ledger reaches. Open or rejected tickets start from today's balance.
function settleSampleAdjustments(seeds) {
  const running = new Map(buildBaseBalances().map((item) => [item.employeeId, item.available]));
  const byApproval = seeds
    .filter((ticket) => ticket.status === 'approved')
    .sort((a, b) => (a.reviewedAt || '').localeCompare(b.reviewedAt || ''));
  const settled = new Map();

  byApproval.forEach((ticket) => {
    const before = running.get(ticket.employeeId);
    const after = before + (ticket.type === 'add' ? ticket.amount : -ticket.amount);
    running.set(ticket.employeeId, after);
    settled.set(ticket.id, { before, after });
  });

  return seeds.map((ticket) => {
    const done = settled.get(ticket.id);
    const before = done ? done.before : running.get(ticket.employeeId);
    const after = done ? done.after : before + (ticket.type === 'add' ? ticket.amount : -ticket.amount);
    return { ...ticket, beforeBalance: before, afterBalance: after };
  });
}

// Newest first, the way tickets are listed once new ones are added.
export const INITIAL_ADJUSTMENTS = settleSampleAdjustments(ADJUSTMENT_SEEDS)
  .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

/** Adds each approved adjustment to the employee's ledger and rebuilds the running balance in date order. */
function applyAdjustmentsToBalances(balances, tickets) {
  return balances.map((item) => {
    const mine = tickets.filter((ticket) => ticket.status === 'approved' && ticket.employeeId === item.employeeId);
    if (mine.length === 0) return item;

    const entries = mine.map((ticket) => {
      const last = ticket.approvalChain[ticket.approvalChain.length - 1];
      return {
        id: `tx-${ticket.id}`,
        date: (last.reviewedAt || ticket.requestedAt).slice(0, 10),
        type: 'adjustment',
        amount: ticket.type === 'add' ? ticket.amount : -ticket.amount,
        balanceAfter: 0,
        description: `Manual adjustment: ${ticket.reasonNote}`,
        refNo: ticket.id.toUpperCase(),
        ticketId: ticket.id,
        requestedBy: ticket.requestedBy,
        approvedBy: ticket.approvalChain.map((step) => ADJUSTMENT_APPROVER_LABELS[step.role]).join(' & ')
      };
    });

    // Stable sort keeps same-day entries in the order they were created.
    let running = 0;
    const ledger = [...item.ledger, ...entries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => {
        running += entry.amount;
        return { ...entry, balanceAfter: running };
      });

    return {
      ...item,
      adjustmentTotal: entries.reduce((sum, entry) => sum + entry.amount, 0),
      available: running,
      ledger
    };
  });
}

export function createInitialBalances() {
  return applyAdjustmentsToBalances(buildBaseBalances(), INITIAL_ADJUSTMENTS);
}

export function readAdjustments() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(ADJUSTMENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(ADJUSTMENT_STORAGE_KEY, JSON.stringify(INITIAL_ADJUSTMENTS));
    }
  } catch { /* fallback */ }
  return INITIAL_ADJUSTMENTS;
}

export function persistAdjustments(adjustments) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADJUSTMENT_STORAGE_KEY, JSON.stringify(adjustments));
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
