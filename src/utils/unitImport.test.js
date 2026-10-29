import { describe, it, expect } from 'vitest';
import { buildUnitImportTemplate, parseUnitImportFile } from './excelExport';
import { importRowsToUnits, SEED_UNITS } from '../models/UnitModel';

// A File-like object the parser can read in Node.
const fileFrom = (name, data) => ({
  name,
  size: data.byteLength ?? data.length,
  arrayBuffer: async () => data,
  text: async () => String(data)
});

async function templateFile(category, edit) {
  const wb = buildUnitImportTemplate(category);
  if (edit) edit(wb.worksheets[0]);
  return fileFrom(`unit-${category}.xlsx`, await wb.xlsx.writeBuffer());
}

describe('unit import', () => {
  it('reads the three sample rows of a downloaded template', async () => {
    const rows = await parseUnitImportFile(await templateFile('non_hunian'), 'non_hunian');
    expect(rows).toHaveLength(3);
    expect(rows[0].rowNumber).toBe(6);
    expect(rows[0].values.code).toBe('ATOKO1');
    expect(rows[0].values.floor).toBe('GF');
  });

  it('turns valid rows into units and reports bad rows with their row number', async () => {
    const file = await templateFile('hunian', (ws) => {
      ws.getRow(7).getCell(2).value = 'GF'; // Residential units sit on numbered floors only
      ws.getRow(8).getCell(4).value = '';   // Unit area is required
    });
    const rows = await parseUnitImportFile(file, 'hunian');
    const { units, errors } = importRowsToUnits(rows, 'hunian', []);
    expect(units.map((u) => u.code)).toEqual(['A0301']);
    expect(units[0].detail.bedrooms).toBe('2');
    expect(errors.map((e) => e.rowNumber)).toEqual([7, 8]);
    expect(errors[0].message).toMatch(/Floor "GF"/);
    expect(errors[1].message).toMatch(/Unit area is required/);
  });

  it('rejects a unit name that already exists, in the list or earlier in the file', async () => {
    const existing = SEED_UNITS.find((u) => u.category === 'hunian');
    const rows = [
      { rowNumber: 6, values: { tower: existing.tower, floor: '03', code: existing.code, area: '30', electricCapacity: '2200', waterMeterNo: '1', electricMeterNo: '2', waterMeterStart: '0', electricMeterStart: '0', npp: '0.2', bedrooms: '1', invoiceIpl: 'Yes', iplInterval: '1' } },
      { rowNumber: 7, values: { tower: 'Tower A', floor: '03', code: 'ZZ0301', area: '30', electricCapacity: '2200', waterMeterNo: '1', electricMeterNo: '2', waterMeterStart: '0', electricMeterStart: '0', npp: '0.2', bedrooms: '1', invoiceIpl: 'Yes', iplInterval: '1' } },
      { rowNumber: 8, values: { tower: 'tower a', floor: '04', code: 'zz0301', area: '30', electricCapacity: '2200', waterMeterNo: '1', electricMeterNo: '2', waterMeterStart: '0', electricMeterStart: '0', npp: '0.2', bedrooms: '1', invoiceIpl: 'Yes', iplInterval: '1' } }
    ];
    const { units, errors } = importRowsToUnits(rows, 'hunian', SEED_UNITS);
    expect(units.map((u) => u.code)).toEqual(['ZZ0301']);
    expect(errors.map((e) => e.rowNumber)).toEqual([6, 8]);
  });

  it('refuses the template of another unit type', async () => {
    await expect(parseUnitImportFile(await templateFile('non_unit'), 'hunian')).rejects.toThrow(/Non-Unit template/);
  });

  it('reads a CSV saved from the template', async () => {
    const csv = [
      'Tower or Area *,Floor *,Unit Name *,Unit Area (m²) *,Electric Capacity (VA) *,Water Meter No *,Electricity Meter No *,Initial Water Meter (m³) *,Initial Electricity Meter (kWh) *,Insert Electric Utility To Invoice,Insert Water Utility To Invoice,Insert IPL To Invoice,IPL Bill Interval (Month)',
      'Podium,GF,PKIOSK9,12,1300,20240399,31240399,0,0,Yes,No,No,'
    ].join('\n');
    const rows = await parseUnitImportFile(fileFrom('units.csv', csv), 'non_unit');
    const { units, errors } = importRowsToUnits(rows, 'non_unit', []);
    expect(errors).toEqual([]);
    expect(units[0]).toMatchObject({ code: 'PKIOSK9', category: 'non_unit', ownerName: 'P3SRS' });
    expect(units[0].detail.npp).toBeUndefined();
  });
});
