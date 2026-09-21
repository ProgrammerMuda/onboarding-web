import React from 'react';
import { 
  Globe, 
  Server, 
  Check, 
  CheckCircle2, 
  ShieldAlert, 
  Radio, 
  Zap, 
  GitBranch, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck 
} from 'lucide-react';
import { WORKSPACE_PLANS, INTEGRATION_OPTIONS } from '../../models/OnboardingModel';

const integrationIcons = {
  github: GitBranch,
  slack: MessageSquare,
  analytics: BarChart3,
  security: ShieldCheck
};

export function Step3WorkspaceView({ formData, errors, onUpdateField, onToggleIntegration }) {
  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Workspace Configuration & Plan</h4>
        <p className="text-muted small">
          Select your dedicated deployment architecture, region, and required third-party tool integrations.
        </p>
      </div>

      {/* Subdomain & Region */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-1.5">
            <Globe size={15} className="text-primary" /> Workspace Custom Subdomain <span className="text-danger">*</span>
          </label>
          <div className="input-group">
            <input
              type="text"
              className={`form-control ${errors.subdomain ? 'is-invalid' : ''}`}
              placeholder="acme-hq"
              value={formData.subdomain}
              onChange={(e) => onUpdateField('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            />
            <span className="input-group-text bg-light text-muted small">.proapps.io</span>
          </div>
          {errors.subdomain && (
            <div className="text-danger small mt-1">{errors.subdomain}</div>
          )}
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-1.5">
            <Server size={15} className="text-primary" /> Cloud Hosting Data Region
          </label>
          <select
            className="form-select"
            value={formData.workspaceRegion}
            onChange={(e) => onUpdateField('workspaceRegion', e.target.value)}
          >
            <option value="Singapore (ap-southeast-1)">Singapore (ap-southeast-1) - Ultra Low Latency</option>
            <option value="Jakarta (ap-southeast-3)">Jakarta (ap-southeast-3) - Regional Direct</option>
            <option value="Tokyo (ap-northeast-1)">Tokyo (ap-northeast-1)</option>
            <option value="US East (us-east-1)">US East (N. Virginia)</option>
            <option value="Europe (eu-central-1)">Frankfurt (eu-central-1)</option>
          </select>
        </div>
      </div>

      {/* Plans Selection */}
      <div className="mb-4">
        <label className="form-label fw-semibold small text-dark mb-2.5">
          Select Subscription Tier
        </label>
        <div className="row g-3">
          {WORKSPACE_PLANS.map((plan) => {
            const isSelected = formData.selectedPlan === plan.id;
            return (
              <div key={plan.id} className="col-12 col-lg-4">
                <div 
                  className={`selection-card h-100 position-relative d-flex flex-column justify-content-between p-3 ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => onUpdateField('selectedPlan', plan.id)}
                >
                  {plan.recommended && (
                    <span 
                      className="position-absolute top-0 end-0 badge bg-secondary text-white rounded-bottom-0 rounded-top-0 rounded-start-pill px-2.5 py-1 small"
                      style={{ transform: 'translate(0, 0)' }}
                    >
                      ★ {plan.badge}
                    </span>
                  )}
                  
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold text-dark">{plan.name}</span>
                      <div className={`form-check p-0 m-0`}>
                        <input
                          type="radio"
                          className="form-check-input"
                          checked={isSelected}
                          onChange={() => onUpdateField('selectedPlan', plan.id)}
                        />
                      </div>
                    </div>

                    <div className="d-flex align-items-baseline gap-1 mb-3">
                      <span className="h3 fw-bold text-primary mb-0">{plan.price}</span>
                      <span className="text-muted small">{plan.period}</span>
                    </div>

                    <ul className="list-unstyled mb-3 small">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="d-flex align-items-center gap-2 mb-1.5 text-muted">
                          <Check size={14} className="text-success flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    type="button"
                    className={`btn btn-sm w-100 mt-2 ${
                      isSelected ? 'btn-primary' : 'btn-outline-primary'
                    }`}
                  >
                    {isSelected ? 'Current Selection' : 'Select Tier'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integrations Modules */}
      <div>
        <label className="form-label fw-semibold small text-dark mb-2.5">
          One-Click Ecosystem Integrations
        </label>
        <div className="row g-2">
          {INTEGRATION_OPTIONS.map((item) => {
            const isEnabled = formData.integrations.includes(item.id);
            const Icon = integrationIcons[item.id] || Zap;

            return (
              <div key={item.id} className="col-12 col-md-6">
                <div 
                  className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer transition-all ${
                    isEnabled ? 'border-primary bg-light' : 'bg-white'
                  }`}
                  onClick={() => onToggleIntegration(item.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className={`p-2 rounded-2 ${
                        isEnabled ? 'bg-primary text-white' : 'bg-light text-muted'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="fw-semibold small text-dark">{item.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.desc}</div>
                    </div>
                  </div>

                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input cursor-pointer"
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => onToggleIntegration(item.id)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
