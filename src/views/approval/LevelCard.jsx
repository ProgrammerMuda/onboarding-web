import React from 'react';
import { Trash, Users, UserCheck, ShieldCheck, Info } from '@phosphor-icons/react';
import { PeopleChips } from './PeopleChips';

export function LevelCard({
  level,
  levelIndex,
  totalLevels,
  departments = [],
  roles = [],
  allEmployees = [],
  currentDeptId,
  onUpdateRole,
  onUpdateMode,
  onAddUser,
  onRemoveUser,
  onUpdateRule,
  onRemoveLevel,
  error
}) {
  const selectedApprover =
    departments.find((d) => d.id === level.roleId) ||
    roles.find((r) => r.id === level.roleId) ||
    null;

  // Count active employees in this approver department / role
  const approverMembers = selectedApprover
    ? allEmployees.filter(
        (emp) =>
          (emp.departmentId === selectedApprover.id || emp.roleId === selectedApprover.id) &&
          emp.status === 'active'
      )
    : [];

  // Eligible approver count in this level
  const eligibleCount = level.mode === 'all' ? approverMembers.length : (level.userIds || []).length;

  return (
    <div
      className={`card border ${error ? 'border-danger shadow-sm' : 'border-slate-200'} bg-white mb-4`}
      style={{
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        transition: 'all 0.2s ease'
      }}
    >
      <div className="card-body p-4 p-md-4.5">
        {/* Header: Level Badge, Department Select & Remove button */}
        <div className="d-flex align-items-center justify-content-between mb-4 gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-3">
            <span
              className="badge d-inline-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
              style={{
                backgroundColor: selectedApprover ? '#053079' : '#94A3B8',
                color: '#ffffff',
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                fontSize: '0.95rem'
              }}
            >
              {levelIndex + 1}
            </span>
            <div>
              <div className="fw-bold text-slate-900" style={{ fontSize: '1.05rem' }}>
                Approval {levelIndex + 1}
              </div>
              <div className="text-muted small mt-0.5" style={{ fontSize: '0.8rem' }}>
                {selectedApprover ? `Level ${levelIndex + 1} in approval sequence` : 'Approver department not selected'}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 flex-grow-1 justify-content-md-end">
            <div className="d-flex align-items-center gap-2.5">
              <label htmlFor={`role-select-${levelIndex}`} className="small text-muted fw-bold mb-0 d-none d-sm-inline">
                Department:
              </label>
              <select
                id={`role-select-${levelIndex}`}
                className="form-select form-select-sm fw-semibold py-2"
                style={{
                  minWidth: '245px',
                  borderColor: '#CBD5E1',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  backgroundColor: '#FFFFFF',
                  color: !level.roleId ? '#94A3B8' : '#0F172A',
                  paddingLeft: '14px',
                  paddingRight: '38px',
                  cursor: 'pointer'
                }}
                value={level.roleId || ''}
                onChange={(e) => onUpdateRole(levelIndex, e.target.value)}
              >
                <option value="" style={{ color: '#94A3B8' }}>
                  -- Select Approver Department --
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} style={{ color: '#0F172A' }}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger border-0 d-inline-flex align-items-center p-2 rounded-2"
              onClick={() => onRemoveLevel(levelIndex)}
              disabled={totalLevels <= 1}
              title={totalLevels <= 1 ? 'Minimum 1 approval level required' : 'Delete this level'}
              aria-label={`Delete Level ${levelIndex + 1}`}
              style={{ opacity: totalLevels <= 1 ? 0.35 : 1 }}
            >
              <Trash size={20} weight="bold" />
            </button>
          </div>
        </div>

        {/* If Approver Department Not Selected Yet: Friendly guidance banner */}
        {!selectedApprover ? (
          <div
            className="border d-flex align-items-center"
            style={{
              backgroundColor: 'rgba(9, 178, 255, 0.08)',
              borderColor: 'rgba(9, 178, 255, 0.25)',
              borderRadius: '10px',
              padding: '10px 16px',
              gap: '12px'
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: '#09B2FF',
                color: '#FFFFFF'
              }}
            >
              <Info size={17} weight="bold" />
            </div>
            <div
              style={{
                color: '#0369A1',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                fontWeight: 500
              }}
            >
              Please select an approver department above first to configure approval permissions.
            </div>
          </div>
        ) : (
          /* Mode Selector: "All [Department] (N)" vs "Specific people" */
          <div
            className="mb-4"
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '20px 22px'
            }}
          >
            <div className="d-flex align-items-center gap-2.5 mb-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: 'rgba(5, 48, 121, 0.08)',
                  color: '#053079'
                }}
              >
                <Users size={15} weight="bold" />
              </div>
              <div className="fw-bold text-slate-800" style={{ fontSize: '0.9rem', letterSpacing: '-0.15px' }}>
                Approval Granted By
              </div>
            </div>

            <div className="d-flex flex-wrap gap-3">
              <button
                type="button"
                className={`btn d-inline-flex align-items-center gap-2.5 fw-semibold ${
                  level.mode === 'all' ? 'btn-mode-active' : 'btn-mode-inactive'
                }`}
                style={{
                  fontSize: '0.875rem',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => onUpdateMode(levelIndex, 'all')}
              >
                <Users size={18} weight={level.mode === 'all' ? 'bold' : 'regular'} />
                <span>All {selectedApprover.name} ({approverMembers.length})</span>
              </button>

              <button
                type="button"
                className={`btn d-inline-flex align-items-center gap-2.5 fw-semibold ${
                  level.mode === 'selected' ? 'btn-mode-active' : 'btn-mode-inactive'
                }`}
                style={{
                  fontSize: '0.875rem',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => onUpdateMode(levelIndex, 'selected')}
              >
                <UserCheck size={18} weight={level.mode === 'selected' ? 'bold' : 'regular'} />
                <span>Specific People {(level.userIds || []).length > 0 && `(${level.userIds.length})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* If Selected Mode: Show People Chips */}
        {selectedApprover && level.mode === 'selected' && (
          <div className="p-4 bg-slate-50 border rounded-4 mb-4" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
            <div className="small text-slate-800 fw-bold mb-3 d-flex align-items-center gap-2.5" style={{ fontSize: '0.85rem' }}>
              <span>Selected Approvers ({selectedApprover.name}):</span>
            </div>
            <PeopleChips
              levelIndex={levelIndex}
              roleId={level.roleId}
              selectedUserIds={level.userIds}
              allEmployees={allEmployees}
              currentDeptId={currentDeptId}
              onAddUser={onAddUser}
              onRemoveUser={onRemoveUser}
              hasError={error}
            />
          </div>
        )}

        {/* Approval Rule: Appears ONLY if eligible approvers > 1 */}
        {eligibleCount > 1 && (
          <div className="mt-2 pt-4 border-top border-slate-100 d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2.5 text-slate-700 small fw-bold">
              <ShieldCheck size={18} weight="bold" className="text-secondary" />
              <span>Approval Rule for this Level ({eligibleCount} approvers):</span>
            </div>

            <div className="d-flex align-items-center gap-4">
              <div className="form-check form-check-inline mb-0 d-flex align-items-center gap-2.5">
                <input
                  className="form-check-input mt-0"
                  type="radio"
                  name={`rule-${level.id}`}
                  id={`rule-any-${level.id}`}
                  checked={level.rule === 'any'}
                  onChange={() => onUpdateRule(levelIndex, 'any')}
                />
                <label className="form-check-label small fw-semibold text-slate-800 cursor-pointer" htmlFor={`rule-any-${level.id}`}>
                  Any one approver
                </label>
              </div>

              <div className="form-check form-check-inline mb-0 d-flex align-items-center gap-2.5">
                <input
                  className="form-check-input mt-0"
                  type="radio"
                  name={`rule-${level.id}`}
                  id={`rule-all-${level.id}`}
                  checked={level.rule === 'all'}
                  onChange={() => onUpdateRule(levelIndex, 'all')}
                />
                <label className="form-check-label small fw-semibold text-slate-800 cursor-pointer" htmlFor={`rule-all-${level.id}`}>
                  All must approve
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Validation Error Message */}
        {error && (
          <div className="mt-3 pt-3 border-top border-danger border-opacity-25 d-flex align-items-center gap-2 text-danger small fw-semibold">
            <Info size={16} weight="bold" className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
