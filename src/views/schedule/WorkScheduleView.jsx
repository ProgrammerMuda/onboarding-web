import React, { useState } from 'react';
import {
  CalendarCheck,
  CalendarDots,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Plus,
  Clock,
  UsersThree,
  User,
  CheckCircle,
  X,
  Info,
  Briefcase,
  Export,
  FileXls,
  FileArrowUp,
  FileArrowDown,
  UploadSimple,
  Trash,
  PencilSimple,
  LockSimple,
  Table,
  GridFour,
  CaretDown,
  Eye,
  WarningCircle,
  Sun,
  SunHorizon,
  Moon,
  Coffee,
  CalendarStar,
  ArrowLeft
} from '@phosphor-icons/react';
import { formatDateKey, getEmployeeShiftForDate, calculateEmployeeWeekStats } from '../../models/WorkScheduleModel';
import { getResolvedDivisions } from '../../models/EmployeeModel';
import { Breadcrumb } from '../components/Breadcrumb';
import '../employee/employee.css';
import './work-schedule.css';
import { buildScheduleWorkbook, protectScheduleWorkbook, scheduleWorkbookToCsv } from '../../utils/workScheduleExcel';
import { downloadWorkbook } from '../../utils/excelExport';

/**
 * Determine period badge metadata (icon, label, colors) based on shift clock-in time and period.
 */
function getShiftPeriodInfo(shift, isOff) {
  if (shift?.id === 'off-cuti-bersama' || shift?.offType === 'cuti_bersama') {
    return {
      label: 'Collective Leave',
      Icon: CalendarStar,
      bg: '#EFF6FF',
      color: '#1E40AF',
      border: '#BFDBFE',
      isHoliday: true
    };
  }

  if (shift?.id === 'off-holiday' || shift?.offType === 'holiday') {
    return {
      label: 'National Holiday',
      Icon: CalendarStar,
      bg: '#FEE2E2',
      color: '#B91C1C',
      border: '#FECDD3',
      isHoliday: true
    };
  }

  if (isOff || shift?.id === 'off') {
    return {
      label: 'Off',
      Icon: Coffee,
      bg: '#F1F5F9',
      color: '#475569',
      border: '#E2E8F0',
      isOffDay: true
    };
  }

  const checkIn = shift?.checkIn || '';
  const [hStr] = checkIn.split(':');
  const h = parseInt(hStr, 10);

  let period = shift?.period;
  if (!period && !isNaN(h)) {
    if (h >= 5 && h < 12) period = 'pagi';
    else if (h >= 12 && h < 19) period = 'siang';
    else period = 'malam';
  }

  if (period === 'pagi' || (!isNaN(h) && h >= 5 && h < 12)) {
    return {
      label: 'Morning',
      Icon: Sun,
      bg: '#FEF3C7',
      color: '#B45309',
      border: 'rgba(217, 119, 6, 0.25)'
    };
  }

  if (period === 'siang' || period === 'sore' || (!isNaN(h) && h >= 12 && h < 19)) {
    return {
      label: 'Afternoon',
      Icon: SunHorizon,
      bg: '#FFEDD5',
      color: '#C2410C',
      border: 'rgba(194, 65, 12, 0.25)'
    };
  }

  return {
    label: 'Night',
    Icon: Moon,
    bg: '#EEF2FF',
    color: '#4338CA',
    border: 'rgba(67, 56, 202, 0.25)'
  };
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

const CAL_MONTH_NAMES = [
  { short: 'Jan', full: 'January' },
  { short: 'Feb', full: 'February' },
  { short: 'Mar', full: 'March' },
  { short: 'Apr', full: 'April' },
  { short: 'May', full: 'May' },
  { short: 'Jun', full: 'June' },
  { short: 'Jul', full: 'July' },
  { short: 'Aug', full: 'August' },
  { short: 'Sep', full: 'September' },
  { short: 'Oct', full: 'October' },
  { short: 'Nov', full: 'November' },
  { short: 'Dec', full: 'December' }
];

/**
 * Format employee position/jabatan clearly and consistently.
 */
function getEmployeeJabatan(emp, deptName) {
  if (!emp) return 'Staff';
  if (emp.position) {
    if (!['Building Management', 'Tenant Relation', 'Engineering', 'Finance', 'HRD', 'Housekeeping', 'Security', 'Building Service', 'Management'].includes(emp.position)) {
      return emp.position;
    }
    const rolePrefix = emp.roleId === 'role-mgr' ? 'Manager'
      : emp.roleId === 'role-head' ? 'Chief'
      : emp.roleId === 'role-dir' ? 'Director'
      : emp.roleId === 'role-spv' ? 'Supervisor'
      : 'Staff';
    if (emp.position === 'Building Management') {
      return emp.roleId === 'role-mgr' || emp.roleId === 'role-head' ? 'Building Manager' : `${rolePrefix} Building Management`;
    }
    if (emp.position === 'Management') {
      return 'Director / Management';
    }
    return `${rolePrefix} ${emp.position}`;
  }
  return deptName || 'Staff';
}

/**
 * Generate 35 or 42 grid cells for the monthly calendar view.
 * Monday is the first day of the week.
 */
function getMonthDaysGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevMonthLastDay = new Date(year, month, 0);

  // Monday = 0, Sunday = 6
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const prevMonthTotalDays = prevMonthLastDay.getDate();

  const days = [];

  // Previous month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthTotalDays - i);
    days.push({
      date: d,
      isCurrentMonth: false,
      dateKey: formatDateKey(d)
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      isCurrentMonth: true,
      dateKey: formatDateKey(d)
    });
  }

  // Next month padding to fill complete rows of 7
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      dateKey: formatDateKey(d)
    });
  }

  return days;
}

