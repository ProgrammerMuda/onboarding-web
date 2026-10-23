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
  ShieldCheck,
  Sparkle,
  PencilSimple,
  CaretLeft,
  CaretRight,
  CaretDown
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import '../employee/employee.css';
import '../employee/employee-detail.css';
import './add-installment.css';

const MAX_TENOR_MONTHS = 60;

const formatMoney = (val) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;

const formatNumberWithDots = (val) => {
  if (val === '' || val == null) return '';
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
};

const parseDotsNumber = (str) => {
  if (str === '' || str == null) return '';
  const cleaned = String(str).replace(/\D/g, '');
  return cleaned === '' ? '' : parseInt(cleaned, 10);
};

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

const formatFullMonthLabel = (yyyyMm) => {
  if (!yyyyMm || typeof yyyyMm !== 'string') return '-';
  const [year, month] = yyyyMm.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const monthName = date.toLocaleDateString('id-ID', { month: 'long' });
  const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capMonth} ${year}`;
};

const getCurrentYyyyMm = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const generateAvailableMonthOptions = (basePeriod, existingMonths = []) => {
  const currentYyyyMm = getCurrentYyyyMm();
  let anchor = basePeriod;
  if (!anchor || anchor < currentYyyyMm) {
    anchor = currentYyyyMm;
  }
  const [baseY, baseM] = anchor.split('-').map(Number);
  const set = new Set();

  existingMonths.forEach((m) => {
    if (m && m >= currentYyyyMm) set.add(m);
  });

  // Range from current month up to 60 months forward (no past months)
  for (let offset = 0; offset <= 60; offset++) {
    const total = (baseY * 12) + (baseM - 1) + offset;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    const yyyyMm = `${y}-${String(m).padStart(2, '0')}`;
    if (yyyyMm >= currentYyyyMm) {
      set.add(yyyyMm);
    }
  }

  return Array.from(set).sort().map((val) => ({
    value: val,
    label: formatFullMonthLabel(val)
  }));
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

const MONTH_NAMES_GRID = [
  { num: '01', short: 'Jan', full: 'Januari' },
  { num: '02', short: 'Feb', full: 'Februari' },
  { num: '03', short: 'Mar', full: 'Maret' },
  { num: '04', short: 'Apr', full: 'April' },
  { num: '05', short: 'Mei', full: 'Mei' },
  { num: '06', short: 'Jun', full: 'Juni' },
  { num: '07', short: 'Jul', full: 'Juli' },
  { num: '08', short: 'Ags', full: 'Agustus' },
  { num: '09', short: 'Sep', full: 'September' },
  { num: '10', short: 'Okt', full: 'Oktober' },
  { num: '11', short: 'Nov', full: 'November' },
  { num: '12', short: 'Des', full: 'Desember' }
];

function InstallmentMonthPicker({
  value,
  onChange,
  disabled = false,
  isTakenByOther = () => false,
  dropUp = false,
  placeholder = 'Pilih bulan tagihan',
  minMonth = getCurrentYyyyMm()
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  const minYear = minMonth ? parseInt(minMonth.split('-')[0], 10) : -Infinity;

  const [pickerYear, setPickerYear] = useState(() => {
    if (value && typeof value === 'string') {
      const y = parseInt(value.split('-')[0], 10);
      if (!isNaN(y)) return Math.max(y, minYear);
    }
    const currentY = new Date().getFullYear();
    return Math.max(currentY, minYear);
  });

  useEffect(() => {
    if (value && typeof value === 'string') {
      const y = parseInt(value.split('-')[0], 10);
      if (!isNaN(y)) setPickerYear(Math.max(y, minYear));
    }
  }, [value, minYear]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next && value) {
        const y = parseInt(value.split('-')[0], 10);
        if (!isNaN(y)) setPickerYear(Math.max(y, minYear));
      }
      return next;
    });
  };

  const handleSelectMonth = (monthNumStr) => {
    const yyyyMm = `${pickerYear}-${monthNumStr}`;
    if (minMonth && yyyyMm < minMonth) return;
    onChange(yyyyMm);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`installment-month-picker-wrap ${disabled ? 'is-disabled' : ''}`}
    >
      <button
        type="button"
        className={`installment-month-picker-btn ${!value ? 'is-empty' : ''} ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <CalendarBlank size={15} weight="bold" className="installment-month-picker-icon" />
        <span className="installment-month-picker-label">
          {value ? formatFullMonthLabel(value) : placeholder}
        </span>
        <CaretDown
          size={12}
          weight="bold"
          className={`installment-month-picker-caret ${isOpen ? 'is-open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={`installment-month-picker-popover ${dropUp ? 'drop-up' : 'drop-down'}`}>
          <div className="installment-mp-header">
            <button
              type="button"
              className="installment-mp-nav-btn"
              disabled={pickerYear <= minYear}
              onClick={() => {
                if (pickerYear > minYear) {
                  setPickerYear((y) => y - 1);
                }
              }}
              title={pickerYear <= minYear ? 'Tahun lampau tidak dapat dipilih' : 'Tahun Sebelumnya'}
            >
              <CaretLeft size={13} weight="bold" />
            </button>
            <span className="installment-mp-year-title">{pickerYear}</span>
            <button
              type="button"
              className="installment-mp-nav-btn"
              onClick={() => setPickerYear((y) => y + 1)}
              title="Tahun Selanjutnya"
            >
              <CaretRight size={13} weight="bold" />
            </button>
          </div>

          <div className="installment-mp-grid">
            {MONTH_NAMES_GRID.map((m) => {
              const monthKey = `${pickerYear}-${m.num}`;
              const isSelected = value === monthKey;
              const isTaken = isTakenByOther(monthKey);
              const isPast = Boolean(minMonth && monthKey < minMonth);
              const isDisabled = isTaken || isPast;

              return (
                <button
                  key={m.num}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && handleSelectMonth(m.num)}
                  className={`installment-mp-month-btn ${isSelected ? 'is-selected' : ''}`}
                  title={
                    isPast
                      ? `${m.full} ${pickerYear} (Bulan lampau tidak dapat dipilih)`
                      : isTaken
                      ? `${m.full} ${pickerYear} (Sudah dipilih di baris angsuran lain)`
                      : `${m.full} ${pickerYear}`
                  }
                >
                  <span className="installment-mp-month-text">{m.short}</span>
                </button>
              );
            })}
          </div>

          <div className="installment-mp-footer">
            {value && (
              <button
                type="button"
                className="installment-mp-clear-btn"
                onClick={handleClear}
              >
                Kosongkan
              </button>
            )}
            <button
              type="button"
              className="installment-mp-close-btn"
              onClick={() => setIsOpen(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [scheduleMode, setScheduleMode] = useState('auto'); // 'auto' | 'blank'
  const [activeInterval, setActiveInterval] = useState(1);
  const [scheduleRows, setScheduleRows] = useState(() => {
    if (plan?.scheduleMonths?.length) {
      const planCount = plan.scheduleMonths.length;
      return plan.scheduleMonths.map((m, i) => {
        let amt = 0;
        if (plan.scheduleAmounts?.length === planCount) {
          amt = Number(plan.scheduleAmounts[i]) || 0;
        } else {
          const base = Math.floor((plan.amount || 0) / planCount);
          amt = i === planCount - 1 ? (plan.amount || 0) - base * (planCount - 1) : base;
        }
        return { month: m || '', amount: amt };
      });
    }
    return [];
  });

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

  // Sync schedule whenever inputs change
  useEffect(() => {
    if (scheduleMode !== 'auto') {
      // In blank mode: ensure number of slots matches parsedMonths
      if (parsedMonths <= 0) {
        setScheduleRows([]);
        return;
      }
      setScheduleRows((prev) => {
        if (prev.length === parsedMonths) return prev;
        const list = [];
        for (let i = 0; i < parsedMonths; i++) {
          list.push(prev[i] || { month: '', amount: '' });
        }
        return list;
      });
      return;
    }

    // In auto mode: automatically generate sequential months & equal split
    if (!start || parsedMonths <= 0) {
      setScheduleRows([]);
      return;
    }
    const list = [];
    const base = parsedMonths > 0 && parsedAmount > 0 ? Math.floor(parsedAmount / parsedMonths) : 0;
    for (let i = 0; i < parsedMonths; i++) {
      const m = addMonthsToPeriod(start, i * activeInterval);
      const rowAmt = (i === parsedMonths - 1 && parsedAmount > 0)
        ? parsedAmount - base * (parsedMonths - 1)
        : base;
      list.push({ month: m, amount: rowAmt });
    }
    setScheduleRows(list);
  }, [start, parsedMonths, parsedAmount, activeInterval, scheduleMode]);

  const handleSwitchMode = (newMode) => {
    setScheduleMode(newMode);
    setError('');
    if (newMode === 'auto') {
      setActiveInterval(1);
      if (!start || parsedMonths <= 0) return;
      const list = [];
      const base = parsedMonths > 0 && parsedAmount > 0 ? Math.floor(parsedAmount / parsedMonths) : 0;
      for (let i = 0; i < parsedMonths; i++) {
        const m = addMonthsToPeriod(start, i * 1);
        const rowAmt = (i === parsedMonths - 1 && parsedAmount > 0)
          ? parsedAmount - base * (parsedMonths - 1)
          : base;
        list.push({ month: m, amount: rowAmt });
      }
      setScheduleRows(list);
    } else {
      // Switch to blank draft: provide empty slots for each installment
      setActiveInterval(null);
      const count = parsedMonths > 0 ? parsedMonths : 0;
      const list = Array.from({ length: count }, () => ({ month: '', amount: '' }));
      setScheduleRows(list);
    }
  };

  const handleApplyInterval = (step) => {
    setActiveInterval(step);
    if (!parsedMonths || parsedMonths <= 0) return;

    const baseStart =
      (scheduleMode === 'blank' && scheduleRows[0]?.month) ||
      start ||
      currentYyyyMm;

    if (!baseStart) return;

    if (scheduleMode === 'auto') {
      const list = [];
      const base = parsedMonths > 0 && parsedAmount > 0 ? Math.floor(parsedAmount / parsedMonths) : 0;
      for (let i = 0; i < parsedMonths; i++) {
        const m = addMonthsToPeriod(baseStart, i * step);
        const rowAmt =
          i === parsedMonths - 1 && parsedAmount > 0
            ? parsedAmount - base * (parsedMonths - 1)
            : base;
        list.push({ month: m, amount: rowAmt });
      }
      setScheduleRows(list);
    } else {
      // In blank draft mode: apply interval to months, preserving amounts already set
      setScheduleRows((prev) =>
        prev.map((r, i) => ({
          ...r,
          month: addMonthsToPeriod(baseStart, i * step)
        }))
      );
    }
  };

  const handleRowMonthChange = (index, newMonth) => {
    setActiveInterval(null);
    setScheduleRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], month: newMonth };
      return copy;
    });
  };

  const handleRowAmountChange = (index, rawStr) => {
    const val = parseDotsNumber(rawStr);
    setScheduleRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], amount: val };
      return copy;
    });
  };

  const handleSortSchedule = () => {
    setScheduleRows((prev) => {
      return [...prev].sort((a, b) => {
        if (!a.month) return 1;
        if (!b.month) return -1;
        return a.month.localeCompare(b.month);
      });
    });
  };

  const handleResetSchedule = () => {
    if (scheduleMode === 'auto') {
      handleApplyInterval(1);
    } else {
      setActiveInterval(null);
      setScheduleRows(Array.from({ length: parsedMonths }, () => ({ month: '', amount: '' })));
    }
  };

  const handleDistributeEqualAmounts = () => {
    if (parsedMonths <= 0 || parsedAmount <= 0) return;
    const base = Math.floor(parsedAmount / parsedMonths);
    setScheduleRows((prev) =>
      prev.map((r, i) => ({
        ...r,
        amount: i === parsedMonths - 1 ? parsedAmount - base * (parsedMonths - 1) : base
      }))
    );
  };

  const handleFillRemainderOnLastRow = () => {
    if (scheduleRows.length <= 1 || parsedAmount <= 0) return;
    const previousSum = scheduleRows.slice(0, -1).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const rem = Math.max(0, parsedAmount - previousSum);
    setScheduleRows((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { ...copy[copy.length - 1], amount: rem };
      return copy;
    });
  };

  const currentYyyyMm = useMemo(() => getCurrentYyyyMm(), []);

  const availableMonthOptions = useMemo(() => {
    const existing = scheduleRows.map((r) => r.month).filter(Boolean);
    return generateAvailableMonthOptions(start, existing);
  }, [start, scheduleRows]);

  const hasDuplicateMonths = useMemo(() => {
    const months = scheduleRows.map((r) => r.month).filter(Boolean);
    return new Set(months).size < months.length;
  }, [scheduleRows]);

  const hasPastMonths = useMemo(() => {
    return scheduleRows.some((r) => r.month && r.month < currentYyyyMm);
  }, [scheduleRows, currentYyyyMm]);

  const totalScheduledAmount = useMemo(() => {
    return scheduleRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [scheduleRows]);

  const amountDifference = parsedAmount - totalScheduledAmount;
  const isTotalBalanced = Math.abs(amountDifference) < 1;
  const areAllMonthsFilled = scheduleRows.length > 0 && scheduleRows.every((r) => Boolean(r.month));
  const areAllAmountsValid = scheduleRows.length > 0 && scheduleRows.every((r) => Number(r.amount) > 0);

  const isScheduleComplete =
    scheduleRows.length === parsedMonths &&
    areAllMonthsFilled &&
    areAllAmountsValid &&
    isTotalBalanced &&
    !hasDuplicateMonths &&
    !hasPastMonths;

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
    if (scheduleRows.length !== parsedMonths || !areAllMonthsFilled) {
      setError('Semua baris jadwal angsuran wajib memiliki bulan tagihan.');
      return;
    }
    if (hasPastMonths) {
      setError('Bulan tagihan angsuran hanya bisa dipilih bulan sekarang dan bulan ke depan saja.');
      return;
    }
    if (hasDuplicateMonths) {
      setError('Terdapat duplikasi bulan pada jadwal angsuran. Setiap angsuran harus memiliki bulan tagihan yang berbeda.');
      return;
    }
    if (!areAllAmountsValid) {
      setError('Nominal setiap angsuran wajib diisi lebih dari Rp 0.');
      return;
    }
    if (!isTotalBalanced) {
      setError(
        `Total nominal jadwal angsuran (${formatMoney(totalScheduledAmount)}) harus sama persis dengan total tagihan invoice (${formatMoney(parsedAmount)}). Selisih: ${formatMoney(Math.abs(amountDifference))}.`
      );
      return;
    }

    const payload = {
      id: plan?.id || Date.now(),
      unit,
      invoice,
      start: scheduleRows[0]?.month || start,
      months: parsedMonths,
      amount: parsedAmount,
      paid: plan?.paid || 0,
      billed: Number(scheduleRows[0]?.amount) || monthlyAmount,
      status: plan?.status || 'Pending Approval',
      chief_finance_status: plan?.chief_finance_status || 'pending',
      building_manager_status: plan?.building_manager_status || 'pending',
      notes,
      scheduleMonths: scheduleRows.map((r) => r.month),
      scheduleAmounts: scheduleRows.map((r) => Number(r.amount) || 0),
      createdBy: plan?.createdBy || { name: 'Alex Ross', email: 'alex.ross@acme-corp.io' },
      createdAt: plan?.createdAt || new Date().toISOString()
    };

    if (onSave) {
      onSave(payload);
    }
  };

  const isFormValid = Boolean(
    unit &&
    invoice &&
    parsedMonths > 0 &&
    parsedMonths <= maxTenor &&
    isScheduleComplete
  );

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
                    Specify the duration for installment payment plan.
                  </p>
                </div>
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
                  Atur jadwal bulan tagihan dan nominal angsuran secara otomatis berurutan atau manual melalui draft kosongan.
                </p>
              </div>
            </div>

            <div className="add-installment-schedule-tools">
              {/* Segmented Mode Switcher: Auto vs Blank Draft */}
              <div className="add-installment-mode-tabs" role="tablist" aria-label="Mode Pembuatan Jadwal">
                <button
                  type="button"
                  className={`add-installment-mode-tab ${scheduleMode === 'auto' ? 'active' : ''}`}
                  onClick={() => handleSwitchMode('auto')}
                  disabled={!parsedMonths}
                  title="Isi bulan secara berurutan dan bagi rata nominal otomatis"
                >
                  <Sparkle size={14} weight="bold" />
                  Auto (Bulan Urut)
                </button>
                <button
                  type="button"
                  className={`add-installment-mode-tab ${scheduleMode === 'blank' ? 'active' : ''}`}
                  onClick={() => handleSwitchMode('blank')}
                  disabled={!parsedMonths}
                  title="Disediakan kolom kosongan untuk bebas memilih bulan dan mengisi nominal"
                >
                  <PencilSimple size={14} weight="bold" />
                  Draft Kosongan
                </button>
              </div>

              <div className="add-installment-interval-group">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    type="button"
                    className={`add-installment-interval-btn ${activeInterval === step ? 'active' : ''}`}
                    disabled={!scheduleRows.length}
                    onClick={() => handleApplyInterval(step)}
                  >
                    {step} Mo
                  </button>
                ))}
              </div>

              {scheduleMode === 'blank' && (
                <button
                  type="button"
                  className="add-installment-tool-btn"
                  disabled={!scheduleRows.length || !parsedAmount}
                  onClick={handleDistributeEqualAmounts}
                  title="Bagi rata total invoice ke seluruh baris angsuran"
                >
                  Bagi Rata Nominal
                </button>
              )}

              <button
                type="button"
                className="add-installment-tool-btn"
                disabled={!scheduleRows.length}
                onClick={handleSortSchedule}
                title="Urutkan baris berdasarkan bulan secara kronologis"
              >
                <ArrowsDownUp size={14} weight="bold" />
                Sort
              </button>

              <button
                type="button"
                className="add-installment-tool-btn"
                disabled={!scheduleRows.length}
                onClick={handleResetSchedule}
                title={scheduleMode === 'auto' ? 'Reset jadwal ke interval 1 bulan' : 'Kosongkan kembali semua baris'}
              >
                <ArrowCounterClockwise size={14} weight="bold" />
                {scheduleMode === 'auto' ? 'Reset' : 'Kosongkan'}
              </button>

              <span className="add-installment-badge-pill">
                {scheduleRows.length} Installments
              </span>
            </div>
          </div>

          {scheduleRows.length > 0 ? (
            <div className="add-installment-schedule-table-wrap">
              <table className="add-installment-preview-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Inst #</th>
                    <th style={{ width: '280px' }}>Invoice Month (Period)</th>
                    <th>Invoice Application</th>
                    <th style={{ textAlign: 'right', width: '220px' }}>Installment Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.map((row, idx) => {
                    const isFirst = idx === 0;

                    return (
                      <tr key={idx}>
                        <td className="add-installment-rev-cell">Rev {idx + 1}</td>
                        <td>
                          <div className="add-installment-month-cell">
                            <InstallmentMonthPicker
                              value={row.month || ''}
                              disabled={false}
                              minMonth={currentYyyyMm}
                              isTakenByOther={(monthKey) =>
                                scheduleRows.some((r, i) => i !== idx && r.month === monthKey)
                              }
                              dropUp={scheduleRows.length > 2 && idx >= scheduleRows.length - 2}
                              onChange={(newMonth) => handleRowMonthChange(idx, newMonth)}
                            />
                          </div>
                        </td>
                        <td>
                          {row.month ? (
                            isFirst && row.month === (selectedInvoiceData?.start || start) ? (
                              <span className="add-installment-badge-attached">
                                <Link size={14} weight="bold" />
                                Attached to {invoice || '-'} ({formatShortMonthLabel(row.month)}) upon approval
                              </span>
                            ) : (
                              <span className="add-installment-badge-auto">
                                <Clock size={14} weight="regular" />
                                Automatically billed in invoice {formatShortMonthLabel(row.month)}
                              </span>
                            )
                          ) : (
                            <span className="add-installment-badge-pending">
                              Belum ditentukan
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="add-installment-amount-input-wrap">
                            <span className="add-installment-amount-prefix">Rp</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="add-installment-amount-input"
                              value={formatNumberWithDots(row.amount)}
                              onChange={(e) => handleRowAmountChange(idx, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="add-installment-tfoot-label">
                      Total Jadwal Angsuran:
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        {isTotalBalanced ? (
                          <span className="add-installment-balance-badge success">
                            <CheckCircle size={15} weight="bold" />
                            Total Pas (Sesuai Tagihan: {formatMoney(parsedAmount)})
                          </span>
                        ) : amountDifference > 0 ? (
                          <span className="add-installment-balance-badge warning">
                            <WarningCircle size={15} weight="bold" />
                            Kurang: {formatMoney(amountDifference)}
                            <button
                              type="button"
                              className="add-installment-quick-btn"
                              onClick={handleFillRemainderOnLastRow}
                              title="Alokasikan sisa nominal ke baris terakhir"
                            >
                              Terapkan Sisa ke Rev Terakhir
                            </button>
                          </span>
                        ) : (
                          <span className="add-installment-balance-badge danger">
                            <WarningCircle size={15} weight="bold" />
                            Kelebihan: {formatMoney(Math.abs(amountDifference))}
                          </span>
                        )}
                        {hasDuplicateMonths && (
                          <span className="add-installment-balance-badge danger">
                            <WarningCircle size={15} weight="bold" />
                            Duplikat Bulan Terdeteksi
                          </span>
                        )}
                        {hasPastMonths && (
                          <span className="add-installment-balance-badge danger">
                            <WarningCircle size={15} weight="bold" />
                            Terdapat Bulan Lampau Terpilih
                          </span>
                        )}
                        {!areAllMonthsFilled && (
                          <span className="text-danger small fw-semibold">
                            (Ada bulan yang belum dipilih)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="add-installment-tfoot-amount">
                      {formatMoney(totalScheduledAmount)}
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
