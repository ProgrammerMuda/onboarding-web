import React from 'react';
import {
  Plus,
  FloppyDisk,
  ArrowCounterClockwise
} from '@phosphor-icons/react';
import { LevelCard } from './LevelCard';
import { FlowPreview } from './FlowPreview';

export function ApprovalChainBuilder({
  targetType,
  currentTarget,
  targetStatus,
  departments = [],
  roles = [],
  allEmployees = [],
  requestTypes = [],
  editorMode,
  onToggleEditorMode,
  activeRequestType,
  onSelectRequestType,
  activeChain,
  isDirty,
  validationErrors,
  perTypeCustomMap,
  onAddLevel,
  onRemoveLevel,
  onUpdateRole,
  onUpdateMode,
  onAddUser,
  onRemoveUser,
  onUpdateRule,
  onUpdateRejectNote,
  onUpdateFallback,
  onSave,
  onCancel,
  onResetToDepartmentDefault,
  onResetTypeToGeneralRule
}) {
  const levels = activeChain?.levels || [];

  // Determine current department ID
  const currentDeptId = targetType === 'department' ? currentTarget?.id : currentTarget?.departmentId;

  return (
    <div className="card border-0 bg-white h-100 shadow-sm d-flex flex-column overflow-hidden" style={{ borderRadius: '16px' }}>
      {/* Header Panel */}
      <div className="p-4 p-lg-4.5 border-bottom border-slate-100" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
        <div>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h4 className="fw-bold text-slate-900 mb-0" style={{ fontSize: '1.3rem' }}>
              {currentTarget?.name}
            </h4>
            {targetType === 'employee' && currentTarget?.nik && (
              <span
                className="badge fw-semibold px-2.5 py-1"
                style={{
                  fontSize: '0.775rem',
                  borderRadius: '6px',
                  backgroundColor: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #E2E8F0',
                  fontFamily: 'monospace'
                }}
              >
                NIK: {currentTarget.nik}
              </span>
            )}
            {targetType === 'employee' && targetStatus.isCustom && (
              <span
                className="badge fw-bold px-3 py-1.5"
                style={{
                  fontSize: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A'
                }}
              >
                Custom Override
              </span>
            )}
          </div>
          <p className="text-muted small mb-0 mt-1" style={{ fontSize: '0.85rem' }}>
            {targetType === 'department'
              ? 'Configure and manage the approval chain parameters for all employee requests in this department.'
              : `Customize dedicated approval chain parameters and approvers for ${currentTarget?.name || 'this employee'}.`}
          </p>
        </div>
      </div>

      {/* Main Body: Builder */}
      <div
        className="flex-grow-1 overflow-y-auto p-4 p-lg-4.5"
        style={{ maxHeight: 'calc(100vh - 250px)', paddingBottom: '80px' }}
      >
        {/* Visual Flow Preview */}
        <FlowPreview
          chain={activeChain}
          departments={departments}
          roles={roles}
          allEmployees={allEmployees}
          currentDeptId={currentDeptId}
          requesterName={targetType === 'employee' ? currentTarget?.name : 'Requester'}
        />

        {/* Approval Levels */}
        <div className="mb-4 pb-2">
          <div className="mb-4">
            <h5 className="fw-bold text-slate-900 mb-1" style={{ fontSize: '1.1rem' }}>
              Approval Sequence
            </h5>
            <span className="text-muted small" style={{ fontSize: '0.825rem' }}>
              Requests are processed sequentially: Level 1 first, then Level 2, etc.
            </span>
          </div>

          {levels.map((lvl, index) => (
            <LevelCard
              key={lvl.id || index}
              level={lvl}
              levelIndex={index}
              totalLevels={levels.length}
              departments={departments}
              roles={roles}
              allEmployees={allEmployees}
              currentDeptId={currentDeptId}
              onUpdateRole={onUpdateRole}
              onUpdateMode={onUpdateMode}
              onAddUser={onAddUser}
              onRemoveUser={onRemoveUser}
              onUpdateRule={onUpdateRule}
              onRemoveLevel={onRemoveLevel}
              error={validationErrors[`level_${index}`]}
            />
          ))}

          {/* Add Level Button (hidden if 5 levels reached) */}
          {levels.length < 5 && (
            <button
              type="button"
              className="btn w-100 rounded-4 d-flex align-items-center justify-content-center gap-2.5 fw-bold mt-3 shadow-none"
              style={{
                border: '2px dashed #CBD5E1',
                backgroundColor: '#FAFAFA',
                color: '#053079',
                padding: '16px 20px',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'none'
              }}
              onClick={onAddLevel}
            >
              <Plus size={20} weight="bold" style={{ color: '#053079' }} />
              <span style={{ color: '#053079' }}>Add Approval Level</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div
        className="p-4 p-md-4.5 border-top border-slate-200 bg-white d-flex align-items-center justify-content-between flex-wrap gap-3"
        style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}
      >
        <div>
          {targetType === 'employee' && targetStatus.isCustom && (
            <button
              type="button"
              className="btn btn-link text-danger p-0 fw-bold text-decoration-none d-flex align-items-center gap-2.5"
              style={{ fontSize: '0.875rem' }}
              onClick={onResetToDepartmentDefault}
            >
              <ArrowCounterClockwise size={18} weight="bold" />
              <span>Reset to Department Default</span>
            </button>
          )}
        </div>

        <div className="d-flex align-items-center gap-3 ms-auto">
          <button
            type="button"
            className={`btn border px-4 py-2.5 fw-semibold ${isDirty ? 'btn-light text-slate-700' : ''}`}
            style={{
              borderRadius: '12px',
              ...(isDirty ? {} : {
                backgroundColor: '#F1F5F9',
                borderColor: '#E2E8F0',
                color: '#94A3B8',
                cursor: 'not-allowed'
              })
            }}
            disabled={!isDirty}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className={`btn px-4.5 py-2.5 fw-bold d-inline-flex align-items-center gap-2.5 ${isDirty ? 'btn-primary shadow-sm' : ''}`}
            style={{
              borderRadius: '12px',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              ...(isDirty ? {} : {
                backgroundColor: '#E2E8F0',
                borderColor: '#E2E8F0',
                color: '#64748B',
                cursor: 'not-allowed',
                boxShadow: 'none'
              })
            }}
            disabled={!isDirty}
            onClick={onSave}
          >
            <FloppyDisk size={18} weight="bold" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
