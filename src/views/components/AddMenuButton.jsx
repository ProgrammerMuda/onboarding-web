import React, { useEffect, useRef, useState } from 'react';
import { CaretDown, CheckCircle, Plus } from '@phosphor-icons/react';

// The Add employee dropdown, shared: add by hand, import from Excel, download the import template.
// `items` holds { id, title, desc, Icon, tone } entries and 'divider' strings; tone is '', 'secondary' or 'download'.
export function AddMenuButton({ label, items, onSelect }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="emp-add-dropdown-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`emp-btn-primary ${open ? 'active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Plus size={16} weight="bold" aria-hidden="true" />
        <span>{label}</span>
        <CaretDown
          size={12}
          weight="bold"
          aria-hidden="true"
          style={{ marginLeft: '2px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
        />
      </button>

      {open && (
        <div className="emp-add-dropdown-menu" role="menu" aria-label={label}>
          {items.map((item, i) => (
            item === 'divider' ? (
              <div key={`divider-${i}`} className="emp-dropdown-divider" />
            ) : (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className="emp-add-dropdown-item"
                onClick={() => { setOpen(false); onSelect(item.id); }}
              >
                <div className={`emp-add-item-icon ${item.tone ?? ''}`}>
                  <item.Icon size={18} weight="bold" />
                </div>
                <div className="emp-add-item-text">
                  <span className="emp-add-item-title">{item.title}</span>
                  <span className="emp-add-item-desc">{item.desc}</span>
                </div>
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}

// Short confirmation in the bottom-right corner, gone after three seconds.
export function useActionToast() {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const notify = (text) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), 3000);
  };
  return [message, notify];
}

export function ActionToast({ message }) {
  if (!message) return null;
  return (
    <div className="position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1100 }} role="status">
      <div className="alert alert-dark shadow-lg d-flex align-items-center mb-0 py-3 px-4 text-white border-0 rounded-pill" style={{ gap: '10px' }}>
        <CheckCircle size={20} className="text-info" weight="bold" />
        <span className="small fw-semibold">{message}</span>
      </div>
    </div>
  );
}

// Runs a template download and reports a failure through `notify`.
export async function runTemplateDownload(download, notify) {
  try {
    await download();
  } catch (err) {
    console.error('Failed to download import template:', err);
    notify('The template could not be downloaded. Try again.');
  }
}
