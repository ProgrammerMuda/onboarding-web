import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  ArrowsClockwise,
  Briefcase,
  Buildings,
  CalendarBlank,
  CalendarCheck,
  CalendarStar,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  CheckCircle,
  ClipboardText,
  Clock,
  DotsThreeVertical,
  Eye,
  FileText,
  FileXls,
  Info,
  MagnifyingGlass,
  Minus,
  PencilSimple,
  Plus,
  Power,
  Prohibit,
  Scales,
  ShieldCheck,
  SlidersHorizontal,
  Table,
  Trash,
  TrendDown,
  TrendUp,
  UserCheck,
  Warning,
  WarningCircle,
  X,
  XCircle
} from '@phosphor-icons/react';
import {
  ALLOWED_DATE_OPTIONS,
  PERMIT_CATEGORIES,
  TREATMENT_OPTIONS,
  validatePermitType,
  ADJUSTMENT_APPROVER_LABELS,
  ADJUSTMENT_REQUESTER_LABELS,
  LEDGER_ENTRY_TYPES,
  getCurrentApprovalStep
} from '../../models/PermitTypeModel';
import { DEPARTMENTS, EMPLOYEES, getEmployeeJabatan } from '../../models/ApprovalFlowModel';
import { Breadcrumb } from '../components/Breadcrumb';
import { exportHolidaysToExcel, exportLedgerToExcel } from '../../utils/excelExport';
import './permit-type.css';

const PICKER_POPOVER_WIDTH = 280;

