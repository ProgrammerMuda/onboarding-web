import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  UsersThree,
  UserCheck,
  UserMinus,
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Trash,
  Eye,
  X,
  CheckCircle,
  Warning,
  IdentificationCard,
  Envelope,
  Phone,
  Buildings,
  Briefcase,
  CalendarBlank,
  SlidersHorizontal,
  FileXls,
  ClockCounterClockwise,
  CaretDown,
  CaretLeft,
  CaretRight,
  DotsThreeVertical,
  UserPlus,
  FileArrowUp,
  FileArrowDown,
  UploadSimple
} from '@phosphor-icons/react';
import './employee.css';
import AddEmployeeView from './AddEmployeeView';
import EmployeeDetailView from './EmployeeDetailView';

export default function EmployeeView({ presenter }) {
  const {
    viewMode,
    selectedEmployee,
    openEmployeeDetail,
    closeEmployeeDetail,
    openAddEmployeePage,
    goBackToList,
    filteredEmployees,
    departments,
    divisions,
    positions,
    stats,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    divisionFilter,
    setDivisionFilter,
    getDivisionsForDept,
    getPositionsForDivision,
    modal,
    openAddModal,
    openEditModal,
    closeModal,
    saveEmployee,
    detailModal,
    openDetailModal,
    closeDetailModal,
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    successModal,
    closeSuccessModal,
    importEmployees
  } = presenter;

  // If viewMode is 'add', render the 3-Step Add Employee page
  if (viewMode === 'add') {
    return <AddEmployeeView presenter={presenter} onBack={goBackToList} />;
  }

  // If viewMode is 'detail', render the full Employee Profile Detail page matching the user's design
  if (viewMode === 'detail' && selectedEmployee) {
    return (
      <EmployeeDetailView
        presenter={presenter}
        employee={selectedEmployee}
        onBack={closeEmployeeDetail}
      />
    );
  }

  // Local form state for Add/Edit modal
  const [formData, setFormData] = useState({ ...modal.data });
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Add Employee dropdown & Import modal states
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null); // { employee, top, left, openUp }

  // Pagination state (10 records per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset to page 1 on filter or search query change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, departmentFilter, divisionFilter]);

  const totalEmployees = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize));

  // Keep currentPage within valid bounds if records change
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEmployees);
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Compute page buttons (e.g. 1, 2, ..., totalPages)
  const pages = totalPages <= 5
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : currentPage <= 3
      ? [1, 2, 3, '…', totalPages]
      : currentPage >= totalPages - 2
        ? [1, '…', totalPages - 2, totalPages - 1, totalPages]
        : [1, '…', currentPage, '…', totalPages];

  // Close dropdowns on outside click or window scroll/resize
  React.useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenuId(null);
      setMenuAnchor(null);
      setShowAddDropdown(false);
    };
    const handleScrollOrResize = () => {
      if (openMenuId) {
        setOpenMenuId(null);
        setMenuAnchor(null);
      }
    };
    if (openMenuId || showAddDropdown) {
      window.addEventListener('click', handleOutsideClick);
    }
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [openMenuId, showAddDropdown]);

  // Action Menu Toggle with intelligent auto-flip (opens upwards for bottom rows)
  const handleToggleActionMenu = (e, emp) => {
    e.stopPropagation();
    if (openMenuId === emp.id) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 135;
    const dropdownWidth = 175;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < dropdownHeight + 15;

    let left = rect.right - dropdownWidth;
    if (left < 10) left = 10;
    if (left + dropdownWidth > window.innerWidth - 10) {
      left = window.innerWidth - dropdownWidth - 10;
    }

    const top = openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4;

    setOpenMenuId(emp.id);
    setMenuAnchor({
      employee: emp,
      top,
      left,
      openUp
    });
  };

  React.useEffect(() => {
    if (modal.isOpen) {
      setFormData({ ...modal.data });
    }
  }, [modal.isOpen, modal.data]);

  // Divisions available for the current department in modal
  const modalDivisions = getDivisionsForDept(formData.departmentId);

  const modalPositions = React.useMemo(() => {
    if (formData.divisionId && typeof getPositionsForDivision === 'function') {
      return getPositionsForDivision(formData.divisionId);
    }
    return positions;
  }, [formData.divisionId, getPositionsForDivision, positions]);

  // Department name lookup helper
  const getDeptName = (deptId) => {
    const d = departments.find((item) => item.id === deptId);
    if (d) return d.name;
    if (deptId === 'dept-eng') return 'Engineering';
    if (deptId === 'dept-bs' || deptId === 'dept-sec' || deptId === 'dept-hk') return 'Building Service';
    if (deptId === 'dept-bm') return 'Building Management';
    if (deptId === 'dept-tr') return 'Tenant Relation';
    if (deptId === 'dept-fin') return 'Finance & Accounting';
    return 'Building Management';
  };

  // Division name lookup helper
  const getDivName = (divId, deptId = '') => {
    const div = divisions.find((item) => item.id === divId);
    if (div) return div.name;
    if (divId === 'div-eng') return 'Engineering';
    if (divId === 'div-sec') return 'Security';
    if (divId === 'div-hk') return 'House Keeping';
    if (divId === 'div-bm') return 'General Operation';
    if (divId === 'div-tr') return 'Tenant Relation';
    if (divId === 'div-fin') return 'Finance';
    // Fallback based on department so dummy data always displays division
    if (deptId === 'dept-eng') return 'Engineering';
    if (deptId === 'dept-bs' || deptId === 'dept-sec') return 'Security';
    if (deptId === 'dept-hk') return 'House Keeping';
    if (deptId === 'dept-bm') return 'General Operation';
    if (deptId === 'dept-tr') return 'Tenant Relation';
    if (deptId === 'dept-fin') return 'Finance';
    return 'General Operation';
  };

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = ['ID', 'NIP', 'Nama', 'Email', 'Telepon', 'Departemen', 'Divisi', 'Jabatan', 'Join Date', 'End Date', 'Status', 'Resign Date'];
    const rows = filteredEmployees.map((emp) => {
      const dept = getDeptName(emp.departmentId);
      const div = getDivName(emp.divisionId, emp.departmentId);
      return [
        emp.id,
        emp.nik,
        `"${(emp.name || '').replace(/"/g, '""')}"`,
        emp.email,
        emp.phone || '',
        `"${dept}"`,
        `"${div}"`,
        `"${emp.position || ''}"`,
        emp.joinDate || '',
        emp.endDate || '',
        emp.status || '',
        emp.resignDate || ''
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Download Template handler
  const handleDownloadTemplate = () => {
    const csvContent =
      'NIP,Full Name,Work Email,Phone,Department Code,Division Code,Position,Join Date (YYYY-MM-DD),End Date (YYYY-MM-DD),Status\n' +
      '3171015508920020,Suryadi Pratama,suryadi@indoland.co.id,0812-3456-7899,ENG,ENG,Staff,2025-01-01,2026-01-01,Active\n' +
      '3171015508920021,Ani Wijaya,ani.w@indoland.co.id,0813-8877-9911,BS,SEC,Danru,2025-02-01,2026-02-01,Active\n' +
      '3171015508920022,Bambang Kusuma,bambang.k@indoland.co.id,0815-1122-3344,BM,GEN,Building Manager,2025-03-01,2026-03-01,Active\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Employee_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV File reading and parsing for bulk import
  const handleFileSelected = (file) => {
    if (!file) return;
    setImportFile(file);
    setImportError('');
    setImportPreview([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          setImportError('File is empty or only contains headers.');
          return;
        }

        const rows = lines.slice(1);
        const parsedRecords = [];

        rows.forEach((line, idx) => {
          const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 2 && cols[0]) {
            const nip = cols[0];
            const name = cols[1] || `Employee ${idx + 1}`;
            const email = cols[2] || `${nip.toLowerCase()}@indoland.co.id`;
            const phone = cols[3] || '—';
            const deptCode = (cols[4] || 'BM').toUpperCase();
            const divCode = (cols[5] || 'GEN').toUpperCase();
            const pos = cols[6] || 'Staff';
            const join = cols[7] || new Date().toISOString().slice(0, 10);
            const end = cols[8] || '';
            const status = cols[9] || 'Active';

            let deptId = 'dept-bm';
            if (deptCode.includes('ENG')) deptId = 'dept-eng';
            else if (deptCode.includes('BS') || deptCode.includes('SEC') || deptCode.includes('HK')) deptId = 'dept-bs';
            else if (deptCode.includes('TR')) deptId = 'dept-tr';
            else if (deptCode.includes('FIN')) deptId = 'dept-fin';

            let divId = 'div-bm';
            if (divCode.includes('ENG')) divId = 'div-eng';
            else if (divCode.includes('SEC')) divId = 'div-sec';
            else if (divCode.includes('HK')) divId = 'div-hk';
            else if (divCode.includes('TR')) divId = 'div-tr';
            else if (divCode.includes('FIN')) divId = 'div-fin';

            parsedRecords.push({
              nik: nip,
              name,
              email,
              phone,
              departmentId: deptId,
              divisionId: divId,
              position: pos,
              joinDate: join,
              endDate: end,
              status
            });
          }
        });

        if (parsedRecords.length === 0) {
          setImportError('No valid employee records found in the selected CSV file.');
        } else {
          setImportPreview(parsedRecords);
        }
      } catch (err) {
        setImportError('Failed to read file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;
    if (importEmployees) {
      importEmployees(importPreview);
    }
    setImportModalOpen(false);
    setImportFile(null);
    setImportPreview([]);
  };

  return (
    <div className="emp-container">
      {/* 1. Breadcrumb matching screenshot */}
      <div className="emp-breadcrumb">
        <span className="emp-breadcrumb-item">HR Parameter</span>
        <span className="emp-breadcrumb-sep">&gt;</span>
        <span className="emp-breadcrumb-current">Employees</span>
      </div>

      {/* 2. Top Hero Banner matching Organization Structure */}
      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <div className="emp-hero-banner-icon-box">
              <UsersThree size={28} weight="bold" />
            </div>
            <div>
              <div className="emp-hero-banner-tag">PEOPLE MANAGEMENT</div>
              <h1 className="emp-hero-banner-title">Employee directory</h1>
              <p className="emp-hero-banner-desc">
                Manage employee profiles and organization details in one place.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Statistics: 3 Separate Stat Cards matching Organization Structure */}
      <div className="emp-stats-grid">
        <div className="emp-stat-card">
          <div className="emp-stat-icon-wrap total">
            <UsersThree size={22} weight="bold" />
          </div>
          <div className="emp-stat-content">
            <span className="emp-stat-label">Total Employees</span>
            <span className="emp-stat-number">{stats.total}</span>
          </div>
        </div>

        <div className="emp-stat-card">
          <div className="emp-stat-icon-wrap active">
            <UserCheck size={22} weight="bold" />
          </div>
          <div className="emp-stat-content">
            <span className="emp-stat-label">Active Employees</span>
            <span className="emp-stat-number">{stats.active}</span>
          </div>
        </div>

        <div className="emp-stat-card">
          <div className="emp-stat-icon-wrap resigned">
            <UserMinus size={22} weight="bold" />
          </div>
          <div className="emp-stat-content">
            <span className="emp-stat-label">Resigned / Inactive</span>
            <span className="emp-stat-number">{stats.resigned}</span>
          </div>
        </div>
      </div>

      {/* 4. Main Card Container */}
      <div className="emp-card-container">
        {/* Card Header & Actions */}
        <div className="emp-card-header">
          <div>
            <h2 className="emp-card-title">Employees</h2>
            <p className="emp-card-desc">
              Browse staff records, organization placement, and access roles.
            </p>
          </div>
          <div className="emp-card-actions">
            <button
              type="button"
              className="emp-btn-secondary"
              onClick={handleExportCsv}
              title="Export data to CSV format"
            >
              <FileXls size={16} weight="bold" />
              <span>Export</span>
            </button>
            <button
              type="button"
              className={`emp-btn-secondary ${statusFilter === 'Resigned' ? 'active' : ''}`}
              onClick={() => setStatusFilter((prev) => (prev === 'Resigned' ? 'all' : 'Resigned'))}
              title="Show resigned / inactive employee history"
            >
              <ClockCounterClockwise size={15} weight="bold" />
              <span>Resigned History</span>
            </button>
            <div className="emp-add-dropdown-wrap" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={`emp-btn-primary ${showAddDropdown ? 'active' : ''}`}
                onClick={() => setShowAddDropdown((prev) => !prev)}
              >
                <Plus size={16} weight="bold" />
                <span>Add employee</span>
                <CaretDown
                  size={12}
                  weight="bold"
                  style={{
                    marginLeft: '2px',
                    transform: showAddDropdown ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease'
                  }}
                />
              </button>

              {showAddDropdown && (
                <div className="emp-add-dropdown-menu">
                  <button
                    type="button"
                    className="emp-add-dropdown-item"
                    onClick={() => {
                      setShowAddDropdown(false);
                      openAddEmployeePage();
                    }}
                  >
                    <div className="emp-add-item-icon">
                      <UserPlus size={18} weight="bold" />
                    </div>
                    <div className="emp-add-item-text">
                      <span className="emp-add-item-title">Add Employee Manually</span>
                      <span className="emp-add-item-desc">Fill in employee information directly via form</span>
                    </div>
                  </button>

                  <div className="emp-dropdown-divider" />

                  <button
                    type="button"
                    className="emp-add-dropdown-item"
                    onClick={() => {
                      setShowAddDropdown(false);
                      setImportModalOpen(true);
                    }}
                  >
                    <div className="emp-add-item-icon secondary">
                      <FileArrowUp size={18} weight="bold" />
                    </div>
                    <div className="emp-add-item-text">
                      <span className="emp-add-item-title">Import Employees (Excel / CSV)</span>
                      <span className="emp-add-item-desc">Bulk upload records from a spreadsheet file</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="emp-add-dropdown-item"
                    onClick={() => {
                      setShowAddDropdown(false);
                      handleDownloadTemplate();
                    }}
                  >
                    <div className="emp-add-item-icon download">
                      <FileArrowDown size={18} weight="bold" />
                    </div>
                    <div className="emp-add-item-text">
                      <span className="emp-add-item-title">Download Template</span>
                      <span className="emp-add-item-desc">Download standardized CSV template</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Row & Filter Trigger matching Org Structure */}
        <div className="emp-search-row">
          <div className="emp-search-input-group">
            <MagnifyingGlass size={16} weight="bold" className="emp-search-input-icon" />
            <input
              type="text"
              className="emp-search-input"
              placeholder="Search by name, NIP, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
          </div>
          <button
            type="button"
            className={`emp-btn-secondary ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters((prev) => !prev)}
            title="Toggle filters"
          >
            <SlidersHorizontal size={15} weight="bold" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Panel (Shown when Filters button is clicked or if non-default filters active) */}
        {showFilters && (
          <div className="emp-filters-panel">
            <div className="emp-filters-group">
              <label className="emp-filter-label">Status</label>
              <div className="emp-status-tabs-inline">
                <button
                  type="button"
                  className={`emp-filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({stats.total})
                </button>
                <button
                  type="button"
                  className={`emp-filter-chip ${statusFilter === 'Active' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('Active')}
                >
                  Active ({stats.active})
                </button>
                <button
                  type="button"
                  className={`emp-filter-chip ${statusFilter === 'Resigned' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('Resigned')}
                >
                  Resigned / Inactive ({stats.resigned})
                </button>
              </div>
            </div>

            <div className="emp-filters-group">
              <label className="emp-filter-label">Department</label>
              <select
                className="emp-filter-select-input"
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setDivisionFilter('all');
                }}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {departmentFilter !== 'all' && getDivisionsForDept(departmentFilter).length > 0 && (
              <div className="emp-filters-group">
                <label className="emp-filter-label">Division</label>
                <select
                  className="emp-filter-select-input"
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                >
                  <option value="all">All Divisions</option>
                  {getDivisionsForDept(departmentFilter).map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(statusFilter !== 'all' || departmentFilter !== 'all' || divisionFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                className="emp-btn-reset-filters"
                onClick={() => {
                  setStatusFilter('all');
                  setDepartmentFilter('all');
                  setDivisionFilter('all');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* 4. Employee Directory Table with Container Padding */}
        <div className="emp-card-body">
          <div className="emp-table-card-inner">
            <div className="emp-table-responsive">
              <table className="emp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Contact</th>
                <th>Organization Structure</th>
                <th>Position</th>
                <th>Contract</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <UsersThree size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                      No employee records match the filter
                    </p>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Try adjusting your search query or clearing active filters
                    </span>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => {
                  const isActive = emp.status === 'Active';
                  const dept = departments.find((d) => d.id === emp.departmentId);
                  const div = divisions.find((d) => d.id === emp.divisionId);

                  return (
                    <tr key={emp.id}>
                      {/* 1. Karyawan */}
                      <td>
                        <div
                          className="emp-profile-cell"
                          style={{ cursor: 'pointer' }}
                          title="Click to view full employee profile"
                          onClick={() => openEmployeeDetail(emp)}
                        >
                          <img
                            src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={emp.name}
                            className="emp-avatar-img"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                            }}
                          />
                          <div>
                            <div className="emp-name-text emp-name-clickable">{emp.name}</div>
                            <div className="emp-nik-text">NIP: {emp.nik}</div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Kontak */}
                      <td>
                        <div className="emp-contact-text">{emp.email}</div>
                        <div className="emp-contact-sub">{emp.phone || '—'}</div>
                      </td>

                      {/* 3. Organization Structure (Department & Division) */}
                      <td>
                        <div className="emp-org-dept-text">
                          {dept ? dept.name : getDeptName(emp.departmentId)}
                        </div>
                        <div className="emp-org-div-text">
                          Division: {div ? div.name : getDivName(emp.divisionId, emp.departmentId)}
                        </div>
                      </td>

                      {/* 4. Jabatan */}
                      <td>
                        <span className="emp-pos-badge">{emp.position || 'Staff'}</span>
                      </td>

                      {/* 5. Masa Kerja: Join Date & End Date Kontrak */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '12.5px' }}>
                          <span style={{ color: '#002B7F', fontWeight: 700 }}>Join:</span> {emp.joinDate || '—'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>End:</span> {emp.endDate || '—'}
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td>
                        <span className={`emp-status-badge ${isActive ? 'active' : 'resigned'}`}>
                          <span className="emp-dot" />
                          <span>{emp.status}</span>
                        </span>
                        {!isActive && emp.resignDate && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            Resign: {emp.resignDate}
                          </div>
                        )}
                      </td>

                      {/* 7. Action (Three-dots dropdown menu rendered in Portal) */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="emp-action-menu-wrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={`emp-btn-dots ${openMenuId === emp.id ? 'active' : ''}`}
                            title="More options"
                            onClick={(e) => handleToggleActionMenu(e, emp)}
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

        {/* 5. Table Footer with Pagination Controls */}
        <div className="emp-table-footer">
          <div className="emp-table-footer-info">
            Showing <strong className="emp-text-dark">{totalEmployees === 0 ? 0 : startIndex + 1}</strong> to{' '}
            <strong className="emp-text-dark">{endIndex}</strong> of{' '}
            <strong className="emp-text-dark">{totalEmployees}</strong> employees
          </div>

          <div className="emp-pagination-controls" aria-label="Employee directory pagination">
            <button
              type="button"
              className="emp-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              title="Previous page"
              aria-label="Previous page"
            >
              <CaretLeft size={14} weight="bold" />
            </button>

            {pages.map((pg, i) =>
              pg === '…' ? (
                <span key={`ellipsis-${i}`} className="emp-page-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={pg}
                  type="button"
                  className={`emp-page-btn ${currentPage === pg ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pg)}
                >
                  {pg}
                </button>
              )
            )}

            <button
              type="button"
              className="emp-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              title="Next page"
              aria-label="Next page"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

      {/* 6. Add / Edit Employee Modal */}
      {modal.isOpen && (
        <div className="emp-modal-backdrop" onClick={closeModal}>
          <div className="emp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h3>{modal.mode === 'add' ? 'Add New Employee' : 'Edit Employee Details'}</h3>
              <button type="button" className="emp-modal-close" onClick={closeModal}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="emp-modal-body">
              {modal.error && <div className="emp-form-error">{modal.error}</div>}

              {/* Row 1: Name & NIK */}
              <div className="row g-3 mb-3">
                <div className="col-md-7">
                  <label className="emp-form-label">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Budi Santoso"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="col-md-5">
                  <label className="emp-form-label">
                    Employee NIP / ID <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 3171015508920001"
                    value={formData.nik}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nik: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="row g-3 mb-3">
                <div className="col-md-7">
                  <label className="emp-form-label">
                    Work Email <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@indoland.co.id"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="col-md-5">
                  <label className="emp-form-label">Phone Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={15}
                    className="form-control font-monospace"
                    placeholder="81234567890"
                    value={formData.phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
                      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Department, Division, & Position */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="emp-form-label">
                    Department <span className="req">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.departmentId}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        departmentId: newDept,
                        divisionId: '' // reset division if dept changes
                      }));
                    }}
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="emp-form-label">Division (Optional)</label>
                  <select
                    className="form-select"
                    value={formData.divisionId}
                    disabled={modalDivisions.length === 0}
                    onChange={(e) => {
                      const nextDivId = e.target.value;
                      const nextPositions = typeof getPositionsForDivision === 'function'
                        ? getPositionsForDivision(nextDivId)
                        : positions;
                      const isValid = nextPositions.some((p) => p.name === formData.position);
                      setFormData((prev) => ({
                        ...prev,
                        divisionId: nextDivId,
                        position: isValid ? prev.position : (nextPositions[0]?.name || '')
                      }));
                    }}
                  >
                    <option value="">
                      {modalDivisions.length === 0 ? 'No divisions available' : 'Select Division'}
                    </option>
                    {modalDivisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="emp-form-label">
                    Position <span className="req">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.position}
                    disabled={!formData.divisionId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                  >
                    <option value="" disabled>
                      {!formData.divisionId ? 'Select division first' : 'Select Position'}
                    </option>
                    {modalPositions.map((p) => (
                      <option key={p.id || p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Tenure (Contract Start & End Date) & Status */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="emp-form-label">
                    Contract Start Date (Join Date) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.joinDate || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, joinDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="emp-form-label">
                    Contract End Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="emp-form-label">Employee Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Resignation Date (Only if Resigned/Inactive) */}
              {formData.status !== 'Active' && (
                <div className="mb-3">
                  <label className="emp-form-label">Resignation / Departure Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.resignDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, resignDate: e.target.value }))}
                  />
                </div>
              )}

              {/* Profile Photo / Avatar URL */}
              <div>
                <label className="emp-form-label">Profile Photo URL (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://..."
                  value={formData.avatar}
                  onChange={(e) => setFormData((prev) => ({ ...prev, avatar: e.target.value }))}
                />
              </div>
            </div>
            <div className="emp-modal-footer">
              <button type="button" className="emp-btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className="emp-btn-save"
                onClick={() => saveEmployee(formData)}
              >
                {modal.mode === 'add' ? 'Save Employee' : 'Update Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Employee Profile Detail Modal */}
      {detailModal.isOpen && detailModal.employee && (
        <div className="emp-modal-backdrop" onClick={closeDetailModal}>
          <div className="emp-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="emp-modal-header">
              <h3>Employee Profile</h3>
              <button type="button" className="emp-modal-close" onClick={closeDetailModal}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="emp-modal-body">
              {/* Header Card */}
              <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-4">
                <img
                  src={detailModal.employee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={detailModal.employee.name}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {detailModal.employee.name}
                  </h4>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {detailModal.employee.position} &bull; Fixed-term Contract
                  </div>
                </div>
              </div>

              {/* Data List */}
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between pb-2 border-bottom">
                  <span className="text-muted d-flex align-items-center gap-2">
                    <IdentificationCard size={16} /> Employee NIP
                  </span>
                  <span className="fw-semibold">{detailModal.employee.nik}</span>
                </div>
                <div className="d-flex justify-content-between pb-2 border-bottom">
                  <span className="text-muted d-flex align-items-center gap-2">
                    <Envelope size={16} /> Email
                  </span>
                  <span className="fw-semibold">{detailModal.employee.email}</span>
                </div>
                <div className="d-flex justify-content-between pb-2 border-bottom">
                  <span className="text-muted d-flex align-items-center gap-2">
                    <Phone size={16} /> Phone
                  </span>
                  <span className="fw-semibold">{detailModal.employee.phone || '—'}</span>
                </div>
                <div className="d-flex justify-content-between pb-2 border-bottom">
                  <span className="text-muted d-flex align-items-center gap-2">
                    <Buildings size={16} /> Department
                  </span>
                  <span className="fw-semibold">{getDeptName(detailModal.employee.departmentId)}</span>
                </div>
                <div className="d-flex justify-content-between pb-2 border-bottom">
                  <span className="text-muted d-flex align-items-center gap-2">
                    <Briefcase size={16} /> Division
                  </span>
                  <span className="fw-semibold">
                    {getDivName(detailModal.employee.divisionId, detailModal.employee.departmentId)}
                  </span>
                </div>
                <div className="d-flex justify-content-between pb-2 border-bottom">
                  <span className="text-muted d-flex align-items-center gap-2">
                    <CalendarBlank size={16} /> Contract Start (Join Date)
                  </span>
                  <span className="fw-semibold">{detailModal.employee.joinDate || '—'}</span>
                </div>
                <div className="d-flex justify-content-between pb-2 border-bottom">
                  <span className="text-muted d-flex align-items-center gap-2">
                    <CalendarBlank size={16} /> Contract End Date
                  </span>
                  <span className="fw-semibold text-danger">{detailModal.employee.endDate || '—'}</span>
                </div>
                {detailModal.employee.resignDate && (
                  <div className="d-flex justify-content-between pb-2 border-bottom">
                    <span className="text-muted d-flex align-items-center gap-2">
                      <CalendarBlank size={16} /> Resignation Date
                    </span>
                    <span className="fw-semibold text-danger">{detailModal.employee.resignDate}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between pb-2 border-bottom">
                  <span className="text-muted">Status</span>
                  <span className={`emp-status-badge ${detailModal.employee.status === 'Active' ? 'active' : 'resigned'}`}>
                    <span className="emp-dot" />
                    <span>{detailModal.employee.status}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="emp-modal-footer">
              <button type="button" className="emp-btn-cancel" onClick={closeDetailModal}>
                Close
              </button>
              <button
                type="button"
                className="emp-btn-save"
                onClick={() => {
                  closeDetailModal();
                  openEditModal(detailModal.employee);
                }}
              >
                Edit This Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.employee && (
        <div className="emp-modal-backdrop" onClick={closeDeleteModal}>
          <div className="emp-modal-card text-center p-4" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="d-flex justify-content-center mb-3">
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Warning size={32} color="#dc2626" weight="bold" />
              </div>
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Delete Employee?
            </h4>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px' }}>
              Are you sure you want to delete <strong>&ldquo;{deleteModal.employee.name}&rdquo;</strong> (NIP: {deleteModal.employee.nik})? This record will be permanently removed from the directory.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button type="button" className="emp-btn-cancel" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button type="button" className="emp-btn-danger" onClick={confirmDelete}>
                Yes, Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Success Feedback Modal */}
      {successModal && (
        <div className="emp-modal-backdrop" onClick={closeSuccessModal}>
          <div className="emp-modal-card text-center p-4" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="d-flex justify-content-center mb-3">
              <CheckCircle size={56} weight="fill" color="#10B981" />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              {successModal.title}
            </h4>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px' }}>
              {successModal.subtext}
            </p>
            <button
              type="button"
              className="emp-btn-save w-100"
              onClick={closeSuccessModal}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 10. Bulk Import Employees Modal */}
      {importModalOpen && (
        <div className="emp-modal-backdrop" onClick={() => setImportModalOpen(false)}>
          <div
            className="emp-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="emp-modal-header">
              <div>
                <h3 className="emp-modal-title">Import Employees</h3>
                <p className="emp-modal-subtitle">
                  Upload a CSV or Excel file to batch add employee records to the directory.
                </p>
              </div>
              <button
                type="button"
                className="emp-modal-close"
                onClick={() => setImportModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="emp-modal-body">
              {/* Template Download Prompt Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  marginBottom: '18px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileArrowDown size={22} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
                      Need the standard format?
                    </div>
                    <div style={{ fontSize: '12px', color: '#15803d' }}>
                      Download our template with pre-formatted column headers.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="emp-btn-secondary"
                  onClick={handleDownloadTemplate}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <FileArrowDown size={14} weight="bold" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                className={`emp-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelected(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => document.getElementById('emp-import-file-input')?.click()}
              >
                <input
                  id="emp-import-file-input"
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#002B7F'
                    }}
                  >
                    <UploadSimple size={26} weight="bold" />
                  </div>
                </div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
                  {importFile ? importFile.name : 'Click to upload or drag & drop CSV file'}
                </p>
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Supported formats: CSV (UTF-8 formatted). Max 500 rows per batch.
                </span>
              </div>

              {/* Error Alert */}
              {importError && (
                <div className="emp-form-error" style={{ marginTop: '14px' }}>
                  {importError}
                </div>
              )}

              {/* Parsed Preview Table */}
              {importPreview.length > 0 && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '16px',
                      marginBottom: '8px'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                      Ready to Import ({importPreview.length} records detected)
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>
                      &bull; Verification passed
                    </span>
                  </div>

                  <div className="emp-import-preview-box">
                    <table className="emp-import-preview-table">
                      <thead>
                        <tr>
                          <th>NIP</th>
                          <th>Full Name</th>
                          <th>Department</th>
                          <th>Division</th>
                          <th>Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{row.nik}</td>
                            <td>{row.name}</td>
                            <td>{getDeptName(row.departmentId)}</td>
                            <td>{getDivName(row.divisionId, row.departmentId)}</td>
                            <td>{row.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importPreview.length > 5 && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                      ...and {importPreview.length - 5} more records
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="emp-modal-footer">
              <button
                type="button"
                className="emp-btn-cancel"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportFile(null);
                  setImportPreview([]);
                  setImportError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="emp-btn-save"
                disabled={importPreview.length === 0}
                onClick={handleConfirmImport}
                style={{
                  opacity: importPreview.length === 0 ? 0.6 : 1,
                  cursor: importPreview.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Import {importPreview.length > 0 ? `(${importPreview.length}) Employees` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Action Dropdown rendered in Portal (in front of table card, never clipped on bottom rows) */}
      {openMenuId && menuAnchor && typeof document !== 'undefined' && createPortal(
        <div
          className="emp-action-dropdown-portal"
          style={{
            position: 'fixed',
            top: `${menuAnchor.top}px`,
            left: `${menuAnchor.left}px`,
            zIndex: 99999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="emp-dropdown-item"
            onClick={() => {
              const emp = menuAnchor.employee;
              setOpenMenuId(null);
              setMenuAnchor(null);
              openDetailModal(emp);
            }}
          >
            <Eye size={15} />
            <span>View Full Profile</span>
          </button>
          <button
            type="button"
            className="emp-dropdown-item"
            onClick={() => {
              const emp = menuAnchor.employee;
              setOpenMenuId(null);
              setMenuAnchor(null);
              openEditModal(emp);
            }}
          >
            <PencilSimple size={15} />
            <span>Edit Information</span>
          </button>
          <div className="emp-dropdown-divider" />
          <button
            type="button"
            className="emp-dropdown-item danger"
            onClick={() => {
              const emp = menuAnchor.employee;
              setOpenMenuId(null);
              setMenuAnchor(null);
              openDeleteModal(emp);
            }}
          >
            <Trash size={15} />
            <span>Delete Employee</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
