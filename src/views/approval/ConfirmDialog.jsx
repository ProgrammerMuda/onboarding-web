import React from 'react';
import { Warning, WarningCircle, Info, X } from '@phosphor-icons/react';

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  variant = 'primary',
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Warning size={26} weight="fill" className="text-danger" />,
          buttonClass: 'btn btn-danger',
          iconBg: 'bg-danger-subtle'
        };
      case 'warning':
        return {
          icon: <WarningCircle size={26} weight="fill" className="text-warning" />,
          buttonClass: 'btn btn-warning text-dark fw-bold',
          iconBg: 'bg-warning-subtle'
        };
      case 'info':
      default:
        return {
          icon: <Info size={26} weight="fill" className="text-primary" />,
          buttonClass: 'btn btn-primary',
          iconBg: 'bg-primary-subtle'
        };
    }
  };

  const { icon, buttonClass, iconBg } = getVariantStyles();

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '440px' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          <div className="modal-body p-4 text-start">
            <div className="d-flex align-items-start gap-3">
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${iconBg}`}
                style={{ width: '48px', height: '48px' }}
              >
                {icon}
              </div>

              <div className="flex-grow-1">
                <h5 className="fw-bold text-slate-900 mb-1" style={{ fontSize: '1.05rem' }}>
                  {title}
                </h5>
                <p className="text-slate-600 mb-0" style={{ fontSize: '0.875rem', lineHeight: '1.45' }}>
                  {message}
                </p>
              </div>

              <button
                type="button"
                className="btn-close text-slate-400"
                aria-label="Close"
                onClick={onClose}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-2">
              <button
                type="button"
                className="btn btn-sm btn-light border px-3.5 py-2 fw-semibold text-slate-700"
                style={{ borderRadius: '8px' }}
                onClick={onClose}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`btn btn-sm px-3.5 py-2 fw-semibold ${buttonClass}`}
                style={{ borderRadius: '8px' }}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
