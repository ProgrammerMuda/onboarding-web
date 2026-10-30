import { useState, useMemo, useCallback } from 'react';
import { SEED_UNITS, getPageItems } from '../models/UnitModel';
import {
  buildBills,
  buildLedger,
  buildDepositRows,
  getDepositStats,
  getAreaOptions,
  filterDeposits,
  balanceOf,
  billStatus,
  openBills,
  autoPayRule,
  historyLines,
  lineBalances,
  byPriority,
  buildEntry,
  decideEntry,
  markInvoicePaid,
  cancelInvoice,
  sendInvoice,
  editDraft,
  nextInvoiceNumber,
  nowLocal
} from '../models/DepositModel';
import { buildDepositWorkbook, buildDepositHistoryWorkbook } from '../utils/listExcel';
import { protectScheduleWorkbook } from '../utils/workScheduleExcel';
import { downloadWorkbook } from '../utils/excelExport';

const EMPTY_FILTERS = { query: '', tower: '', balance: '' };
const PAGE_SIZE = 10;
const BILLS = buildBills(SEED_UNITS);
const SEED_LEDGER = buildLedger(SEED_UNITS, BILLS);

export function useDepositMonthlyPresenter() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [entries, setEntries] = useState(SEED_LEDGER);
  const [selectedId, setSelectedId] = useState(null);
  // The invoice page open on top of the unit's page. Kept here so a new draft can be opened straight away.
  const [invoiceId, setInvoiceId] = useState(null);
  // { unitId, mode: 'topup' | 'allocate' | 'manage', editId } while the deposit modal is open
  const [panel, setPanel] = useState(null);
  const [nextId, setNextId] = useState(1);

  const rows = useMemo(() => buildDepositRows(SEED_UNITS, entries), [entries]);
  const stats = useMemo(() => getDepositStats(rows), [rows]);
  const options = useMemo(() => ({ towers: getAreaOptions(rows) }), [rows]);
  const filtered = useMemo(() => filterDeposits(rows, filters), [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Everything one unit needs: its row, ledger (newest first), bills, and balance.
  // `leaveOut` hides one entry from the maths, so a draft being edited does not count against itself.
  const unitView = useCallback((unitId, leaveOut = null) => {
    if (!unitId) return null;
    const row = rows.find((r) => r.id === unitId);
    const unitEntries = entries.filter((e) => e.unitId === unitId && e.id !== leaveOut);
    const unitBills = BILLS.filter((b) => b.unitId === unitId);
    const lines = historyLines(unitEntries);
    return {
      row,
      balance: balanceOf(unitEntries),
      bills: billStatus(unitBills, unitEntries).sort(byPriority),
      openBills: openBills(unitBills, unitEntries),
      autoPay: autoPayRule(unitEntries),
      lines,
      balanceAfter: lineBalances(lines),
      billsById: Object.fromEntries(unitBills.map((b) => [b.id, b])),
      ledger: [...unitEntries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    };
  }, [rows, entries]);

  const selected = useMemo(() => unitView(selectedId), [unitView, selectedId]);
  const panelUnit = useMemo(() => (panel ? unitView(panel.unitId, panel.editId) : null), [unitView, panel]);
  const panelEntry = useMemo(() => (panel?.editId ? entries.find((e) => e.id === panel.editId) ?? null : null), [entries, panel]);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  // Saves what the modal holds. A top up becomes a draft invoice and its page opens; editing a draft keeps its place.
  const submitEntry = useCallback((draft) => {
    const rule = panelUnit.autoPay;
    const shared = {
      currentAutoPay: rule.categories,
      bills: panelUnit.openBills,
      spendable: panelUnit.balance.spendable
    };
    if (panelEntry) {
      const saved = editDraft(panelEntry, draft, shared);
      setEntries((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      setPanel(null);
      return { entry: saved, edited: true };
    }
    const now = nowLocal();
    const entry = buildEntry(draft, {
      ...shared,
      id: `new-${String(nextId).padStart(4, '0')}`,
      unitId: panel.unitId,
      mode: panel.mode,
      now,
      invoiceNo: panel.mode === 'topup' ? nextInvoiceNumber(entries, now.slice(0, 10)) : undefined
    });
    setEntries((prev) => [entry, ...prev]);
    setNextId((n) => n + 1);
    setPanel(null);
    if (entry.type === 'topup') {
      setSelectedId(panel.unitId);
      setInvoiceId(entry.id);
    }
    return { entry, edited: false };
  }, [nextId, panel, panelUnit, panelEntry, entries]);

  const sendDraft = useCallback((id) => setEntries((prev) => sendInvoice(prev, id, nowLocal())), []);
  const discardDraft = useCallback((id) => setEntries((prev) => cancelInvoice(prev, id, 'Draft discarded')), []);

  const markPaid = useCallback((id, proofName) => {
    setEntries((prev) => markInvoicePaid(prev, id, nowLocal(), proofName));
  }, []);

  const approveEntry = useCallback((id) => setEntries((prev) => decideEntry(prev, id, 'approved')), []);
  const rejectEntry = useCallback((id, reason) => setEntries((prev) => decideEntry(prev, id, 'rejected', reason)), []);

  // Exports the rows that match the current filters. Returns false when the file could not be made.
  const exportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const workbook = buildDepositWorkbook({ deposits: filtered, exportedOn: today });
      await protectScheduleWorkbook(workbook);
      await downloadWorkbook(workbook, `deposit-monthly-${today}.xlsx`);
      return true;
    } catch (err) {
      console.error('Failed to export deposits:', err);
      return false;
    } finally {
      setExporting(false);
    }
  }, [filtered]);

  // Exports one unit's history, the lines that match the filters on its page. Returns false on failure.
  const exportHistory = useCallback(async (unit, shown) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const workbook = buildDepositHistoryWorkbook({
        unitCode: unit.row.unitCode,
        tenantName: unit.row.tenantName,
        exportedOn: today,
        lines: shown.map((l) => ({ ...l, balanceAfter: unit.balanceAfter[l.id] ?? null }))
      });
      await protectScheduleWorkbook(workbook);
      await downloadWorkbook(workbook, `deposit-${unit.row.unitCode}-${today}.xlsx`);
      return true;
    } catch (err) {
      console.error('Failed to export deposit history:', err);
      return false;
    }
  }, []);

  return {
    stats,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters: Object.values(filters).some(Boolean),
    options,
    pagedRows,
    totalRecords: filtered.length,
    pageSize: PAGE_SIZE,
    currentPage,
    totalPages,
    pageItems: getPageItems(currentPage, totalPages),
    setPage,
    exportExcel,
    exportHistory,
    exporting,
    selected,
    openDetail: (row) => setSelectedId(row.id),
    closeDetail: () => { setSelectedId(null); setInvoiceId(null); },
    invoiceId,
    openInvoice: setInvoiceId,
    closeInvoice: () => setInvoiceId(null),
    panel,
    panelUnit,
    panelEntry,
    openPanel: (unitId, mode, editId = null) => setPanel({ unitId, mode, editId }),
    closePanel: () => setPanel(null),
    submitEntry,
    sendDraft,
    discardDraft,
    approveEntry,
    rejectEntry,
    markPaid
  };
}
