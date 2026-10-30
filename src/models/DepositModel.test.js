import { describe, it, expect } from 'vitest';
import { SEED_UNITS } from './UnitModel';
import {
  CURRENT_USER,
  EMPTY_TOPUP_DRAFT,
  autoAllocate,
  groupByMonth,
  historySummary,
  historyLines,
  isWaiting,
  lineBalances,
  draftFromEntry,
  editDraft,
  sendInvoice,
  addHours,
  timeSpanLabel,
  balanceOf,
  billStatus,
  billedParty,
  AUTO_PAY_ITEMS,
  autoPayRule,
  outstandingLines,
  buildBills,
  buildDepositRows,
  buildEntry,
  buildLedger,
  cancelInvoice,
  decideEntry,
  markInvoicePaid,
  nextInvoiceNumber,
  draftProblems,
  draftTotals,
  filterDeposits,
  formatRupiah,
  getDepositStats,
  openBills,
  parseAmount
} from './DepositModel';

const unit = { id: 'u1', code: 'A0101', tower: 'Tower A', status: 'occupied', category: 'hunian', ownerName: 'Dewi Lestari', tenantName: '' };

const bill = (id, category, period, amount, extra = {}) => ({ id, unitId: 'u1', category, period, label: id, dueDate: `${period}-20`, amount, ...extra });

const BILLS = [
  bill('sc-oct', 'service_charge', '2026-10', 600000),
  bill('oc-oct', 'other_cost', '2026-10', 50000),
  bill('elec-oct', 'electricity', '2026-10', 300000),
  bill('inst-oct', 'installment', '2026-10', 600000),
  bill('water-oct', 'water', '2026-10', 100000),
  bill('sc-sep', 'service_charge', '2026-09', 600000)
];

const entry = (status, amount, allocations = [], extra = {}) => ({
  id: `e-${status}-${amount}`, unitId: 'u1', type: 'topup', date: '2026-10-01', amount, allocations, status, createdBy: 'Rina Kartika', ...extra
});

describe('billedParty', () => {
  it('bills the renter of a rented unit and the owner otherwise', () => {
    expect(billedParty({ status: 'rented', tenantName: 'Ferry', ownerName: 'Dewi', category: 'hunian' })).toEqual({ name: 'Ferry', role: 'Renter' });
    expect(billedParty({ status: 'vacant', tenantName: '', ownerName: 'Dewi', category: 'hunian' })).toEqual({ name: 'Dewi', role: 'Owner' });
  });

  it('bills nobody for a P3SRS facility without a renter', () => {
    expect(billedParty({ status: 'vacant', tenantName: '', ownerName: 'P3SRS', category: 'non_unit' })).toBeNull();
  });
});

describe('openBills', () => {
  it('offers only this month, ordered electricity, water, service charge, installment, other cost', () => {
    expect(openBills(BILLS, []).map((b) => b.id)).toEqual(['elec-oct', 'water-oct', 'sc-oct', 'inst-oct', 'oc-oct']);
  });

  it('leaves out what paid and open entries already pay, and ignores cancelled and rejected ones', () => {
    const entries = [
      entry('paid', 600000, [{ billId: 'inst-oct', amount: 600000 }]),
      entry('unpaid', 100000, [{ billId: 'water-oct', amount: 40000 }]),
      entry('cancelled', 300000, [{ billId: 'elec-oct', amount: 300000 }]),
      entry('rejected', 0, [{ billId: 'elec-oct', amount: 300000 }], { type: 'allocate' })
    ];
    const open = openBills(BILLS, entries);
    expect(open.find((b) => b.id === 'inst-oct')).toBeUndefined();
    expect(open.find((b) => b.id === 'water-oct').remaining).toBe(60000);
    expect(open.find((b) => b.id === 'elec-oct').remaining).toBe(300000);
  });

  it('reports what is paid, planned, and left on each bill', () => {
    const status = billStatus(BILLS, [entry('paid', 400000, [{ billId: 'elec-oct', amount: 100000 }])]);
    expect(status.find((b) => b.id === 'elec-oct')).toMatchObject({ paid: 100000, planned: 0, remaining: 200000 });
  });
});

