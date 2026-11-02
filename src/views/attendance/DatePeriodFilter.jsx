import React, { useEffect, useRef, useState } from 'react';
import { CalendarBlank, CaretDown, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { PERIOD_OPTIONS, MAX_CUSTOM_DAYS, countDays, formatRange, resolvePeriod } from '../../models/AttendanceReportModel';

// Period dropdown laid out like the one in Work Schedule: presets on top, a custom range below.
export function DatePeriodFilter({ period, from, to, onChange }) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setDraftFrom(from);
    setDraftTo(to);
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, from, to]);

  const days = countDays(draftFrom, draftTo);
  const tooLong = days > MAX_CUSTOM_DAYS;
  const backwards = Boolean(draftFrom && draftTo) && days === 0;
  const invalid = !draftFrom || !draftTo || tooLong || backwards;
  const activeLabel = period.mode === 'custom'
    ? 'Custom Date Range'
    : PERIOD_OPTIONS.find((p) => p.id === period.mode)?.label;

  const pick = (mode) => { onChange(mode); setOpen(false); };

  return (
    <div ref={wrapRef} className="att-period">
      <button
        type="button"
        className={`att-period__trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <CalendarBlank size={17} weight="bold" className="att-period__icon" aria-hidden="true" />
        <span className="att-period__label">{activeLabel}:</span>
        <span className="att-period__range">{formatRange(from, to)}</span>
        <CaretDown size={13} weight="bold" className={`att-period__caret${open ? ' is-open' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="att-period__menu">
          <div className="att-period__heading">Select Report Period</div>
          {PERIOD_OPTIONS.map((opt) => {
            const [f, t] = resolvePeriod(opt.id);
            const active = period.mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`att-period__option${active ? ' is-active' : ''}`}
                onClick={() => pick(opt.id)}
              >
                <span>
                  <span className="att-period__option-title">{opt.label}</span>
                  <span className="att-period__option-hint">{opt.hint} ({formatRange(f, t)})</span>
                </span>
                {active && <CheckCircle size={16} weight="fill" aria-hidden="true" />}
              </button>
            );
          })}

          <div className="att-period__divider" />

          <div className={`att-period__custom${period.mode === 'custom' ? ' is-active' : ''}`}>
            <div className="att-period__custom-head">
              <span>Custom Date Range</span>
              <span className="att-period__max">Max {MAX_CUSTOM_DAYS} days</span>
            </div>
            <div className="att-period__fields">
              <label>
                <span>Start Date</span>
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => {
                    setDraftFrom(e.target.value);
                    if (draftTo < e.target.value) setDraftTo(e.target.value);
                  }}
                />
              </label>
              <label>
                <span>End Date</span>
                <input
                  type="date"
                  min={draftFrom || undefined}
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className={tooLong ? 'is-invalid' : undefined}
                />
              </label>
            </div>
            {tooLong && (
              <div className="att-period__error">
                <WarningCircle size={14} weight="bold" aria-hidden="true" />
                <span>Selected: {days} days (Max: {MAX_CUSTOM_DAYS})</span>
              </div>
            )}
            {backwards && <div className="att-period__error">End Date must be on or after Start Date.</div>}
            <button
              type="button"
              className="emp-btn-primary att-period__apply"
              disabled={invalid}
              onClick={() => { onChange('custom', { from: draftFrom, to: draftTo }); setOpen(false); }}
            >
              Apply Date Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
