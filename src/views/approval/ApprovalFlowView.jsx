import React from 'react';
import { CheckCircle, WarningCircle, Info, ShieldCheck, X } from '@phosphor-icons/react';
import { ScopeList } from './ScopeList';
import { ApprovalChainBuilder } from './ApprovalChainBuilder';
import { ConfirmDialog } from './ConfirmDialog';

export function ApprovalFlowView({ presenter }) {
  const {
    // State
    configs,
    employees,
    departments,
    roles,
    requestTypes,
    targetType,
    setTargetType,
    selectedTargetId,
    currentTarget,
    targetStatus,
    searchQuery,
    setSearchQuery,
    filteredDepartments,
    filteredEmployees,
    departmentStats,
    editorMode,
    activeRequestType,
    setActiveRequestType,
    activeChain,
    isDirty,
    validationErrors,
    notification,
    confirmDialog,
    setConfirmDialog,
    perTypeCustomMap,

    // Actions
    handleSelectTarget,
    handleToggleEditorMode,
    handleAddLevel,
    handleRemoveLevel,
    handleUpdateLevelRole,
    handleUpdateLevelMode,
    handleAddUserToLevel,
    handleRemoveUserFromLevel,
    handleUpdateLevelRule,
    handleUpdateRejectNoteOption,
    handleUpdateFallbackOption,
    handleSave,
    handleCancel,
    handleResetToDepartmentDefault,
    handleResetTypeToGeneralRule,
    setNotification
  } = presenter;

  return (
    <div className="d-flex flex-column h-100">
      {/* Page Title Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold text-primary mb-1" style={{ letterSpacing: '-0.02em' }}>
            Request Approval
          </h3>
          <p className="text-muted small mb-0">
            Configure multi-level approval hierarchies for employee requests (Leave, Attendance, Overtime, Shift Exchange)
          </p>
        </div>
      </div>

      {/* Notifications / Feedback Alert */}
      {notification && (
        <div
          className="d-flex align-items-center gap-3 rounded-3 shadow-xs border"
          style={{
            padding: '12px 18px',
            marginBottom: '16px',
            backgroundColor:
              notification.type === 'success'
                ? '#ECFDF5'
                : notification.type === 'info'
                ? '#EFF6FF'
                : '#FEF2F2',
            borderColor:
              notification.type === 'success'
                ? '#A7F3D0'
                : notification.type === 'info'
                ? '#BFDBFE'
                : '#FECACA',
            color:
              notification.type === 'success'
                ? '#065F46'
                : notification.type === 'info'
                ? '#1E40AF'
                : '#991B1B'
          }}
          role="alert"
        >
          {notification.type === 'success' ? (
            <CheckCircle size={20} weight="fill" className="flex-shrink-0" style={{ color: '#059669' }} />
          ) : notification.type === 'info' ? (
            <Info size={20} weight="fill" className="flex-shrink-0" style={{ color: '#2563EB' }} />
          ) : (
            <WarningCircle size={20} weight="fill" className="flex-shrink-0" style={{ color: '#DC2626' }} />
          )}
          <div className="small fw-semibold flex-grow-1" style={{ fontSize: '0.85rem' }}>
            {notification.message}
          </div>
          <button
            type="button"
            className="btn p-0 d-flex align-items-center justify-content-center rounded-circle border-0 flex-shrink-0"
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              color: 'currentColor',
              opacity: 0.65,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.65';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={() => setNotification(null)}
            aria-label="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="row g-3.5 flex-grow-1" style={{ minHeight: '600px' }}>
        {/* Left Column: Scope & Target List */}
        <div className="col-12 col-lg-4 col-xl-3">
          <ScopeList
            targetType={targetType}
            setTargetType={setTargetType}
            selectedTargetId={selectedTargetId}
            onSelectTarget={handleSelectTarget}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredDepartments={filteredDepartments}
            filteredEmployees={filteredEmployees}
            departmentStats={departmentStats}
            departments={departments}
            employees={employees}
            roles={roles}
            configs={configs}
          />
        </div>

        {/* Right Column: Approval Chain Editor */}
        <div className="col-12 col-lg-8 col-xl-9">
          <ApprovalChainBuilder
            targetType={targetType}
            currentTarget={currentTarget}
            targetStatus={targetStatus}
            departments={departments}
            roles={roles}
            allEmployees={employees}
            requestTypes={requestTypes}
            editorMode={editorMode}
            onToggleEditorMode={handleToggleEditorMode}
            activeRequestType={activeRequestType}
            onSelectRequestType={setActiveRequestType}
            activeChain={activeChain}
            isDirty={isDirty}
            validationErrors={validationErrors}
            perTypeCustomMap={perTypeCustomMap}
            onAddLevel={handleAddLevel}
            onRemoveLevel={handleRemoveLevel}
            onUpdateRole={handleUpdateLevelRole}
            onUpdateMode={handleUpdateLevelMode}
            onAddUser={handleAddUserToLevel}
            onRemoveUser={handleRemoveUserFromLevel}
            onUpdateRule={handleUpdateLevelRule}
            onUpdateRejectNote={handleUpdateRejectNoteOption}
            onUpdateFallback={handleUpdateFallbackOption}
            onSave={handleSave}
            onCancel={handleCancel}
            onResetToDepartmentDefault={handleResetToDepartmentDefault}
            onResetTypeToGeneralRule={handleResetTypeToGeneralRule}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
