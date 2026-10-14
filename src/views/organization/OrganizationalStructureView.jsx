import React, { useState, useEffect } from 'react';
import {
  Buildings,
  Plus,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  X,
  Users,
  ArrowElbowDownRight,
  IdentificationBadge,
  Warning,
  TreeStructure,
  Crown,
  Table,
  CaretDown,
  IdentificationCard
} from '@phosphor-icons/react';
import { useOrgStructurePresenter } from '../../presenters/useOrgStructurePresenter';
import './organization-structure.css';

function OrgPositionNode({
  pos,
  divPositions = [],
  searchQuery,
  activeActionMenuId,
  setActiveActionMenuId,
  openAddPosModal,
  openEditPosModal,
  openDeleteModal
}) {
  const children = divPositions.filter((p) => p.superiorId === pos.id);
  const isHighlighted =
    Boolean(searchQuery.trim()) &&
    pos.name.toLowerCase().includes(searchQuery.toLowerCase());

  const isMenuOpen = activeActionMenuId === pos.id;

  return (
    <div className={`org-chart-branch ${isMenuOpen ? 'menu-open' : ''}`}>
      <div className={`org-chart-card position ${isHighlighted ? 'highlighted' : ''} ${isMenuOpen ? 'menu-open' : ''}`}>
        <div className="org-chart-card-header">
          <div className="org-chart-card-icon pos">
            <IdentificationCard size={16} weight="bold" color="#475569" />
          </div>
          <div className="org-chart-title-block">
            <span className="org-chart-card-eyebrow">Position</span>
            <span className="org-chart-card-title" title={pos.name}>
              {pos.name}
            </span>
          </div>
        </div>

        <div className="org-chart-card-actions">
          <button
            type="button"
            className="org-chart-btn-subordinate"
            onClick={() => openAddPosModal(pos.divisionId, pos.id)}
            title={`Add subordinate under ${pos.name}`}
          >
            + Add subordinate
          </button>
          <div
            className={`org-chart-action-dropdown-wrap ${isMenuOpen ? 'menu-open' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="org-chart-btn-actions"
              onClick={(e) => {
                e.stopPropagation();
                setActiveActionMenuId(isMenuOpen ? null : pos.id);
              }}
            >
              <span>Actions</span>
              <CaretDown size={11} weight="bold" />
            </button>
            {isMenuOpen && (
              <div
                className="org-chart-action-popover"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="org-chart-popover-item"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveActionMenuId(null);
                    openEditPosModal(pos);
                  }}
                >
                  <PencilSimple size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="org-chart-popover-item danger"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveActionMenuId(null);
                    openDeleteModal('position', pos);
                  }}
                >
                  <Trash size={13} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <>
          <div className="org-chart-line-down" />
          <div className="org-chart-children-row">
            {children.map((child) => (
              <OrgPositionNode
                key={child.id}
                pos={child}
                divPositions={divPositions}
                searchQuery={searchQuery}
                activeActionMenuId={activeActionMenuId}
                setActiveActionMenuId={setActiveActionMenuId}
                openAddPosModal={openAddPosModal}
                openEditPosModal={openEditPosModal}
                openDeleteModal={openDeleteModal}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrgDivisionNode({
  div,
  searchQuery,
  activeActionMenuId,
  setActiveActionMenuId,
  openAddPosModal,
  openEditPosModal,
  openDeleteModal,
  openEditDivModal
}) {
  const isMenuOpen = activeActionMenuId === div.id;
  const isHighlighted =
    Boolean(searchQuery.trim()) &&
    div.name.toLowerCase().includes(searchQuery.toLowerCase());

  const divPositions = div.positions || [];
  const topPositions = divPositions.filter(
    (pos) => !divPositions.some((other) => other.id === pos.superiorId)
  );

  return (
    <div className={`org-chart-branch ${isMenuOpen ? 'menu-open' : ''}`}>
      <div className={`org-chart-card division ${isHighlighted ? 'highlighted' : ''} ${isMenuOpen ? 'menu-open' : ''}`}>
        <div className="org-chart-card-header">
          <div className="org-chart-card-icon div">
            <TreeStructure size={16} weight="bold" color="#0088cc" />
          </div>
          <div className="org-chart-title-block">
            <span className="org-chart-card-eyebrow">Division</span>
            <span className="org-chart-card-title" title={div.name}>
              {div.name}
            </span>
          </div>
          <span className="org-chart-card-badge">
            {divPositions.length} pos
          </span>
        </div>

        <div className="org-chart-card-actions">
          <button
            type="button"
            className="org-chart-btn-subordinate"
            onClick={() => openAddPosModal(div.id)}
            title={`Add position to ${div.name}`}
          >
            + Add position
          </button>
          <div
            className={`org-chart-action-dropdown-wrap ${isMenuOpen ? 'menu-open' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="org-chart-btn-actions"
              onClick={(e) => {
                e.stopPropagation();
                setActiveActionMenuId(isMenuOpen ? null : div.id);
              }}
            >
              <span>Actions</span>
              <CaretDown size={11} weight="bold" />
            </button>
            {isMenuOpen && (
              <div
                className="org-chart-action-popover"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="org-chart-popover-item"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveActionMenuId(null);
                    openEditDivModal(div);
                  }}
                >
                  <PencilSimple size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="org-chart-popover-item danger"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveActionMenuId(null);
                    openDeleteModal('division', div);
                  }}
                >
                  <Trash size={13} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {divPositions.length === 0 ? (
        <>
          <div className="org-chart-line-down" />
          <div className="org-chart-children-row">
            <div className="org-chart-branch">
              <div className="org-chart-card empty-pos">
                <span className="org-chart-empty-label">No positions yet</span>
                <button
                  type="button"
                  className="org-chart-btn-subordinate"
                  onClick={() => openAddPosModal(div.id)}
                >
                  + Add position
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="org-chart-line-down" />
          <div className="org-chart-children-row">
            {topPositions.map((pos) => (
              <OrgPositionNode
                key={pos.id}
                pos={pos}
                divPositions={divPositions}
                searchQuery={searchQuery}
                activeActionMenuId={activeActionMenuId}
                setActiveActionMenuId={setActiveActionMenuId}
                openAddPosModal={openAddPosModal}
                openEditPosModal={openEditPosModal}
                openDeleteModal={openDeleteModal}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrgDepartmentNode({
  dept,
  searchQuery,
  activeActionMenuId,
  setActiveActionMenuId,
  openAddDivModal,
  openEditDeptModal,
  openAddPosModal,
  openEditPosModal,
  openEditDivModal,
  openDeleteModal
}) {
  const isMenuOpen = activeActionMenuId === dept.id;
  const isHighlighted =
    Boolean(searchQuery.trim()) &&
    dept.name.toLowerCase().includes(searchQuery.toLowerCase());

  const deptDivisions = dept.divisions || [];

  return (
    <div className={`org-chart-branch ${isMenuOpen ? 'menu-open' : ''}`}>
      <div className={`org-chart-card department ${isHighlighted ? 'highlighted' : ''} ${isMenuOpen ? 'menu-open' : ''}`}>
        <div className="org-chart-card-header">
          <div className="org-chart-card-icon dept">
            <Buildings size={16} weight="bold" color="#002B7F" />
          </div>
          <div className="org-chart-title-block">
            <span className="org-chart-card-eyebrow">Department</span>
            <span className="org-chart-card-title" title={dept.name}>
              {dept.name}
            </span>
          </div>
          <span className="org-chart-card-badge">
            {deptDivisions.length} {deptDivisions.length === 1 ? 'div' : 'divs'}
          </span>
        </div>

        <div className="org-chart-card-actions">
          <button
            type="button"
            className="org-chart-btn-subordinate"
            onClick={() => openAddDivModal(dept.id)}
            title={`Add division to ${dept.name}`}
          >
            + Add division
          </button>
          <div
            className={`org-chart-action-dropdown-wrap ${isMenuOpen ? 'menu-open' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="org-chart-btn-actions"
              onClick={(e) => {
                e.stopPropagation();
                setActiveActionMenuId(isMenuOpen ? null : dept.id);
              }}
            >
              <span>Actions</span>
              <CaretDown size={11} weight="bold" />
            </button>
            {isMenuOpen && (
              <div
                className="org-chart-action-popover"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="org-chart-popover-item"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveActionMenuId(null);
                    openEditDeptModal(dept);
                  }}
                >
                  <PencilSimple size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="org-chart-popover-item danger"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveActionMenuId(null);
                    openDeleteModal('department', dept);
                  }}
                >
                  <Trash size={13} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {deptDivisions.length === 0 ? (
        <>
          <div className="org-chart-line-down" />
          <div className="org-chart-children-row">
            <div className="org-chart-branch">
              <div className="org-chart-card empty-pos">
                <span className="org-chart-empty-label">No divisions yet</span>
                <button
                  type="button"
                  className="org-chart-btn-subordinate"
                  onClick={() => openAddDivModal(dept.id)}
                >
                  + Add division
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="org-chart-line-down" />
          <div className="org-chart-children-row">
            {deptDivisions.map((div) => (
              <OrgDivisionNode
                key={div.id}
                div={div}
                searchQuery={searchQuery}
                activeActionMenuId={activeActionMenuId}
                setActiveActionMenuId={setActiveActionMenuId}
                openAddPosModal={openAddPosModal}
                openEditPosModal={openEditPosModal}
                openDeleteModal={openDeleteModal}
                openEditDivModal={openEditDivModal}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrganizationalStructureView() {
  const [isTreeView, setIsTreeView] = useState(false);
  const [treeZoom, setTreeZoom] = useState(1);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        event.target &&
        event.target.closest &&
        event.target.closest('.org-chart-action-dropdown-wrap, .org-chart-action-popover, .org-chart-popover-item')
      ) {
        return;
      }
      setActiveActionMenuId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    structure,
    searchQuery,
    setSearchQuery,
    filteredTree,
    unassignedPositions = [],
    totalDepartments,
    totalDivisions,
    totalPositions,

    // Root authority
    rootModal,
    setRootModal,
    closeRootModal,
    saveRootAuthority,

    // Department modal
    deptModal,
    setDeptModal,
    openAddDeptModal,
    openEditDeptModal,
    closeDeptModal,
    saveDepartment,

    // Division modal
    divModal,
    setDivModal,
    openAddDivModal,
    openEditDivModal,
    closeDivModal,
    saveDivision,

    // Position modal
    posModal,
    setPosModal,
    openAddPosModal,
    openEditPosModal,
    closePosModal,
    savePosition,
    masterPositions = [],

    // Delete modal
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,

    // Helpers
    getPositionSuperiorLabel,
    getSubordinatesList
  } = useOrgStructurePresenter();

  const targetDiv = structure.divisions.find((d) => d.id === posModal.divisionId);

  // Determine if modal submit buttons should be disabled
  const isDeptDisabled = !deptModal.name.trim();
  const isDivDisabled = !divModal.name.trim() || !divModal.departmentId;
  const isPosDisabled = !posModal.name.trim();
  const isRootDisabled = !rootModal.title.trim();

  const isRootHighlighted =
    Boolean(searchQuery.trim()) &&
    (structure.rootAuthority?.title || 'Building Manager')
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

  return (
    <div
      className="org-structure-container"
      onClick={() => {
        if (activeActionMenuId) setActiveActionMenuId(null);
      }}
    >
      {/* 1. Breadcrumb */}
      <div className="org-breadcrumb">
        <span className="org-breadcrumb-item">People &amp; organization</span>
        <span className="org-breadcrumb-sep">&gt;</span>
        <span className="org-breadcrumb-current">Organization structure</span>
      </div>

      {/* 2. Top Hero Banner */}
      <div className="org-hero-banner">
        <div className="org-hero-left">
          <div className="org-hero-icon-box">
            <TreeStructure size={28} weight="bold" />
          </div>
          <div>
            <div className="org-hero-tag">PEOPLE MANAGEMENT</div>
            <h1 className="org-hero-title">Organization structure</h1>
            <p className="org-hero-desc">
              View divisions, departments, positions, and reporting lines together.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Statistics: 3 Separate Stat Cards (Department -> Division -> Position) */}
      <div className="org-stats-grid">
        <div className="org-stat-card">
          <div className="org-stat-icon-wrap org-stat-icon-departments">
            <Buildings size={22} weight="bold" />
          </div>
          <div className="org-stat-content">
            <span className="org-stat-label">Departments</span>
            <span className="org-stat-number">{totalDepartments}</span>
          </div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-icon-wrap org-stat-icon-divisions">
            <TreeStructure size={22} weight="bold" />
          </div>
          <div className="org-stat-content">
            <span className="org-stat-label">Divisions</span>
            <span className="org-stat-number">{totalDivisions}</span>
          </div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-icon-wrap org-stat-icon-positions">
            <Users size={22} weight="bold" />
          </div>
          <div className="org-stat-content">
            <span className="org-stat-label">Positions</span>
            <span className="org-stat-number">{totalPositions}</span>
          </div>
        </div>
      </div>

      {/* 4. Organization Directory Main UNIFIED Single Card */}
      <div className="org-directory-card">
        {/* Card Header inside Directory Card: Title + Add to structure */}
        <div className="org-card-header">
          <div className="org-directory-titles">
            <h2>{isTreeView ? 'Organization tree' : 'Organization directory'}</h2>
            <p>
              {isTreeView
                ? 'Hierarchical reporting structure from Building Manager to operational roles.'
                : 'Each department shows its positions, direct superior, and direct subordinates.'}
            </p>
          </div>
          <div className="org-directory-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="org-btn-outline-header"
              onClick={() => setIsTreeView((prev) => !prev)}
            >
              {isTreeView ? (
                <>
                  <Table size={16} weight="bold" />
                  <span>View Table</span>
                </>
              ) : (
                <>
                  <TreeStructure size={16} weight="bold" />
                  <span>View Tree</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Integrated Top Toolbar inside the Card */}
        {isTreeView ? (
          <div className="org-card-toolbar org-tree-toolbar">
            <div className="org-search-input-wrapper">
              <MagnifyingGlass size={16} className="org-search-icon" />
              <input
                type="text"
                className="org-search-input"
                placeholder="Search roles, departments, or divisions in tree..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="org-tree-controls">
              <span className="org-tree-zoom-label">Zoom:</span>
              <button
                type="button"
                className="org-tree-zoom-btn"
                onClick={() => setTreeZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
                title="Zoom Out"
              >
                -
              </button>
              <span className="org-tree-zoom-val">{Math.round(treeZoom * 100)}%</span>
              <button
                type="button"
                className="org-tree-zoom-btn"
                onClick={() => setTreeZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(1))))}
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                className="org-tree-zoom-reset"
                onClick={() => setTreeZoom(1)}
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="org-card-toolbar">
            <div className="org-search-input-wrapper">
              <MagnifyingGlass size={16} className="org-search-icon" />
              <input
                type="text"
                className="org-search-input"
                placeholder="Search divisions, departments, positions, or reporting lines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Directory Card Body inside Unified Card */}
        {isTreeView ? (
          /* Tree View Org Chart Canvas */
          <div
            className="org-chart-canvas-wrapper"
            onClick={() => setActiveActionMenuId(null)}
          >
            <div
              className="org-chart-canvas"
              style={{ transform: `scale(${treeZoom})` }}
            >
              <div className="org-chart-root">
                {/* Root Authority Card (Building Manager) */}
                <div
                  className={`org-chart-card org-chart-card-root ${
                    isRootHighlighted ? 'highlighted' : ''
                  }`}
                >
                  <div className="org-chart-card-header">
                    <div className="org-chart-card-icon root">
                      <Crown size={18} weight="fill" color="#D97706" />
                    </div>
                    <div className="org-chart-title-block">
                      <span className="org-chart-card-eyebrow">Root Authority</span>
                      <span
                        className="org-chart-card-title root"
                        title={structure.rootAuthority?.title || 'Building Manager'}
                      >
                        {structure.rootAuthority?.title || 'Building Manager'}
                      </span>
                    </div>
                  </div>

                  <div className="org-chart-card-actions">
                    <button
                      type="button"
                      className="org-chart-btn-subordinate"
                      onClick={() => openAddDeptModal()}
                      title="Add department under Building Manager"
                    >
                      + Add department
                    </button>
                    <button
                      type="button"
                      className="org-chart-btn-subordinate"
                      style={{ background: '#f8fafc', color: '#475569', borderColor: '#cbd5e1' }}
                      onClick={() => openAddPosModal('', 'bm')}
                      title="Add direct staff under Building Manager"
                    >
                      + Direct staff
                    </button>
                  </div>
                </div>

                {/* Direct Branches under Root (Direct Positions + Departments) */}
                {filteredTree.length > 0 || unassignedPositions.length > 0 ? (
                  <>
                    <div className="org-chart-line-down" />
                    <div className="org-chart-children-row">
                      {/* Direct unassigned positions under BM */}
                      {unassignedPositions.map((pos) => (
                        <OrgPositionNode
                          key={pos.id}
                          pos={pos}
                          divPositions={unassignedPositions}
                          searchQuery={searchQuery}
                          activeActionMenuId={activeActionMenuId}
                          setActiveActionMenuId={setActiveActionMenuId}
                          openAddPosModal={openAddPosModal}
                          openEditPosModal={openEditPosModal}
                          openDeleteModal={openDeleteModal}
                        />
                      ))}

                      {/* Departments */}
                      {filteredTree.map((dept) => (
                        <OrgDepartmentNode
                          key={dept.id}
                          dept={dept}
                          searchQuery={searchQuery}
                          activeActionMenuId={activeActionMenuId}
                          setActiveActionMenuId={setActiveActionMenuId}
                          openAddDivModal={openAddDivModal}
                          openEditDeptModal={openEditDeptModal}
                          openAddPosModal={openAddPosModal}
                          openEditPosModal={openEditPosModal}
                          openEditDivModal={openEditDivModal}
                          openDeleteModal={openDeleteModal}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="org-chart-line-down" />
                    <div className="org-chart-empty-branch">
                      <Buildings size={32} color="#94a3b8" />
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '13px',
                          color: '#334155',
                          marginTop: '8px'
                        }}
                      >
                        No departments or positions yet
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          marginTop: '4px'
                        }}
                      >
                        Click &ldquo;+ Add department&rdquo; on Building Manager to build the hierarchy.
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Directory Card Body inside Unified Card */
          <div className="org-card-body">
          {/* BM Root Container: Dibuat seperti Department Card */}
          <div className="org-dept-container org-bm-root-container">
            {/* BM Header */}
            <div className="org-dept-header org-bm-header">
              <div className="org-dept-title-cluster">
                <div className="org-dept-icon-box org-bm-icon-box">
                  <Crown size={22} weight="fill" color="#D97706" />
                </div>
                <div className="org-dept-meta">
                  <h2>
                    <span>{structure.rootAuthority?.title || 'Building Manager'}</span>
                    <span className="org-title-badges">
                      <span className="org-root-badge">Highest Authority</span>
                    </span>
                  </h2>
                </div>
              </div>
              <div className="org-bm-stats-cluster">
                <span className="org-bm-stat-badge">
                  {totalDepartments} department{totalDepartments === 1 ? '' : 's'}
                </span>
                <span className="org-bm-stat-badge">
                  {totalDivisions} division{totalDivisions === 1 ? '' : 's'}
                </span>
                <span className="org-bm-stat-badge">
                  {totalPositions} position{totalPositions === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* BM Body: Departments under BM or Inline Empty State */}
            <div className="org-dept-body org-bm-body">
              {filteredTree.length === 0 && unassignedPositions.length === 0 ? (
                <div className="org-empty-division-inline org-bm-empty-inline">
                  <div className="org-bm-empty-icon">
                    <Buildings size={28} color="#94a3b8" />
                  </div>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13.5px' }}>
                    {searchQuery
                      ? `No departments or roles matched "${searchQuery}".`
                      : `No departments under ${structure.rootAuthority?.title || 'Building Manager'} yet.`}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    {searchQuery
                      ? 'Try adjusting your search terms.'
                      : 'No departments currently registered.'}
                  </span>
                </div>
              ) : (
                <>
                  {unassignedPositions.length > 0 && (
                    <div className="org-dept-container" style={{ marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                      <div className="org-dept-header" style={{ backgroundColor: '#f8fafc' }}>
                        <div className="org-dept-title-cluster">
                          <div className="org-dept-icon-box" style={{ backgroundColor: '#f1f5f9', color: '#0284c7' }}>
                            <IdentificationBadge size={22} weight="bold" />
                          </div>
                          <div className="org-dept-meta">
                            <h2>
                              <span>Direct / Unassigned Positions</span>
                              <span className="org-code-pill org-code-pill-secondary">
                                {unassignedPositions.length} role{unassignedPositions.length === 1 ? '' : 's'}
                              </span>
                            </h2>
                            <p className="org-dept-subtitle">
                              Positions created in Jabatan reporting directly to Building Manager or pending division assignment.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="org-dept-body" style={{ padding: '0 0 8px 0' }}>
                        <div className="org-positions-table-wrap">
                          <table className="org-positions-table">
                            <thead>
                              <tr>
                                <th className="org-col-pos">POSITION</th>
                                <th className="org-col-superior">DIRECT SUPERIOR</th>
                                <th className="org-col-subordinates">DIRECT SUBORDINATES</th>
                                <th className="org-col-actions" style={{ textAlign: 'right' }}>ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {unassignedPositions.map((pos) => {
                                const subordinates = getSubordinatesList(pos.id);
                                return (
                                  <tr key={pos.id}>
                                    <td>
                                      <div className="org-pos-title-cell">
                                        <ArrowElbowDownRight
                                          size={15}
                                          weight="bold"
                                          className="org-arrow-symbol"
                                        />
                                        <div className="org-pos-main-name">{pos.name}</div>
                                      </div>
                                    </td>
                                    <td>
                                      <span className="org-superior-name">
                                        {getPositionSuperiorLabel(pos.superiorId)}
                                      </span>
                                    </td>
                                    <td>
                                      {subordinates.length === 0 ? (
                                        <span className="org-no-subordinates">None</span>
                                      ) : (
                                        <div className="org-subordinates-cluster">
                                          {subordinates.map((sub) => (
                                            <span key={sub.id} className="org-subordinate-pill">
                                              {sub.name}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </td>


                                    <td style={{ textAlign: 'right' }}>
                                      <div className="org-pos-actions-wrap">
                                        <button
                                          type="button"
                                          className="org-btn-outline-action"
                                          title="Edit Position"
                                          onClick={() => openEditPosModal(pos)}
                                        >
                                          <PencilSimple size={14} />
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="org-btn-outline-action danger"
                                          title="Delete Position"
                                          onClick={() => openDeleteModal('position', pos)}
                                        >
                                          <Trash size={14} />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {filteredTree.map((dept) => (
              <div key={dept.id} className="org-dept-container">
              {/* Department Header */}
              <div className="org-dept-header">
                <div className="org-dept-title-cluster">
                  <div className="org-dept-icon-box">
                    <TreeStructure size={22} weight="bold" />
                  </div>
                  <div className="org-dept-meta">
                    <span className="org-dept-eyebrow">Department</span>
                    <h2>
                      <span>{dept.name}</span>
                      <span className="org-dept-div-badge">
                        {dept.divisions.length} division{dept.divisions.length === 1 ? '' : 's'}
                      </span>
                    </h2>
                  </div>
                </div>
              </div>

              {/* Department Body: Divisions or Inline Empty */}
              <div className="org-dept-body">
                {dept.divisions.length === 0 ? (
                  <div className="org-empty-division-inline">
                    <span>No divisions in this department yet.</span>
                  </div>
                ) : (
                dept.divisions.map((div) => (
                  <div key={div.id} className="org-division-card">
                    {/* Division Header */}
                    <div className="org-div-header">
                      <div className="org-div-title-cluster">
                        <span className="org-div-accent-bar" />
                        <div>
                          <span className="org-div-eyebrow">Division</span>
                          <div className="org-div-heading-row">
                            <h3>{div.name}</h3>
                            <span className="org-div-pos-count">
                              {div.positions.length} position{div.positions.length === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="org-div-actions">
                        <button
                          type="button"
                          className="org-btn-outline-primary"
                          onClick={() => openAddPosModal(div.id)}
                        >
                          <Plus size={14} weight="bold" />
                          <span>Add position</span>
                        </button>
                      </div>
                    </div>

                    {/* Positions Table */}
                    <div className="org-positions-table-wrap">
                      {div.positions.length === 0 ? (
                        <div className="org-empty-division">
                          <span>No positions in this division yet.</span>
                        </div>
                      ) : (
                        <table className="org-positions-table">
                          <thead>
                            <tr>
                              <th className="org-col-pos">POSITION</th>
                              <th className="org-col-superior">DIRECT SUPERIOR</th>
                              <th className="org-col-subordinates">DIRECT SUBORDINATES</th>
                              <th className="org-col-actions" style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {div.positions.map((pos) => {
                              const subordinates = getSubordinatesList(pos.id);
                              return (
                                <tr key={pos.id}>
                                  <td>
                                    <div className="org-pos-title-cell">
                                      <ArrowElbowDownRight
                                        size={15}
                                        weight="bold"
                                        className="org-arrow-symbol"
                                      />
                                      <div className="org-pos-main-name">{pos.name}</div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="org-superior-name">
                                      {getPositionSuperiorLabel(pos.superiorId)}
                                    </span>
                                  </td>
                                  <td>
                                    {subordinates.length === 0 ? (
                                      <span className="org-no-subordinates">No superior</span>
                                    ) : (
                                      <div className="org-subordinates-cluster">
                                        {subordinates.map((sub) => (
                                          <span key={sub.id} className="org-subordinate-pill">
                                            {sub.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>


                                  <td style={{ textAlign: 'right' }}>
                                    <div className="org-pos-actions-wrap">
                                      <button
                                        type="button"
                                        className="org-btn-outline-action"
                                        title="Edit Position"
                                        onClick={() => openEditPosModal(pos)}
                                      >
                                        <PencilSimple size={14} />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="org-btn-outline-action danger"
                                        title="Delete Position"
                                        onClick={() => openDeleteModal('position', pos)}
                                      >
                                        <Trash size={14} />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
                </>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* Root Authority Modal */}
      {rootModal.isOpen && (
        <div className="org-modal-backdrop" onClick={closeRootModal}>
          <div className="org-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="org-modal-header">
              <h3>Configure Root Governing Authority</h3>
              <button type="button" className="org-modal-close" onClick={closeRootModal}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="org-modal-body">
              {rootModal.error && <div className="org-form-error">{rootModal.error}</div>}
              <div className="org-form-group">
                <label className="org-form-label">
                  Authority Title <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="org-form-input"
                  placeholder="e.g. Building Manager / General Manager"
                  value={rootModal.title}
                  onChange={(e) =>
                    setRootModal((prev) => ({ ...prev, title: e.target.value, error: '' }))
                  }
                />
                <span className="org-form-hint">
                  The apex leadership position governing all departments and divisions (default: Building Manager).
                </span>
              </div>
            </div>
            <div className="org-modal-footer">
              <button type="button" className="org-btn-cancel" onClick={closeRootModal}>
                Cancel
              </button>
              <button
                type="button"
                className="org-btn-primary"
                disabled={isRootDisabled}
                onClick={saveRootAuthority}
              >
                Save Authority
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal (Add / Edit) */}
      {deptModal.isOpen && (
        <div className="org-modal-backdrop" onClick={closeDeptModal}>
          <div className="org-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="org-modal-header">
              <h3>{deptModal.mode === 'add' ? 'Add Department' : 'Edit Department'}</h3>
              <button type="button" className="org-modal-close" onClick={closeDeptModal}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="org-modal-body">
              {deptModal.error && <div className="org-form-error">{deptModal.error}</div>}
              {deptModal.mode === 'edit' && deptModal.code && (
                <div className="org-form-group">
                  <label className="org-form-label">Department Code</label>
                  <input
                    type="text"
                    className="org-form-input"
                    value={deptModal.code}
                    disabled
                    style={{ backgroundColor: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                  />
                </div>
              )}
              <div className="org-form-group">
                <label className="org-form-label">
                  Department Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="org-form-input"
                  placeholder="e.g. Building Operation"
                  value={deptModal.name}
                  onChange={(e) =>
                    setDeptModal((prev) => ({ ...prev, name: e.target.value, error: '' }))
                  }
                  autoFocus
                />
              </div>
              <div className="org-form-group">
                <label className="org-form-label">Reports To</label>
                <input
                  type="text"
                  className="org-form-input"
                  placeholder={`e.g. ${structure.rootAuthority?.title || 'Building Manager'}`}
                  value={deptModal.reportsTo}
                  onChange={(e) =>
                    setDeptModal((prev) => ({ ...prev, reportsTo: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="org-modal-footer">
              <button type="button" className="org-btn-cancel" onClick={closeDeptModal}>
                Cancel
              </button>
              <button
                type="button"
                className="org-btn-primary"
                disabled={isDeptDisabled}
                onClick={saveDepartment}
              >
                {deptModal.mode === 'add' ? 'Add Department' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Division Modal (Add / Edit) */}
      {divModal.isOpen && (
        <div className="org-modal-backdrop" onClick={closeDivModal}>
          <div className="org-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="org-modal-header">
              <h3>{divModal.mode === 'add' ? 'Add Division' : 'Edit Division'}</h3>
              <button type="button" className="org-modal-close" onClick={closeDivModal}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="org-modal-body">
              {divModal.error && <div className="org-form-error">{divModal.error}</div>}
              <div className="org-form-group">
                <label className="org-form-label">
                  Assigned Department <span className="req">*</span>
                </label>
                <select
                  className="org-form-select"
                  value={divModal.departmentId}
                  onChange={(e) =>
                    setDivModal((prev) => ({ ...prev, departmentId: e.target.value, error: '' }))
                  }
                >
                  <option value="" disabled>Select Department</option>
                  {structure.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
              {divModal.mode === 'edit' && divModal.code && (
                <div className="org-form-group">
                  <label className="org-form-label">Division Code</label>
                  <input
                    type="text"
                    className="org-form-input"
                    value={divModal.code}
                    disabled
                    style={{ backgroundColor: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                  />
                </div>
              )}
              <div className="org-form-group">
                <label className="org-form-label">
                  Division Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="org-form-input"
                  placeholder="e.g. MEP"
                  value={divModal.name}
                  onChange={(e) =>
                    setDivModal((prev) => ({ ...prev, name: e.target.value, error: '' }))
                  }
                  autoFocus
                />
              </div>
            </div>
            <div className="org-modal-footer">
              <button type="button" className="org-btn-cancel" onClick={closeDivModal}>
                Cancel
              </button>
              <button
                type="button"
                className="org-btn-primary"
                disabled={isDivDisabled}
                onClick={saveDivision}
              >
                {divModal.mode === 'add' ? 'Add Division' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Position Modal (Add / Edit) */}
      {posModal.isOpen && (
        <div className="org-modal-backdrop" onClick={closePosModal}>
          <div className="org-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="org-modal-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{posModal.mode === 'add' ? 'Add Position' : 'Edit Position'}</h3>
                <button type="button" className="org-modal-close" onClick={closePosModal}>
                  <X size={18} weight="bold" />
                </button>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                {targetDiv ? (
                  <>
                    Position assigned to division: <strong style={{ color: '#002B7F' }}>{targetDiv.name}</strong>
                  </>
                ) : (
                  'Position reporting directly to Building Management'
                )}
              </p>
            </div>
            <div className="org-modal-body">
              {posModal.error && <div className="org-form-error">{posModal.error}</div>}
              <div className="org-form-group">
                <label className="org-form-label">
                  Position Name <span className="req">*</span>
                </label>
                <select
                  className="org-form-select"
                  value={posModal.name}
                  onChange={(e) => {
                    const selName = e.target.value;
                    const matched = masterPositions.find((mp) => mp.name === selName);
                    setPosModal((prev) => ({
                      ...prev,
                      name: selName,
                      code: matched?.code || prev.code,
                      error: ''
                    }));
                  }}
                  autoFocus
                >
                  <option value="" disabled>Select Position from Master</option>
                  {masterPositions.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  {posModal.name && !masterPositions.some((mp) => mp.name === posModal.name) && (
                    <option value={posModal.name}>{posModal.name}</option>
                  )}
                </select>
                {masterPositions.length === 0 && (
                  <span className="org-form-hint" style={{ color: '#d97706' }}>
                    No positions available from master Jabatan. Please create positions in the Position menu first.
                  </span>
                )}
              </div>
              <div className="org-form-group">
                <label className="org-form-label">Direct Superior</label>
                <select
                  className="org-form-select"
                  value={posModal.superiorId}
                  onChange={(e) =>
                    setPosModal((prev) => ({ ...prev, superiorId: e.target.value }))
                  }
                >
                  <option value="bm">
                    {structure.rootAuthority?.title || 'Building Manager'} (Root Authority)
                  </option>
                  {structure.positions
                    .filter((p) => p.id !== posModal.id)
                    .map((p) => {
                      const div = structure.divisions.find((d) => d.id === p.divisionId);
                      const showDivSuffix =
                        div && !p.name.toLowerCase().includes(div.name.toLowerCase());
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} {showDivSuffix ? `· ${div.name}` : ''}
                        </option>
                      );
                    })}
                </select>
                <span className="org-form-hint">
                  Allows direct cross-division reporting (e.g. Chief Building Operation oversees Supervisor MEP).
                </span>
              </div>

            </div>
            <div className="org-modal-footer">
              <button type="button" className="org-btn-cancel" onClick={closePosModal}>
                Cancel
              </button>
              <button
                type="button"
                className="org-btn-primary"
                disabled={isPosDisabled}
                onClick={savePosition}
              >
                {posModal.mode === 'add' ? 'Add Position' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="org-modal-backdrop" onClick={closeDeleteModal}>
          <div className="org-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="org-modal-header">
              <h3>Delete {deleteModal.type}?</h3>
              <button type="button" className="org-modal-close" onClick={closeDeleteModal}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="org-modal-body">
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b' }}>
                Are you sure you want to delete{' '}
                <strong>&ldquo;{deleteModal.item?.name}&rdquo;</strong>?
              </p>
              {deleteModal.warning && (
                <div
                  className="org-form-error"
                  style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Warning size={18} weight="bold" />
                  <span>{deleteModal.warning}</span>
                </div>
              )}
            </div>
            <div className="org-modal-footer">
              <button type="button" className="org-btn-cancel" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button type="button" className="org-btn-danger" onClick={confirmDelete}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

