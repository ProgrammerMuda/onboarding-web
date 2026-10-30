import { SEED_UNITS, TOWER_OPTIONS, NON_UNIT_AREAS } from './UnitModel';

// Deposit Monthly: money a unit leaves with Finance, kept as a ledger, and spent on that unit's bills.
// A top up is billed as an Other Invoice. It starts as a Draft that only Finance sees; the tenant gets it, and
// the 24-hour due time starts, when Finance sends it. The money only counts once that invoice is paid.
// The deposit pays this month's invoice and future ones only. An invoice left unpaid when the next one is issued
// rolls into that next invoice as an Outstanding line, so this month's invoice also carries every older debt.
// Next month onwards has no amount yet, so the unit keeps a standing choice of bill types: each time an invoice
// is issued, the balance pays those types, and whatever is left waits for the invoice after it.
// Paying bills from the balance waits for a second Finance user to approve it.
// When a monthly invoice is issued, the system deducts the unit's chosen bill types from the balance
// (an 'autopay' entry); it needs no approval because the tenant chose it in advance.

export const CURRENT_USER = 'Budi Hartono';
export const CURRENT_PERIOD = '2026-10';
// The next monthly invoice, the first one an auto deduction applies to.
export const NEXT_PERIOD = (() => {
  const [y, m] = CURRENT_PERIOD.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
})();

export const BALANCE_FILTERS = [
  { id: 'with', label: 'With balance' },
  { id: 'zero', label: 'Zero balance' }
];

export const DEPOSIT_AREAS = [...new Set([...TOWER_OPTIONS, ...NON_UNIT_AREAS])];

// The items an invoice can carry. Utilities come first because they can be cut off.
export const BILL_ITEMS = [
  { id: 'electricity', label: 'Electricity' },
  { id: 'water', label: 'Water' },
  { id: 'service_charge', label: 'Service Charge' },
  { id: 'sinking_fund', label: 'Sinking Fund' },
  { id: 'installment', label: 'Installment' },
  { id: 'other_cost', label: 'Other Cost' }
];

// An invoice left unpaid rolls into the next one as Outstanding, kept per item.
export const outstandingOf = (item) => `outstanding_${item}`;
export const isOutstanding = (category) => category.startsWith('outstanding_');
export const itemOf = (category) => category.replace(/^outstanding_/, '');

// Allocation order inside one invoice. Outstanding is the oldest debt, so it goes first (KUHPerdata Pasal 1399).
export const BILL_CATEGORIES = [
  ...BILL_ITEMS.map((i) => ({ id: outstandingOf(i.id), label: `Outstanding ${i.label}` })),
  ...BILL_ITEMS
];
const CATEGORY_RANK = Object.fromEntries(BILL_CATEGORIES.map((c, i) => [c.id, i]));
export const byCategoryRank = (a, b) => CATEGORY_RANK[a] - CATEGORY_RANK[b];

// An Other Invoice is due 24 hours after it is issued, to the minute: issued at 10:00, due tomorrow at 10:00.
export const INVOICE_DUE_HOURS = 24;

// Times are local wall-clock strings, 'YYYY-MM-DDTHH:mm', so they read the same wherever they are shown.
const pad2 = (n) => String(n).padStart(2, '0');

