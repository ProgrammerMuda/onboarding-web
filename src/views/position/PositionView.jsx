import { useEffect, useId, useRef, useState } from 'react';
import { MagnifyingGlass, Plus, PencilSimple, Trash, X, Info, Crown, DotsThreeVertical, CheckCircle } from '@phosphor-icons/react';
import { TOP_POSITION_ID, formatPositionNameWithDivision } from '../../models/PositionModel';
import './position.css';

function PositionSuccessModal({ title, subtext, onClose }) {
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
      className="position-dialog position-success-dialog border-0 shadow-lg p-0"
      aria-labelledby="position-success-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="position-relative p-4 p-md-5 text-center bg-white" style={{ borderRadius: '16px' }}>
        <button
          type="button"
          className="position-dialog-close-btn position-absolute top-0 end-0 m-3"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} weight="bold" />
        </button>

        <div className="d-flex justify-content-center mb-3">
          <CheckCircle size={68} weight="fill" style={{ color: '#10B981' }} />
        </div>

        <h3 id="position-success-title" className="fw-bold text-dark mb-2" style={{ fontSize: '1.25rem' }}>
          {title || 'Operation Successful!'}
        </h3>

        <p className="text-muted mx-auto mb-0" style={{ fontSize: '0.875rem', lineHeight: '1.55', maxWidth: '360px' }}>
          {subtext || 'The position settings have been successfully saved.'}
        </p>
      </div>
    </dialog>
  );
}

function PositionDialog({ title, children, onClose }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const element = ref.current;
    const opener = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  return (
    <dialog 
      ref={ref} 
      className="position-dialog" 
      aria-labelledby={titleId} 
      onCancel={(event) => { event.preventDefault(); onClose(); }}
    >
      <header className="position-dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button className="position-dialog-close-btn" aria-label="Close dialog" onClick={onClose}>
          <X size={20} weight="bold" />
        </button>
      </header>
      {children}
    </dialog>
  );
}

