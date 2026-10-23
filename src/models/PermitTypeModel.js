/**
 * PermitTypeModel.js - Model Layer
 * Manages Permit / Leave policy definitions, National Holiday & Cuti Bersama configurations,
 * and Employee Leave Balances with full Transaction Ledger and Adjustments.
 */

import { EMPLOYEES, DEPARTMENTS } from './ApprovalFlowModel';

export const PERMIT_STORAGE_KEY = 'proapps.permit-types.v2';
export const HOLIDAY_STORAGE_KEY = 'proapps.leave-holidays.v1';
export const BALANCE_STORAGE_KEY = 'proapps.leave-balances.v1';
export const ADJUSTMENT_STORAGE_KEY = 'proapps.leave-adjustments.v1';

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
  { value: 'deduct_annual', label: 'Libur & Potong Saldo Cuti Tahunan', badge: 'Deduct Annual', color: '#002B7F', bg: '#EFF6FF' },
  { value: 'free_leave', label: 'Libur Perusahaan (Free / Tidak Potong Saldo)', badge: 'Free Company Leave', color: '#10B981', bg: '#ECFDF5' },
  { value: 'not_applied', label: 'Tidak Diterapkan (Hari Kerja Normal)', badge: 'Normal Work Day', color: '#64748B', bg: '#F8FAFC' },
];

export const SCOPE_OPTIONS = [
  { value: 'all', label: 'Semua Karyawan (Seluruh Divisi & Lokasi)' },
  { value: 'head_office', label: 'Head Office Only (Non-Shift Staff)' },
  { value: 'site_operations', label: 'Site Operations & Building Management' },
  { value: 'custom_dept', label: 'Departemen Tertentu (Pilih Divisi)' }
];

export const INITIAL_HOLIDAYS_2026 = [
  {
    id: 'hol-01',
    date: '2026-01-01',
    name: 'Tahun Baru 2026 Masehi',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'SKB 3 Menteri No. 1017/2025'
  },
  {
    id: 'hol-02',
    date: '2026-01-16',
    name: 'Isra Mi\'raj Nabi Muhammad SAW',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'SKB 3 Menteri No. 1017/2025'
  },
  {
    id: 'hol-03',
    date: '2026-02-17',
    name: 'Tahun Baru Imlek 2577 Kongzili',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'SKB 3 Menteri No. 1017/2025'
  },
  {
    id: 'hol-04',
    date: '2026-02-18',
    name: 'Cuti Bersama Tahun Baru Imlek',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'Cuti bersama otomatis berlaku untuk seluruh departemen.'
  },
  {
    id: 'hol-05',
    date: '2026-03-03',
    name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'SKB 3 Menteri No. 1017/2025'
  },
  {
    id: 'hol-06',
    date: '2026-03-04',
    name: 'Cuti Bersama Hari Suci Nyepi',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'Cuti bersama otomatis berlaku untuk seluruh departemen.'
  },
  {
    id: 'hol-07',
    date: '2026-03-20',
    name: 'Hari Raya Idul Fitri 1447 H (Hari ke-1)',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'SKB 3 Menteri No. 1017/2025'
  },
  {
    id: 'hol-08',
    date: '2026-03-21',
    name: 'Hari Raya Idul Fitri 1447 H (Hari ke-2)',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'SKB 3 Menteri No. 1017/2025'
  },
  {
    id: 'hol-09',
    date: '2026-03-23',
    name: 'Cuti Bersama Hari Raya Idul Fitri 1447 H',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'Seluruh unit menerapkan cuti bersama memotong jatah tahunan.'
  },
  {
    id: 'hol-10',
    date: '2026-03-24',
    name: 'Cuti Bersama Hari Raya Idul Fitri 1447 H',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'Seluruh unit menerapkan cuti bersama memotong jatah tahunan.'
  },
  {
    id: 'hol-11',
    date: '2026-05-01',
    name: 'Hari Buruh Internasional',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'SKB 3 Menteri No. 1017/2025'
  },
  {
    id: 'hol-12',
    date: '2026-05-14',
    name: 'Kenaikan Yesus Kristus',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'SKB 3 Menteri No. 1017/2025'
  },
  {
    id: 'hol-13',
    date: '2026-05-15',
    name: 'Cuti Bersama Kenaikan Yesus Kristus',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'not_applied',
    scope: 'all',
    scopeValue: [],
    note: 'Perusahaan beroperasi normal, staf operasional & kantor tetap masuk.'
  },
  {
    id: 'hol-14',
    date: '2026-08-17',
    name: 'Hari Kemerdekaan Republik Indonesia Ke-81',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'Hari Nasional Republik Indonesia'
  },
  {
    id: 'hol-15',
    date: '2026-12-25',
    name: 'Hari Raya Natal',
    type: 'national_holiday',
    isCutiBersama: false,
    treatment: 'free_leave',
    scope: 'all',
    scopeValue: [],
    note: 'SKB 3 Menteri No. 1017/2025'
  },
  {
    id: 'hol-16',
    date: '2026-12-26',
    name: 'Cuti Bersama Hari Raya Natal',
    type: 'cuti_bersama',
    isCutiBersama: true,
    treatment: 'deduct_annual',
    scope: 'all',
    scopeValue: [],
    note: 'Cuti bersama otomatis berlaku untuk seluruh departemen.'
  }
];

