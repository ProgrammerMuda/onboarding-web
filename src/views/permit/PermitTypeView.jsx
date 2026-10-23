import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowsClockwise,
  Briefcase,
  CalendarBlank,
  CalendarCheck,
  CalendarStar,
  CaretLeft,
  CaretRight,
  Check,
  CheckCircle,
  ClipboardText,
  Clock,
  DotsThreeVertical,
  FileText,
  Info,
  MagnifyingGlass,
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
  WarningCircle,
  X
} from '@phosphor-icons/react';
import {
  ALLOWED_DATE_OPTIONS,
  PERMIT_CATEGORIES,
  TREATMENT_OPTIONS,
  ADJUSTMENT_REASON_CATEGORIES,
  validatePermitType
} from '../../models/PermitTypeModel';
import { DEPARTMENTS } from '../../models/ApprovalFlowModel';
import { Breadcrumb } from '../components/Breadcrumb';
import './permit-type.css';

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
            title="Tutup dialog"
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
        <div className="position-relative text-center bg-white" style={{ padding: '38px 28px 28px', borderRadius: '16px' }}>
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
            {title || 'Berhasil Diproses!'}
          </h3>
          <p className="text-muted mx-auto mb-4" style={{ fontSize: '14px', lineHeight: 1.5, maxWidth: '360px' }}>
            {subtext || 'Operasi berhasil disimpan dan diperbarui dalam sistem.'}
          </p>
          <button
            type="button"
            className="btn btn-primary w-100"
            style={{ backgroundColor: '#002B7F', borderColor: '#002B7F', height: '42px', fontWeight: 600 }}
            onClick={onClose}
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export function PermitTypeView({ presenter: p }) {
  const [balanceSubView, setBalanceSubView] = useState('directory'); // 'directory' | 'adjustments'
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

  const handleToggleActionMenu = (e, permit) => {
    e.stopPropagation();
    if (activeActionId === permit.id) {
      setActiveActionId(null);
      setActionAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 135;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < dropdownHeight + 15;
    const top = openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4;
    const right = Math.max(8, window.innerWidth - rect.right);

    setActiveActionId(permit.id);
    setActionAnchor({ permit, top, right });
  };

  const canSavePermit = Boolean(p.draft && !validatePermitType(p.draft, p.permits));

  // Tab 1 Specific Statistics Metrics
  const totalPermits = p.permits.length;
  const annualPermits = p.permits.filter(item => item.category === 'annual').length;
  const specialPermits = p.permits.filter(item => item.category === 'special').length;
  const unpaidPermits = p.permits.filter(item => item.category === 'unpaid').length;

  const pendingAdjustmentsCount = p.adjustments.filter(a => a.status === 'pending').length;
  const pendingHolidayAmendments = p.holidays.filter(h => Boolean(h.pendingAmendment));
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
            <span>Leave Calendar</span>
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
              <div className="permit-stat-icon-wrap navy">
                <FileText size={22} weight="bold" />
              </div>
              <div className="permit-stat-meta">
                <span>Total permits</span>
                <strong>{totalPermits} types</strong>
              </div>
            </div>

            <div className="permit-stat-box">
              <div className="permit-stat-icon-wrap teal">
                <CalendarStar size={22} weight="bold" />
              </div>
              <div className="permit-stat-meta">
                <span>Annual leave</span>
                <strong>{annualPermits} types</strong>
              </div>
            </div>

            <div className="permit-stat-box">
              <div className="permit-stat-icon-wrap emerald">
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
                                title="Opsi tindakan"
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
          TAB 2: HOLIDAYS & CUTI BERSAMA (CALENDAR & TABLE VIEW)
         ========================================================================= */}
      {p.activeTab === 'holidays' && (() => {
        const calDate = p.holidayCalendarDate || new Date(2026, 0, 1);
        const calYear = calDate.getFullYear();
        const calMonth = calDate.getMonth();

        const MONTH_NAMES = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const WEEKDAYS = [
          { key: 'sen', label: 'Senin', isWeekend: false },
          { key: 'sel', label: 'Selasa', isWeekend: false },
          { key: 'rab', label: 'Rabu', isWeekend: false },
          { key: 'kam', label: 'Kamis', isWeekend: false },
          { key: 'jum', label: 'Jumat', isWeekend: false },
          { key: 'sab', label: 'Sabtu', isWeekend: true },
          { key: 'min', label: 'Minggu', isWeekend: true }
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

        const todayObj = new Date();
        const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

        return (
          <div className="permit-calendar-card">
            {/* Header: Title, View Switcher & Add Button */}
            <div className="emp-card-header">
              <div>
                <h2 className="emp-card-title">Leave &amp; Holiday Calendar</h2>
                <p className="emp-card-desc">
                  Kelola jadwal libur nasional dan cuti bersama resmi pemerintah serta konfigurasi perlakuan cuti perusahaan.
                </p>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* View Switcher: Calendar vs Table */}
                <div className="btn-group" role="group" aria-label="Tampilan kalender atau tabel">
                  <button
                    type="button"
                    className={`btn btn-sm d-inline-flex align-items-center gap-1.5 ${p.holidayViewMode === 'calendar' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{
                      backgroundColor: p.holidayViewMode === 'calendar' ? '#002B7F' : 'transparent',
                      borderColor: p.holidayViewMode === 'calendar' ? '#002B7F' : '#cbd5e1',
                      color: p.holidayViewMode === 'calendar' ? '#ffffff' : '#475569',
                      fontWeight: 600,
                      padding: '7px 14px'
                    }}
                    onClick={() => p.setHolidayViewMode('calendar')}
                  >
                    <CalendarBlank size={16} weight="bold" />
                    <span>Calendar View</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm d-inline-flex align-items-center gap-1.5 ${p.holidayViewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{
                      backgroundColor: p.holidayViewMode === 'table' ? '#002B7F' : 'transparent',
                      borderColor: p.holidayViewMode === 'table' ? '#002B7F' : '#cbd5e1',
                      color: p.holidayViewMode === 'table' ? '#ffffff' : '#475569',
                      fontWeight: 600,
                      padding: '7px 14px'
                    }}
                    onClick={() => p.setHolidayViewMode('table')}
                  >
                    <Table size={16} weight="bold" />
                    <span>Table View</span>
                  </button>
                </div>

                {/* Add Holiday Button */}
                <button
                  type="button"
                  className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 shadow-sm"
                  style={{ backgroundColor: '#002B7F', borderColor: '#002B7F', fontWeight: 600, padding: '7px 14px' }}
                  onClick={() => p.openNewHoliday()}
                >
                  <Plus size={16} weight="bold" />
                  <span>Tambah Hari Libur</span>
                </button>
              </div>
            </div>

            {/* Pending Past Amendments Alert */}
            {pendingHolidayAmendments.length > 0 && (
              <div className="m-3 p-3 pending-amendment-alert">
                <div className="pending-amendment-meta">
                  <WarningCircle size={24} weight="fill" color="#d97706" />
                  <div>
                    <strong>{pendingHolidayAmendments.length} Pengajuan Perubahan Tanggal Lampau Menunggu Persetujuan</strong>
                    <p>
                      Revisi cuti bersama pada tanggal yang telah lewat memerlukan otorisasi HR Director sebelum saldo karyawan direkonsiliasi.
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
                        Tolak
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search, Filter & Calendar Controls Toolbar */}
            <div className="permit-toolbar">
              <div className="permit-search">
                <MagnifyingGlass size={17} className="text-secondary flex-shrink-0" weight="bold" />
                <input
                  type="search"
                  aria-label="Cari hari libur atau cuti bersama"
                  placeholder="Cari tanggal atau nama hari libur..."
                  value={p.holidaySearch}
                  onChange={(e) => p.setHolidaySearch(e.target.value)}
                />
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <select
                  className="form-select"
                  aria-label="Filter tipe hari libur"
                  value={p.holidayTypeFilter}
                  onChange={(e) => p.setHolidayTypeFilter(e.target.value)}
                  style={{ width: '210px' }}
                >
                  <option value="all">Semua Jenis Libur</option>
                  <option value="national_holiday">Libur Nasional Resmi</option>
                  <option value="cuti_bersama">Cuti Bersama Pemerintah</option>
                </select>

                {/* Calendar Navigation Controls (Active in Calendar View) */}
                {p.holidayViewMode === 'calendar' && (
                  <div className="d-flex align-items-center gap-1.5 ms-lg-2">
                    <button
                      type="button"
                      className="permit-cal-btn-nav"
                      onClick={handlePrevMonth}
                      title="Bulan sebelumnya"
                      aria-label="Bulan sebelumnya"
                    >
                      <CaretLeft size={16} weight="bold" />
                    </button>

                    <div className="d-flex align-items-center gap-1">
                      <select
                        className="form-select form-select-sm"
                        style={{ width: '120px', fontWeight: 600 }}
                        value={calMonth}
                        onChange={(e) => p.setHolidayCalendarDate(new Date(calYear, Number(e.target.value), 1))}
                        aria-label="Pilih Bulan"
                      >
                        {MONTH_NAMES.map((mName, idx) => (
                          <option key={mName} value={idx}>{mName}</option>
                        ))}
                      </select>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: '85px', fontWeight: 600 }}
                        value={calYear}
                        onChange={(e) => p.setHolidayCalendarDate(new Date(Number(e.target.value), calMonth, 1))}
                        aria-label="Pilih Tahun"
                      >
                        {[2025, 2026, 2027].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      className="permit-cal-btn-nav"
                      onClick={handleNextMonth}
                      title="Bulan berikutnya"
                      aria-label="Bulan berikutnya"
                    >
                      <CaretRight size={16} weight="bold" />
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-2 py-1"
                      style={{ fontSize: '12px', fontWeight: 600 }}
                      onClick={() => p.setHolidayCalendarDate(new Date(2026, 0, 1))}
                      title="Kembali ke Januari 2026"
                    >
                      Jan 2026
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* VIEW 1: CALENDAR VIEW */}
            {p.holidayViewMode === 'calendar' && (
              <div className="permit-cal-body">
                <div className="permit-cal-grid-frame">
                  {/* Weekday Row Header (Sen - Min) */}
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
                      const dayHolidays = p.filteredHolidays.filter((h) => h.date === cell.dateStr);
                      const isToday = cell.dateStr === todayStr;
                      const isPast = cell.dateStr < todayStr;
                      const hasHoliday = dayHolidays.length > 0;

                      return (
                        <div
                          key={cell.dateStr}
                          className={`permit-cal-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isWeekend ? 'weekend' : ''} ${isToday ? 'is-today' : ''} ${isPast ? 'is-past-day' : ''} ${hasHoliday ? 'has-holiday' : ''}`}
                          onClick={() => {
                            // Only allow adding on today or future dates when empty
                            if (!hasHoliday && !isPast) {
                              p.openNewHoliday(cell.dateStr);
                            }
                          }}
                        >
                          <div className="permit-cal-day-top">
                            <span className="permit-cal-day-num">{cell.day}</span>
                            {cell.isCurrentMonth && !isPast && (
                              <button
                                type="button"
                                className="permit-cal-cell-add-btn"
                                title={`Tambah libur pada ${cell.dateStr}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  p.openNewHoliday(cell.dateStr);
                                }}
                              >
                                <Plus size={11} weight="bold" />
                                <span>Tambah</span>
                              </button>
                            )}
                          </div>

                          {/* Events in this day */}
                          <div className="permit-cal-events-list">
                            {dayHolidays.map((holiday) => {
                              const isCuti = Boolean(holiday.isCutiBersama);
                              const isDeduct = holiday.treatment === 'deduct_annual';
                              const chipClass = isCuti
                                ? (isDeduct ? 'cuti-deduct' : 'cuti-free')
                                : 'national';

                              return (
                                <div
                                  key={holiday.id}
                                  className={`permit-cal-event-chip ${chipClass}`}
                                  title={`Klik untuk ubah: ${holiday.name} (${holiday.date})`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    p.openHolidayEditor(holiday);
                                  }}
                                >
                                  <div className="permit-cal-event-chip-header">
                                    {isCuti ? (
                                      <>
                                        <CalendarStar size={12} weight="fill" />
                                        <span>Cuti Bersama</span>
                                      </>
                                    ) : (
                                      <>
                                        <CalendarBlank size={12} weight="fill" />
                                        <span>Libur Nasional</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="permit-cal-event-chip-title">
                                    {holiday.name}
                                  </div>
                                  {isCuti && (
                                    <div className="permit-cal-event-chip-sub">
                                      {isDeduct ? '• Potong Cuti Tahunan' : '• Tidak Potong Cuti (Free)'}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calendar Legend Bar */}
                <div className="permit-cal-legend-bar">
                  <div className="permit-cal-legend-items">
                    <span className="fw-bold text-dark">Legenda:</span>
                    <div className="permit-cal-legend-item">
                      <span className="permit-cal-legend-dot national" />
                      <span>Libur Nasional Resmi</span>
                    </div>
                    <div className="permit-cal-legend-item">
                      <span className="permit-cal-legend-dot cuti-deduct" />
                      <span>Cuti Bersama (Potong Cuti Tahunan)</span>
                    </div>
                    <div className="permit-cal-legend-item">
                      <span className="permit-cal-legend-dot cuti-free" />
                      <span>Cuti Bersama (Tidak Potong Cuti / Bebas)</span>
                    </div>
                  </div>
                  <div className="text-muted small">
                    <Info size={14} className="me-1 text-primary" weight="bold" />
                    Klik tanggal kalender untuk menambah atau mengubah hari libur / cuti bersama.
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: TABLE VIEW */}
            {p.holidayViewMode === 'table' && (
              <div className="table-responsive">
                <table className="permit-table">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: '18%' }}>Tanggal (2026)</th>
                      <th scope="col" style={{ width: '38%' }}>Keterangan Libur Resmi</th>
                      <th scope="col" style={{ width: '18%' }}>Klasifikasi SKB</th>
                      <th scope="col" style={{ width: '16%' }}>Perlakuan Perusahaan</th>
                      <th scope="col" className="text-end" style={{ width: '10%' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.filteredHolidays.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted">
                          <CalendarBlank size={32} className="mb-2 text-secondary" />
                          <p className="mb-0">Tidak ada hari libur yang cocok dengan pencarian.</p>
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
                                {new Date(holiday.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long' })}
                              </div>
                            </td>

                            <td>
                              <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>
                                {holiday.name}
                              </div>
                              {holiday.note && (
                                <p className="text-muted small mb-0 mt-1">{holiday.note}</p>
                              )}
                            </td>

                            <td>
                              {holiday.isCutiBersama ? (
                                <span className="holiday-type-badge cuti">
                                  <CalendarStar size={14} weight="bold" />
                                  <span>Cuti Bersama</span>
                                </span>
                              ) : (
                                <span className="holiday-type-badge national">
                                  <CalendarBlank size={14} weight="bold" />
                                  <span>Libur Nasional</span>
                                </span>
                              )}
                            </td>

                            <td>
                              {holiday.isCutiBersama ? (
                                <span
                                  className="treatment-pill"
                                  style={{ backgroundColor: treatmentObj.bg, color: treatmentObj.color, border: `1px solid ${treatmentObj.color}33` }}
                                >
                                  {treatmentObj.badge}
                                </span>
                              ) : (
                                <span className="text-muted small">Libur Resmi (Tanpa Potong Cuti)</span>
                              )}
                              {holiday.pendingAmendment && (
                                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '10px' }}>
                                  Revisi Lampau Pending
                                </span>
                              )}
                            </td>

                            <td>
                              <div className="d-flex justify-content-end gap-1.5">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                  style={{ fontSize: '12px', padding: '4px 9px', borderColor: '#002B7F', color: '#002B7F', fontWeight: 600 }}
                                  onClick={() => p.openHolidayEditor(holiday)}
                                  title="Ubah hari libur atau cuti bersama ini"
                                >
                                  <PencilSimple size={13} weight="bold" />
                                  <span>Ubah</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center p-1 px-1.5"
                                  style={{ fontSize: '12px' }}
                                  onClick={() => {
                                    if (window.confirm(`Hapus “${holiday.name}” (${holiday.date}) dari kalender?`)) {
                                      p.deleteHoliday(holiday.id);
                                    }
                                  }}
                                  title="Hapus tanggal libur ini"
                                  aria-label={`Hapus ${holiday.name}`}
                                >
                                  <Trash size={14} weight="bold" />
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
            )}
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 3: BALANCES, LEDGER & ADJUSTMENTS
         ========================================================================= */}
      {p.activeTab === 'balances' && (
        <div className="permit-table-card">
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm ${balanceSubView === 'directory' ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{
                  backgroundColor: balanceSubView === 'directory' ? '#002B7F' : 'transparent',
                  borderColor: balanceSubView === 'directory' ? '#002B7F' : '#cbd5e1',
                  color: balanceSubView === 'directory' ? '#ffffff' : '#475569',
                  fontWeight: 600
                }}
                onClick={() => setBalanceSubView('directory')}
              >
                Direktori Saldo Karyawan ({p.balances.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${balanceSubView === 'adjustments' ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{
                  backgroundColor: balanceSubView === 'adjustments' ? '#002B7F' : 'transparent',
                  borderColor: balanceSubView === 'adjustments' ? '#002B7F' : '#cbd5e1',
                  color: balanceSubView === 'adjustments' ? '#ffffff' : '#475569',
                  fontWeight: 600
                }}
                onClick={() => setBalanceSubView('adjustments')}
              >
                Pengajuan Koreksi Saldo ({p.adjustments.length})
                {pendingAdjustmentsCount > 0 && (
                  <span className="badge bg-warning text-dark ms-2">{pendingAdjustmentsCount} Pending</span>
                )}
              </button>
            </div>
          </div>

          {balanceSubView === 'directory' && (
            <>
              <div className="permit-toolbar">
                <div className="permit-search">
                  <MagnifyingGlass size={17} className="text-secondary flex-shrink-0" weight="bold" />
                  <input
                    type="search"
                    aria-label="Cari karyawan berdasarkan nama atau NIK"
                    placeholder="Cari nama karyawan atau NIK..."
                    value={p.balanceSearch}
                    onChange={(e) => p.setBalanceSearch(e.target.value)}
                  />
                </div>

                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select"
                    aria-label="Filter departemen"
                    value={p.balanceDeptFilter}
                    onChange={(e) => p.setBalanceDeptFilter(e.target.value)}
                    style={{ width: '220px' }}
                  >
                    <option value="all">Semua Departemen</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="permit-table">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: '28%' }}>Karyawan</th>
                      <th scope="col" style={{ width: '12%' }}>Jatah Dasar</th>
                      <th scope="col" style={{ width: '12%' }}>Carry-Over</th>
                      <th scope="col" style={{ width: '12%' }}>Terpakai</th>
                      <th scope="col" style={{ width: '12%' }}>Potong CB</th>
                      <th scope="col" style={{ width: '12%' }}>Saldo Tersedia</th>
                      <th scope="col" className="text-end" style={{ width: '12%' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.filteredBalances.map((item) => {
                      const dept = DEPARTMENTS.find(d => d.id === item.departmentId);
                      const isAvailLow = item.available <= 3 && item.available >= 0;
                      const isAvailNeg = item.available < 0;

                      return (
                        <tr key={item.employeeId}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <img
                                src={item.avatar}
                                alt={item.employeeName}
                                className="emp-balance-avatar"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                                }}
                              />
                              <div>
                                <strong className="text-dark" style={{ fontSize: '13.5px' }}>
                                  {item.employeeName}
                                </strong>
                                <span className="text-muted small d-block">
                                  {item.nik} &bull; {dept?.name || item.position}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <strong>{item.baseEntitlement}</strong>
                            <span className="text-muted"> hr</span>
                          </td>

                          <td>
                            {item.carryOver > 0 ? (
                              <span className="text-success fw-bold">+{item.carryOver} hr</span>
                            ) : (
                              <span className="text-muted">0 hr</span>
                            )}
                            <div className="permit-cell-note">s/d 31 Mar</div>
                          </td>

                          <td>
                            <span className="text-danger fw-semibold">-{item.usedLeave} hr</span>
                          </td>

                          <td>
                            <span className="text-primary fw-semibold">-{item.cutiBersamaDeduction} hr</span>
                          </td>

                          <td>
                            <div
                              className={`balance-num-pill ${isAvailNeg ? 'avail-negative' : (isAvailLow ? 'avail-low' : 'avail-high')}`}
                            >
                              <span>{item.available}</span>
                              <small style={{ fontSize: '11px', fontWeight: 600 }}>Hari</small>
                            </div>
                          </td>

                          <td>
                            <div className="d-flex gap-2 justify-content-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                                style={{ fontSize: '11.5px', padding: '4px 8px' }}
                                onClick={() => p.openLedgerModal(item)}
                                title="Lihat Riwayat Mutasi Saldo Lengkap"
                              >
                                <Clock size={13} weight="bold" />
                                <span>Mutasi</span>
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                style={{ fontSize: '11.5px', padding: '4px 8px', borderColor: '#002B7F', color: '#002B7F' }}
                                onClick={() => p.openAdjustmentModal(item)}
                                title="Ajukan Koreksi Saldo Manual"
                              >
                                <Scales size={13} weight="bold" />
                                <span>Koreksi</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {balanceSubView === 'adjustments' && (
            <div className="table-responsive">
              <table className="permit-table">
                <thead>
                  <tr>
                    <th scope="col">ID Tiket & Tanggal</th>
                    <th scope="col">Karyawan</th>
                    <th scope="col">Kategori & Alasan</th>
                    <th scope="col">Simulasi Saldo</th>
                    <th scope="col">Status Review</th>
                    <th scope="col" className="text-end">Otorisasi</th>
                  </tr>
                </thead>
                <tbody>
                  {p.adjustments.map((ticket) => {
                    const isPending = ticket.status === 'pending';
                    const isApproved = ticket.status === 'approved';

                    return (
                      <tr key={ticket.id}>
                        <td>
                          <strong>{ticket.id.toUpperCase()}</strong>
                          <div className="permit-cell-note">{ticket.requestedAt}</div>
                        </td>

                        <td>
                          <div className="fw-bold text-dark">{ticket.employeeName}</div>
                          <span className="text-muted small">Oleh: {ticket.requestedBy}</span>
                        </td>

                        <td>
                          <span className="badge bg-light text-dark border mb-1" style={{ fontSize: '11px' }}>
                            {ticket.reasonCategoryLabel}
                          </span>
                          <p className="text-muted small mb-0">{ticket.reasonNote}</p>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="text-muted">{ticket.beforeBalance} hr</span>
                            <span className="fw-bold text-primary">
                              &rarr; {ticket.type === 'add' ? `+${ticket.amount}` : `-${ticket.amount}`} &rarr;
                            </span>
                            <strong className="text-dark">{ticket.afterBalance} hr</strong>
                          </div>
                        </td>

                        <td>
                          {isPending && (
                            <span className="badge bg-warning text-dark px-2 py-1">
                              Menunggu {ticket.approverRole}
                            </span>
                          )}
                          {isApproved && (
                            <span className="badge bg-success px-2 py-1">
                              Disetujui
                            </span>
                          )}
                          {ticket.status === 'rejected' && (
                            <span className="badge bg-danger px-2 py-1">
                              Ditolak
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="d-flex justify-content-end gap-2">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success py-1 px-2"
                                  style={{ fontSize: '11.5px', fontWeight: 600 }}
                                  onClick={() => p.approveAdjustmentTicket(ticket.id)}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger py-1 px-2"
                                  style={{ fontSize: '11.5px', fontWeight: 600 }}
                                  onClick={() => p.rejectAdjustmentTicket(ticket.id)}
                                >
                                  Tolak
                                </button>
                              </>
                            ) : (
                              <span className="text-muted small">{ticket.reviewedAt || 'Telah diproses'}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
                const entitlement = isAnnualDraft
                  ? draft.quota ? `${draft.quota} days / year` : null
                  : draft.category === 'special'
                    ? draft.eventDurationDays ? `${draft.eventDurationDays} days / event` : null
                    : draft.category === 'unpaid' ? 'No annual balance' : null;
                const requestDates = draft.allowedDates === 'past' ? 'Past dates only'
                  : draft.allowedDates === 'future' ? 'Future dates only' : 'Past & future dates';
                const facts = [
                  { label: 'Entitlement', value: entitlement || 'Not set yet', muted: !entitlement },
                  { label: 'Request dates', value: requestDates }
                ];
                if (isAnnualDraft) {
                  facts.push(
                    { label: 'New-hire prorata', value: draft.isProrated ? 'On' : 'Off' },
                    { label: 'Negative balance', value: draft.allowNegativeBalance ? `Up to ${draft.maxNegativeDays || '—'} days` : 'Not allowed' },
                    {
                      label: 'Carry-over',
                      value: draft.allowCarryOver
                        ? `Up to ${draft.maxCarryOverDays || '—'} days, ${draft.carryOverExpiryMonths || '—'} ${Number(draft.carryOverExpiryMonths) === 1 ? 'month' : 'months'}`
                        : 'None'
                    }
                  );
                } else if (catInfo) {
                  facts.push({ label: 'Annual balance', value: 'Not deducted' });
                }
                return (
                  <section className="permit-summary-panel" aria-label="Leave type summary" aria-live="polite">
                    <header className="permit-summary-head">
                      <span className="permit-summary-eyebrow">Summary</span>
                      <div className="permit-summary-title-row">
                        <span
                          className="permit-summary-icon"
                          style={catInfo ? { color: catInfo.badgeColor, backgroundColor: catInfo.bg } : undefined}
                        >
                          <CalendarBlank size={20} weight="bold" aria-hidden="true" />
                        </span>
                        <h3 className={draft.name.trim() ? '' : 'is-placeholder'}>
                          {draft.name.trim() || 'Leave type name'}
                        </h3>
                        {catInfo ? (
                          <span className="permit-category-pill" style={{ color: catInfo.badgeColor, backgroundColor: catInfo.bg }}>
                            {catInfo.label}
                          </span>
                        ) : (
                          <span className="permit-summary-pending">Choose a category</span>
                        )}
                      </div>
                    </header>
                    <dl className="permit-summary-facts">
                      {facts.map((fact) => (
                        <div key={fact.label} className="permit-summary-fact">
                          <dt>{fact.label}</dt>
                          <dd className={fact.muted ? 'is-muted' : ''}>{fact.value}</dd>
                        </div>
                      ))}
                    </dl>
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
                ? `Ubah Cuti Bersama: ${p.holidayDraft.name || 'Agenda Cuti'}`
                : `Ubah Libur Nasional: ${p.holidayDraft.name || 'Libur Nasional'}`)
              : 'Tambah Libur Nasional / Cuti Bersama'
          }
          description={
            p.editingHoliday
              ? `Konfigurasi tanggal ${p.holidayDraft.date || ''}, jenis libur, dan perlakuan cuti perusahaan.`
              : 'Daftarkan tanggal libur nasional atau cuti bersama baru ke dalam kalender kerja.'
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

            {/* Row 1: Tanggal & Nama Agenda */}
            <div className="row g-3 mb-3">
              <div className="col-md-5">
                <label className="form-label small fw-bold">
                  Tanggal Libur <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${!p.editingHoliday && p.holidayDraft.date && p.holidayDraft.date < p.todayIso ? 'is-invalid' : ''}`}
                  value={p.holidayDraft.date}
                  onChange={(e) => p.setHolidayDraft({ ...p.holidayDraft, date: e.target.value })}
                  min={!p.editingHoliday ? p.todayIso : undefined}
                  required
                />
                {p.holidayDraft.date && (
                  <div className="text-muted mt-1" style={{ fontSize: '11.5px' }}>
                    {new Date(p.holidayDraft.date + 'T00:00:00').toLocaleDateString('id-ID', {
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
                    Hari libur baru hanya bisa ditambahkan untuk tanggal hari ini atau ke depan ({p.todayIso}).
                  </div>
                )}
              </div>

              <div className="col-md-7">
                <label className="form-label small fw-bold">
                  Keterangan / Nama Hari Libur <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: Tahun Baru Imlek 2577 Kongzili"
                  value={p.holidayDraft.name}
                  onChange={(e) => p.setHolidayDraft({ ...p.holidayDraft, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 2: Klasifikasi Libur (Radio Cards) */}
            <div className="mb-3">
              <label className="form-label small fw-bold d-block mb-2">
                Klasifikasi Hari Libur <span className="text-danger">*</span>
              </label>
              <div className="permit-class-cards-grid">
                {/* Option 1: Libur Nasional Resmi */}
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
                    <h4>Libur Nasional Resmi</h4>
                    <p>
                      Hari libur resmi SKB 3 Menteri. Seluruh karyawan libur resmi tanpa memotong saldo cuti tahunan.
                    </p>
                  </div>
                </div>

                {/* Option 2: Cuti Bersama Pemerintah */}
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
                    <h4>Cuti Bersama Pemerintah</h4>
                    <p>
                      Cuti bersama yang dapat disesuaikan perlakuan pemotongan saldo cuti tahunan dan unit kerja yang berlaku.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional Section: Cuti Bersama Policies */}
            {p.holidayDraft.isCutiBersama && (
              <div className="p-3 bg-light rounded border mb-3">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Penerapan Kebijakan Perusahaan</label>
                  <select
                    className="form-select"
                    value={p.holidayDraft.treatment || 'deduct_annual'}
                    onChange={(e) => p.setHolidayDraft({ ...p.holidayDraft, treatment: e.target.value })}
                  >
                    {TREATMENT_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <div className="form-text small text-muted mt-1.5 d-flex align-items-center gap-1">
                    <Info size={14} className="text-primary flex-shrink-0" weight="bold" />
                    <span>Otomatis berlaku untuk seluruh divisi &amp; karyawan. Pengaturan operasional shift/on-duty spesifik dapat diatur di modul <strong>Work Schedule</strong>.</span>
                  </div>
                </div>

                {/* Live Impact Preview Box */}
                <div className="impact-preview-box">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Info size={18} weight="bold" color="#166534" />
                    <strong className="text-success small text-uppercase">Pratinjau Dampak Langsung (Live Impact Preview)</strong>
                  </div>

                  <div className="impact-stat-row">
                    <div className="impact-stat-item">
                      <strong>{p.currentHolidayImpact.affectedEmployeesCount} Staf</strong>
                      <small>Seluruh Karyawan Terdampak</small>
                    </div>
                    <div className="impact-stat-item">
                      <strong>{p.currentHolidayImpact.totalDaysDeducted} Hari</strong>
                      <small>Total Saldo Tahunan Dipotong</small>
                    </div>
                  </div>

                  {p.currentHolidayImpact.affectedDeptNames.length > 0 && (
                    <div className="small text-muted mt-2">
                      <span>Divisi yang terdampak: </span>
                      <strong className="text-dark">Seluruh Departemen ({p.currentHolidayImpact.affectedDeptNames.join(', ')})</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Past Amendment Warning & Reason */}
            {p.isHolidayInPast && p.holidayDraft.isCutiBersama && (
              <div className="alert alert-warning py-2 px-3 small mb-3">
                <div className="d-flex align-items-center gap-2 mb-1 text-warning-emphasis fw-bold">
                  <WarningCircle size={18} weight="fill" color="#d97706" />
                  <span>Peringatan Tanggal Lampau</span>
                </div>
                <p className="mb-2">
                  Tanggal cuti bersama ini telah berlalu. Revisi akan dikirim ke HR Director untuk persetujuan audit sebelum rekonsiliasi saldo.
                </p>
                <label className="form-label small fw-bold text-danger">
                  Alasan Revisi Tanggal Lampau (Wajib untuk Otorisasi Audit) <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Jelaskan dasar pertimbangan perubahan kebijakan cuti bersama tanggal lampau..."
                  value={p.pastAmendmentReason}
                  onChange={(e) => p.setPastAmendmentReason(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Row 4: Catatan Opsional */}
            <div>
              <label className="form-label small fw-bold">
                Catatan / Keterangan Dokumen <span className="permit-optional">Opsional</span>
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Contoh: SKB 3 Menteri No. 1017/2025, Surat Edaran Direksi, dll."
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
                    if (window.confirm(`Hapus “${p.holidayDraft.name}” (${p.holidayDraft.date}) dari kalender?`)) {
                      p.deleteHoliday(p.holidayDraft.id);
                    }
                  }}
                >
                  <Trash size={15} weight="bold" />
                  <span>Hapus Tanggal</span>
                </button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary px-3 py-1.5"
                onClick={p.closeHolidayEditor}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary px-3 py-1.5"
                style={{ backgroundColor: '#002B7F', borderColor: '#002B7F' }}
                onClick={p.saveHolidayPolicy}
                disabled={!p.editingHoliday && Boolean(p.holidayDraft?.date && p.holidayDraft.date < p.todayIso)}
              >
                {p.isHolidayInPast && p.holidayDraft.isCutiBersama
                  ? 'Kirim untuk Persetujuan HR Director'
                  : 'Simpan Hari Libur'}
              </button>
            </div>
          </div>
        </PermitDialog>
      )}

      {/* =========================================================================
          MODAL 3: EMPLOYEE LEAVE LEDGER DRAWER (DETAIL MUTASI SALDO)
         ========================================================================= */}
      {p.selectedLedgerEmp && (
        <PermitDialog
          title={`Rincian Mutasi Saldo: ${p.selectedLedgerEmp.employeeName}`}
          description={`NIK: ${p.selectedLedgerEmp.nik} • Saldo Tersedia: ${p.selectedLedgerEmp.available} Hari`}
          onClose={p.closeLedgerModal}
          maxWidthClass="modal-ledger"
        >
          <div className="permit-form-body">
            <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded border mb-3">
              <div>
                <small className="text-muted d-block">Jatah Tahunan</small>
                <strong>{p.selectedLedgerEmp.baseEntitlement} Hari</strong>
              </div>
              <div>
                <small className="text-muted d-block">Carry-Over</small>
                <strong className="text-success">+{p.selectedLedgerEmp.carryOver} Hari</strong>
              </div>
              <div>
                <small className="text-muted d-block">Cuti Terpakai</small>
                <strong className="text-danger">-{p.selectedLedgerEmp.usedLeave} Hari</strong>
              </div>
              <div>
                <small className="text-muted d-block">Potong Cuti Bersama</small>
                <strong className="text-primary">-{p.selectedLedgerEmp.cutiBersamaDeduction} Hari</strong>
              </div>
              <div className="border-start ps-3">
                <small className="text-muted d-block">Saldo Tersedia</small>
                <strong className="h5 text-success mb-0">{p.selectedLedgerEmp.available} Hari</strong>
              </div>
            </div>

            <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '13px', textTransform: 'uppercase' }}>
              Riwayat Transaksi & Mutasi Saldo (Audit Trail)
            </h6>

            <div className="ledger-timeline-list">
              {(p.selectedLedgerEmp.ledger || []).map((entry) => {
                const isCredit = entry.amount > 0;
                return (
                  <div key={entry.id} className="ledger-entry-card">
                    <div className="ledger-entry-left">
                      <div className={`ledger-entry-icon ${isCredit ? 'credit' : 'debit'}`}>
                        {isCredit ? <TrendUp size={20} weight="bold" /> : <TrendDown size={20} weight="bold" />}
                      </div>
                      <div>
                        <strong className="text-dark" style={{ fontSize: '13.5px' }}>
                          {entry.description}
                        </strong>
                        <div className="text-muted small mt-1">
                          {entry.date} &bull; Ref: <span className="font-monospace text-dark">{entry.refNo}</span> &bull; Disetujui: {entry.approvedBy}
                        </div>
                      </div>
                    </div>

                    <div className="ledger-entry-amount">
                      <strong className={isCredit ? 'credit' : 'debit'}>
                        {isCredit ? `+${entry.amount}` : entry.amount} Hari
                      </strong>
                      <small className="text-muted d-block">Saldo Akhir: {entry.balanceAfter} hr</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="permit-dialog-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={p.closeLedgerModal}>
              Tutup Rincian
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ backgroundColor: '#002B7F', borderColor: '#002B7F' }}
              onClick={() => {
                const target = p.selectedLedgerEmp;
                p.closeLedgerModal();
                p.openAdjustmentModal(target);
              }}
            >
              Ajukan Koreksi Saldo
            </button>
          </div>
        </PermitDialog>
      )}

      {/* =========================================================================
          MODAL 4: MANUAL BALANCE ADJUSTMENT WITH BEFORE/AFTER SIMULATION
         ========================================================================= */}
      {p.adjustmentTarget && (
        <PermitDialog
          title={`Koreksi Saldo: ${p.adjustmentTarget.employeeName}`}
          description={`NIK: ${p.adjustmentTarget.nik} • Saldo Saat Ini: ${p.adjustmentTarget.available} Hari`}
          onClose={p.closeAdjustmentModal}
          maxWidthClass="modal-wide"
        >
          <div className="permit-form-body">
            {p.error && (
              <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                <WarningCircle size={16} weight="bold" />
                <span>{p.error}</span>
              </div>
            )}

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">Arah Penyesuaian Saldo</label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`btn w-50 py-2 d-flex align-items-center justify-content-center gap-1 ${p.adjDraft.type === 'add' ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => p.setAdjDraft({ ...p.adjDraft, type: 'add' })}
                  >
                    <TrendUp size={16} weight="bold" />
                    <span>Tambah (+)</span>
                  </button>
                  <button
                    type="button"
                    className={`btn w-50 py-2 d-flex align-items-center justify-content-center gap-1 ${p.adjDraft.type === 'deduct' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => p.setAdjDraft({ ...p.adjDraft, type: 'deduct' })}
                  >
                    <TrendDown size={16} weight="bold" />
                    <span>Kurang (-)</span>
                  </button>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Jumlah Hari Koreksi <span className="text-danger">*</span></label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="form-control"
                  value={p.adjDraft.amount}
                  onChange={(e) => p.setAdjDraft({ ...p.adjDraft, amount: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">Kategori Alasan Koreksi</label>
                <select
                  className="form-select"
                  value={p.adjDraft.reasonCategory}
                  onChange={(e) => p.setAdjDraft({ ...p.adjDraft, reasonCategory: e.target.value })}
                >
                  {ADJUSTMENT_REASON_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">Catatan Detail Alasan (Wajib Audit) <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Jelaskan nomor tiket sengketa, memo persetujuan, atau justifikasi koreksi..."
                  value={p.adjDraft.reasonNote}
                  onChange={(e) => p.setAdjDraft({ ...p.adjDraft, reasonNote: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* LIVE SIMULATION: BEFORE VS AFTER CARD */}
            <div className="balance-sim-card">
              <label className="form-label small fw-bold text-muted mb-2 text-uppercase">
                Simulasi Saldo Sebelum vs Sesudah (Live Simulation)
              </label>

              <div className="balance-sim-row">
                <div className="balance-sim-node">
                  <label>Saldo Sebelum</label>
                  <strong>{p.adjustmentTarget.available} Hari</strong>
                </div>

                <div className="text-center px-2">
                  <span
                    className={`badge ${p.adjDraft.type === 'add' ? 'bg-success' : 'bg-danger'} p-2`}
                    style={{ fontSize: '13px' }}
                  >
                    {p.adjDraft.type === 'add' ? `+${p.adjDraft.amount}` : `-${p.adjDraft.amount}`} Hari
                  </span>
                </div>

                <div className="balance-sim-node after-node">
                  <label>Saldo Baru Setelah Koreksi</label>
                  <strong>{p.simulatedBalance} Hari</strong>
                </div>
              </div>

              <div className="small text-muted mt-3 d-flex align-items-center gap-1">
                <Info size={14} weight="bold" />
                <span>
                  Kewenangan persetujuan: <strong>{Number(p.adjDraft.amount) > 2 || p.simulatedBalance < 0 ? 'HR Director' : 'HR Manager'}</strong>. Saldo baru akan efektif setelah tiket disetujui.
                </span>
              </div>
            </div>
          </div>

          <div className="permit-dialog-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={p.closeAdjustmentModal}>
              Batal
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ backgroundColor: '#002B7F', borderColor: '#002B7F' }}
              onClick={p.submitAdjustmentRequest}
            >
              Kirim Tiket untuk Persetujuan
            </button>
          </div>
        </PermitDialog>
      )}

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
            <button type="button" className="btn btn-outline-secondary" onClick={p.closeStatusModal}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${p.statusTarget.isActive !== false ? 'btn-danger' : 'btn-success'}`}
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
            <span>Detail Kebijakan</span>
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
            <span>Ubah Kebijakan</span>
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
                <span>Nonaktifkan</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} weight="bold" />
                <span>Aktifkan</span>
              </>
            )}
          </button>
        </div>,
        document.body
      )}
    </section>
  );
}
