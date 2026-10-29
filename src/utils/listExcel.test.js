import { describe, it, expect } from 'vitest';
import { buildUnitWorkbook, buildInstallmentWorkbook } from './listExcel';
import { SEED_UNITS } from '../models/UnitModel';

describe('list exports are Excel workbooks', () => {
  it('exports units of one type with columns that fit the type', () => {
    const units = SEED_UNITS.filter((u) => u.category === 'non_unit');
    const ws = buildUnitWorkbook({ units, category: 'non_unit', exportedOn: '2026-10-29' }).worksheets[0];
    const headers = ws.getRow(5).values.filter(Boolean);
    expect(ws.getCell('A1').value).toBe('PROAPPS | NON-UNIT');
    expect(headers[0]).toBe('Unit Name');
    expect(headers).toContain('Tower or Area');
    expect(headers).not.toContain('NPP');
    expect(ws.rowCount).toBe(5 + units.length);
    expect(ws.getRow(6).getCell(1).value).toBe(units[0].code);
  });

  it('keeps bedrooms for residential units only', () => {
    const headers = (category) => buildUnitWorkbook({ units: [], category, exportedOn: 'x' }).worksheets[0].getRow(5).values.filter(Boolean);
    expect(headers('hunian')).toContain('Bedrooms');
    expect(headers('non_hunian')).not.toContain('Bedrooms');
  });

  it('exports installment amounts as numbers with a thousands format', () => {
    const plans = [{ unit: 'A0101', invoice: 'INV-1', createdBy: { name: 'Alex', email: 'a@x.io' }, createdLabel: '1 Nov 2026 09:00', start: '2026-11', months: 6, amount: 1200000, paid: 200000, status: 'Approved' }];
    const ws = buildInstallmentWorkbook({ plans, exportedOn: '2026-10-29' }).worksheets[0];
    const remaining = ws.getRow(6).getCell(10);
    expect(remaining.value).toBe(1000000);
    expect(remaining.numFmt).toBe('#,##0');
  });
});
