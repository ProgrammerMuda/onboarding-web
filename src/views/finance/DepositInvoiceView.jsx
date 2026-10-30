import React from 'react';
import {
  ArrowLeft,
  Buildings,
  CalendarBlank,
  Check,
  PaperPlaneTilt,
  PencilSimple,
  Printer,
  Trash
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  INVOICE_DUE_HOURS,
  INVOICE_ISSUER,
  formatDateTime,
  formatRupiah,
  invoiceStatus,
  nowLocal,
  timeSpanLabel,
  terbilang
} from '../../models/DepositModel';

const STATUS = {
  draft: { label: 'Draft', tone: 'unoccupied' },
  unpaid: { label: 'Unpaid', tone: 'pending' },
  overdue: { label: 'Overdue', tone: 'rejected' },
  paid: { label: 'Paid', tone: 'active' },
  cancelled: { label: 'Cancelled', tone: 'unoccupied' }
};

function dueText(status, invoice, now) {
  if (status === 'draft') return `Not sent yet. The ${INVOICE_DUE_HOURS}-hour due time starts when you send it.`;
  if (status === 'paid') return `Paid on ${formatDateTime(invoice.paidAt)}`;
  if (status === 'cancelled') return 'This invoice is void and cannot be paid.';
  const left = new Date(invoice.dueAt) - new Date(now);
  return left < 0 ? `${timeSpanLabel(left)} past the due time` : `Due in ${timeSpanLabel(left)}`;
}

