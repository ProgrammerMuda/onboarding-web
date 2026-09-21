import React from 'react';
import { Building, User, Mail, Phone, Briefcase, Users2 } from 'lucide-react';
import { INDUSTRY_OPTIONS } from '../../models/OnboardingModel';

export function Step1AccountView({ formData, errors, onUpdateField }) {
  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Company & Account Setup</h4>
        <p className="text-muted small">
          Please provide your primary business details to provision your dedicated PROAPPS cloud organization.
        </p>
      </div>

      <div className="row g-3">
        {/* Company Name */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-1.5">
            <Building size={15} className="text-primary" /> Company Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
            placeholder="e.g. Acme Corporation"
            value={formData.companyName}
            onChange={(e) => onUpdateField('companyName', e.target.value)}
          />
          {errors.companyName && (
            <div className="invalid-feedback small">{errors.companyName}</div>
          )}
        </div>

        {/* Work Email */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-1.5">
            <Mail size={15} className="text-primary" /> Primary Admin Email <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            className={`form-control ${errors.workEmail ? 'is-invalid' : ''}`}
            placeholder="name@company.com"
            value={formData.workEmail}
            onChange={(e) => onUpdateField('workEmail', e.target.value)}
          />
          {errors.workEmail && (
            <div className="invalid-feedback small">{errors.workEmail}</div>
          )}
        </div>

        {/* Full Name */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-1.5">
            <User size={15} className="text-primary" /> Administrator Full Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
            placeholder="e.g. Alex Ross"
            value={formData.fullName}
            onChange={(e) => onUpdateField('fullName', e.target.value)}
          />
          {errors.fullName && (
            <div className="invalid-feedback small">{errors.fullName}</div>
          )}
        </div>

        {/* Phone Number */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-1.5">
            <Phone size={15} className="text-primary" /> Direct Contact / WhatsApp
          </label>
          <input
            type="tel"
            className="form-control"
            placeholder="+62 812-3456-7890"
            value={formData.phoneNumber}
            onChange={(e) => onUpdateField('phoneNumber', e.target.value)}
          />
        </div>

        {/* Industry */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-1.5">
            <Briefcase size={15} className="text-primary" /> Industry Vertical
          </label>
          <select
            className="form-select"
            value={formData.industry}
            onChange={(e) => onUpdateField('industry', e.target.value)}
          >
            {INDUSTRY_OPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        {/* Company Size */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold small text-dark d-flex align-items-center gap-1.5">
            <Users2 size={15} className="text-primary" /> Team Size
          </label>
          <select
            className="form-select"
            value={formData.companySize}
            onChange={(e) => onUpdateField('companySize', e.target.value)}
          >
            <option value="1-10 employees">1 - 10 employees (Early Stage)</option>
            <option value="11-50 employees">11 - 50 employees (Growth)</option>
            <option value="51-200 employees">51 - 200 employees (Scale-up)</option>
            <option value="201-1000 employees">201 - 1000 employees (Mid-Market)</option>
            <option value="1000+ employees">1000+ employees (Enterprise)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
