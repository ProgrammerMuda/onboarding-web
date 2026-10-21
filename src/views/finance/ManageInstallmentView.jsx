import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, CurrencyCircleDollar, CheckCircle, Clock, Hourglass, XCircle, FileText, ArrowsLeftRight, X, Info, WarningCircle } from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import { requestInstallmentTransfer } from './installmentTransfer';
import './manage-installment.css';

const money = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const formatTransferInput = (value) => value ? `${value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},00` : '';
const nextMonth = (period) => {
  const [year, month] = period.split('-').map(Number);
  return `${year + (month === 12 ? 1 : 0)}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}`;
};
const monthLabel = (period) => {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const installmentStatuses = {
  PAID: { label: 'PAID', icon: CheckCircle },
  WAITING_APPROVAL: { label: 'WAITING APPROVAL', icon: Clock },
  REJECTED: { label: 'REJECTED', icon: XCircle },
  UNPAID: { label: 'UNPAID', icon: Clock },
  UNBILLED: { label: 'UNBILLED', icon: Hourglass },
  PENDING: { label: 'PENDING', icon: Clock }
};

export default function ManageInstallmentView({ plan, scheduleItems, onBack, onList, onRequestTransfer }) {
  const [action, setAction] = useState(null);
  const [transferPeriod, setTransferPeriod] = useState('');
  const [transferType, setTransferType] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferResult, setTransferResult] = useState(null);
  const [transferError, setTransferError] = useState('');
  const dialogRef = useRef(null);
  const successDialogRef = useRef(null);
  const amountInputRef = useRef(null);
  const amountCaretDigitsRef = useRef(null);
  useLayoutEffect(() => {
    if (amountCaretDigitsRef.current === null || !amountInputRef.current) return;
    const input = amountInputRef.current;
    const integerPart = input.value.split(',')[0];
    let cursor = 0;
    let digitsSeen = 0;
    while (cursor < integerPart.length && digitsSeen < amountCaretDigitsRef.current) {
      if (/\d/.test(integerPart[cursor])) digitsSeen += 1;
      cursor += 1;
    }
    input.setSelectionRange(cursor, cursor);
    amountCaretDigitsRef.current = null;
  }, [transferAmount]);
  useEffect(() => {
    if (transferResult && !successDialogRef.current?.open) successDialogRef.current?.showModal();
  }, [transferResult]);
  const paid = Number(plan.paid || 0);
  const total = Number(plan.amount || 0);
  const remaining = Math.max(0, total - paid);
  const progress = total ? Math.min(100, Math.round(paid / total * 100)) : 0;
  const paidInstallments = scheduleItems.filter((item) => item.status === 'PAID').length;
  const billedUnpaid = plan.billed != null ? Number(plan.billed) : (remaining > 0 ? Math.floor(total / (scheduleItems.length || 1)) : 0);
  const canManage = plan.status === 'Active';
  const transferPending = plan.transferRequests?.some((request) => request.status === 'pending');
  const pending = scheduleItems.filter((item) => item.status !== 'PAID' && item.status !== 'REJECTED');
  const transferSource = action?.type === 'transfer' ? action.item : null;
  const transferAmountNumber = Number(transferAmount);
  const availableMonths = transferSource ? scheduleItems.filter((item) => item.periodYyyyMm > transferSource.periodYyyyMm && item.status !== 'PAID' && item.status !== 'REJECTED') : [];
  const existingTarget = availableMonths.find((item) => item.periodYyyyMm === transferPeriod);
  const amountValid = Number.isSafeInteger(transferAmountNumber) && transferAmountNumber > 0 && transferAmountNumber < Number(transferSource?.amount || 0);
  const destinationValid = transferType === 'existing' ? Boolean(existingTarget) : transferType === 'new' && scheduleItems.length < 60 && Boolean(transferPeriod) && transferPeriod > transferSource?.periodYyyyMm && !scheduleItems.some((item) => item.periodYyyyMm === transferPeriod);
  const transferValid = amountValid && destinationValid;
  const handleTransferAmountChange = (event) => {
    const value = event.target.value;
    const integerPart = value.split(',')[0];
    amountCaretDigitsRef.current = (value.slice(0, event.target.selectionStart || 0).split(',')[0].match(/\d/g) || []).length;
    setTransferAmount(integerPart.replace(/\D/g, '').replace(/^0+(?=\d)/, ''));
    setTransferError('');
  };
  const submitTransfer = () => {
    if (!transferValid || !onRequestTransfer || transferPending) return;
    try {
      const updatedPlan = requestInstallmentTransfer(plan, scheduleItems, transferSource.periodYyyyMm, transferPeriod, transferAmountNumber, transferType === 'new');
      onRequestTransfer(updatedPlan);
      dialogRef.current?.close();
      setTransferResult({ amount: transferAmountNumber, source: transferSource.periodLabel, destination: monthLabel(transferPeriod) });
    } catch (error) {
      setTransferError(error.message);
    }
  };
  const openAction = (type, item = null) => {
    setAction({ type, item });
    setTransferPeriod('');
    setTransferType('');
    setTransferAmount('');
    setTransferError('');
    dialogRef.current?.showModal();
  };
  const actionTitle = action?.type === 'transfer' ? 'Transfer Installment Amount' : 'Pay All Pending Installments';

  return (
    <div className="emp-container manage-installment-page">
      <Breadcrumb items={[{ label: 'Finance' }, { label: 'Installments', onClick: onList }, { label: 'Installment Detail', onClick: onBack }, { label: 'Manage Plan' }]} />
      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button type="button" className="emp-hero-back-btn" onClick={onBack} aria-label="Back to installment detail"><ArrowLeft size={18} weight="bold" /></button>
            <div><div className="emp-hero-banner-tag">FINANCE</div><h1 className="emp-hero-banner-title">Manage Installment Plan</h1><p className="emp-hero-banner-desc">Review payments and invoice periods for Unit {plan.unit}.</p></div>
          </div>
        </div>
      </div>

      <div className="manage-plan-summary">
        <div className="inst-metric-card">
          <div className="inst-metric-label">TOTAL INSTALLMENT</div>
          <div className="inst-metric-value">{money(total)}</div>
          <div className="inst-metric-subtext">{scheduleItems.length} Monthly Installments</div>
        </div>
        <div className="inst-metric-card">
          <div className="inst-metric-label">
            <span>REMAINING UNPAID</span>
            <span className={`inst-progress-pct-badge ${progress === 0 ? 'zero' : ''}`}>{progress}% paid</span>
          </div>
          <div className="inst-metric-progress-group">
            <div className="inst-metric-row-combined">
              <div className="inst-metric-value unpaid-red">{money(remaining)}</div>
              <div className="inst-progress-count-tag">{paidInstallments} of {scheduleItems.length} paid</div>
            </div>
            <div className="inst-progress-bar-wrap" role="progressbar" aria-label="Payment progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="inst-progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="inst-metric-subtext-split">
            <span className="inst-subtext-paid">Paid: {money(paid)}</span>
            <span className="inst-subtext-unpaid">Due This Month: {money(billedUnpaid)}</span>
          </div>
        </div>
      </div>

      <div className="emp-card-container">
        <div className="emp-card-header">
          <div><h2 className="emp-card-title">Installment Schedule & Actions</h2><p className="emp-card-desc">Review each period before recording a payment or transferring an installment.</p></div>
          <button type="button" className="emp-btn-primary manage-plan-pay-all" disabled={!canManage || remaining <= 0 || !pending.length} onClick={() => openAction('all')}><CurrencyCircleDollar size={18} weight="bold" />Pay All Pending Installments</button>
        </div>
        {!canManage && <p className="manage-plan-info"><Info size={18} weight="fill" />Payments and transfers are available only for active plans. Current status: {plan.status}.</p>}
        {transferPending && <p className="manage-plan-info"><Clock size={18} weight="fill" />A transfer request is awaiting Chief Finance and Building Manager approval. The installment amounts remain unchanged until both approve.</p>}
        <div className="emp-card-body">
          <div className="emp-table-card-inner"><div className="emp-table-responsive">
            <table className="emp-table manage-plan-table">
              <thead><tr>{['Period', 'Revision', 'Amount', 'Installment Status', 'Linked Invoice & Status', 'Actions'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
              <tbody>{scheduleItems.map((item) => {
                const isPaid = item.status === 'PAID';
                const actionable = canManage && !transferPending && !isPaid && item.status !== 'REJECTED';
                const status = installmentStatuses[item.status] || installmentStatuses.PENDING;
                const StatusIcon = status.icon;
                return <tr key={item.number}>
                  <td><strong>{item.periodLabel}</strong><span className="inst-schedule-period-sub">{item.periodCode}</span></td>
                  <td><span className="manage-plan-revision">{item.revCode}</span></td>
                  <td className="manage-plan-currency">{money(item.amount)}</td>
                  <td><span className={`inst-status-badge ${item.status.toLowerCase()}`}><StatusIcon size={13} weight="bold" />{status.label}</span></td>
                  <td>{item.linkedInvoice ? (
                    <div className="manage-plan-invoice">
                      <span className="manage-plan-invoice-number"><FileText size={14} weight="bold" />{item.linkedInvoice}</span>
                      {item.linkedStatus === 'overdue' && <span className="inst-tag-overdue">Invoice OVERDUE</span>}
                      {item.linkedStatus === 'settled' && <span className="inst-tag-settled">Settled</span>}
                      {item.linkedStatus === 'unpaid' && <span className="inst-tag-unpaid">Unpaid</span>}
                    </div>
                  ) : <span className="inst-tag-notbilled">Not yet billed</span>}</td>
                  <td>{isPaid ? (
                    <span className="manage-plan-no-action" aria-label={`No actions for ${item.periodLabel}; installment already paid`}>Already paid</span>
                  ) : (
                    <div className="manage-plan-actions">
                      <button type="button" className="emp-btn-secondary" disabled={!actionable} onClick={() => openAction('transfer', item)} aria-label={`Request transfer for ${item.periodLabel}`}><ArrowsLeftRight size={16} weight="bold" />Transfer</button>
                    </div>
                  )}</td>
                </tr>;
              })}</tbody>
              <tfoot><tr><th scope="row" colSpan={2}>Total plan</th><td className="manage-plan-currency">{money(total)}</td><td colSpan={3}>{scheduleItems.length} installments</td></tr></tfoot>
            </table>
          </div></div>
        </div>
      </div>
      <p className="manage-plan-preview-note">Payment actions are previews. Transfer requests require approval before the schedule changes.</p>

      <dialog ref={dialogRef} className={`installment-dialog ${transferSource ? 'manage-transfer-dialog' : ''}`} aria-labelledby="manage-action-title">
        <div className="emp-modal-header"><h3 className="emp-modal-title" id="manage-action-title">{actionTitle}</h3><button type="button" className="emp-modal-close" aria-label="Close preview" onClick={() => dialogRef.current?.close()}><X size={18} /></button></div>
        {transferSource ? (
          <>
            <div className="emp-modal-body manage-transfer-body">
              <div className="manage-transfer-warning"><WarningCircle size={19} weight="fill" /><span>This request will move part of the {transferSource.periodLabel} installment to the selected month after Chief Finance and Building Manager approve it.</span></div>
              <div className="manage-transfer-field"><label htmlFor="current-installment-amount">Current Installment Amount</label><input id="current-installment-amount" className="manage-transfer-current" readOnly value={money(transferSource.amount)} /></div>
              <div className="manage-transfer-field"><label htmlFor="transfer-amount">Amount to Transfer <span aria-hidden="true">*</span></label><div className="manage-transfer-amount-wrap"><span>Rp</span><input ref={amountInputRef} id="transfer-amount" type="text" inputMode="numeric" autoComplete="off" value={formatTransferInput(transferAmount)} onChange={handleTransferAmountChange} onClick={(event) => { const comma = event.currentTarget.value.indexOf(','); if (comma >= 0 && event.currentTarget.selectionStart > comma) event.currentTarget.setSelectionRange(comma, comma); }} placeholder="0,00" aria-describedby="transfer-amount-help" /></div><small id="transfer-amount-help">Enter a whole rupiah amount smaller than {money(transferSource.amount)}.</small>{transferAmount && !amountValid && <p className="manage-transfer-error" role="alert">Enter an amount from Rp 1 up to {money(transferSource.amount - 1)}.</p>}</div>
              <div className="manage-transfer-field"><label htmlFor="transfer-type">Transfer To <span aria-hidden="true">*</span></label><select id="transfer-type" className="form-select" value={transferType} onChange={(event) => { setTransferType(event.target.value); setTransferPeriod(''); setTransferError(''); }}><option value="">Select destination</option><option value="existing" disabled={!availableMonths.length}>Existing Month</option><option value="new" disabled={scheduleItems.length >= 60}>New Month</option></select></div>
              {transferType === 'existing' && <div className="manage-transfer-field"><label htmlFor="transfer-target-existing">Destination Month <span aria-hidden="true">*</span></label><select id="transfer-target-existing" className="form-select" value={transferPeriod} onChange={(event) => { setTransferPeriod(event.target.value); setTransferError(''); }}><option value="">Select an installment month</option>{availableMonths.map((item) => <option key={item.number} value={item.periodYyyyMm}>{item.periodLabel} · {money(item.amount)}</option>)}</select></div>}
              {transferType === 'new' && <div className="manage-transfer-field"><label htmlFor="transfer-target-new">New Month <span aria-hidden="true">*</span></label><input id="transfer-target-new" className="form-control" type="month" min={nextMonth(transferSource.periodYyyyMm)} value={transferPeriod} onChange={(event) => { setTransferPeriod(event.target.value); setTransferError(''); }} />{transferPeriod && !destinationValid && <p className="manage-transfer-error" role="alert">Choose a later month that is not already in this plan.</p>}</div>}
              {transferValid && <div className="manage-transfer-preview"><div><span>{transferSource.periodLabel} after transfer</span><strong>{money(transferSource.amount - transferAmountNumber)}</strong></div><div><span>{monthLabel(transferPeriod)} {transferType === 'new' ? 'new installment' : 'after transfer'}</span><strong>{money((existingTarget?.amount || 0) + transferAmountNumber)}</strong></div><div className="manage-transfer-preview-total"><span>Transfer amount</span><strong>{money(transferAmountNumber)}</strong></div></div>}
              {transferError && <p className="manage-transfer-error" role="alert">{transferError}</p>}
            </div>
            <div className="emp-modal-footer"><button type="button" className="emp-btn-secondary" onClick={() => dialogRef.current?.close()}>Cancel</button><button type="button" className="manage-transfer-submit" disabled={!transferValid || !onRequestTransfer || transferPending} onClick={submitTransfer}>Request Transfer</button></div>
          </>
        ) : (
          <><div className="emp-modal-body"><dl className="manage-action-facts"><div><dt>Unit</dt><dd>{plan.unit}</dd></div><div><dt>Invoice</dt><dd>{plan.invoice}</dd></div><div><dt>Period</dt><dd>{action?.item?.periodLabel || `${pending.length} pending installments`}</dd></div><div><dt>Amount</dt><dd>{money(action?.item?.amount ?? remaining)}</dd></div></dl><p className="manage-plan-info"><Info size={18} weight="fill" />Preview only. Payment recording is not connected yet.</p></div><div className="emp-modal-footer"><button type="button" className="emp-btn-secondary" onClick={() => dialogRef.current?.close()}>Close Preview</button></div></>
        )}
      </dialog>
      <dialog ref={successDialogRef} className="installment-dialog manage-transfer-success-dialog" aria-labelledby="transfer-success-title" onClose={() => setTransferResult(null)}>
        <div className="manage-transfer-success-body">
          <div className="manage-transfer-success-icon"><CheckCircle size={30} weight="fill" /></div>
          <h3 id="transfer-success-title">Transfer request submitted</h3>
          <p>The schedule will change after Chief Finance and Building Manager approve the request.</p>
          <dl className="manage-transfer-success-details">
            <div><dt>From</dt><dd>{transferResult?.source}</dd></div>
            <div><dt>To</dt><dd>{transferResult?.destination}</dd></div>
            <div><dt>Amount transferred</dt><dd>{money(transferResult?.amount)}</dd></div>
          </dl>
          <button type="button" className="manage-transfer-success-done" onClick={() => { successDialogRef.current?.close(); onBack(); }}>View Approval Status</button>
        </div>
      </dialog>
    </div>
  );
}
