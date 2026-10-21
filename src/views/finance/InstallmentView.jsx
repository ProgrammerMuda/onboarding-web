import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarClock } from 'lucide-react';
import { Invoice } from '@phosphor-icons/react';
import { Stack, Clock, ArrowsClockwise, CheckCircle, XCircle, MagnifyingGlass, FunnelSimple, FileXls, Plus, Eye, PencilSimple, FileText, CaretLeft, CaretRight, X, DotsThreeVertical, Receipt, SlidersHorizontal, ShieldCheck, PaperPlaneTilt } from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import '../employee/employee.css';
import './installments.css';
import AddInstallmentView from './AddInstallmentView';
import InstallmentDetailView from './InstallmentDetailView';

const availableOutstandingInvoices = [
  { unit: 'AG0103', invoice: 'PRO/INV/032026/031487', start: '2026-03', outstanding: 84328926 },
  { unit: 'AG0103', invoice: 'PRO/INV/022026/030999', start: '2026-02', outstanding: 32500000 },
  { unit: 'AA1803', invoice: 'PRO/INV/032026/031502', start: '2026-03', outstanding: 54120000 },
  { unit: 'AG2503', invoice: 'PRO/INV/032026/031610', start: '2026-03', outstanding: 42800000 },
  { unit: 'AA2602', invoice: 'PRO/INV/032026/031744', start: '2026-03', outstanding: 19850000 },
  { unit: 'AC0810', invoice: 'PRO/INV/032026/031821', start: '2026-03', outstanding: 67200000 },
  { unit: 'BB1204', invoice: 'PRO/INV/032026/031950', start: '2026-03', outstanding: 28900000 },
  { unit: 'TH0501', invoice: 'PRO/INV/032026/032001', start: '2026-03', outstanding: 156000000 },
  { unit: 'CC0305', invoice: 'PRO/INV/032026/032115', start: '2026-03', outstanding: 15400000 },
  { unit: 'AB1402', invoice: 'PRO/INV/032026/032230', start: '2026-03', outstanding: 38750000 },
  { unit: 'DD0911', invoice: 'PRO/INV/032026/032345', start: '2026-03', outstanding: 22100000 },
  { unit: 'GA0108', invoice: 'PRO/INV/032026/032480', start: '2026-03', outstanding: 45000000 }
];

const availableUnits = Array.from(new Set(availableOutstandingInvoices.map((inv) => inv.unit)));
const quickMonthsOptions = [2, 3, 6, 9, 10, 12, 18, 24];

