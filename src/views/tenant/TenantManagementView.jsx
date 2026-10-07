import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, 
  CaretDown, 
  UsersThree, 
  HouseLine,
  Key,
  IdentificationCard,
  UserSwitch,
  Door, 
  ShieldCheck, 
  User, 
  ArrowRight, 
  Faders, 
  MagnifyingGlass, 
  ArrowsClockwise, 
  CaretLeft, 
  CaretRight,
  Buildings,
  FileArrowUp,
  FileArrowDown,
  CheckCircle,
  Eye,
  DotsThreeVertical,
  FunnelSimple,
  X,
  Check
} from '@phosphor-icons/react';
import { TenantDetailView } from './TenantDetailView';

export function TenantManagementView({ presenter }) {
  const {
    viewMode,
    selectedTenant,
    handleViewDetails,
    stats,
    activeTab,
    setActiveTab,
    towerOptions,
    unitOptions,
    roleOptions,
    filterTower,
    setFilterTower,
    filterUnit,
    setFilterUnit,
    filterRole,
    setFilterRole,
    filterName,
    setFilterName,
    handleNameSearchChange,
    tenants,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalRecords,
    goToPageInput,
    setGoToPageInput,
    applyFilter,
    resetFilter,
    handleGoToPage
  } = presenter;

  const [isOtherActionOpen, setIsOtherActionOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const dropdownRef = useRef(null);

  // Searchable Unit Dropdown State & Ref
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const unitDropdownRef = useRef(null);
  const unitSearchInputRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOtherActionOpen(false);
      }
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) {
        setIsUnitDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when unit dropdown opens
  useEffect(() => {
    if (isUnitDropdownOpen && unitSearchInputRef.current) {
      setTimeout(() => {
        unitSearchInputRef.current?.focus();
      }, 50);
    } else {
      setUnitSearchQuery('');
    }
  }, [isUnitDropdownOpen]);

  // Filtered unit options based on unitSearchQuery
  const filteredUnitOptions = useMemo(() => {
    if (!unitSearchQuery.trim()) return unitOptions;
    const q = unitSearchQuery.toLowerCase().trim();
    return unitOptions.filter((opt) => 
      opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [unitOptions, unitSearchQuery]);

  const handleActionClick = (actionName) => {
    setIsOtherActionOpen(false);
    setNotification(`${actionName} successfully processed.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const tabsConfig = [
    { id: 'all', label: 'All Tenants', count: stats?.totalActiveTenants || 1169 },
    { id: 'owners', label: 'Owners', count: stats?.owners || 1084 },
    { id: 'renters', label: 'Renters', count: stats?.activeRenters || 85 },
    { id: 'proxies', label: 'Proxies', count: stats?.activeProxies || 14 }
  ];

  if (viewMode === 'detail') {
    return <TenantDetailView presenter={presenter} />;
  }

  return (
    <div className="w-100 position-relative">
      {/* Toast Notification */}
      {notification && (
        <div 
          className="position-fixed bottom-0 end-0 p-4" 
          style={{ zIndex: 1100 }}
        >
          <div className="alert alert-dark shadow-lg d-flex align-items-center mb-0 py-3 px-4 text-white border-0 rounded-pill" style={{ gap: '10px' }}>
            <CheckCircle size={20} className="text-info" weight="bold" />
            <span className="small fw-semibold">{notification}</span>
          </div>
        </div>
      )}

      {/* 1. Page Header with Title, Breadcrumb & Action Buttons */}
      <div 
        className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
        style={{ marginBottom: '20px' }}
      >
        <div>
          <h2 className="fw-bold mb-0.5 text-primary" style={{ fontSize: '1.65rem', letterSpacing: '-0.025em', color: '#002B7F' }}>
            All Tenants
          </h2>
          <div className="text-muted small fw-medium" style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Tenant Management
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex align-items-center gap-3">
          {/* + Add Tenant Button */}
          <button 
            type="button" 
            className="btn text-white fw-semibold px-3.5 py-2 d-flex align-items-center gap-2 shadow-none border-0"
            style={{ 
              backgroundColor: '#002B7F', 
              borderRadius: '8px', 
              fontSize: '0.875rem'
            }}
            onClick={() => handleActionClick('Add Tenant')}
          >
            <Plus size={18} weight="bold" />
            <span>Add Tenant</span>
          </button>

          {/* Other Action Dropdown Button (Outline) */}
          <div className="position-relative" ref={dropdownRef}>
            <button 
              type="button" 
              className="btn btn-outline-secondary fw-semibold px-3.5 py-2 d-flex align-items-center gap-2 shadow-none"
              style={{ 
                borderRadius: '8px', 
                fontSize: '0.875rem',
                borderColor: '#CBD5E1',
                color: '#334155',
                backgroundColor: '#FFFFFF'
              }}
              onClick={() => setIsOtherActionOpen(!isOtherActionOpen)}
            >
              <span>Other Action</span>
              <CaretDown size={14} weight="bold" className={`ms-1 transition-transform ${isOtherActionOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Premium Redesigned Dropdown Menu */}
            {isOtherActionOpen && (
              <div 
                className="position-absolute end-0 mt-2 bg-white shadow-lg border-0 py-2 px-2 z-3"
                style={{ 
                  minWidth: '260px', 
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)'
                }}
              >
                {/* 1. Import Data Tenant */}
                <button
                  type="button"
                  className="btn w-100 text-start d-flex align-items-center gap-3 p-2.5 border-0 hover-bg-light"
                  style={{
                    borderRadius: '8px',
                    transition: 'all 0.15s ease',
                    backgroundColor: 'transparent'
                  }}
                  onClick={() => handleActionClick('Import Tenant Data')}
                >
                  <div 
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: '#F1F5F9',
                      color: '#334155'
                    }}
                  >
                    <FileArrowUp size={20} weight="bold" />
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.865rem', lineHeight: '1.2' }}>
                      Import Tenant Data
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.74rem', marginTop: '2px' }}>
                      Upload Excel file with tenant records
                    </div>
                  </div>
                </button>

                {/* 2. Import Data Tenant Unit */}
                <button
                  type="button"
                  className="btn w-100 text-start d-flex align-items-center gap-3 p-2.5 border-0 hover-bg-light"
                  style={{
                    borderRadius: '8px',
                    transition: 'all 0.15s ease',
                    backgroundColor: 'transparent'
                  }}
                  onClick={() => handleActionClick('Import Tenant Unit Data')}
                >
                  <div 
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: '#F1F5F9',
                      color: '#334155'
                    }}
                  >
                    <Buildings size={20} weight="bold" />
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.865rem', lineHeight: '1.2' }}>
                      Import Tenant Unit Data
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.74rem', marginTop: '2px' }}>
                      Sync unit assignments and occupancy
                    </div>
                  </div>
                </button>

                <div className="dropdown-divider my-1.5" style={{ borderColor: '#F1F5F9' }}></div>

                {/* 3. Export Data Tenant */}
                <button
                  type="button"
                  className="btn w-100 text-start d-flex align-items-center gap-3 p-2.5 border-0 hover-bg-light"
                  style={{
                    borderRadius: '8px',
                    transition: 'all 0.15s ease',
                    backgroundColor: 'transparent'
                  }}
                  onClick={() => handleActionClick('Export Tenant Data')}
                >
                  <div 
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: '#F1F5F9',
                      color: '#334155'
                    }}
                  >
                    <FileArrowDown size={20} weight="bold" />
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.865rem', lineHeight: '1.2' }}>
                      Export Tenant Data
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.74rem', marginTop: '2px' }}>
                      Download tenant directory (.xlsx)
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards - 4 Summary Cards (Clickable for Quick Filtering) */}
      <div className="row g-3" style={{ marginBottom: '20px' }}>
        {/* TOTAL ACTIVE TENANTS */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card border-0 h-100 bg-white shadow-sm user-select-none" 
            style={{ 
              borderRadius: '12px', 
              border: activeTab === 'all' ? '2px solid #002B7F' : '1px solid #E2E8F0',
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: activeTab === 'all' ? 'translateY(-2px)' : 'none',
              boxShadow: activeTab === 'all' ? '0 8px 20px rgba(0, 43, 127, 0.12)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
            onClick={() => setActiveTab('all')}
            title="Filter: All Tenants"
          >
            <div className="d-flex align-items-center" style={{ gap: '16px' }}>
              <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0 text-white"
                style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#002B7F', color: '#FFFFFF' }}
              >
                <UsersThree size={26} weight="bold" />
              </div>
              <div>
                <div className="text-muted fw-bold small mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  TOTAL ACTIVE TENANTS
                </div>
                <h3 className="fw-bold mb-0" style={{ fontSize: '1.65rem', lineHeight: '1.1', color: '#0F172A' }}>
                  {stats?.totalActiveTenants ?? 1169}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* OWNERS */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card border-0 h-100 bg-white shadow-sm user-select-none" 
            style={{ 
              borderRadius: '12px', 
              border: activeTab === 'owners' ? '2px solid #16A34A' : '1px solid #E2E8F0',
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: activeTab === 'owners' ? 'translateY(-2px)' : 'none',
              boxShadow: activeTab === 'owners' ? '0 8px 20px rgba(22, 163, 74, 0.12)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
            onClick={() => setActiveTab('owners')}
            title="Filter: Owners Only"
          >
            <div className="d-flex align-items-center" style={{ gap: '16px' }}>
              <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#16A34A' }}
              >
                <Key size={26} weight="bold" />
              </div>
              <div>
                <div className="text-muted fw-bold small mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  TOTAL OWNERS
                </div>
                <h3 className="fw-bold mb-0" style={{ fontSize: '1.65rem', lineHeight: '1.1', color: '#0F172A' }}>
                  {stats?.owners ?? 1084}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE RENTERS */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card border-0 h-100 bg-white shadow-sm user-select-none" 
            style={{ 
              borderRadius: '12px', 
              border: activeTab === 'renters' ? '2px solid #B45309' : '1px solid #E2E8F0',
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: activeTab === 'renters' ? 'translateY(-2px)' : 'none',
              boxShadow: activeTab === 'renters' ? '0 8px 20px rgba(180, 83, 9, 0.12)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
            onClick={() => setActiveTab('renters')}
            title="Filter: Renters Only"
          >
            <div className="d-flex align-items-center" style={{ gap: '16px' }}>
              <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#B45309' }}
              >
                <HouseLine size={26} weight="bold" />
              </div>
              <div>
                <div className="text-muted fw-bold small mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  TOTAL RENTERS
                </div>
                <h3 className="fw-bold mb-0" style={{ fontSize: '1.65rem', lineHeight: '1.1', color: '#0F172A' }}>
                  {stats?.activeRenters ?? 85}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE PROXIES */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card border-0 h-100 bg-white shadow-sm user-select-none" 
            style={{ 
              borderRadius: '12px', 
              border: activeTab === 'proxies' ? '2px solid #0284C7' : '1px solid #E2E8F0',
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: activeTab === 'proxies' ? 'translateY(-2px)' : 'none',
              boxShadow: activeTab === 'proxies' ? '0 8px 20px rgba(2, 132, 199, 0.12)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
            onClick={() => setActiveTab('proxies')}
            title="Filter: Proxies Only"
          >
            <div className="d-flex align-items-center" style={{ gap: '16px' }}>
              <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#E0F2FE', color: '#0284C7' }}
              >
                <UserSwitch size={26} weight="bold" />
              </div>
              <div>
                <div className="text-muted fw-bold small mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  TOTAL PROXIES
                </div>
                <h3 className="fw-bold mb-0" style={{ fontSize: '1.65rem', lineHeight: '1.1', color: '#0F172A' }}>
                  {stats?.activeProxies ?? 14}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Redesigned Modern Segmented Tabs Bar & Quick Search */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ marginBottom: '20px' }}>
        <div 
          className="d-inline-flex align-items-center p-1.5 shadow-sm"
          style={{ backgroundColor: '#E2E8F0', gap: '4px', borderRadius: '10px' }}
        >
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`btn d-flex align-items-center gap-2 border-0 px-3.5 py-2 ${
                  isActive 
                    ? 'bg-white text-primary fw-bold shadow-sm' 
                    : 'text-muted fw-semibold'
                }`}
                style={{
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: isActive ? '#002B7F' : '#64748B',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                <span 
                  className={`badge rounded-pill px-2 py-0.5 ${
                    isActive ? 'bg-primary text-white' : 'bg-white text-muted border'
                  }`}
                  style={{ fontSize: '0.72rem', backgroundColor: isActive ? '#002B7F' : '#FFFFFF' }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search Bar */}
        <div className="position-relative" style={{ minWidth: '280px', maxWidth: '360px', width: '100%' }}>
          <div 
            className="d-flex align-items-center bg-white border shadow-xs"
            style={{ 
              borderColor: '#CBD5E1', 
              borderRadius: '8px', 
              height: '40px', 
              padding: '0 12px',
              gap: '8px'
            }}
          >
            <MagnifyingGlass size={17} className="text-secondary flex-shrink-0" weight="bold" />
            <input 
              type="text"
              className="form-control border-0 p-0 shadow-none bg-transparent"
              placeholder="Search tenant, unit, or member..."
              style={{ fontSize: '0.85rem', color: '#0F172A' }}
              value={filterName}
              onChange={(e) => (handleNameSearchChange ? handleNameSearchChange(e.target.value) : setFilterName(e.target.value))}
            />
            {filterName && (
              <button 
                type="button" 
                className="btn p-0 border-0 text-muted shadow-none d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
                style={{ width: '22px', height: '22px', backgroundColor: '#F1F5F9', color: '#475569' }}
                onClick={() => (handleNameSearchChange ? handleNameSearchChange('') : setFilterName(''))}
                title="Clear search"
              >
                <X size={13} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Two-Column Layout: Table (Left) & Redesigned Filter Card (Right) */}
      <div className="row g-4 align-items-start" style={{ marginBottom: '30px' }}>
        {/* Left Side: Data Table Card */}
        <div className="col-12 col-xl-8 col-xxl-9">
          <div 
            className="card border-0 bg-white overflow-hidden shadow-sm"
            style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
          >
            <div className="table-responsive">
              <table className="table align-middle mb-0 bg-white">
                <thead style={{ backgroundColor: '#F8FAFC' }}>
                  <tr className="border-bottom" style={{ borderColor: '#E2E8F0' }}>
                    <th className="py-3 ps-4 text-uppercase fw-bold" style={{ backgroundColor: '#F8FAFC', fontSize: '0.75rem', color: '#64748B', letterSpacing: '0.05em', width: '55px' }}>
                      NO
                    </th>
                    <th className="py-3 text-uppercase fw-bold" style={{ backgroundColor: '#F8FAFC', fontSize: '0.75rem', color: '#64748B', letterSpacing: '0.05em', width: '250px' }}>
                      TENANT
                    </th>
                    <th className="py-3 text-uppercase fw-bold" style={{ backgroundColor: '#F8FAFC', fontSize: '0.75rem', color: '#64748B', letterSpacing: '0.05em' }}>
                      ASSIGNED UNITS
                    </th>
                    <th className="py-3 pe-4 text-uppercase fw-bold text-end" style={{ backgroundColor: '#F8FAFC', fontSize: '0.75rem', color: '#64748B', letterSpacing: '0.05em', width: '130px' }}>
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: '#FFFFFF' }}>
                  {tenants.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        <div className="py-4">
                          <FunnelSimple size={36} className="text-muted mb-2 opacity-50" />
                          <div className="fw-semibold text-dark">No matching tenant found</div>
                          <div className="small text-muted">Try adjusting your filter search criteria.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tenants.map((item, index) => {
                      // Initials for avatar
                      const initials = item.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      const rowNumber = (currentPage - 1) * (pageSize || 10) + index + 1;

                      return (
                        <tr key={item.id} className="border-bottom" style={{ borderColor: '#F1F5F9' }}>
                          {/* No */}
                          <td className="py-3.5 ps-4 text-muted small fw-semibold">
                            {rowNumber}
                          </td>

                          {/* Tenant Avatar & Name */}
                          <td className="py-3.5">
                            <div className="d-flex align-items-center gap-3">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold shadow-xs"
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  backgroundColor: '#E0F2FE',
                                  color: '#0284C7',
                                  fontSize: '0.825rem'
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <div className="fw-bold text-dark" style={{ fontSize: '0.9rem', lineHeight: '1.25' }}>
                                  {item.name}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.785rem' }}>
                                  {item.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Unit Badges */}
                          <td className="py-3.5">
                            {item.units.length === 0 ? (
                              <span 
                                className="d-inline-flex align-items-center justify-content-center rounded-2 fw-medium" 
                                style={{ 
                                  backgroundColor: '#F8FAFC',
                                  color: '#64748B',
                                  border: '1px dashed #CBD5E1',
                                  fontSize: '0.785rem',
                                  height: '28px',
                                  padding: '0 12px'
                                }}
                              >
                                No Units Assigned
                              </span>
                            ) : (
                              <div className="d-flex flex-wrap align-items-center gap-2">
                                {item.units.map((u, uIndex) => {
                                  const roleLower = (u.role || '').toLowerCase();
                                  const isOwner = roleLower === 'owner';
                                  const isRenter = roleLower === 'renter';
                                  const isProxy = roleLower === 'proxy' || roleLower === 'proxies';

                                  const roleBg = isOwner 
                                    ? '#DCFCE7' 
                                    : isRenter 
                                    ? '#FEF3C7' 
                                    : '#E0F2FE';
                                  const roleColor = isOwner 
                                    ? '#15803D' 
                                    : isRenter 
                                    ? '#B45309' 
                                    : '#0284C7';

                                  return (
                                    <div 
                                      key={uIndex}
                                      className="d-inline-flex align-items-stretch overflow-hidden shadow-2xs"
                                      style={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '6px',
                                        height: '28px',
                                        width: '144px'
                                      }}
                                    >
                                      <span 
                                        className="d-inline-flex align-items-center justify-content-center fw-bold text-uppercase flex-shrink-0"
                                        style={{ 
                                          backgroundColor: roleBg, 
                                          color: roleColor, 
                                          fontSize: '0.70rem',
                                          width: '64px',
                                          letterSpacing: '0.04em',
                                          lineHeight: 1
                                        }}
                                      >
                                        {u.role}
                                      </span>
                                      <span 
                                        className="d-inline-flex align-items-center justify-content-center text-dark fw-bold font-monospace flex-grow-1" 
                                        style={{ 
                                          backgroundColor: '#FFFFFF',
                                          fontSize: '0.80rem',
                                          width: '80px',
                                          letterSpacing: '0.03em',
                                          lineHeight: 1
                                        }}
                                      >
                                        {u.code}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* Action Details Button */}
                          <td className="py-3.5 pe-4 text-end">
                            <button 
                              type="button" 
                              className="btn btn-sm d-inline-flex align-items-center fw-semibold shadow-none border"
                              style={{
                                backgroundColor: '#F8FAFC',
                                borderColor: '#E2E8F0',
                                color: '#002B7F',
                                borderRadius: '6px',
                                padding: '5px 12px',
                                fontSize: '0.8rem',
                                gap: '6px'
                              }}
                              onClick={() => handleViewDetails(item.id)}
                            >
                              <Eye size={15} weight="bold" />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div 
              className="d-flex flex-wrap align-items-center justify-content-between px-4 py-3 border-top gap-3" 
              style={{ backgroundColor: '#E2E8F0', borderColor: '#CBD5E1' }}
            >
              <div className="text-muted small fw-medium" style={{ fontSize: '0.85rem' }}>
                Showing <strong className="text-dark">{totalRecords === 0 ? 0 : (currentPage - 1) * (pageSize || 10) + 1}–{Math.min(currentPage * (pageSize || 10), totalRecords)}</strong> of <strong className="text-dark">{totalRecords}</strong>
              </div>

              <div className="d-flex align-items-center gap-3">
                {/* Pagination Controls */}
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm bg-white border text-dark shadow-none d-flex align-items-center justify-content-center"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    style={{ borderRadius: '8px', width: '34px', height: '34px' }}
                    title="Previous Page"
                  >
                    <CaretLeft size={16} weight="bold" />
                  </button>

                  {/* Dynamic Page Numbers */}
                  {(() => {
                    let pages = [];
                    if (totalPages <= 5) {
                      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                    } else if (currentPage <= 3) {
                      pages = [1, 2, 3, '...', totalPages];
                    } else if (currentPage >= totalPages - 2) {
                      pages = [1, '...', totalPages - 2, totalPages - 1, totalPages];
                    } else {
                      pages = [1, '...', currentPage, '...', totalPages];
                    }

                    return pages.map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`dots-${idx}`} className="text-muted px-1.5 fw-bold" style={{ fontSize: '0.85rem' }}>
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={p}
                          type="button"
                          className={`btn btn-sm d-flex align-items-center justify-content-center shadow-none ${
                            currentPage === p 
                              ? 'text-white fw-bold' 
                              : 'bg-white border text-dark'
                          }`}
                          style={{
                            backgroundColor: currentPage === p ? '#002B7F' : '#FFFFFF',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            width: '34px',
                            height: '34px',
                            padding: 0
                          }}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      );
                    });
                  })()}

                  <button
                    type="button"
                    className="btn btn-sm bg-white border text-dark shadow-none d-flex align-items-center justify-content-center"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    style={{ borderRadius: '8px', width: '34px', height: '34px' }}
                    title="Next Page"
                  >
                    <CaretRight size={16} weight="bold" />
                  </button>
                </div>

                <div style={{ width: '1px', height: '26px', backgroundColor: '#CBD5E1' }} />

                {/* Go To Page Input Group */}
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small fw-medium" style={{ fontSize: '0.825rem', whiteSpace: 'nowrap' }}>
                    Go to:
                  </span>
                  <div className="input-group input-group-sm" style={{ width: '105px' }}>
                    <input 
                      type="number"
                      min="1"
                      max={totalPages}
                      className="form-control text-center shadow-none px-2 py-1"
                      style={{
                        borderColor: '#CBD5E1',
                        borderRadius: '8px 0 0 8px',
                        fontSize: '0.825rem',
                        height: '34px',
                        backgroundColor: '#FFFFFF'
                      }}
                      placeholder={`1-${totalPages}`}
                      value={goToPageInput}
                      onChange={(e) => setGoToPageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGoToPage();
                      }}
                    />
                    <button
                      type="button"
                      className="btn text-white px-2.5 fw-semibold d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: '#002B7F',
                        borderColor: '#002B7F',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.8rem',
                        height: '34px'
                      }}
                      onClick={handleGoToPage}
                      title="Jump to Page"
                    >
                      Go
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Redesigned Clean & Spacious Filter Card */}
        <div className="col-12 col-xl-4 col-xxl-3">
          <div 
            className="card border-0 bg-white shadow-sm"
            style={{ 
              borderRadius: '12px', 
              border: '1px solid #E2E8F0',
              padding: '20px',
              position: 'sticky',
              top: '20px'
            }}
          >
            {/* Header */}
            <div 
              className="d-flex align-items-center border-bottom" 
              style={{ 
                borderColor: '#F1F5F9',
                paddingBottom: '16px',
                marginBottom: '18px'
              }}
            >
              <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                <div 
                  className="d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    color: '#002B7F'
                  }}
                >
                  <Faders size={18} weight="bold" />
                </div>
                <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                  Filter Tenants
                </h4>
              </div>
            </div>

            {/* Filter Form with Harmonious Spacing */}
            <div className="d-flex flex-column" style={{ gap: '14px' }}>
              {/* Tower */}
              <div>
                <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                  Tower
                </label>
                <select
                  className="form-select shadow-none"
                  style={{ 
                    borderColor: '#CBD5E1', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem',
                    height: '40px',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    padding: '0 12px'
                  }}
                  value={filterTower}
                  onChange={(e) => setFilterTower(e.target.value)}
                >
                  {towerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Searchable Unit Dropdown */}
              <div className="position-relative" ref={unitDropdownRef}>
                <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                  Unit
                </label>

                {/* Dropdown Trigger */}
                <div
                  role="button"
                  tabIndex={0}
                  className="form-control d-flex align-items-center justify-content-between user-select-none shadow-none"
                  style={{
                    borderColor: isUnitDropdownOpen ? '#002B7F' : '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    height: '40px',
                    backgroundColor: '#FFFFFF',
                    color: filterUnit ? '#0F172A' : '#64748B',
                    padding: '0 12px',
                    cursor: 'pointer',
                    boxShadow: isUnitDropdownOpen ? '0 0 0 3px rgba(0, 43, 127, 0.1)' : 'none'
                  }}
                  onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setIsUnitDropdownOpen(!isUnitDropdownOpen);
                    }
                  }}
                >
                  <span className={filterUnit ? 'fw-bold text-dark font-monospace' : ''}>
                    {filterUnit ? filterUnit : 'All Units'}
                  </span>
                  <CaretDown 
                    size={14} 
                    weight="bold" 
                    className={`text-muted transition-transform ${isUnitDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </div>

                {/* Dropdown Popover with Real-time Search */}
                {isUnitDropdownOpen && (
                  <div
                    className="position-absolute start-0 end-0 mt-1 bg-white shadow-lg border z-3"
                    style={{
                      borderRadius: '8px',
                      borderColor: '#CBD5E1',
                      boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.15), 0 4px 10px -2px rgba(15, 23, 42, 0.05)',
                      top: '100%',
                      padding: '12px'
                    }}
                  >
                    {/* Search Input Box (Radius 4px) */}
                    <div className="position-relative" style={{ marginBottom: '10px' }}>
                      <div 
                        className="d-flex align-items-center bg-white border"
                        style={{ 
                          borderColor: '#CBD5E1', 
                          borderRadius: '4px',
                          height: '38px',
                          padding: '0 12px',
                          gap: '8px'
                        }}
                      >
                        <MagnifyingGlass size={16} className="text-secondary flex-shrink-0" weight="bold" />
                        <input
                          ref={unitSearchInputRef}
                          type="text"
                          className="form-control border-0 p-0 shadow-none bg-transparent flex-grow-1"
                          placeholder="e.g. A0101"
                          style={{ 
                            fontSize: '0.85rem', 
                            height: '100%', 
                            color: '#0F172A',
                            padding: '0 4px'
                          }}
                          value={unitSearchQuery}
                          onChange={(e) => setUnitSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setIsUnitDropdownOpen(false);
                          }}
                        />
                        {unitSearchQuery && (
                          <button
                            type="button"
                            className="btn p-0 border-0 text-muted shadow-none d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              backgroundColor: '#F1F5F9',
                              color: '#475569'
                            }}
                            onClick={() => {
                              setUnitSearchQuery('');
                              unitSearchInputRef.current?.focus();
                            }}
                            title="Clear search"
                          >
                            <X size={14} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Options List with 4px Item Radius */}
                    <div 
                      className="overflow-y-auto d-flex flex-column"
                      style={{ maxHeight: '180px', gap: '4px', paddingTop: '2px' }}
                    >
                      {filteredUnitOptions.length === 0 ? (
                        <div className="text-center py-3 text-muted small">
                          No units matching "{unitSearchQuery}"
                        </div>
                      ) : (
                        filteredUnitOptions.map((opt) => {
                          const isSelected = filterUnit === opt.value;
                          return (
                            <button
                              key={opt.value || 'all'}
                              type="button"
                              className={`btn btn-sm text-start d-flex align-items-center justify-content-between border-0 ${
                                isSelected 
                                  ? 'fw-bold' 
                                  : 'text-dark hover-bg-light'
                              }`}
                              style={{
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                padding: '8px 12px',
                                backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                                color: isSelected ? '#002B7F' : '#1E293B',
                                transition: 'background-color 0.12s ease'
                              }}
                              onClick={() => {
                                setFilterUnit(opt.value);
                                setIsUnitDropdownOpen(false);
                              }}
                            >
                              <span className={opt.value ? 'font-monospace' : ''}>
                                {opt.label}
                              </span>
                              {isSelected && (
                                <Check size={16} weight="bold" className="text-primary flex-shrink-0 ms-2" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tenant Name Search */}
              <div>
                <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                  Tenant Name
                </label>
                <div className="position-relative">
                  <div 
                    className="d-flex align-items-center bg-white border"
                    style={{ 
                      borderColor: '#CBD5E1', 
                      borderRadius: '8px', 
                      height: '40px', 
                      padding: '0 12px',
                      gap: '8px'
                    }}
                  >
                    <MagnifyingGlass size={16} className="text-secondary flex-shrink-0" weight="bold" />
                    <input
                      type="text"
                      className="form-control border-0 p-0 shadow-none bg-transparent flex-grow-1"
                      placeholder="Search tenant name..."
                      style={{ 
                        fontSize: '0.85rem', 
                        height: '100%', 
                        color: '#0F172A'
                      }}
                      value={filterName}
                      onChange={(e) => (handleNameSearchChange ? handleNameSearchChange(e.target.value) : setFilterName(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    />
                    {filterName && (
                      <button
                        type="button"
                        className="btn p-0 border-0 text-muted shadow-none d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
                        style={{ 
                          width: '22px', 
                          height: '22px', 
                          backgroundColor: '#F1F5F9', 
                          color: '#475569' 
                        }}
                        onClick={() => (handleNameSearchChange ? handleNameSearchChange('') : setFilterName(''))}
                        title="Clear search"
                      >
                        <X size={13} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons with Proper Spacing */}
              <div className="d-flex flex-column" style={{ gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn text-white w-100 fw-bold d-flex align-items-center justify-content-center shadow-sm"
                  style={{ 
                    backgroundColor: '#002B7F', 
                    borderRadius: '8px', 
                    fontSize: '0.875rem',
                    height: '42px',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={applyFilter}
                >
                  <MagnifyingGlass size={17} weight="bold" />
                  <span>Apply Filter</span>
                </button>

                <button
                  type="button"
                  className="btn w-100 fw-semibold d-flex align-items-center justify-content-center shadow-none"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    height: '40px',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={resetFilter}
                >
                  <ArrowsClockwise size={16} weight="bold" />
                  <span>Reset Filter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
