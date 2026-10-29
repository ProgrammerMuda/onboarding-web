import { useState, useMemo, useCallback } from 'react';
import {
  SEED_UNITS,
  readCustomUnits,
  persistCustomUnits,
  countByCategory,
  filterUnits,
  getFilterOptions,
  getEmptyDraft,
  draftFromUnit,
  applyUnitEdit,
  mergeUnits,
  applyDraftPatch,
  validateUnitInfo,
  validateUnitDetail,
  buildUnit,
  getPageItems,
  getCategory,
  importRowsToUnits
} from '../models/UnitModel';
import { parseUnitImportFile, downloadWorkbook } from '../utils/excelExport';
import { buildUnitWorkbook } from '../utils/listExcel';
import { protectScheduleWorkbook } from '../utils/workScheduleExcel';

const EMPTY_FILTERS = { tower: '', floor: '', status: '', query: '' };
const PAGE_SIZE = { table: 10, cards: 9 };

export function useUnitPresenter() {
  const [customUnits, setCustomUnits] = useState(readCustomUnits);
  const [activeTab, setActiveTabState] = useState('hunian');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [viewMode, setViewModeState] = useState('table');
  const [page, setPage] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [pageMode, setPageMode] = useState('list');
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardDraft, setWizardDraft] = useState(() => getEmptyDraft());
  const [formError, setFormError] = useState('');
  const [successModal, setSuccessModal] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);

  const allUnits = useMemo(() => mergeUnits(SEED_UNITS, customUnits), [customUnits]);
  const counts = useMemo(() => countByCategory(allUnits), [allUnits]);
  const options = useMemo(() => getFilterOptions(allUnits, activeTab), [allUnits, activeTab]);
  const filtered = useMemo(
    () => filterUnits(allUnits, { category: activeTab, ...filters }),
    [allUnits, activeTab, filters]
  );

  const pageSize = PAGE_SIZE[viewMode];
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedUnits = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageItems = getPageItems(currentPage, totalPages);

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const setViewMode = useCallback((mode) => {
    setViewModeState(mode);
    setPage(1);
  }, []);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const startAdd = useCallback(() => {
    setFormError('');
    setWizardStep(1);
    setWizardDraft(getEmptyDraft(activeTab));
    setPageMode('add');
  }, [activeTab]);

  const startEdit = useCallback((unit) => {
    setFormError('');
    setWizardStep(1);
    setEditingUnit(unit);
    setWizardDraft(draftFromUnit(unit));
    setPageMode('edit');
  }, []);

  const cancelAdd = useCallback(() => {
    setFormError('');
    setEditingUnit(null);
    setPageMode('list');
  }, []);

  const updateWizardDraft = useCallback((patch) => {
    setFormError('');
    setWizardDraft((prev) => applyDraftPatch(prev, patch));
  }, []);

  // While editing, the unit's own name is not a duplicate of itself.
  const validateStep = useCallback((step, draft) => {
    if (step === 1) return validateUnitInfo(draft, allUnits.filter((u) => u.id !== editingUnit?.id));
    if (step === 2) return validateUnitDetail(draft);
    return '';
  }, [allUnits, editingUnit]);

  const goToStep = useCallback((step) => {
    setFormError('');
    setWizardStep(step);
  }, []);

  const nextStep = useCallback(() => {
    const error = validateStep(wizardStep, wizardDraft);
    if (error) {
      setFormError(error);
      return false;
    }
    setFormError('');
    setWizardStep((s) => Math.min(3, s + 1));
    return true;
  }, [wizardStep, wizardDraft, validateStep]);

  const saveUnit = useCallback(() => {
    for (const step of [1, 2]) {
      const error = validateStep(step, wizardDraft);
      if (error) {
        setWizardStep(step);
        setFormError(error);
        return false;
      }
    }
    const isEdit = Boolean(editingUnit);
    const saved = isEdit ? applyUnitEdit(editingUnit, wizardDraft) : buildUnit(wizardDraft);
    const next = isEdit
      ? (customUnits.some((u) => u.id === saved.id)
        ? customUnits.map((u) => (u.id === saved.id ? saved : u))
        : [saved, ...customUnits])
      : [saved, ...customUnits];
    if (!persistCustomUnits(next)) {
      setFormError('Could not save the unit to local storage.');
      return false;
    }
    setCustomUnits(next);
    setActiveTabState(saved.category);
    if (!isEdit) {
      setFilters(EMPTY_FILTERS);
      setPage(1);
    }
    setFormError('');
    setEditingUnit(null);
    setPageMode('list');
    setSuccessModal({
      title: isEdit ? 'Unit Updated Successfully!' : 'New Unit Added!',
      subtext: `${getCategory(saved.category).label} "${saved.code}" has been ${isEdit ? 'updated' : 'saved'} successfully.`
    });
    return true;
  }, [wizardDraft, customUnits, editingUnit, validateStep]);

  const closeSuccessModal = useCallback(() => setSuccessModal(null), []);

  // Import: read the template, then check every row like the Add Unit form, against all units already there.
  const prepareUnitImport = useCallback(async (file, category) => {
    const rows = await parseUnitImportFile(file, category);
    const { units, errors } = importRowsToUnits(rows, category, allUnits);
    return { ready: units.length, errors, payload: units };
  }, [allUnits]);

  const importUnits = useCallback((units) => {
    if (!units.length) return false;
    const next = [...units, ...customUnits];
    if (!persistCustomUnits(next)) return false;
    setCustomUnits(next);
    setActiveTabState(units[0].category);
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setSuccessModal({
      title: 'Units Imported!',
      subtext: `${units.length} ${getCategory(units[0].category).label} ${units.length === 1 ? 'record has' : 'records have'} been added.`
    });
    return true;
  }, [customUnits]);

  // Exports the units on the active tab with the filters applied, like the Tenant Member export.
  const [exporting, setExporting] = useState(false);
  const exportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const workbook = buildUnitWorkbook({ units: filtered, category: activeTab, exportedOn: today });
      await protectScheduleWorkbook(workbook);
      await downloadWorkbook(workbook, `units-${activeTab}-${today}.xlsx`);
    } finally {
      setExporting(false);
    }
  }, [filtered, activeTab]);

  return {
    activeTab,
    setActiveTab,
    counts,
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters,
    options,
    viewMode,
    setViewMode,
    totalRecords: filtered.length,
    pagedUnits,
    pageSize,
    currentPage,
    totalPages,
    pageItems,
    setPage,
    selectedUnit,
    openDetail: (unit) => {
      setSelectedUnit(unit);
      setPageMode('detail');
    },
    closeDetail: () => {
      setSelectedUnit(null);
      setPageMode('list');
    },
    pageMode,
    wizardStep,
    wizardDraft,
    updateWizardDraft,
    goToStep,
    nextStep,
    startAdd,
    startEdit,
    editingUnit,
    cancelAdd,
    saveUnit,
    prepareUnitImport,
    importUnits,
    formError,
    successModal,
    closeSuccessModal,
    exportExcel,
    exporting
  };
}