describe('next month onwards', () => {
  it('offers the same six items to every unit', () => {
    expect(AUTO_PAY_ITEMS).toEqual(['electricity', 'water', 'service_charge', 'sinking_fund', 'installment', 'other_cost']);
  });

  it('keeps paid top-up choices together and shows an open choice as pending', () => {
    const older = entry('paid', 1, [], { id: 'a', date: '2026-08-01', autoPay: ['electricity'] });
    const newer = entry('approved', 0, [], { id: 'b', date: '2026-09-01', autoPay: ['water', 'sinking_fund'] });
    const waiting = entry('unpaid', 1, [], { id: 'c', date: '2026-10-01', autoPay: ['service_charge'] });
    const dropped = entry('cancelled', 1, [], { id: 'd', date: '2026-10-02', autoPay: [] });
    expect(autoPayRule([older, newer, waiting, dropped])).toEqual({
      categories: ['electricity', 'water', 'sinking_fund'],
      pending: ['electricity', 'water', 'service_charge', 'sinking_fund']
    });
    expect(autoPayRule([older])).toEqual({ categories: ['electricity'], pending: null });
    expect(autoPayRule([])).toEqual({ categories: [], pending: null });
    const override = entry('approved', 0, [], { id: 'override', type: 'allocate', date: '2026-10-03', autoPay: ['water'] });
    expect(autoPayRule([older, newer, override]).categories).toEqual(['water']);
  });

  it('records each top-up choice in priority order, even when it matches the current choice', () => {
    const d = { ...EMPTY_TOPUP_DRAFT, amount: 100000, autoPay: ['service_charge', 'water', 'electricity'] };
    const args = { id: 'n', unitId: 'u1', mode: 'topup', now: '2026-10-29T10:00', invoiceNo: 'X' };
    expect(buildEntry(d, { ...args, currentAutoPay: [] }).autoPay).toEqual(['electricity', 'water', 'service_charge']);
    expect(buildEntry(d, { ...args, currentAutoPay: ['electricity', 'water', 'service_charge'] }).autoPay).toEqual(['electricity', 'water', 'service_charge']);
    expect(buildEntry({ ...d, autoPay: null }, args).autoPay).toBeUndefined();
  });

  it('lets a payment from the balance only change next month', () => {
    const d = { ...EMPTY_TOPUP_DRAFT, autoPay: ['service_charge'] };
    expect(draftProblems(d, { mode: 'allocate', bills: [], spendable: 100000, currentAutoPay: [] })).toEqual({});
    expect(draftProblems(d, { mode: 'allocate', bills: [], spendable: 100000, currentAutoPay: ['service_charge'] }).total).toMatch(/next month/);
  });

  it('updates the unit-wide choices separately without moving deposit money', () => {
    const previous = entry('paid', 1000000, [], { id: 'previous', date: '2026-10-20', autoPay: AUTO_PAY_ITEMS });
    const draft = { ...EMPTY_TOPUP_DRAFT, autoPay: ['water'] };
    expect(draftProblems(draft, { mode: 'manage', bills: [], spendable: 1000000, currentAutoPay: AUTO_PAY_ITEMS })).toEqual({});
    expect(draftProblems({ ...draft, autoPay: AUTO_PAY_ITEMS }, { mode: 'manage', bills: [], spendable: 1000000, currentAutoPay: AUTO_PAY_ITEMS }).autoPay).toMatch(/Change/);
    const changed = buildEntry(draft, {
      id: 'change', unitId: 'u1', mode: 'manage', now: '2026-10-30T09:00', currentAutoPay: AUTO_PAY_ITEMS
    });
    expect(changed).toMatchObject({ type: 'rule', status: 'active', amount: 0, allocations: [], autoPay: ['water'] });
    expect(autoPayRule([previous, changed]).categories).toEqual(['water']);
    expect(balanceOf([previous, changed]).available).toBe(1000000);
    expect(historyLines([previous, changed]).find((line) => line.kind === 'rule')).toMatchObject({ status: 'active', amount: 0 });
    expect(lineBalances(historyLines([previous, changed]))).toEqual({ 'previous:in': 1000000 });
  });
});

