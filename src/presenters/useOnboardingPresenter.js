import { useState, useCallback } from 'react';
import { OnboardingModel, ONBOARDING_STEPS } from '../models/OnboardingModel';
import confetti from 'canvas-confetti';

/**
 * useOnboardingPresenter - Presenter Layer (MVP)
 * Mediates between OnboardingModel and Onboarding Views.
 * Formats data, enforces validations, handles events, and exposes clean UI callbacks.
 */
export function useOnboardingPresenter() {
  const [modelState, setModelState] = useState(OnboardingModel.getInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Developer');
  const [inviteError, setInviteError] = useState('');

  // Step Navigation
  const goToStep = useCallback((stepNumber) => {
    if (stepNumber < 1 || stepNumber > ONBOARDING_STEPS.length) return;
    
    // Check validation of previous steps before allowing forward navigation
    if (stepNumber > modelState.currentStep) {
      const validation = OnboardingModel.validateStep(modelState.currentStep, modelState.formData);
      if (!validation.isValid) {
        setModelState((prev) => ({ ...prev, errors: validation.errors }));
        return;
      }
    }

    setModelState((prev) => ({
      ...prev,
      currentStep: stepNumber,
      errors: {}
    }));
  }, [modelState.currentStep, modelState.formData]);

  const nextStep = useCallback(() => {
    const validation = OnboardingModel.validateStep(modelState.currentStep, modelState.formData);
    if (!validation.isValid) {
      setModelState((prev) => ({ ...prev, errors: validation.errors }));
      return;
    }

    setModelState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, ONBOARDING_STEPS.length),
      errors: {}
    }));
  }, [modelState.currentStep, modelState.formData]);

  const prevStep = useCallback(() => {
    setModelState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
      errors: {}
    }));
  }, []);

  // Form Field Updates
  const updateFormField = useCallback((field, value) => {
    setModelState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      },
      errors: {
        ...prev.errors,
        [field]: undefined
      }
    }));
  }, []);

  // Team Member Management
  const addTeamMember = useCallback(() => {
    if (!newMemberEmail.trim()) {
      setInviteError('Email address is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)) {
      setInviteError('Invalid email format.');
      return;
    }
    
    // Check duplicates
    if (modelState.formData.teamMembers.some((m) => m.email.toLowerCase() === newMemberEmail.toLowerCase())) {
      setInviteError('Member with this email is already invited.');
      return;
    }

    const newMember = {
      id: Date.now().toString(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      status: 'Pending'
    };

    setModelState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        teamMembers: [...prev.formData.teamMembers, newMember]
      }
    }));

    setNewMemberEmail('');
    setInviteError('');
  }, [newMemberEmail, newMemberRole, modelState.formData.teamMembers]);

  const removeTeamMember = useCallback((id) => {
    setModelState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        teamMembers: prev.formData.teamMembers.filter((m) => m.id !== id)
      }
    }));
  }, []);

  // Integration Toggles
  const toggleIntegration = useCallback((integrationId) => {
    setModelState((prev) => {
      const exists = prev.formData.integrations.includes(integrationId);
      const updated = exists
        ? prev.formData.integrations.filter((id) => id !== integrationId)
        : [...prev.formData.integrations, integrationId];
      return {
        ...prev,
        formData: {
          ...prev.formData,
          integrations: updated
        }
      };
    });
  }, []);

  // Submit / Launch Workspace
  const completeOnboarding = useCallback(async () => {
    setIsSubmitting(true);
    
    // Simulate API provisioning
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setModelState((prev) => ({
      ...prev,
      isCompleted: true
    }));
    setIsSubmitting(false);

    // Trigger celebratory confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#053079', '#09B2FF', '#10B981', '#38bdf8']
    });
  }, []);

  const resetOnboarding = useCallback(() => {
    setModelState(OnboardingModel.getInitialState());
  }, []);

  return {
    // State / View-Model
    steps: ONBOARDING_STEPS,
    currentStep: modelState.currentStep,
    formData: modelState.formData,
    errors: modelState.errors,
    isCompleted: modelState.isCompleted,
    isSubmitting,
    newMemberEmail,
    newMemberRole,
    inviteError,
    
    // Actions / Handlers
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
  };
}
