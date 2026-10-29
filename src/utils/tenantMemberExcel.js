import ExcelJS from 'exceljs';
import { memberTypeLabel, unitOwnerOf } from '../models/TenantMemberModel';

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const STATUS_COLORS = { Active: 'FF166534', Pending: 'FF92400E', Rejected: 'FFB91C1C', Inactive: 'FF475569', Unoccupied: 'FF475569' };

// Group bands on row 4 alternate navy and sky, like the Work Schedule export.
const GROUP_FILLS = ['FF002B7F', 'FF0284C7'];

// Same shape as the Members sheet, so both read the same way: who, unit, identity, status and access.
const ddmmyyyy = (iso) => {
  const [y, m, d] = String(iso).split('-');
  return y ? `${d}/${m}/${y}` : '';
};

// A renter can rent several units; each rent column lists one value per unit, in the same order as Units.
const rentalsOf = (renter, pick) => (renter.rentals ?? []).map(pick).join(', ');

const TENANT_SHEET = {
  name: 'Renter',
  noun: 'renters',
  title: 'PROAPPS | RENTER',
  note: 'VIEW ONLY | List of renters. Member Type is always Renter; their members are on the Members sheet.',
  groups: [
    { label: 'RENTER', columns: [
      ['Name', 28, (r) => r.name],
      ['Member Type', 20, () => 'Renter', 'type'],
      ['Member of', 34, (r) => `${r.ownerName} (Owner)`]
    ] },
    { label: 'UNIT', columns: [
      ['Units', 20, (r) => r.unitCodes.join(', ')],
      ['Tower', 14, (r) => r.towers.join(', ')],
      ['Unit Owner', 28, (r) => r.ownerName]
    ] },
    { label: 'RENT', columns: [
      ['Rent Period', 'fit', (r) => rentalsOf(r, (x) => `${x.period} months`)],
      ['Start Rent', 'fit', (r) => rentalsOf(r, (x) => ddmmyyyy(x.start)), 'text'],
      ['Date Out', 'fit', (r) => rentalsOf(r, (x) => x.out), 'text']
    ] },
    { label: 'IDENTITY', columns: [
      ['Email', 32, (r) => r.email],
      ['ID Type', 12, (r) => r.idType],
      ['ID Number', 22, (r) => r.idNumber, 'text'],
      ['Phone Number', 18, (r) => r.phone, 'text']
    ] },
    { label: 'STATUS & ACCESS', columns: [
      ['Status', 14, (r) => r.status, 'status'],
      ['Door Access', 'fit', (r) => (r.doorAccess ?? []).join(', ')]
    ] }
  ]
};

// Who the member is comes first: their type and whose member they are, then the unit, then identity.
const MEMBER_SHEET = {
  name: 'Members',
  noun: 'members',
  title: 'PROAPPS | MEMBER (FAMILY/STAFF EMPLOYEE)',
  note: 'VIEW ONLY | Member Type is Renter, the relation (Spouse, Child, ...), or the relation + (Proxy) when the member lives in the unit on behalf of the owner.',
  groups: [
    { label: 'MEMBER', columns: [
      ['Name', 28, (r) => r.name],
      ['Member Type', 20, (r) => memberTypeLabel(r), 'type'],
      ['Member of', 34, (r) => `${r.tenantName} (${r.parentRole})`]
    ] },
    { label: 'UNIT', columns: [
      ['Unit', 12, (r) => r.unitCodes[0]],
      ['Tower', 12, (r) => r.towers[0]],
      ['Unit Owner', 28, (r) => unitOwnerOf(r)]
    ] },
    { label: 'IDENTITY', columns: [
      ['Email', 32, (r) => r.email],
      ['ID Type', 12, (r) => r.idType],
      ['ID Number', 22, (r) => r.idNumber, 'text'],
      ['Phone Number', 18, (r) => r.phone, 'text']
    ] },
    { label: 'STATUS & ACCESS', columns: [
      ['Status', 14, (r) => r.status, 'status'],
      ['Door Access', 'fit', (r) => (r.doorAccess ?? []).join(', ')]
    ] }
  ]
};