export function readHolidays() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(HOLIDAY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
  if (!holiday.isCutiBersama || holiday.treatment === 'not_applied') {
    return {
      affectedEmployeesCount: 0,
      totalDaysDeducted: 0,
      sampleAffectedEmployees: [],
      affectedDeptNames: []
    };
  }

  // Automatically applies to all employees and all departments
  const matchedEmployees = employees;

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

export function createInitialBalances() {
  const year = 2026;
  return EMPLOYEES.map((emp, index) => {
    // Generate realistic initial balances based on seniority and department
    const isShiftWorker = ['dept-eng', 'dept-sec', 'dept-hk'].includes(emp.departmentId);
    const baseEntitlement = 12;
    const carryOver = index % 3 === 0 ? 3 : (index % 2 === 0 ? 2 : 0);
    const usedLeave = (index * 2) % 6;
    const cutiBersamaDeduction = isShiftWorker ? 0 : 2; // Shift workers don't get auto cuti bersama deduction
    const debtDays = 0;
    const available = baseEntitlement + carryOver - usedLeave - cutiBersamaDeduction;

    const ledger = [
      {
        id: `tx-${emp.id}-01`,
        date: '2026-01-01',
        type: 'entitlement',
        amount: baseEntitlement,
        balanceAfter: baseEntitlement,
        description: 'Jatah Cuti Tahunan Periode 2026 (Annual Entitlement Grant)',
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
        balanceAfter: baseEntitlement + carryOver,
        description: `Carry-over Saldo Cuti 2025 (Kedaluwarsa 31 Mar 2026)`,
        refNo: 'SYS-CARRY-2025',
        approvedBy: 'Auto System'
      });
    }

    if (usedLeave > 0) {
      ledger.push({
        id: `tx-${emp.id}-03`,
        date: '2026-02-10',
        type: 'leave_taken',
        amount: -usedLeave,
        balanceAfter: baseEntitlement + carryOver - usedLeave,
        description: `Pengajuan Cuti Pribadi (${usedLeave} hari kerja)`,
        refNo: `LV-2026-0${index + 10}`,
        approvedBy: 'Sarah Jenkins (HR Mgr)'
      });
    }

    if (cutiBersamaDeduction > 0) {
      ledger.push({
        id: `tx-${emp.id}-04`,
        date: '2026-02-18',
        type: 'cuti_bersama',
        amount: -cutiBersamaDeduction,
        balanceAfter: available,
        description: `Pemotongan Otomatis Cuti Bersama Tahun Baru Imlek & Nyepi`,
        refNo: 'CB-2026-SKB01',
        approvedBy: 'HR Policy System'
      });
    }

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

export const ADJUSTMENT_REASON_CATEGORIES = [
  { value: 'system_error', label: 'Koreksi Kesalahan Sistem Absensi / Kuota' },
  { value: 'overtime_compensation', label: 'Kompensasi Lembur Hari Libur (Comp-Off)' },
  { value: 'attendance_dispute', label: 'Penyelesaian Sengketa Kehadiran Karyawan' },
  { value: 'management_policy', label: 'Dispensasi / Kebijakan Khusus Direksi' },
  { value: 'probation_adjustment', label: 'Penyesuaian Tanggal Efektif Karyawan Tetap' }
];

export const INITIAL_ADJUSTMENTS = [
  {
    id: 'adj-001',
    employeeId: 'emp-001',
    employeeName: 'Budi Hartono',
    permitTypeId: 'permit-annual',
    permitName: 'Cuti Tahunan (Annual Leave)',
    type: 'add',
    amount: 2,
    reasonCategory: 'overtime_compensation',
    reasonCategoryLabel: 'Kompensasi Lembur Hari Libur (Comp-Off)',
    reasonNote: 'Kompensasi standby maintenance genset pada malam Tahun Baru 2026.',
    beforeBalance: 10,
    afterBalance: 12,
    status: 'pending',
    requestedAt: '2026-10-21 14:30 WIB',
    requestedBy: 'Ahmad Fauzi (Supervisor)',
    approverRole: 'HR Manager',
    approverName: 'Sarah Jenkins',
    reviewedAt: null,
    reviewNote: ''
  },
  {
    id: 'adj-002',
    employeeId: 'emp-003',
    employeeName: 'Ahmad Fauzi',
    permitTypeId: 'permit-annual',
    permitName: 'Cuti Tahunan (Annual Leave)',
    type: 'deduct',
    amount: 1,
    reasonCategory: 'system_error',
    reasonCategoryLabel: 'Koreksi Kesalahan Sistem Absensi / Kuota',
    reasonNote: 'Revisi kelebihan kredit akrual masa kerja bulan lalu.',
    beforeBalance: 14,
    afterBalance: 13,
    status: 'approved',
    requestedAt: '2026-10-18 09:15 WIB',
    requestedBy: 'HR Specialist',
    approverRole: 'HR Manager',
    approverName: 'Sarah Jenkins',
    reviewedAt: '2026-10-19 11:20 WIB',
    reviewNote: 'Approved sesuai audit absensi.'
  }
];

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
