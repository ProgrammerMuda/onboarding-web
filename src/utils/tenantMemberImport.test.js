import { describe, it, expect } from 'vitest';
import { buildTenantMemberImportTemplate, parseTenantMemberImportFile } from './excelExport';
import { importRowsToMembers, UNIT_CHOICES, RENTER_ROWS, MEMBER_ROWS, rentingUnitsById } from '../models/TenantMemberModel';

const fileFrom = (name, data) => ({ name, size: data.byteLength ?? data.length, arrayBuffer: async () => data, text: async () => String(data) });
const xlsx = async (wb, edit) => {
  if (edit) edit(wb.worksheets[0]);
  return fileFrom('m.xlsx', await wb.xlsx.writeBuffer());
};
const renting = rentingUnitsById(RENTER_ROWS, MEMBER_ROWS);
const free = UNIT_CHOICES.filter((u) => u.ownerName && !u.renterName && !u.proxyName);
const rented = UNIT_CHOICES.find((u) => u.renterName);

const base = { name: 'Test Person', email: 'test@x.io', idType: 'KTP', idNumber: '3171000000000001', phone: '081234567890', doorAccess: 'Main lobby, Unit door' };
const row = (rowNumber, values) => ({ rowNumber, values });

describe('tenant member import', () => {
  it('imports the samples of fresh Renter and Member templates as Pending', async () => {
    for (const kind of ['renter', 'member']) {
      const rows = await parseTenantMemberImportFile(await xlsx(buildTenantMemberImportTemplate(kind)), kind);
      const { members, errors } = importRowsToMembers(rows, kind, { renting });
      expect(errors).toEqual([]);
      expect(members).toHaveLength(3);
      expect(members.every((m) => m.status === 'Pending')).toBe(true);
    }
  });

  it('builds a renter under the unit owner with the end of rent', () => {
    const { members } = importRowsToMembers([row(6, { ...base, unitCode: free[0].code.toLowerCase(), rentalPeriod: '12', startRent: '15/03/2026' })], 'renter', { renting });
    expect(members[0]).toMatchObject({ relation: 'Renter', parentRole: 'Owner', tenantName: free[0].ownerName, unitCodes: [free[0].code], rentalPeriod: 12, startRent: '2026-03-15', endRentDate: '15 Mar 2027' });
  });

  it('applies the Add Tenant Member rules row by row', () => {
    const { members, errors } = importRowsToMembers([
      row(6, { ...base, unitCode: rented.code, rentalPeriod: '12', startRent: '01/11/2026' }),
      row(7, { ...base, unitCode: free[0].code, rentalPeriod: '12', startRent: '01/11/2026' }),
      row(8, { ...base, unitCode: free[0].code, email: 'other@x.io', idNumber: '3171000000000002', rentalPeriod: '12', startRent: '01/11/2026' }),
      row(9, { ...base, unitCode: free[1].code, rentalPeriod: '12', startRent: '01/11/2026' }),
      row(10, { ...base, unitCode: free[2].code, idNumber: '31710000000000019', rentalPeriod: '12', startRent: '01/11/2026' }),
      row(11, { ...base, unitCode: free[2].code, idNumber: '3171000000000003', rentalPeriod: '0', startRent: '01/11/2026' }),
      row(12, { ...base, unitCode: free[2].code, idNumber: '3171000000000004', rentalPeriod: '12', startRent: '01/11/2026', doorAccess: 'Main lobby, Helipad' })
    ], 'renter', { renting });
    expect(members.map((m) => m.unitCodes[0])).toEqual([free[0].code]);
    expect(errors.map((e) => [e.rowNumber, e.message])).toEqual([
      [6, `This unit is rented by ${rented.renterName}. End the rent before registering another renter or a proxy.`],
      [8, `This unit is rented by Test Person. End the rent before registering another renter or a proxy.`],
      [9, `This ID already rents ${free[0].code}. A renter can rent only one unit.`],
      [10, 'KTP number has 16 digits (now 17).'],
      [11, 'Rent period is 1 to 120 months.'],
      [12, 'Door "Helipad" is not one of the doors. See the Reference sheet for the list.']
    ]);
  });

  it('checks Member of, relation and proxy for members', () => {
    const unit = free[0];
    const { members, errors } = importRowsToMembers([
      row(6, { ...base, unitCode: unit.code, memberOf: 'Owner', relation: 'Spouse', proxy: 'Yes' }),
      row(7, { ...base, unitCode: unit.code, memberOf: 'Owner', relation: 'Child', proxy: 'Yes', email: 'b@x.io' }),
      row(8, { ...base, unitCode: unit.code, memberOf: 'Renter', relation: 'Child' }),
      row(9, { ...base, unitCode: unit.code, memberOf: 'Owner', relation: 'Cousin' }),
      row(10, { ...base, unitCode: rented.code, memberOf: 'Renter', relation: 'Staff', proxy: 'Yes' })
    ], 'member', { renting });
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ isProxy: true, relation: 'Spouse' });
    expect(errors.map((e) => e.rowNumber)).toEqual([7, 8, 9, 10]);
    expect(errors[1].message).toBe(`${unit.code}: Unit has a proxy, so it has no renter.`);
    expect(errors[2].message).toMatch(/Member relation "Cousin"/);
    expect(errors[3].message).toBe('Only a member of the Owner can be the proxy.');
  });

  it('refuses the Member template when importing renters', async () => {
    await expect(parseTenantMemberImportFile(await xlsx(buildTenantMemberImportTemplate('member')), 'renter')).rejects.toThrow(/Member template/);
  });
});
