import { describe, it, expect } from 'vitest';
import { buildTenantManagementWorkbook } from './tenantMemberExcel';
import { TenantModel } from '../models/TenantModel';

describe('buildTenantManagementWorkbook', () => {
  const tenants = TenantModel.getAllTenants().slice(0, 5);
  const workbook = buildTenantManagementWorkbook({ tenants, exportedOn: '2026-10-29' });

  it('has a Tenants sheet with one row per tenant', () => {
    const sheet = workbook.getWorksheet('Tenants');
    expect(sheet.getRow(5).getCell(1).value).toBe('Name');
    expect(sheet.rowCount).toBe(5 + tenants.length);
    expect(sheet.getRow(6).getCell(1).value).toBe(tenants[0].name);
  });

  it('has a Units sheet with one row per tenant and unit', () => {
    const sheet = workbook.getWorksheet('Units');
    const unitCount = tenants.reduce((n, t) => n + t.units.length, 0);
    expect(sheet.rowCount).toBe(5 + unitCount);
    expect(sheet.getRow(6).getCell(3).value).toBe(tenants[0].units[0].code);
  });
});
