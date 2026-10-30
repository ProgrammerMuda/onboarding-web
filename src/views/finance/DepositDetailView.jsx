import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  ArrowsClockwise,
  CaretDown,
  CaretLeft,
  CaretRight,
  FileXls,
  Check,
  CheckCircle,
  ClockCounterClockwise,
  HourglassMedium,
  FileText,
  Paperclip,
  PaperPlaneTilt,
  Plus,
  UploadSimple,
  Warning,
  X
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import { DetailCard } from '../tenant/DetailParts';
import { getPageItems } from '../../models/UnitModel';
import { DepositInvoiceView } from './DepositInvoiceView';
import { CURRENT_USER, NEXT_PERIOD, INVOICE_DUE_HOURS, categoryLabel, formatDate, formatDateTime, formatRupiah, groupByMonth, periodLabel, historySummary, netOf, proofFileError } from '../../models/DepositModel';

const HISTORY_PAGE_SIZE = 10;

const STATUS = {
  draft: { label: 'Draft', tone: 'unoccupied' },
  unpaid: { label: 'Unpaid', tone: 'pending' },
  planned: { label: 'Planned', tone: 'pending' },
  paid: { label: 'Paid', tone: 'active' },
  cancelled: { label: 'Cancelled', tone: 'rejected' },
  pending: { label: 'Awaiting approval', tone: 'pending' },
  approved: { label: 'Approved', tone: 'active' },
  deducted: { label: 'Deducted', tone: 'rejected' },
  rejected: { label: 'Rejected', tone: 'rejected' },
  active: { label: 'Active', tone: 'active' }
};

// The decisions on an open entry. A draft is sent or discarded; a sent invoice is paid or cancelled;
// a payment from the balance is approved or rejected.
const DECISIONS = {
  send: {
    title: (e) => `Send ${e.invoice.number} to the tenant?`,
    confirm: 'Send invoice',
    positive: true,
    body: (e, tenant) => `${tenant} gets this invoice for ${formatRupiah(e.amount)} in the ProApps app and can pay it there. It is due ${INVOICE_DUE_HOURS} hours after you send it. Once sent, it cannot be edited, only cancelled.`
  },
  discard: {
    title: (e) => `Discard draft ${e.invoice.number}?`,
    confirm: 'Discard draft',
    destructive: true,
    body: () => 'This draft was never sent, so the tenant is not affected. It stays in the history as cancelled, and the bills it planned to pay are open again.'
  },
  paid: { title: (e) => `Mark ${e.invoice.number} as paid?`, confirm: 'Mark as paid', positive: true },
  approve: { title: (_e, unit) => `Approve payment from the balance for ${unit}?`, confirm: 'Approve', positive: true },
  reject: { title: (_e, unit) => `Reject payment from the balance for ${unit}?`, confirm: 'Reject', reasonLabel: 'Rejection reason', presets: ['Wrong bills chosen', 'Wrong unit', 'Owner asked to pay in cash instead'] }
};

function StatusPill({ status }) {
  const s = STATUS[status];
  return <span className={`tm-status tm-status--${s.tone}`}>{s.label}</span>;
}

const ENTRY_TITLES = { topup: 'Top up', allocate: 'Paid from balance', autopay: 'Auto deduction' };

function entryTitle(e) {
  return e.type === 'topup' ? `Top up ${formatRupiah(e.amount)}` : ENTRY_TITLES[e.type];
}

function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
}

function AllocationList({ entry, billsById, empty }) {
  return (
    <ul className="dep-alloc-list">
      {entry.allocations.map((a) => (
        <li key={a.billId}><span>{billsById[a.billId]?.label}</span><strong>{formatRupiah(a.amount)}</strong></li>
      ))}
      {entry.autoPay && (
        <li className="is-future">
          <span>{entry.type === 'topup' ? 'This top up, next month onwards' : 'Next month onwards'}: {entry.autoPay.length ? entry.autoPay.map(categoryLabel).join(', ') : 'nothing'}</span>
          <em>paid when issued</em>
        </li>
      )}
      {entry.allocations.length === 0 && !entry.autoPay && <li><span>{empty}</span><strong>-</strong></li>}
    </ul>
  );
}