describe('autoAllocate', () => {
  it('fills bills in order and pays the last one partly', () => {
    expect(autoAllocate(openBills(BILLS, []), 750000)).toEqual({ 'elec-oct': 300000, 'water-oct': 100000, 'sc-oct': 350000 });
  });
});

describe('balanceOf', () => {
  it('counts paid top ups only, and holds back what open entries plan to take', () => {
    const entries = [
      entry('paid', 1000000, [{ billId: 'inst-oct', amount: 600000 }]),
      entry('unpaid', 500000),
      entry('pending', 0, [{ billId: 'water-oct', amount: 100000 }], { type: 'allocate' }),
      entry('cancelled', 900000)
    ];
    expect(balanceOf(entries)).toEqual({ available: 400000, incoming: 500000, spendable: 300000 });
  });
});

describe('draftProblems', () => {
  const open = openBills(BILLS, []);
  const draft = (patch) => ({ ...EMPTY_TOPUP_DRAFT, ...patch });

  it('only asks a top up for its amount', () => {
    expect(draftProblems(draft({}), { mode: 'topup', bills: open, spendable: 0 })).toEqual({ amount: 'Enter the top up amount.' });
    expect(draftProblems(draft({ amount: 100000 }), { mode: 'topup', bills: open, spendable: 0 })).toEqual({});
  });

  it('stops paying more than a bill has left', () => {
    const problems = draftProblems(draft({ amount: 100000, allocations: { 'water-oct': 150000 } }), { mode: 'topup', bills: open, spendable: 20000 });
    expect(problems['water-oct']).toMatch(/Rp 100\.000 left/);
  });

  it('lets a top up pay bills with the balance too', () => {
    const d = draft({ amount: 50000, allocations: { 'water-oct': 100000 } });
    expect(draftProblems(d, { mode: 'topup', bills: open, spendable: 60000 })).toEqual({});
    expect(draftTotals(d, 60000, open)).toMatchObject({ allocated: 100000, short: 0, unallocated: 10000, budget: 110000, toBalance: -50000 });
  });

  it('pays the chosen bills only as far as the money lasts, in priority order, never below zero', () => {
    // A Rp 1.300.000 choice with only Rp 1.000.000 of top up: Rp 1.000.000 is paid, the balance ends at zero.
    const d = draft({ amount: 1000000, allocations: { 'sc-oct': 600000, 'elec-oct': 300000, 'inst-oct': 400000 } });
    const t = draftTotals(d, 0, open);
    expect(t).toMatchObject({ requested: 1300000, allocated: 1000000, short: 300000, unallocated: 0, toBalance: 0 });
    expect(t.allocations).toEqual({ 'elec-oct': 300000, 'sc-oct': 600000, 'inst-oct': 100000 });
    expect(draftProblems(d, { mode: 'topup', bills: open, spendable: 0 })).toEqual({});
  });

  it('needs at least one bill when paying from the balance', () => {
    expect(draftProblems(draft({}), { mode: 'allocate', bills: open, spendable: 300000 }).total).toMatch(/Choose a bill/);
  });
});

