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