// 'fit' columns hug their content: as wide as the longest value, with room for the filter arrow on the header.
const FIT_MAX = 120;
function fitWidth(header, values) {
  const longest = Math.max(String(header).length + 4, ...values.map((v) => String(v ?? '').length));
  return Math.min(FIT_MAX, Math.ceil(longest * 1.1) + 3);
}

function addSheet(workbook, spec, rows, exportedOn) {
  const columns = spec.groups.flatMap((g) => g.columns);
  const sheet = workbook.addWorksheet(spec.name, {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 5, topLeftCell: 'B6', showGridLines: false }]
  });
  const lastColumn = columns.length;

  const bannerEnd = Math.min(6, lastColumn);
  sheet.mergeCells(1, 1, 1, bannerEnd);
  sheet.getCell('A1').value = spec.title;
  sheet.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  sheet.getRow(1).height = 28;
  sheet.mergeCells(2, 1, 2, bannerEnd);
  sheet.getCell('A2').value = `Exported ${exportedOn} | ${rows.length} ${spec.noun}`;
  sheet.getCell('A2').font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };
  sheet.mergeCells(3, 1, 3, bannerEnd);
  sheet.getCell('A3').value = spec.note ?? 'VIEW ONLY | Exported from the Tenant Member menu.';
  sheet.getCell('A3').font = { name: 'Calibri', size: 10, color: { argb: 'FF0369A1' } };

  // Row 4: group bands. Row 5: column headers in the band's color.
  let start = 1;
  const bandOf = [];
  spec.groups.forEach((group, index) => {
    const end = start + group.columns.length - 1;
    if (end > start) sheet.mergeCells(4, start, 4, end);
    sheet.getCell(4, start).value = group.label;
    for (let c = start; c <= end; c++) bandOf[c] = GROUP_FILLS[index % GROUP_FILLS.length];
    start = end + 1;
  });
  sheet.getRow(5).values = columns.map(([header]) => header);
  columns.forEach(([header, width, get], index) => {
    sheet.getColumn(index + 1).width = width === 'fit' ? fitWidth(header, rows.map((r) => get(r))) : width;
  });
  for (const rowNumber of [4, 5]) {
    sheet.getRow(rowNumber).height = 26;
    for (let column = 1; column <= lastColumn; column++) {
      const cell = sheet.getCell(rowNumber, column);
      cell.fill = fill(bandOf[column]);
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }
  }

  rows.forEach((record, index) => {
    const row = sheet.addRow(columns.map(([, , get]) => get(record) ?? ''));
    row.height = 24;
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      const kind = columns[column - 1][3];
      cell.font = {
        name: 'Calibri',
        size: 10,
        bold: kind === 'status' || kind === 'type',
        color: { argb: kind === 'status' ? (STATUS_COLORS[cell.value] ?? 'FF0F172A')
          : kind === 'type' ? (String(cell.value).includes('Proxy') ? 'FF0369A1' : 'FF1E3A8A')
            : 'FF0F172A' }
      };
      cell.fill = fill(index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC');
      cell.alignment = { vertical: 'middle', horizontal: kind === 'number' ? 'center' : 'left' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      // ID and phone numbers keep their leading zeros and all 16 digits.
      if (kind === 'text') cell.numFmt = '@';
    });
  });

  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: lastColumn } };
  return sheet;
}

// One workbook, two sheets: Renter and Members (family and staff employees).
export function buildTenantMemberWorkbook({ tenants, members, exportedOn }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  addSheet(workbook, TENANT_SHEET, tenants, exportedOn);
  addSheet(workbook, MEMBER_SHEET, members, exportedOn);
  return workbook;
}
