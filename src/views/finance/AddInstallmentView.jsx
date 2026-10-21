import React, { useState, useMemo, useEffect } from 'react';
import { CalendarClock } from 'lucide-react';
import {
  ArrowLeft,
  Buildings,
  Receipt,
  CalendarBlank,
  CreditCard,
  FileText,
  CheckCircle,
  WarningCircle,
  ClockCounterClockwise,
  Link,
  Clock,
  ArrowsDownUp,
  ArrowCounterClockwise,
  ShieldCheck
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import '../employee/employee.css';
import '../employee/employee-detail.css';
import './add-installment.css';

const MAX_TENOR_MONTHS = 60;

const formatMoney = (val) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;

const formatMonthLabel = (yyyyMm) => {
  if (!yyyyMm || typeof yyyyMm !== 'string') return '-';
  const [year, month] = yyyyMm.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatShortMonthLabel = (yyyyMm) => {
  if (!yyyyMm || typeof yyyyMm !== 'string') return '-';
  const [year, month] = yyyyMm.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const addMonthsToPeriod = (startPeriod, addCount) => {
  if (!startPeriod) return '';
  const [y, m] = startPeriod.split('-').map(Number);
  const totalMonths = (y * 12) + (m - 1) + addCount;
  const newY = Math.floor(totalMonths / 12);
  const newM = (totalMonths % 12) + 1;
  return `${newY}-${String(newM).padStart(2, '0')}`;
};

// Turns the months each Rev was set to into the final schedule. Every Rev after the
// first must be at least `step` months (the active 1/2/3 Mo interval) after the Rev
// before it, so a Rev that is too close, or already taken, is pushed forward and the
// push carries on to the Revs after it. Because this is recomputed from the original
// picks, moving a Rev back undoes the shifts.
const resolveScheduleMonths = (baseMonths, step = 1) => {
  const resolved = [];
  let previous = '';
  baseMonths.forEach((month, index) => {
    let value = month;
    if (index > 0 && value && previous) {
      const earliest = addMonthsToPeriod(previous, step);
      if (value < earliest) value = earliest;
    }
    resolved.push(value);
    if (value) previous = value;
  });
  return resolved;
};

export default function AddInstallmentView({
  plan = null,
  isEdit = false,
  plans = [],
  availableOutstandingInvoices = [],
  availableUnits = [],
  onBack,
  onSave
}) {
  const [unit, setUnit] = useState(plan?.unit || '');
  const [invoice, setInvoice] = useState(plan?.invoice || '');
  const [start, setStart] = useState(plan?.start || '');
  const [months, setMonths] = useState(plan ? String(plan.months) : '');
  const [amount, setAmount] = useState(plan ? String(plan.amount) : '');
  const [notes, setNotes] = useState(plan?.notes || '');
  const [error, setError] = useState('');
  const [baseMonths, setBaseMonths] = useState(plan?.scheduleMonths || []);
  const [activeInterval, setActiveInterval] = useState(1);
  const scheduleMonths = useMemo(
    () => resolveScheduleMonths(baseMonths, activeInterval),
    [baseMonths, activeInterval]
  );

  // Available invoices for selected unit
  const unitInvoices = useMemo(() => {
    if (!unit) return [];
    return availableOutstandingInvoices
      .filter(
        (inv) =>
          inv.unit === unit &&
          inv.outstanding > 0 &&
          !plans.some((p) => p.invoice === inv.invoice && p.id !== plan?.id)
      )
      .sort((a, b) => b.start.localeCompare(a.start) || b.invoice.localeCompare(a.invoice));
  }, [unit, availableOutstandingInvoices, plans, plan]);

  // Selected invoice details
  const selectedInvoiceData = useMemo(() => {
    if (!invoice) return null;
    return availableOutstandingInvoices.find((inv) => inv.invoice === invoice) || null;
  }, [invoice, availableOutstandingInvoices]);

  // Maximum allowed tenor is fixed at 60 months for every invoice
  const maxTenor = MAX_TENOR_MONTHS;

  // Handle unit selection change with auto-detection of invoice & start billing period
  const handleUnitChange = (val) => {
    setUnit(val);
    setError('');

    if (!val) {
      setInvoice('');
      setAmount('');
      setMonths('');
      setStart('');
      return;
    }

    // Auto-detect matching invoice for selected unit
    const matching = availableOutstandingInvoices.filter(
      (inv) =>
        inv.unit === val &&
        inv.outstanding > 0 &&
        !plans.some((p) => p.invoice === inv.invoice && p.id !== plan?.id)
    );

    if (matching.length > 0) {
      const targetInvoice = matching[0];
      setInvoice(targetInvoice.invoice);
      setAmount(String(targetInvoice.outstanding));
      setStart(targetInvoice.start || '');
    } else {
      setInvoice('');
      setAmount('');
      setStart('');
    }
  };

  // Quick tenor pills options
  const quickPills = [3, 6, 12, 24, 36, 48, 60].filter((num) => num <= maxTenor);

  // Monthly calculation
  const parsedMonths = parseInt(months, 10) || 0;
  const parsedAmount = parseFloat(amount) || 0;
  const baseMonthly = parsedMonths > 0 && parsedAmount > 0 ? Math.floor(parsedAmount / parsedMonths) : 0;
  const monthlyAmount = parsedMonths > 0 && parsedAmount > 0 ? Math.round(parsedAmount / parsedMonths) : 0;

  // Sync schedule whenever start or parsedMonths changes
  useEffect(() => {
    if (!start || parsedMonths <= 0) {
      setBaseMonths([]);
      return;
    }
    const list = [];
    for (let i = 0; i < parsedMonths; i++) {
      list.push(addMonthsToPeriod(start, i * activeInterval));
    }
    setBaseMonths(list);
  }, [start, parsedMonths]);

  const handleApplyInterval = (step) => {
    setActiveInterval(step);
    if (!start || parsedMonths <= 0) return;
    const list = [];
    for (let i = 0; i < parsedMonths; i++) {
      list.push(addMonthsToPeriod(start, i * step));
    }
    setBaseMonths(list);
  };

  const handleSortSchedule = () => {
    if (!scheduleMonths.length) return;
    const first = scheduleMonths[0];
    const rest = scheduleMonths.slice(1).sort();
    setBaseMonths([first, ...rest]);
  };

  const handleResetSchedule = () => {
    handleApplyInterval(1);
  };

  const handleMonthChange = (index, newVal) => {
    setBaseMonths((prev) => {
      const copy = [...prev];
      copy[index] = newVal;
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!unit) {
      setError('Please select a property unit.');
      return;
    }
    if (!invoice) {
      setError('Please select an outstanding invoice.');
      return;
    }
    if (!parsedMonths || parsedMonths < 1) {
      setError('Installment duration must be at least 1 month.');
      return;
    }
    if (parsedMonths > maxTenor) {
      setError(`Maximum duration for this invoice is ${maxTenor} months.`);
      return;
    }

    const payload = {
      id: plan?.id || Date.now(),
      unit,
      invoice,
      start,
      months: parsedMonths,
      amount: parsedAmount,
      paid: plan?.paid || 0,
      billed: monthlyAmount,
      status: plan?.status || 'Pending Approval',
      chief_finance_status: plan?.chief_finance_status || 'pending',
      building_manager_status: plan?.building_manager_status || 'pending',
      notes,
      scheduleMonths,
      createdBy: plan?.createdBy || { name: 'Alex Ross', email: 'alex.ross@acme-corp.io' },
      createdAt: plan?.createdAt || new Date().toISOString()
    };

    if (onSave) {
      onSave(payload);
    }
  };

  const isFormValid = Boolean(unit && invoice && parsedMonths > 0 && parsedMonths <= maxTenor);

  return (
    <div className="add-installment-container">
      {/* 1. Breadcrumbs */}
      <Breadcrumb
        className="add-installment-breadcrumb"
        items={[
          { label: 'Finance' },
          { label: 'Installments', onClick: onBack },
          { label: isEdit ? 'Edit Installment Plan' : 'Create Installment Plan' }
        ]}
      />

      {/* 2. Top Hero Banner matching Add Employee */}
      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button
              type="button"
              className="emp-hero-back-btn"
              onClick={onBack}
              title="Return to Installments"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="emp-hero-banner-tag">FINANCE & BILLING</div>
              <h1 className="emp-hero-banner-title">
                {isEdit ? 'Edit Installment Plan' : 'Create Installment Plan'}
              </h1>
              <p className="emp-hero-banner-desc">
                {isEdit
                  ? 'Update installment plan parameters, duration terms, and review schedule simulations.'
                  : 'Submit a new invoice installment plan request with real-time monthly payment calculation.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert" style={{ borderRadius: '12px' }}>
          <WarningCircle size={20} weight="fill" className="text-danger flex-shrink-0" />
          <div style={{ fontSize: '13.5px' }}>{error}</div>
        </div>
      )}

      {/* 3. Form Layout */}
      <form onSubmit={handleSubmit} className="add-installment-form-layout">
        {/* Top 2 Columns */}
        <div className="add-installment-grid">
          {/* Left Column: Form Inputs */}
          <div className="add-installment-form-col">
            {/* Card 1: Target Unit & Invoice */}
            <div className="add-installment-card">
              <div className="add-installment-card-header">
                <div className="add-installment-card-icon secondary">
                  <Buildings size={22} weight="bold" />
                </div>
                <div>
                  <h2 className="add-installment-card-title">Target Unit & Invoice</h2>
                  <p className="add-installment-card-desc">
                    Select the unit to automatically detect its outstanding invoice and billing period.
                  </p>
                </div>
              </div>

              {/* Field: Unit */}
              <div className="add-installment-field-group">
                <label htmlFor="unit-select" className="add-installment-field-label">
                  Unit <span className="required-star">*</span>
                </label>
                <select
                  id="unit-select"
                  className="add-installment-select"
                  value={unit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                >
                  <option value="">-- Select Unit --</option>
                  {availableUnits.map((u) => (
                    <option key={u} value={u}>
                      Unit {u}
                    </option>
                  ))}
                </select>
                <span className="add-installment-field-hint">
                  Only units with active outstanding invoices are displayed.
                </span>
              </div>

              {/* Field: Invoice Number (Auto-detected & Disabled) */}
              <div className="add-installment-field-group">
                <label htmlFor="invoice-input" className="add-installment-field-label">
                  Invoice Number <span className="required-star">*</span>
                </label>
                <input
                  id="invoice-input"
                  type="text"
                  className="add-installment-input"
                  disabled
                  readOnly
                  placeholder={unit ? 'No unpaid invoice found' : 'Select a unit to automatically detect invoice'}
                  value={
                    invoice
                      ? `${invoice} (${formatMonthLabel(selectedInvoiceData?.start || start)})`
                      : ''
                  }
                />
                <span className="add-installment-field-hint">
                  {unit && invoice
                    ? `Invoice auto-detected for Unit ${unit}.`
                    : 'Invoice number and billing month will be detected automatically when a unit is selected.'}
                </span>
              </div>
            </div>

            {/* Card 2: Duration & Billing Terms */}
            <div className="add-installment-card">
              <div className="add-installment-card-header">
                <div className="add-installment-card-icon secondary">
                  <CalendarBlank size={22} weight="bold" />
                </div>
                <div>
                  <h2 className="add-installment-card-title">Duration & Billing Terms</h2>
                  <p className="add-installment-card-desc">
                    Specify the number of installment months and the first billing cycle.
                  </p>
                </div>
              </div>

              {/* Field: Start Period (Disabled & Auto-matched with Invoice Month) */}
              <div className="add-installment-field-group">
                <label htmlFor="start-period" className="add-installment-field-label">
                  First Billing Period <span className="required-star">*</span>
                </label>
                <input
                  id="start-period"
                  type="text"
                  className="add-installment-input"
                  disabled
                  readOnly
                  placeholder={unit ? 'No billing month detected' : 'Select a unit to automatically set billing period'}
                  value={invoice && start ? formatMonthLabel(start) : ''}
                />
                <span className="add-installment-field-hint">
                  {invoice && start
                    ? `First billing period automatically aligned with invoice month (${formatMonthLabel(start)}).`
                    : 'The first installment billing cycle will automatically match the invoice month.'}
                </span>
              </div>

              {/* Field: Tenor Input & Pills */}
              <div className="add-installment-field-group">
                <label htmlFor="tenor-input" className="add-installment-field-label">
                  Duration (Months) <span className="required-star">*</span>
                </label>
                <div className="add-installment-input-group">
                  <input
                    id="tenor-input"
                    type="number"
                    min="1"
                    max={maxTenor}
                    className="add-installment-input"
                    placeholder={invoice ? `e.g. 6 (Maximum ${maxTenor} months)` : 'Select an invoice first'}
                    value={months}
                    disabled={!invoice}
                    onChange={(e) => setMonths(e.target.value)}
                  />
                  <span className="add-installment-input-addon">Months</span>
                </div>

                {/* Quick Pills */}
                <div className="add-installment-pills-row">
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                    Quick Select:
                  </span>
                  {quickPills.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`add-installment-pill ${Number(months) === p ? 'active' : ''}`}
                      disabled={!invoice}
                      onClick={() => setMonths(String(p))}
                    >
                      {p} Months
                    </button>
                  ))}
                </div>
              </div>

              {/* Field: Notes */}
              <div className="add-installment-field-group">
                <label htmlFor="notes-textarea" className="add-installment-field-label">
                  Request Notes (Optional)
                </label>
                <textarea
                  id="notes-textarea"
                  className="add-installment-textarea"
                  placeholder="Provide justification, reference to written tenant agreement, or approval memo..."
                  value={notes}
                  disabled={!invoice}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <span className="add-installment-field-hint">
                  These notes will be reviewed by Chief Finance and Building Manager during the approval flow.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary */}
          <div className="add-installment-summary-col">
            {/* Summary Card */}
            <div className="add-installment-summary-card">
              <div className="add-installment-summary-header">
                <div className="add-installment-summary-icon">
                  <CreditCard size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="add-installment-summary-title">Invoice Summary</h3>
                  <p className="add-installment-summary-desc">
                    Overview of linked invoice and estimated installment breakdown.
                  </p>
                </div>
              </div>

              <div className="add-installment-metric-list">
                <div className="add-installment-metric-item">
                  <span className="add-installment-metric-label">Unit:</span>
                  <span className="add-installment-metric-value">{unit ? `Unit ${unit}` : '-'}</span>
                </div>
                <div className="add-installment-metric-item">
                  <span className="add-installment-metric-label">Invoice Number:</span>
                  <span className="add-installment-metric-value">{invoice || '-'}</span>
                </div>
                <div className="add-installment-metric-item">
                  <span className="add-installment-metric-label">Total Invoice:</span>
                  <span className="add-installment-metric-value">{formatMoney(parsedAmount)}</span>
                </div>
                <div className="add-installment-metric-item">
                  <span className="add-installment-metric-label">Outstanding Balance:</span>
                  <span className="add-installment-metric-value accent-orange">
                    {formatMoney(parsedAmount)}
                  </span>
                </div>
                <div className="add-installment-metric-item">
                  <span className="add-installment-metric-label">Maximum Duration:</span>
                  <span className="add-installment-metric-value">{invoice ? `${maxTenor} Months` : '-'}</span>
                </div>
                <div className="add-installment-metric-item estimated-item">
                  <span className="add-installment-metric-label">Estimated Monthly Installment:</span>
                  <span className="add-installment-metric-value highlight">
                    {monthlyAmount > 0 ? formatMoney(monthlyAmount) : '-'}
                  </span>
                </div>
              </div>

              {/* Requires Multi-Party Approval Notice */}
              <div className="add-installment-approval-notice">
                <ShieldCheck size={20} weight="fill" className="add-installment-approval-icon" />
                <div className="add-installment-approval-info">
                  <strong>Requires Multi-Party Approval</strong>
                  <p>Chief Finance and Building Manager approval required before activation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Section: Installment Schedule Preview matching screenshot */}
        <div className="add-installment-card add-installment-schedule-full-card">
          <div className="add-installment-card-header add-installment-schedule-header">
            <div className="add-installment-schedule-header-left">
              <div className="add-installment-card-icon secondary">
                <CalendarClock size={22} weight="bold" />
              </div>
              <div>
                <h2 className="add-installment-card-title">Installment Schedule Preview</h2>
                <p className="add-installment-card-desc">
                  Default monthly installments in sequence. You can flexibly customize the invoice month for each installment.
                </p>
              </div>
            </div>

            <div className="add-installment-schedule-tools">
              <div className="add-installment-interval-group">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    type="button"
                    className={`add-installment-interval-btn ${activeInterval === step ? 'active' : ''}`}
                    disabled={!scheduleMonths.length}
                    onClick={() => handleApplyInterval(step)}
                  >
                    {step} Mo
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="add-installment-tool-btn"
                disabled={!scheduleMonths.length}
                onClick={handleSortSchedule}
              >
                <ArrowsDownUp size={14} weight="bold" />
                Sort
              </button>

              <button
                type="button"
                className="add-installment-tool-btn"
                disabled={!scheduleMonths.length}
                onClick={handleResetSchedule}
              >
                <ArrowCounterClockwise size={14} weight="bold" />
                Reset
              </button>

              <span className="add-installment-badge-pill">
                {scheduleMonths.length} Installments
              </span>
            </div>
          </div>

          {scheduleMonths.length > 0 ? (
            <div className="add-installment-schedule-table-wrap">
              <table className="add-installment-preview-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Inst #</th>
                    <th style={{ width: '280px' }}>Invoice Month (Period)</th>
                    <th>Invoice Application</th>
                    <th style={{ textAlign: 'right', width: '180px' }}>Installment Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleMonths.map((mVal, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === scheduleMonths.length - 1;
                    const rowAmount = isLast
                      ? parsedAmount - (baseMonthly * (scheduleMonths.length - 1))
                      : baseMonthly;

                    return (
                      <tr key={idx}>
                        <td className="add-installment-rev-cell">Rev {idx + 1}</td>
                        <td>
                          <div className="add-installment-month-cell">
                            <input
                              type="month"
                              className="add-installment-schedule-date-input"
                              value={mVal}
                              readOnly={isFirst}
                              min={isFirst ? start : addMonthsToPeriod(scheduleMonths[idx - 1], activeInterval)}
                              onChange={(e) => handleMonthChange(idx, e.target.value)}
                            />
                            <span className="add-installment-short-month-label">
                              {formatShortMonthLabel(mVal)}
                            </span>
                          </div>
                        </td>
                        <td>
                          {isFirst ? (
                            <span className="add-installment-badge-attached">
                              <Link size={14} weight="bold" />
                              Attached to {invoice || '-'} ({formatShortMonthLabel(mVal)}) upon approval
                            </span>
                          ) : (
                            <span className="add-installment-badge-auto">
                              <Clock size={14} weight="regular" />
                              Automatically billed in invoice {formatShortMonthLabel(mVal)}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {formatMoney(rowAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="add-installment-tfoot-label">
                      Total Installment Plan:
                    </td>
                    <td className="add-installment-tfoot-amount">
                      {formatMoney(parsedAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="add-installment-schedule-empty">
              Select a unit and duration to load the installment schedule simulation.
            </div>
          )}
          {/* Card Footer Actions */}
          <div className="add-installment-card-footer">
            <button
              type="button"
              className="add-installment-btn-cancel"
              onClick={onBack}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-installment-btn-submit"
              disabled={!isFormValid}
            >
              {isEdit ? 'Save Changes' : 'Submit Installment Request'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
