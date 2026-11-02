/**
 * useAttendanceReportPresenter.js - Presenter Layer (MVP)
 * Filters, paging and Excel export for Report Attendance.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  INITIAL_ATTENDANCE,
  EMPTY_FILTERS,
  DEFAULT_PERIOD,
  resolvePeriod,
  filterAttendance,
  selectExportLogs,
  buildPageItems
} from '../models/AttendanceReportModel';
import { readShiftTypes } from '../models/ShiftTypeModel';
import { DEPARTMENTS } from '../models/ApprovalFlowModel';
import { buildAttendanceWorkbook } from '../utils/attendanceExcel';
import { protectScheduleWorkbook } from '../utils/workScheduleExcel';
import { downloadWorkbook } from '../utils/excelExport';

const PAGE_SIZE = 10;

export function useAttendanceReportPresenter() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [period, setPeriodState] = useState(DEFAULT_PERIOD);
  const [page, setPageState] = useState(1);
  const [exporting, setExporting] = useState(false);

  const [from, to] = useMemo(() => resolvePeriod(period.mode, period.custom), [period]);
  const shiftTypes = useMemo(readShiftTypes, []);
  const logs = useMemo(() => {
    const byId = new Map(shiftTypes.map((st) => [st.id, st]));
    return INITIAL_ATTENDANCE.map((r) => ({
      ...r,
      shiftType: byId.get(r.shiftId) || null,
      shift: byId.get(r.shiftId)?.name || 'No shift',
      departmentName: DEPARTMENTS.find((d) => d.id === r.departmentId)?.name || '',
      changedFromShift: byId.get(r.changedFromShiftId)?.name || '',
      changedFromShiftType: byId.get(r.changedFromShiftId) || null,
      bkoShift: byId.get(r.bkoShiftId)?.name || '',
      bkoShiftType: byId.get(r.bkoShiftId) || null
    }));
  }, [shiftTypes]);
  const filtered = useMemo(
    () => filterAttendance(logs, { ...filters, from, to }),
    [logs, filters, from, to]
  );
  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );
  const pageItems = useMemo(() => buildPageItems(totalPages, currentPage), [totalPages, currentPage]);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPageState(1);
  }, []);
  const setPeriod = useCallback((mode, custom = null) => {
    setPeriodState({ mode, custom });
    setPageState(1);
  }, []);
  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPeriodState(DEFAULT_PERIOD);
    setPageState(1);
  }, []);
  const hasActiveFilters = period.mode !== DEFAULT_PERIOD.mode
    || Object.keys(EMPTY_FILTERS).some((k) => filters[k] !== EMPTY_FILTERS[k]);

  // Says which filters are on, for the banner of the export.
  const filterText = useMemo(() => {
    const parts = [];
    if (filters.department) parts.push(`Department: ${DEPARTMENTS.find((d) => d.id === filters.department)?.name || filters.department}`);
    if (filters.shift) {
      const st = shiftTypes.find((x) => x.id === filters.shift);
      parts.push(`Shift: ${st ? `${st.code} - ${st.name}` : filters.shift}`);
    }
    if (filters.query.trim()) parts.push(`Search: ${filters.query.trim()}`);
    return parts.length ? `Filters: ${parts.join(', ')}` : 'No filters besides the period';
  }, [filters, shiftTypes]);

  // Exports what the filters show: the period, department, shift and search. With a shift filter an employee
  // gets only the days of that shift; without one, every date of the period.
  // Returns { rows, employees } on success and false when the file could not be made.
  const exportExcel = useCallback(async () => {
    setExporting(true);
    try {
      // Let the button repaint as "Exporting…" before the heavy part starts.
      await new Promise((resolve) => setTimeout(resolve, 0));
      const today = new Date().toISOString().slice(0, 10);
      const { logs: exported, onlyLoggedDays, rows, employees } = selectExportLogs({
        filtered, allLogs: logs, from, to, shiftFilter: filters.shift
      });
      const workbook = buildAttendanceWorkbook({ logs: exported, from, to, exportedOn: today, filterText, onlyLoggedDays });
      await protectScheduleWorkbook(workbook, { spinCount: 1000 });
      await downloadWorkbook(workbook, `report-attendance-${today}.xlsx`);
      return { rows, employees };
    } catch (err) {
      console.error('Failed to export attendance report:', err);
      return false;
    } finally {
      setExporting(false);
    }
  }, [filtered, filters.shift, filterText, logs, from, to]);

  return {
    filters, setFilter, period, departments: DEPARTMENTS, shiftTypes, from, to, setPeriod, resetFilters, hasActiveFilters,
    pagedRows, totalRecords, currentPage, totalPages, pageItems, pageSize: PAGE_SIZE,
    setPage: setPageState,
    exportExcel, exporting
  };
}