// The Other Invoice a Deposit Monthly top up created. The left column is the invoice as the tenant gets it;
// the right column is what Finance needs: what is owed and what to do. A draft is only seen by Finance
// until it is sent; sending starts the 24-hour due time.
export function DepositInvoiceView({ entry, row, onBack, onBackToList, onMarkPaid, onSend, onEdit, onDiscard }) {
  const { invoice } = entry;
  const now = nowLocal();
  const status = invoiceStatus(entry, now);
  const s = STATUS[status];
  const open = status === 'unpaid' || status === 'overdue';
  const isDraft = status === 'draft';

  return (
    <div className="emp-detail-page unit-detail-page tm-detail dep-detail dep-inv-page">
      <Breadcrumb
        className="add-emp-breadcrumb"
        items={[
          { label: 'Finance' },
          { label: 'Deposit' },
          { label: 'Deposit Monthly', onClick: onBackToList },
          { label: row.unitCode, onClick: onBack },
          { label: invoice.number }
        ]}
      />

      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button type="button" className="emp-hero-back-btn" onClick={onBack} aria-label={`Back to ${row.unitCode} deposit`}>
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="emp-hero-banner-tag">OTHER INVOICE</div>
              <h1 className="emp-hero-banner-title dep-inv-number">{invoice.number}</h1>
              <p className="emp-hero-banner-desc">Deposit Monthly top up · {row.unitCode} · {row.tenantName}</p>
            </div>
          </div>
          <span className={`tm-status tm-status--${s.tone} tm-detail__status`}>{s.label}</span>
        </div>
      </div>

      <div className="unit-d-layout">
        <article className="dep-inv-doc" aria-label={`Invoice ${invoice.number}`}>
          <header className="dep-inv-doc__head">
            <div className="dep-inv-issuer">
              <span className="dep-inv-issuer__mark" aria-hidden="true"><Buildings size={26} weight="bold" /></span>
              <div>
                <strong className="dep-inv-issuer__name">{INVOICE_ISSUER.name}</strong>
                <p className="dep-inv-issuer__addr">{INVOICE_ISSUER.address}</p>
              </div>
            </div>
            <div className="dep-inv-doc__title">
              <span>Invoice{isDraft && <em className="dep-inv-draft-tag">Draft</em>}</span>
              <strong>{invoice.number}</strong>
            </div>
          </header>

          {isDraft && (
            <p className="dep-inv-note" role="status">
              This invoice has not been sent. {row.tenantName} cannot see it yet. Check it, then send it to the tenant.
            </p>
          )}

          {status === 'cancelled' && (
            <p className="dep-inv-void" role="status">
              Cancelled by {entry.decidedBy}{entry.cancelReason ? `: ${entry.cancelReason}` : '.'}
            </p>
          )}

          <div className="dep-inv-parties">
            <div>
              <span className="dep-inv-label">Invoice to</span>
              <strong className="dep-inv-to">{row.unitCode} · {row.tenantName}</strong>
              <span className="dep-inv-contact">{row.tenantEmail}</span>
              <span className="dep-inv-contact">{row.tenantPhone}</span>
            </div>
            <dl className="dep-inv-dates">
              <div><dt>Invoice date</dt><dd className={isDraft ? 'dep-inv-later' : ''}>{isDraft ? 'Set when sent' : formatDateTime(invoice.issuedAt)}</dd></div>
              <div>
                <dt>Due date</dt>
                <dd className={isDraft ? 'dep-inv-later' : status === 'overdue' ? 'is-overdue' : ''}>
                  {isDraft ? `${INVOICE_DUE_HOURS} hours after sending` : formatDateTime(invoice.dueAt)}
                </dd>
              </div>
              {invoice.paidAt && <div><dt>Paid on</dt><dd>{formatDateTime(invoice.paidAt)}</dd></div>}
              {invoice.proofName && <div><dt>Payment proof</dt><dd className="dep-inv-proof">{invoice.proofName}</dd></div>}
            </dl>
          </div>

          <div className="dep-inv-table">
            <table className="emp-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col" className="dep-inv-num dep-inv-wide">Qty</th>
                  <th scope="col" className="dep-inv-num dep-inv-wide">Price</th>
                  <th scope="col" className="dep-inv-num">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="dep-inv-item">Deposit Monthly top up</span>
                    <span className="dep-inv-item-sub">{row.unitCode} · {row.tower}{entry.note ? ` · ${entry.note}` : ''}</span>
                  </td>
                  <td className="dep-inv-num dep-inv-wide">1</td>
                  <td className="dep-inv-num dep-inv-wide">{formatRupiah(entry.amount)}</td>
                  <td className="dep-inv-num">{formatRupiah(entry.amount)}</td>
                </tr>
              </tbody>
            </table>
            <div className="dep-inv-total">
              <span>Total</span>
              <strong>{formatRupiah(entry.amount)}</strong>
              <em>{terbilang(entry.amount)}</em>
            </div>
          </div>
        </article>

        <aside className="unit-d-side">
          <section className={`dep-inv-due dep-inv-due--${status}`} aria-labelledby="dep-inv-due-title">
            <span className="dep-inv-due__label" id="dep-inv-due-title">{status === 'paid' ? 'Amount paid' : isDraft ? 'Draft amount' : 'Amount due'}</span>
            <strong className="dep-inv-due__value">{formatRupiah(status === 'cancelled' ? 0 : entry.amount)}</strong>
            <span className="dep-inv-due__when"><CalendarBlank size={14} weight="bold" aria-hidden="true" /> {dueText(status, invoice, now)}</span>
            {isDraft && (
              <div className="dep-inv-due__actions">
                <button type="button" className="dep-balance-card__btn" onClick={onSend}>
                  <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" /> Send to tenant
                </button>
                <button type="button" className="dep-inv-due__ghost" onClick={onEdit}>
                  <PencilSimple size={14} weight="bold" aria-hidden="true" /> Edit draft
                </button>
                <button type="button" className="dep-inv-due__ghost" onClick={onDiscard}>
                  <Trash size={14} weight="bold" aria-hidden="true" /> Discard draft
                </button>
              </div>
            )}
            {open && (
              <div className="dep-inv-due__actions">
                <button type="button" className="dep-balance-card__btn" onClick={onMarkPaid}>
                  <Check size={16} weight="bold" aria-hidden="true" /> Mark as paid
                </button>
              </div>
            )}
            {!isDraft && (
              <button type="button" className="dep-inv-due__ghost" onClick={() => window.print()}>
                <Printer size={14} weight="bold" aria-hidden="true" /> Print or save as PDF
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default DepositInvoiceView;
