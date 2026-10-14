import { useEffect, useId, useRef, useState } from 'react';
import {
  Buildings,
  Plus,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  X,
  DotsThreeVertical,
  CheckCircle
} from '@phosphor-icons/react';
import './department.css';

function DepartmentSuccessModal({ title, subtext, onClose }) {
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
      className="dept-dialog text-center border-0 p-0"
      style={{ width: '420px', borderRadius: '16px' }}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="position-relative p-4 p-md-5 bg-white" style={{ borderRadius: '16px' }}>
        <button
          type="button"
          className="dept-dialog-close-btn position-absolute top-0 end-0 m-3"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} weight="bold" />
        </button>

        <div className="d-flex justify-content-center mb-3">
          <CheckCircle size={64} weight="fill" style={{ color: '#10B981' }} />
        </div>

        <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '1.2rem' }}>
          {title || 'Operation Successful!'}
        </h3>

        <p className="text-muted mx-auto mb-0" style={{ fontSize: '0.86rem', lineHeight: '1.5' }}>
          {subtext || 'The department data has been updated.'}
        </p>
      </div>
    </dialog>
  );
}

function DepartmentFormModal({ department, onSave, onClose, formError }) {
  const ref = useRef(null);
  const titleId = useId();
  const isEdit = Boolean(department);

  const [draft, setDraft] = useState(() => {
    if (department) {
      return { 
        ...department
      };
    }
    return {
      code: '',
      name: '',
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
      className="dept-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="dept-dialog-header">
        <h2 id={titleId}>{isEdit ? 'Edit Department' : 'Add New Department'}</h2>
        <button className="dept-dialog-close-btn" aria-label="Close" onClick={onClose}>
          <X size={20} weight="bold" />
        </button>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
        <div className="dept-dialog-body">
          {formError && (
            <div className="p-3 bg-danger-subtle text-danger border border-danger-subtle rounded" style={{ fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          {isEdit && draft.code && (
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="text-muted" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Department Code:</span>
              <span className="dept-code-tag">{draft.code}</span>
            </div>
          )}

          <div className="dept-form-group">
            <label className="dept-form-label">
              Department Name <span className="dept-form-required">*</span>
            </label>
            <input
              type="text"
              className="dept-form-input"
              placeholder="e.g. Building Operation, Security"
              maxLength={60}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
              autoFocus
            />
          </div>
        </div>

        <footer className="dept-dialog-footer">
          <button type="button" className="dept-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="dept-button primary"
            disabled={!isFormValid}
          >
            {isEdit ? 'Save Changes' : 'Add Department'}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

function DepartmentDeleteModal({ department, onConfirm, onCancel, formError }) {
  const ref = useRef(null);
  const hasDivisions = Array.isArray(department?.divisions) && department.divisions.length > 0;

  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="dept-dialog text-center"
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

        <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '1.2rem' }}>
          Delete Department?
        </h3>

        <p className="text-muted mb-4" style={{ fontSize: '0.86rem', lineHeight: '1.5' }}>
          Are you sure you want to delete department <strong>{department.name}</strong> ({department.code})? This action cannot be undone.
        </p>

        {hasDivisions ? (
          <div className="p-3 bg-danger-subtle text-danger border border-danger-subtle rounded mb-3 text-start" style={{ fontSize: '0.85rem' }}>
            This department cannot be deleted because it still has {department.divisions.length} active {department.divisions.length === 1 ? 'division' : 'divisions'}. Please remove or reassign the divisions first.
          </div>
        ) : (
          formError && (
            <div className="p-3 bg-danger-subtle text-danger border border-danger-subtle rounded mb-3 text-start" style={{ fontSize: '0.82rem' }}>
              {formError}
            </div>
          )
        )}

        <div className="d-flex justify-content-center gap-2">
          <button type="button" className="dept-button" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="button" 
            className="dept-button destructive" 
            disabled={hasDivisions}
            onClick={onConfirm}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function DepartmentView({ presenter }) {
  const p = presenter;
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  return (
    <div className="department-page">
      {/* Modals */}
      {p.successModal && (
        <DepartmentSuccessModal
          title={p.successModal.title}
          subtext={p.successModal.subtext}
          onClose={p.closeSuccessModal}
        />
      )}

      {(p.dialog?.kind === 'add' || p.dialog?.kind === 'edit') && (
        <DepartmentFormModal
          department={p.dialog.department}
          onSave={p.saveDepartment}
          onClose={p.closeDialog}
          formError={p.formError}
        />
      )}

      {p.deleteConfirm && (
        <DepartmentDeleteModal
          department={p.deleteConfirm}
          onConfirm={p.executeDelete}
          onCancel={() => p.setDeleteConfirm(null)}
          formError={p.formError}
        />
      )}

      {/* Page Header */}
      <header className="department-header">
        <div>
          <h1>Department</h1>
          <p>
            Manage master departments and operational divisions for building operations.
          </p>
        </div>
        {p.departments.length > 0 && (
          <button
            type="button"
            className="dept-button primary"
            onClick={() => p.openDialog('add')}
          >
            <Plus size={16} weight="bold" />
            Add Department
          </button>
        )}
      </header>

      {p.departments.length === 0 ? (
        <div className="dept-table-card">
          <div className="dept-empty-box">
            <div className="dept-empty-icon-wrap">
              <Buildings size={32} weight="bold" />
            </div>
            <h3>No Departments Yet</h3>
            <p>
              Start organizing your building structure by adding the first department and its operational divisions.
            </p>
            <button
              type="button"
              className="dept-button primary"
              onClick={() => p.openDialog('add')}
            >
              <Plus size={16} weight="bold" />
              Add First Department
            </button>
          </div>
        </div>
      ) : (
        <div className="dept-table-card">
          {/* Toolbar */}
            <div className="dept-toolbar">
              <div className="dept-search-box">
                <MagnifyingGlass size={18} weight="bold" />
                <input
                  type="search"
                  placeholder="Search code, name, or division..."
                  value={p.query}
                  onChange={(e) => p.setQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Table Content */}
            {p.filteredDepartments.length === 0 ? (
              <div className="dept-empty-box">
                <div className="dept-empty-icon-wrap">
                  <MagnifyingGlass size={30} weight="bold" />
                </div>
                <h3>No Departments Found</h3>
                <p>
                  No departments match your search &ldquo;{p.query}&rdquo;. Please check your spelling or try another keyword.
                </p>
                {p.query && (
                  <button
                    type="button"
                    className="dept-button"
                    onClick={() => p.setQuery('')}
                  >
                    Reset Search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="dept-table-responsive">
                <table className="dept-table">
                  <thead>
                    <tr>
                      <th className="col-dept-code">Code</th>
                      <th className="col-dept-name">Department Name</th>
                      <th className="col-dept-divisions">Related Divisions</th>
                      <th className="col-dept-actions text-center" style={{ width: '90px' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.filteredDepartments.map((dept) => {
                      const hasDivisions = Array.isArray(dept.divisions) && dept.divisions.length > 0;

                      return (
                        <tr key={dept.id}>
                          {/* Code */}
                          <td>
                            <span className="dept-code-tag">{dept.code}</span>
                          </td>

                          {/* Name */}
                          <td>
                            <div className="dept-name-title">{dept.name}</div>
                          </td>

                          {/* Divisions */}
                          <td>
                            <div className="dept-divisions-list">
                              {hasDivisions ? (
                                dept.divisions.map((divName) => (
                                  <span key={divName} className="dept-division-pill">
                                    {divName}
                                  </span>
                                ))
                              ) : (
                                <span className="dept-division-pill empty">
                                  No divisions
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="text-center position-relative">
                            <div className="dept-action-dropdown">
                              <button
                                type="button"
                                className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center shadow-none p-0 mx-auto"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  backgroundColor: activeDropdownId === dept.id ? '#EEF2F6' : 'transparent',
                                  color: '#334155',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(activeDropdownId === dept.id ? null : dept.id);
                                }}
                                title="Department Actions"
                                aria-label={`Actions for ${dept.name}`}
                                onMouseEnter={(e) => {
                                  if (activeDropdownId !== dept.id) e.currentTarget.style.backgroundColor = '#EEF2F6';
                                }}
                                onMouseLeave={(e) => {
                                  if (activeDropdownId !== dept.id) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <DotsThreeVertical size={20} weight="bold" />
                              </button>

                              {/* Action Dropdown Popup */}
                              {activeDropdownId === dept.id && (
                                <>
                                  <div
                                    className="dept-backdrop-overlay"
                                    onClick={() => setActiveDropdownId(null)}
                                  />
                                  <div className="dept-dropdown-menu" role="menu">
                                    <button
                                      type="button"
                                      className="dept-dropdown-item"
                                      role="menuitem"
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        p.openDialog('edit', dept);
                                      }}
                                    >
                                      <PencilSimple size={16} weight="bold" className="flex-shrink-0" style={{ color: '#002B7F' }} />
                                      <span>Edit Department</span>
                                    </button>

                                    <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 0' }} />

                                    {hasDivisions ? (
                                      <div
                                        className="dept-disabled-action-wrap"
                                        title="Cannot delete: This department has active divisions. Remove or reassign its divisions first."
                                      >
                                        <button
                                          type="button"
                                          disabled
                                          className="dept-dropdown-item"
                                          style={{
                                            color: '#94A3B8',
                                            cursor: 'not-allowed',
                                            opacity: 0.65,
                                            pointerEvents: 'none'
                                          }}
                                        >
                                          <Trash size={16} weight="bold" className="flex-shrink-0" style={{ color: '#94A3B8' }} />
                                          <span>Delete Department</span>
                                        </button>
                                        <div className="dept-action-tooltip" role="tooltip">
                                          Cannot delete: This department has active divisions. Remove or reassign its divisions first.
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        className="dept-dropdown-item danger"
                                        role="menuitem"
                                        onClick={() => {
                                          setActiveDropdownId(null);
                                          p.confirmDelete(dept);
                                        }}
                                      >
                                        <Trash size={16} weight="bold" className="flex-shrink-0" style={{ color: '#DC2626' }} />
                                        <span>Delete Department</span>
                                      </button>
                                    )}
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
              <footer className="dept-table-footer">
                Showing {p.filteredDepartments.length} of {p.departments.length} {p.departments.length === 1 ? 'department' : 'departments'}
              </footer>
            </>
          )}
        </div>
      )}
    </div>
  );
}
