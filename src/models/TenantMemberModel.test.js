import { describe, it, expect } from 'vitest';
import {
  RENTER_ROWS,
  MEMBER_ROWS,
  getTenantMemberStats,
  filterRows,
  UNIT_CHOICES,
  EMPTY_MEMBER_DRAFT,
  relationsFor,
  patchMemberDraft,
  withNewOccupants,
  occupantNotice,
  canBeProxy,
  ID_TYPES,
  fieldErrors,
  supportingFileError,
  isMemberStepFilled,
  memberStepError,
  MEMBER_ROWS as SEED_MEMBERS,
  parentOptions,
  isMemberStepComplete,
  buildMemberRow,
  applyMemberEdits,
  MEMBER_STATUSES,
  releaseOccupant,
  draftFromMember,
  needsRent,
  endRentDate,
  seedDoorAccess,
  DOOR_ACCESS_OPTIONS,
  draftFromRenter,
  patchRental,
  rentingUnitsById,
  rentPeriodProblem,
  applyRenterDraft,
  followRenames,
  pendingFirst
} from './TenantMemberModel';

describe('TenantMemberModel', () => {
  it('gives every renter an owner', () => {
    expect(RENTER_ROWS.every((r) => r.ownerName)).toBe(true);
  });

  it('lists only tenants that rent a unit', () => {
    expect(RENTER_ROWS.length).toBeGreaterThan(0);
    expect(RENTER_ROWS.every((r) => r.unitCodes.length > 0)).toBe(true);
  });

  it('splits members into proxy and regular, and totals them', () => {
    const stats = getTenantMemberStats();
    expect(stats.membersWithProxy + stats.regularMembers).toBe(stats.totalMembers);
    expect(stats.totalMembers).toBe(MEMBER_ROWS.length);
    expect(stats.totalRenters).toBe(RENTER_ROWS.length);
    expect(stats.membersWithProxy).toBe(MEMBER_ROWS.filter((m) => m.underProxy).length);
  });

  it('filters by query, tower and status together', () => {
    const [first] = RENTER_ROWS;
    const hit = filterRows(RENTER_ROWS, {
      query: first.unitCodes[0].toLowerCase(),
      tower: first.towers[0],
      status: first.status
    });
    expect(hit.map((r) => r.id)).toContain(first.id);
    expect(filterRows(RENTER_ROWS, { query: 'zzz-no-match' })).toHaveLength(0);
  });

});