describe('top up invoices', () => {
  const d = { ...EMPTY_TOPUP_DRAFT, amount: 200000, note: ' front desk ', allocations: { 'water-oct': 100000, 'inst-oct': 0 } };

  it('turns a top up into a draft Other Invoice, with only the bills that get money and no due time yet', () => {
    const e = buildEntry(d, { id: 'n1', unitId: 'u1', mode: 'topup', now: '2026-10-29T10:00', invoiceNo: 'INV/OTH/202610/0003' });
    expect(e).toMatchObject({
      status: 'draft',
      createdBy: CURRENT_USER,
      amount: 200000,
      note: 'front desk',
      allocations: [{ billId: 'water-oct', amount: 100000 }],
      date: '2026-10-29',
      invoice: { number: 'INV/OTH/202610/0003', createdAt: '2026-10-29T10:00' }
    });
    expect(e.invoice.issuedAt).toBeUndefined();
    expect(e.invoice.dueAt).toBeUndefined();
  });

  it('starts the 24-hour due time when the draft is sent, and sends only a draft', () => {
    const e = buildEntry(d, { id: 'n1', unitId: 'u1', mode: 'topup', now: '2026-10-29T10:00', invoiceNo: 'X' });
    const [sent] = sendInvoice([e], 'n1', '2026-10-29T14:20');
    expect(sent).toMatchObject({ status: 'unpaid', invoice: { number: 'X', issuedAt: '2026-10-29T14:20', dueAt: '2026-10-30T14:20', sentBy: CURRENT_USER } });
    // Sending again changes nothing: the invoice was already sent.
    expect(sendInvoice([sent], 'n1', '2026-10-29T18:00')[0].invoice.issuedAt).toBe('2026-10-29T14:20');
  });

  it('keeps a draft out of the money expected, but still holds its bills', () => {
    const e = buildEntry(d, { id: 'n1', unitId: 'u1', mode: 'topup', now: '2026-10-29T10:00', invoiceNo: 'X' });
    expect(balanceOf([e])).toMatchObject({ available: 0, incoming: 0 });
    // Water is fully held by the draft, so nothing else can be allocated to it.
    expect(openBills(BILLS, [e]).some((b) => b.id === 'water-oct')).toBe(false);
    expect(balanceOf(sendInvoice([e], 'n1', '2026-10-29T14:20'))).toMatchObject({ incoming: 200000 });
  });

  it('edits a draft in place: new amount and bills, same number, author, and creation time', () => {
    const e = buildEntry(d, { id: 'n1', unitId: 'u1', mode: 'topup', now: '2026-10-29T10:00', invoiceNo: 'INV/OTH/202610/0003' });
    const form = { ...draftFromEntry(e), amount: 500000, allocations: { 'elec-oct': 300000 } };
    expect(draftFromEntry(e)).toMatchObject({ amount: 200000, allocations: { 'water-oct': 100000 } });
    const saved = editDraft(e, form, { bills: openBills(BILLS, []), spendable: 0 });
    expect(saved).toMatchObject({
      id: 'n1',
      status: 'draft',
      amount: 500000,
      createdBy: CURRENT_USER,
      allocations: [{ billId: 'elec-oct', amount: 300000 }],
      invoice: { number: 'INV/OTH/202610/0003', createdAt: '2026-10-29T10:00' }
    });
  });

  it('numbers invoices per month', () => {
    const entries = [{ invoice: { number: 'INV/OTH/202610/0011' } }, { invoice: { number: 'INV/OTH/202610/0001' } }, { invoice: { number: 'INV/OTH/202609/0004' } }, {}];
    expect(nextInvoiceNumber(entries, '2026-10-29')).toBe('INV/OTH/202610/0012');
    expect(nextInvoiceNumber(entries, '2026-11-01')).toBe('INV/OTH/202611/0001');
  });

  it('adds the money and pays the bills only once the invoice is paid', () => {
    const e = sendInvoice([buildEntry(d, { id: 'n1', unitId: 'u1', mode: 'topup', now: '2026-10-29T10:00', invoiceNo: 'X' })], 'n1', '2026-10-29T10:05')[0];
    expect(balanceOf([e])).toMatchObject({ available: 0, incoming: 200000 });
    const paid = markInvoicePaid([e], 'n1', '2026-10-30T09:15', 'bukti.pdf');
    expect(paid[0]).toMatchObject({ status: 'paid', invoice: { paidAt: '2026-10-30T09:15', proofName: 'bukti.pdf' } });
    expect(balanceOf(paid)).toMatchObject({ available: 100000, incoming: 0 });
    expect(billStatus(BILLS, paid).find((b) => b.id === 'water-oct')).toMatchObject({ paid: 100000, remaining: 0 });
  });

  it('frees the bills when a draft is discarded', () => {
    const e = buildEntry(d, { id: 'n1', unitId: 'u1', mode: 'topup', now: '2026-10-29T10:00', invoiceNo: 'X' });
    const [discarded] = cancelInvoice([e], 'n1', 'Draft discarded');
    expect(discarded).toMatchObject({ status: 'cancelled', cancelReason: 'Draft discarded' });
    expect(openBills(BILLS, [discarded]).find((b) => b.id === 'water-oct').remaining).toBe(100000);
  });

  it('frees the planned bills when the invoice is cancelled', () => {
    const e = buildEntry(d, { id: 'n1', unitId: 'u1', mode: 'topup', now: '2026-10-29T10:00', invoiceNo: 'X' });
    const [cancelled] = cancelInvoice([e], 'n1', 'Wrong amount');
    expect(cancelled).toMatchObject({ status: 'cancelled', cancelReason: 'Wrong amount' });
    expect(openBills(BILLS, [cancelled]).find((b) => b.id === 'water-oct').remaining).toBe(100000);
  });
});

