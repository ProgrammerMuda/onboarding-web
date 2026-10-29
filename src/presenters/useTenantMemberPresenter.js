import { useState, useMemo, useCallback } from 'react';
import {
  getRowsFor,
  getTenantMemberStats,
  EMPTY_MEMBER_DRAFT,
  isMemberStepComplete,
  isMemberStepFilled,
  memberStepError,
  patchMemberDraft,
  withNewOccupants,
  UNIT_CHOICES,
  buildMemberRow,
  applyMemberEdits,
  releaseOccupant,
  draftFromMember,
  draftFromRenter,
  applyRenterDraft,
  patchRental,
  rentingUnitsById,
  followRenames,
  RENTER_ROWS,
  pendingFirst,
  getRelationOptions,
  getTowerOptions,
  filterRows
} from '../models/TenantMemberModel';
import { getPageItems } from '../models/UnitModel';
import { buildTenantMemberWorkbook } from '../utils/tenantMemberExcel';
import { protectScheduleWorkbook } from '../utils/workScheduleExcel';
import { downloadWorkbook } from '../utils/excelExport';

const EMPTY_FILTERS = { query: '', tower: '', status: '', relation: '' };
const PAGE_SIZE = 10;

export function useTenantMemberPresenter() {
  const [activeTab, setActiveTabState] = useState('tenant');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [addedMembers, setAddedMembers] = useState([]);
  const [pageMode, setPageMode] = useState('list');
  const [wizardStep, setWizardStep] = useState(1);
  const [draft, setDraft] = useState(EMPTY_MEMBER_DRAFT);
  const [showErrors, setShowErrors] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [editedMembers, setEditedMembers] = useState({});
  const [deactivatedIds, setDeactivatedIds] = useState([]);
  const [approvedIds, setApprovedIds] = useState([]);
  const [rejectedMap, setRejectedMap] = useState({});
  const [editingMember, setEditingMember] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [renterEdits, setRenterEdits] = useState({});
  const [deactivatedRenterIds, setDeactivatedRenterIds] = useState([]);
  const [selectedRenterId, setSelectedRenterId] = useState(null);
  const [editingRenter, setEditingRenter] = useState(null);

  const renterRows = useMemo(
    () => applyMemberEdits(RENTER_ROWS, { edited: renterEdits, deactivated: deactivatedRenterIds }),
    [renterEdits, deactivatedRenterIds]
  );
  const renterRenames = useMemo(() => {
    const out = {};
    RENTER_ROWS.forEach((r) => { if (renterEdits[r.id] && renterEdits[r.id].name !== r.name) out[r.name] = renterEdits[r.id].name; });
    return out;
  }, [renterEdits]);

  const memberRows = useMemo(
    () => pendingFirst(followRenames(
      applyMemberEdits([...addedMembers, ...getRowsFor('member')], { edited: editedMembers, deactivated: deactivatedIds, approved: approvedIds, rejected: rejectedMap }),
      renterRenames
    )),
    [addedMembers, editedMembers, deactivatedIds, approvedIds, rejectedMap, renterRenames]
  );
  const stats = useMemo(() => getTenantMemberStats(memberRows), [memberRows]);
  // Units seen by the wizard: renters and proxies saved this session fill their unit,
  // and the member being edited does not block their own slot.
  const unitChoices = useMemo(() => {
    const sessionRows = memberRows.filter((m) => String(m.id).startsWith('new:') || editedMembers[m.id]);
    const units = withNewOccupants(UNIT_CHOICES, sessionRows.filter((m) => m.id !== editingMember?.id));
    return releaseOccupant(units, editingMember);
  }, [memberRows, editedMembers, editingMember]);
  // Used to stop one person (one ID number) from renting a second unit.
  const rentingById = useMemo(() => rentingUnitsById(renterRows, memberRows), [renterRows, memberRows]);
  const selectedMember = useMemo(() => memberRows.find((m) => m.id === selectedId) ?? null, [memberRows, selectedId]);
  const selectedRenter = useMemo(() => renterRows.find((r) => r.id === selectedRenterId) ?? null, [renterRows, selectedRenterId]);
  const selectedRenterMembers = useMemo(
    () => (selectedRenter ? memberRows.filter((m) => m.tenantName === selectedRenter.name) : []),
    [memberRows, selectedRenter]
  );
  const rows = useMemo(
    () => (activeTab === 'member' ? memberRows : renterRows),
    [activeTab, memberRows, renterRows]
  );
  const options = useMemo(
    () => ({ towers: getTowerOptions(rows), relations: getRelationOptions() }),
    [rows]
  );
  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    setFilters(EMPTY_FILTERS);
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

  // Both lists in one protected workbook, styled like the Work Schedule export.
  const [exporting, setExporting] = useState(false);
  const exportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const workbook = buildTenantMemberWorkbook({ tenants: renterRows, members: memberRows, exportedOn: today });
      await protectScheduleWorkbook(workbook);
      await downloadWorkbook(workbook, `tenant-member-${today}.xlsx`);
    } finally {
      setExporting(false);
    }
  }, [renterRows, memberRows]);

  const startAdd = useCallback(() => {
    setShowErrors(false);
    setEditingMember(null);
    setDraft(EMPTY_MEMBER_DRAFT);
    setWizardStep(1);
    setPageMode('add');
  }, []);

  const startEdit = useCallback((member) => {
    setShowErrors(false);
    setEditingMember(member);
    setDraft(draftFromMember(member));
    setWizardStep(1);
    setPageMode('edit');
  }, []);

  // Cancel goes back to where the wizard was opened from: the detail page or the list.
  const cancelAdd = useCallback(() => {
    setEditingMember(null);
    setPageMode(selectedId ? 'detail' : 'list');
  }, [selectedId]);

  const openDetail = useCallback((member) => {
    setFeedback(null);
    setSelectedId(member.id);
    setPageMode('detail');
  }, []);

  const closeDetail = useCallback(() => {
    setFeedback(null);
    setSelectedId(null);
    setPageMode('list');
  }, []);

  const openRenterDetail = useCallback((renter) => {
    setSelectedRenterId(renter.id);
    setPageMode('renter-detail');
  }, []);

  const closeRenterDetail = useCallback(() => {
    setSelectedRenterId(null);
    setPageMode('list');
  }, []);

  // Edit opens the same wizard as Add, filled in. The lease (unit, owner, relation) is locked in step 1.
  const startRenterEdit = useCallback((renter) => {
    setShowErrors(false);
    setEditingRenter(renter);
    setDraft(draftFromRenter(renter));
    setWizardStep(1);
    setPageMode('renter-edit');
  }, []);

  const cancelRenterEdit = useCallback(() => {
    setEditingRenter(null);
    setPageMode(selectedRenterId ? 'renter-detail' : 'list');
  }, [selectedRenterId]);

  const updateRental = useCallback((index, patch) => setDraft((prev) => patchRental(prev, index, patch)), []);

  const saveRenter = useCallback(() => {
    if (!editingRenter || ![1, 2, 3].every((n) => isMemberStepComplete(n, draft, unitChoices, rentingById))) return;
    const row = applyRenterDraft(editingRenter, draft);
    setRenterEdits((prev) => ({ ...prev, [row.id]: row }));
    setEditingRenter(null);
    setPageMode(selectedRenterId ? 'renter-detail' : 'list');
    setSuccessModal({ kind: 'edit', name: row.name });
  }, [editingRenter, draft, unitChoices, rentingById, selectedRenterId]);

  // Activating undoes the deactivation: the person returns to the status they had before (Active or Pending).
  const reactivate = useCallback((id, kind) => {
    const isRenter = kind === 'renter';
    const base = isRenter
      ? (renterEdits[id] ?? RENTER_ROWS.find((r) => r.id === id))
      : (editedMembers[id] ?? [...addedMembers, ...getRowsFor('member')].find((m) => m.id === id));
    if (!base) return;
    (isRenter ? setDeactivatedRenterIds : setDeactivatedIds)((prev) => prev.filter((x) => x !== id));
    setSuccessModal({ kind: 'activate', entity: isRenter ? 'tenant' : 'member', name: base.name, status: base.status });
  }, [renterEdits, editedMembers, addedMembers]);

  // The status a person returns to when activated, so the confirmation can say it.
  const statusBeforeDeactivation = useCallback((id, kind) => {
    const base = kind === 'renter'
      ? (renterEdits[id] ?? RENTER_ROWS.find((r) => r.id === id))
      : (editedMembers[id] ?? [...addedMembers, ...getRowsFor('member')].find((m) => m.id === id));
    return base?.status ?? 'Active';
  }, [renterEdits, editedMembers, addedMembers]);

  const activateMember = useCallback((id) => reactivate(id, 'member'), [reactivate]);
  const activateRenter = useCallback((id) => reactivate(id, 'renter'), [reactivate]);

  const deactivateRenter = useCallback((id) => setDeactivatedRenterIds((prev) => (prev.includes(id) ? prev : [...prev, id])), []);

  // Approve opens a success modal; reject leaves a banner on the page, like the installment approval flow.
  const approveMember = useCallback((row) => {
    setApprovedIds((prev) => (prev.includes(row.id) ? prev : [...prev, row.id]));
    setSuccessModal({
      kind: 'approve',
      name: row.name,
      unitCode: row.unitCodes[0],
      parentName: row.tenantName,
      parentRole: row.parentRole,
      relation: row.relation
    });
  }, []);

  const rejectMember = useCallback((row, reason) => {
    setRejectedMap((prev) => ({ ...prev, [row.id]: reason }));
    setFeedback({
      type: 'danger',
      title: 'Member Rejected',
      message: `${row.name} was not added to ${row.tenantName}'s members in ${row.unitCodes[0]}: "${reason}".`
    });
  }, []);

  const dismissFeedback = useCallback(() => setFeedback(null), []);

  const deactivateMember = useCallback((id) => setDeactivatedIds((prev) => (prev.includes(id) ? prev : [...prev, id])), []);

  const updateDraft = useCallback((patch) => setDraft((prev) => patchMemberDraft(prev, patch)), []);

  const goToStep = useCallback((step) => {
    setShowErrors(false);
    setWizardStep(step);
  }, []);

  // Format problems show as helper text under their fields once Next is pressed.
  const nextStep = useCallback(() => {
    if (!isMemberStepFilled(wizardStep, draft, unitChoices)) return;
    const problem = memberStepError(wizardStep, draft, rentingById);
    setShowErrors(Boolean(problem));
    if (problem) return;
    setWizardStep(Math.min(wizardStep + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [wizardStep, draft, unitChoices, rentingById]);

  const saveMember = useCallback(() => {
    if (![1, 2, 3].every((s) => isMemberStepComplete(s, draft, unitChoices, rentingById))) return;

    if (editingMember) {
      // An edit keeps the member's id and current status.
      const row = { ...buildMemberRow(draft, 0, unitChoices), id: editingMember.id, status: editingMember.status };
      if (String(row.id).startsWith('new:')) setAddedMembers((prev) => prev.map((m) => (m.id === row.id ? row : m)));
      else setEditedMembers((prev) => ({ ...prev, [row.id]: row }));
      setEditingMember(null);
      setPageMode(selectedId ? 'detail' : 'list');
      setSuccessModal({ kind: 'edit', name: row.name });
      return;
    }

    const row = buildMemberRow(draft, addedMembers.length + 1, unitChoices);
    setAddedMembers((prev) => [row, ...prev]);
    setActiveTabState('member');
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setPageMode('list');
    setSuccessModal({ kind: 'add', name: row.name, parentName: row.tenantName, unitCode: row.unitCodes[0] });
  }, [draft, unitChoices, rentingById, addedMembers.length, editingMember, selectedId]);

  const closeSuccessModal = useCallback(() => setSuccessModal(null), []);


  // Jump to the Member tab showing only this tenant's members.
  const viewMembersOf = useCallback((tenantName) => {
    setSelectedRenterId(null);
    setPageMode('list');
    setActiveTabState('member');
    setFilters({ ...EMPTY_FILTERS, query: tenantName });
    setPage(1);
  }, []);

  return {
    viewMembersOf, approveMember, rejectMember, feedback, dismissFeedback, deactivateMember, activateMember, activateRenter, statusBeforeDeactivation,
    selectedRenter, selectedRenterMembers, openRenterDetail, closeRenterDetail,
    startRenterEdit, cancelRenterEdit, updateRental, isRenterEdit: pageMode === 'renter-edit', saveRenter, deactivateRenter,
    startEdit, isEditing: Boolean(editingMember),
    selectedMember, openDetail, closeDetail,
    unitChoices, rentingById,
    successModal, closeSuccessModal,
    pageMode, startAdd, cancelAdd, wizardStep, goToStep, nextStep, showErrors, draft, updateDraft, saveMember,
    activeTab,
    setActiveTab,
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
    exporting
  };
}
