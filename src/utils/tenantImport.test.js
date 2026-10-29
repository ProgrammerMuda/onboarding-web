import { describe, it, expect } from 'vitest';
import { buildTenantImportTemplate, buildTenantUnitImportTemplate, parseTenantImportFile, parseTenantUnitImportFile } from './excelExport';
import { importRowsToTenants, importRowsToTenantUnits, MOCK_TENANTS } from '../models/TenantModel';

const fileFrom = (name, data) => ({ name, size: data.byteLength ?? data.length, arrayBuffer: async () => data, text: async () => String(data) });
const xlsx = async (wb, edit) => {
  if (edit) edit(wb.worksheets[0]);
  return fileFrom('t.xlsx', await wb.xlsx.writeBuffer());
};

describe('tenant import', () => {
  it('imports the sample tenants of a fresh template', async () => {
    const rows = await parseTenantImportFile(await xlsx(buildTenantImportTemplate()));
    const { tenants, errors } = importRowsToTenants(rows, MOCK_TENANTS);
    expect(errors).toEqual([]);
    expect(tenants.map((t) => t.name)).toEqual(['Rina Kusumawati', 'Bayu Aditya', 'Kenji Tanaka']);
    expect(tenants[0].id).toBe(101);
    expect(tenants[0].emergencyContact.relationship).toBe('Spouse');
  });

  it('reports each bad row with its row number', async () => {
    const file = await xlsx(buildTenantImportTemplate(), (ws) => {
      ws.getRow(7).getCell(4).value = '12345';              // NIK too short
      ws.getRow(8).getCell(2).value = MOCK_TENANTS[0].email; // email taken
    });
    const { tenants, errors } = importRowsToTenants(await parseTenantImportFile(file), MOCK_TENANTS);
    expect(tenants).toHaveLength(1);
    expect(errors).toEqual([
      { rowNumber: 7, message: 'NIK must be exactly 16 digits.' },
      { rowNumber: 8, message: `Email ${MOCK_TENANTS[0].email} is already used by another tenant.` }
    ]);
  });

  it('rejects the same email twice in one file', () => {
    const row = (n) => ({ rowNumber: n, values: { name: 'A', email: 'same@x.io', phone: '081234567890', nik: `31710000000000${n}` } });
    const { tenants, errors } = importRowsToTenants([row(10), row(11)], []);
    expect(tenants).toHaveLength(1);
    expect(errors[0].rowNumber).toBe(11);
  });

  it('refuses the Tenant Unit template in Import Tenant', async () => {
    await expect(parseTenantImportFile(await xlsx(buildTenantUnitImportTemplate()))).rejects.toThrow(/Tenant Unit template/);
  });
});

describe('tenant unit import', () => {
  const tenants = [
    { id: 1, name: 'Rina', email: 'rina@x.io', units: [] },
    { id: 2, name: 'Bayu', email: 'bayu@x.io', units: [] },
    { id: 3, name: 'Owner B', email: 'ob@x.io', units: [{ role: 'OWNER', code: 'B0712', tower: 'Tower B' }] }
  ];
  const known = [{ code: 'A0301', tower: 'Tower A' }, { code: 'B0712', tower: 'Tower B' }];
  const row = (rowNumber, values) => ({ rowNumber, values });

  it('assigns units and computes the end of rent for a renter', () => {
    const { assignments, errors } = importRowsToTenantUnits([
      row(6, { email: 'rina@x.io', unitCode: 'a0301', role: 'Owner', entryDate: '01/11/2026' }),
      row(7, { email: 'BAYU@x.io', unitCode: 'A0301', role: 'Renter', entryDate: '01/11/2026', rentPeriod: '12', startRent: '01/11/2026' })
    ], tenants, known);
    expect(errors).toEqual([]);
    expect(assignments[0]).toEqual({ tenantId: 1, unit: { role: 'OWNER', code: 'A0301', tower: 'Tower A', handoverDate: '1 Nov 2026', status: 'Occupant' } });
    expect(assignments[1].unit).toMatchObject({ role: 'RENTER', rentalPeriod: 12, endRentDate: '1 Nov 2027' });
  });

  it('explains every rule it enforces', () => {
    const { assignments, errors } = importRowsToTenantUnits([
      row(6, { email: 'nobody@x.io', unitCode: 'A0301', role: 'Owner', entryDate: '01/11/2026' }),
      row(7, { email: 'rina@x.io', unitCode: 'Z9999', role: 'Owner', entryDate: '01/11/2026' }),
      row(8, { email: 'rina@x.io', unitCode: 'B0712', role: 'Owner', entryDate: '01/11/2026' }),
      row(9, { email: 'rina@x.io', unitCode: 'A0301', role: 'Proxy', entryDate: '01/11/2026' }),
      row(10, { email: 'bayu@x.io', unitCode: 'A0301', role: 'Renter', entryDate: '31/02/2026' }),
      row(11, { email: 'bayu@x.io', unitCode: 'A0301', role: 'Renter', entryDate: '01/11/2026', rentPeriod: '200', startRent: '01/11/2026' })
    ], tenants, known);
    expect(assignments).toEqual([]);
    expect(errors.map((e) => e.message)).toEqual([
      'No tenant has the email nobody@x.io. Import or add the tenant first.',
      'Unit Z9999 is not registered in the Unit menu.',
      'Unit B0712 already has an owner (Owner B).',
      'Unit A0301 has no owner yet, so it cannot have a proxy.',
      'Entry date "31/02/2026" is not a date in DD/MM/YYYY.',
      'Rent period must be 1 to 120 months.'
    ]);
  });

  it('reads the downloaded Tenant Unit template', async () => {
    const rows = await parseTenantUnitImportFile(await xlsx(buildTenantUnitImportTemplate()));
    expect(rows.map((r) => r.values.role)).toEqual(['Owner', 'Renter', 'Owner']);
    expect(rows[1].values.startRent).toBe('01/11/2026');
  });
});
