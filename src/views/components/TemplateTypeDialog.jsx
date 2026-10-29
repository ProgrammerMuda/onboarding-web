import React, { useEffect, useRef, useState } from 'react';
import { FileArrowDown, X } from '@phosphor-icons/react';
import './template-dialog.css';

// Asks which template to download when a menu has more than one form.
// `options` are { id, label, hint, Icon }.
export function TemplateTypeDialog({ title, description, legend, options, initialId, onDownload, onCancel }) {
  const [picked, setPicked] = useState(initialId ?? options[0].id);
  const [busy, setBusy] = useState(false);
  const optionRefs = useRef({});

  useEffect(() => { optionRefs.current[initialId ?? options[0].id]?.focus(); }, []); // focus once, on open
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onDownload(picked);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="emp-modal-backdrop" onClick={onCancel}>
      <form
        className="emp-modal-card unit-tpl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tpl-dialog-title"
        aria-describedby="tpl-dialog-desc"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <button type="button" className="unit-tpl__close" onClick={onCancel} aria-label="Close">
          <X size={18} weight="bold" />
        </button>
        <h3 className="unit-tpl__title" id="tpl-dialog-title">{title}</h3>
        <p className="unit-tpl__desc" id="tpl-dialog-desc">{description}</p>

        <fieldset className="unit-tpl__options">
          <legend className="visually-hidden">{legend}</legend>
          {options.map(({ id, label, hint, Icon }) => {
            const checked = picked === id;
            return (
              <label key={id} className={`unit-tpl__option${checked ? ' is-checked' : ''}`}>
                <input
                  ref={(el) => { optionRefs.current[id] = el; }}
                  type="radio"
                  name="template-type"
                  value={id}
                  checked={checked}
                  onChange={() => setPicked(id)}
                />
                <span className="unit-tpl__icon" aria-hidden="true"><Icon size={20} weight="bold" /></span>
                <span className="unit-tpl__text">
                  <span className="unit-tpl__name">{label}</span>
                  <span className="unit-tpl__hint">{hint}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="unit-tpl__foot">
          <button type="button" className="emp-btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="emp-btn-primary" disabled={busy}>
            <FileArrowDown size={16} weight="bold" aria-hidden="true" />
            <span>{busy ? 'Preparing…' : 'Download template'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default TemplateTypeDialog;
