import React from 'react';
import { 
  CheckCircle2, 
  Building2, 
  Users, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  RotateCcw,
  Globe,
  Mail,
  Zap
} from 'lucide-react';
import { WORKSPACE_PLANS } from '../../models/OnboardingModel';

export function Step4SummaryView({
  formData,
  isCompleted,
  isSubmitting,
  onLaunch,
  onReset,
  onGoToDashboard
}) {
  const selectedPlanDetails = WORKSPACE_PLANS.find(p => p.id === formData.selectedPlan) || WORKSPACE_PLANS[1];

  if (isCompleted) {
    return (
      <div className="text-center py-5">
        <div 
          className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center text-white shadow-lg animate__animated animate__bounceIn"
          style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #10B981, #09B2FF)' }}
        >
          <CheckCircle2 size={46} strokeWidth={2.5} />
        </div>

        <h3 className="fw-bold text-dark mb-2">Workspace Successfully Deployed! 🎉</h3>
        <p className="text-muted mx-auto mb-4" style={{ maxWidth: '520px' }}>
          Congratulations! <strong>{formData.companyName}</strong> has been provisioned on the PROAPPS cloud. 
          Invitations have been dispatched to <strong>{formData.teamMembers.length} team members</strong>.
        </p>

        <div className="card-modern p-4 mb-4 mx-auto text-start bg-light" style={{ maxWidth: '560px' }}>
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <span className="text-muted small">Live Endpoint:</span>
            <a 
              href={`https://${formData.subdomain}.proapps.io`} 
              target="_blank" 
              rel="noreferrer"
              className="fw-bold text-secondary text-decoration-none d-flex align-items-center gap-1"
            >
              https://{formData.subdomain}.proapps.io <Globe size={14} />
            </a>
          </div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted small">Subscription Plan:</span>
            <span className="badge badge-subtle-primary rounded-pill px-2.5 py-1 fw-bold">
              {selectedPlanDetails.name} ({selectedPlanDetails.price}{selectedPlanDetails.period})
            </span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted small">Status:</span>
            <span className="badge badge-subtle-success rounded-pill px-2.5 py-1 d-flex align-items-center gap-1">
              <span className="pulse-dot"></span> Online & Operational
            </span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-center gap-3">
          <button
            type="button"
            className="btn btn-brand-gradient px-4 py-2.5 d-flex align-items-center gap-2"
            onClick={onGoToDashboard}
          >
            <span>Open Executive Dashboard</span>
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary px-3 py-2.5 d-flex align-items-center gap-2"
            onClick={onReset}
          >
            <RotateCcw size={16} />
            <span>Restart Onboarding Demo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Review & Confirm Deployment</h4>
        <p className="text-muted small">
          Please verify your organization parameters before launching your enterprise workspace.
        </p>
      </div>

      <div className="row g-4 mb-4">
        {/* Organization Card */}
        <div className="col-12 col-md-6">
          <div className="card-modern p-3.5 h-100">
            <div className="d-flex align-items-center gap-2 mb-3 text-primary">
              <Building2 size={18} />
              <span className="fw-bold small text-uppercase">Organization Info</span>
            </div>
            <div className="small">
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Company Name:</span>
                <span className="fw-semibold text-dark">{formData.companyName}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Admin:</span>
                <span className="fw-semibold text-dark">{formData.fullName}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Email:</span>
                <span className="fw-semibold text-dark">{formData.workEmail}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Industry:</span>
                <span className="fw-semibold text-dark">{formData.industry}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace & Infrastructure */}
        <div className="col-12 col-md-6">
          <div className="card-modern p-3.5 h-100">
            <div className="d-flex align-items-center gap-2 mb-3 text-secondary">
              <Layers size={18} />
              <span className="fw-bold small text-uppercase">Infrastructure & Tier</span>
            </div>
            <div className="small">
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Tier Selected:</span>
                <span className="badge badge-subtle-primary fw-bold">{selectedPlanDetails.name}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Dedicated URL:</span>
                <span className="fw-semibold text-primary">{formData.subdomain}.proapps.io</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Primary Region:</span>
                <span className="fw-semibold text-dark">{formData.workspaceRegion}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Integrations:</span>
                <span className="fw-semibold text-dark">{formData.integrations.length} Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Invitations Summary */}
        <div className="col-12">
          <div className="card-modern p-3.5">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2 text-dark">
                <Users size={18} className="text-primary" />
                <span className="fw-bold small text-uppercase">
                  Team Members to Invite ({formData.teamMembers.length})
                </span>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {formData.teamMembers.map((m) => (
                <div 
                  key={m.id} 
                  className="badge bg-light text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-2"
                >
                  <Mail size={13} className="text-secondary" />
                  <span className="fw-semibold">{m.email}</span>
                  <span className="badge badge-subtle-primary ms-1">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Launch Trigger */}
      <div className="card-modern p-4 bg-gradient-proapps text-white mb-3">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <ShieldCheck size={20} className="text-secondary" />
              <h5 className="fw-bold mb-0">Ready for Instant Provisioning</h5>
            </div>
            <p className="text-white-50 small mb-0">
              Zero downtime setup. Your cluster environment will be configured in less than 60 seconds.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary px-4 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-lg"
            onClick={onLaunch}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Provisioning Cluster...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Launch PROAPPS Workspace</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
