import React from 'react';
import { StepProgress } from '../components/StepProgress';
import { Step1AccountView } from './Step1AccountView';
import { Step2TeamView } from './Step2TeamView';
import { Step3WorkspaceView } from './Step3WorkspaceView';
import { Step4SummaryView } from './Step4SummaryView';
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react';

export function OnboardingWizardView({ presenter, onGoToDashboard }) {
  const {
    steps,
    currentStep,
    formData,
    errors,
    isCompleted,
    isSubmitting,
    newMemberEmail,
    newMemberRole,
    inviteError,
    goToStep,
    nextStep,
    prevStep,
    updateFormField,
    setNewMemberEmail,
    setNewMemberRole,
    addTeamMember,
    removeTeamMember,
    toggleIntegration,
    completeOnboarding,
    resetOnboarding
  } = presenter;

  return (
    <div className="container py-4 py-lg-5" style={{ maxWidth: '960px' }}>
      {/* Hero Header */}
      <div className="text-center mb-4">
        <span className="badge badge-subtle-primary rounded-pill px-3 py-1 mb-2 font-monospace small">
          ENTERPRISE ONBOARDING ENGINE
        </span>
        <h2 className="fw-bold text-dark mb-2">
          Setup Your <span className="text-gradient-brand">PROAPPS</span> Enterprise Cloud
        </h2>
        <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
          Configure your team, provision enterprise-grade infrastructure, and start shipping in minutes.
        </p>
      </div>

      {/* Progress Timeline */}
      <StepProgress 
        steps={steps} 
        currentStep={currentStep} 
        onSelectStep={goToStep} 
      />

      {/* Main Wizard Form Card */}
      <div className="card-modern p-4 p-md-5 mb-4 position-relative overflow-hidden">
        {/* Step 1 View */}
        {currentStep === 1 && (
          <Step1AccountView
            formData={formData}
            errors={errors}
            onUpdateField={updateFormField}
          />
        )}

        {/* Step 2 View */}
        {currentStep === 2 && (
          <Step2TeamView
            teamMembers={formData.teamMembers}
            newMemberEmail={newMemberEmail}
            newMemberRole={newMemberRole}
            inviteError={inviteError}
            onSetEmail={setNewMemberEmail}
            onSetRole={setNewMemberRole}
            onAddMember={addTeamMember}
            onRemoveMember={removeTeamMember}
          />
        )}

        {/* Step 3 View */}
        {currentStep === 3 && (
          <Step3WorkspaceView
            formData={formData}
            errors={errors}
            onUpdateField={updateFormField}
            onToggleIntegration={toggleIntegration}
          />
        )}

        {/* Step 4 View */}
        {currentStep === 4 && (
          <Step4SummaryView
            formData={formData}
            isCompleted={isCompleted}
            isSubmitting={isSubmitting}
            onLaunch={completeOnboarding}
            onReset={resetOnboarding}
            onGoToDashboard={onGoToDashboard}
          />
        )}

        {/* Navigation Buttons (shown when not completed and step < 4 or before final launch) */}
        {!isCompleted && currentStep < 4 && (
          <div className="d-flex align-items-center justify-content-between pt-4 mt-4 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              className="btn btn-primary px-4 d-flex align-items-center gap-2"
              onClick={nextStep}
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {!isCompleted && currentStep === 4 && (
          <div className="d-flex align-items-center justify-content-between pt-4 mt-4 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={prevStep}
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} />
              <span>Back to Workspace Config</span>
            </button>
          </div>
        )}
      </div>

      {/* Security & Guarantee Footer */}
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-4 text-muted small">
        <div className="d-flex align-items-center gap-1.5">
          <Shield size={16} className="text-secondary" />
          <span>256-Bit TLS End-to-End Encryption</span>
        </div>
        <div>•</div>
        <div>ISO/IEC 27001 Certified</div>
        <div>•</div>
        <div>99.99% Guaranteed SLA Uptime</div>
      </div>
    </div>
  );
}
