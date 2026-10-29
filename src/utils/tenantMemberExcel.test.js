import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { buildTenantMemberWorkbook } from './tenantMemberExcel';
import { RENTER_ROWS, MEMBER_ROWS, memberTypeLabel } from '../models/TenantMemberModel';

describe('member type label', () => {
  it('reads Renter, relation, or relation with (Proxy)', () => {
    expect(memberTypeLabel({ relation: 'Renter', isProxy: false })).toBe('Renter');
    expect(memberTypeLabel({ relation: 'Spouse', isProxy: true })).toBe('Spouse (Proxy)');
    expect(memberTypeLabel({ relation: 'Child', isProxy: false })).toBe('Child');
  });
});

describe('tenant member Excel export', () => {
  it('writes a Renter and a Members sheet in the Work Schedule layout', async () => {
    const workbook = buildTenantMemberWorkbook({ tenants: RENTER_ROWS, members: MEMBER_ROWS, exportedOn: '2026-10-29' });
    const restored = new ExcelJS.Workbook();
    await restored.xlsx.load(await workbook.xlsx.writeBuffer());

    expect(restored.worksheets.map((w) => w.name)).toEqual(['Renter', 'Members']);
    const renters = restored.getWorksheet('Renter');
    expect(renters.getCell('A1').value).toBe('PROAPPS | RENTER');
    expect(renters.getCell('A4').value).toBe('RENTER');
    expect(renters.getCell('A5').value).toBe('Name');
    expect(renters.getCell('B5').value).toBe('Member Type');
    expect(renters.getCell('A6').value).toBe(RENTER_ROWS[0].name);
    expect(renters.getCell('B6').value).toBe('Renter');
    expect(renters.rowCount).toBe(5 + RENTER_ROWS.length);

    const members = restored.getWorksheet('Members');
    expect(members.getCell('A6').value).toBe(MEMBER_ROWS[0].name);
    expect(members.getCell('B5').value).toBe('Member Type');
    expect(members.getCell('C6').value).toBe(`${MEMBER_ROWS[0].tenantName} (${MEMBER_ROWS[0].parentRole})`);
    expect(members.rowCount).toBe(5 + MEMBER_ROWS.length);
  });

  it('writes every banner, group and header in English', () => {
    const wb = buildTenantMemberWorkbook({ tenants: RENTER_ROWS, members: MEMBER_ROWS, exportedOn: '2026-10-29' });
    const indonesian = /\b(IDENTITAS|SEWA|AKSES|RELASI|Daftar|penyewa|bila|atau|ekspor|dari menu)\b/i;
    for (const sheet of wb.worksheets) {
      for (let r = 1; r <= 5; r++) {
        sheet.getRow(r).eachCell((cell) => expect(String(cell.value)).not.toMatch(indonesian));
      }
    }
  });

  it('does not carry a member count column on the Renter sheet', () => {
    const sheet = buildTenantMemberWorkbook({ tenants: RENTER_ROWS, members: MEMBER_ROWS, exportedOn: '2026-10-29' }).getWorksheet('Renter');
    const headers = sheet.getRow(5).values.slice(1);
    expect(headers).not.toContain('Members');
    expect(headers.slice(-2)).toEqual(['Status', 'Door Access']);
  });

  it('lists rent period, start rent and date out per unit on the Renter sheet', () => {
    const renter = {
      ...RENTER_ROWS[0],
      rentals: [
        { code: 'A1', period: 12, start: '2026-03-15', out: '15 Mar 2027' },
        { code: 'B2', period: 24, start: '2025-01-01', out: '01 Jan 2027' }
      ]
    };
    const sheet = buildTenantMemberWorkbook({ tenants: [renter], members: [], exportedOn: '2026-10-29' }).getWorksheet('Renter');
    const at = (header) => sheet.getCell(6, [...Array(sheet.columnCount)].findIndex((_, i) => sheet.getCell(5, i + 1).value === header) + 1).value;
    expect(at('Rent Period')).toBe('12 months, 24 months');
    expect(at('Start Rent')).toBe('15/03/2026, 01/01/2025');
    expect(at('Date Out')).toBe('15 Mar 2027, 01 Jan 2027');
  });

  it('lists the door access of a renter', () => {
    const renter = { ...RENTER_ROWS[0], doorAccess: ['Main lobby', 'Gym'] };
    const sheet = buildTenantMemberWorkbook({ tenants: [renter], members: [], exportedOn: '2026-10-29' }).getWorksheet('Renter');
    const col = [...Array(sheet.columnCount)].findIndex((_, i) => sheet.getCell(5, i + 1).value === 'Door Access') + 1;
    expect(col).toBeGreaterThan(0);
    expect(sheet.getCell(6, col).value).toBe('Main lobby, Gym');
  });

  it('sizes Door Access to its longest value', () => {
    const short = { ...RENTER_ROWS[0], doorAccess: ['Gym'] };
    const long = { ...RENTER_ROWS[1], doorAccess: ['Main lobby', 'Tower lobby', 'Passenger lift', 'Unit door', 'Basement parking', 'Gym', 'Swimming pool'] };
    const widthOf = (tenants) => {
      const sheet = buildTenantMemberWorkbook({ tenants, members: [], exportedOn: '2026-10-29' }).getWorksheet('Renter');
      const col = [...Array(sheet.columnCount)].findIndex((_, i) => sheet.getCell(5, i + 1).value === 'Door Access') + 1;
      return sheet.getColumn(col).width;
    };
    expect(widthOf([short])).toBeLessThan(widthOf([short, long]));
    expect(widthOf([short, long])).toBeGreaterThanOrEqual(long.doorAccess.join(', ').length);
  });

  it('keeps ID numbers as text so all 16 digits survive', async () => {
    const workbook = buildTenantMemberWorkbook({ tenants: RENTER_ROWS, members: [], exportedOn: '2026-10-29' });
    const sheet = workbook.getWorksheet('Renter');
    const col = [...Array(sheet.columnCount)].findIndex((_, i) => sheet.getCell(5, i + 1).value === 'ID Number') + 1;
    const cell = sheet.getCell(6, col);
    expect(cell.value).toBe(RENTER_ROWS[0].idNumber);
    expect(cell.numFmt).toBe('@');
  });
});
