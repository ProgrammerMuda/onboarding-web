import React from 'react';
import { Mail, Plus, Trash2, UserPlus, Shield, Info } from 'lucide-react';
import { USER_ROLES } from '../../models/UserModel';

export function Step2TeamView({
  teamMembers,
  newMemberEmail,
  newMemberRole,
  inviteError,
  onSetEmail,
  onSetRole,
  onAddMember,
  onRemoveMember
}) {
  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Invite Core Team Members</h4>
        <p className="text-muted small">
          Add engineers, designers, or project leads. They will receive automated setup keys to join your workspace.
        </p>
      </div>

      {/* Add New Member Input Group */}
      <div className="card-modern p-3 p-md-4 mb-4 bg-light border-0">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-1.5">
              <Mail size={14} className="text-secondary" /> Member Email Address
            </label>
            <input
              type="email"
              className={`form-control ${inviteError ? 'is-invalid' : ''}`}
              placeholder="teammate@company.com"
              value={newMemberEmail}
              onChange={(e) => onSetEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddMember()}
            />
            {inviteError && (
              <div className="invalid-feedback small">{inviteError}</div>
            )}
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-1.5">
              <Shield size={14} className="text-secondary" /> Role Permission
            </label>
            <select
              className="form-select"
              value={newMemberRole}
              onChange={(e) => onSetRole(e.target.value)}
            >
              {USER_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2">
            <button
              type="button"
              className="btn btn-secondary w-100 d-flex align-items-center justify-content-center gap-1"
              onClick={onAddMember}
            >
              <Plus size={18} />
              <span>Invite</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members List Table */}
      <div className="table-responsive rounded-3 border">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="small text-muted fw-semibold py-3 px-3">Member Email</th>
              <th className="small text-muted fw-semibold py-3">Assigned Role</th>
              <th className="small text-muted fw-semibold py-3">Status</th>
              <th className="small text-muted fw-semibold py-3 text-end px-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-muted small">
                  No team members added yet. You can invite colleagues now or add them later from the dashboard.
                </td>
              </tr>
            ) : (
              teamMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-3">
                    <div className="d-flex align-items-center gap-2.5">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center text-white small fw-bold"
                        style={{ width: '32px', height: '32px', background: '#053079' }}
                      >
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="fw-semibold text-dark small">{member.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-subtle-primary rounded-pill px-2.5 py-1">
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-subtle-secondary rounded-pill px-2 py-0.5 small">
                      {member.status}
                    </span>
                  </td>
                  <td className="text-end px-3">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm p-1.5 rounded-2 border-0 hover-bg-danger-subtle"
                      title="Remove Member"
                      onClick={() => onRemoveMember(member.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="alert alert-info border-0 rounded-3 mt-3 d-flex align-items-center gap-2 py-2.5 px-3">
        <Info size={18} className="text-info flex-shrink-0" />
        <span className="small">
          You can modify roles and revoke keys anytime inside the <strong>Team & Security Settings</strong> page.
        </span>
      </div>
    </div>
  );
}