describe('payments from the balance', () => {
  it('wait for approval and move no money in', () => {
    const d = { ...EMPTY_TOPUP_DRAFT, amount: 999, allocations: { 'water-oct': 100000 } };
    const e = buildEntry(d, { id: 'n2', unitId: 'u1', mode: 'allocate', now: '2026-10-29T10:00' });
    expect(e).toMatchObject({ amount: 0, date: '2026-10-29', status: 'pending' });
    expect(e.invoice).toBeUndefined();
  });

  it('keep the rejection reason', () => {
    const [e] = decideEntry([entry('pending', 1000)], 'e-pending-1000', 'rejected', 'Wrong unit');
    expect(e).toMatchObject({ status: 'rejected', rejectReason: 'Wrong unit', decidedBy: CURRENT_USER });
  });
});

describe('sample data', () => {
  it('pools A0103 top ups while retaining earlier choices after a Water-only top up', () => {
    const a0103 = SEED_UNITS.find((u) => u.code === 'A0103');
    const bills = buildBills(SEED_UNITS).filter((b) => b.unitId === a0103.id);
    const ledger = buildLedger([a0103], bills);
    const lines = historyLines(ledger);
    const balance = balanceOf(ledger).available;
    const beforeWaterTopUp = ledger.filter((e) => e.id !== 'seed-a0103-water-topup');

    expect(lines.map((line) => [line.kind, line.status])).toEqual([
      ['topup', 'paid'], ['deduction', 'deducted'], ['deduction', 'deducted'],
      ['topup', 'paid'], ['topup', 'paid'], ['topup', 'paid']
    ]);
    expect(ledger.find((e) => e.type === 'allocate')?.allocations).toHaveLength(2);
    expect(autoPayRule(beforeWaterTopUp).categories).toEqual(AUTO_PAY_ITEMS);
    expect(balanceOf(beforeWaterTopUp.filter((e) => e.id !== 'seed-a0103-extra-topup')).available).toBe(1315000);
    expect(balanceOf(beforeWaterTopUp).available).toBe(1815000);
    expect(autoPayRule(ledger).categories).toEqual(AUTO_PAY_ITEMS);
    expect(balance).toBe(2215000);
    expect(buildDepositRows([a0103], ledger)[0].balance).toBe(balance);
    expect(Object.values(lineBalances(lines))).toContain(balance);
  });

  it('starts every seeded unit with its August bills paid and a zero balance', () => {
    const bills = buildBills([unit]);
    const ledger = buildLedger([unit], bills);
    const [row] = buildDepositRows([unit], ledger);
    expect(row.balance).toBe(0);
    expect(openBills(bills, ledger).some((b) => b.period === '2026-08')).toBe(false);
  });

  it('gives a P3SRS facility without a renter no bills and no balance', () => {
    const facility = { id: 'f1', code: 'BATM1', tower: 'Tower B', status: 'vacant', category: 'non_unit', ownerName: 'P3SRS', tenantName: '' };
    expect(buildBills([facility])).toEqual([]);
    expect(buildDepositRows([facility], [])[0]).toMatchObject({ tenantName: '', balance: 0 });
  });
});

