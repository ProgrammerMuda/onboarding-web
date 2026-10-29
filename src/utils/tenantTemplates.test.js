import { describe, it, expect } from 'vitest';
import {
  buildTenantImportTemplate,
  buildTenantUnitImportTemplate,
  buildTenantMemberImportTemplate,
  buildUnitImportTemplate
} from './excelExport';

const headers = (wb) => wb.worksheets[0].getRow(5).values.filter(Boolean);

describe('import templates in the Employee style', () => {
  it('tenant template has the three form steps and a reference sheet', () => {
    const wb = buildTenantImportTemplate();
    const ws = wb.worksheets[0];
    expect(ws.getCell('A1').value).toBe('PROAPPS — TENANT BATCH IMPORT TEMPLATE');
    expect(ws.getCell(4, 1).value).toBe('STEP 1: PERSONAL DATA & IDENTITY');
    expect(headers(wb).slice(0, 4)).toEqual(['Full Name *', 'Email *', 'Phone Number *', 'NIK (KTP) *']);
    expect(wb.getWorksheet('Reference & Options Guide')).toBeTruthy();
  });

  it('tenant unit template offers Owner, Renter, Proxy', () => {
    const ws = buildTenantUnitImportTemplate().worksheets[0];
    expect(ws.getRow(5).getCell(3).value).toBe('Role *');
    expect(ws.getRow(6).getCell(3).dataValidation.formulae[0]).toBe('"Owner,Renter,Proxy"');
  });

  it('renter and member templates follow their own form', () => {
    const renter = headers(buildTenantMemberImportTemplate('renter'));
    const member = headers(buildTenantMemberImportTemplate('member'));
    expect(renter).toContain('Rent Period (months) *');
    expect(renter).not.toContain('Member Relation *');
    expect(member).toContain('Member Relation *');
    expect(member).toContain('Proxy');
    expect(member).not.toContain('Rent Period (months) *');
    expect(buildTenantMemberImportTemplate('renter').worksheets[0].getCell('A1').value).toBe('PROAPPS — RENTER BATCH IMPORT TEMPLATE');
  });

  it('unit templates still differ per type', () => {
    expect(headers(buildUnitImportTemplate('hunian'))).toContain('Number of Bedroom *');
    expect(headers(buildUnitImportTemplate('non_unit'))).not.toContain('NPP *');
  });
});