const initialPlans = [
  {
    id: 1,
    unit: 'AA1803',
    invoice: 'PRO/INV/022026/030905',
    start: '2026-02',
    months: 12,
    amount: 109535967,
    paid: 36511989,
    billed: 9127997,
    status: 'Active',
    chief_finance_status: 'approved',
    building_manager_status: 'approved',
    createdBy: { name: 'Sarah Jenkins', email: 'sarah.j@proapps.id' },
    createdAt: '2026-02-05T09:30:00'
  },
  {
    id: 2,
    unit: 'AG2503',
    invoice: 'PRO/INV/022026/030729',
    start: '2026-02',
    months: 15,
    amount: 61173469,
    paid: 0,
    billed: 4078231,
    status: 'Pending Approval',
    chief_finance_status: 'approved',
    building_manager_status: 'pending',
    createdBy: { name: 'Dimas Prasetyo', email: 'dimas.p@proapps.id' },
    createdAt: '2026-02-04T14:15:00'
  },
  {
    id: 3,
    unit: 'AA2602',
    invoice: 'PRO/INV/022026/030880',
    start: '2026-02',
    months: 6,
    amount: 10753862,
    paid: 3584620,
    billed: 1792310,
    status: 'Active',
    chief_finance_status: 'approved',
    building_manager_status: 'approved',
    createdBy: { name: 'Rina Marlina', email: 'rina.m@proapps.id' },
    createdAt: '2026-02-03T11:20:00'
  },
  {
    id: 4,
    unit: 'AC0810',
    invoice: 'PRO/INV/022026/031082',
    start: '2026-02',
    months: 4,
    amount: 73164300,
    paid: 0,
    billed: 18291074,
    status: 'Pending Approval',
    chief_finance_status: 'pending',
    building_manager_status: 'approved',
    createdBy: { name: 'Alex Ross', email: 'alex.ross@acme-corp.io' },
    createdAt: '2026-02-02T16:45:00'
  },
  {
    id: 5,
    unit: 'AA1809',
    invoice: 'PRO/INV/012026/030126',
    start: '2026-01',
    months: 10,
    amount: 44855738,
    paid: 44855738,
    billed: 0,
    status: 'Completed',
    chief_finance_status: 'approved',
    building_manager_status: 'approved',
    createdBy: { name: 'Sarah Jenkins', email: 'sarah.j@proapps.id' },
    createdAt: '2026-01-18T10:00:00'
  },
  {
    id: 6,
    unit: 'AA2203',
    invoice: 'PRO/INV/012026/030081',
    start: '2026-01',
    months: 3,
    amount: 22678943,
    paid: 0,
    billed: null,
    status: 'Rejected',
    chief_finance_status: 'rejected',
    building_manager_status: 'pending',
    createdBy: { name: 'Budi Santoso', email: 'budi.s@proapps.id' },
    createdAt: '2026-01-12T13:10:00'
  },
  {
    id: 7,
    unit: 'BB1204',
    invoice: 'PRO/INV/022026/031201',
    start: '2026-02',
    months: 6,
    amount: 36000000,
    paid: 18000000,
    billed: 6000000,
    status: 'Active',
    chief_finance_status: 'approved',
    building_manager_status: 'approved',
    createdBy: { name: 'Dimas Prasetyo', email: 'dimas.p@proapps.id' },
    createdAt: '2026-02-01T08:45:00'
  },
  {
    id: 8,
    unit: 'TH0501',
    invoice: 'PRO/INV/022026/031342',
    start: '2026-02',
    months: 12,
    amount: 156000000,
    paid: 0,
    billed: 13000000,
    status: 'Pending Approval',
    chief_finance_status: 'pending',
    building_manager_status: 'approved',
    createdBy: { name: 'Sarah Jenkins', email: 'sarah.j@proapps.id' },
    createdAt: '2026-02-06T10:15:00'
  },
  {
    id: 9,
    unit: 'CC0305',
    invoice: 'PRO/INV/122025/028910',
    start: '2025-12',
    months: 6,
    amount: 18500000,
    paid: 18500000,
    billed: 0,
    status: 'Completed',
    chief_finance_status: 'approved',
    building_manager_status: 'approved',
    createdBy: { name: 'Rina Marlina', email: 'rina.m@proapps.id' },
    createdAt: '2025-12-10T11:00:00'
  },
  {
    id: 10,
    unit: 'AB1402',
    invoice: 'PRO/INV/012026/030541',
    start: '2026-01',
    months: 8,
    amount: 52000000,
    paid: 0,
    billed: null,
    status: 'Rejected',
    chief_finance_status: 'approved',
    building_manager_status: 'rejected',
    createdBy: { name: 'Alex Ross', email: 'alex.ross@acme-corp.io' },
    createdAt: '2026-01-20T15:30:00'
  },
  {
    id: 11,
    unit: 'DD0911',
    invoice: 'PRO/INV/112025/027845',
    start: '2025-11',
    months: 4,
    amount: 28400000,
    paid: 28400000,
    billed: 0,
    status: 'Completed',
    chief_finance_status: 'approved',
    building_manager_status: 'approved',
    createdBy: { name: 'Budi Santoso', email: 'budi.s@proapps.id' },
    createdAt: '2025-11-05T09:20:00'
  },
  {
    id: 12,
    unit: 'GA0108',
    invoice: 'PRO/INV/012026/030612',
    start: '2026-01',
    months: 5,
    amount: 45000000,
    paid: 0,
    billed: null,
    status: 'Rejected',
    chief_finance_status: 'rejected',
    building_manager_status: 'pending',
    createdBy: { name: 'Dimas Prasetyo', email: 'dimas.p@proapps.id' },
    createdAt: '2026-01-22T14:00:00'
  }
];
const money = (value) => value == null ? 'Not available' : `Rp ${value.toLocaleString('id-ID')}`;
const monthLabel = (value, offset = 0) => {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1 + offset, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};
const formatDate = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
};
const statusIcons = {
  'Pending Approval': Clock,
  Pending: Clock,
  Active: ArrowsClockwise,
  Completed: CheckCircle,
  Rejected: XCircle
};
const getStatusSlug = (status) => {
  if (status === 'Pending Approval' || status === 'Pending') return 'pending-approval';
  if (status === 'Pending Deletion') return 'pending-deletion';
  return (status || '').toLowerCase();
};
const formatBillingPeriod = (startStr) => {
  if (!startStr) return '-';
  const parts = startStr.split('-');
  if (parts.length < 2) return startStr;
  return `${parts[1]}/${parts[0]}`;
};
const emptyForm = { unit: '', invoice: '', start: '', months: '', amount: '', notes: '' };
const billingMonth = (start, offset = 0) => {
  const [year, month] = start.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const generateInstallmentItems = (plan) => {
  if (!plan) return [];
  if (plan.items && plan.items.length) return plan.items;

  const count = plan.months || 1;
  const monthlyAmount = Math.round(plan.amount / count);
  const items = [];

  const paidCount = plan.status === 'Completed'
    ? count
    : plan.status === 'Rejected' || plan.status === 'Pending Approval' || plan.status === 'Pending'
      ? 0
      : Math.min(count, Math.floor((plan.paid || 0) / monthlyAmount));

  for (let i = 0; i < count; i++) {
    const isPaid = i < paidCount;
    let itemStatus = 'PENDING';
    let paymentMethod = null;
    let paymentRef = null;

    if (plan.status === 'Pending Approval' || plan.status === 'Pending') {
      itemStatus = 'WAITING_APPROVAL';
    } else if (plan.status === 'Rejected') {
      itemStatus = 'REJECTED';
    } else if (isPaid) {
      itemStatus = 'PAID';
      if (i % 2 === 0) {
        paymentMethod = 'Via Invoice';
        paymentRef = `PRO/INV/0${Math.min(9, i + 1)}2026/03${1000 + i * 27}`;
      } else {
        paymentMethod = 'Settled Manually';
        paymentRef = `RCP-MAN-${plan.unit}-${i + 1}`;
      }
    } else {
      itemStatus = 'PENDING';
      if (i === paidCount && plan.billed) {
        paymentRef = `Billed in Invoice (${monthLabel(plan.scheduleMonths?.[i] || billingMonth(plan.start, i))})`;
      }
    }

    const itemAmount = (i === count - 1)
      ? (plan.amount - (monthlyAmount * (count - 1)))
      : monthlyAmount;

    items.push({
      number: i + 1,
      period: monthLabel(plan.scheduleMonths?.[i] || billingMonth(plan.start, i)),
      amount: itemAmount,
      status: itemStatus,
      paymentMethod,
      paymentRef
    });
  }
  return items;
};

export default function InstallmentView() {
  const [plans, setPlans] = useState(initialPlans);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'add' | 'edit'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const formRef = useRef(null);
  const filtered = plans.filter((plan) => {
    const matchesSearch = `${plan.unit} ${plan.invoice} ${plan.createdBy?.name || ''} ${plan.createdBy?.email || ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesStatus = status === 'All'
      ? true
      : status === 'Pending Approval'
        ? (plan.status === 'Pending Approval' || plan.status === 'Pending')
        : plan.status === status;
    return matchesSearch && matchesStatus && (!from || plan.start >= from) && (!to || plan.start <= to);
  });
  const totalInstallments = filtered.length;
  const pageSize = 7;
  const totalPages = Math.max(1, Math.ceil(totalInstallments / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalInstallments);
  const rows = filtered.slice(startIndex, endIndex);

  const pages = totalPages <= 5
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : currentPage <= 3
      ? [1, 2, 3, '…', totalPages]
      : currentPage >= totalPages - 2
        ? [1, '…', totalPages - 2, totalPages - 1, totalPages]
        : [1, '…', currentPage, '…', totalPages];
  const stats = [
    { label: 'Total Requests', value: plans.length, Icon: Stack, tone: 'total' },
    {
      label: 'Pending Approval',
      value: plans.filter((p) => p.status === 'Pending Approval' || p.status === 'Pending').length,
      Icon: Clock,
      tone: 'pending'
    },
    {
      label: 'Active Plans',
      value: plans.filter((p) => p.status === 'Active').length,
      Icon: ArrowsClockwise,
      tone: 'active'
    },
    {
      label: 'Completed',
      value: plans.filter((p) => p.status === 'Completed').length,
      Icon: CheckCircle,
      tone: 'completed'
    },
    {
      label: 'Rejected',
      value: plans.filter((p) => p.status === 'Rejected').length,
      Icon: XCircle,
      tone: 'resigned'
    }
  ];
  const openForm = (plan = null) => {
    setSelectedPlan(plan);
    setViewMode(plan ? 'edit' : 'add');
  };

  const handleUnitChange = (unitVal) => {
    setForm((prev) => ({ ...prev, scheduleMonths: [] }));
    if (!unitVal) {
      setForm((prev) => ({ ...prev, unit: '', invoice: '', amount: '', start: '' }));
      return;
    }
    setError('');
    const matchingInvoices = availableOutstandingInvoices
      .filter((inv) => inv.unit === unitVal && inv.outstanding > 0
        && !plans.some((plan) => plan.invoice === inv.invoice && plan.id !== editing?.id))
      .sort((a, b) => b.start.localeCompare(a.start) || b.invoice.localeCompare(a.invoice));
    if (matchingInvoices.length > 0) {
      const inv = matchingInvoices[0];
      setForm((prev) => ({
        ...prev,
        unit: unitVal,
        invoice: inv.invoice,
        amount: String(inv.outstanding),
        start: inv.start
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        unit: unitVal,
        invoice: '',
        amount: '',
        start: ''
      }));
    }
  };

  const durationNum = Number(form.months);
  const amountNum = Number(form.amount);
  const scheduleMonths = form.start && Number.isInteger(durationNum) && durationNum > 0 && durationNum <= 60
    ? Array.from({ length: durationNum }, (_, index) => index === 0 ? form.start : (form.scheduleMonths?.[index] ?? billingMonth(form.start, index)))
    : [];
  const scheduleError = scheduleMonths.some((month, index) => !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || (index > 0 && month <= form.start))
    ? 'Each later installment must be scheduled after the attached invoice month.'
    : new Set(scheduleMonths).size !== scheduleMonths.length ? 'Choose a different invoice month for each installment.' : '';
  const resetSchedule = (interval = 1) => setForm((prev) => ({ ...prev,
    scheduleMonths: Array.from({ length: durationNum }, (_, index) => billingMonth(prev.start, index * interval))
  }));
  const estimatedMonthly = (durationNum > 0 && amountNum > 0)
    ? Math.round(amountNum / durationNum)
    : 0;

  const isFormValid = Boolean(
    form.unit &&
    form.invoice &&
    amountNum > 0 &&
    Number.isInteger(durationNum) && durationNum > 0 && durationNum <= 60 && !scheduleError
  );

  const saveForm = (event) => {
    event.preventDefault();
    if (!isFormValid) {
      setError('Please select a unit with an eligible invoice and enter a valid duration.');
      return;
    }
    if (plans.some((plan) => plan.invoice.toLowerCase() === form.invoice.trim().toLowerCase() && plan.id !== editing?.id)) {
      setError('This invoice already has an installment plan.');
      return;
    }
    if (Number(form.amount) < (editing?.paid || 0)) {
      setError('The total amount cannot be less than the amount already paid.');
      return;
    }
    const updated = {
      ...editing,
      ...form,
      unit: form.unit.trim(),
      invoice: form.invoice.trim(),
      months: Number(form.months),
      amount: Number(form.amount),
      scheduleMonths,
      id: editing?.id || Date.now(),
      paid: editing?.paid || 0,
      billed: editing?.billed || 0,
      status: editing?.status || 'Pending Approval',
      chief_finance_status: editing?.chief_finance_status || 'pending',
      building_manager_status: editing?.building_manager_status || 'pending',
      createdBy: editing?.createdBy || { name: 'Alex Ross', email: 'alex.ross@acme-corp.io' },
      createdAt: editing?.createdAt || new Date().toISOString()
    };
    setPlans((previous) => editing ? previous.map((plan) => plan.id === editing.id ? updated : plan) : [updated, ...previous]);
    setNotice(editing ? 'Installment plan updated.' : 'Installment plan request submitted for multi-party approval.');
    formRef.current?.close();
  };
  const exportPlans = () => {
    const data = [
      ['Unit', 'Invoice', 'Created By', 'Created Email', 'Created Date', 'Start', 'Months', 'Amount', 'Paid', 'Remaining', 'Status'],
      ...filtered.map((plan) => [
        plan.unit,
        plan.invoice,
        plan.createdBy?.name || '',
        plan.createdBy?.email || '',
        `${formatDate(plan.createdAt)} ${formatTime(plan.createdAt)}`.trim(),
        plan.start,
        plan.months,
        plan.amount,
        plan.paid,
        plan.amount - plan.paid,
        plan.status
      ])
    ];
    const csv = data.map((row) => row.map((value) => {
      const text = String(value);
      return `"${(/^[=+@-]/.test(text) ? "'" : '') + text.replace(/"/g, '""')}"`;
    }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'installments-sample.csv'; link.click(); URL.revokeObjectURL(url);
  };

  if (viewMode === 'detail' && selectedPlan) {
    return (
      <InstallmentDetailView
        plan={selectedPlan}
        onBack={() => {
          setViewMode('list');
          setSelectedPlan(null);
        }}
        onEdit={(p) => openForm(p)}
        onUpdatePlan={(updatedPlan, message) => {
          setPlans((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
          setSelectedPlan(updatedPlan);
          setNotice(message || `Installment plan for unit ${updatedPlan.unit} updated to ${updatedPlan.status}.`);
        }}
        onDelete={(p) => {
          setPlans((prev) => prev.filter((item) => item.id !== p.id));
          setViewMode('list');
          setSelectedPlan(null);
        }}
      />
    );
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <AddInstallmentView
        plan={selectedPlan}
        isEdit={viewMode === 'edit'}
        plans={plans}
        availableOutstandingInvoices={availableOutstandingInvoices}
        availableUnits={availableUnits}
        onBack={() => {
          setViewMode('list');
          setSelectedPlan(null);
        }}
        onSave={(savedPlan) => {
          setPlans((previous) =>
            selectedPlan
              ? previous.map((p) => (p.id === selectedPlan.id ? savedPlan : p))
              : [savedPlan, ...previous]
          );
          setNotice(
            selectedPlan
              ? 'Installment plan updated successfully.'
              : 'Installment plan request submitted successfully for approval.'
          );
          setViewMode('list');
          setSelectedPlan(null);
        }}
      />
    );
  }

  return (
    <div className="emp-container installment-page">
      <Breadcrumb
        className="emp-breadcrumb"
        items={[
          { label: 'Finance' },
          { label: 'Installments' }
        ]}
      />
      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <div className="emp-hero-banner-icon-box">
              <CalendarClock size={28} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div>
              <div className="emp-hero-banner-tag">FINANCE</div>
              <h1 className="emp-hero-banner-title">Installments</h1>
              <p className="emp-hero-banner-desc">
                Create and manage installment plans for invoices.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="emp-stats-grid installment-stats">
        {stats.map(({ label, value, Icon, tone }) => (
          <div className="emp-stat-card" key={label}>
            <div className={`emp-stat-icon-wrap ${tone}`}><Icon size={22} weight="bold" /></div>
            <div className="emp-stat-content"><span className="emp-stat-label">{label}</span><span className="emp-stat-number">{value}</span></div>
          </div>
        ))}
      </div>
      {notice && <p className="installment-demo-note" role="status">{notice}</p>}
      <div className="emp-card-container">
        <div className="emp-card-header">
          <div><h2 className="emp-card-title">Installment Management</h2><p className="emp-card-desc">Track invoice installments, payment progress, and approvals.</p></div>
          <div className="emp-card-actions">
            <button type="button" className="emp-btn-secondary" onClick={exportPlans} disabled={!filtered.length}><FileXls size={16} weight="bold" />Export</button>
            <button type="button" className="emp-btn-primary" onClick={() => openForm()}><Plus size={16} weight="bold" />New Installment</button>
          </div>
        </div>
        <div className="emp-search-row installment-toolbar">
          <div className="emp-search-input-group">
            <MagnifyingGlass size={16} weight="bold" className="emp-search-input-icon" />
            <input className="emp-search-input" placeholder="Search unit, invoice, or creator..." aria-label="Search unit, invoice, or creator" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </div>
          <button type="button" className="emp-btn-secondary" aria-expanded={showFilters} aria-controls="installment-filters" onClick={() => setShowFilters(!showFilters)}><FunnelSimple size={16} weight="bold" />Filter{from || to || status !== 'All' ? ' (active)' : ''}</button>
        </div>
        {showFilters && <div className="installment-filter-panel" id="installment-filters">
          <label className="installment-status-filter">Status
            <select className="form-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              {['All', 'Pending Approval', 'Active', 'Completed', 'Rejected'].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>Start period from<input className="form-control" type="month" value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); if (to && event.target.value > to) setTo(event.target.value); setPage(1); }} /></label>
          <label>Start period to<input className="form-control" type="month" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); if (from && event.target.value && event.target.value < from) setFrom(event.target.value); setPage(1); }} /></label>
          <button type="button" className="emp-btn-secondary" onClick={() => { setFrom(''); setTo(''); setStatus('All'); setSearch(''); setPage(1); }}>Reset filters</button>
        </div>}
        <div className="emp-card-body">
          <div className="emp-table-card-inner">
        <div className="installment-table-scroll">
          <table className="installment-table">
            <thead>
              <tr>
                {['UNIT & INVOICE', 'CREATOR & DATE', 'SCHEDULE PERIOD', 'PAYMENT PROGRESS', 'APPROVAL', 'STATUS', 'ACTION'].map((label) => (
                  <th scope="col" key={label} className={label === 'ACTION' ? 'installment-th-action' : ''}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{rows.length ? rows.map((plan) => {
              const percent = Math.min(100, Math.round(plan.paid / plan.amount * 100));
              const StatusIcon = statusIcons[plan.status] || Clock;
              return <tr key={plan.id}>
                <td>
                  <button
                    type="button"
                    className="installment-unit-btn"
                    onClick={() => { setSelectedPlan(plan); setViewMode('detail'); }}
                    aria-label={`View installment details for unit ${plan.unit}`}
                  >
                    {plan.unit}
                  </button>
                  <button
                    type="button"
                    className="installment-invoice"
                    onClick={() => { setSelectedPlan(plan); setViewMode('detail'); }}
                    aria-label={`View installment details for invoice ${plan.invoice}`}
                  >
                    <FileText size={13} aria-hidden="true" />
                    {plan.invoice}
                  </button>
                </td>
                <td>
                  <div className="installment-creator">
                    <strong className="installment-creator-name">{plan.createdBy?.name || '-'}</strong>
                    <span className="installment-creator-email">{plan.createdBy?.email || '-'}</span>
                    <span className="installment-creator-date-sub">{formatDate(plan.createdAt)}, {formatTime(plan.createdAt)}</span>
                  </div>
                </td>
                <td><strong>{plan.months} installments</strong><span className="installment-muted">{monthLabel(plan.start)} to {monthLabel(plan.scheduleMonths?.slice().sort().at(-1) || billingMonth(plan.start, plan.months - 1))}</span></td>
                <td><div className="installment-payment">
                  <div className="installment-payment-top"><strong>{money(plan.amount)}</strong><span className="installment-percent-badge">{percent}% paid</span></div>
                  <progress max={100} value={percent} aria-label={`Payment progress for ${plan.unit}`} />
                  <div className="installment-payment-bottom">
                    <span className="installment-paid-text">Paid {money(plan.paid)}</span>
                    <span className="installment-rem-text">Rem. {money(plan.amount - plan.paid)}</span>
                  </div>
                </div></td>
                <td>
                  <div className="installment-approval-stack">
                    <span className="installment-approval-badge">
                      Chief Finance
                    </span>
                    <span className="installment-approval-badge">
                      Building Manager
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`installment-status ${getStatusSlug(plan.status)}`}>
                    <StatusIcon size={12} weight="bold" />{plan.status === 'Pending' ? 'Pending Approval' : plan.status}
                  </span>
                </td>
                <td className="installment-action-cell">
                  <button
                    type="button"
                    className="installment-btn-view"
                    aria-label={`View details for ${plan.unit}`}
                    title="View details"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(plan);
                      setViewMode('detail');
                    }}
                  >
                    <Eye size={17} weight="bold" />
                  </button>
                </td>
              </tr>;
            }) : <tr><td colSpan={7} className="installment-empty"><strong>No installments found</strong><span className="installment-muted">Try another unit, invoice, creator, status, or period.</span></td></tr>}</tbody>
          </table>
        </div>

        {/* Table Footer with Pagination Controls */}
        <div className="emp-table-footer">
          <div className="emp-table-footer-info">
            Showing <strong className="emp-text-dark">{totalInstallments === 0 ? 0 : startIndex + 1}</strong> to{' '}
            <strong className="emp-text-dark">{endIndex}</strong> of{' '}
            <strong className="emp-text-dark">{totalInstallments}</strong> installments
          </div>

          <div className="emp-pagination-controls" aria-label="Installments pagination">
            <button
              type="button"
              className="emp-page-btn"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              title="Previous page"
              aria-label="Previous page"
            >
              <CaretLeft size={14} weight="bold" />
            </button>

            {pages.map((pg, i) =>
              pg === '…' ? (
                <span key={`ellipsis-${i}`} className="emp-page-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={pg}
                  type="button"
                  className={`emp-page-btn ${currentPage === pg ? 'active' : ''}`}
                  onClick={() => setPage(pg)}
                >
                  {pg}
                </button>
              )
            )}

            <button
              type="button"
              className="emp-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              title="Next page"
              aria-label="Next page"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