function PositionForm({ p }) {
  const isEdit = Boolean(p.dialog?.position);
  const isTop = p.dialog?.position?.id === TOP_POSITION_ID;

  const [departmentId, setDepartmentId] = useState(() => {
    if (isTop) return 'dept-bm';
    return p.dialog?.position?.departmentId || '';
  });

  const [divisionId, setDivisionId] = useState(() => {
    if (isTop) return 'div-bm';
    return p.dialog?.position?.divisionId || '';
  });

  const [baseTitle, setBaseTitle] = useState(() => {
    if (!p.dialog?.position) return '';
    const posName = p.dialog.position.name || '';
    const initialDivId = p.dialog.position.divisionId;
    const divObj = (p.divisions || []).find((d) => d.id === initialDivId);
    if (divObj && divObj.name && posName.toLowerCase().endsWith(divObj.name.toLowerCase())) {
      const stripped = posName.slice(0, posName.length - divObj.name.length).trim();
      return stripped || posName;
    }
    return posName;
  });

  const availableDivisions = (p.divisions || []).filter(
    (div) => !departmentId || div.departmentId === departmentId
  );

  const selectedDiv = (p.divisions || []).find((d) => d.id === divisionId);

  const formattedName = isTop
    ? (baseTitle.trim() || 'Building Manager')
    : (selectedDiv ? formatPositionNameWithDivision(baseTitle.trim(), selectedDiv.name) : baseTitle.trim());

  const title = isEdit ? 'Edit Position' : 'Add New Position';
  const isSaveDisabled = isTop
    ? !baseTitle.trim()
    : (!departmentId || !divisionId || !baseTitle.trim());

  const handleDepartmentChange = (e) => {
    const nextDeptId = e.target.value;
    setDepartmentId(nextDeptId);
    const stillValid = (p.divisions || []).some(
      (d) => d.id === divisionId && d.departmentId === nextDeptId
    );
    if (!stillValid) {
      setDivisionId('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSaveDisabled) return;
    const rootPos = p.positions.find((item) => item.id === TOP_POSITION_ID);
    const existingParentIds = p.dialog?.position?.parentIds;
    const parentIds = isTop ? [] : (existingParentIds?.length ? existingParentIds : (rootPos ? [rootPos.id] : []));
    p.save({
      ...(p.dialog?.position || {}),
      name: formattedName,
      departmentId: isTop ? 'dept-bm' : departmentId,
      divisionId: isTop ? 'div-bm' : divisionId,
      parentIds
    });
  };

  return (
    <PositionDialog title={title} onClose={p.close}>
      <form onSubmit={handleSubmit}>
        <div className="position-dialog-body">
          {isEdit && p.dialog?.position?.code && (
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Position Code:</span>
              <span className="position-code-tag">{p.dialog.position.code}</span>
            </div>
          )}

          {isTop ? (
            <div className="position-root-banner">
              <Crown size={22} weight="fill" className="text-amber" />
              <div>
                <strong>Highest Authority (Organization Root)</strong>
                <p>The Building Manager is the top position in the organization.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Department Select */}
              <div className="position-form-group">
                <label htmlFor="position-department" className="position-form-label">
                  Department <span className="position-required">*</span>
                </label>
                <select
                  id="position-department"
                  required
                  className="position-form-input position-form-select"
                  value={departmentId}
                  onChange={handleDepartmentChange}
                >
                  <option value="" disabled>-- Select Department --</option>
                  {(p.departments || []).map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                <span className="position-form-hint">
                  Choose the organizational department for this position.
                </span>
              </div>

              {/* Division Select */}
              <div className="position-form-group">
                <label htmlFor="position-division" className="position-form-label">
                  Division <span className="position-required">*</span>
                </label>
                <select
                  id="position-division"
                  required
                  disabled={!departmentId}
                  className="position-form-input position-form-select"
                  value={divisionId}
                  onChange={(e) => setDivisionId(e.target.value)}
                >
                  <option value="" disabled>
                    {departmentId ? '-- Select Division --' : '-- Please Select Department First --'}
                  </option>
                  {availableDivisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name} ({div.code})
                    </option>
                  ))}
                </select>
                <span className="position-form-hint">
                  Divisions are filtered based on the selected department.
                </span>
              </div>
            </>
          )}

          {/* Position Title Input */}
          <div className="position-form-group">
            <label htmlFor="position-name" className="position-form-label">
              {isTop ? 'Position Name' : 'Position Title'} <span className="position-required">*</span>
            </label>
            <input 
              autoFocus 
              id="position-name" 
              required 
              maxLength={80} 
              value={baseTitle} 
              placeholder={isTop ? 'Building Manager' : 'e.g. Staff, Supervisor, Coordinator'} 
              onChange={(event) => setBaseTitle(event.target.value)} 
              className="position-form-input"
            />
            <span className="position-form-hint">
              {isTop
                ? 'Job title for the top authority in the building organization.'
                : 'Enter the base title (e.g. Staff, Supervisor, Team Leader).'}
            </span>
          </div>

          {/* Resulting Position Name Preview */}
          {!isTop && (
            <div className="position-preview-box">
              <div className="position-preview-header">
                <span className="position-preview-label">Resulting Position Name</span>
                <span className="position-preview-formula">
                  {selectedDiv ? `[${baseTitle.trim() || 'Title'}] + [${selectedDiv.name}]` : 'Title + Division'}
                </span>
              </div>
              <div className="position-preview-value">
                {formattedName ? (
                  <strong>{formattedName}</strong>
                ) : (
                  <span className="text-muted fst-italic" style={{ fontSize: '0.85rem' }}>
                    Select department, division, and enter title to preview
                  </span>
                )}
              </div>
            </div>
          )}

          {p.error && (
            <div className="position-form-error" role="alert">
              <Info size={20} weight="bold" />
              <span>{p.error}</span>
            </div>
          )}
        </div>

        <footer className="position-dialog-footer">
          <button type="button" className="position-button secondary" onClick={p.close}>
            Cancel
          </button>
          <button 
            className="position-button primary" 
            type="submit"
            disabled={isSaveDisabled}
          >
            {isEdit ? 'Save Changes' : 'Create Position'}
          </button>
        </footer>
      </form>
    </PositionDialog>
  );
}

