import { useEffect, useId, useRef, useState } from 'react';
import { MagnifyingGlass, Plus, PencilSimple, TreeStructure, Trash, X, CaretRight, CaretDown, Info, Crown, ArrowElbowDownRight, Users, DotsThreeVertical, ArrowsOut, ArrowsIn, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { TOP_POSITION_ID, ancestors, descendants, getParentIds } from '../../models/PositionModel';
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

        {/* Solid filled check circle */}
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

function PositionDialog({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const element = ref.current;
    const opener = document.activeElement;
    element.showModal();
    return () => { element.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  return (
    <dialog 
      ref={ref} 
      className={`position-dialog${wide ? ' position-dialog-wide' : ''}`} 
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

function canSetSuperiors(item, positions = []) {
  if (!item || item.id === TOP_POSITION_ID) return false;
  const excluded = descendants(positions, item.id);
  const candidates = positions.filter((pos) => pos.id !== item.id && !excluded.has(pos.id));
  return candidates.length > 1;
}

function PositionForm({ p, relationship = false }) {
  const isEdit = Boolean(p.dialog?.position);
  const isTop = p.dialog?.position?.id === TOP_POSITION_ID;

  const [draft, setDraft] = useState(() => {
    if (p.dialog?.position) {
      return { 
        ...p.dialog.position, 
        parentIds: getParentIds(p.dialog.position) 
      };
    }
    const rootPos = p.positions.find((item) => item.id === TOP_POSITION_ID);
    return { 
      name: '', 
      parentIds: rootPos ? [rootPos.id] : [] 
    };
  });

  const excluded = descendants(p.positions, draft.id);
  const candidates = p.positions.filter((item) => item.id !== draft.id && !excluded.has(item.id));

  const toggleSuperior = (id) => {
    const current = draft.parentIds || [];
    const next = current.includes(id) 
      ? current.filter((x) => x !== id) 
      : [...current, id];
    setDraft({ ...draft, parentIds: next });
  };

  const title = relationship 
    ? `Set Direct Superiors: ${draft.name}` 
    : isEdit 
      ? 'Edit Position' 
      : 'Add New Position';

  const isSaveDisabled = relationship
    ? (!draft.parentIds || draft.parentIds.length === 0)
    : isTop
      ? !draft.name?.trim()
      : (!draft.name?.trim() || !draft.parentIds || draft.parentIds.length === 0);

  return (
    <PositionDialog title={title} onClose={p.close}>
      <form onSubmit={(event) => { event.preventDefault(); p.save(draft, relationship); }}>
        <div className="position-dialog-body">
          {/* Position Name Input */}
          {!relationship && (
            <div className="position-form-group">
              <label htmlFor="position-name" className="position-form-label">
                Position Name <span className="position-required">*</span>
              </label>
              <input 
                autoFocus 
                id="position-name" 
                required 
                maxLength={80} 
                value={draft.name} 
                placeholder="e.g. Supervisor, Coordinator, Team Leader" 
                onChange={(event) => setDraft({ ...draft, name: event.target.value })} 
                className="position-form-input"
              />
              <span className="position-form-hint">
                Enter a clear job title suitable for your organization structure.
              </span>
            </div>
          )}

          {/* Superior Selection */}
          {isTop ? (
            <div className="position-root-banner">
              <Crown size={26} weight="fill" className="text-amber" />
              <div>
                <strong>Highest Authority (Organization Root)</strong>
                <p>The Building Manager is the top position and cannot be assigned any direct superiors.</p>
              </div>
            </div>
          ) : (
            <div className="position-form-group superior-group">
              <div className="position-superior-header">
                <div>
                  <label id="position-superiors-label" className="position-form-label">
                    Direct Superior(s) <span className="position-required">*</span>
                  </label>
                  <p className="position-form-subtitle">
                    Select one or more positions that this role directly reports to.
                  </p>
                </div>
                <span className="position-superior-badge">
                  {(draft.parentIds || []).length} selected
                </span>
              </div>

              {candidates.length === 0 ? (
                <div className="position-empty-candidates">
                  <Info size={20} />
                  <span>No other positions available as superior.</span>
                </div>
              ) : (
                <div className="position-candidate-grid" role="group" aria-labelledby="position-superiors-label">
                  {candidates.map((item) => {
                    const isChecked = (draft.parentIds || []).includes(item.id);
                    const isCandidateTop = item.id === TOP_POSITION_ID;
                    return (
                      <label 
                        key={item.id} 
                        className={`position-candidate-tile ${isChecked ? 'selected' : ''}`}
                      >
                        <input 
                          type="checkbox" 
                          className="position-candidate-checkbox" 
                          checked={isChecked}
                          onChange={() => toggleSuperior(item.id)}
                        />
                        <div className="position-candidate-content">
                          <span className="position-candidate-title">{item.name}</span>
                          {isCandidateTop && (
                            <span className="position-top-badge small">
                              <Crown size={12} weight="fill" /> Highest Level
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
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
            {relationship ? 'Save Superiors' : isEdit ? 'Save Changes' : 'Create Position'}
          </button>
        </footer>
      </form>
    </PositionDialog>
  );
}

function Branch({ item, positions, selectedId, expanded, setExpanded, onSelectPosition, depth = 0, query = '' }) {
  const directChildren = positions.filter((row) => getParentIds(row).includes(item.id));
  const open = expanded.has(item.id);
  const childId = useId();
  const isSelected = item.id === selectedId;
  const isTop = item.id === TOP_POSITION_ID;
  const isMatch = query && item.name.toLowerCase().includes(query.toLowerCase());

  return (
    <li className="position-tree-item">
      <div className={`position-node-card ${isSelected ? 'selected' : ''} ${isTop ? 'root-node' : ''} ${isMatch ? 'search-match' : ''}`}>
        <div className="position-node-left">
          {directChildren.length > 0 ? (
            <button 
              type="button"
              className="position-node-toggle" 
              aria-label={`${open ? 'Collapse' : 'Expand'} subordinates of ${item.name}`} 
              aria-expanded={open} 
              aria-controls={childId} 
              onClick={() => setExpanded((previous) => { 
                const next = new Set(previous); 
                if (open) next.delete(item.id); 
                else next.add(item.id); 
                return next; 
              })}
            >
              {open ? (
                <CaretDown size={17} weight="bold" />
              ) : (
                <CaretRight size={17} weight="bold" />
              )}
            </button>
          ) : (
            <span className="position-node-dot" aria-hidden="true" />
          )}

          <div className="position-node-badge-icon">
            {isTop ? <Crown size={17} weight="fill" className="text-amber" /> : <TreeStructure size={17} weight="bold" />}
          </div>

          <div className="position-node-details">
            <span className="position-node-title">{item.name}</span>
            {isTop && <span className="position-top-badge small"><Crown size={12} weight="fill" /> Highest Authority</span>}
          </div>
        </div>

        <div className="position-node-right">
          <span className={`position-node-pill ${directChildren.length > 0 ? 'has-count' : ''}`}>
            <Users size={14} weight="bold" />
            <span>{directChildren.length} {directChildren.length === 1 ? 'subordinate' : 'subordinates'}</span>
          </span>
          {onSelectPosition && item.id !== selectedId && (
            <button 
              type="button" 
              className="position-node-action-btn"
              onClick={() => onSelectPosition(item)}
              title={`Focus ${item.name}`}
            >
              Focus
            </button>
          )}
        </div>
      </div>

      {directChildren.length > 0 && (
        <ul id={childId} hidden={!open} className={`position-tree-sublist ${depth >= 4 ? 'deep-branch' : ''}`}>
          {directChildren.map((child) => (
            <Branch 
              key={`${item.id}-${child.id}`} 
              item={child} 
              positions={positions} 
              selectedId={selectedId} 
              expanded={expanded} 
              setExpanded={setExpanded} 
              onSelectPosition={onSelectPosition}
              depth={depth + 1}
              query={query}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function Hierarchy({ p }) {
  const [selectedPosition, setSelectedPosition] = useState(p.dialog.position);
  const [treeQuery, setTreeQuery] = useState('');
  
  const parents = selectedPosition ? ancestors(p.positions, selectedPosition.id) : [];
  const directParentIds = selectedPosition ? getParentIds(selectedPosition) : [];
  const [expanded, setExpanded] = useState(() => new Set(p.positions.map((item) => item.id)));
  
  const roots = selectedPosition ? [selectedPosition] : p.positions.filter((item) => getParentIds(item).length === 0);
  const totalSubordinatesCount = selectedPosition ? descendants(p.positions, selectedPosition.id).size : p.positions.length - 1;

  const isExpanded = expanded.size > 0;
  const toggleExpandAll = () => {
    if (isExpanded) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(p.positions.map((item) => item.id)));
    }
  };

  return (
    <PositionDialog 
      title={selectedPosition ? `Hierarchy: ${selectedPosition.name}` : 'Organizational Hierarchy'} 
      onClose={p.close} 
      wide
    >
      <div className="position-dialog-body hierarchy-dialog-body">
        {/* Top Summary Banner */}
        <div className="hierarchy-overview-card">
          <div className="hierarchy-overview-main">
            <div className="hierarchy-overview-icon">
              {selectedPosition?.id === TOP_POSITION_ID ? (
                <Crown size={24} weight="fill" />
              ) : (
                <TreeStructure size={24} weight="bold" />
              )}
            </div>
            <div>
              <h3 className="hierarchy-overview-title">
                {selectedPosition ? selectedPosition.name : 'All Positions Hierarchy'}
              </h3>
              <p className="hierarchy-overview-desc">
                {selectedPosition 
                  ? selectedPosition.id === TOP_POSITION_ID 
                    ? 'Root Level • Head of organization with total reporting authority'
                    : `${totalSubordinatesCount} total subordinate ${totalSubordinatesCount === 1 ? 'position' : 'positions'} under this branch`
                  : `${p.positions.length} configured positions across all operational levels`
                }
              </p>
            </div>
          </div>
          {selectedPosition && (
            <button 
              type="button" 
              className="position-button hierarchy-view-all-btn"
              onClick={() => setSelectedPosition(null)}
            >
              <TreeStructure size={15} /> View Full Tree
            </button>
          )}
        </div>

        {/* Upstream Reporting Chain (Breadcrumb Cards) */}
        {selectedPosition && (
          <div className="hierarchy-chain-section">
            <div className="hierarchy-section-heading">
              <h4>Superior Reporting Line</h4>
            </div>
            {parents.length > 0 ? (
              <div className="hierarchy-chain-flow">
                {/* 1. Current Focus as the starting point */}
                <div className="hierarchy-chain-step current">
                  <div className="hierarchy-chain-card active-target">
                    <div className="hierarchy-chain-card-header">
                      <span className="hierarchy-chain-role">Current Focus</span>
                    </div>
                    <span className="hierarchy-chain-name">{selectedPosition.name}</span>
                  </div>
                </div>

                {/* 2. Chain of superiors from Direct Superior up to Root Authority */}
                {parents.map((item) => {
                  const isDirect = directParentIds.includes(item.id);
                  const isRoot = item.id === TOP_POSITION_ID;
                  return (
                    <div key={item.id} className="hierarchy-chain-step">
                      <div className="hierarchy-chain-connector" title="Reports to">
                        <span className="hierarchy-chain-connector-label">reports to</span>
                        <ArrowRight size={14} weight="bold" className="hierarchy-chain-arrow" />
                      </div>
                      <div className={`hierarchy-chain-card ${isRoot ? 'root' : isDirect ? 'direct' : 'indirect'}`}>
                        <div className="hierarchy-chain-card-header">
                          <span className="hierarchy-chain-role">
                            {isRoot ? 'Root Authority' : isDirect ? 'Direct Superior' : 'Indirect Superior'}
                          </span>
                          {isRoot && <Crown size={15} weight="fill" className="chain-crown" />}
                        </div>
                        <span className="hierarchy-chain-name">{item.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="hierarchy-chain-root-note">
                <Crown size={22} weight="fill" />
                <span><strong>{selectedPosition.name}</strong> is the highest authority in the organization and has no superiors above it.</span>
              </div>
            )}
          </div>
        )}

        {/* Tree Toolbar: Search & Expand/Collapse */}
        <div className="hierarchy-tree-toolbar">
          <div className="hierarchy-search-box">
            <MagnifyingGlass size={18} />
            <input 
              type="search" 
              placeholder="Find position in tree..." 
              value={treeQuery}
              onChange={(e) => setTreeQuery(e.target.value)}
            />
          </div>
          <div className="hierarchy-tree-actions">
            <button 
              type="button" 
              className="position-button small" 
              onClick={toggleExpandAll}
              aria-label={isExpanded ? 'Collapse all tree nodes' : 'Expand all tree nodes'}
            >
              {isExpanded ? (
                <>
                  <ArrowsIn size={17} weight="bold" /> Collapse All
                </>
              ) : (
                <>
                  <ArrowsOut size={17} weight="bold" /> Expand All
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visual Tree */}
        <div className="hierarchy-tree-container">
          <ul className="position-tree-root" aria-label="Organization structure tree">
            {roots.map((item) => (
              <Branch 
                key={item.id} 
                item={item} 
                positions={p.positions} 
                selectedId={selectedPosition?.id} 
                expanded={expanded} 
                setExpanded={setExpanded}
                onSelectPosition={setSelectedPosition}
                query={treeQuery}
              />
            ))}
          </ul>
        </div>
      </div>

      <footer className="position-dialog-footer">
        <button type="button" className="position-button" onClick={p.close}>Close</button>
        {canSetSuperiors(selectedPosition, p.positions) && (
          <button 
            type="button" 
            className="position-button primary" 
            onClick={() => {
              p.close();
              p.open('relationship', selectedPosition);
            }}
          >
            <ArrowElbowDownRight size={18} weight="bold" /> Set Superiors
          </button>
        )}
      </footer>
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

  return <section className="position-page" aria-labelledby="position-heading">
    <header className="position-header"><div><h1 id="position-heading">Positions</h1><p>Manage positions and reporting relationships.</p></div><button className="position-button primary" disabled={!!p.loadError} onClick={() => p.open('edit')}><Plus size={20} weight="bold" /> Add position</button></header>
    {p.loadError ? <div className="position-error" role="alert"><p>{p.loadError}</p><button className="position-button" onClick={p.retry}>Try again</button></div> : <>
      <div className="position-table-card">
        <div className="position-toolbar"><div className="position-search"><MagnifyingGlass size={20} aria-hidden="true" /><input type="search" aria-label="Search positions" placeholder="Search position names..." value={p.query} onChange={(event) => p.setQuery(event.target.value)} /></div><button className="position-button" disabled={!p.positions.length} onClick={() => p.open('hierarchy')}><TreeStructure size={20} weight="bold" /> View full hierarchy</button></div>
        <div className="position-table-responsive">
          <table className="position-table">
            <thead>
              <tr>
                <th scope="col" className="col-pos-name">Position name</th>
                <th scope="col" className="col-pos-superior">Direct superior</th>
                <th scope="col" className="col-pos-subordinates">Subordinates</th>
                <th scope="col" className="col-pos-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {p.filtered.map((item, index) => {
                const isTop = item.id === TOP_POSITION_ID;
                const parentIds = getParentIds(item);
                const directSuperiors = p.positions.filter((pos) => parentIds.includes(pos.id));
                const directSubordinates = p.positions.filter((pos) => getParentIds(pos).includes(item.id));
                const isDropup = index >= Math.max(1, p.filtered.length - 2);

                return (
                  <tr key={item.id} className={isTop ? 'position-row-top' : ''}>
                    <th scope="row">
                      <div className="position-name-main">
                        <span className="position-name-text">{item.name}</span>
                        {isTop && (
                          <span className="position-top-badge">
                            <Crown size={16} weight="fill" />
                            Highest Authority
                          </span>
                        )}
                      </div>
                    </th>
                    <td>
                      {isTop ? (
                        <span className="position-superior-root">
                          Highest Level (No Superior)
                        </span>
                      ) : directSuperiors.length > 0 ? (
                        <div className="position-superiors-flex">
                          {directSuperiors.map((sup) => (
                            <span key={sup.id} className="position-superior-tag">
                              <ArrowElbowDownRight size={15} weight="bold" />
                              <span>{sup.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="position-superior-tag none">
                          <span>None</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`position-subordinate-count ${directSubordinates.length > 0 ? 'has-children' : ''}`}>
                        <Users size={16} weight="bold" />
                        <span>{directSubordinates.length} {directSubordinates.length === 1 ? 'position' : 'positions'}</span>
                      </span>
                    </td>
                    <td className="col-pos-actions-cell">
                      <div className="position-action-dropdown" ref={activeMenuId === item.id ? menuRef : null}>
                        <button
                          type="button"
                          className={`position-action-trigger ${activeMenuId === item.id ? 'active' : ''}`}
                          aria-label={`Actions for ${item.name}`}
                          aria-haspopup="menu"
                          aria-expanded={activeMenuId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === item.id ? null : item.id);
                          }}
                        >
                          <DotsThreeVertical size={24} weight="bold" />
                        </button>
                        {activeMenuId === item.id && (
                          <>
                            <div 
                              className="position-backdrop-overlay" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                              }} 
                            />
                            <div className="position-dropdown-menu" role="menu">
                              <button
                                type="button"
                                className="position-dropdown-item"
                                role="menuitem"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  p.open('hierarchy', item);
                                }}
                              >
                                <TreeStructure size={18} weight="bold" />
                                <span>View hierarchy</span>
                              </button>
                              {canSetSuperiors(item, p.positions) && (
                                <button
                                  type="button"
                                  className="position-dropdown-item"
                                  role="menuitem"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    p.open('relationship', item);
                                  }}
                                >
                                  <ArrowElbowDownRight size={18} weight="bold" />
                                  <span>Set superiors</span>
                                </button>
                              )}
                              <button
                                type="button"
                                className="position-dropdown-item"
                                role="menuitem"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  p.open('edit', item);
                                }}
                              >
                                <PencilSimple size={18} weight="bold" />
                                <span>Edit position</span>
                              </button>
                              {item.id !== TOP_POSITION_ID && (
                                <button
                                  type="button"
                                  className="position-dropdown-item danger"
                                  role="menuitem"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    p.open('delete', item);
                                  }}
                                >
                                  <Trash size={18} weight="bold" />
                                  <span>Delete position</span>
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
        {!p.filtered.length && <div className="position-empty"><h2>{p.query ? 'No matching positions' : 'No positions yet'}</h2><p>{p.query ? 'Try another keyword or clear your search.' : 'Add your first position to start building the hierarchy.'}</p><button className="position-button" onClick={() => p.query ? p.setQuery('') : p.open('edit')}>{p.query ? 'Clear search' : 'Add position'}</button></div>}
        <footer className="position-table-footer">Showing {p.filtered.length} of {p.positions.length} {p.positions.length === 1 ? 'position' : 'positions'}</footer>
      </div>
      <p className="position-bottom-note">You can rename the top position to suit your building, but you cannot delete it. All other positions report to it directly or indirectly.</p>
    </>}
    {(p.dialog?.kind === 'edit' || p.dialog?.kind === 'relationship') && <PositionForm key={`${p.dialog.kind}-${p.dialog.position?.id || 'new'}`} p={p} relationship={p.dialog.kind === 'relationship'} />}
    {p.dialog?.kind === 'hierarchy' && <Hierarchy p={p} />}
    {p.dialog?.kind === 'delete' && <PositionDialog title={`Delete ${p.dialog.position.name}?`} onClose={p.close}>
      <div className="position-dialog-body"><p>{p.positions.some((item) => getParentIds(item).includes(p.dialog.position.id)) ? 'This position still has direct subordinates. Assign them to another superior before deleting this position.' : 'This position will be removed from the list and the organizational hierarchy.'}</p>{p.error && <p role="alert" className="position-error">{p.error}</p>}</div>
      <footer className="position-dialog-footer"><button className="position-button" onClick={p.close}>Cancel</button><button className="position-button destructive" disabled={p.positions.some((item) => getParentIds(item).includes(p.dialog.position.id))} onClick={() => p.remove(p.dialog.position)}>Delete position</button></footer>
    </PositionDialog>}
    {p.successModal && (
      <PositionSuccessModal 
        title={p.successModal.title} 
        subtext={p.successModal.subtext} 
        onClose={p.closeSuccessModal} 
      />
    )}
  </section>;
}