const PICKER_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Single button showing "Month Year"; opens a 12-month grid with year stepper.
function HolidayMonthPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(value.getFullYear());
  const [alignRight, setAlignRight] = useState(false);
  const wrapRef = useRef(null);

  const selectedMonth = value.getMonth();
  const selectedYear = value.getFullYear();
  const now = new Date();
  const nowMonth = now.getMonth();
  const nowYear = now.getFullYear();
  const isPastMonth = (year, monthIndex) => year < nowYear || (year === nowYear && monthIndex < nowMonth);

  // The card clips overflow, so flip the popover to the right edge when it would not fit.
  useLayoutEffect(() => {
    if (!isOpen || !wrapRef.current) return;
    const card = wrapRef.current.closest('.permit-calendar-card');
    const boundaryRight = card ? card.getBoundingClientRect().right : window.innerWidth;
    const boundaryLeft = card ? card.getBoundingClientRect().left : 0;
    const wrapRect = wrapRef.current.getBoundingClientRect();
    const fitsRight = wrapRect.left + PICKER_POPOVER_WIDTH <= boundaryRight - 8;
    const fitsLeft = wrapRect.right - PICKER_POPOVER_WIDTH >= boundaryLeft + 8;
    setAlignRight(!fitsRight && fitsLeft);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const select = (year, monthIndex) => {
    onChange(new Date(year, monthIndex, 1));
    setIsOpen(false);
  };

  return (
    <div className="permit-month-picker" ref={wrapRef}>
      <button
        type="button"
        className={`permit-month-picker-btn ${isOpen ? 'is-open' : ''}`}
        onClick={() => {
          setPickerYear(selectedYear);
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Select month and year"
      >
        <CalendarBlank size={16} weight="bold" className="permit-month-picker-icon" aria-hidden="true" />
        <span>{PICKER_MONTHS[selectedMonth]} {selectedYear}</span>
        <CaretDown size={13} weight="bold" className="permit-month-picker-caret" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={`permit-month-picker-popover ${alignRight ? 'align-right' : ''}`} role="dialog" aria-label="Select month and year">
          <div className="permit-month-picker-year">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              disabled={pickerYear <= nowYear}
              aria-label="Previous year"
              title={pickerYear <= nowYear ? 'Past years cannot be selected' : 'Previous year'}
            >
              <CaretLeft size={13} weight="bold" />
            </button>
            <strong>{pickerYear}</strong>
            <button type="button" onClick={() => setPickerYear((y) => y + 1)} aria-label="Next year">
              <CaretRight size={13} weight="bold" />
            </button>
          </div>

          <div className="permit-month-picker-grid">
            {PICKER_MONTHS.map((name, idx) => {
              const isSelected = idx === selectedMonth && pickerYear === selectedYear;
              const isThisMonth = idx === nowMonth && pickerYear === nowYear;
              const isPast = isPastMonth(pickerYear, idx);
              return (
                <button
                  key={name}
                  type="button"
                  className={`permit-month-picker-month ${isSelected ? 'is-selected' : ''} ${isThisMonth ? 'is-now' : ''}`}
                  aria-pressed={isSelected}
                  disabled={isPast}
                  title={isPast ? `${name} ${pickerYear} is in the past` : `${name} ${pickerYear}`}
                  onClick={() => select(pickerYear, idx)}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="permit-month-picker-today"
            onClick={() => select(nowYear, nowMonth)}
          >
            This Month
          </button>
        </div>
      )}
    </div>
  );
}

// One badge per holiday; hovering or focusing it lists the departments. Portalled so the table's overflow can't clip it.
function DepartmentBadge({ names, isAll }) {
  const [anchor, setAnchor] = useState(null);
  const label = isAll ? 'All departments' : `${names.length} ${names.length === 1 ? 'department' : 'departments'}`;

  const show = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchor({ left: rect.left, top: rect.bottom + 6 });
  };
  const hide = () => setAnchor(null);

  return (
    <>
      <span
        className={`permit-dept-badge ${isAll ? 'is-all' : ''}`}
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-label={`${label}: ${names.join(', ')}`}
      >
        <Buildings size={13} weight="bold" aria-hidden="true" />
        {label}
      </span>
      {anchor && createPortal(
        <div className="permit-dept-tooltip" role="tooltip" style={{ top: anchor.top, left: anchor.left }}>
          <span className="permit-dept-tooltip-title">{label}</span>
          <ul>
            {names.map((name) => <li key={name}>{name}</li>)}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}

const BALANCE_PAGE_SIZE = 8;
const LEDGER_PAGE_SIZE = 5;

function buildPageList(page, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, '…', totalPages];
  if (page >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages];
  return [1, '…', page, '…', totalPages];
}

// Same footer as the leave types table.
function TablePager({ page, totalPages, count, pageSize, noun, onPage }) {
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);
  return (
    <div className="emp-table-footer">
      <div className="emp-table-footer-info">
        Showing <strong className="emp-text-dark">{start}</strong> to <strong className="emp-text-dark">{end}</strong> of{' '}
        <strong className="emp-text-dark">{count}</strong> {noun}
      </div>
      <div className="emp-pagination-controls" aria-label={`${noun} pagination`}>
        <button type="button" className="emp-page-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} title="Previous page" aria-label="Previous page">
          <CaretLeft size={14} weight="bold" />
        </button>
        {buildPageList(page, totalPages).map((n, index) => n === '…' ? (
          <span key={`ellipsis-${index}`} className="emp-page-ellipsis">…</span>
        ) : (
          <button key={n} type="button" className={`emp-page-btn ${page === n ? 'active' : ''}`} aria-current={page === n ? 'page' : undefined} onClick={() => onPage(n)}>
            {n}
          </button>
        ))}
        <button type="button" className="emp-page-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)} title="Next page" aria-label="Next page">
          <CaretRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}

// Matches the employee delete confirmation; portalled so it sits above PermitDialog.
function HolidayDeleteModal({ holiday, onCancel, onConfirm }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Capture phase: close only this modal, not the editor underneath.
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onCancel]);

  return createPortal(
    <div className="emp-modal-backdrop" style={{ zIndex: 10000 }} onClick={onCancel}>
      <div
        className="emp-modal-card text-center p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="holiday-delete-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        <div className="d-flex justify-content-center mb-3">
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Warning size={32} color="#dc2626" weight="bold" />
          </div>
        </div>
        <h4 id="holiday-delete-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Delete Holiday?
        </h4>
        <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px' }}>
          Are you sure you want to delete <strong>&ldquo;{holiday.name}&rdquo;</strong> ({holiday.date})? This date will be removed from the calendar and the work schedule.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <button type="button" className="emp-btn-cancel" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button type="button" className="emp-btn-danger" onClick={onConfirm}>
            Yes, Delete Holiday
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Reusable Base Dialog with Guaranteed Overlay Backdrop
function PermitDialog({ title, description, onClose, maxWidthClass = '', children }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="permit-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`permit-dialog ${maxWidthClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="permit-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="permit-dialog-heading">
          <div>
            <h2 id="permit-dialog-title">{title}</h2>
            {description && <p className="mb-0">{description}</p>}
          </div>
          <button
            type="button"
            className="btn btn-link p-1 text-muted text-decoration-none d-flex align-items-center justify-content-center border-0 shadow-none permit-dialog-close"
            aria-label="Close"
            title="Close dialog"
            onClick={onClose}
          >
            <X size={20} weight="bold" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Reusable Success Toast/Modal with Backdrop
function SuccessDialog({ title, subtext, onClose }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="permit-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="permit-dialog permit-success-dialog border-0 shadow-lg p-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="permit-success-title"
        style={{ width: '450px', maxWidth: '92vw', borderRadius: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="position-relative text-center bg-white" style={{ padding: '38px 28px 34px', borderRadius: '16px' }}>
          <button
            type="button"
            className="btn btn-link p-1 text-muted text-decoration-none position-absolute top-0 end-0 m-3 border-0 shadow-none"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={20} weight="bold" />
          </button>
          <div className="d-flex justify-content-center mb-3">
            <CheckCircle size={60} weight="fill" style={{ color: '#10B981' }} />
          </div>
          <h3 id="permit-success-title" className="fw-bold text-dark mb-2" style={{ fontSize: '19px' }}>
            {title || 'Done!'}
          </h3>
          <p className="text-muted mx-auto mb-0" style={{ fontSize: '14px', lineHeight: 1.5, maxWidth: '360px' }}>
            {subtext || 'The change was saved.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PermitTypeView({ presenter: p }) {
  const [balanceSubView, setBalanceSubView] = useState('directory'); // 'directory' | 'adjustments'
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  const [balancePage, setBalancePage] = useState(1);
  const [balanceStatusFilter, setBalanceStatusFilter] = useState('all'); // 'all' | 'low' | 'negative'
  const [adjSearch, setAdjSearch] = useState('');
  const [adjStatusFilter, setAdjStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [adjPage, setAdjPage] = useState(1);
  const [ledgerPageState, setLedgerPageState] = useState({ id: null, page: 1 });
  const [reviewTicket, setReviewTicket] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [activeActionId, setActiveActionId] = useState(null);
  const [actionAnchor, setActionAnchor] = useState(null);

  useEffect(() => {
    const handleCloseMenu = () => {
      setActiveActionId(null);
      setActionAnchor(null);
    };
    if (activeActionId) {
      window.addEventListener('click', handleCloseMenu);
      window.addEventListener('scroll', handleCloseMenu, true);
      window.addEventListener('resize', handleCloseMenu);
    }
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
      window.removeEventListener('resize', handleCloseMenu);
    };
  }, [activeActionId]);

  const closeLedger = () => {
    setLedgerPageState({ id: null, page: 1 });
    p.closeLedgerModal();
  };

  const openReview = (ticket) => {
    setReviewTicket(ticket);
    setReviewNote('');
    setReviewError('');
  };
  const closeReview = () => {
    setReviewTicket(null);
    setReviewNote('');
    setReviewError('');
  };

  const handleToggleActionMenu = (e, permit, kind = 'permit') => {
    e.stopPropagation();
    const itemId = permit.id ?? permit.employeeId;
    if (activeActionId === itemId) {
      setActiveActionId(null);
      setActionAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = kind === 'holiday' || kind === 'balance' ? 92 : 135;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < dropdownHeight + 15;
    const top = openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4;
    const right = Math.max(8, window.innerWidth - rect.right);

    setActiveActionId(itemId);
    setActionAnchor({ permit, kind, top, right });
  };

  const canSavePermit = Boolean(p.draft && !validatePermitType(p.draft, p.permits));

  // Tab 1 Specific Statistics Metrics
  const totalPermits = p.permits.length;
  const annualPermits = p.permits.filter(item => item.category === 'annual').length;
  const specialPermits = p.permits.filter(item => item.category === 'special').length;
  const unpaidPermits = p.permits.filter(item => item.category === 'unpaid').length;

  const pendingAdjustmentsCount = p.adjustments.filter(a => a.status === 'pending').length;
  const pendingHolidayAmendments = p.holidays.filter(h => Boolean(h.pendingAmendment));
  const dateConflict = p.holidayDraft?.date
    ? p.holidays.find(h => h.date === p.holidayDraft.date && h.id !== p.holidayDraft.id)
    : null;
  const policyCount = p.filteredPermits.length;
  const policyStart = policyCount === 0 ? 0 : (p.currentPage - 1) * p.pageSize + 1;
  const policyEnd = Math.min(p.currentPage * p.pageSize, policyCount);
  const policyPages = p.totalPages <= 5
    ? Array.from({ length: p.totalPages }, (_, i) => i + 1)
    : p.currentPage <= 3
      ? [1, 2, 3, '…', p.totalPages]
      : p.currentPage >= p.totalPages - 2
        ? [1, '…', p.totalPages - 2, p.totalPages - 1, p.totalPages]
        : [1, '…', p.currentPage, '…', p.totalPages];

  return (
    <section className="permit-page">
      {/* 1. Breadcrumb Standard */}
      <Breadcrumb
        items={[
          { label: 'HR Parameter' },
          { label: 'Permit Type' }
        ]}
      />

      <div className="permit-header-shell">
        <div className="emp-hero-banner">
          <div className="emp-hero-banner-content">
            <div className="emp-hero-banner-left">
              <div className="emp-hero-banner-icon-box">
                <ClipboardText size={28} weight="bold" aria-hidden="true" />
              </div>
              <div>
                <div className="emp-hero-banner-tag">HR PARAMETER</div>
                <h1 className="emp-hero-banner-title">Permit Type</h1>
                <p className="emp-hero-banner-desc">
                  Manage leave policies and entitlements, maintain the holiday and collective leave calendar, and track changes to employee leave balances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <nav className="permit-tabs-bar" aria-label="Permit management sections">
        <div className="permit-tabs-segment">
          <button
            type="button"
            className={`permit-tab-btn ${p.activeTab === 'policies' ? 'active' : ''}`}
            aria-pressed={p.activeTab === 'policies'}
            onClick={() => p.setActiveTab('policies')}
          >
            <FileText size={18} weight={p.activeTab === 'policies' ? 'bold' : 'regular'} aria-hidden="true" />
            <span>Leave Types &amp; Policies</span>
          </button>

          <button
            type="button"
            className={`permit-tab-btn ${p.activeTab === 'holidays' ? 'active' : ''}`}
            aria-pressed={p.activeTab === 'holidays'}
            onClick={() => p.setActiveTab('holidays')}
          >
            <CalendarCheck size={18} weight={p.activeTab === 'holidays' ? 'bold' : 'regular'} aria-hidden="true" />
            <span>Holiday Calendar</span>
          </button>

          <button
            type="button"
            className={`permit-tab-btn ${p.activeTab === 'balances' ? 'active' : ''}`}
            aria-pressed={p.activeTab === 'balances'}
            onClick={() => p.setActiveTab('balances')}
          >
            <UserCheck size={18} weight={p.activeTab === 'balances' ? 'bold' : 'regular'} aria-hidden="true" />
            <span>Balances &amp; Adjustments</span>
          </button>
        </div>
      </nav>

      {/* =========================================================================
          TAB 1: MASTER KEBIJAKAN CUTI & IZIN (FOKUS UTAMA)
         ========================================================================= */}
      {p.activeTab === 'policies' && (
        <div className="permit-tab-section">
          {/* STATISTIK SPESIFIK TAB 1 (BUKAN GLOBAL) */}
          <div className="permit-stats-overview mb-4">
            <div className="permit-stat-box">
              <div className="permit-stat-icon-wrap slate">
                <FileText size={22} weight="bold" />
              </div>
              <div className="permit-stat-meta">
                <span>Total permits</span>
                <strong>{totalPermits} types</strong>
              </div>
            </div>

            <div className="permit-stat-box">
              <div className="permit-stat-icon-wrap navy">
                <CalendarStar size={22} weight="bold" />
              </div>
              <div className="permit-stat-meta">
                <span>Annual leave</span>
                <strong>{annualPermits} types</strong>
              </div>
            </div>

            <div className="permit-stat-box">
              <div className="permit-stat-icon-wrap teal">
                <Briefcase size={22} weight="bold" />
              </div>
              <div className="permit-stat-meta">
                <span>Special leave</span>
                <strong>{specialPermits} types</strong>
              </div>
            </div>

            <div className="permit-stat-box">
              <div className="permit-stat-icon-wrap amber">
                <Scales size={22} weight="bold" />
              </div>
              <div className="permit-stat-meta">
                <span>Unpaid leave</span>
                <strong>{unpaidPermits} types</strong>
              </div>
            </div>
          </div>

          <div className="permit-table-card">
            <div className="emp-card-header">
              <div>
                <h2 className="emp-card-title">Leave and permit policies</h2>
                <p className="emp-card-desc">Manage leave entitlement policies, quota allocations, and submission rules.</p>
              </div>
              {p.permits.length > 0 && <button type="button" className="emp-btn-primary" onClick={() => p.openEditor()}>
                <Plus size={16} weight="bold" /><span>Add leave type</span>
              </button>}
            </div>

            <div className="emp-search-row permit-policy-toolbar">
              <div className="emp-search-input-group permit-policy-search">
                <MagnifyingGlass size={16} className="emp-search-input-icon" weight="bold" aria-hidden="true" />
                <input type="search" className="emp-search-input" aria-label="Search leave name"
                  placeholder="Search leave name" value={p.query} onChange={(e) => p.setQuery(e.target.value)} />
              </div>
              <div className="permit-policy-filters">
                <select className="form-select permit-policy-filter" aria-label="Filter category" value={p.categoryFilter}
                  onChange={(e) => p.setCategoryFilter(e.target.value)}>
                  <option value="all">All categories</option>
                  {PERMIT_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
                <select className="form-select permit-policy-filter permit-policy-filter-status" aria-label="Filter status"
                  value={p.statusFilter} onChange={(e) => p.setStatusFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="permit-policy-table-body">
              <div className="permit-policy-table-inner">
                {policyCount > 0 ? <div className="table-responsive">
                  <table className="permit-table permit-policy-table">
                    <thead><tr>
                      <th scope="col">Leave name</th>
                      <th scope="col">Category</th>
                      <th scope="col">Entitlement</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-end">Actions</th>
                    </tr></thead>
                    <tbody>
                      {p.paginatedPermits.map((permit) => {
                          const category = PERMIT_CATEGORIES.find((item) => item.value === permit.category);
                          const isActive = permit.isActive !== false;
                          const entitlement = permit.category === 'annual'
                            ? `${permit.quota} days / year`
                            : permit.category === 'special'
                              ? permit.eventDurationDays ? `${permit.eventDurationDays} days / event` : 'Needs event duration'
                              : permit.category === 'unpaid' ? 'No annual balance' : 'Needs category review';
                          return <tr key={permit.id} className={!isActive ? 'permit-row-inactive' : ''}>
                            <td><strong className="permit-policy-name">{permit.name}</strong></td>
                            <td><span className="permit-category-pill" style={category ? { backgroundColor: category.bg, color: category.badgeColor } : undefined}>
                              {category?.label || 'Needs review'}
                            </span></td>
                            <td className="permit-entitlement-cell">{entitlement}</td>
                            <td><span className={`permit-status-badge ${isActive ? 'active' : 'inactive'}`}>
                              {isActive ? <Check size={12} weight="bold" /> : <Prohibit size={12} weight="bold" />}
                              {isActive ? 'Active' : 'Inactive'}
                            </span></td>
                            <td className="text-end">
                              <button
                                type="button"
                                className={`permit-btn-dots ${activeActionId === permit.id ? 'active' : ''}`}
                                aria-label={`Actions for ${permit.name}`}
                                title="More actions"
                                onClick={(e) => handleToggleActionMenu(e, permit)}
                              >
                                <DotsThreeVertical size={18} weight="bold" />
                              </button>
                            </td>
                          </tr>;
                        })}
                    </tbody>
                  </table>
                </div> : <div className="permit-policy-empty">
                  <div className="permit-policy-empty-icon"><CalendarBlank size={25} weight="regular" aria-hidden="true" /></div>
                  <h3>{p.permits.length === 0 ? 'No leave types yet' : 'No matching leave types'}</h3>
                  <p>{p.permits.length === 0
                    ? 'Add a leave type to define its category and entitlement.'
                    : 'Try a different name, category, or status.'}</p>
                  {p.permits.length === 0
                    ? <button type="button" className="emp-btn-primary" onClick={() => p.openEditor()}><Plus size={16} weight="bold" /> Add leave type</button>
                    : <button type="button" className="btn btn-outline-secondary" onClick={() => { p.setQuery(''); p.setCategoryFilter('all'); p.setStatusFilter('all'); }}>Clear filters</button>}
                </div>}
                {policyCount > 0 && <div className="emp-table-footer">
                  <div className="emp-table-footer-info">
                    Showing <strong className="emp-text-dark">{policyStart}</strong> to{' '}
                    <strong className="emp-text-dark">{policyEnd}</strong> of{' '}
                    <strong className="emp-text-dark">{policyCount}</strong> policies
                  </div>
                  <div className="emp-pagination-controls" aria-label="Leave and permit policies pagination">
                    <button
                      type="button"
                      className="emp-page-btn"
                      disabled={p.currentPage <= 1}
                      onClick={() => p.setCurrentPage(p.currentPage - 1)}
                      title="Previous page"
                      aria-label="Previous page"
                    >
                      <CaretLeft size={14} weight="bold" />
                    </button>
                    {policyPages.map((page, index) => page === '…' ? (
                      <span key={`ellipsis-${index}`} className="emp-page-ellipsis">…</span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        className={`emp-page-btn ${p.currentPage === page ? 'active' : ''}`}
                        aria-current={p.currentPage === page ? 'page' : undefined}
                        onClick={() => p.setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="emp-page-btn"
                      disabled={p.currentPage >= p.totalPages}
                      onClick={() => p.setCurrentPage(p.currentPage + 1)}
                      title="Next page"
                      aria-label="Next page"
                    >
                      <CaretRight size={14} weight="bold" />
                    </button>
                  </div>
                </div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: HOLIDAYS & COLLECTIVE LEAVE (CALENDAR & TABLE VIEW)
         ========================================================================= */}
      {p.activeTab === 'holidays' && (() => {
        const calDate = p.holidayCalendarDate || new Date();
        const calYear = calDate.getFullYear();
        const calMonth = calDate.getMonth();

        const WEEKDAYS = [
          { key: 'sen', label: 'Monday', isWeekend: false },
          { key: 'sel', label: 'Tuesday', isWeekend: false },
          { key: 'rab', label: 'Wednesday', isWeekend: false },
          { key: 'kam', label: 'Thursday', isWeekend: false },
          { key: 'jum', label: 'Friday', isWeekend: false },
          { key: 'sab', label: 'Saturday', isWeekend: true },
          { key: 'min', label: 'Sunday', isWeekend: true }
        ];

        // First day of current month (Mon = 0, Sun = 6)
        const firstDayOfMonth = new Date(calYear, calMonth, 1);
        const startingDay = (firstDayOfMonth.getDay() + 6) % 7;
        const totalDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

        const cells = [];
        // Trailing days from previous month
        for (let i = startingDay - 1; i >= 0; i--) {
          const d = prevMonthDays - i;
          const prevDate = new Date(calYear, calMonth - 1, d);
          const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          cells.push({
            day: d,
            dateStr,
            isCurrentMonth: false,
            isWeekend: [0, 6].includes(prevDate.getDay())
          });
        }
        // Current month days
        for (let d = 1; d <= totalDaysInMonth; d++) {
          const curDate = new Date(calYear, calMonth, d);
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          cells.push({
            day: d,
            dateStr,
            isCurrentMonth: true,
            isWeekend: [0, 6].includes(curDate.getDay())
          });
        }
        // Leading days from next month
        const remainder = (cells.length % 7 === 0) ? 0 : 7 - (cells.length % 7);
        for (let d = 1; d <= remainder; d++) {
          const nextDate = new Date(calYear, calMonth + 1, d);
          const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          cells.push({
            day: d,
            dateStr,
            isCurrentMonth: false,
            isWeekend: [0, 6].includes(nextDate.getDay())
          });
        }

        const handlePrevMonth = () => {
          p.setHolidayCalendarDate(new Date(calYear, calMonth - 1, 1));
        };
        const handleNextMonth = () => {
          p.setHolidayCalendarDate(new Date(calYear, calMonth + 1, 1));
        };

        const searchQuery = p.holidaySearch.trim().toLowerCase();
        const calendarHolidays = p.holidays.filter((h) => !searchQuery || h.name.toLowerCase().includes(searchQuery) || h.date.includes(searchQuery));
        const isTypeFiltered = p.holidayTypeFilter !== 'all';

        const todayObj = new Date();
        const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
        const isPrevMonthDisabled = calYear * 12 + calMonth <= todayObj.getFullYear() * 12 + todayObj.getMonth();

        return (
          <div className="permit-calendar-card">
            {/* Header: Title, View Switcher & Add Button */}
            <div className="emp-card-header">
              <div>
                <h2 className="emp-card-title">Leave &amp; Holiday Calendar</h2>
                <p className="emp-card-desc">
                  Manage national holidays and government collective leave dates, and configure how the company treats each one.
                </p>
              </div>
              <div className="emp-card-actions">
                <div className="ws-toolbar-tabs" role="group" aria-label="Calendar or table view" style={{ marginRight: '4px' }}>
                  <button
                    type="button"
                    className={`ws-toolbar-tab ${p.holidayViewMode === 'calendar' ? 'is-active' : ''}`}
                    aria-pressed={p.holidayViewMode === 'calendar'}
                    onClick={() => p.setHolidayViewMode('calendar')}
                  >
                    <CalendarBlank size={15} weight={p.holidayViewMode === 'calendar' ? 'bold' : 'regular'} aria-hidden="true" />
                    <span>Calendar View</span>
                  </button>
                  <button
                    type="button"
                    className={`ws-toolbar-tab ${p.holidayViewMode === 'table' ? 'is-active' : ''}`}
                    aria-pressed={p.holidayViewMode === 'table'}
                    onClick={() => p.setHolidayViewMode('table')}
                  >
                    <Table size={15} weight={p.holidayViewMode === 'table' ? 'bold' : 'regular'} aria-hidden="true" />
                    <span>Table View</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="emp-btn-secondary"
                  onClick={() => exportHolidaysToExcel({ holidays: p.filteredHolidays, treatmentOptions: TREATMENT_OPTIONS, departments: DEPARTMENTS })}
                  disabled={p.filteredHolidays.length === 0}
                  title="Export the holidays currently shown, including search and type filters"
                >
                  <FileXls size={16} weight="bold" aria-hidden="true" />
                  <span>Export Holiday</span>
                </button>

                <button type="button" className="emp-btn-primary" onClick={() => p.openNewHoliday()}>
                  <Plus size={16} weight="bold" aria-hidden="true" />
                  <span>Add Holiday</span>
                </button>
              </div>
            </div>

            {/* Pending Past Amendments Alert */}
            {pendingHolidayAmendments.length > 0 && (
              <div className="m-3 p-3 pending-amendment-alert">
                <div className="pending-amendment-meta">
                  <WarningCircle size={24} weight="fill" color="#d97706" />
                  <div>
                    <strong>{pendingHolidayAmendments.length} Past-Date Change Requests Awaiting Approval</strong>
                    <p>
                      Revising collective leave on a date that has passed needs HR Director authorization before employee balances are reconciled.
                    </p>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  {pendingHolidayAmendments.map((h) => (
                    <div key={h.id} className="d-flex align-items-center gap-2 bg-white px-3 py-1 rounded border">
                      <span className="small fw-semibold">{h.name}:</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-success py-1 px-2"
                        style={{ fontSize: '11px', fontWeight: 600 }}
                        onClick={() => p.approvePastAmendment(h.id)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-1 px-2"
                        style={{ fontSize: '11px', fontWeight: 600 }}
                        onClick={() => p.rejectPastAmendment(h.id)}
                      >
                        Reject
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search, Filter & Calendar Controls Toolbar */}
            <div className="permit-toolbar permit-filter-bar">
              <div className="permit-search">
                <MagnifyingGlass size={17} className="permit-search-icon flex-shrink-0" weight="bold" />
                <input
                  type="search"
                  aria-label="Search holidays or collective leave"
                  placeholder="Search by date or holiday name..."
                  value={p.holidaySearch}
                  onChange={(e) => p.setHolidaySearch(e.target.value)}
                />
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <select
                  className="form-select"
                  aria-label="Filter by holiday type"
                  value={p.holidayTypeFilter}
                  onChange={(e) => p.setHolidayTypeFilter(e.target.value)}
                  style={{ width: '210px' }}
                >
                  <option value="all">All Holiday Types</option>
                  <option value="national_holiday">Official National Holiday</option>
                  <option value="cuti_bersama">Government Collective Leave</option>
                </select>

                {/* Calendar Navigation Controls (Active in Calendar View) */}
                {p.holidayViewMode === 'calendar' && (
                  <div className="d-flex align-items-center gap-1.5 ms-lg-2">
                    <button
                      type="button"
                      className="permit-cal-btn-nav"
                      onClick={handlePrevMonth}
                      disabled={isPrevMonthDisabled}
                      title={isPrevMonthDisabled ? 'Past months cannot be selected' : 'Previous month'}
                      aria-label="Previous month"
                    >
                      <CaretLeft size={16} weight="bold" />
                    </button>

                    <HolidayMonthPicker
                      value={new Date(calYear, calMonth, 1)}
                      onChange={p.setHolidayCalendarDate}
                    />

                    <button
                      type="button"
                      className="permit-cal-btn-nav"
                      onClick={handleNextMonth}
                      title="Next month"
                      aria-label="Next month"
                    >
                      <CaretRight size={16} weight="bold" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* VIEW 1: CALENDAR VIEW */}
            {p.holidayViewMode === 'calendar' && (
              <div className="permit-cal-body">
                <div className="permit-cal-grid-frame">
                  {/* Weekday Row Header (Mon - Sun) */}
                  <div className="permit-cal-weekdays-row">
                    {WEEKDAYS.map((wd) => (
                      <div key={wd.key} className={`permit-cal-weekday-header ${wd.isWeekend ? 'weekend' : ''}`}>
                        {wd.label}
                      </div>
                    ))}
                  </div>

                  {/* Day Cells Grid */}
                  <div className="permit-cal-days-grid">
                    {cells.map((cell) => {
                      // Type filter highlights instead of hiding (like the Work Schedule shift filter); search still hides.
                      const dayHolidays = calendarHolidays.filter((h) => h.date === cell.dateStr);
                      const isToday = cell.dateStr === todayStr;
                      const isPast = cell.dateStr < todayStr;
                      const hasHoliday = dayHolidays.length > 0;
                      // One holiday per date: a filtered-out holiday still occupies its date.
                      const isDateTaken = p.holidays.some((h) => h.date === cell.dateStr);

                      return (
                        <div
                          key={cell.dateStr}
                          className={`permit-cal-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isWeekend ? 'weekend' : ''} ${isToday ? 'is-today' : ''} ${isPast ? 'is-past-day' : ''} ${hasHoliday ? 'has-holiday' : ''}`}
                          onClick={() => {
                            // Only allow adding on today or future dates when empty
                            if (!isDateTaken && !isPast) {
                              p.openNewHoliday(cell.dateStr);
                            }
                          }}
                        >
                          <div className="permit-cal-day-top">
                            <span className="permit-cal-day-num">{cell.day}</span>
                          </div>

                          {/* Events in this day */}
                          <div className="permit-cal-events-list">
                            {!isDateTaken && cell.isCurrentMonth && !isPast && (
                              <button
                                type="button"
                                className="permit-cal-empty-add"
                                aria-label={`Add holiday on ${cell.dateStr}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  p.openNewHoliday(cell.dateStr);
                                }}
                              >
                                <Plus size={13} weight="bold" aria-hidden="true" />
                                <span>Add holiday</span>
                              </button>
                            )}
                            {dayHolidays.map((holiday) => {
                              const isCuti = Boolean(holiday.isCutiBersama);
                              const isTypeMatch = !isTypeFiltered || (p.holidayTypeFilter === 'cuti_bersama') === isCuti;
                              const openEditor = () => p.openHolidayEditor(holiday);

                              return (
                                <div
                                  key={holiday.id}
                                  className={`permit-cal-event-chip ${isPast ? 'is-past' : ''} ${isTypeFiltered ? (isTypeMatch ? `is-match ${isCuti ? 'collective' : 'national'}` : 'is-dimmed') : ''}`}
                                  title={isPast
                                    ? `${holiday.name} (${holiday.date}) has passed and cannot be edited`
                                    : `Click to edit: ${holiday.name} (${holiday.date})`}
                                  onClick={isPast ? undefined : (e) => {
                                    e.stopPropagation();
                                    openEditor();
                                  }}
                                >
                                  <div className="permit-cal-event-chip-top">
                                    <span className={`permit-cal-chip-badge ${isCuti ? 'collective' : 'national'}`}>
                                      <CalendarStar size={11} weight="bold" aria-hidden="true" />
                                      <span>{isCuti ? 'Collective' : 'National'}</span>
                                    </span>
                                    {!isPast && (
                                      <div className="permit-cal-chip-actions">
                                        <button
                                          type="button"
                                          className="permit-cal-chip-btn"
                                          aria-label={`Edit ${holiday.name}`}
                                          title="Edit holiday"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditor();
                                          }}
                                        >
                                          <PencilSimple size={12} weight="bold" />
                                        </button>
                                        <button
                                          type="button"
                                          className="permit-cal-chip-btn is-danger"
                                          aria-label={`Delete ${holiday.name}`}
                                          title="Delete holiday"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setHolidayToDelete(holiday);
                                          }}
                                        >
                                          <Trash size={12} weight="bold" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="permit-cal-event-chip-title">{holiday.name}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: TABLE VIEW */}
            {p.holidayViewMode === 'table' && (
              <div className="permit-policy-table-body">
                <div className="permit-policy-table-inner">
                  <div className="table-responsive">
                    <table className="permit-table permit-policy-table permit-holiday-table">
                      <thead>
                        <tr>
                          <th scope="col">Date</th>
                          <th scope="col">Holiday Name</th>
                          <th scope="col">Classification</th>
                          <th scope="col">Treatment</th>
                          <th scope="col">Departments</th>
                          <th scope="col" className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.filteredHolidays.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-5 text-muted">
                              <CalendarBlank size={32} className="mb-2 text-secondary" />
                              <p className="mb-0">No holidays match your search.</p>
                            </td>
                          </tr>
                        ) : (
                          p.filteredHolidays.map((holiday) => {
                            const treatmentObj = TREATMENT_OPTIONS.find((t) => t.value === holiday.treatment) || TREATMENT_OPTIONS[0];
    
                            return (
                              <tr key={holiday.id}>
                                <td>
                                  <strong className="text-dark" style={{ fontSize: '13.5px' }}>
                                    {holiday.date}
                                  </strong>
                                  <div className="permit-cell-note">
                                    {new Date(holiday.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
                                  </div>
                                </td>
    
                                <td>
                                  <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>
                                    {holiday.name}
                                  </div>
                                  {holiday.pendingAmendment && (
                                    <span className="badge bg-warning text-dark mt-1" style={{ fontSize: '10px' }}>
                                      Past Revision Pending
                                    </span>
                                  )}
                                </td>
    
                                <td>
                                  {holiday.isCutiBersama ? (
                                    <span className="holiday-type-badge cuti">
                                      <CalendarStar size={14} weight="bold" />
                                      <span>Collective Leave</span>
                                    </span>
                                  ) : (
                                    <span className="holiday-type-badge national">
                                      <CalendarBlank size={14} weight="bold" />
                                      <span>National Holiday</span>
                                    </span>
                                  )}
                                </td>
    
                                <td>
                                  <span className={`permit-treatment-badge ${holiday.isCutiBersama && holiday.treatment === 'deduct_annual' ? 'is-deduct' : 'is-free'}`}>
                                    {holiday.isCutiBersama ? treatmentObj.badge : 'No deduction'}
                                  </span>
                                </td>

                                <td>
                                  {(() => {
                                    const isScoped = holiday.isCutiBersama && holiday.scope === 'departments';
                                    const names = isScoped
                                      ? (holiday.scopeValue || []).map((id) => DEPARTMENTS.find((d) => d.id === id)?.name || id)
                                      : DEPARTMENTS.map((d) => d.name);
                                    return <DepartmentBadge names={names} isAll={!isScoped} />;
                                  })()}
                                </td>

                                <td>
                                  <div className="d-flex justify-content-end">
                                    <button
                                      type="button"
                                      className={`permit-btn-dots ${activeActionId === holiday.id ? 'active' : ''}`}
                                      aria-label={`Actions for ${holiday.name}`}
                                      title="More actions"
                                      onClick={(e) => handleToggleActionMenu(e, holiday, 'holiday')}
                                    >
                                      <DotsThreeVertical size={18} weight="bold" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                        </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 3: BALANCES, LEDGER & ADJUSTMENTS
         ========================================================================= */}
      {p.activeTab === 'balances' && (() => {
        const isDirectory = balanceSubView === 'directory';

        const balanceRows = p.filteredBalances.filter((item) => (
          balanceStatusFilter === 'all'
          || (balanceStatusFilter === 'negative' && item.available < 0)
          || (balanceStatusFilter === 'low' && item.available >= 0 && item.available <= 3)
        ));
        const balanceTotalPages = Math.max(1, Math.ceil(balanceRows.length / BALANCE_PAGE_SIZE));
        const balancePageSafe = Math.min(balancePage, balanceTotalPages);
        const pagedBalances = balanceRows.slice((balancePageSafe - 1) * BALANCE_PAGE_SIZE, balancePageSafe * BALANCE_PAGE_SIZE);

        const adjQuery = adjSearch.trim().toLowerCase();
        const adjustmentRows = p.adjustments
          .filter((ticket) => (
            (adjStatusFilter === 'all' || ticket.status === adjStatusFilter)
            && (!adjQuery || ticket.employeeName.toLowerCase().includes(adjQuery) || ticket.id.toLowerCase().includes(adjQuery))
          ))
          .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));
        const adjTotalPages = Math.max(1, Math.ceil(adjustmentRows.length / BALANCE_PAGE_SIZE));
        const adjPageSafe = Math.min(adjPage, adjTotalPages);
        const pagedAdjustments = adjustmentRows.slice((adjPageSafe - 1) * BALANCE_PAGE_SIZE, adjPageSafe * BALANCE_PAGE_SIZE);

        return (
          <div className="permit-tab-section">
            <div className="permit-table-card">
              <div className="emp-card-header">
                <div>
                  <h2 className="emp-card-title">{isDirectory ? 'Employee leave balances' : 'Adjustment requests'}</h2>
                  <p className="emp-card-desc">
                    {isDirectory
                      ? 'Review annual leave balances, trace every change in the ledger, and request manual corrections.'
                      : 'Requests from HR need the Building Manager. Requests from employees need HR first, then the Building Manager.'}
                  </p>
                </div>
                <div className="emp-card-actions">
                  <div className="ws-toolbar-tabs" role="group" aria-label="Balances or adjustment requests">
                    <button
                      type="button"
                      className={`ws-toolbar-tab ${isDirectory ? 'is-active' : ''}`}
                      aria-pressed={isDirectory}
                      onClick={() => setBalanceSubView('directory')}
                    >
                      <UserCheck size={15} weight={isDirectory ? 'bold' : 'regular'} aria-hidden="true" />
                      <span>Balances</span>
                      <span className="permit-tab-count">{p.balances.length}</span>
                    </button>
                    <button
                      type="button"
                      className={`ws-toolbar-tab ${!isDirectory ? 'is-active' : ''}`}
                      aria-pressed={!isDirectory}
                      onClick={() => setBalanceSubView('adjustments')}
                    >
                      <Scales size={15} weight={!isDirectory ? 'bold' : 'regular'} aria-hidden="true" />
                      <span>Adjustment requests</span>
                      <span className={`permit-tab-count ${pendingAdjustmentsCount > 0 ? 'is-pending' : ''}`}>
                        {pendingAdjustmentsCount > 0 ? `${pendingAdjustmentsCount} pending` : p.adjustments.length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {isDirectory ? (
                <div className="emp-search-row permit-policy-toolbar">
                  <div className="emp-search-input-group permit-policy-search">
                    <MagnifyingGlass size={16} className="emp-search-input-icon" weight="bold" aria-hidden="true" />
                    <input
                      type="search"
                      className="emp-search-input"
                      aria-label="Search employee by name or NIP"
                      placeholder="Search name or NIP"
                      value={p.balanceSearch}
                      onChange={(e) => { p.setBalanceSearch(e.target.value); setBalancePage(1); }}
                    />
                  </div>
                  <div className="permit-policy-filters">
                    <select
                      className="form-select permit-policy-filter"
                      aria-label="Filter department"
                      value={p.balanceDeptFilter}
                      onChange={(e) => { p.setBalanceDeptFilter(e.target.value); setBalancePage(1); }}
                    >
                      <option value="all">All departments</option>
                      {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select
                      className="form-select permit-policy-filter permit-policy-filter-status"
                      aria-label="Filter balance level"
                      value={balanceStatusFilter}
                      onChange={(e) => { setBalanceStatusFilter(e.target.value); setBalancePage(1); }}
                    >
                      <option value="all">All balances</option>
                      <option value="low">Low (3 days or less)</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="emp-search-row permit-policy-toolbar">
                  <div className="emp-search-input-group permit-policy-search">
                    <MagnifyingGlass size={16} className="emp-search-input-icon" weight="bold" aria-hidden="true" />
                    <input
                      type="search"
                      className="emp-search-input"
                      aria-label="Search by employee or request ID"
                      placeholder="Search employee or request ID"
                      value={adjSearch}
                      onChange={(e) => { setAdjSearch(e.target.value); setAdjPage(1); }}
                    />
                  </div>
                  <div className="permit-policy-filters">
                    <select
                      className="form-select permit-policy-filter permit-policy-filter-status"
                      aria-label="Filter status"
                      value={adjStatusFilter}
                      onChange={(e) => { setAdjStatusFilter(e.target.value); setAdjPage(1); }}
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="permit-policy-table-body">
                <div className="permit-policy-table-inner">
                  {isDirectory ? (
                    balanceRows.length > 0 ? (
                      <>
                        <div className="table-responsive">
                          <table className="permit-table permit-policy-table permit-balance-table">
                            <thead>
                              <tr>
                                <th scope="col">Employee</th>
                                <th scope="col">Entitlement</th>
                                <th scope="col">Carry-over</th>
                                <th scope="col">Used</th>
                                <th scope="col">Collective leave</th>
                                <th scope="col">Available</th>
                                <th scope="col" className="text-end">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagedBalances.map((item) => {
                                const dept = DEPARTMENTS.find((d) => d.id === item.departmentId);
                                const level = item.available < 0 ? 'negative' : item.available <= 3 ? 'low' : 'healthy';
                                return (
                                  <tr key={item.employeeId}>
                                    <td>
                                      <div className="d-flex align-items-center gap-3">
                                        <img
                                          src={item.avatar}
                                          alt=""
                                          className="emp-balance-avatar"
                                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'; }}
                                        />
                                        <div>
                                          <strong className="text-dark" style={{ fontSize: '13.5px' }}>{item.employeeName}</strong>
                                          <span className="text-muted small d-block">NIP {item.nik}</span>
                                          <span className="permit-cell-note">{getEmployeeJabatan(EMPLOYEES.find((e) => e.id === item.employeeId) || item, dept?.name)}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td><strong>{item.baseEntitlement}</strong> <span className="text-muted">days</span></td>
                                    <td>
                                      {item.carryOver > 0
                                        ? <span className="text-success fw-bold">+{item.carryOver} days</span>
                                        : <span className="text-muted">0 days</span>}
                                      {item.carryOver > 0 && <div className="permit-cell-note">Expires 31 Mar</div>}
                                    </td>
                                    <td><span className="text-danger fw-semibold">-{item.usedLeave} days</span></td>
                                    <td>
                                      {item.cutiBersamaDeduction > 0
                                        ? <span className="fw-semibold" style={{ color: '#b45309' }}>-{item.cutiBersamaDeduction} days</span>
                                        : <span className="text-muted">0 days</span>}
                                    </td>
                                    <td>
                                      <span className={`permit-balance-badge is-${level}`}>
                                        <strong>{item.available}</strong> days
                                      </span>
                                      {level === 'low' && <div className="permit-balance-flag is-low">Low balance</div>}
                                    </td>
                                    <td className="text-end">
                                      <button
                                        type="button"
                                        className={`permit-btn-dots ${activeActionId === item.employeeId ? 'active' : ''}`}
                                        aria-label={`Actions for ${item.employeeName}`}
                                        title="More actions"
                                        onClick={(e) => handleToggleActionMenu(e, item, 'balance')}
                                      >
                                        <DotsThreeVertical size={18} weight="bold" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <TablePager page={balancePageSafe} totalPages={balanceTotalPages} count={balanceRows.length} pageSize={BALANCE_PAGE_SIZE} noun="employees" onPage={setBalancePage} />
                      </>
                    ) : (
                      <div className="permit-policy-empty">
                        <div className="permit-policy-empty-icon"><UserCheck size={25} weight="regular" aria-hidden="true" /></div>
                        <h3>No matching employees</h3>
                        <p>Try a different name, department, or balance level.</p>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => { p.setBalanceSearch(''); p.setBalanceDeptFilter('all'); setBalanceStatusFilter('all'); }}
                        >
                          Clear filters
                        </button>
                      </div>
                    )
                  ) : (
                    adjustmentRows.length > 0 ? (
                      <>
                        <div className="table-responsive">
                          <table className="permit-table permit-policy-table permit-adjustment-table">
                            <thead>
                              <tr>
                                <th scope="col">Request</th>
                                <th scope="col">Employee</th>
                                <th scope="col">Requested by</th>
                                <th scope="col">Notes</th>
                                <th scope="col">Balance change</th>
                                <th scope="col">Status</th>
                                <th scope="col" className="text-end">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagedAdjustments.map((ticket) => {
                                const delta = ticket.type === 'add' ? ticket.amount : -ticket.amount;
                                return (
                                  <tr key={ticket.id}>
                                    <td>
                                      <strong>{ticket.id.toUpperCase()}</strong>
                                      <div className="permit-cell-note">{ticket.requestedAt}</div>
                                    </td>
                                    <td>
                                      <div className="fw-bold text-dark">{ticket.employeeName}</div>
                                      <span className="text-muted small d-block">
                                        {(() => {
                                          const employee = EMPLOYEES.find((e) => e.id === ticket.employeeId);
                                          return getEmployeeJabatan(employee, DEPARTMENTS.find((d) => d.id === employee?.departmentId)?.name);
                                        })()}
                                      </span>
                                    </td>
                                    <td>
                                      {ticket.requesterRole === 'employee' ? (
                                        <>
                                          <div className="fw-bold text-dark">Self-requested</div>
                                          <span className="text-muted small d-block">By the employee</span>
                                        </>
                                      ) : (
                                        <>
                                          <div className="fw-bold text-dark">{ticket.requestedBy}</div>
                                          <span className="text-muted small d-block">
                                            {(() => {
                                              const requester = EMPLOYEES.find((e) => e.id === ticket.requestedById);
                                              if (!requester) return ADJUSTMENT_REQUESTER_LABELS[ticket.requesterRole];
                                              return getEmployeeJabatan(requester, DEPARTMENTS.find((d) => d.id === requester.departmentId)?.name);
                                            })()}
                                          </span>
                                        </>
                                      )}
                                    </td>
                                    <td>
                                      <p className="permit-ticket-note" title={ticket.reasonNote}>{ticket.reasonNote}</p>
                                    </td>
                                    <td>
                                      <div className="permit-balance-change">
                                        <span className="text-muted">{ticket.beforeBalance}</span>
                                        <span aria-hidden="true">&rarr;</span>
                                        <strong>{ticket.afterBalance}</strong>
                                        <span className={`permit-delta-chip ${delta > 0 ? 'is-plus' : 'is-minus'}`}>
                                          {delta > 0 ? `+${delta}` : delta}
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      {(() => {
                                        const chain = ticket.approvalChain || [];
                                        const StatusIcon = ticket.status === 'pending' ? Clock : ticket.status === 'approved' ? CheckCircle : XCircle;
                                        const statusLabel = ticket.status === 'pending' ? 'Pending' : ticket.status === 'approved' ? 'Approved' : 'Rejected';
                                        const waitingStep = getCurrentApprovalStep(ticket);
                                        const decidedStep = chain.slice().reverse().find((step) => step.status !== 'pending');

                                        return (
                                          <>
                                            <span className={`permit-ticket-badge is-${ticket.status}`}>
                                              <StatusIcon size={12} weight="bold" aria-hidden="true" />
                                              {statusLabel}
                                            </span>
                                            {ticket.status === 'pending' ? (
                                              <div className="permit-status-detail">
                                                <strong>{ADJUSTMENT_APPROVER_LABELS[waitingStep?.role] || 'Approver'}</strong>
                                                <span>
                                                  {chain.length > 1 && (
                                                    <span className="permit-step-dots" aria-hidden="true">
                                                      {chain.map((step) => (
                                                        <i key={step.role} className={step.status === 'approved' ? 'is-done' : step === waitingStep ? 'is-current' : ''} />
                                                      ))}
                                                    </span>
                                                  )}
                                                  {chain.length > 1 ? `Step ${chain.indexOf(waitingStep) + 1} of ${chain.length}` : 'Awaiting decision'}
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="permit-status-detail">
                                                <strong>By {ADJUSTMENT_APPROVER_LABELS[decidedStep?.role] || 'approver'}</strong>
                                                <span>{ticket.reviewedAt}</span>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </td>
                                    <td className="text-end">
                                      <button
                                        type="button"
                                        className="permit-btn-dots"
                                        aria-label={`View details of ${ticket.id.toUpperCase()}`}
                                        title="View details"
                                        onClick={() => openReview(ticket)}
                                      >
                                        <Eye size={17} weight="bold" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <TablePager page={adjPageSafe} totalPages={adjTotalPages} count={adjustmentRows.length} pageSize={BALANCE_PAGE_SIZE} noun="requests" onPage={setAdjPage} />
                      </>
                    ) : (
                      <div className="permit-policy-empty">
                        <div className="permit-policy-empty-icon"><Scales size={25} weight="regular" aria-hidden="true" /></div>
                        <h3>{p.adjustments.length === 0 ? 'No adjustment requests yet' : 'No matching requests'}</h3>
                        <p>{p.adjustments.length === 0
                          ? 'Request a correction from the Balances tab. It will show up here for approval.'
                          : 'Try a different status or search.'}</p>
                        {p.adjustments.length > 0 && (
                          <button type="button" className="btn btn-outline-secondary" onClick={() => { setAdjSearch(''); setAdjStatusFilter('all'); }}>
                            Clear filters
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {p.detailPermit && (() => {
        const d = p.detailPermit;
        const catInfo = PERMIT_CATEGORIES.find((item) => item.value === d.category) || {
          label: d.category || 'Needs review',
          badgeColor: '#002B7F',
          bg: '#EFF6FF'
        };

        const isAnnual = d.category === 'annual';
        const isSpecial = d.category === 'special';
        const isUnpaid = d.category === 'unpaid';

        const renderCategoryIcon = () => {
          if (isAnnual) return <CalendarStar size={22} weight="fill" />;
          if (isSpecial) return <Briefcase size={22} weight="fill" />;
          return <Scales size={22} weight="fill" />;
        };

        const formatAllowedDates = () => {
          if (d.allowedDates === 'past') return 'Past dates only';
          if (d.allowedDates === 'future') return 'Future dates only';
          return 'Both past & future dates';
        };

        return (
          <PermitDialog
            title="Leave type details"
            description="Policy parameters and balance rules configured for this leave type."
            maxWidthClass="modal-leave-detail"
            onClose={() => p.setDetailPermit(null)}
          >
            <div className="permit-form-body permit-detail-container">
              {/* 1. Header: identity row, then notes */}
              <div className="permit-detail-hero">
                <div className="permit-detail-hero-top">
                  <div
                    className="permit-detail-hero-icon"
                    style={{ color: catInfo.badgeColor, backgroundColor: catInfo.bg }}
                  >
                    {renderCategoryIcon()}
                  </div>
                  <div className="permit-detail-hero-content">
                    <h3 className="permit-detail-hero-title">{d.name}</h3>
                    <span
                      className="permit-category-pill"
                      style={{ color: catInfo.badgeColor, backgroundColor: catInfo.bg }}
                    >
                      {catInfo.label}
                    </span>
                  </div>
                  <span className={`permit-status-badge ${d.isActive === false ? 'inactive' : 'active'}`}>
                    {d.isActive === false ? <Prohibit size={12} weight="bold" /> : <Check size={12} weight="bold" />}
                    <span>{d.isActive === false ? 'Inactive' : 'Active'}</span>
                  </span>
                </div>
                {d.description && (
                  <div className="permit-detail-hero-notes">
                    <span className="permit-detail-hero-notes-label">Notes</span>
                    <p className="mb-0">{d.description}</p>
                  </div>
                )}
              </div>

              {/* 2. Structured Specification Groups */}
              {isAnnual && (
                <>
                  <div className="permit-detail-group">
                    <span className="permit-detail-group-title">Allowance & Cycle</span>
                    <div className="permit-detail-card">
                      <div className="permit-detail-row">
                        <div className="permit-row-label">
                          <CalendarCheck size={16} />
                          <span>Annual allowance</span>
                        </div>
                        <div className="permit-row-value">
                          <strong>{d.quota} days</strong>
                          <span className="text-muted fw-normal">/ calendar year</span>
                        </div>
                      </div>
                      <div className="permit-detail-row">
                        <div className="permit-row-label">
                          <Clock size={16} />
                          <span>Period cycle</span>
                        </div>
                        <div className="permit-row-value font-monospace">
                          1 Jan – 31 Dec
                        </div>
                      </div>
                      <div className="permit-detail-row">
                        <div className="permit-row-label">
                          <TrendUp size={16} />
                          <span>New-hire prorata</span>
                        </div>
                        <div className="permit-row-value">
                          {d.isProrated ? (
                            <span className="badge-soft badge-soft-success">Prorated by start date</span>
                          ) : (
                            <span className="badge-soft badge-soft-secondary">Full quota upfront</span>
                          )}
                        </div>
                      </div>
                      <div className="permit-detail-row">
                        <div className="permit-row-label">
                          <CalendarStar size={16} />
                          <span>Request dates</span>
                        </div>
                        <div className="permit-row-value">
                          <span className="badge-soft badge-soft-primary">{formatAllowedDates()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="permit-detail-group">
                    <span className="permit-detail-group-title">Balance Flexibility & Rollover</span>
                    <div className="permit-detail-card">
                      <div className="permit-detail-row">
                        <div className="permit-row-label">
                          <TrendDown size={16} />
                          <span>Negative balance</span>
                        </div>
                        <div className="permit-row-value">
                          {d.allowNegativeBalance ? (
                            <span className="badge-soft badge-soft-warning">Allowed up to {d.maxNegativeDays} days</span>
                          ) : (
                            <span className="badge-soft badge-soft-secondary">Not permitted</span>
                          )}
                        </div>
                      </div>
                      <div className="permit-detail-row">
                        <div className="permit-row-label">
                          <ArrowsClockwise size={16} />
                          <span>Year-end carry-over</span>
                        </div>
                        <div className="permit-row-value">
                          {d.allowCarryOver ? (
                            <span className="badge-soft badge-soft-success">
                              Max {d.maxCarryOverDays} days (expires {d.carryOverExpiryMonths} {Number(d.carryOverExpiryMonths) === 1 ? 'month' : 'months'})
                            </span>
                          ) : (
                            <span className="badge-soft badge-soft-secondary">Expires 31 Dec (No rollover)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isSpecial && (
                <div className="permit-detail-group">
                  <span className="permit-detail-group-title">Special Leave Policy</span>
                  <div className="permit-detail-card">
                    <div className="permit-detail-row">
                      <div className="permit-row-label">
                        <Briefcase size={16} />
                        <span>Per-event allowance</span>
                      </div>
                      <div className="permit-row-value">
                        <strong>{d.eventDurationDays ? `${d.eventDurationDays} days` : '—'}</strong>
                        <span className="text-muted fw-normal">/ event</span>
                      </div>
                    </div>
                    <div className="permit-detail-row">
                      <div className="permit-row-label">
                        <CalendarStar size={16} />
                        <span>Request dates</span>
                      </div>
                      <div className="permit-row-value">
                        <span className="badge-soft badge-soft-primary">{formatAllowedDates()}</span>
                      </div>
                    </div>
                    <div className="permit-detail-row">
                      <div className="permit-row-label">
                        <ShieldCheck size={16} />
                        <span>Annual balance impact</span>
                      </div>
                      <div className="permit-row-value">
                        <span className="badge-soft badge-soft-success">Not deducted (Separate quota)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isUnpaid && (
                <div className="permit-detail-group">
                  <span className="permit-detail-group-title">Unpaid Leave Policy</span>
                  <div className="permit-detail-card">
                    <div className="permit-detail-row">
                      <div className="permit-row-label">
                        <Scales size={16} />
                        <span>Allowance</span>
                      </div>
                      <div className="permit-row-value">
                        <strong>No annual quota</strong>
                        <span className="text-muted fw-normal">(Unpaid)</span>
                      </div>
                    </div>
                    <div className="permit-detail-row">
                      <div className="permit-row-label">
                        <CalendarStar size={16} />
                        <span>Request dates</span>
                      </div>
                      <div className="permit-row-value">
                        <span className="badge-soft badge-soft-primary">{formatAllowedDates()}</span>
                      </div>
                    </div>
                    <div className="permit-detail-row">
                      <div className="permit-row-label">
                        <ShieldCheck size={16} />
                        <span>Annual balance impact</span>
                      </div>
                      <div className="permit-row-value">
                        <span className="badge-soft badge-soft-success">Not deducted</span>
                      </div>
                    </div>
                    <div className="permit-detail-row">
                      <div className="permit-row-label">
                        <ClipboardText size={16} />
                        <span>Payroll handling</span>
                      </div>
                      <div className="permit-row-value">
                        <span className="badge-soft badge-soft-secondary">Salary deduction applies</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </PermitDialog>
        );
      })()}

      {p.draft && (
        <PermitDialog title={p.permits.some((permit) => permit.id === p.draft.id) ? 'Edit leave type' : 'Add leave type'}
          description="Set the entitlement for this leave type."
          onClose={p.closeEditor} maxWidthClass="modal-wide permit-policy-editor-dialog">
          <form className="permit-policy-editor-form" onSubmit={p.saveDraft}>
            <div className="permit-form-body permit-policy-form">
              {p.error && <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2" role="alert">
                <WarningCircle size={16} weight="fill" /><span>{p.error}</span>
              </div>}
              <div className="row g-3">
                <div className="col-md-7">
                  <label htmlFor="permit-name" className="form-label">Leave name <span className="text-danger">*</span></label>
                  <input id="permit-name" type="text" className="form-control" placeholder="e.g. Marriage leave"
                    value={p.draft.name} onChange={(e) => p.setDraft({ ...p.draft, name: e.target.value })} required />
                </div>
                <div className="col-md-5">
                  <label htmlFor="permit-category" className="form-label">Category <span className="text-danger">*</span></label>
                  <select id="permit-category" className="form-select" value={p.draft.category}
                    onChange={(e) => p.setDraft({ ...p.draft, category: e.target.value })} required>
                    {!PERMIT_CATEGORIES.some((item) => item.value === p.draft.category) && <option value={p.draft.category}>Needs review — choose a category</option>}
                    {PERMIT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label htmlFor="permit-note" className="form-label">Notes <span className="permit-optional">Optional</span></label>
                  <textarea id="permit-note" className="form-control" rows={2} placeholder="When can employees use this leave?"
                    value={p.draft.description} onChange={(e) => p.setDraft({ ...p.draft, description: e.target.value })} />
                </div>
                {p.permits.some((permit) => permit.id === p.draft.id) && <div className="col-md-5">
                  <label htmlFor="permit-status" className="form-label">Status <span className="text-danger">*</span></label>
                  <select id="permit-status" className="form-select" value={p.draft.isActive === false ? 'inactive' : 'active'}
                    onChange={(e) => p.setDraft({ ...p.draft, isActive: e.target.value === 'active' })} required>
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select>
                </div>}
              </div>

              {/* Request dates */}
              <div className="permit-date-policy-group">
                <label className="permit-date-policy-label">
                  Request dates <span className="text-danger">*</span>
                </label>
                <div className="permit-date-policy-sub">
                  Choose whether past dates, future dates, or both can be requested.
                </div>
                <div className="permit-date-policy-grid" role="radiogroup" aria-label="Request dates">
                  {ALLOWED_DATE_OPTIONS.map((opt) => {
                    const isSelected = (p.draft.allowedDates || 'both') === opt.value;
                    return (
                      <div
                        key={opt.value}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        className={`permit-date-policy-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => p.setDraft({ ...p.draft, allowedDates: opt.value })}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            p.setDraft({ ...p.draft, allowedDates: opt.value });
                          }
                        }}
                      >
                        <span className="permit-radio-circle" aria-hidden="true">
                          {isSelected && <span className="permit-radio-circle-dot" />}
                        </span>
                        <span>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {p.draft.category === 'annual' && <div className="permit-policy-category-panel">
                <h3>Annual leave rules</h3>
                <p>A yearly balance from 1 January to 31 December.</p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="permit-annual-days" className="form-label">Leave allowance <span className="text-danger">*</span></label>
                    <div className="permit-policy-unit-field">
                      <input id="permit-annual-days" type="number" min="1" step="1" placeholder="0" className="form-control"
                        value={p.draft.quota ?? ''} onChange={(e) => p.setDraft({ ...p.draft, quota: e.target.value })} required />
                      <span aria-hidden="true">days</span>
                    </div>
                  </div>
                  <div className="col-12"><label className="permit-policy-check"><input type="checkbox" checked={Boolean(p.draft.isProrated)}
                    onChange={(e) => p.setDraft({ ...p.draft, isProrated: e.target.checked })} />
                    <span>Prorate for new hires based on their actual start date</span></label>
                    {p.draft.isProrated && <div className="permit-policy-hint" role="note">
                      <Info size={18} weight="fill" aria-hidden="true" />
                      <span>Rounding and fractional-day rules still need to be defined before calculations can run.</span>
                    </div>}
                  </div>
                  <div className="col-12"><label className="permit-policy-check"><input type="checkbox" checked={Boolean(p.draft.allowNegativeBalance)}
                    onChange={(e) => p.setDraft({ ...p.draft, allowNegativeBalance: e.target.checked })} />
                    <span>Allow use beyond the available balance</span></label></div>
                  {p.draft.allowNegativeBalance && <div className="col-md-6">
                    <label htmlFor="permit-negative-days" className="form-label">Maximum negative days <span className="text-danger">*</span></label>
                    <div className="permit-policy-unit-field">
                      <input id="permit-negative-days" type="number" min="1" step="1" placeholder="0" className="form-control"
                        value={p.draft.maxNegativeDays || ''} onChange={(e) => p.setDraft({ ...p.draft, maxNegativeDays: e.target.value })} required />
                      <span aria-hidden="true">days</span>
                    </div>
                  </div>}
                  <div className="col-12"><label className="permit-policy-check"><input type="checkbox" checked={Boolean(p.draft.allowCarryOver)}
                    onChange={(e) => p.setDraft({ ...p.draft, allowCarryOver: e.target.checked })} />
                    <span>Carry unused days into the next year</span></label></div>
                  {p.draft.allowCarryOver && <>
                    <div className="col-md-6"><label htmlFor="permit-carry-days" className="form-label">Maximum days <span className="text-danger">*</span></label>
                      <div className="permit-policy-unit-field">
                        <input id="permit-carry-days" type="number" min="1" step="1" placeholder="0" className="form-control" value={p.draft.maxCarryOverDays || ''}
                          onChange={(e) => p.setDraft({ ...p.draft, maxCarryOverDays: e.target.value })} required />
                        <span aria-hidden="true">days</span>
                      </div></div>
                    <div className="col-md-6"><label htmlFor="permit-carry-months" className="form-label">Expires after <span className="text-danger">*</span></label>
                      <div className="permit-policy-unit-field">
                        <input id="permit-carry-months" type="number" min="1" step="1" placeholder="0" className="form-control" value={p.draft.carryOverExpiryMonths || ''}
                          onChange={(e) => p.setDraft({ ...p.draft, carryOverExpiryMonths: e.target.value })} required />
                        <span aria-hidden="true">months</span>
                      </div></div>
                  </>}
                </div>
              </div>}

              {p.draft.category === 'special' && <div className="permit-policy-category-panel">
                <h3>Per-event entitlement</h3>
                <p>Granted for each eligible event. The annual leave balance is not deducted.</p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="permit-event-days" className="form-label">Days per event <span className="text-danger">*</span></label>
                    <div className="permit-policy-unit-field">
                      <input id="permit-event-days" type="number" min="1" step="1" placeholder="0" className="form-control"
                        value={p.draft.eventDurationDays ?? ''} onChange={(e) => p.setDraft({ ...p.draft, eventDurationDays: e.target.value })} required />
                      <span aria-hidden="true">days</span>
                    </div>
                  </div>
                </div>
              </div>}
              {p.draft.category === 'unpaid' && <div className="permit-policy-category-panel">
                <h3>Unpaid leave</h3><p>This leave type does not deduct the annual leave balance. Payroll handling is managed separately.</p>
              </div>}
              {!PERMIT_CATEGORIES.some((item) => item.value === p.draft.category) && <div className="permit-policy-category-panel">
                <h3>Choose a category</h3><p>This older leave type needs to be assigned to Annual, Special, or Unpaid before it can be saved.</p>
              </div>}
              {(() => {
                const draft = p.draft;
                const catInfo = PERMIT_CATEGORIES.find((item) => item.value === draft.category);
                const isAnnualDraft = draft.category === 'annual';
                const entitlementValue = isAnnualDraft ? draft.quota : draft.category === 'special' ? draft.eventDurationDays : null;
                const entitlementUnit = isAnnualDraft ? 'days / year' : 'days / event';
                const requestDates = draft.allowedDates === 'past' ? 'Past dates only'
                  : draft.allowedDates === 'future' ? 'Future dates only' : 'Past & future dates';

                // tone: 'on' = rule active, 'off' = rule disabled, 'neutral' = informational
                const rules = isAnnualDraft
                  ? [
                      { label: 'New-hire prorata', Icon: UserCheck, value: draft.isProrated ? 'On' : 'Off', tone: draft.isProrated ? 'on' : 'off' },
                      {
                        label: 'Negative balance',
                        Icon: TrendDown,
                        value: draft.allowNegativeBalance ? `Up to ${draft.maxNegativeDays || '—'} days` : 'Not allowed',
                        tone: draft.allowNegativeBalance ? 'on' : 'off'
                      },
                      {
                        label: 'Carry-over',
                        Icon: ArrowsClockwise,
                        value: draft.allowCarryOver
                          ? `Up to ${draft.maxCarryOverDays || '—'} ${Number(draft.maxCarryOverDays) === 1 ? 'day' : 'days'} · Max ${draft.carryOverExpiryMonths || '—'} ${Number(draft.carryOverExpiryMonths) === 1 ? 'month' : 'months'}`
                          : 'None',
                        tone: draft.allowCarryOver ? 'on' : 'off'
                      }
                    ]
                  : catInfo
                    ? [{ label: 'Annual balance', Icon: Scales, value: 'Not deducted', tone: 'neutral' }]
                    : [];

                return (
                  <section
                    className="permit-summary-panel"
                    aria-label="Leave type summary"
                    aria-live="polite"
                    style={catInfo ? { '--summary-accent': catInfo.badgeColor, '--summary-accent-bg': catInfo.bg } : undefined}
                  >
                    <header className="permit-summary-head">
                      <span className="permit-summary-icon">
                        <CalendarBlank size={20} weight="bold" aria-hidden="true" />
                      </span>
                      <div className="permit-summary-heading">
                        <span className="permit-summary-eyebrow">Preview</span>
                        <h3 className={draft.name.trim() ? '' : 'is-placeholder'}>
                          {draft.name.trim() || 'Leave type name'}
                        </h3>
                      </div>
                      {catInfo ? (
                        <span className="permit-category-pill" style={{ color: catInfo.badgeColor, backgroundColor: catInfo.bg }}>
                          {catInfo.label}
                        </span>
                      ) : (
                        <span className="permit-summary-pending">Choose a category</span>
                      )}
                    </header>

                    <div className="permit-summary-hero">
                      <div className="permit-summary-hero-item">
                        <span className="permit-summary-label">Entitlement</span>
                        {draft.category === 'unpaid' ? (
                          <strong className="permit-summary-big is-text">No annual balance</strong>
                        ) : entitlementValue ? (
                          <strong className="permit-summary-big">
                            {entitlementValue}<small>{entitlementUnit}</small>
                          </strong>
                        ) : (
                          <strong className="permit-summary-big is-muted">Not set yet</strong>
                        )}
                      </div>
                      <div className="permit-summary-hero-item">
                        <span className="permit-summary-label">Request dates</span>
                        <span className="permit-summary-dates">
                          <Clock size={14} weight="bold" aria-hidden="true" />
                          {requestDates}
                        </span>
                      </div>
                    </div>

                    {rules.length > 0 && (
                      <ul className="permit-summary-rules">
                        {rules.map(({ label, Icon, value, tone }) => (
                          <li key={label}>
                            <span className="permit-summary-rule-icon"><Icon size={15} weight="bold" aria-hidden="true" /></span>
                            <span className="permit-summary-rule-label">{label}</span>
                            <span className={`permit-summary-rule-value is-${tone}`}>{value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })()}
            </div>
            <div className="permit-dialog-footer">
              <button type="button" className="btn permit-policy-cancel-button" onClick={p.closeEditor}>Cancel</button>
              <button type="submit" className="btn btn-primary permit-policy-save-button" disabled={!canSavePermit}>Save leave type</button>
            </div>
          </form>
        </PermitDialog>
      )}

      {/* =========================================================================
          MODAL 2: HOLIDAY & CUTI BERSAMA POLICY EDITOR + LIVE IMPACT PREVIEW
         ========================================================================= */}
      {/* =========================================================================
          MODAL 2: HOLIDAY & CUTI BERSAMA POLICY EDITOR + LIVE IMPACT PREVIEW
         ========================================================================= */}
      {p.holidayDraft && (
        <PermitDialog
          title={
            p.editingHoliday
              ? (p.holidayDraft.isCutiBersama
                ? `Edit Collective Leave: ${p.holidayDraft.name || 'Leave Event'}`
                : `Edit National Holiday: ${p.holidayDraft.name || 'National Holiday'}`)
              : 'Add National Holiday / Collective Leave'
          }
          description={
            p.editingHoliday
              ? `Configure the date ${p.holidayDraft.date || ''}, holiday type, and company leave treatment.`
              : 'Register a new national holiday or collective leave date in the work calendar.'
          }
          onClose={p.closeHolidayEditor}
          maxWidthClass="modal-wide"
        >
          <div className="permit-form-body">
            {p.error && (
              <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                <WarningCircle size={16} weight="fill" />
                <span>{p.error}</span>
              </div>
            )}

            {/* Row 1: Date & Holiday Name */}
            <div className="row g-3 mb-3">
              <div className="col-md-5">
                <label className="form-label small fw-bold">
                  Holiday Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${(!p.editingHoliday && p.holidayDraft.date && p.holidayDraft.date < p.todayIso) || dateConflict ? 'is-invalid' : ''}`}
                  value={p.holidayDraft.date}
                  onChange={(e) => p.setHolidayDraft({ ...p.holidayDraft, date: e.target.value })}
                  min={!p.editingHoliday ? p.todayIso : undefined}
                  required
                />
                {p.holidayDraft.date && (
                  <div className="text-muted mt-1" style={{ fontSize: '11.5px' }}>
                    {new Date(p.holidayDraft.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                )}
                {!p.editingHoliday && p.holidayDraft.date && p.holidayDraft.date < p.todayIso && (
                  <div className="text-danger mt-1 fw-semibold" style={{ fontSize: '11.5px' }}>
                    <WarningCircle size={13} className="me-1 inline-icon" weight="bold" />
                    New holidays can only be added for today or a future date ({p.todayIso}).
                  </div>
                )}
                {dateConflict && (
                  <div className="text-danger mt-1 fw-semibold" style={{ fontSize: '11.5px' }}>
                    <WarningCircle size={13} className="me-1 inline-icon" weight="bold" />
                    This date already has “{dateConflict.name}”. Only one holiday is allowed per date.
                  </div>
                )}
              </div>

              <div className="col-md-7">
                <label className="form-label small fw-bold">
                  Holiday Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Example: Chinese New Year 2577"
                  value={p.holidayDraft.name}
                  onChange={(e) => p.setHolidayDraft({ ...p.holidayDraft, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 2: Holiday Classification (Radio Cards) */}
            <div className="mb-3">
              <label className="form-label small fw-bold d-block mb-2">
                Holiday Classification <span className="text-danger">*</span>
              </label>
              <div className="permit-class-cards-grid">
                {/* Option 1: Official National Holiday */}
                <div
                  className={`permit-class-card national ${!p.holidayDraft.isCutiBersama ? 'selected' : ''}`}
                  onClick={() =>
                    p.setHolidayDraft({
                      ...p.holidayDraft,
                      isCutiBersama: false,
                      type: 'national_holiday',
                      treatment: 'free_leave'
                    })
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div className="permit-class-card-icon">
                    <CalendarBlank size={20} weight="bold" />
                  </div>
                  <div className="permit-class-card-body">
                    <h4>Official National Holiday</h4>
                    <p>
                      Official holiday under the Joint Ministerial Decree. All employees are off without deducting annual leave balance.
                    </p>
                  </div>
                </div>

                {/* Option 2: Government Collective Leave */}
                <div
                  className={`permit-class-card cuti ${p.holidayDraft.isCutiBersama ? 'selected' : ''}`}
                  onClick={() =>
                    p.setHolidayDraft({
                      ...p.holidayDraft,
                      isCutiBersama: true,
                      type: 'cuti_bersama',
                      treatment: p.holidayDraft.treatment === 'free_leave' ? 'deduct_annual' : p.holidayDraft.treatment
                    })
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div className="permit-class-card-icon">
                    <CalendarStar size={20} weight="bold" />
                  </div>
                  <div className="permit-class-card-body">
                    <h4>Government Collective Leave</h4>
                    <p>
                      Collective leave where the annual leave deduction and applicable work units can be adjusted.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional Section: Collective Leave Policies */}
            {p.holidayDraft.isCutiBersama && (() => {
              const treatment = p.holidayDraft.treatment || 'deduct_annual';
              const impact = p.currentHolidayImpact;
              const deptNames = impact.affectedDeptNames;
              const scope = p.holidayDraft.scope === 'departments' ? 'departments' : 'all';
              const selectedDeptIds = p.holidayDraft.scopeValue || [];

              return (
                <div className="permit-treatment-section">
                  <fieldset className="permit-treatment-fieldset">
                    <legend className="form-label small fw-bold mb-1">
                      Company Policy Treatment <span className="text-danger">*</span>
                    </legend>
                    <p className="permit-treatment-hint">
                      Assign on-duty staff in <strong>Work Schedule</strong>.
                    </p>

                    <div className="permit-treatment-options">
                      {TREATMENT_OPTIONS.map((t) => (
                        <label
                          key={t.value}
                          className={`permit-treatment-option ${treatment === t.value ? 'is-selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="holiday-treatment"
                            value={t.value}
                            checked={treatment === t.value}
                            onChange={() => p.setHolidayDraft({ ...p.holidayDraft, treatment: t.value })}
                          />
                          <span className="permit-treatment-text">
                            <span className="permit-treatment-title">{t.title}</span>
                            <span className="permit-treatment-desc">{t.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="permit-treatment-fieldset permit-scope-fieldset">
                    <legend className="form-label small fw-bold mb-2">
                      Who gets this leave <span className="text-danger">*</span>
                    </legend>
                    <div className="permit-scope-toggle" role="radiogroup">
                      {[
                        { value: 'all', label: 'All departments' },
                        { value: 'departments', label: 'Selected departments' }
                      ].map((opt) => (
                        <label key={opt.value} className={`permit-scope-toggle-item ${scope === opt.value ? 'is-active' : ''}`}>
                          <input
                            type="radio"
                            name="holiday-scope"
                            value={opt.value}
                            checked={scope === opt.value}
                            onChange={() => p.setHolidayDraft({
                              ...p.holidayDraft,
                              scope: opt.value,
                              scopeValue: opt.value === 'all' ? [] : selectedDeptIds
                            })}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>

                    {scope === 'departments' && (
                      <div className="permit-scope-depts">
                        <div className="permit-scope-depts-head">
                          <span>{selectedDeptIds.length} of {DEPARTMENTS.length} selected</span>
                          <button
                            type="button"
                            onClick={() => p.setHolidayDraft({
                              ...p.holidayDraft,
                              scopeValue: selectedDeptIds.length === DEPARTMENTS.length ? [] : DEPARTMENTS.map((d) => d.id)
                            })}
                          >
                            {selectedDeptIds.length === DEPARTMENTS.length ? 'Clear all' : 'Select all'}
                          </button>
                        </div>
                        <div className="permit-scope-dept-grid">
                          {DEPARTMENTS.map((dept) => {
                            const checked = selectedDeptIds.includes(dept.id);
                            return (
                              <label key={dept.id} className={`permit-scope-dept ${checked ? 'is-checked' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => p.setHolidayDraft({
                                    ...p.holidayDraft,
                                    scopeValue: checked
                                      ? selectedDeptIds.filter((id) => id !== dept.id)
                                      : [...selectedDeptIds, dept.id]
                                  })}
                                />
                                <span>{dept.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        {selectedDeptIds.length === 0 && (
                          <p className="permit-scope-empty">Select at least one department.</p>
                        )}
                      </div>
                    )}
                  </fieldset>

                  <div className="permit-impact" aria-live="polite">
                    <span className="permit-impact-label">Impact preview</span>
                    <div className="permit-impact-card">
                        <div className="permit-impact-stats">
                          <div className="permit-impact-stat">
                            <span className="permit-impact-stat-label">Employees off</span>
                            <strong className="permit-impact-stat-value">{impact.affectedEmployeesCount}</strong>
                            <span className="permit-impact-stat-sub">
                              {scope === 'all' ? `All ${deptNames.length} departments` : `Across ${deptNames.length} of ${DEPARTMENTS.length} departments`}
                            </span>
                          </div>
                          <div className={`permit-impact-stat ${impact.totalDaysDeducted > 0 ? 'is-cost' : 'is-free'}`}>
                            <span className="permit-impact-stat-label">Annual leave deducted</span>
                            <strong className="permit-impact-stat-value">
                              {impact.totalDaysDeducted} <small>days</small>
                            </strong>
                            <span className="permit-impact-stat-sub">
                              {impact.totalDaysDeducted > 0 ? '1 day per employee' : 'Balances stay the same'}
                            </span>
                          </div>
                        </div>
                        {deptNames.length > 0 && (
                          <ul className="permit-impact-depts" aria-label="Affected departments">
                            {deptNames.map((name) => (
                              <li key={name}>{name}</li>
                            ))}
                          </ul>
                        )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Past Amendment Warning & Reason */}
            {p.isHolidayInPast && p.holidayDraft.isCutiBersama && (
              <div className="alert alert-warning py-2 px-3 small mb-3">
                <div className="d-flex align-items-center gap-2 mb-1 text-warning-emphasis fw-bold">
                  <WarningCircle size={18} weight="fill" color="#d97706" />
                  <span>Past Date Warning</span>
                </div>
                <p className="mb-2">
                  This collective leave date has already passed. The revision will be sent to the HR Director for audit approval before balances are reconciled.
                </p>
                <label className="form-label small fw-bold text-danger">
                  Past Date Revision Reason (Required for Audit Authorization) <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Explain why the collective leave policy for this past date is being changed..."
                  value={p.pastAmendmentReason}
                  onChange={(e) => p.setPastAmendmentReason(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Row 4: Catatan Opsional */}
            <div>
              <label className="form-label small fw-bold">
                Notes / Document Reference <span className="permit-optional">Optional</span>
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Example: Joint Ministerial Decree No. 1017/2025, Board circular, etc."
                value={p.holidayDraft.note || ''}
                onChange={(e) => p.setHolidayDraft({ ...p.holidayDraft, note: e.target.value })}
              />
            </div>
          </div>

          <div className="permit-dialog-footer d-flex align-items-center justify-content-between">
            <div>
              {p.editingHoliday && (
                <button
                  type="button"
                  className="btn btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
                  onClick={() => {
                    setHolidayToDelete(p.holidayDraft);
                  }}
                >
                  <Trash size={15} weight="bold" />
                  <span>Delete Date</span>
                </button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary px-3 py-1.5"
                onClick={p.closeHolidayEditor}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary px-3 py-1.5"
                style={{ backgroundColor: '#002B7F', borderColor: '#002B7F' }}
                onClick={p.saveHolidayPolicy}
                disabled={!p.editingHoliday && Boolean(p.holidayDraft?.date && p.holidayDraft.date < p.todayIso)}
              >
                {p.isHolidayInPast && p.holidayDraft.isCutiBersama
                  ? 'Submit for HR Director Approval'
                  : 'Save Holiday'}
              </button>
            </div>
          </div>
        </PermitDialog>
      )}

      {/* =========================================================================
          MODAL 3: EMPLOYEE LEAVE LEDGER DRAWER (DETAIL MUTASI SALDO)
         ========================================================================= */}
      {p.adjustmentTarget && (() => {
        const target = p.adjustmentTarget;
        const amount = Number(p.adjDraft.amount) || 0;
        const delta = p.adjDraft.type === 'add' ? amount : -amount;
        const isNegativeResult = p.simulatedBalance < 0;
        const amountValid = Number.isInteger(amount) && amount >= 1 && amount <= 30;
        const canSubmit = amountValid && p.adjDraft.reasonNote.trim().length > 0;
        const targetDept = DEPARTMENTS.find((d) => d.id === target.departmentId);
        const targetJabatan = getEmployeeJabatan(EMPLOYEES.find((e) => e.id === target.employeeId) || target, targetDept?.name);

        return (
          <PermitDialog
            title="Request balance adjustment"
            description="Add or deduct annual leave days. The balance changes only after approval."
            onClose={p.closeAdjustmentModal}
            maxWidthClass="modal-wide"
          >
            <div className="permit-form-body permit-adjust-form">
              {p.error && (
                <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2" role="alert">
                  <WarningCircle size={16} weight="fill" />
                  <span>{p.error}</span>
                </div>
              )}

              <section className="permit-adjust-employee" aria-label="Employee">
                <img
                  src={target.avatar}
                  alt=""
                  className="emp-balance-avatar"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'; }}
                />
                <div className="permit-adjust-employee-info">
                  <strong>{target.employeeName}</strong>
                  <span>NIP {target.nik}</span>
                  <span>{targetJabatan}</span>
                </div>
                <div className="permit-adjust-employee-balance">
                  <small>Current balance</small>
                  <strong>{target.available}<span> days</span></strong>
                </div>
              </section>

              <section className="permit-adjust-section" aria-label="Adjustment">
                <fieldset className="permit-adjust-type-group">
                  <legend className="permit-adjust-label">Type</legend>
                  <div className="permit-adjust-types" role="radiogroup">
                    {[
                      { value: 'add', title: 'Add days', hint: 'Credit days to the balance', Icon: TrendUp },
                      { value: 'deduct', title: 'Deduct days', hint: 'Take days off the balance', Icon: TrendDown }
                    ].map(({ value, title, hint, Icon }) => (
                      <label key={value} className={`permit-adjust-type is-${value} ${p.adjDraft.type === value ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="adjustment-type"
                          value={value}
                          checked={p.adjDraft.type === value}
                          onChange={() => p.setAdjDraft({ ...p.adjDraft, type: value })}
                        />
                        <span className="permit-adjust-type-icon"><Icon size={18} weight="bold" aria-hidden="true" /></span>
                        <span className="permit-adjust-type-text">
                          <strong>{title}</strong>
                          <small>{hint}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="permit-adjust-days-group">
                  <label htmlFor="adj-days" className="permit-adjust-label">Number of days <span className="text-danger">*</span></label>
                  <div className="permit-adjust-stepper">
                    <button
                      type="button"
                      aria-label="Decrease days"
                      disabled={amount <= 1}
                      onClick={() => p.setAdjDraft({ ...p.adjDraft, amount: Math.max(1, amount - 1) })}
                    >
                      <Minus size={16} weight="bold" />
                    </button>
                    <input
                      id="adj-days"
                      type="number"
                      min="1"
                      max="30"
                      step="1"
                      className={p.adjDraft.amount !== '' && !amountValid ? 'is-invalid' : ''}
                      value={p.adjDraft.amount}
                      onChange={(e) => p.setAdjDraft({ ...p.adjDraft, amount: e.target.value === '' ? '' : Number(e.target.value) })}
                      required
                    />
                    <button
                      type="button"
                      aria-label="Increase days"
                      disabled={amount >= 30}
                      onClick={() => p.setAdjDraft({ ...p.adjDraft, amount: Math.min(30, amount + 1) })}
                    >
                      <Plus size={16} weight="bold" />
                    </button>
                    <span className="permit-adjust-stepper-unit">days</span>
                  </div>
                  <span className="permit-adjust-hint">Whole days, 1 to 30.</span>
                </div>

                <div className="permit-adjust-notes">
                  <label htmlFor="adj-note" className="permit-adjust-label">Notes <span className="text-danger">*</span></label>
                  <textarea
                    id="adj-note"
                    className="form-control"
                    rows={3}
                    placeholder="Why is this adjustment needed? Include the ticket number or approval memo if there is one."
                    value={p.adjDraft.reasonNote}
                    onChange={(e) => p.setAdjDraft({ ...p.adjDraft, reasonNote: e.target.value })}
                    required
                  />
                </div>
              </section>

              <section className="permit-adjust-result" aria-live="polite" aria-label="Result">
                <div className="permit-adjust-flow">
                  <div className="permit-adjust-stat">
                    <small>Current balance</small>
                    <strong>{target.available}<span> days</span></strong>
                  </div>
                  <div className="permit-adjust-flow-mid" aria-hidden="true">
                    <span className={`permit-delta-chip ${delta >= 0 ? 'is-plus' : 'is-minus'}`}>{delta >= 0 ? `+${delta}` : delta}</span>
                    <ArrowRight size={18} weight="bold" />
                  </div>
                  <div className={`permit-adjust-stat is-after ${isNegativeResult ? 'is-negative' : ''}`}>
                    <small>New balance</small>
                    <strong>{p.simulatedBalance}<span> days</span></strong>
                  </div>
                </div>
                {isNegativeResult && (
                  <p className="permit-adjust-warning">
                    <WarningCircle size={14} weight="fill" aria-hidden="true" /> This leaves the balance negative.
                  </p>
                )}
                <div className="permit-adjust-approver-row">
                  <span className="permit-adjust-approver-label">
                    <UserCheck size={16} weight="bold" aria-hidden="true" />
                    Approver
                  </span>
                  <span className="permit-approver-chip">
                    <span className="permit-approver-avatar" aria-hidden="true">BM</span>
                    Building Manager
                  </span>
                </div>
              </section>

            </div>

            <div className="permit-dialog-footer">
              <button type="button" className="permit-confirm-btn is-cancel" onClick={p.closeAdjustmentModal}>Cancel</button>
              <button type="button" className="permit-confirm-btn is-primary" onClick={p.submitAdjustmentRequest} disabled={!canSubmit}>
                Submit request
              </button>
            </div>
          </PermitDialog>
        );
      })()}

      {reviewTicket && (() => {
        const ticket = reviewTicket;
        const isPending = ticket.status === 'pending';
        const delta = ticket.type === 'add' ? ticket.amount : -ticket.amount;
        const chain = ticket.approvalChain || [];
        const currentStep = getCurrentApprovalStep(ticket);
        const currentLabel = ADJUSTMENT_APPROVER_LABELS[currentStep?.role] || 'approver';
        const jabatanOf = (person) => getEmployeeJabatan(person, DEPARTMENTS.find((d) => d.id === person?.departmentId)?.name);
        const employeePerson = EMPLOYEES.find((e) => e.id === ticket.employeeId);
        const requesterPerson = EMPLOYEES.find((e) => e.id === ticket.requestedById);
        const isSelfRequest = ticket.requesterRole === 'employee';

        return (
          <PermitDialog
            title={isPending ? 'Review adjustment request' : 'Adjustment request'}
            description={`${ticket.id.toUpperCase()} • Requested ${ticket.requestedAt}`}
            onClose={closeReview}
            maxWidthClass="modal-wide"
          >
            <div className="permit-form-body">
              <div className="permit-review-summary">
                <div>
                  <small>Employee</small>
                  <strong>{ticket.employeeName}</strong>
                  <span className="permit-review-sub">{jabatanOf(employeePerson)}</span>
                </div>
                <div>
                  <small>Balance change</small>
                  <span className="permit-balance-change">
                    <span className="text-muted">{ticket.beforeBalance}</span>
                    <span aria-hidden="true">&rarr;</span>
                    <strong>{ticket.afterBalance}</strong>
                    <span className={`permit-delta-chip ${delta > 0 ? 'is-plus' : 'is-minus'}`}>{delta > 0 ? `+${delta}` : delta} days</span>
                  </span>
                </div>
                <div>
                  <small>Requested by</small>
                  {isSelfRequest ? (
                    <>
                      <strong>Self-requested</strong>
                      <span className="permit-review-sub">By the employee</span>
                    </>
                  ) : (
                    <>
                      <strong>{ticket.requestedBy}</strong>
                      <span className="permit-review-sub">{requesterPerson ? jabatanOf(requesterPerson) : ADJUSTMENT_REQUESTER_LABELS[ticket.requesterRole]}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="permit-review-block">
                <small>Notes</small>
                <p>{ticket.reasonNote}</p>
              </div>

              <div className="permit-review-block">
                <small>Approval steps</small>
                <ol className="permit-approval-steps">
                  {chain.map((step, index) => (
                    <li key={step.role} className={`is-${step.status} ${step === currentStep ? 'is-current' : ''}`}>
                      <span className="permit-approval-marker" aria-hidden="true">
                        {step.status === 'approved' ? <Check size={12} weight="bold" /> : step.status === 'rejected' ? <X size={12} weight="bold" /> : index + 1}
                      </span>
                      <div>
                        <strong>{ADJUSTMENT_APPROVER_LABELS[step.role]}</strong>
                        <span className="permit-approval-state">
                          {step.status === 'pending'
                            ? (step === currentStep ? 'Waiting for approval' : 'Not started')
                            : `${step.status === 'approved' ? 'Approved' : 'Rejected'} · ${step.reviewedAt}`}
                        </span>
                        {step.reviewNote && step.status !== 'pending' && <p>{step.reviewNote}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {isPending ? (
                <div className="mt-3">
                  <label htmlFor="review-note" className="form-label small fw-bold">
                    Review note <span className="permit-optional">Required to reject</span>
                  </label>
                  <textarea
                    id="review-note"
                    className={`form-control ${reviewError ? 'is-invalid' : ''}`}
                    rows={2}
                    placeholder="Explain your decision. The requester will see this."
                    value={reviewNote}
                    onChange={(e) => { setReviewNote(e.target.value); setReviewError(''); }}
                  />
                  {reviewError && <div className="invalid-feedback d-block">{reviewError}</div>}
                </div>
              ) : (
                <div className="mt-3">
                  <span className={`permit-ticket-badge is-${ticket.status}`}>{ticket.status === 'approved' ? 'Approved' : 'Rejected'}</span>
                </div>
              )}
            </div>

            <div className="permit-dialog-footer">
              {!isPending && (
                <button type="button" className="permit-confirm-btn is-cancel" onClick={closeReview}>Close</button>
              )}
              {isPending && (
                <>
                  <button
                    type="button"
                    className="permit-confirm-btn is-danger-outline"
                    onClick={() => {
                      if (!reviewNote.trim()) {
                        setReviewError('Add a note explaining the rejection.');
                        return;
                      }
                      p.rejectAdjustmentTicket(ticket.id, reviewNote);
                      closeReview();
                    }}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="permit-confirm-btn is-success"
                    onClick={() => {
                      p.approveAdjustmentTicket(ticket.id, reviewNote);
                      closeReview();
                    }}
                  >
                    Approve as {currentLabel}
                  </button>
                </>
              )}
            </div>
          </PermitDialog>
        );
      })()}

      {p.selectedLedgerEmp && (() => {
        const ledgerEmp = p.selectedLedgerEmp;
        const typeLabels = Object.fromEntries(LEDGER_ENTRY_TYPES.map((t) => [t.value, t.label]));
        const typeIcons = { entitlement: CalendarCheck, carry_over: ArrowsClockwise, leave_taken: Briefcase, cuti_bersama: CalendarStar, adjustment: Scales };
        const entries = ledgerEmp.ledger || [];
        // Stored oldest first so the running balance reads in order; shown newest first.
        const allEntries = entries.slice().reverse();
        const ledgerTotalPages = Math.max(1, Math.ceil(allEntries.length / LEDGER_PAGE_SIZE));
        const ledgerPage = Math.min(ledgerPageState.id === ledgerEmp.employeeId ? ledgerPageState.page : 1, ledgerTotalPages);
        const visibleEntries = allEntries.slice((ledgerPage - 1) * LEDGER_PAGE_SIZE, ledgerPage * LEDGER_PAGE_SIZE);
        const formatLedgerDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const signed = (value) => (value > 0 ? `+${value}` : value < 0 ? `\u2212${Math.abs(value)}` : '0');
        const adjustmentTotal = ledgerEmp.adjustmentTotal || 0;
        const tone = (value) => (value > 0 ? 'is-plus' : value < 0 ? 'is-minus' : '');

        return (
          <PermitDialog
            title={`Balance ledger: ${ledgerEmp.employeeName}`}
            description={`NIP ${ledgerEmp.nik}`}
            onClose={closeLedger}
            maxWidthClass="modal-ledger"
          >
            <div className="permit-form-body">
              <div className="permit-ledger-summary" role="group" aria-label="Balance summary">
                <div><small>Entitlement</small><strong>{ledgerEmp.baseEntitlement}</strong></div>
                <div>
                  <small>Carry-over</small>
                  <strong className={tone(ledgerEmp.carryOver)}>+{ledgerEmp.carryOver}</strong>
                  {ledgerEmp.carryOver > 0 && ledgerEmp.carryOverExpiry && <span>Expiry {formatLedgerDate(ledgerEmp.carryOverExpiry)}</span>}
                </div>
                <div><small>Used</small><strong className={tone(-ledgerEmp.usedLeave)}>{signed(-ledgerEmp.usedLeave)}</strong></div>
                <div><small>Collective leave</small><strong className={tone(-ledgerEmp.cutiBersamaDeduction)}>{signed(-ledgerEmp.cutiBersamaDeduction)}</strong></div>
                <div><small>Adjustments</small><strong className={tone(adjustmentTotal)}>{signed(adjustmentTotal)}</strong></div>
                <div className={`is-total ${ledgerEmp.available < 0 ? 'is-negative' : ''}`}>
                  <small>Available</small>
                  <strong>{ledgerEmp.available}<span> days</span></strong>
                </div>
              </div>

              <div className="permit-ledger-toolbar">
                <h3 className="permit-ledger-heading"><Clock size={17} weight="bold" aria-hidden="true" />History Balance</h3>
                <button
                  type="button"
                  className="emp-btn-secondary"
                  onClick={() => exportLedgerToExcel({ employeeName: ledgerEmp.employeeName, nik: ledgerEmp.nik, entries, typeLabels })}
                  disabled={entries.length === 0}
                >
                  <FileXls size={16} weight="bold" aria-hidden="true" />
                  <span>Export</span>
                </button>
              </div>

              <div className="permit-policy-table-inner">
                <div className="table-responsive">
                  <table className="permit-table permit-ledger-table">
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Type</th>
                        <th scope="col">Description</th>
                        <th scope="col" className="text-end">Days</th>
                        <th scope="col" className="text-end">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleEntries.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-muted py-4">No history yet.</td></tr>
                      ) : visibleEntries.map((entry) => {
                        const TypeIcon = typeIcons[entry.type] || Scales;
                        const ticket = entry.ticketId ? p.adjustments.find((t) => t.id === entry.ticketId) : null;
                        return (
                          <tr key={entry.id}>
                            <td className="permit-ledger-date">{formatLedgerDate(entry.date)}</td>
                            <td>
                              <span className={`permit-ledger-type is-${entry.type}`}>
                                <TypeIcon size={12} weight="bold" aria-hidden="true" />
                                {typeLabels[entry.type] || entry.type}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold text-dark" style={{ fontSize: '13px' }}>{entry.description}</div>
                              {ticket ? (
                                <div className="permit-ledger-source">
                                  <span className="permit-ledger-source-line">
                                    From adjustment request{' '}
                                    <button
                                      type="button"
                                      className="permit-ledger-ref is-link"
                                      title="Open this adjustment request"
                                      onClick={() => { closeLedger(); openReview(ticket); }}
                                    >
                                      {entry.refNo}
                                    </button>
                                  </span>
                                  <span>Requested by {entry.requestedBy} &middot; Approved by {entry.approvedBy}</span>
                                </div>
                              ) : (
                                <div className="permit-cell-note">{entry.approvedBy}</div>
                              )}
                            </td>
                            <td className={`text-end permit-ledger-days ${entry.amount > 0 ? 'is-credit' : 'is-debit'}`}>{signed(entry.amount)}</td>
                            <td className={`text-end permit-ledger-balance ${entry.balanceAfter < 0 ? 'is-negative' : ''}`}>{entry.balanceAfter}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {allEntries.length > LEDGER_PAGE_SIZE && (
                  <TablePager
                    page={ledgerPage}
                    totalPages={ledgerTotalPages}
                    count={allEntries.length}
                    pageSize={LEDGER_PAGE_SIZE}
                    noun="entries"
                    onPage={(next) => setLedgerPageState({ id: ledgerEmp.employeeId, page: next })}
                  />
                )}
              </div>
            </div>

            <div className="permit-dialog-footer">
              <button type="button" className="permit-confirm-btn is-cancel" onClick={closeLedger}>Close</button>
              <button
                type="button"
                className="permit-confirm-btn is-primary"
                onClick={() => {
                  const target = p.selectedLedgerEmp;
                  closeLedger();
                  p.openAdjustmentModal(target);
                }}
              >
                Request adjustment
              </button>
            </div>
          </PermitDialog>
        );
      })()}

      {/* Status Toggle Modal */}
      {p.statusTarget && (
        <PermitDialog
          title={p.statusTarget.isActive !== false ? 'Deactivate leave type?' : 'Reactivate leave type?'}
          onClose={p.closeStatusModal}
        >
          <div className="permit-form-body">
            <p className="mb-0 text-dark">
              {p.statusTarget.isActive !== false ? (
                <>
                  <strong>{p.statusTarget.name}</strong> will remain in your records but will no longer be available for new requests.
                </>
              ) : (
                <>
                  <strong>{p.statusTarget.name}</strong> will be available for new requests again.
                </>
              )}
            </p>
          </div>
          <div className="permit-dialog-footer">
            <button type="button" className="permit-confirm-btn is-cancel" onClick={p.closeStatusModal}>
              Cancel
            </button>
            <button
              type="button"
              className={`permit-confirm-btn ${p.statusTarget.isActive !== false ? 'is-danger' : 'is-success'}`}
              onClick={p.confirmToggleStatus}
            >
              {p.statusTarget.isActive !== false ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        </PermitDialog>
      )}

      {/* Success Notification Dialog */}
      {p.successModal && (
        <SuccessDialog
          title={p.successModal.title}
          subtext={p.successModal.subtext}
          onClose={p.closeSuccessModal}
        />
      )}

      {/* Action Dropdown Portal */}
      {holidayToDelete && typeof document !== 'undefined' && (
        <HolidayDeleteModal
          holiday={holidayToDelete}
          onCancel={() => setHolidayToDelete(null)}
          onConfirm={() => {
            p.deleteHoliday(holidayToDelete.id);
            setHolidayToDelete(null);
          }}
        />
      )}

      {activeActionId && actionAnchor && typeof document !== 'undefined' && createPortal(
        <div
          className="permit-action-dropdown-menu"
          style={{
            position: 'fixed',
            top: `${actionAnchor.top}px`,
            right: `${actionAnchor.right}px`,
            zIndex: 99999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {actionAnchor.kind === 'balance' ? (
            <>
              <button
                type="button"
                className="permit-action-dropdown-item"
                onClick={() => {
                  const item = actionAnchor.permit;
                  setActiveActionId(null);
                  setActionAnchor(null);
                  p.openLedgerModal(item);
                }}
              >
                <Clock size={16} weight="bold" />
                <span>View ledger</span>
              </button>
              <button
                type="button"
                className="permit-action-dropdown-item"
                onClick={() => {
                  const item = actionAnchor.permit;
                  setActiveActionId(null);
                  setActionAnchor(null);
                  p.openAdjustmentModal(item);
                }}
              >
                <Scales size={16} weight="bold" />
                <span>Request adjustment</span>
              </button>
            </>
          ) : actionAnchor.kind === 'holiday' ? (
            <>
              <button
                type="button"
                className="permit-action-dropdown-item"
                onClick={() => {
                  const holiday = actionAnchor.permit;
                  setActiveActionId(null);
                  setActionAnchor(null);
                  p.openHolidayEditor(holiday);
                }}
              >
                <PencilSimple size={16} weight="bold" />
                <span>Edit holiday</span>
              </button>
              <div className="permit-action-dropdown-divider" />
              <button
                type="button"
                className="permit-action-dropdown-item danger"
                onClick={() => {
                  const holiday = actionAnchor.permit;
                  setActiveActionId(null);
                  setActionAnchor(null);
                  setHolidayToDelete(holiday);
                }}
              >
                <Trash size={16} weight="bold" />
                <span>Delete holiday</span>
              </button>
            </>
          ) : (
            <>
          <button
            type="button"
            className="permit-action-dropdown-item"
            onClick={() => {
              const permit = actionAnchor.permit;
              setActiveActionId(null);
              setActionAnchor(null);
              p.setDetailPermit(permit);
            }}
          >
            <Info size={16} weight="bold" />
            <span>View details</span>
          </button>
          <button
            type="button"
            className="permit-action-dropdown-item"
            onClick={() => {
              const permit = actionAnchor.permit;
              setActiveActionId(null);
              setActionAnchor(null);
              p.openEditor(permit);
            }}
          >
            <PencilSimple size={16} weight="bold" />
            <span>Edit leave type</span>
          </button>
          <div className="permit-action-dropdown-divider" />
          <button
            type="button"
            className={`permit-action-dropdown-item ${actionAnchor.permit.isActive !== false ? 'danger' : 'success'}`}
            onClick={() => {
              const permit = actionAnchor.permit;
              setActiveActionId(null);
              setActionAnchor(null);
              p.requestToggleStatus(permit);
            }}
          >
            {actionAnchor.permit.isActive !== false ? (
              <>
                <Power size={16} weight="bold" />
                <span>Deactivate</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} weight="bold" />
                <span>Activate</span>
              </>
            )}
          </button>
            </>
          )}
        </div>,
        document.body
      )}
    </section>
  );
}
