import { useEffect, useId, useRef, useState } from 'react';
import {
  SquaresFour,
  Plus,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  X,
  DotsThreeVertical,
  CheckCircle
} from '@phosphor-icons/react';
import './division.css';

function DivisionSuccessModal({ title, subtext, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog) dialog.showModal();
    const timer = setTimeout(() => {
      onClose();
    }, 2800);
    return () => {
      clearTimeout(timer);
      if (dialog?.open) dialog.close();
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="dept-dialog text-center border-0 p-0"
      style={{ width: '440px', maxWidth: '90vw', borderRadius: '16px' }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="position-relative text-center bg-white" style={{ padding: '40px 32px 32px', borderRadius: '16px' }}>
        <button
          type="button"
          className="dept-dialog-close-btn position-absolute top-0 end-0 m-3"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} weight="bold" />
        </button>

        <div className="d-flex justify-content-center" style={{ marginBottom: '16px' }}>
          <CheckCircle size={64} weight="fill" color="#10B981" />
        </div>
        <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '20px', lineHeight: 1.3 }}>
          {title}
        </h3>
        <p className="text-muted mx-auto mb-0" style={{ fontSize: '15px', lineHeight: 1.55 }}>
          {subtext}
        </p>
      </div>
    </dialog>
  );
}

function DivisionDialog({ dialog, departments, onClose, onSave, formError }) {
  const ref = useRef(null);
  const titleId = useId();
  const isEdit = dialog?.kind === 'edit';
  const initial = dialog?.division;

  const [draft, setDraft] = useState(() => {
    if (initial) {
      return {
        id: initial.id,
        code: initial.code || '',
        name: initial.name || '',
        departmentId: initial.departmentId || '',
        description: initial.description || ''
      };
    }
    return {
      id: '',
      code: '',
      name: '',
      departmentId: '',
      description: ''
    };
  });

  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);

  const isFormValid = Boolean(
    draft.name &&
    draft.name.trim().length > 0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    onSave(draft);
  };

  return (
    <dialog
      ref={ref}
      className="div-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="div-dialog-header">
        <h2 id={titleId}>{isEdit ? 'Edit Division' : 'Add New Division'}</h2>
        <button className="div-dialog-close-btn" aria-label="Close" onClick={onClose}>
          <X size={20} weight="bold" />
        </button>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
        <div className="div-dialog-body">
          {formError && (
            <div className="p-3 bg-danger-subtle text-danger border border-danger-subtle rounded" style={{ fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          {isEdit && draft.code && (
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="text-muted" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Division Code:</span>
              <span className="div-code-tag">{draft.code}</span>
            </div>
          )}

          <div className="div-form-group">
            <label className="div-form-label">
              Division Name <span className="div-form-required">*</span>
            </label>
            <input
              type="text"
              className="div-form-input"
              placeholder="e.g. General Operation, MEP"
              maxLength={60}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          {/* Department Selection */}
          <div className="div-form-group">
            <label className="div-form-label">Associated Department</label>
            <select
              className="div-form-select"
              value={draft.departmentId}
              onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}
            >
              <option value="">Select a department (optional)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
            {departments.length === 0 && (
              <span className="div-form-hint text-warning">
                No departments available yet. You can create departments under HR Parameter &gt; Department.
              </span>
            )}
          </div>
        </div>

        <footer className="div-dialog-footer">
          <button type="button" className="div-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="div-button primary"
            disabled={!isFormValid}
          >
            {isEdit ? 'Save Changes' : 'Add Division'}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

function DivisionDeleteModal({ division, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="div-dialog text-center"
      style={{ width: '460px' }}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <div className="p-4 p-md-5 bg-white">
        <div className="d-flex justify-content-center mb-3">
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trash size={28} weight="bold" />
          </div>
        </div>

        <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '1.25rem' }}>
          Delete Division?
        </h3>
        <p className="text-muted small mb-4" style={{ lineHeight: 1.5 }}>
          Are you sure you want to delete division <strong>{division.name}</strong> ({division.code})? This action cannot be undone.
        </p>

        <div className="d-flex justify-content-center gap-2">
          <button type="button" className="div-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="div-button destructive" onClick={onConfirm}>
            Yes, Delete Division
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function DivisionView({ presenter }) {
  const p = presenter;
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  return (
    <div className="div-page-container">
      {/* Page Header */}
      <header className="div-page-header">
        <div className="div-title-group">
          <h1>Division</h1>
          <p>Configure operational divisions and connect them with master departments</p>
        </div>
        <div className="div-header-actions">
          <button
            type="button"
            className="div-button primary"
            onClick={() => p.openDialog('add')}
          >
            <Plus size={16} weight="bold" />
            Add Division
          </button>
        </div>
      </header>

      {/* Main Table or Empty State */}
      {p.divisions.length === 0 ? (
        <div className="div-table-card">
          <div className="div-empty-box">
            <div className="div-empty-icon-wrap">
              <SquaresFour size={32} weight="bold" />
            </div>
            <h3>No divisions yet</h3>
            <p>
              Organize operational divisions under your departments to establish structured team workflows.
            </p>
            <button
              type="button"
              className="div-button primary"
              onClick={() => p.openDialog('add')}
            >
              <Plus size={16} weight="bold" />
              Add First Division
            </button>
          </div>
        </div>
      ) : (
        <div className="div-table-card">
          {/* Toolbar */}
          <div className="div-toolbar">
            <div className="div-search-box">
              <MagnifyingGlass size={18} weight="bold" />
              <input
                type="search"
                placeholder="Search code, name, or department..."
                value={p.query}
                onChange={(e) => p.setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table Content */}
          {p.filteredDivisions.length === 0 ? (
            <div className="div-empty-box">
              <div className="div-empty-icon-wrap">
                <MagnifyingGlass size={30} weight="bold" />
              </div>
              <h3>No matching divisions</h3>
              <p>
                No divisions matched your search query &ldquo;{p.query}&rdquo;.
              </p>
              <button
                type="button"
                className="div-button"
                onClick={() => p.setQuery('')}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <>
              <div className="div-table-wrapper">
                <table className="div-table">
                  <thead>
                    <tr>
                      <th className="col-div-code">Code</th>
                      <th className="col-div-name">Division Name</th>
                      <th className="col-div-dept">Department</th>
                      <th className="col-div-actions text-center" style={{ width: '90px' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.filteredDivisions.map((div) => {
                      const dept = p.departments.find((d) => d.id === div.departmentId);
                      const deptDisplayName = dept ? dept.name : div.departmentName;

                      return (
                        <tr key={div.id}>
                          {/* Code */}
                          <td>
                            <span className="div-code-tag">{div.code}</span>
                          </td>

                          {/* Name */}
                          <td>
                            <div className="div-name-title">{div.name}</div>
                          </td>

                          {/* Department */}
                          <td>
                            {deptDisplayName ? (
                              <span className="div-dept-badge">
                                {deptDisplayName}
                              </span>
                            ) : (
                              <span className="div-dept-badge empty">
                                Unassigned
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="text-center position-relative">
                            <div className="div-action-dropdown">
                              <button
                                type="button"
                                className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center shadow-none p-0 mx-auto"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  backgroundColor: activeDropdownId === div.id ? '#EEF2F6' : 'transparent',
                                  color: '#334155',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(activeDropdownId === div.id ? null : div.id);
                                }}
                                title="Division Actions"
                                aria-label={`Actions for ${div.name}`}
                                onMouseEnter={(e) => {
                                  if (activeDropdownId !== div.id) e.currentTarget.style.backgroundColor = '#EEF2F6';
                                }}
                                onMouseLeave={(e) => {
                                  if (activeDropdownId !== div.id) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <DotsThreeVertical size={20} weight="bold" />
                              </button>

                              {/* Action Dropdown Popup */}
                              {activeDropdownId === div.id && (
                                <>
                                  <div
                                    className="div-backdrop-overlay"
                                    onClick={() => setActiveDropdownId(null)}
                                  />
                                  <div className="div-dropdown-menu" role="menu">
                                    <button
                                      type="button"
                                      className="div-dropdown-item"
                                      role="menuitem"
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        p.openDialog('edit', div);
                                      }}
                                    >
                                      <PencilSimple size={16} weight="bold" className="flex-shrink-0" style={{ color: '#002B7F' }} />
                                      <span>Edit Division</span>
                                    </button>

                                    <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 0' }} />

                                    <button
                                      type="button"
                                      className="div-dropdown-item danger"
                                      role="menuitem"
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        p.confirmDelete(div);
                                      }}
                                    >
                                      <Trash size={16} weight="bold" className="flex-shrink-0" style={{ color: '#DC2626' }} />
                                      <span>Delete Division</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <footer className="div-table-footer">
                Showing {p.filteredDivisions.length} of {p.divisions.length} {p.divisions.length === 1 ? 'division' : 'divisions'}
              </footer>
            </>
          )}
        </div>
      )}

      {/* Dialog for Add / Edit */}
      {p.dialog && (
        <DivisionDialog
          dialog={p.dialog}
          departments={p.departments}
          onClose={p.closeDialog}
          onSave={p.saveDivision}
          formError={p.formError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {p.deleteConfirm && (
        <DivisionDeleteModal
          division={p.deleteConfirm}
          onConfirm={p.executeDelete}
          onCancel={p.cancelDelete}
        />
      )}

      {/* Success Notification Modal */}
      {p.successModal && (
        <DivisionSuccessModal
          title={p.successModal.title}
          subtext={p.successModal.subtext}
          onClose={() => p.setSuccessModal(null)}
        />
      )}
    </div>
  );
}
