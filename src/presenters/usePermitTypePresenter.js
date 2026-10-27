import { useState, useCallback, useMemo } from 'react';
import {
  PERMIT_STORAGE_KEY,
  validatePermitType,
  readHolidays,
  persistHolidays,
  calculateHolidayImpact,
  readEmployeeBalances,
  persistEmployeeBalances,
  readAdjustments,
  persistAdjustments,
  ADJUSTMENT_APPROVER_LABELS,
  ADJUSTMENT_MOCK_REQUESTER_IDS,
  buildApprovalChain,
  getCurrentApprovalStep
} from '../models/PermitTypeModel';
import { EMPLOYEES } from '../models/ApprovalFlowModel';

export function usePermitTypePresenter() {
  // Navigation: 'policies' | 'holidays' | 'balances'
  const [activeTab, setActiveTab] = useState('policies');

  // =========================================================================
  // TAB 1: PERMIT & LEAVE POLICIES
  // =========================================================================
  const [permits, setPermits] = useState(() => {
    let existing = [];
    try {
      const raw = JSON.parse(localStorage.getItem(PERMIT_STORAGE_KEY));
      const saved = Array.isArray(raw) ? raw.map((item) => item && ({
        ...item,
        category: item.category || (item.name.toLowerCase().includes('annual') ? 'annual' : 'special'),
        eventDurationDays: item.eventDurationDays ?? null,
        allowedDates: item.allowedDates ?? 'both',
        isActive: item.isActive !== false,
        dayCountType: item.dayCountType || 'work_days',
        allowHalfDay: item.allowHalfDay ?? true,
        requiresDocument: 'always',
        documentMinDays: 1,
        allowNegativeBalance: item.allowNegativeBalance ?? false,
        maxNegativeDays: item.maxNegativeDays ?? 0,
        allowCarryOver: item.allowCarryOver ?? false,
        maxCarryOverDays: item.maxCarryOverDays ?? 0,
        carryOverExpiryMonths: item.carryOverExpiryMonths ?? 0
      })) : raw;
      if (Array.isArray(saved)) existing = saved;
    } catch { /* storage fallback */ }
    return existing;
  });

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draft, setDraft] = useState(null);
  const [detailPermit, setDetailPermit] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [successModal, setSuccessModal] = useState(null);

  function persistPermits(next, message = '') {
    try {
      const normalized = next.map((permit) => ({ ...permit, requiresDocument: 'always', documentMinDays: 1 }));
      localStorage.setItem(PERMIT_STORAGE_KEY, JSON.stringify(normalized));
      setPermits(normalized);
      setPage(1);
      if (message) setNotification(message);
      setError('');
      return true;
    } catch {
      setError('Changes could not be saved. Browser storage is unavailable.');
      return false;
    }
  }

  const filteredPermits = useMemo(() => {
    return permits.filter((permit) => {
      const q = query.trim().toLocaleLowerCase('id');
      const matchesQuery = !q || permit.name.toLocaleLowerCase('id').includes(q);
      const matchesCategory = categoryFilter === 'all' || permit.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? permit.isActive !== false : permit.isActive === false);
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [permits, query, categoryFilter, statusFilter]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredPermits.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const openEditor = (permit) => {
    setError('');
    setDraft(permit ? { ...permit, requiresDocument: 'always', documentMinDays: 1 } : {
      id: `permit-${Date.now()}`,
      name: '',
      category: 'annual',
      description: '',
      hasQuota: true,
      quota: '',
      eventDurationDays: '',
      isProrated: false,
      frequency: 'annual',
      allowedDates: 'both',
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
    });
  };

  const closeEditor = () => {
    setDraft(null);
    setError('');
  };

  const saveDraft = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!draft) return;
    const err = validatePermitType(draft, permits);
    if (err) {
      setError(err);
      return;
    }

    const isNew = !permits.some((p) => p.id === draft.id);
    const normalizedDraft = {
      ...draft,
      name: draft.name.trim(),
      isActive: isNew ? true : draft.isActive !== false,
      requiresDocument: 'always',
      documentMinDays: 1,
      hasQuota: draft.category === 'annual',
      quota: draft.category === 'annual' ? Number(draft.quota) : null,
      frequency: draft.category === 'annual' ? 'annual' : null,
      eventDurationDays: draft.category === 'special' ? Number(draft.eventDurationDays) : null,
      isProrated: draft.category === 'annual' && Boolean(draft.isProrated),
      allowNegativeBalance: draft.category === 'annual' && Boolean(draft.allowNegativeBalance),
      maxNegativeDays: draft.category === 'annual' && draft.allowNegativeBalance ? Number(draft.maxNegativeDays) : 0,
      allowCarryOver: draft.category === 'annual' && Boolean(draft.allowCarryOver),
      maxCarryOverDays: draft.category === 'annual' && draft.allowCarryOver ? Number(draft.maxCarryOverDays) : 0,
      carryOverExpiryMonths: draft.category === 'annual' && draft.allowCarryOver ? Number(draft.carryOverExpiryMonths) : 0,
    };
    const next = isNew ? [normalizedDraft, ...permits] : permits.map((p) => p.id === draft.id ? normalizedDraft : p);

    if (persistPermits(next, '')) {
      const savedName = draft.name;
      closeEditor();
      setSuccessModal({
        title: isNew ? 'Leave type created' : 'Leave type updated',
        subtext: `“${savedName}” has been saved.`
      });
    }
  };

  const requestToggleStatus = (permit) => {
    setError('');
    setStatusTarget(permit);
  };

  const closeStatusModal = () => {
    setStatusTarget(null);
    setError('');
  };

  const confirmToggleStatus = () => {
    if (!statusTarget) return;
    const willBeActive = statusTarget.isActive === false;
    const next = permits.map((p) => p.id === statusTarget.id ? { ...p, isActive: willBeActive } : p);
    if (persistPermits(next, '')) {
      const targetName = statusTarget.name;
      setStatusTarget(null);
      setSuccessModal({
        title: willBeActive ? 'Leave type reactivated' : 'Leave type deactivated',
        subtext: willBeActive
          ? `“${targetName}” is available for new requests again.`
          : `“${targetName}” remains in your records and is unavailable for new requests.`
      });
    }
  };

  // =========================================================================
  // TAB 2: HOLIDAYS & CUTI BERSAMA
  // =========================================================================
  const [holidays, setHolidays] = useState(readHolidays);
  const [holidaySearch, setHolidaySearch] = useState('');
  const [holidayTypeFilter, setHolidayTypeFilter] = useState('all'); // 'all' | 'national_holiday' | 'cuti_bersama'
  const [holidayViewMode, setHolidayViewMode] = useState('calendar'); // 'calendar' | 'table'
  const [holidayCalendarDate, setHolidayCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayDraft, setHolidayDraft] = useState(null);
  const [pastAmendmentReason, setPastAmendmentReason] = useState('');
  const [showImpactModal, setShowImpactModal] = useState(false);

  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      const q = holidaySearch.trim().toLowerCase();
      const matchesSearch = !q || h.name.toLowerCase().includes(q) || h.date.includes(q);
      const matchesType = holidayTypeFilter === 'all'
        || (holidayTypeFilter === 'cuti_bersama' ? h.isCutiBersama : !h.isCutiBersama);
      return matchesSearch && matchesType;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, holidaySearch, holidayTypeFilter]);

  const todayIso = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const openNewHoliday = (initialDate = '') => {
    // Only allow dates from today onwards; if past or omitted, default to todayIso
    const defaultDate = (initialDate && initialDate >= todayIso) ? initialDate : todayIso;
    setEditingHoliday(null);
    setHolidayDraft({
      id: `hol-${Date.now()}`,
      date: defaultDate,
      name: '',
      isCutiBersama: false,
      type: 'national_holiday',
      treatment: 'free_leave',
      scope: 'all',
      scopeValue: [],
      note: ''
    });
    setPastAmendmentReason('');
    setError('');
  };

  const openHolidayEditor = (holiday) => {
    setEditingHoliday(holiday);
    setHolidayDraft({
      ...holiday,
      isCutiBersama: Boolean(holiday.isCutiBersama),
      type: holiday.isCutiBersama ? 'cuti_bersama' : 'national_holiday',
      treatment: holiday.treatment || (holiday.isCutiBersama ? 'deduct_annual' : 'free_leave'),
      scope: holiday.scope || 'all',
      scopeValue: holiday.scopeValue || [],
      note: holiday.note || ''
    });
    setPastAmendmentReason('');
  };

  const closeHolidayEditor = () => {
    setEditingHoliday(null);
    setHolidayDraft(null);
    setPastAmendmentReason('');
  };

  const deleteHoliday = (holidayId) => {
    const target = holidays.find(h => h.id === holidayId);
    const nextHolidays = holidays.filter(h => h.id !== holidayId);
    persistHolidays(nextHolidays);
    setHolidays(nextHolidays);
    closeHolidayEditor();
    setSuccessModal({
      title: 'Holiday Deleted',
      subtext: target ? `“${target.name}” (${target.date}) has been removed from the calendar.` : 'Holiday deleted successfully.'
    });
  };

  // Check if holiday is in the past
  const isHolidayInPast = useMemo(() => {
    if (!holidayDraft) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holDate = new Date(holidayDraft.date + 'T00:00:00');
    return holDate < today;
  }, [holidayDraft]);

  const currentHolidayImpact = useMemo(() => {
    if (!holidayDraft) return { affectedEmployeesCount: 0, totalDaysDeducted: 0, sampleAffectedEmployees: [], affectedDeptNames: [] };
    return calculateHolidayImpact(holidayDraft, EMPLOYEES);
  }, [holidayDraft]);

  const saveHolidayPolicy = () => {
    if (!holidayDraft) return;

    if (!holidayDraft.name?.trim()) {
      setError('Holiday or collective leave name is required.');
      return;
    }
    if (!holidayDraft.date?.trim()) {
      setError('Holiday date is required.');
      return;
    }

    const dateTaken = holidays.find(h => h.date === holidayDraft.date && h.id !== holidayDraft.id);
    if (dateTaken) {
      setError(`${holidayDraft.date} already has “${dateTaken.name}”. Only one holiday is allowed per date.`);
      return;
    }

    const isDeptScoped = Boolean(holidayDraft.isCutiBersama) && holidayDraft.scope === 'departments';
    const selectedDeptIds = isDeptScoped ? (holidayDraft.scopeValue || []) : [];
    if (isDeptScoped && selectedDeptIds.length === 0) {
      setError('Select at least one department that gets this collective leave.');
      return;
    }

    // Set correct type field matching isCutiBersama
    const sanitizedDraft = {
      ...holidayDraft,
      name: holidayDraft.name.trim(),
      isCutiBersama: Boolean(holidayDraft.isCutiBersama),
      type: holidayDraft.isCutiBersama ? 'cuti_bersama' : 'national_holiday',
      treatment: holidayDraft.isCutiBersama ? (holidayDraft.treatment || 'deduct_annual') : 'free_leave',
      scope: isDeptScoped ? 'departments' : 'all',
      scopeValue: selectedDeptIds
    };

    const isNew = !editingHoliday || !holidays.some(h => h.id === sanitizedDraft.id);

    // Cannot add a holiday on a past date relative to today
    if (isNew && sanitizedDraft.date < todayIso) {
      setError(`New holidays cannot be added on a past date (${sanitizedDraft.date}). Please choose today or a future date.`);
      return;
    }

    if (!isNew && isHolidayInPast && sanitizedDraft.isCutiBersama) {
      if (!pastAmendmentReason.trim()) {
        setError('A past-date revision reason is required for audit approval.');
        return;
      }

      // Create a pending past amendment
      const nextHolidays = holidays.map(h => {
        if (h.id === sanitizedDraft.id) {
          return {
            ...h,
            ...sanitizedDraft,
            pendingAmendment: {
              proposedTreatment: sanitizedDraft.treatment,
              proposedScope: sanitizedDraft.scope,
              proposedScopeValue: sanitizedDraft.scopeValue,
              reason: pastAmendmentReason,
              requestedAt: new Date().toLocaleString('en-US'),
              requestedBy: 'HR Operation Admin',
              approverRole: 'HR Director'
            }
          };
        }
        return h;
      }).sort((a, b) => a.date.localeCompare(b.date));

      persistHolidays(nextHolidays);
      setHolidays(nextHolidays);
      closeHolidayEditor();
      setSuccessModal({
        title: 'Past-Date Revision Submitted',
        subtext: `The collective leave revision for “${sanitizedDraft.name}” was sent to the HR Director for audit approval before balances are reconciled.`
      });
      return;
    }

    let nextHolidays;
    if (isNew) {
      nextHolidays = [...holidays, sanitizedDraft].sort((a, b) => a.date.localeCompare(b.date));
    } else {
      nextHolidays = holidays.map(h => h.id === sanitizedDraft.id ? sanitizedDraft : h).sort((a, b) => a.date.localeCompare(b.date));
    }

    persistHolidays(nextHolidays);
    setHolidays(nextHolidays);
    closeHolidayEditor();
    setSuccessModal({
      title: isNew
        ? (sanitizedDraft.isCutiBersama ? 'Collective Leave Added' : 'National Holiday Added')
        : (sanitizedDraft.isCutiBersama ? 'Collective Leave Updated' : 'National Holiday Updated'),
      subtext: `${sanitizedDraft.date} (“${sanitizedDraft.name}”) was saved to the work calendar.`
    });
  };

  const approvePastAmendment = (holidayId) => {
    const nextHolidays = holidays.map(h => {
      if (h.id === holidayId && h.pendingAmendment) {
        return {
          ...h,
          treatment: h.pendingAmendment.proposedTreatment,
          scope: h.pendingAmendment.proposedScope,
          scopeValue: h.pendingAmendment.proposedScopeValue,
          pendingAmendment: null,
          lastAmendedNote: `Approved by HR Director: ${h.pendingAmendment.reason}`
        };
      }
      return h;
    });
    persistHolidays(nextHolidays);
    setHolidays(nextHolidays);
    setSuccessModal({
      title: 'Past-Date Revision Approved',
      subtext: 'The past-date collective leave change was approved and employee balances have been reconciled.'
    });
  };

  const rejectPastAmendment = (holidayId) => {
    const nextHolidays = holidays.map(h => {
      if (h.id === holidayId) {
        return { ...h, pendingAmendment: null };
      }
      return h;
    });
    persistHolidays(nextHolidays);
    setHolidays(nextHolidays);
    setSuccessModal({
      title: 'Revision Rejected',
      subtext: 'The past-date collective leave revision request was cancelled.'
    });
  };

  // =========================================================================
  // TAB 3: EMPLOYEE BALANCES, LEDGER & ADJUSTMENTS
  // =========================================================================
  const [balances, setBalances] = useState(readEmployeeBalances);
  const [balanceSearch, setBalanceSearch] = useState('');
  const [balanceDeptFilter, setBalanceDeptFilter] = useState('all');
  const [selectedLedgerEmp, setSelectedLedgerEmp] = useState(null); // When viewing transaction ledger modal
  const [adjustmentTarget, setAdjustmentTarget] = useState(null); // When opening adjustment modal
  const [adjustments, setAdjustments] = useState(readAdjustments);
  const [adjustmentFilter, setAdjustmentFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  // Adjustment Form Draft
  const [adjDraft, setAdjDraft] = useState({
    type: 'add',
    amount: 1,
    requesterRole: 'hr',
    reasonNote: ''
  });

  const filteredBalances = useMemo(() => {
    return balances.filter(b => {
      const q = balanceSearch.trim().toLowerCase();
      const matchesSearch = !q || b.employeeName.toLowerCase().includes(q) || b.nik.includes(q);
      const matchesDept = balanceDeptFilter === 'all' || b.departmentId === balanceDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [balances, balanceSearch, balanceDeptFilter]);

  const openLedgerModal = (employeeBalance) => {
    setSelectedLedgerEmp(employeeBalance);
  };

  const closeLedgerModal = () => {
    setSelectedLedgerEmp(null);
  };

  const openAdjustmentModal = (employeeBalance) => {
    setAdjustmentTarget(employeeBalance);
    setAdjDraft({
      type: 'add',
      amount: 1,
      requesterRole: 'hr',
      reasonNote: ''
    });
    setError('');
  };

  const closeAdjustmentModal = () => {
    setAdjustmentTarget(null);
    setError('');
  };

  // Live simulation of Before vs After balance
  const simulatedBalance = useMemo(() => {
    if (!adjustmentTarget) return 0;
    const delta = adjDraft.type === 'add' ? Number(adjDraft.amount || 0) : -Number(adjDraft.amount || 0);
    return adjustmentTarget.available + delta;
  }, [adjustmentTarget, adjDraft]);

  const submitAdjustmentRequest = () => {
    if (!adjustmentTarget) return;
    const amount = Number(adjDraft.amount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 30) {
      setError('Enter a whole number of days between 1 and 30.');
      return;
    }
    if (!adjDraft.reasonNote.trim()) {
      setError('A reason note is required for the audit trail.');
      return;
    }


    const requesterRole = adjDraft.requesterRole === 'bs' ? 'bs' : 'hr';
    const requester = EMPLOYEES.find(e => e.id === ADJUSTMENT_MOCK_REQUESTER_IDS[requesterRole]);

    const newTicket = {
      id: `adj-${Date.now()}`,
      employeeId: adjustmentTarget.employeeId,
      employeeName: adjustmentTarget.employeeName,
      permitTypeId: 'permit-annual',
      permitName: 'Annual Leave',
      type: adjDraft.type,
      amount: Number(adjDraft.amount),
      reasonNote: adjDraft.reasonNote.trim(),
      beforeBalance: adjustmentTarget.available,
      afterBalance: simulatedBalance,
      status: 'pending',
      requestedAt: new Date().toLocaleString('en-US'),
      requestedBy: requester?.name || 'Unknown',
      requestedById: requester?.id || null,
      requesterRole,
      approvalChain: buildApprovalChain(requesterRole),
      reviewedAt: null,
      reviewNote: ''
    };

    const nextAdjustments = [newTicket, ...adjustments];
    persistAdjustments(nextAdjustments);
    setAdjustments(nextAdjustments);
    closeAdjustmentModal();

    setSuccessModal({
      title: 'Adjustment request submitted',
      subtext: `The ${adjDraft.type === 'add' ? '+' : '-'}${adjDraft.amount} day adjustment for ${adjustmentTarget.employeeName} was sent to the ${ADJUSTMENT_APPROVER_LABELS[newTicket.approvalChain[0].role]} for approval.`
    });
  };

  const approveAdjustmentTicket = (ticketId, note = '') => {
    const ticket = adjustments.find(t => t.id === ticketId);
    const step = getCurrentApprovalStep(ticket);
    if (!ticket || !step) return;

    const now = new Date().toLocaleString('en-US');
    const nextChain = ticket.approvalChain.map(s => (s === step
      ? { ...s, status: 'approved', reviewedAt: now, reviewNote: note.trim() || 'Approved.' }
      : s));
    const isFullyApproved = nextChain.every(s => s.status === 'approved');

    if (!isFullyApproved) {
      // Employee-filed ticket: HR approved, now it waits for the Building Manager.
      const nextAdjustments = adjustments.map(t => (t.id === ticketId ? { ...t, approvalChain: nextChain } : t));
      persistAdjustments(nextAdjustments);
      setAdjustments(nextAdjustments);
      const nextStep = getCurrentApprovalStep({ ...ticket, approvalChain: nextChain });
      setSuccessModal({
        title: 'Step approved',
        subtext: `Approved as ${ADJUSTMENT_APPROVER_LABELS[step.role]}. It now waits for the ${ADJUSTMENT_APPROVER_LABELS[nextStep.role]}.`
      });
      return;
    }

    const approvers = nextChain.map(s => ADJUSTMENT_APPROVER_LABELS[s.role]).join(' & ');

    // 1. Update balances & append to ledger
    const nextBalances = balances.map(b => {
      if (b.employeeId === ticket.employeeId) {
        const delta = ticket.type === 'add' ? ticket.amount : -ticket.amount;
        const newAvail = b.available + delta;
        const newLedgerEntry = {
          id: `tx-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'adjustment',
          amount: delta,
          balanceAfter: newAvail,
          description: `Manual adjustment: ${ticket.reasonNote}`,
          refNo: ticket.id.toUpperCase(),
          ticketId: ticket.id,
          requestedBy: ticket.requestedBy,
          approvedBy: approvers
        };
        return {
          ...b,
          available: newAvail,
          adjustmentTotal: (b.adjustmentTotal || 0) + delta,
          // Oldest first; the ledger screen lists newest first.
          ledger: [...(b.ledger || []), newLedgerEntry]
        };
      }
      return b;
    });

    persistEmployeeBalances(nextBalances);
    setBalances(nextBalances);

    // 2. Close the ticket
    const nextAdjustments = adjustments.map(t => (t.id === ticketId
      ? { ...t, status: 'approved', approvalChain: nextChain, reviewedAt: now, reviewNote: note.trim() || 'Approved.' }
      : t));

    persistAdjustments(nextAdjustments);
    setAdjustments(nextAdjustments);

    setSuccessModal({
      title: 'Adjustment approved',
      subtext: `The adjustment for ${ticket.employeeName} was approved. The new balance is now in the directory and ledger.`
    });
  };

  const rejectAdjustmentTicket = (ticketId, note = '') => {
    const ticket = adjustments.find(t => t.id === ticketId);
    const step = getCurrentApprovalStep(ticket);
    if (!ticket || !step) return;

    const now = new Date().toLocaleString('en-US');
    const nextAdjustments = adjustments.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        status: 'rejected',
        approvalChain: t.approvalChain.map(s => (s === step
          ? { ...s, status: 'rejected', reviewedAt: now, reviewNote: note.trim() }
          : s)),
        reviewedAt: now,
        reviewNote: note.trim()
      };
    });
    persistAdjustments(nextAdjustments);
    setAdjustments(nextAdjustments);

    setSuccessModal({
      title: 'Adjustment rejected',
      subtext: 'The request was rejected and the employee balance did not change.'
    });
  };

  const closeSuccessModal = useCallback(() => {
    setSuccessModal(null);
  }, []);

  return {
    // Navigation
    activeTab,
    setActiveTab,

    // Tab 1: Policies
    permits,
    filteredPermits,
    paginatedPermits: filteredPermits.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage(value) {
      if (Number.isInteger(value)) setPage(Math.max(1, Math.min(value, totalPages)));
    },
    query,
    setQuery(val) { setQuery(val); setPage(1); },
    categoryFilter,
    setCategoryFilter(val) { setCategoryFilter(val); setPage(1); },
    statusFilter,
    setStatusFilter(val) { setStatusFilter(val); setPage(1); },
    draft,
    setDraft,
    detailPermit,
    setDetailPermit,
    openEditor,
    closeEditor,
    saveDraft,
    statusTarget,
    requestToggleStatus,
    closeStatusModal,
    confirmToggleStatus,

    // Tab 2: Holidays & Cuti Bersama
    holidays,
    filteredHolidays,
    holidaySearch,
    setHolidaySearch,
    holidayTypeFilter,
    setHolidayTypeFilter,
    holidayViewMode,
    setHolidayViewMode,
    todayIso,
    holidayCalendarDate,
    setHolidayCalendarDate,
    editingHoliday,
    holidayDraft,
    setHolidayDraft,
    openNewHoliday,
    openHolidayEditor,
    closeHolidayEditor,
    saveHolidayPolicy,
    deleteHoliday,
    isHolidayInPast,
    pastAmendmentReason,
    setPastAmendmentReason,
    currentHolidayImpact,
    showImpactModal,
    setShowImpactModal,
    approvePastAmendment,
    rejectPastAmendment,

    // Tab 3: Balances & Adjustments
    balances,
    filteredBalances,
    balanceSearch,
    setBalanceSearch,
    balanceDeptFilter,
    setBalanceDeptFilter,
    selectedLedgerEmp,
    openLedgerModal,
    closeLedgerModal,
    adjustmentTarget,
    openAdjustmentModal,
    closeAdjustmentModal,
    adjDraft,
    setAdjDraft,
    simulatedBalance,
    submitAdjustmentRequest,
    adjustments,
    adjustmentFilter,
    setAdjustmentFilter,
    approveAdjustmentTicket,
    rejectAdjustmentTicket,

    // Shared feedback
    error,
    setError,
    notification,
    setNotification,
    successModal,
    closeSuccessModal
  };
}