// Required before an invoice can be marked paid: the transfer receipt or payment slip.
function ProofField({ file, error, onPick, onRemove }) {
  const inputRef = useRef(null);
  return (
    <div className="tm-decide__field dep-proof">
      <span className="dep-proof__label" id="dep-proof-label">Payment proof <span className="req">*</span></span>
      {file ? (
        <div className="dep-proof__file">
          <Paperclip size={16} weight="bold" aria-hidden="true" />
          <span className="dep-proof__name">{file.name}</span>
          <span className="dep-proof__size">{Math.max(1, Math.round(file.size / 1024)).toLocaleString('id-ID')} KB</span>
          <button type="button" onClick={onRemove} aria-label={`Remove ${file.name}`}><X size={14} weight="bold" /></button>
        </div>
      ) : (
        <button
          type="button"
          className={`dep-proof__drop${error ? ' is-invalid' : ''}`}
          aria-labelledby="dep-proof-label"
          aria-describedby="dep-proof-hint"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files?.[0]); }}
        >
          <UploadSimple size={22} weight="bold" aria-hidden="true" />
          <strong>Upload the transfer receipt</strong>
          <span>Click or drop a file here</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        hidden
        onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ''; }}
      />
      {error
        ? <p className="dep-field-error" role="alert">{error}</p>
        : <p id="dep-proof-hint" className="dep-field-hint">PDF, JPG, or PNG up to 5 MB. Kept with the invoice.</p>}
    </div>
  );
}