describe('add member wizard', () => {
  const rentedUnit = UNIT_CHOICES.find((u) => u.renterName);
  const proxyUnit = UNIT_CHOICES.find((u) => u.proxyName);
  const ownerOnlyUnit = UNIT_CHOICES.find((u) => !u.renterName && !u.proxyName);
  const base = {
    ...EMPTY_MEMBER_DRAFT,
    unitCode: rentedUnit.code,
    parentRole: 'Renter',
    relation: 'Child',
    name: 'Siti',
    email: 'siti@example.com',
    idType: 'KTP',
    idNumber: '3174051204850001',
    phone: '081234567890',
    doorAccess: ['Main lobby']
  };
  const available = (unit) => parentOptions(unit).filter((p) => p.name).map((p) => p.role);

  it('has every case in the seed, and no unit with both a renter and a proxy', () => {
    expect(rentedUnit && proxyUnit && ownerOnlyUnit).toBeTruthy();
    expect(UNIT_CHOICES.some((u) => u.renterName && u.proxyName)).toBe(false);
    expect(UNIT_CHOICES.every((u) => u.ownerName)).toBe(true);
  });

  it('offers the owner always, plus the renter or the proxy that lives there', () => {
    expect(available(rentedUnit)).toEqual(['Owner', 'Renter']);
    expect(available(proxyUnit)).toEqual(['Owner', 'Proxy']);
    expect(available(ownerOnlyUnit)).toEqual(['Owner']);
  });

  it('says why a role is not available', () => {
    const reason = (unit, role) => parentOptions(unit).find((p) => p.role === role).reason;
    expect(reason(rentedUnit, 'Proxy')).toMatch(/rented/);
    expect(reason(proxyUnit, 'Renter')).toMatch(/proxy/);
    expect(reason(ownerOnlyUnit, 'Renter')).toMatch(/No renter/);
  });

  it('offers Renter only to the owner of an unoccupied unit, and never Proxy as a relation', () => {
    expect(relationsFor(ownerOnlyUnit.code, 'Owner')).toContain('Renter');
    for (const [unit, role] of [[ownerOnlyUnit, 'Owner'], [rentedUnit, 'Owner'], [rentedUnit, 'Renter'], [proxyUnit, 'Owner'], [proxyUnit, 'Proxy']]) {
      const list = relationsFor(unit.code, role);
      expect(list).not.toContain('Proxy');
      if (unit !== ownerOnlyUnit) expect(list).not.toContain('Renter');
    }
    expect(relationsFor(rentedUnit.code, 'Proxy')).toEqual([]);
  });

  it('asks the proxy question only for an owner-side, non-renter member on an unoccupied unit', () => {
    const child = { ...base, unitCode: ownerOnlyUnit.code, parentRole: 'Owner', relation: 'Child' };
    expect(canBeProxy(child)).toBe(true);
    expect(canBeProxy({ ...child, relation: 'Renter' })).toBe(false);
    expect(canBeProxy({ ...child, relation: '' })).toBe(false);
    expect(canBeProxy({ ...child, unitCode: rentedUnit.code })).toBe(false);
    expect(canBeProxy({ ...child, unitCode: proxyUnit.code })).toBe(false);
    expect(canBeProxy({ ...base, unitCode: rentedUnit.code, parentRole: 'Renter' })).toBe(false);
  });

  it('clears the proxy answer when the unit, member of, or relation changes to Renter', () => {
    const proxyChild = { ...base, unitCode: ownerOnlyUnit.code, parentRole: 'Owner', relation: 'Child', isProxy: true };
    expect(patchMemberDraft(proxyChild, { unitCode: rentedUnit.code }).isProxy).toBe(false);
    expect(patchMemberDraft(proxyChild, { parentRole: 'Renter' }).isProxy).toBe(false);
    expect(patchMemberDraft(proxyChild, { relation: 'Renter' }).isProxy).toBe(false);
    expect(patchMemberDraft(proxyChild, { relation: 'Sibling' }).isProxy).toBe(true);
  });

  it('never lists a renter under a proxy in the seed', () => {
    expect(SEED_MEMBERS.some((m) => m.parentRole === 'Proxy' && m.relation === 'Renter')).toBe(false);
  });

  it('fills the occupant slot with a renter or proxy saved this session', () => {
    const saved = buildMemberRow({ ...base, unitCode: ownerOnlyUnit.code, parentRole: 'Owner', relation: 'Child', isProxy: true }, 9);
    expect(saved).toMatchObject({ relation: 'Child', isProxy: true });
    const units = withNewOccupants(UNIT_CHOICES, [saved]);
    const unit = units.find((u) => u.code === ownerOnlyUnit.code);
    expect(unit.proxyName).toBe(saved.name);
    expect(relationsFor(unit.code, 'Owner', units)).not.toContain('Renter');
    expect(occupantNotice(unit)).toMatch(saved.name);
    expect(occupantNotice(ownerOnlyUnit)).toBe('');
  });

  it('lets a new proxy through step 1 and step 3', () => {
    const proxy = { ...base, unitCode: ownerOnlyUnit.code, parentRole: 'Owner', relation: 'Child', isProxy: true };
    expect(isMemberStepComplete(1, proxy)).toBe(true);
    expect(isMemberStepComplete(3, proxy)).toBe(true);
  });

  it('resets Member of and Relation when the unit changes', () => {
    const next = patchMemberDraft(base, { unitCode: proxyUnit.code });
    expect(next).toMatchObject({ unitCode: proxyUnit.code, parentRole: '', relation: '' });
    expect(next.name).toBe(base.name);
    expect(patchMemberDraft(base, { unitCode: base.unitCode })).toMatchObject({ parentRole: 'Renter', relation: 'Child' });
  });

  it('resets Relation when Member of changes', () => {
    expect(patchMemberDraft(base, { parentRole: 'Owner' })).toMatchObject({ parentRole: 'Owner', relation: '' });
  });

  it('gates each step on its required fields', () => {
    expect(isMemberStepComplete(1, { ...base, parentRole: '' })).toBe(false);
    expect(isMemberStepComplete(1, { ...base, parentRole: 'Proxy' })).toBe(false);
    expect(isMemberStepComplete(1, base)).toBe(true);
    expect(isMemberStepComplete(2, { ...base, idNumber: '123' })).toBe(false);
    expect(isMemberStepComplete(2, { ...base, email: 'nope' })).toBe(false);
    expect(isMemberStepComplete(2, { ...base, email: '' })).toBe(false);
    expect(isMemberStepComplete(2, { ...base, phone: '' })).toBe(true);
    expect(isMemberStepComplete(2, { ...base, phone: '0812' })).toBe(false);
    expect(isMemberStepComplete(2, base)).toBe(true);
    expect(isMemberStepComplete(3, { ...base, doorAccess: [] })).toBe(false);
    expect(isMemberStepComplete(3, base)).toBe(true);
    expect(isMemberStepComplete(4, base)).toBe(true);
    expect(isMemberStepComplete(4, { ...base, doorAccess: [] })).toBe(false);
  });

  it('asks a renter for the rent period and start date before door access counts', () => {
    const renter = { ...base, unitCode: ownerOnlyUnit.code, parentRole: 'Owner', relation: 'Renter' };
    expect(needsRent(renter)).toBe(true);
    expect(isMemberStepComplete(3, renter)).toBe(false);
    expect(isMemberStepComplete(3, { ...renter, rentalPeriod: '12' })).toBe(false);
    expect(isMemberStepComplete(3, { ...renter, rentalPeriod: '12', startRent: '2026-03-15' })).toBe(true);
    expect(isMemberStepComplete(3, { ...renter, rentalPeriod: '12', startRent: '2026-03-15', doorAccess: [] })).toBe(false);
  });

  it('takes any whole number of months from 1 to 120', () => {
    const renter = { ...base, unitCode: ownerOnlyUnit.code, parentRole: 'Owner', relation: 'Renter', rentalPeriod: '18', startRent: '2026-03-15' };
    expect(memberStepError(3, renter)).toBe('');
    expect(isMemberStepComplete(3, renter)).toBe(true);
    expect(endRentDate('2026-03-15', 18)).toBe('15 Sep 2027');
    for (const bad of ['0', '121', '999']) {
      expect(memberStepError(3, { ...renter, rentalPeriod: bad })).toBe('Rent period is 1 to 120 months.');
      expect(isMemberStepComplete(3, { ...renter, rentalPeriod: bad })).toBe(false);
    }
    expect(memberStepError(3, { ...base, rentalPeriod: '999' })).toBe('');
  });

  it('computes the date out and saves the rent details on the row', () => {
    expect(endRentDate('2026-03-15', 12)).toBe('15 Mar 2027');
    expect(endRentDate('2026-11-01', 6)).toBe('01 May 2027');
    expect(endRentDate('', 12)).toBe('');
    const renter = { ...base, unitCode: ownerOnlyUnit.code, parentRole: 'Owner', relation: 'Renter', rentalPeriod: '12', startRent: '2026-03-15' };
    expect(buildMemberRow(renter, 1)).toMatchObject({ rentalPeriod: 12, startRent: '2026-03-15', endRentDate: '15 Mar 2027' });
    expect(buildMemberRow(base, 2).rentalPeriod).toBeUndefined();
  });

  it('clears the rent details when the relation stops being Renter', () => {
    const renter = { ...base, relation: 'Renter', rentalPeriod: '12', startRent: '2026-03-15' };
    expect(patchMemberDraft(renter, { relation: 'Child' })).toMatchObject({ rentalPeriod: '', startRent: '' });
    expect(patchMemberDraft(renter, { name: 'x' }).rentalPeriod).toBe('12');
  });

  it('carries the seed renter members rent details in the form date format', () => {
    const budi = MEMBER_ROWS.find((m) => m.name === 'Budi Sudjie');
    expect(budi).toMatchObject({ rentalPeriod: 12, startRent: '2026-03-15', endRentDate: '15 Mar 2027' });
    expect(draftFromMember(budi)).toMatchObject({ rentalPeriod: '12', startRent: '2026-03-15' });
  });

  it('lets Next through on filled fields, then reports the first format problem', () => {
    expect(isMemberStepFilled(2, { ...base, email: 'nope' })).toBe(true);
    expect(memberStepError(2, { ...base, email: 'nope' })).toBe('Invalid email format (e.g. name@example.com).');
    expect(isMemberStepFilled(2, { ...base, email: '' })).toBe(false);
    expect(memberStepError(2, base)).toBe('');
  });

  it('checks the ID number against its type', () => {
    expect(ID_TYPES.KTP.clean('3174-0512 abc')).toBe('31740512');
    expect(ID_TYPES.Passport.clean('c 1234567x99')).toBe('C1234567X');
    expect(fieldErrors({ ...base, idNumber: '3174' }).idNumber).toMatch(/16 digits \(now 4\)/);
    expect(fieldErrors({ ...base, idType: 'Passport', idNumber: 'C12' }).idNumber).toMatch(/6 to 9/);
    expect(fieldErrors({ ...base, idType: 'Passport', idNumber: 'C1234567' }).idNumber).toBeUndefined();
  });

  it('clears the ID number when the ID type changes', () => {
    expect(patchMemberDraft(base, { idType: 'Passport' }).idNumber).toBe('');
  });

  it('refuses files that are not PDF or image, or over 5 MB', () => {
    expect(supportingFileError({ type: 'application/pdf', size: 1024 })).toBe('');
    expect(supportingFileError({ type: 'image/png', size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
    expect(supportingFileError({ type: 'application/zip', size: 10 })).toMatch(/PDF or an image/);
  });

  it('builds a Pending row under the chosen person', () => {
    expect(buildMemberRow(base, 1)).toMatchObject({
      status: 'Pending', tenantName: rentedUnit.renterName, parentRole: 'Renter', ownerName: rentedUnit.ownerName
    });
    expect(buildMemberRow({ ...base, unitCode: proxyUnit.code, parentRole: 'Proxy' }, 2)).toMatchObject({
      tenantName: proxyUnit.proxyName, underProxy: true
    });
  });
});

describe('applyMemberEdits', () => {
  it('swaps in edited rows and marks deactivated ones Inactive', () => {
    const [first, second] = MEMBER_ROWS;
    const edited = { [first.id]: { ...first, name: 'Edited Name' } };
    const out = applyMemberEdits(MEMBER_ROWS, { edited, deactivated: [second.id] });
    expect(out.find((m) => m.id === first.id).name).toBe('Edited Name');
    expect(out.find((m) => m.id === second.id).status).toBe('Inactive');
    expect(out).toHaveLength(MEMBER_ROWS.length);
  });
});

describe('seeded door access', () => {
  const valid = new Set(DOOR_ACCESS_OPTIONS);

  it('gives every renter and every member at least one valid door', () => {
    for (const row of [...RENTER_ROWS, ...MEMBER_ROWS]) {
      expect(row.doorAccess.length).toBeGreaterThan(0);
      expect(row.doorAccess.every((door) => valid.has(door))).toBe(true);
    }
  });

  it('is stable per person and varies between people', () => {
    expect(seedDoorAccess('renter:1')).toEqual(seedDoorAccess('renter:1'));
    const sets = new Set(RENTER_ROWS.map((r) => r.doorAccess.join('|')));
    expect(sets.size).toBeGreaterThan(1);
  });

  it('keeps staff to the doors their work needs', () => {
    expect(seedDoorAccess('any', true)).toEqual(['Main lobby', 'Passenger lift', 'Service entrance']);
    expect(seedDoorAccess('any')).toContain('Unit door');
  });
});

describe('seeded rentals', () => {
  it('gives every renter one rental per rented unit, with a computed date out', () => {
    for (const r of RENTER_ROWS) {
      expect(r.rentals).toHaveLength(r.unitCodes.length);
      r.rentals.forEach((x, i) => {
        expect(x.code).toBe(r.unitCodes[i]);
        expect([12, 24, 36]).toContain(x.period);
        expect(x.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(x.out).toBe(endRentDate(x.start, x.period));
      });
    }
  });
});

describe('approving and rejecting pending members', () => {
  const pending = MEMBER_ROWS.find((m) => m.status === 'Pending');
  const active = MEMBER_ROWS.find((m) => m.status === 'Active');
  const find = (rows, id) => rows.find((m) => m.id === id);

  it('approve makes a Pending member Active', () => {
    const out = applyMemberEdits(MEMBER_ROWS, { approved: [pending.id] });
    expect(find(out, pending.id).status).toBe('Active');
  });

  it('reject keeps the reason and marks the member Rejected', () => {
    const out = applyMemberEdits(MEMBER_ROWS, { rejected: { [pending.id]: 'ID does not match' } });
    expect(find(out, pending.id)).toMatchObject({ status: 'Rejected', rejectReason: 'ID does not match' });
  });

  it('leaves members that are not Pending alone', () => {
    const out = applyMemberEdits(MEMBER_ROWS, { approved: [active.id], rejected: { [active.id]: 'x' } });
    expect(find(out, active.id).status).toBe('Active');
  });

  it('offers Rejected as a status to filter by', () => {
    expect(MEMBER_STATUSES).toContain('Rejected');
  });
});

const base0 = () => ({
  ...EMPTY_MEMBER_DRAFT, name: 'Siti', email: 'siti@example.com', idType: 'KTP', phone: '081234567890', doorAccess: ['Main lobby']
});

describe('a renter rents one unit', () => {
  it('lists exactly one unit and one rental per renter', () => {
    for (const r of RENTER_ROWS) {
      expect(r.unitCodes).toHaveLength(1);
      expect(r.rentals).toHaveLength(1);
    }
  });

  it('marks every renter\'s unit as rented', () => {
    for (const r of RENTER_ROWS) {
      expect(UNIT_CHOICES.find((u) => u.code === r.unitCodes[0]).renterName).toBeTruthy();
    }
  });

  it('gives every renter their own ID number', () => {
    const ids = RENTER_ROWS.map((r) => r.idNumber);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length === 16)).toBe(true);
  });

  it('keeps a second rented unit in the seed out of the renter list', () => {
    const second = UNIT_CHOICES.find((u) => u.code === 'C0303');
    expect(second.renterName).not.toBe('Aldi Mahardiansyah');
  });

  it('stops an ID number from renting a second unit', () => {
    const renter = RENTER_ROWS[0];
    const renting = rentingUnitsById(RENTER_ROWS, MEMBER_ROWS);
    const freeUnit = UNIT_CHOICES.find((u) => !u.renterName && !u.proxyName && u.code !== renter.unitCodes[0]);
    const again = { ...base0(), unitCode: freeUnit.code, parentRole: 'Owner', relation: 'Renter', idNumber: renter.idNumber };
    expect(fieldErrors(again, renting).idNumber).toBe(`This ID already rents ${renter.unitCodes[0]}. A renter can rent only one unit.`);
    // The same lease is fine, and so is a different person or a different relation.
    expect(fieldErrors({ ...again, unitCode: renter.unitCodes[0] }, renting).idNumber).toBeUndefined();
    expect(fieldErrors({ ...again, idNumber: '1234567890123456' }, renting).idNumber).toBeUndefined();
    expect(fieldErrors({ ...again, relation: 'Child' }, renting).idNumber).toBeUndefined();
  });

  it('counts renters added this session', () => {
    const added = { relation: 'Renter', idNumber: '1111222233334444', unitCodes: ['A0101'] };
    const renting = rentingUnitsById([], [added]);
    const draft = { ...base0(), unitCode: 'A0102', parentRole: 'Owner', relation: 'Renter', idNumber: '1111222233334444' };
    expect(fieldErrors(draft, renting).idNumber).toMatch(/already rents A0101/);
  });
});

describe('editing a renter in the wizard', () => {
  const renter = RENTER_ROWS[0];

  it('opens locked on the lease, with the rental and the doors filled in', () => {
    const d = draftFromRenter(renter);
    expect(d).toMatchObject({ renterEdit: true, parentRole: 'Owner', relation: 'Renter' });
    expect(d.rentals.map((x) => x.code)).toEqual(renter.unitCodes);
    expect(d.doorAccess).toEqual(renter.doorAccess);
    for (const n of [1, 2, 3, 4]) expect(isMemberStepComplete(n, d)).toBe(true);
  });

  it('needs a period and a start date', () => {
    const d = draftFromRenter(renter);
    expect(isMemberStepComplete(3, patchRental(d, 0, { period: '' }))).toBe(false);
    expect(isMemberStepComplete(3, patchRental(d, 0, { start: '' }))).toBe(false);
    expect(memberStepError(3, patchRental(d, 0, { period: '999' }))).toMatch(new RegExp(`${renter.unitCodes[0]}: Rent period is 1 to 120`));
    expect(rentPeriodProblem('')).toBe('');
    expect(rentPeriodProblem('0')).toMatch(/1 to 120/);
  });

  it('writes the edited rent and doors back, with the date out recomputed', () => {
    const d = patchRental({ ...draftFromRenter(renter), doorAccess: ['Gym'] }, 0, { period: '18', start: '2026-03-15' });
    const saved = applyRenterDraft(renter, d);
    expect(saved.rentals[0]).toEqual({ code: renter.unitCodes[0], period: 18, start: '2026-03-15', out: '15 Sep 2027' });
    expect(saved.doorAccess).toEqual(['Gym']);
    expect(saved.unitCodes).toEqual(renter.unitCodes);
  });
});

describe('editing a renter', () => {
  it('opens with the renter filled in and writes the changes back', () => {
    const renter = RENTER_ROWS[0];
    const d = draftFromRenter(renter);
    expect(d).toMatchObject({ name: renter.name, email: renter.email, idNumber: renter.idNumber });
    const saved = applyRenterDraft(renter, { ...d, name: 'New Name' });
    expect(saved).toMatchObject({ id: renter.id, name: 'New Name', unitCodes: renter.unitCodes });
  });

  it('moves members along when the renter is renamed', () => {
    const member = MEMBER_ROWS[0];
    const out = followRenames([member], { [member.tenantName]: 'Renamed' });
    expect(out[0].tenantName).toBe('Renamed');
  });
});

describe('editing a member', () => {
  it('opens the wizard with the member filled in, and passes every step', () => {
    const member = MEMBER_ROWS.find((m) => m.idNumber.length === 16 && m.email);
    const units = releaseOccupant(UNIT_CHOICES, member);
    const d = { ...draftFromMember(member), doorAccess: ['Main lobby'] };
    expect(d).toMatchObject({ unitCode: member.unitCodes[0], parentRole: member.parentRole, relation: member.relation, name: member.name });
    expect(isMemberStepComplete(2, d, units)).toBe(true);
  });

  it('frees the unit slot held by the member being edited', () => {
    const unit = UNIT_CHOICES.find((u) => u.proxyName);
    const proxy = { name: unit.proxyName, unitCodes: [unit.code] };
    expect(releaseOccupant(UNIT_CHOICES, proxy).find((u) => u.code === unit.code).proxyName).toBe('');
  });
});

describe('pendingFirst', () => {
  it('puts Pending rows on top and keeps the rest in order', () => {
    const rows = [{ id: 1, status: 'Active' }, { id: 2, status: 'Pending' }, { id: 3, status: 'Active' }, { id: 4, status: 'Pending' }];
    expect(pendingFirst(rows).map((r) => r.id)).toEqual([2, 4, 1, 3]);
  });
});