export function nowLocal(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function addHours(local, hours) {
  return nowLocal(new Date(new Date(local).getTime() + hours * 3600000));
}

// "2 hours 5 min", "45 min", "24 hours", "3 days": a span of time in words. Hours until two days, since
// an invoice lives for 24 hours and "1 day" would hide that.
export function timeSpanLabel(ms) {
  const minutes = Math.floor(Math.abs(ms) / 60000);
  if (minutes < 1) return 'less than a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 48) return `${hours} ${hours === 1 ? 'hour' : 'hours'}${rest ? ` ${rest} min` : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

// Who issues the invoice. Sample values until the property settings API is connected.
export const INVOICE_ISSUER = {
  name: 'Demo Apartemen',
  address: 'Jl. Melati Raya No. 25, RT 004/RW 007, Kel. Karet Semanggi, Kec. Setiabudi, Jakarta Selatan, DKI Jakarta 12930'
};

// 'overdue' is an unpaid invoice past its due time; otherwise the entry status.
export function invoiceStatus(entry, now) {
  if (entry.status === 'unpaid' && entry.invoice.dueAt < now) return 'overdue';
  return entry.status;
}

const ONES = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

function words(n) {
  if (n < 12) return ONES[n];
  if (n < 20) return `${words(n - 10)} Belas`;
  if (n < 100) return `${words(Math.floor(n / 10))} Puluh ${words(n % 10)}`;
  if (n < 200) return `Seratus ${words(n - 100)}`;
  if (n < 1000) return `${words(Math.floor(n / 100))} Ratus ${words(n % 100)}`;
  if (n < 2000) return `Seribu ${words(n - 1000)}`;
  const scales = [[1e12, 'Triliun'], [1e9, 'Miliar'], [1e6, 'Juta'], [1e3, 'Ribu']];
  const [size, name] = scales.find(([v]) => n >= v);
  return `${words(Math.floor(n / size))} ${name} ${words(n % size)}`;
}

// Amount in Indonesian words, as printed under an invoice total: 1000000 -> "Satu Juta Rupiah".
export function terbilang(amount) {
  const n = Math.floor(Number(amount) || 0);
  return `${n === 0 ? 'Nol' : words(n).replace(/\s+/g, ' ').trim()} Rupiah`;
}

// Other Invoice numbers run per month: INV/OTH/202610/0007.
export function invoiceNumber(iso, seq) {
  return `INV/OTH/${iso.slice(0, 4)}${iso.slice(5, 7)}/${String(seq).padStart(4, '0')}`;
}

export function nextInvoiceNumber(entries, iso) {
  const prefix = invoiceNumber(iso, 0).slice(0, -4);
  const last = entries
    .filter((e) => e.invoice?.number.startsWith(prefix))
    .reduce((max, e) => Math.max(max, Number(e.invoice.number.slice(prefix.length))), 0);
  return invoiceNumber(iso, last + 1);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function periodLabel(period) {
  const [y, m] = period.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export const categoryLabel = (id) => BILL_CATEGORIES[CATEGORY_RANK[id]].label;

export const formatRupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
export const formatDate = (iso) => {
  const [y, m, d] = String(iso ?? '').slice(0, 10).split('-');
  return y ? `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}` : '';
};
// "30 Oct 2026, 10:00"
export const formatDateTime = (local) => (local ? `${formatDate(local)}, ${String(local).slice(11, 16)}` : '');
export const parseAmount = (text) => Number(String(text ?? '').replace(/\D/g, '').slice(0, 13)) || 0;

// The billed party: the renter of a rented unit, otherwise the owner. P3SRS facilities without a renter have nobody.
export function billedParty(unit) {
  if (unit.status === 'rented' && unit.tenantName) return { name: unit.tenantName, role: 'Renter' };
  if (unit.category === 'non_unit') return null;
  return { name: unit.ownerName, role: 'Owner' };
}

// ---- Sample data until the billing and deposit APIs are connected ----

const round100 = (n) => Math.round(n / 100) * 100;

function bill(unit, category, period, amount, extra = {}) {
  const [y, m] = period.split('-');
  return {
    id: `${unit.id}:${category}:${period}`,
    unitId: unit.id,
    category,
    period,
    label: `${BILL_CATEGORIES[CATEGORY_RANK[category]].label} ${periodLabel(period)}`,
    dueDate: `${y}-${m}-20`,
    amount,
    ...extra
  };
}

// Not every unit has every item: facilities have no water or sinking fund, and only some units pay
// an installment or an other cost.
function monthlyBills(unit, n, period) {
  const facility = unit.category === 'non_unit';
  return [
    bill(unit, 'electricity', period, round100(250000 + ((n * 131071) % 600000))),
    !facility && bill(unit, 'water', period, round100(80000 + ((n * 5303) % 150000))),
    bill(unit, 'service_charge', period, 450000 + (n % 5) * 50000),
    !facility && bill(unit, 'sinking_fund', period, 150000 + (n % 3) * 25000),
    n % 5 === 0 && bill(unit, 'installment', period, 500000, { detail: 'Installment plan, 6 months' }),
    n % 6 === 0 && bill(unit, 'other_cost', period, 75000, { detail: 'Parking card replacement' })
  ].filter(Boolean);
}

// The Outstanding lines of an invoice: what is still unpaid on the invoices before it, one line per item.
export function outstandingLines(unit, period, unpaid) {
  const byItem = groupBy(unpaid.filter((b) => b.amount > 0), (b) => itemOf(b.category));
  return BILL_ITEMS.filter((item) => byItem[item.id]).map((item) => {
    const list = byItem[item.id];
    const from = [...new Set(list.map((b) => b.period))].sort().map(periodLabel);
    return bill(unit, outstandingOf(item.id), period, list.reduce((sum, b) => sum + b.amount, 0), {
      detail: `From the ${from.join(' and ')} ${from.length === 1 ? 'invoice' : 'invoices'}`
    });
  });
}

export function buildBills(units = SEED_UNITS) {
  const bills = [];
  units.forEach((unit, i) => {
    if (!billedParty(unit)) return;
    const n = i + 1;
    bills.push(...monthlyBills(unit, n, '2026-08'));
    // Some units left September (and a few July service charge) unpaid, so October carries it as Outstanding.
    const unpaid = [
      ...(n % 7 === 0 ? [bill(unit, 'service_charge', '2026-07', 550000)] : []),
      ...(n % 4 === 0 ? monthlyBills(unit, n, '2026-09') : [])
    ];
    bills.push(...outstandingLines(unit, CURRENT_PERIOD, unpaid));
    bills.push(...monthlyBills(unit, n, CURRENT_PERIOD));
  });
  return bills;
}

export function buildLedger(units = SEED_UNITS, bills = buildBills(units)) {
  const byUnit = groupBy(bills, (b) => b.unitId);
  const entries = [];
  units.forEach((unit, i) => {
    const n = i + 1;
    const august = (byUnit[unit.id] ?? []).filter((b) => b.period === '2026-08');
    if (unit.code === 'A0103' && august.length > 0) {
      const october = (byUnit[unit.id] ?? []).filter((b) => b.period === CURRENT_PERIOD);
      const paidInOctober = october.filter((b) => ['water', 'service_charge'].includes(b.category));
      entries.push({
        id: 'seed-a0103-topup',
        unitId: unit.id,
        type: 'topup',
        date: '2026-08-12',
        amount: 2500000,
        note: '',
        allocations: august.map((b) => ({ billId: b.id, amount: b.amount })),
        status: 'paid',
        createdBy: 'Rina Kartika',
        invoice: {
          number: invoiceNumber('2026-08-12', n),
          issuedAt: '2026-08-12T10:00',
          dueAt: '2026-08-13T10:00',
          paidAt: '2026-08-12T15:30',
          proofName: 'transfer-A0103-aug.pdf'
        }
      });
      entries.push({
        id: 'seed-a0103-deduction',
        unitId: unit.id,
        type: 'allocate',
        date: '2026-10-14',
        createdAt: '2026-10-14T09:00',
        amount: 0,
        note: 'Payment for October water and service charge',
        allocations: paidInOctober.map((b) => ({ billId: b.id, amount: b.amount })),
        status: 'approved',
        createdBy: 'Rina Kartika',
        decidedBy: CURRENT_USER,
        decidedAt: '2026-10-14T10:00'
      });
      entries.push({
        id: 'seed-a0103-november-topup',
        unitId: unit.id,
        type: 'topup',
        date: '2026-10-20',
        amount: 1000000,
        note: 'Deposit for November monthly charges',
        allocations: [],
        autoPay: BILL_ITEMS.map((item) => item.id),
        status: 'paid',
        createdBy: 'Rina Kartika',
        invoice: {
          number: invoiceNumber('2026-10-20', 3),
          issuedAt: '2026-10-20T09:00',
          dueAt: '2026-10-21T09:00',
          paidAt: '2026-10-20T14:00',
          proofName: 'transfer-A0103-nov.pdf'
        }
      });
      entries.push({
        id: 'seed-a0103-extra-topup',
        unitId: unit.id,
        type: 'topup',
        date: '2026-10-28',
        amount: 500000,
        note: 'Additional deposit for November',
        allocations: [],
        autoPay: BILL_ITEMS.map((item) => item.id),
        status: 'paid',
        createdBy: 'Rina Kartika',
        invoice: {
          number: invoiceNumber('2026-10-28', 4),
          issuedAt: '2026-10-28T09:00',
          dueAt: '2026-10-29T09:00',
          paidAt: '2026-10-28T11:00',
          proofName: 'transfer-A0103-extra.pdf'
        }
      });
      entries.push({
        id: 'seed-a0103-water-topup',
        unitId: unit.id,
        type: 'topup',
        date: '2026-10-29',
        amount: 400000,
        note: 'Additional deposit, Water only from November',
        allocations: [],
        autoPay: ['water'],
        status: 'paid',
        createdBy: 'Rina Kartika',
        invoice: {
          number: invoiceNumber('2026-10-29', 5),
          issuedAt: '2026-10-29T09:00',
          dueAt: '2026-10-30T09:00',
          paidAt: '2026-10-29T13:00',
          proofName: 'transfer-A0103-water.pdf'
        }
      });
      return;
    }
    if (august.length === 0 || n % 3 === 0) return;
    const october = (byUnit[unit.id] ?? []).filter((b) => b.period === CURRENT_PERIOD);
    // A third of the units asked for utilities and service charge to be paid from the deposit every month.
    const autoPay = n % 3 === 1 ? ['electricity', 'water', 'service_charge'].filter((c) => august.some((b) => b.category === c)) : null;
    // Of those, the ones that paid September on time topped up enough in August for the October deduction.
    // Every unit still ends at a zero balance.
    const deducted = autoPay && n % 4 !== 0 ? october.filter((b) => autoPay.includes(b.category)) : [];
    const allocations = august.map((b) => ({ billId: b.id, amount: b.amount }));
    const spent = allocations.reduce((s, a) => s + a.amount, 0) + deducted.reduce((s, b) => s + b.amount, 0);
    entries.push({
      id: `seed-${n}`,
      unitId: unit.id,
      type: 'topup',
      date: '2026-08-12',
      amount: spent,
      note: '',
      allocations,
      ...(autoPay ? { autoPay } : {}),
      status: 'paid',
      createdBy: 'Rina Kartika',
      invoice: { number: invoiceNumber('2026-08-12', n), issuedAt: '2026-08-12T10:00', dueAt: '2026-08-13T10:00', paidAt: '2026-08-12T15:30', proofName: `transfer-${unit.code}-aug.pdf` }
    });
    if (deducted.length > 0) {
      entries.push({
        id: `seed-auto-${n}`,
        unitId: unit.id,
        type: 'autopay',
        date: '2026-10-01',
        // Deducted the moment the October invoice was issued.
        deductedAt: '2026-10-01T00:05',
        period: CURRENT_PERIOD,
        amount: 0,
        note: '',
        allocations: deducted.map((b) => ({ billId: b.id, amount: b.amount })),
        status: 'deducted',
        createdBy: 'System'
      });
    }
    // A few drafts nobody has sent to the tenant yet.
    if (n % 10 === 3) {
      entries.push({
        id: `seed-draft-${n}`,
        unitId: unit.id,
        type: 'topup',
        date: '2026-10-30',
        amount: 750000,
        note: '',
        allocations: [],
        status: 'draft',
        createdBy: 'Rina Kartika',
        invoice: { number: invoiceNumber('2026-10-30', n), createdAt: '2026-10-30T08:45' }
      });
    }
    // A few top up invoices that are not paid yet.
    if (n % 10 === 1) {
      entries.push({
        id: `seed-unpaid-${n}`,
        unitId: unit.id,
        type: 'topup',
        date: '2026-10-29',
        amount: 1000000,
        note: 'Requested by the owner at the front desk.',
        // Water, unless the October deduction already paid it.
        allocations: october.filter((b) => b.category === 'water' && !deducted.includes(b)).map((b) => ({ billId: b.id, amount: b.amount })),
        status: 'unpaid',
        createdBy: 'Rina Kartika',
        invoice: { number: invoiceNumber('2026-10-29', n), issuedAt: '2026-10-29T16:00', dueAt: '2026-10-30T16:00' }
      });
    }
  });
  return entries;
}

function groupBy(list, key) {
  const out = {};
  list.forEach((x) => { (out[key(x)] ??= []).push(x); });
  return out;
}

// ---- Ledger math ----

const allocatedOf = (entry) => entry.allocations.reduce((s, a) => s + a.amount, 0);
// What an entry does to the balance: money in minus what it spends on bills.
export const netOf = (entry) => entry.amount - allocatedOf(entry);

// Settled entries have moved money: a paid top up invoice, an approved payment from the balance.
// Open ones still wait: an unpaid invoice, a payment waiting for approval. The rest (cancelled, rejected) count for nothing.
const SETTLED = new Set(['paid', 'approved', 'deducted', 'active']);
// A draft is open too: it already holds the bills and balance it plans to use, so nothing else can take them.
const OPEN = new Set(['draft', 'unpaid', 'pending']);
export const isOpen = (entry) => OPEN.has(entry.status);

// available: settled money not yet spent. incoming: top up invoices not paid yet.
// spendable: available minus what open entries already plan to take from it.
export function balanceOf(entries) {
  let available = 0;
  let incoming = 0;
  let reserved = 0;
  entries.forEach((e) => {
    if (SETTLED.has(e.status)) available += netOf(e);
    if (OPEN.has(e.status)) {
      // A draft has not been sent, so its money is not expected yet.
      if (e.status !== 'draft') incoming += e.amount;
      if (netOf(e) < 0) reserved += -netOf(e);
    }
  });
  return { available, incoming, spendable: Math.max(0, available - reserved) };
}

// Bills of one unit with what is paid, what pending entries plan to pay, and what is left to allocate.
export function billStatus(bills, entries) {
  const paid = {};
  const planned = {};
  entries.forEach((e) => {
    if (!SETTLED.has(e.status) && !OPEN.has(e.status)) return;
    const bucket = SETTLED.has(e.status) ? paid : planned;
    e.allocations.forEach((a) => { bucket[a.billId] = (bucket[a.billId] ?? 0) + a.amount; });
  });
  return bills.map((b) => {
    const p = paid[b.id] ?? 0;
    const q = planned[b.id] ?? 0;
    return { ...b, paid: p, planned: q, remaining: Math.max(0, b.amount - p - q) };
  });
}

export const byPriority = (a, b) => a.period.localeCompare(b.period) || CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category];

// Bills the deposit can pay now: this month's invoice, with something left to allocate.
export function openBills(bills, entries) {
  return billStatus(bills, entries).filter((b) => b.remaining > 0 && b.period === CURRENT_PERIOD).sort(byPriority);
}

// What next month onwards can be set to pay: the monthly charges, the same for every unit. Outstanding is
// left out; it is paid through this month's invoice. A unit not billed for an item simply has nothing to pay there.
export const AUTO_PAY_ITEMS = BILL_ITEMS.map((i) => i.id);

const latestFirst = (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id);

// Paid top ups add their selected bill types to the unit's standing choice. A settings
// change replaces that choice. Open top ups wait for payment before their choices apply.
export function autoPayRule(entries) {
  const choosing = entries.filter((e) => Array.isArray(e.autoPay));
  const settled = choosing.filter((e) => SETTLED.has(e.status)).sort((a, b) => -latestFirst(a, b));
  let categories = [];
  settled.forEach((e) => {
    categories = e.type === 'topup'
      ? [...new Set([...categories, ...e.autoPay])].sort(byCategoryRank)
      : [...e.autoPay];
  });
  const newestSettled = settled.at(-1);
  const pendingEntry = choosing
    .filter((e) => OPEN.has(e.status) && (!newestSettled || latestFirst(e, newestSettled) < 0))
    .sort(latestFirst)[0];
  const pending = pendingEntry
    ? pendingEntry.type === 'topup'
      ? [...new Set([...categories, ...pendingEntry.autoPay])].sort(byCategoryRank)
      : pendingEntry.autoPay
    : null;
  return { categories, pending };
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
export const autoPayChanged = (draft, current) => Array.isArray(draft.autoPay) && !sameSet(draft.autoPay, current);

export const EMPTY_TOPUP_DRAFT = {
  amount: 0,
  note: '',
  allocations: {},
  // Bill types for next month onwards; null keeps the unit's current choice
  autoPay: null
};

// The chosen bills are paid in `bills` order (Outstanding first) for as long as the money lasts:
// the top up plus the free balance. What the money does not cover stays unpaid on the invoice,
// so the balance never goes below zero.
export function draftTotals(draft, spendable, bills = []) {
  const budget = draft.amount + spendable;
  const order = bills.length ? bills.map((b) => b.id) : Object.keys(draft.allocations);
  let left = budget;
  const allocations = {};
  order.forEach((id) => {
    const asked = draft.allocations[id] || 0;
    if (asked <= 0) return;
    allocations[id] = Math.min(asked, left);
    left -= allocations[id];
  });
  const requested = Object.values(draft.allocations).reduce((s, v) => s + (v || 0), 0);
  const allocated = budget - left;
  return {
    allocations,
    requested,
    allocated,
    short: requested - allocated,
    // Money not yet given to any bill. Next month onwards only has something to work with while this is above zero.
    unallocated: Math.max(0, budget - requested),
    budget,
    toBalance: draft.amount - allocated
  };
}

// Fills bills in `bills` order (Outstanding first) until the budget runs out.
export function autoAllocate(bills, budget) {
  let left = budget;
  const out = {};
  bills.forEach((b) => {
    if (left <= 0) return;
    out[b.id] = Math.min(b.remaining, left);
    left -= out[b.id];
  });
  return out;
}

// Problems keyed by field; empty when the draft can be sent. `mode` is 'topup' or 'allocate'.
export function draftProblems(draft, { mode, bills, spendable, currentAutoPay = [] }) {
  const problems = {};
  const { allocated, requested } = draftTotals(draft, spendable, bills);
  if (mode === 'topup' && draft.amount <= 0) problems.amount = 'Enter the top up amount.';
  bills.forEach((b) => {
    if ((draft.allocations[b.id] ?? 0) > b.remaining) problems[b.id] = `More than the ${formatRupiah(b.remaining)} left on this bill.`;
  });
  if (mode === 'allocate' && allocated <= 0 && !autoPayChanged(draft, currentAutoPay)) {
    problems.total = requested > 0
      ? 'There is no free balance to pay these bills.'
      : 'Choose a bill to pay this month, or change what next month pays.';
  }
  if (mode === 'manage' && !autoPayChanged(draft, currentAutoPay)) problems.autoPay = 'Change at least one bill type.';
  return problems;
}

// A top up becomes a Draft Other Invoice, not yet sent; a payment from the balance waits for approval.
export function buildEntry(draft, { id, unitId, mode, now, invoiceNo, currentAutoPay = [], bills = [], spendable = 0 }) {
  const isTopUp = mode === 'topup';
  const isManage = mode === 'manage';
  const { allocations } = isManage ? { allocations: {} } : draftTotals(draft, spendable, bills);
  return {
    id,
    unitId,
    type: isManage ? 'rule' : mode,
    date: now.slice(0, 10),
    createdAt: now,
    amount: isTopUp ? draft.amount : 0,
    note: draft.note.trim(),
    allocations: Object.entries(allocations)
      .filter(([, amount]) => amount > 0)
      .map(([billId, amount]) => ({ billId, amount })),
    ...((isTopUp && Array.isArray(draft.autoPay)) || autoPayChanged(draft, currentAutoPay)
      ? { autoPay: [...draft.autoPay].sort(byCategoryRank) }
      : {}),
    status: isTopUp ? 'draft' : isManage ? 'active' : 'pending',
    createdBy: CURRENT_USER,
    ...(isTopUp ? { invoice: { number: invoiceNo, createdAt: now } } : {})
  };
}

// The form values that make up a draft, to edit it again.
export function draftFromEntry(entry, fallbackAutoPay = []) {
  return {
    amount: entry.amount,
    note: entry.note,
    allocations: Object.fromEntries(entry.allocations.map((a) => [a.billId, a.amount])),
    autoPay: entry.autoPay ?? fallbackAutoPay
  };
}

// Editing keeps the draft's number, author, and creation time; only what the form holds changes.
export function editDraft(existing, draft, options) {
  const rebuilt = buildEntry(draft, {
    ...options,
    id: existing.id,
    unitId: existing.unitId,
    mode: 'topup',
    now: existing.invoice.createdAt,
    invoiceNo: existing.invoice.number
  });
  return { ...rebuilt, createdBy: existing.createdBy };
}

// Sending hands the invoice to the tenant. The 24-hour due time starts now, and it can no longer be edited.
export function sendInvoice(entries, id, now) {
  return entries.map((e) => (e.id === id && e.status === 'draft'
    ? { ...e, status: 'unpaid', invoice: { ...e.invoice, issuedAt: now, dueAt: addHours(now, INVOICE_DUE_HOURS), sentBy: CURRENT_USER } }
    : e));
}

export const PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// Why a payment proof file cannot be used, or '' when it can.
export function proofFileError(file) {
  if (!PROOF_TYPES.includes(file.type)) return 'Use a PDF, JPG, or PNG file.';
  if (file.size > PROOF_MAX_BYTES) return 'The file is larger than 5 MB.';
  return '';
}

export function markInvoicePaid(entries, id, now, proofName) {
  return entries.map((e) => (e.id === id ? { ...e, status: 'paid', invoice: { ...e.invoice, paidAt: now, proofName } } : e));
}

export function cancelInvoice(entries, id, reason) {
  return entries.map((e) => (e.id === id ? { ...e, status: 'cancelled', cancelReason: reason, decidedBy: CURRENT_USER } : e));
}

// Approve or reject a payment from the balance.
export function decideEntry(entries, id, decision, reason = '', now = nowLocal()) {
  return entries.map((e) => (e.id === id
    ? { ...e, status: decision, decidedBy: CURRENT_USER, decidedAt: now, ...(decision === 'rejected' ? { rejectReason: reason } : {}) }
    : e));
}

// ---- History ----
// The history shows lines, not entries. Money in and money out are always separate lines: a top up that also
// pays bills becomes a Top up line and a Deduction line. Deductions look the same wherever they come from:
// with a top up, from the balance by hand, or automatically when the monthly invoice is issued.

// A deduction's status follows its entry: done once the entry settles, planned while a top up waits.
function deductionStatus(entry) {
  if (SETTLED.has(entry.status)) return 'deducted';
  if (entry.status === 'draft' || entry.status === 'unpaid') return 'planned';
  return entry.status;
}

// When an entry counts: the moment money moved (a top up paid, a deduction made or approved), or while it
// waits, the moment it was last touched.
export function entryMoment(e) {
  return e.invoice?.paidAt ?? e.deductedAt ?? e.decidedAt ?? e.invoice?.issuedAt ?? e.invoice?.createdAt ?? e.createdAt ?? `${e.date}T00:00`;
}

// lines: [{ id, entry, kind: 'topup' | 'deduction', source: 'topup' | 'manual' | 'auto', status, amount, moment, order }]
// `order` puts a top up before the deduction it pays, when both happen at the same moment.
export function historyLines(entries) {
  const lines = [];
  entries.forEach((entry) => {
    const moment = entryMoment(entry);
    const allocated = allocatedOf(entry);
    if (entry.type === 'rule') {
      lines.push({ id: `${entry.id}:rule`, entry, kind: 'rule', source: 'manual', status: entry.status, amount: 0, moment, order: 0 });
    }
    if (entry.type === 'topup') {
      lines.push({ id: `${entry.id}:in`, entry, kind: 'topup', source: 'topup', status: entry.status, amount: entry.amount, moment, order: 0 });
    }
    if (allocated > 0) {
      lines.push({
        id: `${entry.id}:out`,
        entry,
        kind: 'deduction',
        source: { topup: 'topup', allocate: 'manual', autopay: 'auto' }[entry.type],
        status: deductionStatus(entry),
        amount: allocated,
        moment,
        order: 1
      });
    }
  });
  return lines;
}

const LINE_SETTLED = new Set(['paid', 'deducted']);
const LINE_WAITING = new Set(['draft', 'unpaid', 'planned', 'pending']);
// Waiting lines have not moved money yet: an invoice not sent or not paid, a deduction planned or awaiting approval.
export const isWaiting = (line) => LINE_WAITING.has(line.status);

// The balance after each line that moved money, oldest first, as in a bank statement. Worked out over the
// whole history, so a filter never changes a figure.
export function lineBalances(lines) {
  const out = {};
  let running = 0;
  lines
    .filter((l) => LINE_SETTLED.has(l.status) && l.kind !== 'rule')
    .sort((a, b) => a.moment.localeCompare(b.moment) || a.entry.id.localeCompare(b.entry.id) || a.order - b.order)
    .forEach((l) => {
      running += l.kind === 'topup' ? l.amount : -l.amount;
      out[l.id] = running;
    });
  return out;
}

// Money topped up, money deducted for bills, and how many lines wait.
export function historySummary(lines) {
  const moved = lines.filter((l) => LINE_SETTLED.has(l.status));
  return {
    toppedUp: moved.filter((l) => l.kind === 'topup').reduce((s, l) => s + l.amount, 0),
    deducted: moved.filter((l) => l.kind === 'deduction').reduce((s, l) => s + l.amount, 0),
    waiting: lines.filter(isWaiting).length
  };
}

// Newest first, in one block per month: [{ period: '2026-10', label: 'Oct 2026', lines: [...] }].
export function groupByMonth(lines) {
  const sorted = [...lines].sort((a, b) => b.moment.localeCompare(a.moment) || b.entry.id.localeCompare(a.entry.id) || b.order - a.order);
  const groups = [];
  sorted.forEach((l) => {
    const period = l.moment.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.period === period) last.lines.push(l);
    else groups.push({ period, label: periodLabel(period), lines: [l] });
  });
  return groups;
}


// ---- List rows ----

const sampleEmail = (name) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@mail.com`;
const samplePhone = (i) => `0812${String(10000000 + ((i * 7919) % 89999999)).slice(0, 8)}`;

export function buildDepositRows(units, entries) {
  const byUnit = groupBy(entries, (e) => e.unitId);
  return units.map((unit, i) => {
    const party = billedParty(unit);
    const unitEntries = byUnit[unit.id] ?? [];
    return {
      id: unit.id,
      unitCode: unit.code,
      tower: unit.tower,
      tenantName: party?.name ?? '',
      tenantRole: party?.role ?? '',
      tenantEmail: party ? sampleEmail(party.name) : '',
      tenantPhone: party ? samplePhone(i) : '',
      balance: balanceOf(unitEntries).available,
      unpaidInvoices: unitEntries.filter((e) => e.status === 'unpaid').length,
      draftInvoices: unitEntries.filter((e) => e.status === 'draft').length,
      pendingApprovals: unitEntries.filter((e) => e.status === 'pending').length
    };
  });
}

export function getDepositStats(rows) {
  const withBalance = rows.filter((r) => r.balance > 0);
  return {
    totalBalance: withBalance.reduce((sum, r) => sum + r.balance, 0),
    unitsWithDeposit: withBalance.length,
    unitsWithoutDeposit: rows.length - withBalance.length,
    unpaidInvoices: rows.reduce((sum, r) => sum + r.unpaidInvoices, 0)
  };
}

export function getAreaOptions(rows) {
  const present = new Set(rows.map((r) => r.tower));
  return DEPOSIT_AREAS.filter((a) => present.has(a));
}

export function filterDeposits(rows, { query = '', tower = '', balance = '' }) {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (tower && r.tower !== tower) return false;
    if (balance === 'with' && r.balance <= 0) return false;
    if (balance === 'zero' && r.balance > 0) return false;
    if (!q) return true;
    return r.unitCode.toLowerCase().includes(q) || r.tenantName.toLowerCase().includes(q);
  });
}
