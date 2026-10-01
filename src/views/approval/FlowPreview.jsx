import React from 'react';
import { ArrowRight, CheckCircle, FileText, ShieldCheck } from '@phosphor-icons/react';

export function FlowPreview({ chain, departments = [], roles = [], allEmployees = [], currentDeptId, requesterName = 'Requester' }) {
  const levels = chain?.levels || [];

  return (
    <div
      className="card border shadow-xs"
      style={{
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        borderRadius: '14px',
        padding: '18px 20px 20px 20px',
        marginBottom: '34px'
      }}
    >
      {/* Header with Title & Levels Count */}
      <div
        className="d-flex align-items-center justify-content-between flex-wrap gap-3"
        style={{ marginBottom: '20px' }}
      >
        <div className="d-flex align-items-center gap-2.5">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{ width: '30px', height: '30px', backgroundColor: 'rgba(5, 48, 121, 0.08)', color: '#053079' }}
          >
            <ShieldCheck size={17} weight="bold" />
          </div>
          <h6 className="fw-bold mb-0 text-slate-900" style={{ fontSize: '0.925rem', letterSpacing: '-0.2px' }}>
            Approval Flow Preview
          </h6>
        </div>

        <span
          className="badge fw-semibold px-2.5 py-1"
          style={{
            fontSize: '0.725rem',
            backgroundColor: '#FFFFFF',
            color: '#475569',
            border: '1px solid #E2E8F0',
            borderRadius: '6px'
          }}
        >
          {levels.length} {levels.length === 1 ? 'Approval Level' : 'Approval Levels'}
        </span>
      </div>

      {/* Flowchart Sequence Container (Hug Content / Natural Width) */}
      <div className="d-flex align-items-center gap-3 flex-wrap py-1">
        {/* Step 1: Employee Request */}
        <div
          className="d-flex align-items-center bg-white border rounded-3 shadow-2xs"
          style={{
            borderColor: '#E2E8F0',
            borderRadius: '12px',
            padding: '10px 14px',
            gap: '14px',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
          }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#053079',
              color: '#ffffff'
            }}
          >
            <FileText size={16} weight="bold" />
          </div>
          <div className="min-w-0">
            <div
              className="text-muted fw-bold"
              style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}
            >
              Start
            </div>
            <div className="fw-bold text-slate-900 text-nowrap" style={{ fontSize: '0.8125rem' }} title="Employee Request">
              Employee Request
            </div>
            <div className="text-muted d-flex align-items-center gap-1.5 mt-0.5" style={{ fontSize: '0.7rem' }}>
              <span className="text-nowrap">Initiated by employee</span>
            </div>
          </div>
        </div>

        {/* Levels Flow: Approval 1, Approval 2, ... */}
        {levels.map((lvl, index) => {
          const approver = departments.find((d) => d.id === lvl.roleId) || roles.find((r) => r.id === lvl.roleId) || null;

          // If approver department is not selected yet (unconfigured default case)
          if (!approver) {
            return (
              <React.Fragment key={lvl.id || index}>
                <div className="d-flex align-items-center justify-content-center text-slate-400 flex-shrink-0">
                  <ArrowRight size={15} weight="bold" />
                </div>

                <div
                  className="d-flex align-items-center bg-white border shadow-2xs"
                  style={{
                    borderColor: '#CBD5E1',
                    borderLeft: '3.5px solid #94A3B8',
                    borderStyle: 'dashed',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    gap: '14px',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
                  }}
                >
                  <div
                    className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                    style={{ width: '28px', height: '28px', fontSize: '0.8125rem', backgroundColor: '#94A3B8' }}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-muted fw-bold"
                      style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}
                    >
                      Approval {index + 1}
                    </div>
                    <div
                      className="fw-bold text-slate-700 text-nowrap"
                      style={{ fontSize: '0.8125rem' }}
                      title="Unassigned Approver"
                    >
                      Unassigned Approver
                    </div>
                    <div className="text-muted d-flex align-items-center gap-1.5 mt-0.5" style={{ fontSize: '0.7rem' }}>
                      <span className="text-nowrap">Choose department below</span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          }

          const approverMembers = allEmployees.filter(
            (e) =>
              (e.departmentId === lvl.roleId || e.roleId === lvl.roleId) &&
              e.status === 'active'
          );
          const approversCount = lvl.mode === 'all' ? approverMembers.length : (lvl.userIds || []).length;

          // Resolve specific user names when in 'selected' mode
          const selectedUsers = (lvl.userIds || [])
            .map((id) => allEmployees.find((e) => e.id === id))
            .filter(Boolean);

          let specificApproversText = '';
          if (selectedUsers.length === 0) {
            specificApproversText = 'No specific approver selected';
          } else if (selectedUsers.length <= 2) {
            specificApproversText = selectedUsers.map((u) => u.name).join(', ');
          } else {
            specificApproversText = `${selectedUsers.slice(0, 2).map((u) => u.name).join(', ')} +${selectedUsers.length - 2} more`;
          }

          const allApproverNamesTooltip = selectedUsers.map((u) => u.name).join(', ');

          return (
            <React.Fragment key={lvl.id || index}>
              <div className="d-flex align-items-center justify-content-center text-slate-400 flex-shrink-0">
                <ArrowRight size={15} weight="bold" />
              </div>

              <div
                className="d-flex align-items-center bg-white border shadow-2xs"
                style={{
                  borderColor: '#E2E8F0',
                  borderLeft: '3.5px solid #053079',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  gap: '14px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div
                  className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                  style={{ width: '28px', height: '28px', fontSize: '0.8125rem', backgroundColor: '#053079' }}
                >
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-muted fw-bold"
                    style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}
                  >
                    Approval {index + 1}
                  </div>

                  {lvl.mode === 'all' ? (
                    <>
                      <div
                        className="fw-bold text-slate-900 text-nowrap"
                        style={{ fontSize: '0.8125rem' }}
                        title={lvl.rule === 'all' ? `All ${approver.name}` : `Any ${approver.name}`}
                      >
                        {lvl.rule === 'all' ? `All ${approver.name}` : `Any ${approver.name}`}
                      </div>
                      <div className="text-muted d-flex align-items-center gap-1.5 mt-0.5" style={{ fontSize: '0.7rem' }}>
                        <span className="text-nowrap">
                          Dept: {approver.name} ({approverMembers.length} {approverMembers.length === 1 ? 'person' : 'people'})
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="fw-bold text-slate-900 text-nowrap"
                        style={{ fontSize: '0.8125rem' }}
                        title={allApproverNamesTooltip || specificApproversText}
                      >
                        {specificApproversText}
                      </div>
                      <div className="text-muted d-flex align-items-center gap-1.5 mt-0.5" style={{ fontSize: '0.7rem' }}>
                        <span className="text-nowrap">Dept: {approver.name}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Step Final: Request Approved */}
        <div className="d-flex align-items-center justify-content-center text-slate-400 flex-shrink-0">
          <ArrowRight size={15} weight="bold" />
        </div>

        <div
          className="d-flex align-items-center border shadow-2xs"
          style={{
            backgroundColor: '#ECFDF5',
            borderColor: '#A7F3D0',
            borderRadius: '12px',
            padding: '10px 14px',
            gap: '14px',
            boxShadow: '0 1px 2px rgba(16, 185, 129, 0.05)'
          }}
        >
          <div
            className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '30px', height: '30px' }}
          >
            <CheckCircle size={17} weight="fill" />
          </div>
          <div className="min-w-0">
            <div
              className="text-emerald-700 fw-bold"
              style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}
            >
              Result
            </div>
            <div className="fw-bold text-emerald-950 text-nowrap" style={{ fontSize: '0.8125rem' }} title="Request Approved">
              Request Approved
            </div>
            <div className="text-emerald-700 d-flex align-items-center gap-1.5 mt-0.5" style={{ fontSize: '0.7rem' }}>
              <span className="text-nowrap">Workflow completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

