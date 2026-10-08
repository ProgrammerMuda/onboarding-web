import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  PencilSimple, 
  Trash, 
  MagnifyingGlass, 
  Clock, 
  Sun, 
  SunDim, 
  CloudSun, 
  MoonStars, 
  ClockAfternoon, 
  Briefcase, 
  CheckCircle, 
  Check, 
  X, 
  CaretLeft, 
  CaretRight, 
  CaretDown,
  BuildingApartment, 
  UsersThree, 
  Timer, 
  ArrowsCounterClockwise,
  ArrowClockwise
} from '@phosphor-icons/react';
import { 
  SHIFT_PERIODS, 
  SHIFT_DEPARTMENTS, 
  PRESET_SHIFT_COLORS, 
  isOvernightShift,
  calculateWorkHours 
} from '../../models/ShiftTypeModel';
import './shift-type.css';

// Period Icon mapping helper
function getPeriodIcon(periodValue, size = 14) {
  switch (periodValue) {
    case 'pagi': return <Sun size={size} weight="bold" />;
    case 'siang': return <SunDim size={size} weight="bold" />;
    case 'sore': return <CloudSun size={size} weight="bold" />;
    case 'malam': return <MoonStars size={size} weight="bold" />;
    default: return <Clock size={size} weight="bold" />;
  }
}

