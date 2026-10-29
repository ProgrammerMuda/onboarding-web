import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CaretDown, Handshake, House, Key, ShieldCheck } from '@phosphor-icons/react';
import { initialsOf } from '../../models/UnitModel';

// Table and toolbar pieces shared by the tenant lists: Tenant Member and the Tenant Management detail tabs.

export const ROW_MENU_ITEM_HEIGHT = 38;

export const ROLE_ICONS = { Owner: Key, Renter: Handshake, Proxy: ShieldCheck };

export function PersonCell({ name, email }) {
  return (
    <div className="tm-person">
      <span className="tm-avatar" aria-hidden="true">{initialsOf(name)}</span>
      <div className="tm-person__text">
        <span className="ws-emp-name-bold">{name}</span>
        <span className="ws-emp-email-muted">{email}</span>
      </div>
    </div>
  );
}

export function UnitBadge({ code }) {
  return (
    <span className="tm-unit-badge">
      <House size={14} weight="bold" aria-hidden="true" />
      <span>{code}</span>
    </span>
  );
}

export function RoleChip({ role }) {
  const Icon = ROLE_ICONS[role] ?? Key;
  return (
    <span className="tm-role-chip">
      <Icon size={14} weight="bold" aria-hidden="true" />
      {role}
    </span>
  );
}

export function StatusPill({ status }) {
  return <span className={`tm-status tm-status--${status.toLowerCase()}`}>{status}</span>;
}

export function FilterSelect({ label, children, ...rest }) {
  return (
    <div className="unit-select-wrap">
      <select aria-label={rest.id ? undefined : label} className="emp-search-input unit-select" {...rest}>
        {children}
      </select>
      <CaretDown size={14} weight="bold" className="unit-select-caret" aria-hidden="true" />
    </div>
  );
}

// Where a row menu opens: below the trigger, or above it when there is no room.
export function rowMenuAnchor(row, trigger, itemCount) {
  const height = itemCount * ROW_MENU_ITEM_HEIGHT + 14;
  const rect = trigger.getBoundingClientRect();
  const openUp = window.innerHeight - rect.bottom < height + 16;
  return {
    row,
    trigger,
    top: openUp ? rect.top - height - 4 : rect.bottom + 4,
    right: Math.max(8, window.innerWidth - rect.right)
  };
}

// Portal menu; closes on outside click, scroll, resize, Tab, and Escape.
export function RowActionMenu({ anchor, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const list = () => [...(ref.current?.querySelectorAll('[role="menuitem"]') ?? [])];
    list()[0]?.focus({ preventScroll: true });

    const onDown = (e) => {
      if (ref.current?.contains(e.target) || anchor.trigger?.contains(e.target)) return;
      onClose(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(true);
      } else if (e.key === 'Tab') {
        onClose(false);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const els = list();
        const at = els.indexOf(document.activeElement);
        const step = e.key === 'ArrowDown' ? 1 : -1;
        els[(at + step + els.length) % els.length]?.focus({ preventScroll: true });
      }
    };
    const away = () => onClose(false);

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', away, true);
    window.addEventListener('resize', away);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', away, true);
      window.removeEventListener('resize', away);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={ref}
      className="unit-action-menu"
      role="menu"
      aria-label={`Actions for ${anchor.row.name}`}
      style={{ position: 'fixed', top: `${anchor.top}px`, right: `${anchor.right}px`, zIndex: 99999 }}
    >
      {items.map(({ key, label, icon: Icon, run, danger, success }) => (
        <button key={key} type="button" role="menuitem" className={`unit-action-menu__item${danger ? ' tm-menu-danger' : ''}${success ? ' tm-menu-success' : ''}`} onClick={run}>
          <Icon size={16} weight="bold" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
}
