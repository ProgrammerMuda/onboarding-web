import React from 'react';
import {
  Buildings,
  Users,
  MagnifyingGlass,
  CaretRight,
  User,
  CheckCircle,
  Wrench,
  Receipt,
  UsersThree,
  ShieldCheck,
  SlidersHorizontal,
  Sparkle,
  Briefcase,
  IdentificationCard
} from '@phosphor-icons/react';

export function ScopeList({
  targetType,
  setTargetType,
  selectedTargetId,
  onSelectTarget,
  searchQuery,
  setSearchQuery,
  filteredDepartments,
  filteredEmployees,
  departmentStats,
  departments,
  employees = [],
  roles,
  configs
}) {
  // Helper to get tailored icon & badge color for each department
  const getDeptTheming = (code) => {
    switch (code) {
      case 'OPS':
        return {
          icon: <Buildings size={22} weight="bold" />,
          bgColor: 'rgba(5, 48, 121, 0.08)',
          textColor: '#053079',
          accentColor: '#053079',
          tagBg: '#EFF6FF',
          tagText: '#1D4ED8'
        };
      case 'ENG':
        return {
          icon: <Wrench size={22} weight="bold" />,
          bgColor: 'rgba(217, 119, 6, 0.1)',
          textColor: '#b45309',
          accentColor: '#d97706',
          tagBg: '#FFFBEB',
          tagText: '#B45309'
        };
      case 'FIN':
        return {
          icon: <Receipt size={22} weight="bold" />,
          bgColor: 'rgba(16, 185, 129, 0.1)',
          textColor: '#047857',
          accentColor: '#10B981',
          tagBg: '#ECFDF5',
          tagText: '#047857'
        };
      case 'HRGA':
        return {
          icon: <UsersThree size={22} weight="bold" />,
          bgColor: 'rgba(124, 58, 237, 0.1)',
          textColor: '#6d28d9',
          accentColor: '#7C3AED',
          tagBg: '#F5F3FF',
          tagText: '#6D28D9'
        };
      default:
        return {
          icon: <Buildings size={22} weight="bold" />,
          bgColor: 'rgba(5, 48, 121, 0.08)',
          textColor: '#053079',
          accentColor: '#053079',
          tagBg: '#EFF6FF',
          tagText: '#1D4ED8'
        };
    }
  };

  // Helper to extract clean initials from employee name
  const getInitials = (name) => {
    if (!name) return 'EP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className="card border-0 bg-white h-100 shadow-sm d-flex flex-column overflow-hidden"
      style={{ borderRadius: '16px', borderColor: '#E2E8F0' }}
    >
      {/* Top Segmented Target Toggle & Search */}
      <div className="p-4 border-bottom border-slate-100">
        {/* Toggle Tabs */}
        <div
          className="p-1 rounded-3 d-flex gap-1.5 border border-slate-200"
          style={{ backgroundColor: '#F1F5F9', borderRadius: '10px', marginBottom: '20px' }}
        >
          <button
            type="button"
            className={`btn btn-sm flex-fill fw-bold transition-all d-flex align-items-center justify-content-center gap-2 py-2 ${
              targetType === 'department'
                ? 'bg-white text-primary'
                : 'text-slate-600 border-0 hover-bg-slate-200'
            }`}
            style={{
              fontSize: '0.85rem',
              borderRadius: '8px',
              boxShadow:
                targetType === 'department'
                  ? '0 2px 8px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)'
                  : 'none',
              border: targetType === 'department' ? '1px solid #e2e8f0' : 'none'
            }}
            onClick={() => {
              if (targetType !== 'department') {
                const firstDept = filteredDepartments[0]?.id || 'dept-bm';
                onSelectTarget(firstDept, 'department');
              }
            }}
          >
            <Buildings size={17} weight={targetType === 'department' ? 'bold' : 'regular'} />
            <span>Department</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm flex-fill fw-bold transition-all d-flex align-items-center justify-content-center gap-2 py-2 ${
              targetType === 'employee'
                ? 'bg-white text-primary'
                : 'text-slate-600 border-0 hover-bg-slate-200'
            }`}
            style={{
              fontSize: '0.85rem',
              borderRadius: '8px',
              boxShadow:
                targetType === 'employee'
                  ? '0 2px 8px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)'
                  : 'none',
              border: targetType === 'employee' ? '1px solid #e2e8f0' : 'none'
            }}
            onClick={() => {
              if (targetType !== 'employee') {
                const firstEmp = filteredEmployees[0]?.id || 'emp-001';
                onSelectTarget(firstEmp, 'employee');
              }
            }}
          >
            <Users size={17} weight={targetType === 'employee' ? 'bold' : 'regular'} />
            <span>Employee</span>
          </button>
        </div>

        {/* Search Filter */}
        <div className="position-relative">
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="position-absolute text-muted"
            style={{ top: '13px', left: '16px' }}
          />
          <input
            type="text"
            className="form-control ps-5 pe-3 py-2.5 bg-slate-50 border-slate-200"
            style={{
              borderRadius: '12px',
              fontSize: '0.85rem',
              backgroundColor: '#F8FAFC',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
            }}
            placeholder={
              targetType === 'department' ? 'Search department...' : 'Search name, NIK, email...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Target Items List */}
      <div className="flex-grow-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 290px)' }}>
        {targetType === 'department' ? (
          // Redesigned Department Cards
          filteredDepartments.length > 0 ? (
            filteredDepartments.map((dept) => {
              const isSelected = selectedTargetId === dept.id;
              const stats = departmentStats[dept.id] || { employeeCount: 0, customOverridesCount: 0 };
              const deptConfig = configs.find(
                (c) => c.targetType === 'department' && c.targetId === dept.id && c.scope === 'all_types'
              );
              const totalLevels = deptConfig?.chain?.levels?.length || 1;

              const hasUnconfiguredRole = (deptConfig?.chain?.levels || []).some((lvl) => !lvl.roleId);

              return (
                <div
                  key={dept.id}
                  onClick={() => onSelectTarget(dept.id, 'department')}
                  className="position-relative overflow-hidden transition-all text-start w-100"
                  style={{
                    borderRadius: '16px',
                    marginBottom: '16px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#053079' : '#FFFFFF',
                    border: isSelected ? '1.5px solid #053079' : '1px solid #E2E8F0',
                    boxShadow: isSelected
                      ? '0 10px 25px -5px rgba(5, 48, 121, 0.3), 0 4px 10px -2px rgba(5, 48, 121, 0.15)'
                      : '0 1px 3px rgba(15, 23, 42, 0.04)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* 1. Department Name */}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6
                      className="fw-bold mb-0 text-truncate"
                      style={{
                        fontSize: '1.025rem',
                        color: isSelected ? '#FFFFFF' : '#0F172A',
                        letterSpacing: '-0.2px'
                      }}
                      title={dept.name}
                    >
                      {dept.name}
                    </h6>
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ms-2"
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#64748B'
                      }}
                    >
                      <CaretRight size={14} weight="bold" />
                    </div>
                  </div>

                  {/* 2. Employee Count (Stacked / Atas-Bawah) */}
                  <div
                    className="d-flex align-items-center mb-2"
                    style={{
                      fontSize: '0.85rem',
                      color: isSelected ? 'rgba(255, 255, 255, 0.85)' : '#475569',
                      gap: '12px'
                    }}
                  >
                    <Users
                      size={17}
                      weight="bold"
                      style={{ color: isSelected ? '#FFFFFF' : '#053079' }}
                    />
                    <span className="d-inline-flex align-items-center" style={{ gap: '5px' }}>
                      <strong style={{ color: isSelected ? '#FFFFFF' : '#0F172A' }}>
                        {stats.employeeCount}
                      </strong>
                      <span>
                        {stats.employeeCount === 1 ? 'Employee' : 'Employees'}
                      </span>
                    </span>
                  </div>

                  {/* 3. Approval Levels (Stacked / Atas-Bawah) */}
                  <div
                    className="d-flex align-items-center mb-3"
                    style={{
                      fontSize: '0.85rem',
                      color: isSelected ? 'rgba(255, 255, 255, 0.85)' : '#475569',
                      gap: '12px'
                    }}
                  >
                    <ShieldCheck
                      size={17}
                      weight="bold"
                      style={{ color: isSelected ? '#FFFFFF' : '#053079' }}
                    />
                    <span className="d-inline-flex align-items-center" style={{ gap: '5px' }}>
                      <strong style={{ color: isSelected ? '#FFFFFF' : '#0F172A' }}>
                        {totalLevels}
                      </strong>
                      <span>
                        {totalLevels === 1 ? 'Approval Level' : 'Approval Levels'}
                      </span>
                    </span>
                  </div>

                  {/* 4. Employee Overrides / Config Status (Stacked / Atas-Bawah) */}
                  <div
                    className="d-flex align-items-center"
                    style={{
                      marginTop: '14px',
                      paddingTop: '14px',
                      borderTop: isSelected
                        ? '1px solid rgba(255, 255, 255, 0.35)'
                        : '1px solid #E2E8F0',
                      fontSize: '0.8rem',
                      gap: '12px'
                    }}
                  >
                    <span
                      className="rounded-circle flex-shrink-0"
                      style={{
                        width: '8px',
                        height: '8px',
                        minWidth: '8px',
                        minHeight: '8px',
                        backgroundColor: isSelected
                          ? hasUnconfiguredRole
                            ? '#FDE68A'
                            : stats.customOverridesCount > 0
                            ? '#FDE68A'
                            : '#A7F3D0'
                          : hasUnconfiguredRole
                          ? '#F59E0B'
                          : stats.customOverridesCount > 0
                          ? '#F59E0B'
                          : '#10B981'
                      }}
                    />
                    <span
                      className={
                        isSelected
                          ? 'fw-semibold text-white'
                          : hasUnconfiguredRole || stats.customOverridesCount > 0
                          ? 'fw-semibold text-amber-700'
                          : 'text-slate-500'
                      }
                    >
                      {hasUnconfiguredRole
                        ? 'Pending Configuration'
                        : stats.customOverridesCount > 0
                        ? `${stats.customOverridesCount} ${
                            stats.customOverridesCount === 1
                              ? 'Employee Override'
                              : 'Employee Overrides'
                          }`
                        : 'No custom overrides'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-5 text-muted small">
              No departments match your search.
            </div>
          )
        ) : (
          // Redesigned Employee Items (Name, Role, and Flow Status)
          filteredEmployees.length > 0 ? (
            filteredEmployees.map((emp) => {
              const isSelected = selectedTargetId === emp.id;
              const dept = departments.find((d) => d.id === emp.departmentId);
              const role = roles.find((r) => r.id === emp.roleId);
              const displayRole = dept?.name || emp.position || 'Department';
              const hasOverride = configs.some(
                (c) => c.targetType === 'employee' && c.targetId === emp.id
              );

              return (
                <div
                  key={emp.id}
                  onClick={() => onSelectTarget(emp.id, 'employee')}
                  className="position-relative overflow-hidden transition-all text-start w-100"
                  style={{
                    borderRadius: '16px',
                    marginBottom: '16px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#053079' : '#FFFFFF',
                    border: isSelected ? '1.5px solid #053079' : '1px solid #E2E8F0',
                    boxShadow: isSelected
                      ? '0 10px 25px -5px rgba(5, 48, 121, 0.3), 0 4px 10px -2px rgba(5, 48, 121, 0.15)'
                      : '0 1px 3px rgba(15, 23, 42, 0.04)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* 1. Employee Name & Subdued Caret */}
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6
                      className="fw-bold mb-0 text-truncate"
                      style={{
                        fontSize: '1.025rem',
                        color: isSelected ? '#FFFFFF' : '#0F172A',
                        letterSpacing: '-0.2px'
                      }}
                      title={emp.name}
                    >
                      {emp.name}
                    </h6>
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ms-2"
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#64748B'
                      }}
                    >
                      <CaretRight size={14} weight="bold" />
                    </div>
                  </div>

                  {/* 2. NIK */}
                  {emp.nik && (
                    <div
                      className="d-flex align-items-center"
                      style={{
                        fontSize: '0.8125rem',
                        color: isSelected ? 'rgba(255, 255, 255, 0.85)' : '#64748B',
                        gap: '12px'
                      }}
                    >
                      <IdentificationCard
                        size={17}
                        weight="bold"
                        style={{ color: isSelected ? '#FFFFFF' : '#053079' }}
                      />
                      <span>
                        NIK:{' '}
                        <strong
                          style={{
                            color: isSelected ? '#FFFFFF' : '#1E293B',
                            fontFamily: 'monospace'
                          }}
                        >
                          {emp.nik}
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* 3. Role (with Briefcase/bag icon) */}
                  <div
                    className="d-flex align-items-center"
                    style={{
                      marginTop: emp.nik ? '6px' : '0px',
                      fontSize: '0.875rem',
                      color: isSelected ? 'rgba(255, 255, 255, 0.85)' : '#475569',
                      gap: '12px'
                    }}
                  >
                    <Briefcase
                      size={17}
                      weight="bold"
                      style={{ color: isSelected ? '#FFFFFF' : '#053079' }}
                    />
                    <span className="text-truncate" title={displayRole}>
                      {displayRole}
                    </span>
                  </div>

                  {/* 3. Flow Status (Custom Override vs Department Standard) */}
                  <div
                    className="d-flex align-items-center"
                    style={{
                      marginTop: '14px',
                      paddingTop: '14px',
                      borderTop: isSelected
                        ? '1px solid rgba(255, 255, 255, 0.35)'
                        : '1px solid #E2E8F0',
                      fontSize: '0.8rem',
                      gap: '12px'
                    }}
                  >
                    <span
                      className="rounded-circle flex-shrink-0"
                      style={{
                        width: '8px',
                        height: '8px',
                        minWidth: '8px',
                        minHeight: '8px',
                        backgroundColor: isSelected
                          ? hasOverride
                            ? '#FDE68A'
                            : '#A7F3D0'
                          : hasOverride
                          ? '#F59E0B'
                          : '#10B981'
                      }}
                    />
                    <span
                      className={
                        isSelected
                          ? 'fw-semibold text-white'
                          : hasOverride
                          ? 'fw-semibold text-amber-700'
                          : 'text-slate-500'
                      }
                    >
                      {hasOverride
                        ? 'Custom Override Approval'
                        : `Follows ${dept?.name || 'Department'} Approval`}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-5 text-muted small">
              No employees match your search.
            </div>
          )
        )}
      </div>
    </div>
  );
}