function DecisionDialog({ kind, entry, billsById, unitCode, tenantName, onConfirm, onCancel }) {
  const d = DECISIONS[kind];
  const needsProof = kind === 'paid';
  const [reason, setReason] = useState('');
  const [proof, setProof] = useState(null);
  const [proofError, setProofError] = useState('');
  const firstRef = useRef(null);
  const pickProof = (file) => {
    if (!file) return;
    const problem = proofFileError(file);
    setProofError(problem);
    if (!problem) setProof(file);
  };
  useEffect(() => { firstRef.current?.focus(); }, []);
  useEscape(onCancel);

  const paid = entry.allocations.reduce((s, a) => s + a.amount, 0);
  const future = Boolean(entry.autoPay);
  const net = netOf(entry);
  const effect = net >= 0 ? `${formatRupiah(net)} goes to the deposit balance` : `${formatRupiah(-net)} comes out of the deposit balance`;
  const billsText = paid > 0 ? `${formatRupiah(paid)} pays ${entry.allocations.length} ${entry.allocations.length === 1 ? 'bill' : 'bills'} and ` : '';

  return (
    <div className="emp-modal-backdrop" onClick={onCancel}>
      <div className="emp-modal-card tm-decide" role="alertdialog" aria-modal="true" aria-labelledby="dep-decide-title" onClick={(e) => e.stopPropagation()}>
        <div className="tm-decide__head">
          <span className={`tm-decide__icon ${d.positive ? 'is-approve' : 'is-reject'}`}>
            {d.positive ? <CheckCircle size={24} weight="bold" /> : <Warning size={24} weight="bold" />}
          </span>
          <div>
            <h3 className="tm-decide__title" id="dep-decide-title">{d.title(entry, unitCode)}</h3>
            <span className="tm-decide__sub">
              {entry.type !== 'topup'
                ? `Sent by ${entry.createdBy} · ${formatDate(entry.date)}`
                : entry.invoice.issuedAt
                  ? `${entryTitle(entry)} · issued ${formatDateTime(entry.invoice.issuedAt)}`
                  : `${entryTitle(entry)} · draft created ${formatDateTime(entry.invoice.createdAt)}`}
            </span>
          </div>
        </div>

        {needsProof ? (
          <ProofField file={proof} error={proofError} onPick={pickProof} onRemove={() => setProof(null)} />
        ) : d.body ? (
          <p className="tm-decide__text">{d.body(entry, tenantName)}</p>
        ) : d.positive ? (
          <>
            <AllocationList entry={entry} billsById={billsById} empty="No bills, all to the balance" />
            <p className="tm-decide__text">
              {billsText}{effect}.
              {future && <>{entry.type === 'topup' ? ' This top up adds its selected bill types from next month onwards.' : ' It also changes what the balance pays from next month onwards.'}</>}
            </p>
          </>
        ) : (
          <div className="tm-decide__field">
            <label htmlFor="dep-reason">{d.reasonLabel} <span className="req">*</span></label>
            <textarea
              id="dep-reason"
              ref={firstRef}
              rows={3}
              maxLength={200}
              className="form-control add-emp-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="tm-decide__presets">
              {d.presets.map((p) => <button key={p} type="button" onClick={() => setReason(p)}>+ {p}</button>)}
            </div>
          </div>
        )}

        <div className="tm-decide__foot">
          <button type="button" className="emp-btn-secondary" onClick={onCancel}>{kind === 'discard' ? 'Keep draft' : 'Cancel'}</button>
          {d.positive ? (
            <button
              ref={firstRef}
              type="button"
              className="emp-btn-primary tm-btn-success"
              disabled={needsProof && !proof}
              onClick={() => onConfirm('', proof?.name)}
            >
              {kind === 'send' ? <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" /> : <Check size={16} weight="bold" aria-hidden="true" />}
              <span>{d.confirm}</span>
            </button>
          ) : (
            <button ref={d.destructive ? firstRef : undefined} type="button" className="emp-btn-primary tm-btn-danger" disabled={!d.destructive && !reason.trim()} onClick={() => onConfirm(reason.trim())}>
              <X size={15} weight="bold" aria-hidden="true" />
              <span>{d.confirm}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// What an entry pays, under a title per monthly invoice, then the bill types it set for next month, if any.
// A top up shows it as its plan; its deduction card shows the same boxes once the money has moved.
function AllocationBoxes({ entry, billsById }) {
  const bills = entry.allocations.map((a) => ({ ...a, bill: billsById[a.billId] })).filter((a) => a.bill);
  const periods = [...new Set(bills.map((a) => a.bill.period))].sort();
  return (
    <div className="dep-alloc-sections">
      {periods.map((period) => (
        <section key={period} className="dep-alloc-box" aria-labelledby={`dep-alloc-${entry.id}-${period}`}>
          <h5 className="dep-alloc-box__head" id={`dep-alloc-${entry.id}-${period}`}>{periodLabel(period)} invoice</h5>
          <ul className="dep-alloc-list">
            {bills.filter((a) => a.bill.period === period).map((a) => (
              <li key={a.billId}><span>{categoryLabel(a.bill.category)}</span><strong>{formatRupiah(a.amount)}</strong></li>
            ))}
          </ul>
        </section>
      ))}
      {entry.autoPay?.length > 0 && (
        <section className="dep-alloc-box" aria-labelledby={`dep-alloc-${entry.id}-next`}>
          <h5 className="dep-alloc-box__head" id={`dep-alloc-${entry.id}-next`}>{entry.type === 'topup' ? 'This top up · next month onwards' : 'Next month onwards'}</h5>
          <ul className="dep-alloc-list">
            {entry.autoPay.map((category) => (
              <li key={category} className="is-future"><span>{categoryLabel(category)}</span><em>Amount set when the invoice is issued</em></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// Every history card says the same things in the same places: what it is and its status, when it happened,
// and the money (amount, then the balance after it). A top up's invoice number sits in its footer, left.

const LINE_NOTES = {
  topup: {
    draft: 'Invoice not sent to the tenant yet',
    cancelled: 'Invoice cancelled. Nothing was added'
  },
  deduction: {
    planned: 'Deducted once the top up invoice is paid',
    pending: 'Deducted once another Finance user approves it',
    rejected: 'Rejected. Nothing was deducted',
    cancelled: 'Cancelled. Nothing was deducted'
  }
};

// + for money in, − for money out. Grey until it has happened, struck through when it never will.
function lineAmount(line) {
  const sign = line.kind === 'topup' ? '+' : '−';
  const text = `${sign} ${formatRupiah(line.amount)}`;
  if (line.status === 'cancelled' || line.status === 'rejected') return { text, tone: 'void' };
  if (line.status !== 'paid' && line.status !== 'deducted') return { text, tone: 'later' };
  return { text, tone: line.kind === 'topup' ? 'in' : 'deduct' };
}

function HistoryCard({ line, balanceAfter, billsById, expanded, onToggle, onDecide, onViewInvoice }) {
  const { entry } = line;
  const isTopUp = line.kind === 'topup';
  const isDraft = isTopUp && entry.status === 'draft';
  const own = entry.createdBy === CURRENT_USER;
  const amount = lineAmount(line);
  const Icon = isDraft ? FileText : isTopUp ? ArrowDownLeft : ArrowUpRight;
  const panelId = `dep-line-${line.id}`;

  return (
    <li className={`dep-hcard${expanded ? ' is-open' : ''}`}>
      <button type="button" className="dep-hcard__main" aria-expanded={expanded} aria-controls={panelId} onClick={onToggle}>
        <span className={`dep-stmt-icon dep-stmt-icon--${isDraft ? 'draft' : line.kind} is-${line.status}`} aria-hidden="true">
          <Icon size={18} weight="bold" />
        </span>
        <span className="dep-hcard__body">
          <span className="dep-hcard__top">
            <span className="dep-hcard__title">{isTopUp ? 'Top up' : 'Deduction'}</span>
            <StatusPill status={line.status} />
          </span>
          <span className="dep-hcard__meta">
            {formatDateTime(line.moment)}
          </span>
          {LINE_NOTES[line.kind][line.status] && <span className="dep-hcard__sub">{LINE_NOTES[line.kind][line.status]}</span>}
        </span>
        <span className="dep-hcard__money">
          <span className={`dep-hcard__amount is-${amount.tone}`}>
            <span className="visually-hidden">Amount: </span>{amount.text}
          </span>
          {balanceAfter != null && (
            <span className="dep-hcard__after">Balance <strong>{formatRupiah(balanceAfter)}</strong></span>
          )}
        </span>
        <CaretDown size={14} weight="bold" aria-hidden="true" className="dep-hcard__caret" />
      </button>

      {expanded && (
        <div className="dep-hcard__detail" id={panelId}>
          {isTopUp ? (
            <>
              <dl className="dep-entry__facts">
                {isDraft && <div><dt>Draft created</dt><dd>{formatDateTime(entry.invoice.createdAt)}</dd></div>}
                {entry.invoice.issuedAt && <div><dt>Invoice sent</dt><dd>{formatDateTime(entry.invoice.issuedAt)}</dd></div>}
                {entry.invoice.dueAt && <div><dt>Invoice due</dt><dd>{formatDateTime(entry.invoice.dueAt)}</dd></div>}
                {entry.invoice.paidAt && <div><dt>Invoice paid</dt><dd>{formatDateTime(entry.invoice.paidAt)}</dd></div>}
                <div><dt>Created by</dt><dd>{entry.createdBy}</dd></div>
                {entry.note && <div><dt>Note</dt><dd>{entry.note}</dd></div>}
                {entry.cancelReason && <div><dt>Reason</dt><dd>{entry.cancelReason}</dd></div>}
              </dl>
              {(entry.allocations.length > 0 || entry.autoPay?.length > 0) && <AllocationBoxes entry={entry} billsById={billsById} />}
              {/* Same footer line as a deduction: who made it on the left, what to do with it on the right */}
              <div className="dep-hcard__foot dep-hcard__foot--topup">
                <dl className="dep-hcard__by">
                  <dt>Invoice number</dt>
                  <dd>{entry.invoice.number}</dd>
                </dl>
                <div className="dep-hcard__actions">
                  <button type="button" className="emp-btn-secondary dep-btn-sm" onClick={onViewInvoice}>
                    <FileText size={14} weight="bold" aria-hidden="true" /> View invoice
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <AllocationBoxes entry={entry} billsById={billsById} />
              {balanceAfter != null && (
                <dl className="dep-hcard__foot">
                  <div className="dep-hcard__calc">
                    <div><dt>Balance</dt><dd>{formatRupiah(balanceAfter + line.amount)}</dd></div>
                    <span className="dep-hcard__op" aria-hidden="true">−</span>
                    <div className="is-deduct"><dt>Deduction</dt><dd>{formatRupiah(line.amount)}</dd></div>
                  </div>
                  <div className="is-total"><dt>Remaining</dt><dd>{formatRupiah(balanceAfter)}</dd></div>
                </dl>
              )}
              <dl className="dep-entry__facts">
                {line.source === 'auto' && <div><dt>Why</dt><dd>The tenant chose these to be paid from the deposit when each invoice is issued.</dd></div>}
                {line.source === 'manual' && <div><dt>Requested by</dt><dd>{entry.createdBy}</dd></div>}
                {entry.decidedBy && line.source === 'manual' && <div><dt>{entry.status === 'rejected' ? 'Rejected by' : 'Approved by'}</dt><dd>{entry.decidedBy}</dd></div>}
                {entry.rejectReason && <div><dt>Reason</dt><dd>{entry.rejectReason}</dd></div>}
              </dl>
              {line.source === 'manual' && entry.status === 'pending' && (
                <div className="dep-entry__actions">
                  {own ? (
                    <p className="dep-field-hint">You requested this, so another Finance user approves it.</p>
                  ) : (
                    <>
                      <button type="button" className="emp-btn-secondary dep-btn-sm" onClick={() => onDecide('reject')}>Reject</button>
                      <button type="button" className="emp-btn-primary tm-btn-success dep-btn-sm" onClick={() => onDecide('approve')}>
                        <Check size={14} weight="bold" aria-hidden="true" /> Approve
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

function RuleHistoryCard({ line, expanded, onToggle }) {
  const { entry } = line;
  const panelId = `dep-line-${line.id}`;
  return (
    <li className={`dep-hcard${expanded ? ' is-open' : ''}`}>
      <button type="button" className="dep-hcard__main" aria-expanded={expanded} aria-controls={panelId} onClick={onToggle}>
        <span className="dep-stmt-icon dep-stmt-icon--rule is-active" aria-hidden="true"><ArrowsClockwise size={18} weight="bold" /></span>
        <span className="dep-hcard__body">
          <span className="dep-hcard__top"><span className="dep-hcard__title">Auto deduction choices</span><StatusPill status={line.status} /></span>
          <span className="dep-hcard__meta">{formatDateTime(line.moment)}</span>
        </span>
        <CaretDown size={14} weight="bold" aria-hidden="true" className="dep-hcard__caret" />
      </button>
      {expanded && (
        <div className="dep-hcard__detail" id={panelId}>
          <strong className="dep-rule-label">Selected from next month onwards</strong>
          {entry.autoPay.length > 0
            ? <ul className="dep-next-list">{entry.autoPay.map((id) => <li key={id}>{categoryLabel(id)}</li>)}</ul>
            : <p className="dep-empty-line">No automatic deductions. The balance stays until used manually.</p>}
          <dl className="dep-entry__facts">
            <div><dt>Changed by</dt><dd>{entry.createdBy}</dd></div>
            {entry.note && <div><dt>Note</dt><dd>{entry.note}</dd></div>}
          </dl>
        </div>
      )}
    </li>
  );
}

// The three numbers this history adds up to.
function HistorySummary({ summary }) {
  return (
    <dl className="dep-hist-sum">
      <div className="is-in">
        <dt><ArrowDownLeft size={14} weight="bold" aria-hidden="true" /> Total top up</dt>
        <dd>{formatRupiah(summary.toppedUp)}</dd>
      </div>
      <div className="is-out">
        <dt><ArrowUpRight size={14} weight="bold" aria-hidden="true" /> Total deducted</dt>
        <dd>{formatRupiah(summary.deducted)}</dd>
      </div>
      <div className={summary.waiting > 0 ? 'is-wait' : ''}>
        <dt><HourglassMedium size={14} weight="bold" aria-hidden="true" /> Waiting</dt>
        <dd>{summary.waiting}</dd>
      </div>
    </dl>
  );
}

export function DepositDetailView({ unit, invoiceId, onOpenInvoice, onCloseInvoice, onBack, onTopUp, onManage, onEditDraft, onDecide, onExport }) {
  const { row, balance, autoPay, ledger, lines, billsById, balanceAfter } = unit;
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  // Lines waiting for something sit in their own block; the months below are what has already happened.
  // Every line sits in its month, newest first, whatever its status; the status badge tells what still waits.
  const ordered = groupByMonth(lines).flatMap((g) => g.lines);
  const summary = historySummary(lines);
  const totalPages = Math.max(1, Math.ceil(ordered.length / HISTORY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageGroups = groupByMonth(ordered.slice((currentPage - 1) * HISTORY_PAGE_SIZE, currentPage * HISTORY_PAGE_SIZE));
  // Cards start closed. A payment from the balance awaiting approval starts open, since its buttons live there.
  const [expanded, setExpanded] = useState(() => new Set(lines.filter((l) => l.status === 'pending').map((l) => l.id)));
  const [decision, setDecision] = useState(null);

  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  // The invoice page follows the ledger, so it reflects a status change made while it is open.
  const invoiceEntry = invoiceId && ledger.find((e) => e.id === invoiceId);

  const decisionDialog = decision && (
    <DecisionDialog
      kind={decision.kind}
      entry={decision.entry}
      billsById={billsById}
      unitCode={row.unitCode}
      tenantName={row.tenantName}
      onCancel={() => setDecision(null)}
      onConfirm={(reason, proofName) => {
        onDecide(decision.kind, decision.entry, reason, proofName);
        setDecision(null);
      }}
    />
  );

  if (invoiceEntry) {
    return (
      <>
        <DepositInvoiceView
          entry={invoiceEntry}
          row={row}
          onBack={onCloseInvoice}
          onBackToList={onBack}
          onMarkPaid={() => setDecision({ kind: 'paid', entry: invoiceEntry })}
          onSend={() => setDecision({ kind: 'send', entry: invoiceEntry })}
          onEdit={() => onEditDraft(invoiceEntry)}
          onDiscard={() => setDecision({ kind: 'discard', entry: invoiceEntry })}
        />
        {decisionDialog}
      </>
    );
  }

  return (
    <div className="emp-detail-page unit-detail-page tm-detail dep-detail">
      <Breadcrumb
        className="add-emp-breadcrumb"
        items={[{ label: 'Finance' }, { label: 'Deposit' }, { label: 'Deposit Monthly', onClick: onBack }, { label: row.unitCode }]}
      />

      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button type="button" className="emp-hero-back-btn" onClick={onBack} aria-label="Back to Deposit Monthly">
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="emp-hero-banner-tag">DEPOSIT MONTHLY</div>
              <h1 className="emp-hero-banner-title">{row.unitCode}</h1>
              <p className="emp-hero-banner-desc">{row.tower} · billed to {row.tenantName || 'nobody'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="unit-d-layout">
        <div className="unit-d-main">
          <DetailCard
            title="Deposit history"
            Icon={ClockCounterClockwise}
            aside={lines.length > 0 && (
              <button
                type="button"
                className="emp-btn-secondary dep-btn-sm"
                disabled={exporting || lines.length === 0}
                onClick={async () => { setExporting(true); await onExport(unit, lines); setExporting(false); }}
              >
                <FileXls size={14} weight="bold" aria-hidden="true" />
                {exporting ? 'Exporting…' : 'Export Excel'}
              </button>
            )}
          >
            {lines.length > 0 && <HistorySummary summary={summary} />}
            {lines.length === 0 ? (
              <div className="dep-hist-empty">
                <ClockCounterClockwise size={32} weight="duotone" aria-hidden="true" />
                <strong>No deposit activity yet</strong>
                <span>Top ups and deductions will be listed here, newest first.</span>
              </div>
            ) : (
              <>

                {ordered.length > 0 && (
                  <div className="dep-hist-months">
                    {pageGroups.map((g) => {
                      return (
                        <section key={g.period} className="dep-hist-month" aria-labelledby={`dep-month-${g.period}`}>
                          <h4 className="dep-hist-month__head" id={`dep-month-${g.period}`}>{g.label}</h4>
                          <ul className="dep-hcards">
                            {g.lines.map((l) => l.kind === 'rule' ? (
                              <RuleHistoryCard key={l.id} line={l} expanded={expanded.has(l.id)} onToggle={() => toggle(l.id)} />
                            ) : (
                              <HistoryCard
                                key={l.id}
                                line={l}
                                balanceAfter={balanceAfter[l.id]}
                                billsById={billsById}
                                expanded={expanded.has(l.id)}
                                onToggle={() => toggle(l.id)}
                                onDecide={(kind) => setDecision({ kind, entry: l.entry })}
                                onViewInvoice={() => onOpenInvoice(l.entry.id)}
                              />
                            ))}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                )}
              </>
            )}
            {ordered.length > HISTORY_PAGE_SIZE && (
              <div className="dep-history-foot">
                <span>
                  Showing <strong>{(currentPage - 1) * HISTORY_PAGE_SIZE + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * HISTORY_PAGE_SIZE, ordered.length)}</strong> of <strong>{ordered.length}</strong> entries
                </span>
                <div className="emp-pagination-controls" aria-label="Pagination">
                  <button type="button" className="emp-page-btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
                    <CaretLeft size={14} weight="bold" />
                  </button>
                  {getPageItems(currentPage, totalPages).map((item, i) => (item === 'gap' ? (
                    <span key={`gap-${i}`} className="emp-page-ellipsis" aria-hidden="true">…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={`emp-page-btn ${currentPage === item ? 'active' : ''}`}
                      onClick={() => setPage(item)}
                      aria-current={currentPage === item ? 'page' : undefined}
                      aria-label={`Page ${item}`}
                    >
                      {item}
                    </button>
                  )))}
                  <button type="button" className="emp-page-btn" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
                    <CaretRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </DetailCard>
        </div>

        <aside className="unit-d-side">
          <section className="dep-balance-card" aria-labelledby="dep-balance-title">
            <span className="dep-balance-card__label" id="dep-balance-title">Deposit balance</span>
            <strong className="dep-balance-card__value">{formatRupiah(balance.available)}</strong>
            {/* Only what changes the balance soon: money on its way, and the deduction that happens on its own */}
            {balance.incoming > 0 && (
              <span className="dep-balance-card__incoming">+ {formatRupiah(balance.incoming)} waiting for payment</span>
            )}
            {autoPay.categories.length > 0 && (
              <div className="dep-balance-card__auto">
                <span>Auto deduction choices from {periodLabel(NEXT_PERIOD)}</span>
                <strong>{autoPay.categories.map(categoryLabel).join(', ')}</strong>
              </div>
            )}
            {row.tenantName && (
              <div className="dep-balance-card__actions">
                <button type="button" className="dep-balance-card__btn" onClick={onTopUp}>
                  <Plus size={16} weight="bold" aria-hidden="true" /> Top up
                </button>
                <button type="button" className="dep-balance-card__manage" onClick={onManage}>
                  Manage auto deduction
                </button>
              </div>
            )}
          </section>
        </aside>
      </div>

      {decisionDialog}
    </div>
  );
}

export default DepositDetailView;