export function PositionView({ presenter: p }) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setActiveMenuId(null);
      }
    }
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeMenuId]);

  return (
    <section className="position-page" aria-labelledby="position-heading">
      <header className="position-header">
        <div>
          <h1 className="position-page-title">Positions</h1>
          <p className="position-page-subtitle">Manage organizational positions and job titles.</p>
        </div>
        <div>
          <button
            type="button"
            className="position-button primary"
            disabled={Boolean(p.loadError)}
            onClick={() => p.open('edit')}
          >
            <Plus size={16} weight="bold" />
            <span>Add Position</span>
          </button>
        </div>
      </header>
      {p.loadError ? (
        <div className="position-error" role="alert">
          <p>{p.loadError}</p>
          <button className="position-button" onClick={p.retry}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="position-table-card">
            <div className="position-toolbar">
              <div className="position-search">
                <MagnifyingGlass size={18} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Search positions"
                  placeholder="Search code or position names..."
                  value={p.query}
                  onChange={(event) => p.setQuery(event.target.value)}
                />
              </div>
            </div>
            <div className="position-table-responsive">
              <table className="position-table">
                <thead>
                  <tr>
                    <th className="col-pos-code">Code</th>
                    <th className="col-pos-name">Position Name</th>
                    <th className="col-pos-dept">Department</th>
                    <th className="col-pos-div">Division</th>
                    <th className="col-pos-actions text-center" style={{ width: '90px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {p.filtered.map((item) => {
                    const isTop = item.id === TOP_POSITION_ID;
                    const dept = (p.departments || []).find((d) => d.id === item.departmentId);
                    const div = (p.divisions || []).find((d) => d.id === item.divisionId);

                    return (
                      <tr key={item.id} className={isTop ? 'position-row-top' : ''}>
                        {/* Code */}
                        <td>
                          <span className="position-code-tag">{item.code || '001'}</span>
                        </td>

                        {/* Name */}
                        <td>
                          <div className="position-name-main">
                            <span className="position-name-title">{item.name}</span>
                            {isTop && (
                              <span className="position-top-badge">
                                <Crown size={14} weight="fill" />
                                Highest Authority
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Department */}
                        <td>
                          <span className="position-dept-tag">
                            {dept ? dept.name : (isTop ? 'Building Management' : '-')}
                          </span>
                        </td>

                        {/* Division */}
                        <td>
                          <span className="position-div-tag">
                            {div ? div.name : (isTop ? 'General Operation' : '-')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="text-center position-relative">
                          <button
                            type="button"
                            className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center shadow-none p-0 mx-auto"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: activeMenuId === item.id ? '#EEF2F6' : 'transparent',
                              color: '#334155',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            aria-label={`Actions for ${item.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === item.id ? null : item.id);
                            }}
                            onMouseEnter={(e) => {
                              if (activeMenuId !== item.id) e.currentTarget.style.backgroundColor = '#EEF2F6';
                            }}
                            onMouseLeave={(e) => {
                              if (activeMenuId !== item.id) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <DotsThreeVertical size={20} weight="bold" />
                          </button>
                          {activeMenuId === item.id && (
                            <>
                              <div
                                className="position-fixed top-0 start-0 w-100 h-100"
                                style={{ zIndex: 1040 }}
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div
                                className="position-absolute end-0 bg-white border shadow-lg"
                                style={{
                                  top: 'calc(100% + 4px)',
                                  right: '8px',
                                  borderRadius: '10px',
                                  borderColor: '#E2E8F0',
                                  minWidth: '180px',
                                  width: 'max-content',
                                  zIndex: 1050,
                                  padding: '6px',
                                  textAlign: 'left',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)'
                                }}
                              >
                                <button
                                  type="button"
                                  className="d-flex align-items-center text-dark fw-semibold border-0 w-100 text-start"
                                  style={{
                                    gap: '10px',
                                    padding: '8px 14px',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    p.open('edit', item);
                                  }}
                                >
                                  <PencilSimple size={16} weight="bold" className="flex-shrink-0" style={{ color: '#002B7F' }} />
                                  <span style={{ whiteSpace: 'nowrap' }}>Edit position</span>
                                </button>
                                {item.id !== TOP_POSITION_ID && (
                                  <>
                                    <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 0' }} />
                                    <button
                                      type="button"
                                      className="d-flex align-items-center text-danger fw-semibold border-0 w-100 text-start"
                                      style={{
                                        gap: '10px',
                                        padding: '8px 14px',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        backgroundColor: 'transparent',
                                        borderRadius: '6px',
                                        whiteSpace: 'nowrap',
                                        transition: 'background-color 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        p.open('delete', item);
                                      }}
                                    >
                                      <Trash size={16} weight="bold" className="flex-shrink-0" style={{ color: '#DC2626' }} />
                                      <span style={{ whiteSpace: 'nowrap' }}>Delete position</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!p.filtered.length && (
              <div className="position-empty">
                <h2>{p.query ? 'No matching positions' : 'No positions yet'}</h2>
                <p>{p.query ? 'Try another keyword or clear your search.' : 'Add your first position to get started.'}</p>
                <button className="position-button" onClick={() => p.query ? p.setQuery('') : p.open('edit')}>
                  {p.query ? 'Clear search' : 'Add position'}
                </button>
              </div>
            )}
            <footer className="position-table-footer">
              Showing {p.filtered.length} of {p.positions.length} {p.positions.length === 1 ? 'position' : 'positions'}
            </footer>
          </div>
          <p className="position-bottom-note">You can rename the top position to suit your building, but you cannot delete it.</p>
        </>
      )}

      {p.dialog?.kind === 'edit' && (
        <PositionForm key={`edit-${p.dialog.position?.id || 'new'}`} p={p} />
      )}

      {p.dialog?.kind === 'delete' && (
        <PositionDialog title={`Delete ${p.dialog.position.name}?`} onClose={p.close}>
          <div className="position-dialog-body">
            <p>
              Are you sure you want to delete position <strong>{p.dialog.position.name}</strong> ({p.dialog.position.code || '001'})? This action cannot be undone.
            </p>
            {p.error && <p role="alert" className="position-error">{p.error}</p>}
          </div>
          <footer className="position-dialog-footer">
            <button className="position-button secondary" onClick={p.close}>Cancel</button>
            <button className="position-button destructive" onClick={() => p.remove(p.dialog.position)}>Delete position</button>
          </footer>
        </PositionDialog>
      )}

      {p.successModal && (
        <PositionSuccessModal 
          title={p.successModal.title} 
          subtext={p.successModal.subtext} 
          onClose={p.closeSuccessModal} 
        />
      )}
    </section>
  );
}
