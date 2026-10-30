import ExcelJS from 'exceljs';
import { addListSheet } from './tenantMemberExcel';
import { getCategory, getStatusLabel, getOccupant, getOccupantName, describeOccupant, getFloorLabel } from '../models/UnitModel';

// List exports for Unit and Installment, laid out like the Tenant Member export.

const yesNo = (v) => (v === 'no' ? 'No' : v === 'yes' ? 'Yes' : '');

const unitSheet = (category) => {
  const type = getCategory(category);
  const isNonUnit = category === 'non_unit';
  return {
    name: type.short,
    noun: 'units',
    title: `PROAPPS | ${type.label.toUpperCase()}`,
    note: `VIEW ONLY | ${type.label} list from the Unit menu, with the filters applied at export time.`,
    groups: [
      { label: 'UNIT', columns: [
        ['Unit Name', 16, (u) => u.code],
        [isNonUnit ? 'Tower or Area' : 'Tower', 14, (u) => u.tower],
        ['Floor', 'fit', (u) => getFloorLabel(u.floor)]
      ] },
      { label: 'STATUS & OWNERSHIP', columns: [
        ['Status', 12, (u) => getStatusLabel(u.category, u.status), 'status'],
        ['Owner', 28, (u) => u.ownerName],
        ['Renter', 26, (u) => u.tenantName],
        ['Occupant', 26, (u) => getOccupantName(u)],
        ['Occupant Role', 'fit', (u) => describeOccupant(getOccupant(u))]
      ] },
      { label: 'UNIT DETAIL', columns: [
        ['Area (m²)', 11, (u) => u.detail?.area ?? '', 'number'],
        ['Electric Capacity (VA)', 20, (u) => u.detail?.electricCapacity ?? '', 'number'],
        ['Water Meter No', 18, (u) => u.detail?.waterMeterNo ?? '', 'text'],
        ['Electricity Meter No', 20, (u) => u.detail?.electricMeterNo ?? '', 'text'],
        ...(isNonUnit ? [] : [['NPP', 9, (u) => u.detail?.npp ?? '', 'number']]),
        ...(category === 'hunian' ? [['Bedrooms', 11, (u) => u.detail?.bedrooms ?? '', 'number']] : [])
      ] },
      { label: 'BILLING', columns: [
        ['Electric on Invoice', 18, (u) => yesNo(u.detail?.invoiceElectric)],
        ['Water on Invoice', 16, (u) => yesNo(u.detail?.invoiceWater)],
        ['IPL on Invoice', 14, (u) => yesNo(u.detail?.invoiceIpl)],
        ['IPL Interval (Month)', 18, (u) => (u.detail?.invoiceIpl === 'no' ? '' : u.detail?.iplInterval ?? ''), 'number']
      ] }
    ]
  };
};

export function buildUnitWorkbook({ units, category, exportedOn }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  addListSheet(workbook, unitSheet(category), units, exportedOn);
  return workbook;
}

const INSTALLMENT_SHEET = {
  name: 'Installments',
  noun: 'installment plans',
  title: 'PROAPPS | INSTALLMENT PLANS',
  note: 'VIEW ONLY | Installment plans from the Installment menu, with the filters applied at export time.',
  groups: [
    { label: 'PLAN', columns: [
      ['Unit', 14, (p) => p.unit],
      ['Invoice', 'fit', (p) => p.invoice, 'text']
    ] },
    { label: 'CREATED', columns: [
      ['Created By', 24, (p) => p.createdBy?.name ?? ''],
      ['Created Email', 30, (p) => p.createdBy?.email ?? ''],
      ['Created Date', 20, (p) => p.createdLabel, 'text']
    ] },
    { label: 'SCHEDULE', columns: [
      ['Start', 14, (p) => p.start, 'text'],
      ['Months', 10, (p) => p.months, 'number']
    ] },
    { label: 'AMOUNT (IDR)', columns: [
      ['Amount', 16, (p) => p.amount, 'money'],
      ['Paid', 16, (p) => p.paid, 'money'],
      ['Remaining', 16, (p) => p.amount - p.paid, 'money']
    ] },
    { label: 'STATUS', columns: [
      ['Status', 'fit', (p) => p.status, 'status']
    ] }
  ]
};

// `plans` carry a `createdLabel` with the date and time as the page shows them.
export function buildInstallmentWorkbook({ plans, exportedOn }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  addListSheet(workbook, INSTALLMENT_SHEET, plans, exportedOn);
  return workbook;
}

const DEPOSIT_SHEET = {
  name: 'Deposit Monthly',
  noun: 'units',
  title: 'PROAPPS | DEPOSIT MONTHLY',
  note: 'VIEW ONLY | Unit deposits from the Deposit Monthly menu, with the filters applied at export time.',
  groups: [
    { label: 'UNIT', columns: [
      ['Unit Name', 16, (d) => d.unitCode],
      ['Tower or Area', 14, (d) => d.tower]
    ] },
    { label: 'BILLED TO', columns: [
      ['Tenant', 28, (d) => d.tenantName],
      ['Role', 'fit', (d) => d.tenantRole]
    ] },
    { label: 'DEPOSIT (IDR)', columns: [
      ['Deposit Balance', 18, (d) => d.balance, 'money']
    ] }
  ]
};

const HISTORY_STATUS_LABELS = {
  draft: 'Draft', unpaid: 'Unpaid', paid: 'Paid', planned: 'Planned', pending: 'Awaiting approval',
  deducted: 'Deducted', rejected: 'Rejected', cancelled: 'Cancelled', active: 'Active'
};
const DEDUCTION_SOURCES = { topup: 'With top up', manual: 'Manual', auto: 'Auto' };

// One unit's deposit history, one row per line. `lines` carry `balanceAfter` (a number, or null when the
// line moved no money).
export function buildDepositHistoryWorkbook({ unitCode, tenantName, lines, exportedOn }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  const sheet = {
    name: `Deposit ${unitCode}`.slice(0, 31),
    noun: 'lines',
    title: `PROAPPS | DEPOSIT HISTORY ${unitCode}`,
    note: `VIEW ONLY | Deposit history of ${unitCode}, billed to ${tenantName}, with the filters applied at export time.`,
    groups: [
      { label: 'LINE', columns: [
        ['Date', 14, (l) => l.moment.slice(0, 10), 'text'],
        ['Type', 22, (l) => (l.kind === 'topup' ? 'Top up' : l.kind === 'rule' ? 'Auto deduction choices' : 'Deduction')],
        ['Source', 14, (l) => (l.kind === 'deduction' ? DEDUCTION_SOURCES[l.source] : '')],
        ['Invoice', 'fit', (l) => l.entry.invoice?.number ?? '', 'text']
      ] },
      { label: 'AMOUNT (IDR)', columns: [
        ['Amount', 16, (l) => (l.kind === 'rule' ? '' : l.kind === 'topup' ? l.amount : -l.amount), 'money'],
        ['Balance after', 16, (l) => l.balanceAfter ?? '', 'money']
      ] },
      { label: 'STATUS', columns: [
        ['Status', 'fit', (l) => HISTORY_STATUS_LABELS[l.status] ?? l.status, 'status'],
        ['Created By', 22, (l) => l.entry.createdBy],
        ['Note', 30, (l) => l.entry.note ?? '']
      ] }
    ]
  };
  addListSheet(workbook, sheet, lines, exportedOn);
  return workbook;
}

export function buildDepositWorkbook({ deposits, exportedOn }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  addListSheet(workbook, DEPOSIT_SHEET, deposits, exportedOn);
  return workbook;
}
