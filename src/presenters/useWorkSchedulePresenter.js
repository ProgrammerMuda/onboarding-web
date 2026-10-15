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
  OFF_SHIFT
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

  return {
    // Live data
    shiftTypes,
    allShiftsWithOff: useMemo(() => [OFF_SHIFT, ...shiftTypes], [shiftTypes]),
    schedules,
    departments: DEPARTMENTS,
    filteredEmployees,
    weekDates,
    referenceDate,

    // Filters & Navigation
    selectedDepartment,
    setSelectedDepartment,
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

    successModal,
    closeSuccessModal,
    syncShiftTypes
  };
}