// Department Multiple Select Dropdown Component
function DepartmentDropdownSelect({ selectedCodes = [], onToggle, onSelectAll, onClearAll }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="shift-multiselect-container" ref={containerRef}>
      <div 
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`shift-multiselect-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
      >
        <div className="d-flex flex-wrap align-items-center gap-1.5 flex-grow-1" style={{ minHeight: '26px' }}>
          {selectedCodes.length === 0 ? (
            <span className="text-muted" style={{ fontSize: '13px' }}>
              Select applicable departments...
            </span>
          ) : (
            selectedCodes.map((code) => {
              const dept = SHIFT_DEPARTMENTS.find((d) => d.code === code);
              return (
                <span 
                  key={code} 
                  className="shift-multiselect-chip"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{dept ? dept.name : code}</span>
                  <button
                    type="button"
                    className="shift-multiselect-chip-remove"
                    aria-label={`Remove ${dept ? dept.name : code}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(code);
                    }}
                  >
                    <X size={12} weight="bold" />
                  </button>
                </span>
              );
            })
          )}
        </div>
        <CaretDown size={15} className={`text-muted flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} weight="bold" />
      </div>

      {isOpen && (
        <div className="shift-multiselect-menu" role="listbox">
          <div className="d-flex align-items-center justify-content-between px-2 py-1 mb-1.5 border-bottom small text-muted">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
              {selectedCodes.length} of {SHIFT_DEPARTMENTS.length} Selected
            </span>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none fw-semibold shadow-none border-0"
                style={{ fontSize: '0.75rem', color: '#002B7F' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAll();
                }}
              >
                Select All
              </button>
              <span className="text-muted">•</span>
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none text-danger fw-semibold shadow-none border-0"
                style={{ fontSize: '0.75rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAll();
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="d-flex flex-column gap-0.5">
            {SHIFT_DEPARTMENTS.map((dept) => {
              const isSelected = selectedCodes.includes(dept.code);
              return (
                <div
                  key={dept.code}
                  className={`shift-multiselect-item ${isSelected ? 'selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onToggle(dept.code)}
                >
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="checkbox"
                      className="form-check-input mt-0 shadow-none"
                      style={{ cursor: 'pointer' }}
                      checked={isSelected}
                      onChange={() => {}}
                    />
                    <span className="text-dark" style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400 }}>
                      {dept.name}
                    </span>
                  </div>
                  <span className="shift-dept-tag">
                    {dept.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Hex Color Picker Dropdown Popover
function HexColorPicker({ color, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const currentColor = color || '#002B7F';

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e) => {
    let val = e.target.value.trim();
    if (val && !val.startsWith('#')) {
      val = '#' + val;
    }
    onChange(val);
  };

  const handleSelectPreset = (preset) => {
    onChange(preset);
    setIsOpen(false);
  };

  return (
    <div className="position-relative" ref={containerRef}>
      <div className="shift-color-input-group">
        <button
          type="button"
          className="shift-color-swatch-btn p-0"
          style={{
            backgroundColor: currentColor,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)'
          }}
          onClick={() => setIsOpen((prev) => !prev)}
          title="Click to choose HEX color"
          aria-label="Pick color"
        />
        <input
          id="shift-color-hex"
          type="text"
          value={currentColor}
          onChange={handleTextChange}
          placeholder="#002B7F"
          maxLength={7}
          onClick={() => setIsOpen(true)}
          style={{ textTransform: 'uppercase' }}
        />
      </div>

      {isOpen && (
        <div className="shift-color-popover shadow-lg">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="fw-semibold text-muted" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>
              HEX PALETTE
            </span>
            <span className="badge bg-light text-dark font-monospace border" style={{ fontSize: '11px' }}>
              {currentColor.toUpperCase()}
            </span>
          </div>

          <div className="shift-color-grid mb-2.5">
            {PRESET_SHIFT_COLORS.map((preset) => {
              const isSelected = preset.toLowerCase() === currentColor.toLowerCase();
              return (
                <button
                  key={preset}
                  type="button"
                  className={`shift-color-grid-item ${isSelected ? 'selected' : ''}`}
                  style={{ backgroundColor: preset }}
                  onClick={() => handleSelectPreset(preset)}
                  title={preset}
                >
                  {isSelected && <Check size={14} weight="bold" color="#ffffff" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-top">
            <label className="text-muted d-block mb-1" style={{ fontSize: '11px' }}>
              Custom Hex Code
            </label>
            <div className="d-flex align-items-center gap-1.5">
              <span className="text-muted fw-bold font-monospace" style={{ fontSize: '13px' }}>#</span>
              <input
                type="text"
                className="form-control form-control-sm font-monospace text-uppercase shadow-none"
                placeholder="002B7F"
                maxLength={6}
                value={currentColor.replace('#', '')}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                  onChange('#' + raw);
                }}
                style={{ fontSize: '12px', height: '30px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dialog Modal Helper
function ShiftModal({ title, description, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog) dialog.showModal();
    return () => {
      if (dialog) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="shift-dialog border-0 shadow-lg p-0"
      aria-labelledby="shift-modal-title"
      onCancel={onClose}
    >
      <div className="shift-dialog-header">
        <div>
          <h2 id="shift-modal-title" className="h5 fw-bold text-dark mb-1">
            {title}
          </h2>
          {description && (
            <p className="text-muted small mb-0">{description}</p>
          )}
        </div>
        <button
          type="button"
          className="btn btn-link p-1 text-muted text-decoration-none d-flex align-items-center justify-content-center border-0 shadow-none"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} weight="bold" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

// Success Modal
function SuccessDialog({ title, subtext, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog) dialog.showModal();
    const timer = setTimeout(() => {
      onClose();
    }, 2800);
    return () => {
      clearTimeout(timer);
      if (dialog) dialog.close();
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="shift-dialog shift-success-dialog border-0 shadow-lg p-0"
      aria-labelledby="shift-success-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="position-relative p-4 p-md-5 text-center bg-white" style={{ borderRadius: '16px' }}>
        <button
          type="button"
          className="btn btn-link p-1 text-muted text-decoration-none position-absolute top-0 end-0 m-3 d-flex align-items-center justify-content-center border-0 shadow-none"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} weight="bold" />
        </button>

        {/* Solid filled check circle */}
        <div className="d-flex justify-content-center mb-3">
          <CheckCircle size={64} weight="fill" style={{ color: '#10B981' }} />
        </div>

        <h3 id="shift-success-title" className="fw-bold text-dark mb-2" style={{ fontSize: '1.25rem' }}>
          {title || 'Operation Successful!'}
        </h3>

        <p className="text-muted mx-auto mb-0" style={{ fontSize: '0.875rem', lineHeight: '1.55', maxWidth: '360px' }}>
          {subtext || 'The shift type settings have been successfully saved.'}
        </p>
      </div>
    </dialog>
  );
}

// Delete Confirmation Modal
function DeleteConfirmDialog({ shift, onConfirm, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog) dialog.showModal();
    return () => {
      if (dialog) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="shift-dialog shift-delete-dialog border-0 shadow-lg p-0"
      aria-labelledby="shift-delete-title"
      onCancel={onClose}
    >
      <div className="shift-dialog-header">
        <h2 id="shift-delete-title" className="h5 fw-bold text-danger mb-0">
          Delete Shift Type?
        </h2>
        <button
          type="button"
          className="btn btn-link p-1 text-muted text-decoration-none border-0 shadow-none"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} weight="bold" />
        </button>
      </div>
      <div className="shift-dialog-body">
        <p className="mb-2 text-dark">
          Are you sure you want to delete <strong>{shift.name}</strong> (Code: <code>{shift.code}</code>)?
        </p>
        <p className="text-muted small mb-0" style={{ lineHeight: '1.5' }}>
          This will remove the shift configuration from roster scheduling. Historical attendance records will remain preserved in audit logs.
        </p>
      </div>
      <div className="shift-dialog-footer">
        <button type="button" className="btn btn-light bg-white border shadow-none" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger text-white fw-semibold shadow-none border-0 px-3" onClick={onConfirm}>
          Delete Shift Type
        </button>
      </div>
    </dialog>
  );
}

export function ShiftTypeView({ presenter: p }) {
  const {
    paginatedShifts,
    filteredShifts,
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
    setQuery,
    setPeriodFilter,
    setDepartmentFilter,
    setCurrentPage,
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
  } = p;

  const pages = totalPages <= 5
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : currentPage <= 3 
      ? [1, 2, 3, '…', totalPages]
      : currentPage >= totalPages - 2 
        ? [1, '…', totalPages - 2, totalPages - 1, totalPages]
        : [1, '…', currentPage, '…', totalPages];

  const canSave = Boolean(
    draft &&
    draft.name && draft.name.trim().length >= 2 &&
    draft.code && draft.code.trim().length >= 1 &&
    draft.period &&
    draft.checkIn &&
    draft.checkOut &&
    Array.isArray(draft.departments) &&
    draft.departments.length > 0
  );

  return (
    <section className="shift-page">
      {/* 1. Header with Title & Add Shift Button */}
      <header className="shift-header d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="h3 fw-bold text-primary mb-1" style={{ letterSpacing: '-0.02em', color: '#002B7F' }}>
            List Shift Type
          </h1>
          <p className="text-muted small mb-0">
            Configure working hours, shift times, assigned departments, and shift color identifiers
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* + Add Shift Type CTA */}
          <button 
            type="button" 
            className="btn btn-primary d-flex align-items-center gap-2 shadow-none border-0 px-3.5"
            onClick={() => openEditor()}
          >
            <Plus size={18} weight="bold" />
            <span>Add Shift Type</span>
          </button>
        </div>
      </header>

      {/* Main Shift Table Card */}
      <div className="shift-table-card">
        {/* Toolbar: Search and Filters */}
        <div className="shift-toolbar flex-wrap gap-3">
          <div className="shift-search-box">
            <MagnifyingGlass size={16} className="text-secondary flex-shrink-0" weight="bold" />
            <input
              type="search"
              placeholder="Search shift name, code, or department..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search shift types"
            />
          </div>

          <div className="d-flex align-items-center gap-2.5 flex-wrap">
            {/* Shift Period Filter */}
            <select
              className="form-select form-select-sm shadow-none"
              style={{ width: '180px', borderRadius: '8px', fontSize: '0.825rem' }}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              aria-label="Filter by Shift Period"
            >
              <option value="all">All Shift Periods</option>
              {SHIFT_PERIODS.map((pOption) => (
                <option key={pOption.value} value={pOption.value}>
                  {pOption.label}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              className="form-select form-select-sm shadow-none"
              style={{ width: '180px', borderRadius: '8px', fontSize: '0.825rem' }}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              aria-label="Filter by Department"
            >
              <option value="all">All Departments</option>
              {SHIFT_DEPARTMENTS.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-responsive">
          <table className="shift-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: '55px' }}>NO</th>
                <th scope="col" style={{ width: '280px' }}>SHIFT NAME</th>
                <th scope="col" style={{ width: '110px' }}>SHIFT CODE</th>
                <th scope="col" style={{ width: '140px' }}>SHIFT PERIOD</th>
                <th scope="col" style={{ width: '190px' }}>CHECK IN / CHECK OUT</th>
                <th scope="col" style={{ width: '120px' }}>WORK HOUR</th>
                <th scope="col">APPLICABLE DEPARTMENTS</th>
                <th scope="col" style={{ width: '160px' }} className="text-end">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedShifts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="py-4">
                      <Clock size={36} className="text-muted mb-2 opacity-50" />
                      <div className="fw-semibold text-dark">No shift types found</div>
                      <div className="small text-muted">
                        {query || periodFilter !== 'all' || departmentFilter !== 'all'
                          ? 'Try changing your search criteria or clear filters.'
                          : 'Click + Add Shift Type to create your first operational schedule.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedShifts.map((shift, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const periodObj = SHIFT_PERIODS.find((pItem) => pItem.value === shift.period) || SHIFT_PERIODS[0];

                  return (
                    <tr key={shift.id}>
                      {/* No */}
                      <td className="text-muted small fw-semibold">
                        {rowNumber}
                      </td>

                      {/* Shift Name */}
                      <td>
                        <strong className="text-dark d-block" style={{ fontSize: '0.875rem' }}>
                          {shift.name}
                        </strong>
                      </td>

                      {/* Kode Type */}
                      <td>
                        <span className="fw-bold" style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
                          {shift.code}
                        </span>
                      </td>

                      {/* Period (Pagi / Siang / Sore / Malam) */}
                      <td>
                        <span 
                          className="shift-period-badge"
                          style={{
                            backgroundColor: periodObj.bg,
                            color: periodObj.color,
                            border: `1px solid ${periodObj.color}33`
                          }}
                        >
                          {getPeriodIcon(shift.period, 13)}
                          <span>{periodObj.label.split(' ')[0]}</span>
                        </span>
                      </td>

                      {/* Check In / Check Out */}
                      <td>
                        <div className="d-flex align-items-center gap-2 shift-time-cell">
                          <Clock size={19} weight="bold" className="text-secondary flex-shrink-0" />
                          <span>{shift.checkIn}:00</span>
                          <span className="text-muted">/</span>
                          <span>{shift.checkOut}:00</span>
                        </div>
                      </td>

                      {/* Work Hour */}
                      <td>
                        <span className="shift-hours-badge">
                          {shift.workHours} {Number(shift.workHours) === 1 ? 'Hour' : 'Hours'}
                        </span>
                      </td>

                      {/* Applicable Departments */}
                      <td>
                        <div className="d-flex flex-wrap align-items-center gap-1.5">
                          {(shift.departments || []).map((deptCode) => {
                            const deptObj = SHIFT_DEPARTMENTS.find((d) => d.code === deptCode);
                            return (
                              <span
                                key={deptCode}
                                className="shift-dept-tag"
                                title={deptObj ? `${deptObj.name} (${deptCode})` : deptCode}
                              >
                                {deptCode}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            type="button"
                            className="shift-icon-button btn-edit shadow-none"
                            aria-label={`Edit ${shift.name}`}
                            title="Edit shift type"
                            onClick={() => openEditor(shift)}
                          >
                            <PencilSimple size={18} weight="bold" />
                          </button>

                          <button
                            type="button"
                            className="shift-icon-button btn-delete shadow-none"
                            aria-label={`Delete ${shift.name}`}
                            title="Hapus shift type"
                            onClick={() => requestDelete(shift)}
                          >
                            <Trash size={18} weight="bold" />
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

        {/* Footer Pagination */}
        <div className="shift-table-footer d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            Showing <strong className="text-dark">{filteredShifts.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredShifts.length)}</strong> of <strong className="text-dark">{filteredShifts.length}</strong> shift types
          </div>

          {totalPages > 1 && (
            <nav className="d-flex align-items-center gap-1.5" aria-label="Shift table pagination">
              <button
                type="button"
                className="shift-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                aria-label="Previous page"
              >
                <CaretLeft size={15} weight="bold" />
              </button>

              {pages.map((pg, i) => pg === '…' ? (
                <span key={`ellipsis-${i}`} className="text-muted px-1">…</span>
              ) : (
                <button
                  key={pg}
                  type="button"
                  className={`shift-page-btn ${currentPage === pg ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pg)}
                >
                  {pg}
                </button>
              ))}

              <button
                type="button"
                className="shift-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                aria-label="Next page"
              >
                <CaretRight size={15} weight="bold" />
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* Modal: Add / Edit Shift Type */}
      {draft && (
        <ShiftModal
          title={draft.id ? 'Edit Shift Type' : 'Add Shift Type'}
          description="Configure shift times, working hours, applicable departments, and visual color."
          onClose={closeEditor}
        >
          <form onSubmit={(e) => { e.preventDefault(); save(); }}>
            <div className="shift-dialog-body">
              {error && (
                <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
                  {error}
                </div>
              )}

              {/* Shift Name & Shift Code */}
              <div className="row g-3 mb-3">
                <div className="col-8">
                  <label className="form-label" htmlFor="shift-name">
                    Shift Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="shift-name"
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Shift Pagi 1"
                    value={draft.name}
                    onChange={(e) => updateDraftField('name', e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="col-4">
                  <label className="form-label" htmlFor="shift-code">
                    Shift Code <span className="text-danger">*</span>
                  </label>
                  <input
                    id="shift-code"
                    type="text"
                    required
                    maxLength={10}
                    className="form-control font-monospace text-uppercase"
                    placeholder="e.g. P1, M1"
                    value={draft.code}
                    onChange={(e) => updateDraftField('code', e.target.value)}
                  />
                </div>
              </div>

              {/* Applicable Departments (Multi-Select Dropdown) */}
              <div className="mb-3">
                <label className="form-label d-block mb-1.5">
                  Applicable Departments <span className="text-danger">*</span>
                </label>
                <DepartmentDropdownSelect
                  selectedCodes={draft.departments || []}
                  onToggle={(deptCode) => toggleDraftDepartment(deptCode)}
                  onSelectAll={() => updateDraftField('departments', SHIFT_DEPARTMENTS.map((d) => d.code))}
                  onClearAll={() => updateDraftField('departments', [])}
                />
                <p className="text-muted mt-2 mb-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  This shift type will only be assigned and applicable to the selected departments.
                </p>
              </div>

              {/* Schedule Timing & Work Hours Card with Integrated Primary Footer */}
              <div className="rounded-3 border mb-3 overflow-hidden" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                <div className="p-3">
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label d-flex align-items-center gap-1.5" htmlFor="shift-in">
                        <Clock size={16} weight="bold" className="text-secondary" />
                        <span>Check In <span className="text-danger">*</span></span>
                      </label>
                      <input
                        id="shift-in"
                        type="time"
                        required
                        className="form-control bg-white"
                        value={draft.checkIn}
                        onChange={(e) => updateDraftField('checkIn', e.target.value)}
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label d-flex align-items-center gap-1.5" htmlFor="shift-out">
                        <Clock size={16} weight="bold" className="text-secondary" />
                        <span>Check Out <span className="text-danger">*</span></span>
                      </label>
                      <input
                        id="shift-out"
                        type="time"
                        required
                        className="form-control bg-white"
                        value={draft.checkOut}
                        onChange={(e) => updateDraftField('checkOut', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Integrated Primary Footer */}
                <div 
                  className="d-flex align-items-center justify-content-between p-3"
                  style={{
                    backgroundColor: '#EFF6FF',
                    borderTop: '1px solid #DBEAFE'
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <Timer size={18} weight="bold" className="text-dark" />
                    <span className="fw-semibold text-dark" style={{ fontSize: '0.875rem' }}>
                      Total Work Hours:
                    </span>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="fw-bold" style={{ color: '#002B7F', fontSize: '0.875rem' }}>
                      {calculateWorkHours(draft.checkIn, draft.checkOut)} {Number(calculateWorkHours(draft.checkIn, draft.checkOut)) === 1 ? 'Hour' : 'Hours'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shift Period & Shift Color (Placed below Check In / Check Out) */}
              <div className="row g-3 mb-1">
                <div className="col-6">
                  <label className="form-label" htmlFor="shift-period">
                    Shift Period <span className="text-muted small fw-normal">(Auto-detected)</span>
                  </label>
                  <input
                    id="shift-period"
                    type="text"
                    readOnly
                    disabled
                    className="form-control bg-light text-dark fw-medium"
                    style={{ cursor: 'not-allowed', opacity: 0.9 }}
                    value={SHIFT_PERIODS.find((p) => p.value === draft.period)?.label || draft.period || ''}
                  />
                </div>

                <div className="col-6">
                  <label className="form-label" htmlFor="shift-color-hex">
                    Shift Color
                  </label>
                  <HexColorPicker
                    color={draft.color}
                    onChange={(val) => updateDraftField('color', val)}
                  />
                </div>
              </div>
            </div>

            <div className="shift-dialog-footer">
              <button
                type="button"
                className="btn btn-light bg-white border"
                onClick={closeEditor}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="btn btn-primary shift-save-button text-white fw-semibold px-4"
                style={{ backgroundColor: '#002B7F', borderRadius: '8px', fontSize: '12px' }}
              >
                Save Shift Type
              </button>
            </div>
          </form>
        </ShiftModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmDialog
          shift={deleteTarget}
          onConfirm={confirmDelete}
          onClose={closeDeleteModal}
        />
      )}

      {/* Success Modal (Solid Fill Check Circle, Tailored UX Writing, No Got-it button) */}
      {successModal && (
        <SuccessDialog
          title={successModal.title}
          subtext={successModal.subtext}
          onClose={closeSuccessModal}
        />
      )}
    </section>
  );
}