export default function WorkScheduleView({ presenter }) {
  const {
    shiftTypes,
    allShiftsWithOff,
    schedules,
    departments,
    filteredEmployees,
    weekDates,
    referenceDate,
    setReferenceDate,
    selectedDepartment,
    setSelectedDepartment,
    selectedShift: presenterSelectedShift,
    setSelectedShift: presenterSetSelectedShift,
    searchQuery,
    setSearchQuery,
    prevWeek,
    nextWeek,
    goToToday,
    resolveShift,
    getEmployeeStats,
    rosterSummary,
    assignModal,
    openAssignModal,
    closeAssignModal,
    saveAssignShift,
    bulkModal,
    openBulkModal,
    closeBulkModal,
    saveBulkAssign,
    successModal,
    closeSuccessModal
  } = presenter;

  // Filter by shift state (with presenter binding or local fallback)
  const [localSelectedShift, setLocalSelectedShift] = useState('all');
  const selectedShift = presenterSelectedShift ?? localSelectedShift;
  const setSelectedShift = presenterSetSelectedShift ?? setLocalSelectedShift;

  // Local state for modal selections
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [importError, setImportError] = useState('');
  const [importErrorFileName, setImportErrorFileName] = useState('');
  const addDropdownRef = React.useRef(null);
  const importInputRef = React.useRef(null);
  const importDialogRef = React.useRef(null);
  const [importFile, setImportFile] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importDragging, setImportDragging] = useState(false);
  const [importPhase, setImportPhase] = useState('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [importPreview, setImportPreview] = useState(null);
  const importReadId = React.useRef(0);
  const resetImportFile = () => {
    importReadId.current += 1;
    setImportFile(null);
    setImportPreview(null);
    setImportPhase('idle');
    setImportProgress(0);
    setImportError('');
    setImportErrorFileName('');
  };
  const selectImportFile = async (file) => {
    if (!file || importBusy) return;
    resetImportFile();
    setImportErrorFileName(file.name);
    const readId = importReadId.current;
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setImportError('Gunakan file Excel (.xlsx) atau CSV (.csv).');
    } else if (file.size > 10 * 1024 * 1024) {
      setImportError('Ukuran file maksimal 10 MB.');
    } else {
      setImportFile(file);
      setImportPhase('reading');
      try {
        const buffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onprogress = (event) => {
            if (readId === importReadId.current && event.lengthComputable) {
              setImportProgress(Math.round(event.loaded / event.total * 100));
            }
          };
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('File tidak dapat dibaca. Silakan pilih ulang.'));
          reader.readAsArrayBuffer(file);
        });
        if (readId !== importReadId.current) return;
        setImportPhase('processing');
        const contents = file.name.toLowerCase().endsWith('.xlsx')
          ? await scheduleWorkbookToCsv(buffer, presenter.employees || [])
          : new TextDecoder().decode(buffer);
        if (readId !== importReadId.current) return;
        const records = presenter.validateScheduleImport(contents);
        setImportPreview({ contents, count: records.length });
        setImportPhase('ready');
      } catch (error) {
        if (readId !== importReadId.current) return;
        setImportPhase('error');
        setImportError(error.message || 'File gagal diproses.');
      }
    }
  };
  const confirmScheduleImport = async () => {
    if (!importPreview || importPhase !== 'ready' || importBusy) return;
    setImportBusy(true);
    setImportError('');
    try {
      presenter.importSchedules(importPreview.contents);
      importDialogRef.current?.close();
      resetImportFile();
    } catch (error) {
      setImportError(error.message || 'Import gagal. Periksa isi file Anda.');
    } finally {
      setImportBusy(false);
    }
  };
  const templateDialogRef = React.useRef(null);
  const [downloadMode, setDownloadMode] = useState('template');
  const [templateDepartment, setTemplateDepartment] = useState('all');
  const [templateStart, setTemplateStart] = useState(() => formatDateKey(new Date()));
  const [templateEnd, setTemplateEnd] = useState(() => formatDateKey(new Date()));
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const templateEmployees = (presenter.employees || []).filter(
    (employee) => templateDepartment === 'all' || employee.departmentId === templateDepartment
  );
  const templateDatesValid = Boolean(templateStart && templateEnd && templateEnd >= templateStart);

  React.useEffect(() => {
    if (!showAddDropdown) return;
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'keydown' || !addDropdownRef.current?.contains(event.target)) {
        setShowAddDropdown(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [showAddDropdown]);

  const downloadScheduleTemplate = async () => {
    if (!templateDatesValid || !templateEmployees.length) return;
    setTemplateDownloading(true);
    setTemplateError('');
    try {
    const dates = [];
    const date = new Date(`${templateStart}T00:00:00`);
    const end = new Date(`${templateEnd}T00:00:00`);
    while (date <= end) {
      const dateKey = formatDateKey(date);
      dates.push(dateKey);
      date.setDate(date.getDate() + 1);
    }
    const isExport = downloadMode === 'export';
    const workbook = buildScheduleWorkbook({
      employees: templateEmployees.map((employee) => ({ ...employee, schedulePosition: getEmployeeJabatan(employee) })),
      departments, shifts: isExport ? allShiftsWithOff : shiftTypes, dates,
      readOnly: isExport,
      getShiftCode: (employee, dateKey) => getEmployeeShiftForDate(schedules, employee, dateKey, shiftTypes).code
    });
    if (isExport) await protectScheduleWorkbook(workbook);
    await downloadWorkbook(workbook, `work-schedule-${isExport ? 'export' : 'template'}-${templateDepartment}-${templateStart}-${templateEnd}.xlsx`);
    templateDialogRef.current?.close();
    } catch (error) {
      setTemplateError(error.message || 'File gagal diunduh. Silakan coba lagi.');
    } finally {
      setTemplateDownloading(false);
    }
  };

  // Bulk modal local state
  const [bulkDept, setBulkDept] = useState('all');
  const [bulkShiftId, setBulkShiftId] = useState(shiftTypes[0]?.id || 's-1');
  const [bulkStart, setBulkStart] = useState(() => formatDateKey(new Date()));
  const [bulkEnd, setBulkEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return formatDateKey(d);
  });
  const [bulkEmpIds, setBulkEmpIds] = useState([]);

  // Reset selected shift when modal opens so user must pick a shift
  React.useEffect(() => {
    if (assignModal.isOpen) {
      setSelectedShiftId(null);
    }
  }, [assignModal.isOpen]);

  React.useEffect(() => {
    if (bulkModal.isOpen) {
      const tStr = formatDateKey(new Date());
      const endD = new Date();
      endD.setDate(endD.getDate() + 6);
      setBulkStart(tStr);
      setBulkEnd(formatDateKey(endD));
      setBulkShiftId(shiftTypes[0]?.id || 's-1');
      setBulkDept(selectedDepartment === 'all' ? 'dept-eng' : selectedDepartment);
      const initialEmps = filteredEmployees.slice(0, 6).map((e) => e.id);
      setBulkEmpIds(initialEmps);
    }
  }, [bulkModal.isOpen, shiftTypes, selectedDepartment, filteredEmployees]);

  // 2-Tab Navigation State
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'individual'
  const [individualSubTab, setIndividualSubTab] = useState('list'); // 'list' | 'detail'
  const [indivSearch, setIndivSearch] = useState('');
  const [indivDept, setIndivDept] = useState('all');
  const [indivPage, setIndivPage] = useState(1);
  const indivPageSize = 10;
  const [selectedEmpId, setSelectedEmpId] = useState(() => filteredEmployees[0]?.id || 'emp-1');

  // Today base date
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [calMonthDate, setCalMonthDate] = useState(() => new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const monthPickerRef = React.useRef(null);
  const [hoverTooltip, setHoverTooltip] = useState(null); // { text, x, y, height }

  const allDivisions = React.useMemo(() => getResolvedDivisions(), []);

  // Selected employee for Individual Tab
  const selectedEmp = filteredEmployees.find((e) => e.id === selectedEmpId) || filteredEmployees[0];
  const selectedEmpDept = departments.find((d) => d.id === selectedEmp?.departmentId);
  const selectedEmpDiv = allDivisions.find((d) => d.id === selectedEmp?.divisionId);

  // Check if previous month navigation is disabled (cannot select past months)
  const isPrevMonthDisabled =
    calMonthDate.getFullYear() < currentYear ||
    (calMonthDate.getFullYear() === currentYear && calMonthDate.getMonth() <= currentMonth);

  // Month navigation
  const prevMonth = () => {
    if (isPrevMonthDisabled) return;
    setCalMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const goToTodayMonth = () => {
    setCalMonthDate(new Date());
  };

  const monthYearStr = calMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthDays = React.useMemo(() => {
    return getMonthDaysGrid(calMonthDate.getFullYear(), calMonthDate.getMonth());
  }, [calMonthDate]);

  // Compute month stats for selected employee
  const monthStats = React.useMemo(() => {
    if (!selectedEmp) return { totalHours: 0, workDays: 0, offDays: 0 };
    let totalHours = 0;
    let workDays = 0;
    let offDays = 0;

    monthDays.forEach((day) => {
      if (!day.isCurrentMonth) return;
      const shift = getEmployeeShiftForDate(schedules, selectedEmp, day.dateKey, shiftTypes);
      if (!Number(shift.workHours)) {
        offDays += 1;
      } else {
        workDays += 1;
        totalHours += Number(shift.workHours || 0);
      }
    });

    return { totalHours: Number(totalHours.toFixed(1)), workDays, offDays };
  }, [selectedEmp, monthDays, schedules, shiftTypes]);

  // Helper to compute month stats for an employee for Directory Table
  const getEmployeeMonthSummary = React.useCallback((emp, targetDate) => {
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const totalDaysInMonth = new Date(y, m + 1, 0).getDate();
    let totalHours = 0;
    let workDays = 0;
    let offDays = 0;
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const s = getEmployeeShiftForDate(schedules, emp, dStr, shiftTypes);
      if (!Number(s.workHours)) {
        offDays += 1;
      } else {
        workDays += 1;
        totalHours += Number(s.workHours || 0);
      }
    }
    return { totalHours: Number(totalHours.toFixed(1)), workDays, offDays };
  }, [schedules, shiftTypes]);

  // Directory filter for Roster by Employee
  const filteredDirectoryEmployees = React.useMemo(() => {
    let list = filteredEmployees;
    if (indivDept !== 'all') {
      list = list.filter((e) => e.departmentId === indivDept);
    }
    if (indivSearch.trim()) {
      const q = indivSearch.trim().toLowerCase();
      list = list.filter((e) => {
        const nameMatch = (e.name || '').toLowerCase().includes(q);
        const nipMatch = (e.nip || e.nik || e.id || '').toLowerCase().includes(q);
        const posMatch = (e.position || '').toLowerCase().includes(q);
        const d = departments.find((dept) => dept.id === e.departmentId);
        const deptMatch = (d?.name || '').toLowerCase().includes(q);
        return nameMatch || nipMatch || posMatch || deptMatch;
      });
    }
    return list;
  }, [filteredEmployees, indivDept, indivSearch, departments]);

  const totalIndivPages = Math.ceil(filteredDirectoryEmployees.length / indivPageSize) || 1;
  const indivStartIndex = (indivPage - 1) * indivPageSize;
  const indivEndIndex = Math.min(indivStartIndex + indivPageSize, filteredDirectoryEmployees.length);
  const paginatedDirectoryEmployees = React.useMemo(() => {
    return filteredDirectoryEmployees.slice(indivStartIndex, indivStartIndex + indivPageSize);
  }, [filteredDirectoryEmployees, indivStartIndex, indivPageSize]);

  const indivPaginationPages = React.useMemo(() => {
    if (totalIndivPages <= 7) {
      return Array.from({ length: totalIndivPages }, (_, i) => i + 1);
    }
    if (indivPage <= 4) {
      return [1, 2, 3, 4, 5, '…', totalIndivPages];
    }
    if (indivPage >= totalIndivPages - 3) {
      return [1, '…', totalIndivPages - 4, totalIndivPages - 3, totalIndivPages - 2, totalIndivPages - 1, totalIndivPages];
    }
    return [1, '…', indivPage - 1, indivPage, indivPage + 1, '…', totalIndivPages];
  }, [totalIndivPages, indivPage]);


  // 1. Dropdown Date Picker State (Today + 6 days, Minggu Ini, Minggu Lalu, Custom Date Range)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [scheduleViewStyle, setScheduleViewStyle] = useState('matrix'); // 'matrix' (default) | 'list'

  const [datePeriodMode, setDatePeriodMode] = useState('this_week'); // 'today' | 'this_week' | 'last_week' | 'custom'
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = React.useRef(null);

  // Horizontal scroll shadow indicator state for Matrix table
  const tableContainerRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTableScroll = React.useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  React.useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    checkTableScroll();
    el.addEventListener('scroll', checkTableScroll, { passive: true });
    window.addEventListener('resize', checkTableScroll);
    return () => {
      el.removeEventListener('scroll', checkTableScroll);
      window.removeEventListener('resize', checkTableScroll);
    };
  }, [checkTableScroll, scheduleViewStyle]);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(e) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setIsDateDropdownOpen(false);
      }
    }
    if (isDateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDateDropdownOpen]);

  // Close month picker on click outside
  React.useEffect(() => {
    function handleClickOutside(e) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target)) {
        setIsMonthPickerOpen(false);
      }
    }
    if (isMonthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthPickerOpen]);

  const todayStr = formatDateKey(today);

  // 1A. Option: Today (1 day only)
  const todayDates = React.useMemo(() => {
    return [new Date(today)];
  }, [today]);

  // 1B. Option: Minggu ini (From Today until Sunday of the current week)
  const thisWeekDates = React.useMemo(() => {
    const day = (today.getDay() + 6) % 7; // Monday = 0
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + (6 - day)); // Sunday of this week
    const dates = [];
    const curr = new Date(today);
    while (curr <= sunday) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates.length > 0 ? dates : [new Date(today)];
  }, [today]);

  // 1C. Option: Bulan ini (From Today until the last day of the current month)
  const thisMonthDates = React.useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const dates = [];
    for (let i = today.getDate(); i <= lastDay; i++) {
      dates.push(new Date(year, month, i));
    }
    return dates.length > 0 ? dates : [new Date(today)];
  }, [today]);

  // Helper to format date ranges
  const formatDateRangeStr = (dates) => {
    if (!dates || dates.length === 0) return '';
    const first = dates[0];
    const last = dates[dates.length - 1];
    if (dates.length === 1) {
      return first.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const fStr = first.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const lStr = last.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${fStr} – ${lStr}`;
  };

  const todayRangeStr = React.useMemo(() => formatDateRangeStr(todayDates), [todayDates]);
  const thisWeekRangeStr = React.useMemo(() => formatDateRangeStr(thisWeekDates), [thisWeekDates]);
  const thisMonthRangeStr = React.useMemo(() => formatDateRangeStr(thisMonthDates), [thisMonthDates]);

  // 1D. Option: Custom Date Range (Max 30 days, cannot pick dates before today)
  const defaultCustomEnd = React.useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + 6);
    return formatDateKey(d);
  }, [today]);

  const [customStartDate, setCustomStartDate] = useState(() => todayStr);
  const [customEndDate, setCustomEndDate] = useState(() => defaultCustomEnd);
  const [tempCustomStart, setTempCustomStart] = useState(() => todayStr);
  const [tempCustomEnd, setTempCustomEnd] = useState(() => defaultCustomEnd);

  // Validation for custom date range (strictly today & future, max 30 days)
  const customDiffDays = React.useMemo(() => {
    if (!tempCustomStart || !tempCustomEnd) return 0;
    const s = new Date(tempCustomStart + 'T00:00:00');
    const e = new Date(tempCustomEnd + 'T00:00:00');
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  }, [tempCustomStart, tempCustomEnd]);

  const isCustomBeforeToday = tempCustomStart < todayStr;
  const isCustomRangeTooLong = customDiffDays > 30;
  const isCustomInvalid = customDiffDays <= 0 || isCustomBeforeToday;

  // Active dates rendered in Matrix and List view (strictly today and future only)
  const activeDates = React.useMemo(() => {
    let raw = [];
    if (datePeriodMode === 'today') raw = todayDates;
    else if (datePeriodMode === 'this_month') raw = thisMonthDates;
    else if (datePeriodMode === 'custom') {
      const start = new Date(customStartDate + 'T00:00:00');
      const end = new Date(customEndDate + 'T00:00:00');
      const s = start <= end ? start : end;
      const e = start <= end ? end : start;
      const dates = [];
      const curr = new Date(s);
      let count = 0;
      // Strictly enforce max 30 days
      while (curr <= e && count < 30) {
        dates.push(new Date(curr));
        curr.setDate(curr.getDate() + 1);
        count++;
      }
      raw = dates.length > 0 ? dates : thisWeekDates;
    } else {
      raw = thisWeekDates; // default 'this_week'
    }

    // Filter to ensure no past dates ever show up in work schedule
    const futureOnly = raw.filter((d) => formatDateKey(d) >= todayStr);
    return futureOnly.length > 0 ? futureOnly : [new Date(today)];
  }, [datePeriodMode, todayDates, thisWeekDates, thisMonthDates, customStartDate, customEndDate, todayStr, today]);

  // Active label & range string for dropdown trigger button
  const activeLabel = React.useMemo(() => {
    if (datePeriodMode === 'today') return 'Today';
    if (datePeriodMode === 'this_month') return 'This Month';
    if (datePeriodMode === 'custom') return 'Custom Date Range';
    return 'This Week';
  }, [datePeriodMode]);

  const activeRangeStr = React.useMemo(() => {
    return formatDateRangeStr(activeDates);
  }, [activeDates]);

  // Compute schedule records for the active period (activeDates)
  const scheduleList = React.useMemo(() => {
    const list = [];
    activeDates.forEach((dateObj) => {
      const dateKey = formatDateKey(dateObj);
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      filteredEmployees.forEach((emp) => {
        const shift = getEmployeeShiftForDate(schedules, emp, dateKey, shiftTypes);
        if (selectedShift !== 'all' && shift.id !== selectedShift && shift.code !== selectedShift) {
          return;
        }
        const dept = departments.find((d) => d.id === emp.departmentId);
        list.push({
          emp,
          dateStr: dateKey,
          formattedDate,
          deptName: dept ? dept.name : 'General Staff',
          shift
        });
      });
    });
    return list;
  }, [activeDates, filteredEmployees, schedules, shiftTypes, departments, selectedShift]);

  // Filter employees in matrix view according to selectedShift
  const matrixEmployees = React.useMemo(() => {
    if (selectedShift === 'all') return filteredEmployees;
    return filteredEmployees.filter((emp) => {
      return activeDates.some((dateObj) => {
        const dStr = formatDateKey(dateObj);
        const shift = getEmployeeShiftForDate(schedules, emp, dStr, shiftTypes);
        return shift.id === selectedShift || shift.code === selectedShift;
      });
    });
  }, [filteredEmployees, selectedShift, activeDates, schedules, shiftTypes]);

  const totalPages = Math.max(1, Math.ceil(scheduleList.length / pageSize));
  const paginatedSchedules = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return scheduleList.slice(start, start + pageSize);
  }, [scheduleList, currentPage, pageSize]);

  const paginationPages = React.useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '…', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
  }, [totalPages, currentPage]);

  const handleExport = () => {
    setDownloadMode('export');
    setTemplateError('');
    setTemplateStart(formatDateKey(activeDates[0]));
    setTemplateEnd(formatDateKey(activeDates[activeDates.length - 1]));
    setTemplateDepartment(selectedDepartment || 'all');
    templateDialogRef.current?.showModal();
  };

  return (
    <div className="ws-container">
      {/* 1. Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'HR Parameter' },
          { label: 'Attendance' },
          { label: 'Work Schedules' }
        ]}
      />

      {/* 2. Hero Header */}
      <div className="ws-hero">
        <div className="ws-hero-left">
          <div className="ws-hero-icon-box">
            <CalendarDots size={28} weight="bold" />
          </div>
          <div>
            <div className="ws-hero-tag">ATTENDANCE</div>
            <h1 className="ws-hero-title">Work Schedule</h1>
            <p className="ws-hero-desc">
              Manage weekly operational rosters with live synchronization to master Shift Types.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Unified Main Card Container (Matching Data Karyawan) */}
      <div className="emp-card-container">
        {/* Card Header matching Data Karyawan */}
        <div className="emp-card-header">
          <div>
            <h2 className="emp-card-title">Work Schedules</h2>
            <p className="emp-card-desc">
              Browse operational shift rosters, employee assignments, and schedules.
            </p>
          </div>
          <div className="emp-card-actions">
            {/* 2 Segmented Tabs */}
            <div className="ws-toolbar-tabs" style={{ marginRight: '4px' }}>
              <button
                type="button"
                className={`ws-toolbar-tab ${activeTab === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <Table size={15} weight={activeTab === 'all' ? 'bold' : 'regular'} />
                <span>All Schedules</span>
              </button>
              <button
                type="button"
                className={`ws-toolbar-tab ${activeTab === 'individual' ? 'is-active' : ''}`}
                onClick={() => {
                  if (!selectedEmpId && filteredEmployees.length > 0) {
                    setSelectedEmpId(filteredEmployees[0].id);
                  }
                  setActiveTab('individual');
                  setIndividualSubTab('list');
                }}
              >
                <User size={15} weight={activeTab === 'individual' ? 'bold' : 'regular'} />
                <span>By Employee</span>
              </button>
            </div>

            {/* Export CSV matching Data Karyawan secondary button */}
            <button
              type="button"
              className="emp-btn-secondary"
              onClick={handleExport}
              title="Export schedules by date range and department"
            >
              <FileXls size={16} weight="bold" />
              <span>Export Schedule</span>
            </button>

            {/* Add Schedule Button matching Data Karyawan primary button */}
            <div className="emp-add-dropdown-wrap" ref={addDropdownRef}>
              <button
                type="button"
                className={`emp-btn-primary ${showAddDropdown ? 'active' : ''}`}
                onClick={() => setShowAddDropdown((prev) => !prev)}
                aria-expanded={showAddDropdown}
              >
                <Plus size={16} weight="bold" />
                <span>Add Work Schedule</span>
                <CaretDown size={12} weight="bold" style={{ marginLeft: '2px', transform: showAddDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>
              {showAddDropdown && (
                <div className="emp-add-dropdown-menu">
                  <button type="button" className="emp-add-dropdown-item" onClick={() => {
                    setShowAddDropdown(false);
                    resetImportFile();
                    setImportDragging(false);
                    importDialogRef.current?.showModal();
                  }}>
                    <div className="emp-add-item-icon secondary"><FileArrowUp size={18} weight="bold" /></div>
                    <div className="emp-add-item-text">
                      <span className="emp-add-item-title">Import Work Schedule</span>
                      <span className="emp-add-item-desc">Upload employee schedules from Excel or CSV</span>
                    </div>
                  </button>
                  <button type="button" className="emp-add-dropdown-item" onClick={() => {
                    setShowAddDropdown(false);
                    setDownloadMode('template');
                    setTemplateError('');
                    templateDialogRef.current?.showModal();
                  }}>
                    <div className="emp-add-item-icon download"><FileArrowDown size={18} weight="bold" /></div>
                    <div className="emp-add-item-text">
                      <span className="emp-add-item-title">Download Template</span>
                      <span className="emp-add-item-desc">Download the work schedule Excel template</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TAB 1: SEMUA SCHEDULE */}
        {activeTab === 'all' && (
          <>
            {/* Search and Filters Row matching Data Karyawan & Boss requirements */}
            <div className="emp-search-row">
              {/* 1. Interactive Dropdown Date Picker (Today + 6 days, Minggu Ini, Minggu Lalu, Custom Date Range) */}
              <div ref={dateDropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setIsDateDropdownOpen((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ffffff',
                    border: isDateDropdownOpen ? '1px solid #0088cc' : '1px solid #cbd5e1',
                    boxShadow: isDateDropdownOpen ? '0 0 0 3px rgba(0, 136, 204, 0.15)' : 'none',
                    borderRadius: '8px',
                    padding: '0 12px',
                    height: '40px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    color: '#0f172a'
                  }}
                  title="Pilih periode jadwal (Today, Minggu Ini, Minggu Lalu, atau Custom)"
                  aria-expanded={isDateDropdownOpen}
                  aria-haspopup="true"
                >
                  <CalendarBlank size={17} weight="bold" style={{ color: '#0088cc', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {activeLabel}:
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                    {activeRangeStr}
                  </span>
                  <CaretDown
                    size={13}
                    weight="bold"
                    style={{
                      color: '#64748b',
                      marginLeft: '2px',
                      transform: isDateDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease'
                    }}
                  />
                </button>

                {/* Popover Dropdown Menu */}
                {isDateDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      zIndex: 60,
                      width: '320px',
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.15), 0 4px 10px -2px rgba(15, 23, 42, 0.06)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    {/* Header Hint */}
                    <div
                      style={{
                        padding: '6px 8px 4px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#94a3b8'
                      }}
                    >
                      Select Schedule Period
                    </div>

                    {/* Option 1: Today (Single day only) */}
                    <button
                      type="button"
                      onClick={() => {
                        setDatePeriodMode('today');
                        setIsDateDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: datePeriodMode === 'today' ? '#f0f9ff' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (datePeriodMode !== 'today') e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (datePeriodMode !== 'today') e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: datePeriodMode === 'today' ? '#0088cc' : '#1e293b'
                          }}
                        >
                          Today
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Today only ({todayRangeStr})
                        </div>
                      </div>
                      {datePeriodMode === 'today' && (
                        <CheckCircle size={16} weight="fill" style={{ color: '#0088cc', flexShrink: 0 }} />
                      )}
                    </button>

                    {/* Option 2: This Week */}
                    <button
                      type="button"
                      onClick={() => {
                        setDatePeriodMode('this_week');
                        setIsDateDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: datePeriodMode === 'this_week' ? '#f0f9ff' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (datePeriodMode !== 'this_week') e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (datePeriodMode !== 'this_week') e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: datePeriodMode === 'this_week' ? '#0088cc' : '#1e293b'
                          }}
                        >
                          This Week
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Today &ndash; Sunday ({thisWeekRangeStr})
                        </div>
                      </div>
                      {datePeriodMode === 'this_week' && (
                        <CheckCircle size={16} weight="fill" style={{ color: '#0088cc', flexShrink: 0 }} />
                      )}
                    </button>

                    {/* Option 3: This Month */}
                    <button
                      type="button"
                      onClick={() => {
                        setDatePeriodMode('this_month');
                        setIsDateDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: datePeriodMode === 'this_month' ? '#f0f9ff' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (datePeriodMode !== 'this_month') e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (datePeriodMode !== 'this_month') e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: datePeriodMode === 'this_month' ? '#0088cc' : '#1e293b'
                          }}
                        >
                          This Month
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Today &ndash; End of month ({thisMonthRangeStr})
                        </div>
                      </div>
                      {datePeriodMode === 'this_month' && (
                        <CheckCircle size={16} weight="fill" style={{ color: '#0088cc', flexShrink: 0 }} />
                      )}
                    </button>

                    {/* Divider */}
                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                    {/* Option 4: Custom Date Range (Max 30 Days) */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: datePeriodMode === 'custom' ? '#f8fafc' : '#ffffff',
                        border: datePeriodMode === 'custom' ? '1px solid #e2e8f0' : '1px solid transparent'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#1e293b',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>Custom Date Range</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Max 30 days</span>
                          {datePeriodMode === 'custom' && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#0088cc',
                                background: '#e0f2fe',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#64748b',
                              marginBottom: '3px',
                              textTransform: 'uppercase'
                            }}
                          >
                            Start Date
                          </label>
                          <input
                            type="date"
                            min={todayStr}
                            value={tempCustomStart}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTempCustomStart(val);
                              if (tempCustomEnd < val) {
                                setTempCustomEnd(val);
                              }
                            }}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              border: isCustomBeforeToday ? '1px solid #ef4444' : '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 6px',
                              fontSize: '11px',
                              color: '#1e293b',
                              background: '#ffffff'
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#64748b',
                              marginBottom: '3px',
                              textTransform: 'uppercase'
                            }}
                          >
                            End Date
                          </label>
                          <input
                            type="date"
                            min={tempCustomStart && tempCustomStart >= todayStr ? tempCustomStart : todayStr}
                            value={tempCustomEnd}
                            onChange={(e) => setTempCustomEnd(e.target.value)}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              border: isCustomRangeTooLong ? '1px solid #ef4444' : '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 6px',
                              fontSize: '11px',
                              color: '#1e293b',
                              background: '#ffffff'
                            }}
                          />
                        </div>
                      </div>

                      {isCustomBeforeToday && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#dc2626',
                            fontWeight: 600,
                            marginBottom: '8px',
                            background: '#fef2f2',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca'
                          }}
                        >
                          Past dates before today cannot be selected.
                        </div>
                      )}

                      {isCustomRangeTooLong && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#dc2626',
                            fontWeight: 600,
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#fef2f2',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <WarningCircle size={14} weight="bold" />
                            <span>Selected: {customDiffDays} days (Max: 30)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const s = new Date(tempCustomStart + 'T00:00:00');
                              const clampedEnd = new Date(s);
                              clampedEnd.setDate(clampedEnd.getDate() + 29);
                              setTempCustomEnd(formatDateKey(clampedEnd));
                            }}
                            style={{
                              background: '#ef4444',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Fix to 30d
                          </button>
                        </div>
                      )}

                      {customDiffDays <= 0 && !isCustomBeforeToday && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#dc2626',
                            fontWeight: 600,
                            marginBottom: '8px',
                            background: '#fef2f2',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca'
                          }}
                        >
                          End Date must be on or after Start Date.
                        </div>
                      )}

                      <button
                        type="button"
                        className="emp-btn-primary"
                        disabled={isCustomRangeTooLong || isCustomInvalid || !tempCustomStart || !tempCustomEnd}
                        onClick={() => {
                          setCustomStartDate(tempCustomStart);
                          setCustomEndDate(tempCustomEnd);
                          setDatePeriodMode('custom');
                          setIsDateDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          height: '32px',
                          fontSize: '12px',
                          fontWeight: 700,
                          opacity: (isCustomRangeTooLong || isCustomInvalid) ? 0.5 : 1,
                          cursor: (isCustomRangeTooLong || isCustomInvalid) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Apply Date Range
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Department Filter */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                <select
                  aria-label="Filter by department"
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    height: '40px',
                    padding: '0 36px 0 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '200px',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0088cc';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 136, 204, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.03)';
                  }}
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <CaretDown
                  size={14}
                  weight="bold"
                  style={{
                    position: 'absolute',
                    right: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              {/* 3. Shift Filter */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                <select
                  aria-label="Filter by shift"
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    height: '40px',
                    padding: '0 36px 0 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '175px',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0088cc';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 136, 204, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.03)';
                  }}
                  value={selectedShift}
                  onChange={(e) => {
                    setSelectedShift(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Shifts ({allShiftsWithOff.length})</option>
                  {allShiftsWithOff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} &ndash; {s.name}
                    </option>
                  ))}
                </select>
                <CaretDown
                  size={14}
                  weight="bold"
                  style={{
                    position: 'absolute',
                    right: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              {/* 4. Employee Search (Step 3: Kalo mau cari nama tinggal cari nama, kalo gk ya muncul semua nama) */}
              <div className="emp-search-input-group" style={{ flex: '0 1 220px', maxWidth: '220px', minWidth: '170px', position: 'relative' }}>
                <MagnifyingGlass size={16} weight="bold" className="emp-search-input-icon" />
                <input
                  type="text"
                  className="emp-search-input"
                  placeholder="Search name, NIK..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    title="Clear search"
                    aria-label="Clear search"
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={14} weight="bold" />
                  </button>
                )}
              </div>

              {/* 4. View Switcher: List vs Matrix */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <div className="ws-toolbar-tabs">
                  <button
                    type="button"
                    className={`ws-toolbar-tab ${scheduleViewStyle === 'matrix' ? 'is-active' : ''}`}
                    onClick={() => setScheduleViewStyle('matrix')}
                    title="Weekly Matrix Roster"
                  >
                    <GridFour size={14} weight="bold" />
                    <span>Matrix</span>
                  </button>
                  <button
                    type="button"
                    className={`ws-toolbar-tab ${scheduleViewStyle === 'list' ? 'is-active' : ''}`}
                    onClick={() => setScheduleViewStyle('list')}
                    title="Daily List View"
                  >
                    <Table size={14} weight="bold" />
                    <span>List</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card Body matching Data Karyawan */}
            <div className="emp-card-body">

          {/* 6A. LIST VIEW (MATCHING DATA KARYAWAN) */}
          {scheduleViewStyle === 'list' && (
            <div className="emp-table-card-inner">
              <div className="emp-table-responsive">
                <table className="emp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employee Name</th>
                      <th>Jabatan</th>
                      <th>Shift Type</th>
                      <th style={{ textAlign: 'center', width: '130px' }}>Shift Code</th>
                      <th style={{ textAlign: 'right', width: '110px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSchedules.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                          <CalendarBlank size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                            No schedule records match the filter
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedSchedules.map((item) => {
                        const isHoliday = item.shift.id === 'off-holiday' || item.shift.offType === 'holiday';
                        const isCutiBersama = item.shift.id === 'off-cuti-bersama' || item.shift.offType === 'cuti_bersama';
                        const isSpecialHoliday = isHoliday || isCutiBersama;
                        const isOff = isSpecialHoliday || item.shift.id === 'off';
                        const periodInfo = getShiftPeriodInfo(item.shift, isOff);
                        const PeriodIcon = periodInfo.Icon;

                        return (
                          <tr key={`${item.emp.id}_${item.dateStr}`}>
                            <td style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                              {item.formattedDate}
                            </td>
                            <td>
                              <div className="emp-profile-cell">
                                <img
                                  src={item.emp.avatar || DEFAULT_AVATAR}
                                  alt={item.emp.name}
                                  className="emp-avatar-img"
                                  onError={(e) => {
                                    e.target.src = DEFAULT_AVATAR;
                                  }}
                                />
                                <div>
                                  <span
                                    className="ws-emp-name-bold"
                                    style={{ cursor: 'pointer', display: 'block' }}
                                    onClick={() => {
                                      setSelectedEmpId(item.emp.id);
                                      setActiveTab('individual');
                                      setIndividualSubTab('detail');
                                    }}
                                    title={item.emp.name}
                                    onMouseEnter={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setHoverTooltip({
                                        text: item.emp.name,
                                        x: rect.left + rect.width / 2,
                                        y: rect.top,
                                        height: rect.height
                                      });
                                    }}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  >
                                    {item.emp.name}
                                  </span>
                                  <span className="ws-emp-email-muted">
                                    {item.emp.email || `${item.emp.nik || 'emp'}@proapps.co.id`}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="ws-col-dept">
                              <span
                                style={{
                                  color: '#334155',
                                  fontWeight: 600,
                                  maxWidth: '180px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block',
                                  verticalAlign: 'bottom',
                                  cursor: 'default'
                                }}
                                title={getEmployeeJabatan(item.emp, item.deptName)}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoverTooltip({
                                    text: getEmployeeJabatan(item.emp, item.deptName),
                                    x: rect.left + rect.width / 2,
                                    y: rect.top,
                                    height: rect.height
                                  });
                                }}
                                onMouseLeave={() => setHoverTooltip(null)}
                              >
                                {getEmployeeJabatan(item.emp, item.deptName)}
                              </span>
                            </td>
                            <td className="ws-col-shift-type">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                                <div
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: periodInfo.bg,
                                    color: periodInfo.color,
                                    border: `1px solid ${periodInfo.border}`,
                                    flexShrink: 0
                                  }}
                                  title={periodInfo.label}
                                >
                                  <PeriodIcon size={19} weight="bold" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <span
                                    style={{
                                      fontWeight: isSpecialHoliday ? 700 : (isOff ? 600 : 700),
                                      color: (isSpecialHoliday || isOff) ? '#475569' : '#0f172a',
                                      fontSize: '13px',
                                      lineHeight: 1.25,
                                      display: 'block'
                                    }}
                                  >
                                    {isOff && !isSpecialHoliday ? 'Day Off' : item.shift.name}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      color: isSpecialHoliday ? '#64748b' : (isOff ? '#94a3b8' : '#64748b'),
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      marginTop: '3px',
                                      lineHeight: 1.25
                                    }}
                                  >
                                    {isSpecialHoliday || isOff ? (
                                      'No Time • 0 hours'
                                    ) : (
                                      <>
                                        <Clock size={13} weight="bold" style={{ color: '#0284c7' }} />
                                        <span>{item.shift.checkIn} – {item.shift.checkOut} • {item.shift.workHours} hours</span>
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                className={`ws-shift-code-pill ${isOff ? 'is-off' : ''}`}
                                style={{
                                  backgroundColor: isOff ? '#f1f5f9' : (item.shift.color || '#002B7F'),
                                  color: isOff ? '#94a3b8' : '#ffffff',
                                  border: isOff ? '1px solid #e2e8f0' : 'none'
                                }}
                              >
                                {isOff ? 'OFF' : item.shift.code}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {isOff ? (
                                <button
                                  type="button"
                                  className="emp-btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                  onClick={() => openAssignModal(item.emp, new Date(item.dateStr + 'T00:00:00'))}
                                  title={`Edit shift for ${item.emp.name}`}
                                >
                                  <PencilSimple size={14} weight="bold" />
                                  <span>Edit</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="emp-btn-secondary ws-btn-locked"
                                  disabled
                                  aria-disabled="true"
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#64748b',
                                    borderColor: '#e2e8f0',
                                    cursor: 'not-allowed',
                                    opacity: 0.85,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                  title={`${item.shift.name}: shift sudah terkunci dan tidak dapat diubah.`}
                                >
                                  <LockSimple size={14} weight="bold" />
                                  <span>Locked</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Pagination Controls matching Data Karyawan */}
              <div className="emp-table-footer">
                <div className="emp-table-footer-info">
                  Showing <strong className="emp-text-dark">{scheduleList.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong className="emp-text-dark">{Math.min(currentPage * pageSize, scheduleList.length)}</strong> of{' '}
                  <strong className="emp-text-dark">{scheduleList.length}</strong> schedules
                </div>

                <div className="emp-pagination-controls" aria-label="Work Schedule pagination">
                  <button
                    type="button"
                    className="emp-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    <CaretLeft size={14} weight="bold" />
                  </button>

                  {paginationPages.map((pg, i) =>
                    pg === '…' ? (
                      <span key={`ellipsis-${i}`} className="emp-page-ellipsis">
                        …
                      </span>
                    ) : (
                      <button
                        key={pg}
                        type="button"
                        className={`emp-page-btn ${currentPage === pg ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pg)}
                      >
                        {pg}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    className="emp-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    title="Next page"
                    aria-label="Next page"
                  >
                    <CaretRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6B. MATRIX VIEW (GRID VIEW TIED TO ACTIVE DATES) */}
          {scheduleViewStyle === 'matrix' && (
            <div className="emp-table-card-inner ws-matrix-card">
              <div
                ref={tableContainerRef}
                className={`emp-table-responsive ws-table-container ${canScrollLeft ? 'has-scroll-left' : ''} ${canScrollRight ? 'has-scroll-right' : ''}`}
              >
                <table className={`ws-table ${activeDates.length > 7 ? 'is-scrollable' : ''}`}>
                  <thead>
                    <tr>
                      <th className="col-emp">EMPLOYEE NAME</th>
                      {activeDates.map((dateObj) => {
                        const dStr = formatDateKey(dateObj);
                        const isToday = dStr === todayStr;
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = dateObj.getDate();

                        return (
                          <th
                            key={dStr}
                            className={`col-day ${isToday ? 'is-today' : ''}`}
                          >
                            <span className="ws-day-name">{dayName}</span>
                            <span className="ws-day-num">{dayNum}</span>
                          </th>
                        );
                      })}
                      <th className="col-summary">
                        TOTAL HOURS
                      </th>
                      <th className="col-action">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={activeDates.length + 3} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                          <UsersThree size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                          <p style={{ margin: 0, fontWeight: 500 }}>No employees match the selected filters.</p>
                        </td>
                      </tr>
                    ) : (
                      matrixEmployees.map((emp) => {
                        const stats = calculateEmployeeWeekStats(emp, activeDates, schedules, shiftTypes);
                        const dept = departments.find((d) => d.id === emp.departmentId);

                        return (
                          <tr key={emp.id}>
                            <td className="col-emp">
                              <div className="ws-emp-cell">
                                <img
                                  src={emp.avatar || DEFAULT_AVATAR}
                                  alt={emp.name}
                                  className="ws-emp-avatar"
                                  onError={(e) => {
                                    e.target.src = DEFAULT_AVATAR;
                                  }}
                                />
                                <div className="ws-emp-info">
                                  <span
                                    className="ws-emp-name"
                                    title={emp.name}
                                    style={{ cursor: 'default' }}
                                    onMouseEnter={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setHoverTooltip({
                                        text: emp.name,
                                        x: rect.left + rect.width / 2,
                                        y: rect.top,
                                        height: rect.height
                                      });
                                    }}
                                    onMouseLeave={() => setHoverTooltip(null)}
                                  >
                                    {emp.name}
                                  </span>
                                  <div className="ws-emp-sub" title={getEmployeeJabatan(emp, dept?.name)}>
                                    <span
                                      className="ws-emp-sub-text"
                                      style={{ cursor: 'default' }}
                                      onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoverTooltip({
                                          text: getEmployeeJabatan(emp, dept?.name),
                                          x: rect.left + rect.width / 2,
                                          y: rect.top,
                                          height: rect.height
                                        });
                                      }}
                                      onMouseLeave={() => setHoverTooltip(null)}
                                    >
                                      {getEmployeeJabatan(emp, dept?.name)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {activeDates.map((dateObj) => {
                              const dStr = formatDateKey(dateObj);
                              const shift = getEmployeeShiftForDate(schedules, emp, dStr, shiftTypes);
                              const isHoliday = shift.id === 'off-holiday' || shift.offType === 'holiday';
                              const isCutiBersama = shift.id === 'off-cuti-bersama' || shift.offType === 'cuti_bersama';
                              const isSpecialHoliday = isHoliday || isCutiBersama;
                              const isOff = isSpecialHoliday || shift.id === 'off';
                              const isShiftMatch = selectedShift === 'all' || shift.id === selectedShift || shift.code === selectedShift;

                              const periodInfo = getShiftPeriodInfo(shift, isOff);
                              const PeriodIcon = periodInfo.Icon;

                              return (
                                <td key={dStr} className="ws-slot-cell">
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    aria-disabled={!isOff}
                                    className={`ws-shift-btn ${isSpecialHoliday ? 'is-holiday' : isOff ? 'is-off' : 'is-locked'}`}
                                    style={{
                                      borderColor: isSpecialHoliday ? '#FECDD3' : isOff ? '#E2E8F0' : `${shift.color}55`,
                                      backgroundColor: isSpecialHoliday ? '#FEF2F2' : isOff ? '#F8FAFC' : `${shift.color}14`,
                                      opacity: isShiftMatch ? 1 : 0.35,
                                      boxShadow: isShiftMatch && selectedShift !== 'all' ? `0 0 0 2px ${isSpecialHoliday ? '#EF4444' : isOff ? '#94A3B8' : shift.color}` : 'none'
                                    }}
                                    onClick={() => {
                                      if (isOff) openAssignModal(emp, dateObj);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        if (isOff) openAssignModal(emp, dateObj);
                                      }
                                    }}
                                    title={
                                      isSpecialHoliday
                                        ? `${emp.name} - ${shift.name} on ${dStr}`
                                        : (isOff
                                          ? `${emp.name} - Day Off on ${dStr}`
                                          : `${shift.name}: shift sudah terkunci dan tidak dapat diubah.`)
                                    }
                                  >
                                    {/* Top: Badges + Edit Icon */}
                                    <div className="ws-shift-card-header">
                                      <div className="ws-shift-badges-wrap">
                                        <span
                                          className="ws-shift-period-badge"
                                          style={{
                                            backgroundColor: periodInfo.bg,
                                            color: periodInfo.color,
                                            borderColor: periodInfo.border
                                          }}
                                        >
                                          <PeriodIcon size={12} weight="bold" />
                                          <span>{periodInfo.label}</span>
                                        </span>
                                      </div>

                                      <div className="ws-shift-edit-btn" aria-label={isOff ? 'Edit shift' : 'Shift terkunci'}>
                                        {isOff ? <PencilSimple size={13} weight="bold" /> : <LockSimple size={13} weight="bold" />}
                                      </div>
                                    </div>

                                    {/* Middle: Shift Name */}
                                    <div className="ws-shift-card-name">
                                      {isSpecialHoliday ? shift.name : (isOff ? 'Day Off' : shift.name)}
                                    </div>

                                    {/* Bottom: Clock + Time Range + Work Hours */}
                                    <div className="ws-shift-card-time-row">
                                      <Clock size={14} weight="bold" className="ws-shift-clock-icon" />
                                      <span className="ws-shift-card-time-text">
                                        {isOff
                                          ? 'No Time'
                                          : `${shift.checkIn || '—'} – ${shift.checkOut || '—'} • ${shift.workHours} hours`}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              );
                            })}

                            <td className="ws-summary-cell col-summary">
                              <div className="ws-summary-hours">{stats.totalHours} hours</div>
                              <div className="ws-summary-days">
                                {stats.workDays} days &bull; {stats.offDays} off
                              </div>
                            </td>

                            <td className="col-action ws-action-cell">
                              <button
                                type="button"
                                className="emp-btn-secondary"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  padding: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '6px'
                                }}
                                onClick={() => {
                                  setSelectedEmpId(emp.id);
                                  setActiveTab('individual');
                                  setIndividualSubTab('detail');
                                }}
                                title={`View individual schedule for ${emp.name}`}
                                aria-label={`View individual schedule for ${emp.name}`}
                              >
                                <Eye size={16} weight="bold" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {/* TAB 2: JADWAL PER KARYAWAN (ROSTER BY EMPLOYEE) */}
      {activeTab === 'individual' && (
        <>
          {/* SUB-VIEW 1: EMPLOYEE DIRECTORY LIST */}
          {individualSubTab === 'list' && (
            <>
              {/* Search & Filter Toolbar */}
              <div className="emp-search-row">
                {/* Search Input (Standard matching Data Karyawan) */}
                <div className="emp-search-input-group">
                  <MagnifyingGlass
                    size={16}
                    weight="bold"
                    className="emp-search-input-icon"
                    style={{ color: '#0088cc' }}
                  />
                  <input
                    type="text"
                    className="emp-search-input"
                    placeholder="Search by name, NIP, or position..."
                    value={indivSearch}
                    onChange={(e) => {
                      setIndivSearch(e.target.value);
                      setIndivPage(1);
                    }}
                    style={{
                      paddingRight: indivSearch ? '36px' : '14px'
                    }}
                  />
                  {indivSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setIndivSearch('');
                        setIndivPage(1);
                      }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                    >
                      <X size={14} weight="bold" />
                    </button>
                  )}
                </div>

                {/* Department Filter Dropdown */}
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <select
                    aria-label="Filter Departemen"
                    className="emp-search-input"
                    value={indivDept}
                    onChange={(e) => {
                      setIndivDept(e.target.value);
                      setIndivPage(1);
                    }}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      paddingRight: '36px',
                      paddingLeft: '14px',
                      minWidth: '200px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    <option value="all">Semua Departemen ({departments.length})</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={14}
                    weight="bold"
                    style={{
                      position: 'absolute',
                      right: '13px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Card Body matching Data Karyawan, Matrix & List */}
              <div className="emp-card-body">
                <div className="emp-table-card-inner">
                <div className="emp-table-responsive">
                  <table className="emp-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Organization Structure</th>
                        <th>Position</th>
                        <th style={{ textAlign: 'right', width: '160px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDirectoryEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                            <User size={38} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                              Tidak ada karyawan yang sesuai dengan filter atau pencarian
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedDirectoryEmployees.map((emp) => {
                          const dept = departments.find((d) => d.id === emp.departmentId);
                          const div = allDivisions.find((d) => d.id === emp.divisionId);
                          const nip = emp.nip || emp.nik || emp.id;
                          const deptName = dept ? dept.name : (emp.department || 'Operations');
                          const divName = div ? div.name : (emp.division || deptName);
                          const jabatan = getEmployeeJabatan(emp, deptName);

                          return (
                            <tr key={emp.id} style={{ transition: 'background-color 0.15s ease' }}>
                              {/* 1. Employee */}
                              <td>
                                <div className="emp-profile-cell">
                                  <img
                                    src={emp.avatar || DEFAULT_AVATAR}
                                    alt={emp.name}
                                    className="emp-avatar-img"
                                    onError={(e) => {
                                      e.target.src = DEFAULT_AVATAR;
                                    }}
                                  />
                                  <div>
                                    <span
                                      className="ws-emp-name-bold"
                                      style={{ cursor: 'pointer', display: 'block' }}
                                      onClick={() => {
                                        setSelectedEmpId(emp.id);
                                        setIndividualSubTab('detail');
                                      }}
                                      title={emp.name}
                                      onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoverTooltip({
                                          text: emp.name,
                                          x: rect.left + rect.width / 2,
                                          y: rect.top,
                                          height: rect.height
                                        });
                                      }}
                                      onMouseLeave={() => setHoverTooltip(null)}
                                    >
                                      {emp.name}
                                    </span>
                                    <span className="ws-emp-email-muted">
                                      NIP: {nip}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Organization Structure */}
                              <td>
                                <div className="emp-org-dept-text">
                                  {deptName}
                                </div>
                                <div className="emp-org-div-text">
                                  Division: {divName}
                                </div>
                              </td>

                              {/* 3. Position / Jabatan */}
                              <td>
                                <span className="emp-pos-badge">
                                  {jabatan}
                                </span>
                              </td>

                              {/* 4. Action */}
                              <td style={{ textAlign: 'right', whiteSpace: 'nowrap', width: '1%' }}>
                                <button
                                  type="button"
                                  className="emp-btn-secondary"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    padding: '7px 14px',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                  }}
                                  onClick={() => {
                                    setSelectedEmpId(emp.id);
                                    setIndividualSubTab('detail');
                                  }}
                                  title={`See schedule for ${emp.name}`}
                                >
                                  <CalendarDots size={16} weight="bold" style={{ color: '#0088cc', flexShrink: 0 }} />
                                  <span style={{ whiteSpace: 'nowrap' }}>See Schedule</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer with Pagination Controls matching Data Karyawan */}
                <div className="emp-table-footer">
                  <div className="emp-table-footer-info">
                    Showing <strong className="emp-text-dark">{filteredDirectoryEmployees.length === 0 ? 0 : indivStartIndex + 1}</strong> to{' '}
                    <strong className="emp-text-dark">{indivEndIndex}</strong> of{' '}
                    <strong className="emp-text-dark">{filteredDirectoryEmployees.length}</strong> employees
                  </div>

                  <div className="emp-pagination-controls" aria-label="Employee directory pagination">
                    <button
                      type="button"
                      className="emp-page-btn"
                      disabled={indivPage === 1}
                      onClick={() => setIndivPage((p) => Math.max(p - 1, 1))}
                      title="Previous page"
                      aria-label="Previous page"
                    >
                      <CaretLeft size={14} weight="bold" />
                    </button>

                    {indivPaginationPages.map((pg, i) =>
                      pg === '…' ? (
                        <span key={`ellipsis-${i}`} className="emp-page-ellipsis">
                          …
                        </span>
                      ) : (
                        <button
                          key={pg}
                          type="button"
                          className={`emp-page-btn ${indivPage === pg ? 'active' : ''}`}
                          onClick={() => setIndivPage(pg)}
                        >
                          {pg}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      className="emp-page-btn"
                      disabled={indivPage === totalIndivPages}
                      onClick={() => setIndivPage((p) => Math.min(p + 1, totalIndivPages))}
                      title="Next page"
                      aria-label="Next page"
                    >
                      <CaretRight size={14} weight="bold" />
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </>
          )}

          {/* SUB-VIEW 2: INDIVIDUAL MONTHLY SCHEDULE DETAIL */}
          {individualSubTab === 'detail' && selectedEmp && (
            <>
              {/* Sleek Integrated Toolbar: Back Navigation & Month/Year Calendar Filter */}
              <div
                className="emp-search-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                {/* Left: Back Button & Context Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="emp-btn-secondary"
                    onClick={() => setIndividualSubTab('list')}
                    title="Back to Employee List"
                    aria-label="Back to Employee List"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '38px',
                      height: '38px',
                      padding: 0,
                      color: '#002B7F',
                      borderColor: '#cbd5e1'
                    }}
                  >
                    <ArrowLeft size={16} weight="bold" />
                  </button>

                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    <span
                      onClick={() => setIndividualSubTab('list')}
                      style={{ color: '#94a3b8', cursor: 'pointer', transition: 'color 0.15s ease' }}
                      onMouseEnter={(e) => (e.target.style.color = '#002B7F')}
                      onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
                    >
                      Employee List
                    </span>{' '}
                    /{' '}
                    <strong style={{ color: '#0f172a' }}>{selectedEmp.name}</strong>
                  </div>
                </div>

                {/* Right: Clean Calendar Month & Year Navigator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Prev Month */}
                  <button
                    type="button"
                    className="emp-btn-secondary"
                    style={{
                      padding: '8px 10px',
                      opacity: isPrevMonthDisabled ? 0.35 : 1,
                      cursor: isPrevMonthDisabled ? 'not-allowed' : 'pointer'
                    }}
                    onClick={prevMonth}
                    disabled={isPrevMonthDisabled}
                    title={isPrevMonthDisabled ? 'Past months cannot be selected' : 'Previous Month'}
                  >
                    <CaretLeft size={15} weight="bold" />
                  </button>

                  {/* Unified Month & Year Picker Button */}
                  <div ref={monthPickerRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="emp-btn-secondary"
                      onClick={() => {
                        setIsMonthPickerOpen((prev) => !prev);
                        setPickerYear(calMonthDate.getFullYear());
                      }}
                      title="Click to select month & year"
                      aria-expanded={isMonthPickerOpen}
                      style={{
                        height: '38px',
                        padding: '0 12px 0 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                        borderColor: isMonthPickerOpen ? '#0088cc' : '#cbd5e1',
                        boxShadow: isMonthPickerOpen ? '0 0 0 3px rgba(0, 136, 204, 0.15)' : 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <CalendarBlank size={16} weight="bold" style={{ color: '#0088cc' }} />
                      <span>{monthYearStr}</span>
                      <CaretDown
                        size={13}
                        weight="bold"
                        style={{
                          color: '#64748b',
                          transform: isMonthPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.15s ease'
                        }}
                      />
                    </button>

                    {/* Popover Month Picker Dialog */}
                    {isMonthPickerOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          right: 0,
                          zIndex: 80,
                          width: '280px',
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 14px 34px -4px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
                          padding: '14px',
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* Year Navigation Bar */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px',
                            paddingBottom: '10px',
                            borderBottom: '1px solid #f1f5f9'
                          }}
                        >
                          <button
                            type="button"
                            disabled={pickerYear <= currentYear}
                            onClick={() => {
                              if (pickerYear > currentYear) {
                                setPickerYear((y) => y - 1);
                              }
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#f8fafc',
                              color: pickerYear <= currentYear ? '#cbd5e1' : '#334155',
                              cursor: pickerYear <= currentYear ? 'not-allowed' : 'pointer',
                              opacity: pickerYear <= currentYear ? 0.35 : 1
                            }}
                            title={pickerYear <= currentYear ? 'Past years cannot be selected' : 'Previous Year'}
                          >
                            <CaretLeft size={13} weight="bold" />
                          </button>

                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                            {pickerYear}
                          </span>

                          <button
                            type="button"
                            onClick={() => setPickerYear((y) => y + 1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#f8fafc',
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                            title="Next Year"
                          >
                            <CaretRight size={13} weight="bold" />
                          </button>
                        </div>

                        {/* 12 Months Grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '6px',
                            marginBottom: '10px'
                          }}
                        >
                          {CAL_MONTH_NAMES.map((m, idx) => {
                            const isSelected =
                              calMonthDate.getMonth() === idx && calMonthDate.getFullYear() === pickerYear;
                            const isCurrentMonthNow =
                              today.getMonth() === idx && today.getFullYear() === pickerYear;
                            const isPastMonth =
                              pickerYear < currentYear || (pickerYear === currentYear && idx < currentMonth);

                            return (
                              <button
                                key={m.short}
                                type="button"
                                disabled={isPastMonth}
                                onClick={() => {
                                  if (isPastMonth) return;
                                  setCalMonthDate(new Date(pickerYear, idx, 1));
                                  setIsMonthPickerOpen(false);
                                }}
                                style={{
                                  padding: '9px 0',
                                  borderRadius: '8px',
                                  border: isSelected
                                    ? '1px solid #002B7F'
                                    : isCurrentMonthNow
                                    ? '1px dashed #0088cc'
                                    : '1px solid transparent',
                                  backgroundColor: isSelected
                                    ? '#002B7F'
                                    : isCurrentMonthNow
                                    ? '#eff6ff'
                                    : isPastMonth
                                    ? '#f8fafc'
                                    : 'transparent',
                                  color: isSelected
                                    ? '#ffffff'
                                    : isPastMonth
                                    ? '#cbd5e1'
                                    : isCurrentMonthNow
                                    ? '#002B7F'
                                    : '#1e293b',
                                  fontSize: '12.5px',
                                  fontWeight: isSelected || isCurrentMonthNow ? 700 : 500,
                                  cursor: isPastMonth ? 'not-allowed' : 'pointer',
                                  opacity: isPastMonth ? 0.45 : 1,
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected && !isPastMonth) {
                                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected && !isPastMonth) {
                                    e.currentTarget.style.backgroundColor = isCurrentMonthNow ? '#eff6ff' : 'transparent';
                                  }
                                }}
                                title={isPastMonth ? `${m.full} is in the past` : m.full}
                              >
                                {m.short}
                              </button>
                            );
                          })}
                        </div>

                        {/* Footer Shortcut: This Month */}
                        <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              goToTodayMonth();
                              setIsMonthPickerOpen(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '7px 0',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#002B7F',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#eff6ff';
                              e.currentTarget.style.borderColor = '#93c5fd';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                          >
                            This Month
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Next Month */}
                  <button
                    type="button"
                    className="emp-btn-secondary"
                    style={{ padding: '8px 10px' }}
                    onClick={nextMonth}
                    title="Next Month"
                  >
                    <CaretRight size={15} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="emp-card-body">

          {/* Employee Profile & Monthly Stat Pills */}
          <div className="ws-indiv-header-card">
            <div className="ws-indiv-profile-row">
              <div className="ws-indiv-emp-info">
                <img
                  src={selectedEmp?.avatar || DEFAULT_AVATAR}
                  alt={selectedEmp?.name || 'Employee'}
                  className="ws-indiv-avatar"
                  onError={(e) => {
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
                <div className="ws-indiv-details">
                  <div className="ws-indiv-name-row">
                    <h2>{selectedEmp.name}</h2>
                    <span className="ws-indiv-nip-badge">
                      NIP: {selectedEmp.nip || selectedEmp.nik || selectedEmp.id}
                    </span>
                  </div>
                  <div className="ws-indiv-meta">
                    <span className="ws-indiv-role">{getEmployeeJabatan(selectedEmp, selectedEmpDept?.name)}</span>
                  </div>
                </div>
              </div>

              {/* Month Stats */}
              <div className="ws-indiv-stats">
                <div className="ws-indiv-stat-pill">
                  <div className="ws-stat-icon-wrap ws-stat-icon-blue">
                    <Clock size={20} weight="bold" />
                  </div>
                  <div className="ws-stat-info">
                    <span className="ws-indiv-stat-label">Total Work Hours</span>
                    <span className="ws-indiv-stat-val ws-stat-val-blue">{monthStats.totalHours} hours</span>
                  </div>
                </div>

                <div className="ws-indiv-stat-pill">
                  <div className="ws-stat-icon-wrap ws-stat-icon-emerald">
                    <Briefcase size={20} weight="bold" />
                  </div>
                  <div className="ws-stat-info">
                    <span className="ws-indiv-stat-label">Working Days</span>
                    <span className="ws-indiv-stat-val ws-stat-val-emerald">
                      {monthStats.workDays} Days
                    </span>
                  </div>
                </div>

                <div className="ws-indiv-stat-pill">
                  <div className="ws-stat-icon-wrap ws-stat-icon-gray">
                    <Coffee size={20} weight="bold" />
                  </div>
                  <div className="ws-stat-info">
                    <span className="ws-indiv-stat-label">Day Off</span>
                    <span className="ws-indiv-stat-val ws-stat-val-gray">
                      {monthStats.offDays} Days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Monthly Calendar Grid */}
          <div className="ws-calendar-card">
            <div className="ws-calendar-grid-header">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <div key={day} className={`ws-cal-day-title ${idx >= 5 ? 'is-weekend' : ''}`}>
                  {day}
                </div>
              ))}
            </div>
            <div className="ws-calendar-grid-body">
              {monthDays.map((cell) => {
                const isToday = cell.dateKey === todayStr;
                const shift = getEmployeeShiftForDate(schedules, selectedEmp, cell.dateKey, shiftTypes);
                const isHoliday = shift.id === 'off-holiday' || shift.offType === 'holiday';
                const isCutiBersama = shift.id === 'off-cuti-bersama' || shift.offType === 'cuti_bersama';
                const isSpecialHoliday = isHoliday || isCutiBersama;
                const isOff = isSpecialHoliday || shift.id === 'off';
                const periodInfo = getShiftPeriodInfo(shift, isOff);
                const PeriodIcon = periodInfo.Icon;

                return (
                  <div
                    key={cell.dateKey}
                    className={`ws-cal-cell ${cell.isCurrentMonth ? '' : 'is-other-month'} ${isToday ? 'is-today' : ''} ${isOff ? '' : 'is-locked'}`}
                    role="button"
                    tabIndex={0}
                    aria-disabled={!isOff}
                    onClick={() => {
                      if (isOff) openAssignModal(selectedEmp, cell.date);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isOff) openAssignModal(selectedEmp, cell.date);
                      }
                    }}
                    title={isOff
                      ? `Click to change shift for ${selectedEmp.name} on ${cell.dateKey}`
                      : `${shift.name}: shift sudah terkunci dan tidak dapat diubah.`}
                  >
                    <div className="ws-cal-cell-top">
                      <span className="ws-cal-date-num">{cell.date.getDate()}</span>
                      {isToday && <span className="ws-cal-today-tag">Today</span>}
                      <span className="ws-cal-action-icon" aria-label={isOff ? 'Edit shift' : 'Shift terkunci'}>
                        {isOff
                          ? <PencilSimple size={13} weight="bold" />
                          : <LockSimple size={13} weight="bold" />}
                      </span>
                    </div>

                    <div
                      className="ws-cal-shift-pill"
                      style={{
                        backgroundColor: isSpecialHoliday ? '#FEF2F2' : isOff ? '#F8FAFC' : '#ffffff',
                        backgroundImage: isOff ? 'none' : `linear-gradient(${shift.color}15, ${shift.color}15)`,
                        borderColor: isSpecialHoliday ? '#FECDD3' : isOff ? '#E2E8F0' : `${shift.color}55`
                      }}
                    >
                      <div className="ws-cal-shift-header">
                        <span
                          className="ws-shift-period-badge"
                          style={{
                            backgroundColor: periodInfo.bg,
                            color: periodInfo.color,
                            borderColor: periodInfo.border,
                            fontSize: '9.5px',
                            padding: '1px 5px'
                          }}
                        >
                          <PeriodIcon size={10} weight="bold" />
                          <span>{periodInfo.label}</span>
                        </span>
                        <span className="ws-cal-shift-hours" style={{ color: isOff ? '#94a3b8' : '#334155' }}>
                          {isOff ? '0h' : `${shift.workHours}h`}
                        </span>
                      </div>
                      <div className="ws-cal-shift-name">
                        {isSpecialHoliday ? shift.name : (isOff ? 'Day Off' : shift.name)}
                      </div>
                      <div className="ws-cal-shift-time">
                        {!isOff && <Clock size={12} weight="bold" className="text-secondary" aria-hidden="true" />}
                        <span>{isOff ? 'No Time' : `${shift.checkIn} – ${shift.checkOut}`}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
            </>
          )}
        </>
      )}
    </div>

      <dialog ref={importDialogRef} className="emp-modal-card emp-import-modal-card ws-import-dialog" aria-labelledby="ws-import-title" onCancel={(event) => {
        if (importBusy) event.preventDefault();
      }}>
        <div className="emp-modal-header emp-import-modal-header">
          <div className="emp-import-modal-header-left">
            <div className="emp-import-modal-icon-badge" aria-hidden="true"><FileArrowUp size={22} weight="bold" /></div>
            <div className="emp-import-modal-title-group">
              <h3 id="ws-import-title" className="emp-modal-title emp-import-modal-title">Import Work Schedule</h3>
              <p className="emp-modal-subtitle emp-import-modal-subtitle">Upload a completed Excel or CSV file to update employee schedules.</p>
            </div>
          </div>
          <button type="button" className="emp-modal-close" disabled={importBusy} aria-label="Close import dialog" onClick={() => importDialogRef.current?.close()}><X size={18} /></button>
        </div>
        <div className="emp-modal-body">
          <div className="emp-import-template-banner">
            <div className="emp-import-template-left">
              <div className="emp-import-template-icon-wrap"><FileArrowDown size={22} weight="bold" /></div>
              <div className="emp-import-template-info">
                <div className="emp-import-template-title-row">
                  <span className="emp-import-template-title">Official Import Template</span>
                  <span className="emp-import-template-pill">.xlsx format</span>
                </div>
                <div className="emp-import-template-desc">Select dates and department, then choose shift codes in the Excel template.</div>
              </div>
            </div>
            <button type="button" className="emp-import-template-btn" disabled={importBusy} onClick={() => {
              setDownloadMode('template');
              setTemplateError('');
              templateDialogRef.current?.showModal();
            }}><FileArrowDown size={16} weight="bold" /> Download Template (.xlsx)</button>
          </div>
          <input ref={importInputRef} type="file" accept=".xlsx,.csv" hidden disabled={importBusy} onChange={(event) => {
            selectImportFile(event.target.files?.[0]);
            event.target.value = '';
          }} />
          <div className={`add-emp-unified-dropzone ${importDragging ? 'is-dragging' : ''}`}
            role="button" tabIndex={0} aria-disabled={importBusy}
            onClick={() => { if (!importBusy) importInputRef.current?.click(); }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (!importBusy) importInputRef.current?.click();
              }
            }}
            onDragOver={(event) => { event.preventDefault(); if (!importBusy) setImportDragging(true); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setImportDragging(false); }}
            onDrop={(event) => {
              event.preventDefault();
              setImportDragging(false);
              selectImportFile(event.dataTransfer.files?.[0]);
            }}>
            <div className="dropzone-icon-box"><UploadSimple size={26} weight="bold" /></div>
            <span className="add-emp-dropzone-headline">Click or drag &amp; drop a file here to upload</span>
            <span className="add-emp-dropzone-sub">Upload a completed Excel template (.xlsx) or CSV, up to 10 MB.</span>
            <span className="btn add-emp-dropzone-browse-btn"><Plus size={14} weight="bold" /> Browse Documents</span>
          </div>
          {importFile && (
            <div className="add-emp-doc-files-wrap mt-3">
              <div className="add-emp-doc-files-header">
                <span>Attached File (1)</span>
                <button type="button" className="btn btn-link text-primary p-0 text-decoration-none fw-semibold" disabled={importBusy} onClick={() => importInputRef.current?.click()}>Change file</button>
              </div>
              <div className="add-emp-doc-file-card">
                <div className="add-emp-doc-file-left">
                  <div className="add-emp-doc-file-icon" style={{ backgroundColor: '#eaf8ff', color: '#002B7F', borderColor: '#bfdbfe' }}><FileXls size={20} weight="duotone" /></div>
                  <div className="add-emp-doc-file-info">
                    <span className="add-emp-doc-file-name" title={importFile.name}>{importFile.name}</span>
                    <span className="add-emp-doc-file-meta" role="status">
                      {(importFile.size / 1024).toFixed(1)} KB &bull; {importPhase === 'reading'
                        ? `Reading file... ${importProgress}%`
                        : importPhase === 'processing' ? 'Processing records...'
                        : importPhase === 'ready' ? `${importPreview.count} schedules ready`
                        : 'File validation failed'}
                    </span>
                    {importPhase === 'reading' && <progress className="ws-import-progress" value={importProgress} max={100} aria-label="Reading file" />}
                    {importPhase === 'processing' && <progress className="ws-import-progress" aria-label="Processing schedules" />}
                  </div>
                </div>
                <div className="add-emp-doc-file-actions">
                  {importPhase === 'ready' && <CheckCircle size={20} weight="fill" style={{ color: '#15803d' }} aria-label="File ready" />}
                  <button type="button" className="add-emp-btn-doc-delete" title="Remove file" aria-label="Remove file" disabled={importBusy} onClick={resetImportFile}><Trash size={14} weight="bold" /></button>
                </div>
              </div>
            </div>
          )}
          {importError && (
            <div role="alert" className="emp-form-error mt-3 d-flex align-items-start gap-2">
              <WarningCircle size={18} weight="fill" aria-hidden="true" style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                {importErrorFileName && <strong className="d-block">{importErrorFileName}</strong>}
                {importError}
              </span>
            </div>
          )}
        </div>
        <div className="emp-modal-footer">
          <button type="button" className="emp-btn-cancel" disabled={importBusy} onClick={() => importDialogRef.current?.close()}>Cancel</button>
          <button type="button" className="emp-btn-save" disabled={importPhase !== 'ready' || !importPreview || importBusy} onClick={confirmScheduleImport}>{importBusy ? 'Importing...' : 'Import Schedule'}</button>
        </div>
      </dialog>

      <dialog ref={templateDialogRef} className="ws-modal-card ws-template-dialog" aria-labelledby="ws-template-title">
        <form onSubmit={(event) => {
          event.preventDefault();
          downloadScheduleTemplate();
        }}>
          <div className="ws-modal-header">
            <h3 id="ws-template-title">{downloadMode === 'export' ? 'Export Schedule' : 'Download Work Schedule Template'}</h3>
            <button type="button" className="ws-modal-close" aria-label="Close download dialog" onClick={() => templateDialogRef.current?.close()}>
              <X size={18} weight="bold" />
            </button>
          </div>
          <div className="ws-modal-body">
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label htmlFor="ws-template-start" className="ws-modal-label">Start Date</label>
                <input id="ws-template-start" type="date" className="form-control" required value={templateStart} onChange={(event) => {
                  setTemplateStart(event.target.value);
                  if (event.target.value > templateEnd) setTemplateEnd(event.target.value);
                }} />
              </div>
              <div className="col-6">
                <label htmlFor="ws-template-end" className="ws-modal-label">End Date</label>
                <input id="ws-template-end" type="date" className="form-control" required min={templateStart} value={templateEnd} onChange={(event) => setTemplateEnd(event.target.value)} />
              </div>
            </div>
            <label htmlFor="ws-template-department" className="ws-modal-label">Department</label>
            <select id="ws-template-department" className="form-select" value={templateDepartment} onChange={(event) => setTemplateDepartment(event.target.value)}>
              <option value="all">All Departments</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
            <div className="ws-template-info" role="status">
              <Info size={20} weight="fill" aria-hidden="true" />
              <p>
                {templateEmployees.length
                  ? downloadMode === 'export'
                    ? `Export includes schedules for ${templateEmployees.length} employees in a protected Excel file without dropdowns. The Shift Codes sheet includes shift times for reference.`
                    : `Template includes ${templateEmployees.length} employees for the selected dates. All shifts default to OFF. Choose a shift code from the Excel dropdown before importing.`
                  : 'No employees in this department. Select another department.'}
              </p>
            </div>
            {templateError && <p role="alert" className="text-danger mt-3 mb-0">{templateError}</p>}
          </div>
          <div className="ws-modal-footer">
            <button type="button" className="ws-btn-cancel" onClick={() => templateDialogRef.current?.close()}>Cancel</button>
            <button type="submit" className="ws-btn-save" disabled={templateDownloading || !templateDatesValid || !templateEmployees.length}>
              <FileArrowDown size={16} weight="bold" /> {templateDownloading ? 'Downloading...' : downloadMode === 'export' ? 'Export Schedule' : 'Download Template'}
            </button>
          </div>
        </form>
      </dialog>

      {/* 7. Assign Shift Modal */}
      {assignModal.isOpen && assignModal.employee && (
        <div className="ws-modal-backdrop" onClick={closeAssignModal}>
          <div className="ws-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ws-modal-header">
              <h3>Assign Work Shift</h3>
              <button type="button" className="ws-modal-close" onClick={closeAssignModal}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="ws-modal-body">
              {/* Employee Banner */}
              <div className="ws-modal-emp-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={assignModal.employee?.avatar || DEFAULT_AVATAR}
                    alt={assignModal.employee?.name || 'Employee'}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = DEFAULT_AVATAR;
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                      {assignModal.employee.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {getEmployeeJabatan(assignModal.employee)} &bull; {formatDateKey(assignModal.date)}
                    </div>
                  </div>
                </div>

                {selectedShiftId ? (() => {
                  const currShift = allShiftsWithOff.find((s) => s.id === selectedShiftId) || { id: 'off', name: 'Day Off' };
                  const isHoliday = currShift.id === 'off-holiday' || currShift.offType === 'holiday';
                  const isCutiBersama = currShift.id === 'off-cuti-bersama' || currShift.offType === 'cuti_bersama';
                  const isSpecialHoliday = isHoliday || isCutiBersama;
                  const currIsOff = isSpecialHoliday || currShift.id === 'off';
                  const pInfo = getShiftPeriodInfo(currShift, currIsOff);
                  const PIcon = pInfo.Icon;
                  return (
                    <span
                      className="ws-shift-period-badge"
                      style={{
                        backgroundColor: pInfo.bg,
                        color: pInfo.color,
                        borderColor: pInfo.border,
                        padding: '4px 10px',
                        fontSize: '11.5px'
                      }}
                    >
                      <PIcon size={13} weight="bold" />
                      <span>{pInfo.label}</span>
                    </span>
                  );
                })() : (
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                    Select a shift below
                  </span>
                )}
              </div>

              {/* Select Shift from connected Shift Types */}
              <label className="ws-modal-label">
                Select Shift Type (Connected from Master Shift Types)
              </label>
              <div className="ws-shift-picker-grid">
                {allShiftsWithOff.filter((st) => !getShiftPeriodInfo(st, st.id === 'off').isHoliday).map((st) => {
                  const isSelected = selectedShiftId === st.id;
                  const isHoliday = st.id === 'off-holiday' || st.offType === 'holiday';
                  const isCutiBersama = st.id === 'off-cuti-bersama' || st.offType === 'cuti_bersama';
                  const isSpecialHoliday = isHoliday || isCutiBersama;
                  const isOff = isSpecialHoliday || st.id === 'off';
                  const periodInfo = getShiftPeriodInfo(st, isOff);
                  const PeriodIcon = periodInfo.Icon;



                  return (
                    <div
                      key={st.id}
                      className={`ws-picker-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedShiftId(st.id)}
                    >
                      <div className="ws-picker-header">
                        <span
                          className="ws-shift-period-badge"
                          style={{
                            backgroundColor: periodInfo.bg,
                            color: periodInfo.color,
                            borderColor: periodInfo.border
                          }}
                        >
                          <PeriodIcon size={12} weight="bold" />
                          <span>{periodInfo.label}</span>
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                          {isOff ? '0 hrs' : `${st.workHours} hrs`}
                        </span>
                      </div>
                      <div className="ws-picker-name">
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: st.color || '#94a3b8',
                            marginRight: '6px'
                          }}
                        />
                        {st.name}
                      </div>
                      <div className="ws-picker-time">
                        <Clock size={12} weight="bold" style={{ marginRight: '4px', color: '#0284c7' }} />
                        {isOff ? 'No Time' : `${st.checkIn} – ${st.checkOut}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="ws-modal-footer">
              <button type="button" className="ws-btn-cancel" onClick={closeAssignModal}>
                Cancel
              </button>
              <button
                type="button"
                className="ws-btn-save"
                disabled={!selectedShiftId}
                title={!selectedShiftId ? 'Please select a shift type to apply' : 'Apply shift to schedule'}
                onClick={() => saveAssignShift(selectedShiftId)}
              >
                Apply Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Bulk Assign Modal */}
      {bulkModal.isOpen && (
        <div className="ws-modal-backdrop" onClick={closeBulkModal}>
          <div className="ws-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ws-modal-header">
              <h3>Bulk Assign Work Shifts</h3>
              <button type="button" className="ws-modal-close" onClick={closeBulkModal}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="ws-modal-body">
              <div style={{ marginBottom: '14px' }}>
                <label className="ws-modal-label">Target Department</label>
                <select
                  className="form-select"
                  style={{ fontSize: '13px' }}
                  value={bulkDept}
                  onChange={(e) => {
                    const dVal = e.target.value;
                    setBulkDept(dVal);
                    const matching = filteredEmployees.filter((emp) => dVal === 'all' || emp.departmentId === dVal);
                    setBulkEmpIds(matching.map((m) => m.id));
                  }}
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="ws-modal-label">Start Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    className="form-control"
                    style={{ fontSize: '13px' }}
                    value={bulkStart}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBulkStart(val);
                      if (bulkEnd < val) {
                        setBulkEnd(val);
                      }
                    }}
                  />
                </div>
                <div className="col-6">
                  <label className="ws-modal-label">End Date</label>
                  <input
                    type="date"
                    min={bulkStart >= todayStr ? bulkStart : todayStr}
                    className="form-control"
                    style={{ fontSize: '13px' }}
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* Shift Type to Assign */}
              <div style={{ marginBottom: '16px' }}>
                <label className="ws-modal-label">Select Shift Type</label>
                <select
                  className="form-select"
                  style={{ fontSize: '13px' }}
                  value={bulkShiftId}
                  onChange={(e) => setBulkShiftId(e.target.value)}
                >
                  {allShiftsWithOff.map((st) => (
                    <option key={st.id} value={st.id}>
                      [{st.code}] {st.name} ({st.id === 'off' ? 'Day Off' : `${st.checkIn} - ${st.checkOut}, ${st.workHours}h`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff Count preview */}
              <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '12.5px', color: '#1e40af' }}>
                <Info size={16} style={{ marginRight: '6px' }} />
                <span>
                  This will assign the shift to <strong>{bulkEmpIds.length} employee(s)</strong> over the selected date range.
                </span>
              </div>
            </div>
            <div className="ws-modal-footer">
              <button type="button" className="ws-btn-cancel" onClick={closeBulkModal}>
                Cancel
              </button>
              <button
                type="button"
                className="ws-btn-save"
                onClick={() => saveBulkAssign(bulkEmpIds, bulkStart, bulkEnd, bulkShiftId)}
              >
                Apply Bulk Shifts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Success Modal Feedback */}
      {successModal && (
        <div className="ws-modal-backdrop" onClick={closeSuccessModal}>
          <div
            className="ws-modal-card text-center"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', position: 'relative', padding: '40px 32px 32px' }}
          >
            <button
              type="button"
              className="ws-modal-close"
              onClick={closeSuccessModal}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: '#94a3b8'
              }}
            >
              <X size={20} />
            </button>
            <div className="d-flex justify-content-center" style={{ marginBottom: '16px' }}>
              <CheckCircle size={64} weight="fill" color="#10B981" />
            </div>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', lineHeight: 1.3 }}>
              {successModal.title}
            </h4>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: 1.55 }}>
              {successModal.subtext}
            </p>
          </div>
        </div>
      )}

      {/* Floating Instant Tooltip */}
      {hoverTooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${hoverTooltip.x}px`,
            top: hoverTooltip.y < 45 ? `${hoverTooltip.y + (hoverTooltip.height || 20) + 8}px` : `${hoverTooltip.y - 8}px`,
            transform: hoverTooltip.y < 45 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            lineHeight: 1.35,
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.28)',
            pointerEvents: 'none',
            zIndex: 99999,
            transition: 'opacity 0.1s ease'
          }}
        >
          {hoverTooltip.text}
          <div
            style={{
              position: 'absolute',
              top: hoverTooltip.y < 45 ? '-5px' : '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '5px',
              borderStyle: 'solid',
              borderColor: hoverTooltip.y < 45
                ? 'transparent transparent #0f172a transparent'
                : '#0f172a transparent transparent transparent'
            }}
          />
        </div>
      )}
    </div>
  );
}