describe('getDepositStats', () => {
  it('sums balances and counts units and unpaid top up invoices', () => {
    const rows = [
      { balance: 643248, unpaidInvoices: 1 },
      { balance: 0, unpaidInvoices: 0 },
      { balance: 0, unpaidInvoices: 2 }
    ];
    expect(getDepositStats(rows)).toEqual({ totalBalance: 643248, unitsWithDeposit: 1, unitsWithoutDeposit: 2, unpaidInvoices: 3 });
  });
});

describe('filterDeposits', () => {
  const rows = [
    { id: '1', unitCode: 'A0101', tower: 'Tower A', tenantName: 'Dewi Lestari', balance: 643248 },
    { id: '2', unitCode: 'A0102', tower: 'Tower A', tenantName: 'Ferry Salim', balance: 0 },
    { id: '3', unitCode: 'B0101', tower: 'Tower B', tenantName: '', balance: 0 }
  ];

  it('matches the unit code or tenant name', () => {
    expect(filterDeposits(rows, { query: 'ferry' }).map((r) => r.id)).toEqual(['2']);
    expect(filterDeposits(rows, { query: 'b01' }).map((r) => r.id)).toEqual(['3']);
  });

  it('filters by tower and balance', () => {
    expect(filterDeposits(rows, { tower: 'Tower A', balance: 'zero' }).map((r) => r.id)).toEqual(['2']);
    expect(filterDeposits(rows, { balance: 'with' }).map((r) => r.id)).toEqual(['1']);
  });
});

describe('formatting', () => {
  it('uses Indonesian thousands separators', () => {
    expect(formatRupiah(3083195)).toBe('Rp 3.083.195');
    expect(formatRupiah(0)).toBe('Rp 0');
  });

  it('reads digits out of a typed amount', () => {
    expect(parseAmount('Rp 1.250.000')).toBe(1250000);
    expect(parseAmount('')).toBe(0);
  });
});

describe('invoice helpers', () => {
  it('writes the total in Indonesian words', async () => {
    const { terbilang } = await import('./DepositModel');
    expect(terbilang(1000000)).toBe('Satu Juta Rupiah');
    expect(terbilang(2325974)).toBe('Dua Juta Tiga Ratus Dua Puluh Lima Ribu Sembilan Ratus Tujuh Puluh Empat Rupiah');
    expect(terbilang(1150)).toBe('Seribu Seratus Lima Puluh Rupiah');
    expect(terbilang(11000)).toBe('Sebelas Ribu Rupiah');
    expect(terbilang(0)).toBe('Nol Rupiah');
  });

  it('marks an unpaid invoice overdue after its due time only', async () => {
    const { invoiceStatus } = await import('./DepositModel');
    const e = { status: 'unpaid', invoice: { dueAt: '2026-10-30T10:00' } };
    expect(invoiceStatus(e, '2026-10-30T10:00')).toBe('unpaid');
    expect(invoiceStatus(e, '2026-10-30T10:01')).toBe('overdue');
    expect(invoiceStatus({ ...e, status: 'paid' }, '2026-11-30T00:00')).toBe('paid');
  });

  it('is due at the same time the next day: issued 10:00, due tomorrow 10:00', () => {
    expect(addHours('2026-10-29T10:00', 24)).toBe('2026-10-30T10:00');
    expect(addHours('2026-10-31T23:30', 24)).toBe('2026-11-01T23:30');
  });

  it('says how long is left in words', () => {
    expect(timeSpanLabel(30 * 1000)).toBe('less than a minute');
    expect(timeSpanLabel(45 * 60000)).toBe('45 min');
    expect(timeSpanLabel(60 * 60000)).toBe('1 hour');
    expect(timeSpanLabel((5 * 60 + 20) * 60000)).toBe('5 hours 20 min');
    expect(timeSpanLabel(24 * 3600000)).toBe('24 hours');
    expect(timeSpanLabel(-26 * 3600000)).toBe('26 hours');
    expect(timeSpanLabel(72 * 3600000)).toBe('3 days');
  });
});

