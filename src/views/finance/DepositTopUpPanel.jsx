import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowsClockwise, Check, FileText, Lightning, PaperPlaneTilt, X } from '@phosphor-icons/react';
import {
  CURRENT_PERIOD,
  NEXT_PERIOD,
  EMPTY_TOPUP_DRAFT,
  autoAllocate,
  draftProblems,
  draftTotals,
  formatDate,
  formatRupiah,
  categoryLabel,
  AUTO_PAY_ITEMS,
  draftFromEntry,
  autoPayChanged,
  byCategoryRank,
  isOutstanding,
  parseAmount,
  periodLabel
} from '../../models/DepositModel';

function MoneyInput({ id, value, onChange, onBlur, invalid, describedBy, label, disabled, inputRef }) {
  return (
    <div className={`dep-money${invalid ? ' is-invalid' : ''}${disabled ? ' is-disabled' : ''}`}>
      <span aria-hidden="true">Rp</span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        value={value ? value.toLocaleString('id-ID') : ''}
        placeholder="0"
        onChange={(e) => onChange(parseAmount(e.target.value))}
        onBlur={onBlur}
      />
    </div>
  );
}

// One row of bill types as toggles, for next month onwards.
function AutoPayGroup({ legend, options, chosen, onToggle, disabled }) {
  return (
    <fieldset className={`dep-future${disabled ? ' is-disabled' : ''}`} disabled={disabled}>
      <legend className="dep-future__month">{legend}</legend>
      <div className="dep-future__types">
        {options.map((id) => {
          const on = chosen.includes(id);
          return (
            <label key={id} className={`dep-toggle${on ? ' is-on' : ''}`}>
              <input type="checkbox" checked={on} onChange={() => onToggle(id)} />
              {on && <Check size={13} weight="bold" aria-hidden="true" />}
              <span>{categoryLabel(id)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// Choosing a bill gives it what it still owes, or whatever money is left, whichever is smaller.
// A bill's amount can never take more than the money left, so the total never runs past the top up.
function BillRow({ bill, value, left, onChange, problem }) {
  const errId = `dep-bill-err-${bill.id}`;
  const outOfMoney = value <= 0 && left <= 0;
  const cap = (v) => Math.min(v, bill.remaining, value + left);
  return (
    <li className={`dep-bill${value > 0 ? ' is-picked' : ''}${outOfMoney ? ' is-out' : ''}`}>
      <label className="dep-bill__pick">
        <input
          type="checkbox"
          checked={value > 0}
          disabled={outOfMoney}
          onChange={(e) => onChange(e.target.checked ? cap(bill.remaining) : 0)}
        />
        <span className="dep-bill__text">
          <span className="dep-bill__label">{categoryLabel(bill.category)}</span>
          {bill.detail && <span className="dep-bill__detail">{bill.detail}</span>}
          <span className="dep-bill__meta">
            {`Due ${formatDate(bill.dueDate)} · ${formatRupiah(bill.remaining)} left`}
          </span>
        </span>
      </label>
      <MoneyInput
        value={value}
        onChange={(v) => onChange(cap(v))}
        invalid={Boolean(problem)}
        describedBy={problem ? errId : undefined}
        label={`Amount for ${bill.label}`}
        disabled={outOfMoney}
      />
      {problem && <p id={errId} className="dep-field-error dep-bill__error">{problem}</p>}
    </li>
  );
}

// Modal for one unit. mode 'topup' saves a draft Other Invoice for the amount, which is sent to the tenant later,
// and can plan which bills it pays once that invoice is paid. 'allocate' pays bills from the balance
// and waits for approval; 'manage' changes the unit's automatic deduction choices.
export function DepositTopUpPanel({ mode, unit, editing = null, onClose, onSubmit }) {
  const { row, balance, openBills, autoPay } = unit;
  const isTopUp = mode === 'topup';
  const isManage = mode === 'manage';
  const isAllocate = mode === 'allocate';
  // Next month starts from the unit's current choice, so the form shows what already applies.
  const currentAutoPay = autoPay.categories;
  const [draft, setDraft] = useState(() => (editing
    ? { ...draftFromEntry(editing, currentAutoPay), autoPay: isTopUp
      ? [...new Set([...currentAutoPay, ...(editing.autoPay ?? [])])]
      : editing.autoPay ?? currentAutoPay }
    : { ...EMPTY_TOPUP_DRAFT, autoPay: currentAutoPay }));
  const [step, setStep] = useState('form');
  const [amountTouched, setAmountTouched] = useState(false);
  const firstRef = useRef(null);

  // A native modal dialog, like Add Division and Add Department: it traps focus and closes on Escape.
  const dialogRef = useRef(null);
  useEffect(() => {
    const el = dialogRef.current;
    el?.showModal();
    firstRef.current?.focus();
    return () => el?.close();
  }, []);

  const totals = draftTotals(draft, balance.spendable, openBills);
  // With nothing left after this month, next month onwards has no money to use, so it keeps the current choice.
  const nextLocked = !isManage && totals.unallocated <= 0;
  const effective = useMemo(
    () => (nextLocked ? { ...draft, autoPay: currentAutoPay } : draft),
    [draft, nextLocked, currentAutoPay]
  );
  const problems = useMemo(
    () => draftProblems(effective, { mode, bills: openBills, spendable: balance.spendable, currentAutoPay }),
    [effective, mode, openBills, balance.spendable, currentAutoPay]
  );
  const { allocated, short } = totals;
  const balanceAfter = Math.max(0, balance.available + totals.toBalance);
  // Review stays disabled until the form can be sent. The first thing missing is told next to the button,
  // and the amount field is only marked red once the user has left it.
  const blocker = Object.values(problems)[0] ?? '';
  const shown = { ...problems, amount: amountTouched ? problems.amount : undefined };
  const picked = openBills.filter((b) => (totals.allocations[b.id] ?? 0) > 0);
  // What is still open on this month's invoice, and what stays open after this allocation.
  const invoiceOpen = openBills.reduce((sum, b) => sum + b.remaining, 0);
  const invoiceAfter = invoiceOpen - allocated;
  const nextMonth = [...effective.autoPay].sort(byCategoryRank);
  const nextChanged = autoPayChanged(effective, currentAutoPay);
  const unselected = AUTO_PAY_ITEMS.filter((id) => !currentAutoPay.includes(id));
  const afterLabel = isTopUp ? 'After the invoice is paid' : 'After approval';

  const patch = (p) => setDraft((prev) => ({ ...prev, ...p }));
  const setAllocation = (billId, amount) => setDraft((prev) => ({ ...prev, allocations: { ...prev.allocations, [billId]: amount } }));
  const allocateAll = () => patch({ allocations: autoAllocate(openBills, totals.budget) });
  const toggleAutoPay = (category) => setDraft((prev) => ({
    ...prev,
    autoPay: prev.autoPay.includes(category) ? prev.autoPay.filter((c) => c !== category) : [...prev.autoPay, category]
  }));

  const goReview = () => {
    if (!blocker) setStep('review');
  };

  const title = editing ? 'Edit draft invoice' : isTopUp ? 'Top up deposit' : isManage ? 'Manage auto deduction' : 'Pay bills from balance';

  return (
    <dialog
      ref={dialogRef}
      className="dep-dialog"
      aria-labelledby="dep-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
        <header className="dep-dialog-header">
          <div>
            <h2 id="dep-dialog-title">{title}</h2>
            <p>{row.unitCode} · {row.tenantName || 'No tenant'} · Step {step === 'form' ? 1 : 2} of 2</p>
          </div>
          <button type="button" className="dep-dialog-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} weight="bold" />
          </button>
        </header>

        {step === 'form' ? (
          <div className="dep-dialog-body">
            {isTopUp && (
              <section className="dep-section" aria-labelledby="dep-amount-title">
                <h3 className="dep-section__title" id="dep-amount-title">Top up</h3>
                <div className="dep-field">
                  <label htmlFor="dep-amount">Amount <span className="req">*</span></label>
                  <MoneyInput
                    id="dep-amount"
                    inputRef={firstRef}
                    value={draft.amount}
                    onChange={(v) => patch({ amount: v })}
                    onBlur={() => setAmountTouched(true)}
                    invalid={Boolean(shown.amount)}
                    describedBy={shown.amount ? 'dep-amount-err' : 'dep-amount-hint'}
                  />
                  {shown.amount
                    ? <p id="dep-amount-err" className="dep-field-error">{shown.amount}</p>
                    : <p id="dep-amount-hint" className="dep-field-hint">This becomes an Other Invoice for {row.tenantName}, saved as a draft first. It enters the deposit once you send it and it is paid.</p>}
                </div>
              </section>
            )}

            {!isManage && <section className="dep-section" aria-labelledby="dep-bills">
              <div className="dep-section__head">
                <h3 className="dep-section__title" id="dep-bills">This month · {periodLabel(CURRENT_PERIOD)}</h3>
                {openBills.length > 0 && (
                  <button type="button" className="dep-link-btn" onClick={allocateAll} disabled={totals.budget <= 0}>
                    <Lightning size={14} weight="bold" aria-hidden="true" />
                    Auto allocate
                  </button>
                )}
              </div>
              <p className="dep-field-hint">
                {isTopUp
                  ? 'Choose the bills to pay. Each one takes what it owes from the money left, and you can change the amount. They are paid once the top up invoice is paid.'
                  : 'Choose the bills to pay from the balance. Each one takes what it owes from the money left, and you can change the amount.'}
              </p>
              {invoiceOpen > 0 && (
                <div className="dep-meter">
                  <div className="dep-meter__head">
                    <span>{periodLabel(CURRENT_PERIOD)} invoice</span>
                    <strong>{formatRupiah(invoiceOpen)} unpaid</strong>
                  </div>
                  <div
                    className="dep-meter__bar"
                    role="progressbar"
                    aria-label={`Share of the ${periodLabel(CURRENT_PERIOD)} invoice this pays`}
                    aria-valuemin={0}
                    aria-valuemax={invoiceOpen}
                    aria-valuenow={allocated}
                    aria-valuetext={`${formatRupiah(allocated)} of ${formatRupiah(invoiceOpen)}`}
                  >
                    <span style={{ width: `${Math.min(100, (allocated / invoiceOpen) * 100)}%` }} />
                  </div>
                  {/* A legend for the bar: green is what this pays, grey is what stays on the invoice */}
                  <dl className="dep-meter__legend">
                    <div className="is-paid">
                      <dt>{isTopUp ? 'This top up pays' : 'Paid from balance'}</dt>
                      <dd>{formatRupiah(allocated)}</dd>
                    </div>
                    <div className={`is-left${invoiceAfter <= 0 ? ' is-done' : ''}`}>
                      <dt>Still unpaid</dt>
                      <dd>{invoiceAfter <= 0 ? 'Paid in full' : formatRupiah(invoiceAfter)}</dd>
                    </div>
                  </dl>
                </div>
              )}
              {balance.spendable > 0 && (
                <p className="dep-balance-note">
                  Deposit balance you can also use: <strong>{formatRupiah(balance.spendable)}</strong>
                </p>
              )}
              {openBills.length === 0 ? (
                <p className="dep-empty-line">Nothing left to pay on this month's invoice.</p>
              ) : (
                <div className="dep-bill-groups" ref={isTopUp ? undefined : firstRef} tabIndex={isTopUp ? undefined : -1}>
                  {/* Same two groups as next month; here Outstanding already has an amount from earlier invoices */}
                  {[
                    { key: 'charges', legend: 'Monthly charges', bills: openBills.filter((b) => !isOutstanding(b.category)) },
                    { key: 'outstanding', legend: 'Outstanding', bills: openBills.filter((b) => isOutstanding(b.category)) }
                  ].filter((g) => g.bills.length > 0).map((g) => (
                    <div key={g.key} className="dep-bill-group">
                      <h4 className="dep-bill-group__title" id={`dep-group-${g.key}`}>{g.legend}</h4>
                      <ul className="dep-bills" aria-labelledby={`dep-group-${g.key}`}>
                        {g.bills.map((b) => (
                          <BillRow
                            key={b.id}
                            bill={b}
                            value={draft.allocations[b.id] ?? 0}
                            left={totals.unallocated}
                            onChange={(v) => setAllocation(b.id, v)}
                            problem={shown[b.id]}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>}

            {!isAllocate && <section className="dep-section" aria-labelledby="dep-next-title">
              <h3 className="dep-section__title" id="dep-next-title">Auto deduction from next month</h3>
              {isTopUp && currentAutoPay.length > 0 && (
                <div className="dep-active-choice">
                  <strong>Already active for {periodLabel(NEXT_PERIOD)}</strong>
                  <ul className="dep-next-list">{currentAutoPay.map((id) => <li key={id}>{categoryLabel(id)}</li>)}</ul>
                  <p>This top up follows these choices automatically.</p>
                </div>
              )}
              {nextLocked ? (
                <p className="dep-next-locked">
                  {totals.budget > 0
                    ? 'All the money goes to this month. Lower an amount above to leave some for next month.'
                    : isTopUp ? 'Enter the top up amount first.' : 'There is no free balance.'}
                </p>
              ) : !isTopUp ? (
                <p className="dep-field-hint">
                  {isManage
                    ? 'Choose every bill type the unit should pay automatically from the next invoice.'
                    : `The ${formatRupiah(totals.unallocated)} left stays in the balance. Each time an invoice is issued, the balance pays the chosen monthly charges.`}
                </p>
              ) : null}
              {isTopUp && unselected.length === 0 ? (
                <p className="dep-field-hint">All available bill types are already active.</p>
              ) : (
                <AutoPayGroup
                  legend={isTopUp ? 'Add bill types' : 'Monthly charges'}
                  options={isTopUp ? unselected : AUTO_PAY_ITEMS}
                  chosen={effective.autoPay}
                  onToggle={toggleAutoPay}
                  disabled={nextLocked}
                />
              )}
              {shown.autoPay && <p className="dep-field-error" role="alert">{shown.autoPay}</p>}
            </section>}

            <div className="dep-field">
              <label htmlFor="dep-note">Note (optional)</label>
              <textarea
                id="dep-note"
                rows={2}
                maxLength={200}
                className="form-control add-emp-input"
                placeholder={isTopUp ? 'Shown on the invoice, e.g. deposit for Nov to Dec' : 'e.g. requested by the owner'}
                value={draft.note}
                onChange={(e) => patch({ note: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="dep-dialog-body">
            <p className="dep-review-lead">
              {isTopUp
                ? `Check the details. This saves a draft. ${row.tenantName} gets nothing until you send it, and the balance and bills only change once it is paid.`
                : isManage
                  ? 'Check the bill types. Saving this updates the unit’s automatic deduction choices.'
                  : 'Check the details. Nothing changes until another Finance user approves it.'}
            </p>
            {isTopUp && (
              <section className="dep-review">
                <div className="dep-review__head">
                  <h3><FileText size={16} weight="bold" aria-hidden="true" /> Draft Other Invoice</h3>
                </div>
                <dl>
                  <div><dt>Billed to</dt><dd>{row.tenantName} · {row.unitCode}</dd></div>
                  <div><dt>Item</dt><dd>Deposit Monthly top up</dd></div>
                  <div className="is-total"><dt>Amount</dt><dd>{formatRupiah(draft.amount)}</dd></div>
                </dl>
              </section>
            )}
            {!isManage && <section className="dep-review">
              <div className="dep-review__head">
                <h3>{periodLabel(CURRENT_PERIOD)} bills{isTopUp ? ' it pays once paid' : ' to pay'}</h3>
                {!isTopUp && <button type="button" className="dep-link-btn" onClick={() => setStep('form')} aria-label="Change this month's bills">Change</button>}
              </div>
              {picked.length === 0 ? (
                <p className="dep-empty-line">None from this month.</p>
              ) : (
                <dl>
                  {picked.map((b) => (
                    <div key={b.id}>
                      <dt>{b.label}{totals.allocations[b.id] < b.remaining ? ' (part)' : ''}</dt>
                      <dd>{formatRupiah(totals.allocations[b.id])}</dd>
                    </div>
                  ))}
                  <div className="is-total"><dt>Total</dt><dd>{formatRupiah(allocated)}</dd></div>
                </dl>
              )}
            </section>}
            {!isAllocate && (nextMonth.length > 0 || nextChanged) && (
              <section className="dep-review">
                <div className="dep-review__head">
                  <h3><ArrowsClockwise size={16} weight="bold" aria-hidden="true" /> Next month onwards</h3>
                  {!isTopUp && <button type="button" className="dep-link-btn" onClick={() => setStep('form')} aria-label="Change next month onwards">Change</button>}
                </div>
                {nextMonth.length === 0 ? (
                  <p className="dep-empty-line">Nothing. The balance stays until someone allocates it.</p>
                ) : (
                  <ul className="dep-next-list">
                    {nextMonth.map((id) => <li key={id}>{categoryLabel(id)}</li>)}
                  </ul>
                )}
                <p className="dep-field-hint dep-review__foot">
                  {isTopUp
                    ? 'This top up adds its chosen bill types once the invoice is paid. Earlier top up choices still apply.'
                    : nextChanged
                      ? isManage ? 'Replaces the current choice when saved.' : 'Replaces the current choice once approved. Amounts are taken when each invoice is issued.'
                      : 'Same as now. Amounts are taken when each invoice is issued.'}
                </p>
              </section>
            )}
            {!isManage && <section className="dep-review">
              <div className="dep-review__head"><h3>Deposit balance</h3></div>
              <dl>
                <div><dt>Now</dt><dd>{formatRupiah(balance.available)}</dd></div>
                <div className="is-total"><dt>{afterLabel}</dt><dd>{formatRupiah(balanceAfter)}</dd></div>
              </dl>
            </section>}
            {draft.note.trim() && (
              <section className="dep-review">
                <div className="dep-review__head"><h3>Note</h3></div>
                <p className="dep-review__note">{draft.note.trim()}</p>
              </section>
            )}
          </div>
        )}

        {!isManage && <div className="dep-dialog-summary" aria-live="polite">
          {/* The money in one line: what there is, what goes to this month, and what stays in the balance */}
          <div className="dep-flow">
            <div>
              <span>{isTopUp ? (balance.spendable > 0 ? 'Top up + balance' : 'Top up') : 'Free balance'}</span>
              <strong>{formatRupiah(totals.budget)}</strong>
            </div>
            <span className="dep-flow__op" aria-hidden="true">−</span>
            <div>
              <span>To {periodLabel(CURRENT_PERIOD)} bills</span>
              <strong>{formatRupiah(allocated)}</strong>
            </div>
            <span className="dep-flow__op" aria-hidden="true">=</span>
            <div className="dep-flow__result">
              <span>Stays in the balance</span>
              <strong>{formatRupiah(totals.budget - allocated)}</strong>
            </div>
          </div>
          {short > 0 && (
            <p className="dep-short-note">
              This covers {formatRupiah(allocated)} of the chosen bills. The remaining {formatRupiah(short)} on the {periodLabel(CURRENT_PERIOD)} invoice stays unpaid.
            </p>
          )}
          {step === 'form' && blocker && <p id="dep-blocker" className="dep-blocker">{blocker}</p>}
        </div>}

        <footer className="dep-dialog-footer">
          {step === 'form' ? (
            <>
              <button type="button" className="dep-button" onClick={onClose}>Cancel</button>
              <button
                type="button"
                className="dep-button primary"
                onClick={goReview}
                disabled={Boolean(blocker)}
                aria-describedby={blocker ? 'dep-blocker' : undefined}
              >
                Review
              </button>
            </>
          ) : (
            <>
              <button type="button" className="dep-button" onClick={() => setStep('form')}>
                <ArrowLeft size={14} weight="bold" aria-hidden="true" /> Back
              </button>
              <button type="button" className="dep-button primary" onClick={() => onSubmit(effective)}>
                {isTopUp ? <FileText size={16} weight="bold" aria-hidden="true" /> : <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" />}
                {isTopUp ? `${editing ? 'Save draft' : 'Save as draft'} · ${formatRupiah(draft.amount)}` : isManage ? 'Save choices' : 'Send for approval'}
              </button>
            </>
          )}
        </footer>
    </dialog>
  );
}

export default DepositTopUpPanel;
