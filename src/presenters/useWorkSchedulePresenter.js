/**
 * useWorkSchedulePresenter.js - Presenter Layer (MVP)
 * Connects Work Schedule roster state with live Shift Types, employee directories, and CRUD operations.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  readWorkSchedules,
  persistWorkSchedules,
  formatDateKey,
  getWeekDates,
  resolveShift,
  setEmployeeShift,
  bulkAssignEmployeeShifts,
  calculateEmployeeWeekStats,
  calculateRosterSummary,
  OFF_SHIFT,
  HOLIDAY_SHIFT,
  CUTI_BERSAMA_SHIFT
} from '../models/WorkScheduleModel';
import { readShiftTypes, SHIFT_STORAGE_KEY } from '../models/ShiftTypeModel';
import { EMPLOYEES, DEPARTMENTS } from '../models/ApprovalFlowModel';

export function useWorkSchedulePresenter() {
  // 1. Live connected Shift Types
  const [shiftTypes, setShiftTypes] = useState(readShiftTypes);

  // Re-sync shift types if localStorage changes or on mount
  const syncShiftTypes = useCallback(() => {
    setShiftTypes(readShiftTypes());
  }, []);

  useEffect(() => {
    syncShiftTypes();
    const handleStorage = (e) => {
      if (e.key === SHIFT_STORAGE_KEY) {
        syncShiftTypes();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncShiftTypes]);

  // 2. Schedule records map
  const [schedules, setSchedules] = useState(readWorkSchedules);

  // 3. Navigation Date State (defaults to current date's week)
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  // 4. Filters & Search
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'

  // 5. Modals State
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    employee: null,
    date: null,
    currentShiftId: 'off',
    note: ''
  });

  const [bulkModal, setBulkModal] = useState({
    isOpen: false,
    departmentId: 'all',
    selectedEmployeeIds: [],
    startDate: '',
    endDate: '',
    shiftTypeId: ''
  });

  const [successModal, setSuccessModal] = useState(null);

  // Calculate 7 days for current week
  const weekDates = useMemo(() => {
    return getWeekDates(referenceDate);
  }, [referenceDate]);

  // Date Navigation
  const prevWeek = useCallback(() => {
    setReferenceDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const nextWeek = useCallback(() => {
    setReferenceDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setReferenceDate(new Date());
  }, []);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return EMPLOYEES.filter((emp) => {
      const matchesDept = selectedDepartment === 'all' || emp.departmentId === selectedDepartment;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q || (
        emp.name.toLowerCase().includes(q) ||
        (emp.nik && emp.nik.toLowerCase().includes(q)) ||
        (emp.position && emp.position.toLowerCase().includes(q))
      );
      return matchesDept && matchesQuery;
    });
  }, [selectedDepartment, searchQuery]);

  // Overall Weekly Summary
  const rosterSummary = useMemo(() => {
    return calculateRosterSummary(weekDates, filteredEmployees, schedules, shiftTypes);
  }, [weekDates, filteredEmployees, schedules, shiftTypes]);

  // Per-Employee stats lookup helper
  const getEmployeeStats = useCallback((employeeId) => {
    return calculateEmployeeWeekStats(employeeId, weekDates, schedules, shiftTypes);
  }, [weekDates, schedules, shiftTypes]);

  // Single Shift Assignment Dialog
  const openAssignModal = useCallback((employee, dateObj) => {
    const dStr = formatDateKey(dateObj);
    const key = `${employee.id}_${dStr}`;
    const currentEntry = schedules[key];

    setAssignModal({
      isOpen: true,
      employee,
      date: dateObj,
      currentShiftId: currentEntry?.shiftTypeId || 'off',
      note: currentEntry?.note || ''
    });
  }, [schedules]);

  const closeAssignModal = useCallback(() => {
    setAssignModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const saveAssignShift = useCallback((shiftTypeId, note = '') => {
    if (!assignModal.employee || !assignModal.date) return;

    const dStr = formatDateKey(assignModal.date);
    const next = setEmployeeShift(schedules, assignModal.employee.id, dStr, shiftTypeId, note);
    setSchedules(next);
    persistWorkSchedules(next);
    closeAssignModal();

    const shift = resolveShift(shiftTypeId, shiftTypes);
    setSuccessModal({
      title: 'Shift Scheduled Successfully!',
      subtext: `Assigned "${shift.name}" (${shift.code}) to ${assignModal.employee.name} for ${dStr}.`
    });
  }, [assignModal, schedules, shiftTypes, closeAssignModal]);

  // Bulk Assignment Dialog
  const openBulkModal = useCallback(() => {
    const startStr = formatDateKey(weekDates[0]);
    const endStr = formatDateKey(weekDates[6]);

    setBulkModal({
      isOpen: true,
      departmentId: selectedDepartment === 'all' ? 'dept-eng' : selectedDepartment,
      selectedEmployeeIds: filteredEmployees.slice(0, 5).map((e) => e.id),
      startDate: startStr,
      endDate: endStr,
      shiftTypeId: shiftTypes[0]?.id || 's-1'
    });
  }, [weekDates, selectedDepartment, filteredEmployees, shiftTypes]);

  const closeBulkModal = useCallback(() => {
    setBulkModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const saveBulkAssign = useCallback((employeeIds, startDateStr, endDateStr, shiftTypeId) => {
    if (!employeeIds.length || !startDateStr || !endDateStr || !shiftTypeId) return;

    // Generate date array from startDate to endDate
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const dateStrings = [];
    const curr = new Date(start);

    while (curr <= end) {
      dateStrings.push(formatDateKey(curr));
      curr.setDate(curr.getDate() + 1);
    }

    const next = bulkAssignEmployeeShifts(schedules, employeeIds, dateStrings, shiftTypeId);
    setSchedules(next);
    persistWorkSchedules(next);
    closeBulkModal();

    const shift = resolveShift(shiftTypeId, shiftTypes);
    setSuccessModal({
      title: 'Bulk Shifts Applied!',
      subtext: `Applied "${shift.name}" (${shift.code}) for ${employeeIds.length} staff across ${dateStrings.length} days.`
    });
  }, [schedules, shiftTypes, closeBulkModal]);

  const closeSuccessModal = useCallback(() => {
    setSuccessModal(null);
  }, []);

  const validateScheduleImport = (text) => {
    const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
    if (lines.shift()?.trim() !== 'employee_id,date,shift_code' || !lines.length) {
      throw new Error('Gunakan template CSV dengan kolom employee_id,date,shift_code dan isi minimal satu jadwal.');
    }
    const availableShifts = [OFF_SHIFT, ...shiftTypes];
    const seen = new Set();
    const rows = lines.map((line, index) => {
      const [employeeId, date, code, extra] = line.split(',').map((value) => value.trim());
      const shift = availableShifts.find((item) => item.code === code);
      const parsedDate = new Date(`${date}T00:00:00`);
      const key = `${employeeId}_${date}`;
      if (extra !== undefined || !EMPLOYEES.some((emp) => emp.id === employeeId)
        || !shift || !/^\d{4}-\d{2}-\d{2}$/.test(date)
        || Number.isNaN(parsedDate.getTime()) || formatDateKey(parsedDate) !== date || seen.has(key)) {
        throw new Error(`Baris ${index + 2}: periksa ID karyawan, tanggal, kode shift, atau jadwal duplikat.`);
      }
      seen.add(key);
      return { employeeId, date, shift };
    });
    return rows;
  };

  const importSchedules = (text) => {
    const rows = validateScheduleImport(text);
    let next = schedules;
    rows.forEach(({ employeeId, date, shift }) => {
      next = setEmployeeShift(next, employeeId, date, shift.id);
    });
    persistWorkSchedules(next);
    setSchedules(next);
    setSuccessModal({ title: 'Schedules Imported', subtext: `${rows.length} schedules imported successfully.` });
  };

  return {
    // Live data
    shiftTypes,
    allShiftsWithOff: useMemo(() => [OFF_SHIFT, HOLIDAY_SHIFT, CUTI_BERSAMA_SHIFT, ...shiftTypes], [shiftTypes]),
    schedules,
    departments: DEPARTMENTS,
    employees: EMPLOYEES,
    filteredEmployees,
    weekDates,
    referenceDate,
    setReferenceDate,

    // Filters & Navigation
    selectedDepartment,
    setSelectedDepartment,
    selectedShift,
    setSelectedShift,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    prevWeek,
    nextWeek,
    goToToday,

    // Roster Helpers
    resolveShift: useCallback((shiftId) => resolveShift(shiftId, shiftTypes), [shiftTypes]),
    getEmployeeStats,
    rosterSummary,

    // Modals
    assignModal,
    openAssignModal,
    closeAssignModal,
    saveAssignShift,

    bulkModal,
    setBulkModal,
    openBulkModal,
    closeBulkModal,
    saveBulkAssign,
    importSchedules,
    validateScheduleImport,

    successModal,
    closeSuccessModal,
    syncShiftTypes
  };
}
