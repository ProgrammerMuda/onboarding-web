import React, { useState, useRef, useEffect } from 'react';
import { User, Plus, X, MagnifyingGlass, Check } from '@phosphor-icons/react';

export function PeopleChips({
  levelIndex,
  roleId,
  selectedUserIds = [],
  allEmployees = [],
  currentDeptId,
  onAddUser,
  onRemoveUser,
  hasError
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const dropdownRef = useRef(null);

  // Available employees of this approver department or role
  const approverEmployees = allEmployees.filter(
    (emp) =>
      (emp.departmentId === roleId || emp.roleId === roleId) &&
      emp.status === 'active'
  );

  // Unselected employees
  const availableToAdd = approverEmployees.filter(
    (emp) =>
      !selectedUserIds.includes(emp.id) &&
      (emp.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        emp.nik.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  // Selected employee objects
  const selectedEmployees = selectedUserIds
    .map((id) => allEmployees.find((e) => e.id === id))
    .filter(Boolean);

  // Helper to extract clean initials from employee name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-100">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
        {selectedEmployees.map((emp) => (
          <div
            key={emp.id}
            className="d-inline-flex align-items-center bg-white border border-slate-300 rounded-pill px-3 py-1 shadow-xs transition-all"
            style={{ fontSize: '0.825rem' }}
          >
            <span className="fw-semibold text-slate-800 me-1.5">{emp.name}</span>
            <span className="text-muted small me-2 font-monospace" style={{ fontSize: '0.75rem' }}>({emp.nik})</span>
            <button
              type="button"
              className="btn btn-link p-0 text-slate-400 hover-text-danger d-flex align-items-center"
              onClick={() => onRemoveUser(levelIndex, emp.id)}
              aria-label={`Remove ${emp.name}`}
              style={{ lineHeight: 1 }}
            >
              <X size={15} weight="bold" className="text-slate-500" />
            </button>
          </div>
        ))}

        {/* Add Person Dropdown */}
        <div className="position-relative" ref={dropdownRef}>
          <button
            type="button"
            className="btn btn-sm btn-outline-static d-inline-flex align-items-center gap-1.5 rounded-pill px-3 py-1"
            style={{ fontSize: '0.825rem', fontWeight: 600 }}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
          >
            <Plus size={15} weight="bold" />
            <span>Add Person</span>
          </button>

          {dropdownOpen && (
            <div
              className="position-absolute bg-white border shadow-lg p-3"
              style={{
                bottom: 'calc(100% + 10px)',
                left: 0,
                width: '350px',
                zIndex: 1050,
                borderColor: '#E2E8F0',
                borderRadius: '14px',
                boxShadow: '0 -10px 28px -4px rgba(15, 23, 42, 0.14), 0 -4px 12px -2px rgba(15, 23, 42, 0.06)'
              }}
            >
              <div className="position-relative" style={{ marginBottom: '18px' }}>
                <MagnifyingGlass
                  size={16}
                  weight="bold"
                  className="position-absolute text-slate-400"
                  style={{ top: '50%', transform: 'translateY(-50%)', left: '12px' }}
                />
                <input
                  type="text"
                  className="form-control form-control-sm border-slate-200"
                  style={{
                    paddingLeft: '36px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    backgroundColor: '#F8FAFC'
                  }}
                  placeholder="Search name or NIK..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto pe-1" style={{ maxHeight: '315px' }}>
                {availableToAdd.length > 0 ? (
                  availableToAdd.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      className="w-100 text-start btn border-0 d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-1.5 transition-all"
                      style={{
                        backgroundColor: '#FFFFFF',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                      onClick={() => {
                        onAddUser(levelIndex, emp.id);
                        setFilterQuery('');
                      }}
                    >
                      <div className="flex-grow-1 overflow-hidden text-truncate pe-2">
                        <div className="fw-semibold text-slate-800 text-truncate" style={{ fontSize: '0.85rem' }}>
                          {emp.name}
                        </div>
                        <div className="text-muted small mt-0.5" style={{ fontSize: '0.725rem', fontFamily: 'monospace' }}>
                          {emp.nik}
                        </div>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '26px',
                          height: '26px',
                          backgroundColor: 'rgba(5, 48, 121, 0.08)',
                          color: '#053079'
                        }}
                      >
                        <Plus size={14} weight="bold" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-3 text-muted small">
                    {approverEmployees.length === 0
                      ? 'No active staff members found with this role'
                      : 'All people in this role have already been selected'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {hasError && (
        <div className="text-danger small mt-1.5 d-flex align-items-center gap-1 fw-semibold" style={{ fontSize: '0.785rem' }}>
          <span>•</span> {hasError}
        </div>
      )}
    </div>
  );
}
