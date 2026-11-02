import React from 'react';
import { SignIn, SignOut, FileText, Image as ImageIcon, UserMinus } from '@phosphor-icons/react';
import { IN_RESULTS, OUT_RESULTS, getRemarks } from '../../models/AttendanceReportModel';
import { getShiftPeriodInfo } from '../schedule/shiftPeriod';

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

// Same footprint as a real thumbnail, so a row without photos is as tall as one with them.
export function NoPhoto() {
  return (
    <figure className="att-photo">
      <div className="att-photo__frame"><ImageIcon size={20} weight="regular" aria-hidden="true" /></div>
      <figcaption>No photo</figcaption>
    </figure>
  );
}

export function PhotoCell({ src, label, name }) {
  if (!src) return <NoPhoto />;
  return (
    <figure className="att-photo">
      <img src={src} alt={`${label} photo of ${name}`} loading="lazy" />
      <figcaption>{label}</figcaption>
    </figure>
  );
}

// Check in and check out results, one pill each: the first is check in, the second check out.
export function StatusPills({ row }) {
  if (!row.inResult) return <span className="att-photo-empty">No status</span>;
  if (row.inResult === 'alpha') {
    return (
      <span className="att-status att-status--alpha">
        <UserMinus size={12} weight="bold" aria-hidden="true" />Alpha
      </span>
    );
  }
  return (
    <div className="att-chips att-chips--stack">
      <span className={`att-status att-status--${row.inResult}`} title={`Check in: ${IN_RESULTS[row.inResult]}`}>
        <SignIn size={12} weight="bold" aria-hidden="true" />{IN_RESULTS[row.inResult]}
      </span>
      <span className={`att-status att-status--${row.outResult}`} title={`Check out: ${OUT_RESULTS[row.outResult]}`}>
        <SignOut size={12} weight="bold" aria-hidden="true" />{OUT_RESULTS[row.outResult]}
      </span>
    </div>
  );
}

export function RemarkChips({ row }) {
  const remarks = getRemarks(row);
  if (remarks.length === 0) return <span className="att-photo-empty">No permission</span>;
  return (
    <div className="att-chips att-chips--stack">
      {remarks.map((t) => (
        <span
          key={t.id}
          className={`att-chip att-chip--${t.id}`}
          title={t.id === 'change_shift' && row.changedFromShift ? `Changed from ${row.changedFromShift}` : undefined}
        >
          <FileText size={13} weight="bold" aria-hidden="true" />{t.label}
        </span>
      ))}
    </div>
  );
}

export function ShiftBadge({ shift }) {
  if (!shift) return null;
  const info = getShiftPeriodInfo(shift, false);
  const Icon = info.Icon;
  return (
    <span className="ws-shift-period-badge" style={{ backgroundColor: info.bg, color: info.color, borderColor: info.border }}>
      <Icon size={12} weight="bold" aria-hidden="true" />
      <span>{info.label}</span>
    </span>
  );
}