describe('payment proof', () => {
  it('takes a PDF, JPG, or PNG up to 5 MB', async () => {
    const { proofFileError } = await import('./DepositModel');
    expect(proofFileError({ type: 'application/pdf', size: 1024 })).toBe('');
    expect(proofFileError({ type: 'image/png', size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
    expect(proofFileError({ type: 'text/plain', size: 10 })).toMatch(/PDF, JPG, or PNG/);
  });
});

describe('outstandingLines', () => {
  const unit = { id: 'u1' };

  it('rolls unpaid earlier invoices into the new invoice, one Outstanding line per item', () => {
    const lines = outstandingLines(unit, '2026-10', [
      { category: 'service_charge', period: '2026-09', amount: 600000 },
      { category: 'water', period: '2026-09', amount: 100000 },
      { category: 'service_charge', period: '2026-07', amount: 250000 }
    ]);
    expect(lines.map((l) => [l.category, l.amount, l.detail])).toEqual([
      ['outstanding_water', 100000, 'From the Sep 2026 invoice'],
      ['outstanding_service_charge', 850000, 'From the Jul 2026 and Sep 2026 invoices']
    ]);
    expect(lines[0]).toMatchObject({ period: '2026-10', label: 'Outstanding Water Oct 2026' });
  });

  it('adds no line when nothing is unpaid', () => {
    expect(outstandingLines(unit, '2026-10', [])).toEqual([]);
  });

  it('lists Outstanding before the monthly charges', () => {
    const bills = [
      { id: 'sc', category: 'service_charge', period: '2026-10', amount: 600000 },
      { id: 'out', category: 'outstanding_other_cost', period: '2026-10', amount: 700000 }
    ];
    expect(openBills(bills, []).map((b) => b.id)).toEqual(['out', 'sc']);
  });
});



describe('auto deductions', () => {
  it('seeds an October deduction for units on auto-pay that paid September, and still leaves zero', () => {
    const bills = buildBills([unit]);
    const ledger = buildLedger([unit], bills);
    const auto = ledger.find((e) => e.type === 'autopay');
    expect(auto).toMatchObject({ status: 'deducted', period: '2026-10', amount: 0, createdBy: 'System' });
    expect(auto.allocations.length).toBeGreaterThan(0);
    expect(buildDepositRows([unit], ledger)[0].balance).toBe(0);
  });

  it('never plans a sample top up on a bill the deduction already paid', () => {
    const ledger = buildLedger(SEED_UNITS);
    const byBill = {};
    ledger.filter((e) => !['cancelled', 'rejected'].includes(e.status)).forEach((e) => e.allocations.forEach((a) => {
      byBill[a.billId] = (byBill[a.billId] ?? 0) + 1;
    }));
    expect(Object.values(byBill).every((count) => count === 1)).toBe(true);
  });

  it('counts a deduction as settled: it pays its bills and moves the balance', () => {
    const top = entry('paid', 500000, [], { id: 't1', invoice: { number: 't1', paidAt: '2026-09-01T09:00' } });
    const auto = { ...entry('deducted', 0, [{ billId: 'elec-oct', amount: 300000 }], { id: 'a1', type: 'autopay', period: '2026-10' }), date: '2026-10-01' };
    expect(balanceOf([top, auto]).available).toBe(200000);
    expect(billStatus(BILLS, [auto]).find((b) => b.id === 'elec-oct')).toMatchObject({ paid: 300000, remaining: 0 });
    const lines = historyLines([top, auto]);
    expect(lineBalances(lines)).toEqual({ 't1:in': 500000, 'a1:out': 200000 });
    expect(lines.find((l) => l.id === 'a1:out')).toMatchObject({ kind: 'deduction', source: 'auto', status: 'deducted', amount: 300000 });
  });
});

describe('history lines', () => {
  const topup = (id, paidAt, amount, allocated = 0, status = 'paid') =>
    entry(status, amount, allocated ? [{ billId: 'elec-oct', amount: allocated }] : [], { id, invoice: { number: id, paidAt } });
  const spend = (id, date, allocated, status = 'approved') => ({ ...entry(status, 0, [{ billId: 'water-oct', amount: allocated }], { id, type: 'allocate' }), date });

  it('splits a top up that pays bills into a Top up line and a Deduction line', () => {
    const lines = historyLines([topup('t1', '2026-10-01T09:00', 1000000, 300000)]);
    expect(lines.map((l) => [l.id, l.kind, l.source, l.status, l.amount])).toEqual([
      ['t1:in', 'topup', 'topup', 'paid', 1000000],
      ['t1:out', 'deduction', 'topup', 'deducted', 300000]
    ]);
  });

  it('gives a plain top up one line, and a manual payment one Deduction line', () => {
    const lines = historyLines([topup('t1', '2026-10-01T09:00', 500000), spend('s1', '2026-10-05', 200000)]);
    expect(lines.map((l) => [l.id, l.kind, l.source])).toEqual([['t1:in', 'topup', 'topup'], ['s1:out', 'deduction', 'manual']]);
  });

  it('marks the deduction of an unsent or unpaid top up as planned, and follows a cancelled one', () => {
    const lines = historyLines([
      topup('d1', undefined, 500000, 100000, 'draft'),
      topup('u1', undefined, 500000, 100000, 'unpaid'),
      topup('c1', undefined, 500000, 100000, 'cancelled'),
      spend('p1', '2026-10-06', 50000, 'pending')
    ]);
    expect(lines.filter((l) => l.kind === 'deduction').map((l) => [l.entry.id, l.status])).toEqual([
      ['d1', 'planned'], ['u1', 'planned'], ['c1', 'cancelled'], ['p1', 'pending']
    ]);
    expect(lines.filter(isWaiting).map((l) => l.id)).toEqual(['d1:in', 'd1:out', 'u1:in', 'u1:out', 'p1:out']);
  });

  it('keeps a running balance like a bank statement: the top up first, then what it paid', () => {
    const lines = historyLines([
      spend('s1', '2026-10-05', 200000),
      topup('t1', '2026-10-01T09:00', 1000000, 300000),
      topup('t2', '2026-10-10T09:00', 500000),
      topup('u1', undefined, 900000, 0, 'unpaid')
    ]);
    expect(lineBalances(lines)).toEqual({ 't1:in': 1000000, 't1:out': 700000, 's1:out': 500000, 't2:in': 1000000 });
  });

  it('works the balance out over the whole history, whatever order the lines come in', () => {
    const lines = historyLines([spend('s1', '2026-10-05', 400000), topup('t1', '2026-10-01T09:00', 1000000)]);
    expect(lineBalances(lines)).toEqual({ 't1:in': 1000000, 's1:out': 600000 });
  });

  it('adds up top ups, deductions, and what waits', () => {
    const lines = historyLines([
      topup('t1', '2026-10-01T09:00', 1000000, 300000),
      spend('s1', '2026-10-05', 200000),
      spend('s2', '2026-10-06', 999999, 'rejected'),
      topup('u1', undefined, 300000, 100000, 'unpaid')
    ]);
    expect(historySummary(lines)).toEqual({ toppedUp: 1000000, deducted: 500000, waiting: 2 });
  });

  it('groups by month, newest first, with a top up before the deduction it paid', () => {
    const lines = historyLines([
      topup('t1', '2026-08-12T10:00', 1, 1),
      spend('s1', '2026-10-05', 1),
      topup('t2', '2026-10-20T10:00', 1)
    ]);
    expect(groupByMonth(lines).map((g) => [g.label, g.lines.map((l) => l.id)])).toEqual([
      ['Oct 2026', ['t2:in', 's1:out']],
      ['Aug 2026', ['t1:out', 't1:in']]
    ]);
  });
});
