import { useState, useCallback, useMemo } from 'react';
import { 
  INITIAL_SHIFT_TYPES, 
  SHIFT_STORAGE_KEY, 
  validateShiftType,
  calculateWorkHours,
  detectPeriodFromTime
} from '../models/ShiftTypeModel';

export function useShiftTypePresenter() {
  const [shifts, setShifts] = useState(() => {
    try {
      const raw = localStorage.getItem(SHIFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s) => ({
            ...s,
            name: s.name ? s.name.replace(/\s*\([^)]*\)/g, '').trim() : s.name
          }));
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_SHIFT_TYPES;
  });

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  const [draft, setDraft] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [successModal, setSuccessModal] = useState(null);

  const persist = useCallback((next) => {
    try {
      localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(next));
      setShifts(next);
      setError('');
      return true;
    } catch {
      setError('Changes could not be saved to browser storage.');
      return false;
    }
  }, []);

  const closeSuccessModal = useCallback(() => {
    setSuccessModal(null);
  }, []);

  // Filter shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || (
        (shift.name && shift.name.toLowerCase().includes(q)) ||
        (shift.code && shift.code.toLowerCase().includes(q)) ||
        (shift.description && shift.description.toLowerCase().includes(q)) ||
        (shift.departments && shift.departments.some((d) => d.toLowerCase().includes(q)))
      );

      const matchesPeriod = periodFilter === 'all' || shift.period === periodFilter;
      const matchesDept = departmentFilter === 'all' || (shift.departments && shift.departments.includes(departmentFilter));

      return matchesQuery && matchesPeriod && matchesDept;
    });
  }, [shifts, query, periodFilter, departmentFilter]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredShifts.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedShifts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShifts.slice(start, start + pageSize);
  }, [filteredShifts, currentPage, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const total = shifts.length;
    const uniqueDepts = new Set(shifts.flatMap((s) => s.departments || [])).size;
    const avgHours = total > 0 
      ? (shifts.reduce((acc, s) => acc + (Number(s.workHours) || 0), 0) / total).toFixed(1)
      : '0.0';
    const overnightCount = shifts.filter((s) => s.period === 'malam').length;

    return {
      total,
      uniqueDepts,
      avgHours,
      overnightCount
    };
  }, [shifts]);

  const openEditor = useCallback((shift = null) => {
    setError('');
    if (shift) {
      setDraft({ ...shift });
    } else {
      setDraft({
        name: '',
        code: '',
        period: 'pagi',
        checkIn: '08:00',
        checkOut: '17:00',
        breakMinutes: 0,
        workHours: 9,
        departments: ['ENG'],
        color: '#002B7F',
        description: '',
        isActive: true
      });
    }
  }, []);

  const closeEditor = useCallback(() => {
    setDraft(null);
    setError('');
  }, []);

  const updateDraftField = useCallback((field, value) => {
    setDraft((prev) => {
      if (!prev) return null;
      const next = { ...prev, [field]: value };
      
      // If checkIn or checkOut changes, auto-recalculate workHours
      if (field === 'checkIn' || field === 'checkOut') {
        const inTime = field === 'checkIn' ? value : prev.checkIn;
        const outTime = field === 'checkOut' ? value : prev.checkOut;
        next.workHours = calculateWorkHours(inTime, outTime);

        // Auto-detect shift period (Morning, Afternoon, Evening, Night) based on Check In time
        if (field === 'checkIn') {
          next.period = detectPeriodFromTime(value);
        }
      }
      return next;
    });
  }, []);

  const toggleDraftDepartment = useCallback((deptCode) => {
    setDraft((prev) => {
      if (!prev) return null;
      const exists = prev.departments.includes(deptCode);
      const updated = exists 
        ? prev.departments.filter((d) => d !== deptCode)
        : [...prev.departments, deptCode];
      return { ...prev, departments: updated };
    });
  }, []);

  const save = useCallback(() => {
    if (!draft) return;
    const validation = validateShiftType(draft, shifts);
    if (validation) {
      setError(validation);
      return;
    }

    const isEdit = Boolean(draft.id);
    const item = {
      ...draft,
      id: draft.id || `s-${Date.now()}`,
      name: draft.name.trim(),
      code: draft.code.trim().toUpperCase(),
      workHours: Number(draft.workHours) || calculateWorkHours(draft.checkIn, draft.checkOut, draft.breakMinutes),
      description: (draft.description || '').trim(),
      isActive: draft.isActive !== false
    };

    const next = isEdit 
      ? shifts.map((s) => s.id === draft.id ? item : s)
      : [...shifts, item];

    if (persist(next)) {
      setDraft(null);
      setSuccessModal({
        title: isEdit ? 'Shift Type Updated Successfully!' : 'Shift Type Added Successfully!',
        subtext: isEdit 
          ? `Changes to “${item.name}” (${item.code}) have been saved. Schedule rosters and staff duty calculations are now live.`
          : `“${item.name}” (${item.code}) has been successfully created. Departments can now assign employees to this shift.`
      });
    }
  }, [draft, shifts, persist]);

  const requestDelete = useCallback((shift) => {
    setError('');
    setDeleteTarget(shift);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteTarget(null);
    setError('');
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const targetName = deleteTarget.name;
    const next = shifts.filter((s) => s.id !== deleteTarget.id);
    if (persist(next)) {
      setDeleteTarget(null);
      setSuccessModal({
        title: 'Shift Type Deleted',
        subtext: `Shift type “${targetName}” has been removed from the system. Active duty rosters have been updated.`
      });
    }
  }, [deleteTarget, shifts, persist]);

  const resetAllToDefaults = useCallback(() => {
    if (persist(INITIAL_SHIFT_TYPES)) {
      setSuccessModal({
        title: 'Shift Types Reset to Default',
        subtext: 'The default shift type templates and operational schedules have been restored.'
      });
    }
  }, [persist]);

  return {
    shifts,
    filteredShifts,
    paginatedShifts,
    currentPage,
    totalPages,
    pageSize,
    stats,
    query,
    periodFilter,
    departmentFilter,
    draft,
    deleteTarget,
    error,
    successModal,
    setQuery(val) { setQuery(val); setPage(1); },
    setPeriodFilter(val) { setPeriodFilter(val); setPage(1); },
    setDepartmentFilter(val) { setDepartmentFilter(val); setPage(1); },
    setCurrentPage(val) {
      if (Number.isInteger(val)) setPage(Math.max(1, Math.min(val, totalPages)));
    },
    openEditor,
    closeEditor,
    updateDraftField,
    toggleDraftDepartment,
    save,
    requestDelete,
    closeDeleteModal,
    confirmDelete,
    closeSuccessModal,
    resetAllToDefaults
  };
}
