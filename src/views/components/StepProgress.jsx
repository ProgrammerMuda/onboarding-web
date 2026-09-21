import React from 'react';
import { Check } from 'lucide-react';

export function StepProgress({ steps, currentStep, onSelectStep }) {
  return (
    <div className="card-modern p-3 p-md-4 mb-4">
      <div className="d-flex align-items-center justify-content-between position-relative">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <div 
                className="d-flex flex-column align-items-center text-center cursor-pointer"
                onClick={() => onSelectStep(step.id)}
                style={{ zIndex: 3, minWidth: '80px', cursor: 'pointer' }}
              >
                <div 
                  className={`step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  {isCompleted ? <Check size={20} strokeWidth={3} /> : step.id}
                </div>
                <div className="mt-2 d-none d-md-block">
                  <div className={`small fw-bold ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted'}`}>
                    {step.title}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.725rem' }}>
                    {step.desc}
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className={`step-line d-none d-sm-block ${isCompleted ? 'active' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
