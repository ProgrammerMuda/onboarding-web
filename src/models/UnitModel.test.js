import { describe, it, expect } from 'vitest';
import {
  SEED_UNITS,
  countByCategory,
  filterUnits,
  getFilterOptions,
  validateUnit,
  buildUnit,
  getPageItems,
  unitsToCsv
} from './UnitModel';

describe('UnitModel', () => {
  it('seeds all three categories', () => {
    const counts = countByCategory(SEED_UNITS);
    expect(counts.hunian).toBeGreaterThan(0);
    expect(counts.non_hunian).toBeGreaterThan(0);
    expect(counts.non_unit).toBeGreaterThan(0);
  });

  it('keeps non-unit facilities owned by P3SRS only', () => {
    SEED_UNITS.filter((u) => u.category === 'non_unit').forEach((u) => {
      expect(u.ownerName).toBe('P3SRS');
    });
  });

  it('filters inside one category only', () => {
    const rows = filterUnits(SEED_UNITS, { category: 'non_hunian', tower: 'Tower A' });
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((u) => {
      expect(u.category).toBe('non_hunian');
      expect(u.tower).toBe('Tower A');
    });
  });

  it('searches by code and owner', () => {
    const rows = filterUnits(SEED_UNITS, { category: 'hunian', query: 'a0101' });
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toBe('A0101');
  });

  it('derives filter options from the active category', () => {
    const { towers, floors } = getFilterOptions(SEED_UNITS, 'non_unit');
    expect(towers).toEqual(['Tower A', 'Tower B', 'Tower C']);
    expect(floors).toContain('B1');
  });

  it('validates required fields, duplicates, and non-unit ownership', () => {
    const base = { category: 'hunian', code: 'A0101', tower: 'Tower A', floor: '01', ownerName: 'X', status: 'occupied' };
    expect(validateUnit({ ...base, code: '' }, SEED_UNITS)).toMatch(/unit name is required/i);
    expect(validateUnit(base, SEED_UNITS)).toMatch(/already exists/i);
    expect(validateUnit({ ...base, code: 'Z9999', status: 'rented' }, SEED_UNITS)).toMatch(/renter name/i);
    expect(validateUnit({ ...base, code: 'Z9999' }, SEED_UNITS)).toBe('');
    expect(
      validateUnit({ ...base, category: 'non_unit', code: 'FAC-99', name: 'Hall', ownerName: 'Someone' }, SEED_UNITS)
    ).toMatch(/owned by P3SRS/);
  });

  it('builds a non-unit with an owner type', () => {
    const unit = buildUnit({
      category: 'non_unit', code: 'FAC-99', name: 'Hall', tower: 'Podium', floor: '02',
      status: 'occupied', ownerName: 'P3SRS', tenantName: ''
    });
    expect(unit.ownerType).toBe('p3srs');
  });

  it('builds page items with gaps', () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageItems(1, 20)).toEqual([1, 2, 'gap', 20]);
    expect(getPageItems(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
  });

  it('exports CSV with escaped quotes', () => {
    const csv = unitsToCsv([{ ...SEED_UNITS[0], ownerName: 'A "B"' }]);
    expect(csv.split('\n')[0]).toContain('"Code"');
    expect(csv).toContain('"A ""B"""');
  });
});

describe('getOccupantName', () => {
  it('returns the owner, the tenant, or nobody by status', async () => {
    const { getOccupantName } = await import('./UnitModel');
    const base = { ownerName: 'Owner A', tenantName: 'Tenant B' };
    expect(getOccupantName({ ...base, status: 'occupied' })).toBe('Owner A');
    expect(getOccupantName({ ...base, status: 'rented' })).toBe('Tenant B');
    expect(getOccupantName({ ...base, status: 'vacant' })).toBe('');
  });
});

describe('occupant members', () => {
  it('resolves owner, renter, and an owner-registered proxy', async () => {
    const { getOccupant, describeOccupant } = await import('./UnitModel');
    const base = { ownerName: 'Asep Saepudin', tenantName: 'Aldi Mahardiansyah' };
    const member = { name: 'Rian Saepudin' };
    expect(describeOccupant(getOccupant({ ...base, status: 'occupied' }))).toBe('Owner');
    const ofOwner = getOccupant({ ...base, status: 'occupied', occupant: member });
    expect(ofOwner.name).toBe('Rian Saepudin');
    expect(describeOccupant(ofOwner)).toBe('Proxy');
    expect(describeOccupant(getOccupant({ ...base, status: 'rented' }))).toBe('Renter');
    expect(getOccupant({ ...base, status: 'rented', occupant: member }).name).toBe('Aldi Mahardiansyah');
    expect(getOccupant({ ...base, status: 'vacant', occupant: member })).toBeNull();
  });

  it('seeds proxies only under occupied units', async () => {
    const { SEED_UNITS: seed } = await import('./UnitModel');
    const withMember = seed.filter((u) => u.occupant);
    expect(withMember.length).toBeGreaterThan(0);
    withMember.forEach((u) => expect(u.status).toBe('occupied'));
  });

  it('validates and builds a member occupant', async () => {
    const { validateUnit: validate, buildUnit: build } = await import('./UnitModel');
    const draft = {
      category: 'hunian', code: 'Z1', tower: 'Tower A', floor: '01', ownerName: 'Owner A',
      status: 'occupied', occupantType: 'proxy', memberName: ''
    };
    expect(validate(draft, [])).toMatch(/proxy name/i);
    expect(build({ ...draft, memberName: 'Siti A' }).occupant).toEqual({ name: 'Siti A' });
    expect(build({ ...draft, status: 'rented', tenantName: 'T', memberName: 'Siti A' }).occupant).toBeUndefined();
  });
});

describe('Non-Unit facilities', () => {
  it('are only ever Rented or Vacant in the seed', async () => {
    const { SEED_UNITS: seed, getOccupant } = await import('./UnitModel');
    const facilities = seed.filter((u) => u.category === 'non_unit');
    facilities.forEach((u) => expect(['rented', 'vacant']).toContain(u.status));
    facilities.filter((u) => u.status === 'vacant').forEach((u) => expect(getOccupant(u)).toBeNull());
    facilities.filter((u) => u.status === 'rented').forEach((u) => {
      expect(getOccupant(u).name).toBe(u.tenantName);
      expect(u.tenantName).toBeTruthy();
    });
  });

  it('offers only Rented and Vacant, and rejects Occupied', async () => {
    const { getStatusOptions, validateUnit: validate } = await import('./UnitModel');
    expect(getStatusOptions('non_unit')).toEqual(['rented', 'vacant']);
    expect(getStatusOptions('hunian')).toEqual(['occupied', 'rented', 'vacant']);
    const draft = {
      category: 'non_unit', code: 'FAC-98', name: 'Hall', tower: 'Podium', floor: '02',
      ownerName: 'P3SRS', status: 'occupied'
    };
    expect(validate(draft, [])).toMatch(/Rented or Vacant/);
    expect(validate({ ...draft, status: 'rented' }, [])).toMatch(/renter name/i);
    expect(validate({ ...draft, status: 'rented', tenantName: 'Telecom operator' }, [])).toBe('');
  });
});

describe('Non-Residential unit codes', () => {
  it('are named per tower like ATOKO1 and BTOKO1', async () => {
    const { SEED_UNITS: seed } = await import('./UnitModel');
    const codes = seed.filter((u) => u.category === 'non_hunian').map((u) => u.code);
    expect(codes).toContain('ATOKO1');
    expect(codes).toContain('BTOKO1');
    codes.forEach((c) => expect(c).toMatch(/^[A-D]TOKO\d+$/));
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('Non-Unit facility codes', () => {
  it('use tower letter, type, and a running number', async () => {
    const { SEED_UNITS: seed } = await import('./UnitModel');
    const codes = seed.filter((u) => u.category === 'non_unit').map((u) => u.code);
    expect(codes).toEqual(expect.arrayContaining(['AKIOS1', 'ASTORAGE1', 'ASTORAGE2', 'ACOWORKING1']));
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('Add Unit steps', () => {

  it('only keeps the detail fields that apply to the unit type', async () => {
    const { getDetailFields, buildUnit, getEmptyDraft } = await import('./UnitModel');
    expect(getDetailFields('hunian')).toEqual({ npp: true, ipl: true, bedrooms: true });
    expect(getDetailFields('non_hunian')).toEqual({ npp: true, ipl: true, bedrooms: false });
    expect(getDetailFields('non_unit')).toEqual({ npp: false, ipl: false, bedrooms: false });

    const draft = {
      ...getEmptyDraft('non_unit'), code: 'AKIOS9', tower: 'Tower A', floor: 'GF',
      area: '12', npp: '5', bedrooms: '2', invoiceIpl: 'yes'
    };
    const unit = buildUnit(draft);
    expect(unit.detail.area).toBe(12);
    expect(unit.detail).not.toHaveProperty('npp');
    expect(unit.detail).not.toHaveProperty('bedrooms');
    expect(unit.detail).not.toHaveProperty('invoiceIpl');
    expect(unit.ownerName).toBe('P3SRS');
    expect(unit.status).toBe('vacant');
  });
});

describe('Add Unit overview data', () => {
  it('starts a new unit vacant, and only a Non-Unit gets an owner', async () => {
    const { buildUnit, getEmptyDraft } = await import('./UnitModel');
    const base = { tower: 'Tower A', floor: '03', code: 'Z0399', area: '30' };
    const resi = buildUnit({ ...getEmptyDraft('hunian'), ...base });
    expect(resi.status).toBe('vacant');
    expect(resi.ownerName).toBe('');
    expect(buildUnit({ ...getEmptyDraft('non_unit'), ...base }).ownerName).toBe('P3SRS');
  });

  it('lists detail rows, optionally with the blank ones', async () => {
    const { getDetailRows, buildUnit, getEmptyDraft } = await import('./UnitModel');
    const detail = buildUnit({
      ...getEmptyDraft('hunian'), tower: 'Tower A', floor: '03', code: 'Z0398', area: '36.5', electricCapacity: '2200'
    }).detail;
    const filled = getDetailRows(detail);
    expect(filled).toContainEqual(['Unit area', '36.5 m²']);
    expect(filled).toContainEqual(['Electric capacity', '2200 VA']);
    expect(filled.find(([label]) => label === 'Water meter no')).toBeUndefined();
    const all = getDetailRows(detail, { includeEmpty: true });
    expect(all).toContainEqual(['Water meter no', '']);
    expect(all).toContainEqual(['IPL bill interval', 'Every 1 month']);
    expect(getDetailRows({ ...detail, invoiceIpl: 'no' }).find(([l]) => l === 'IPL bill interval')).toBeUndefined();
  });
});

describe('Floor options per tower', () => {
  it('is empty until a type and tower are chosen', async () => {
    const { getFloorOptions } = await import('./UnitModel');
    expect(getFloorOptions('', 'Tower A')).toEqual([]);
    expect(getFloorOptions('hunian', '')).toEqual([]);
  });

  it('narrows floors to what the unit type can sit on', async () => {
    const { getFloorOptions, getFloorLabel } = await import('./UnitModel');
    const resi = getFloorOptions('hunian', 'Tower A');
    expect(resi[0]).toBe('01');
    expect(resi).not.toContain('GF');
    expect(getFloorOptions('non_hunian', 'Tower B')).toEqual(['LG', 'GF']);
    expect(getFloorOptions('non_unit', 'Tower A')).toEqual(expect.arrayContaining(['B1', 'GF', '03', 'Rooftop']));
    expect(getFloorOptions('non_unit', 'Podium')).not.toContain('Rooftop');
    expect(getFloorLabel('03')).toBe('Floor 03');
    expect(getFloorLabel('GF')).toBe('Ground Floor (GF)');
  });

  it('covers every floor used by the sample units', async () => {
    const { SEED_UNITS: seed, getFloorOptions } = await import('./UnitModel');
    seed.forEach((u) => expect(getFloorOptions(u.category, u.tower)).toContain(u.floor));
  });
});


describe('number-only typing', () => {
  it('keeps digits only for whole numbers', async () => {
    const { sanitizeInteger } = await import('./UnitModel');
    expect(sanitizeInteger('2 bed')).toBe('2');
    expect(sanitizeInteger('abc')).toBe('');
    expect(sanitizeInteger('1.5')).toBe('15');
  });

  it('keeps digits and one dot for decimals, and turns a comma into a dot', async () => {
    const { sanitizeDecimal } = await import('./UnitModel');
    expect(sanitizeDecimal('0,25')).toBe('0.25');
    expect(sanitizeDecimal('0.2.5')).toBe('0.25');
    expect(sanitizeDecimal('a1b.2c')).toBe('1.2');
    expect(sanitizeDecimal('-3')).toBe('3');
    expect(sanitizeDecimal('')).toBe('');
  });

});


describe('applyDraftPatch', () => {
  it('clears the interval when IPL goes off and restores 1 month when it comes back', async () => {
    const { applyDraftPatch, getEmptyDraft } = await import('./UnitModel');
    const base = { ...getEmptyDraft('hunian'), iplInterval: '3' };
    const off = applyDraftPatch(base, { invoiceIpl: 'no' });
    expect(off.invoiceIpl).toBe('no');
    expect(off.iplInterval).toBe('');
    expect(applyDraftPatch(off, { invoiceIpl: 'yes' }).iplInterval).toBe('1');
    expect(applyDraftPatch(base, { iplInterval: '6' }).iplInterval).toBe('6');
  });

  it('clears the floor on a new tower and restarts the draft on a new unit type', async () => {
    const { applyDraftPatch, getEmptyDraft } = await import('./UnitModel');
    const base = { ...getEmptyDraft('hunian'), tower: 'Tower A', floor: '03', code: 'Z1', area: '30' };
    expect(applyDraftPatch(base, { tower: 'Tower B' }).floor).toBe('');
    expect(applyDraftPatch(base, { tower: 'Tower A' }).floor).toBe('03');
    const typed = applyDraftPatch(base, { category: 'non_unit' });
    expect(typed.category).toBe('non_unit');
    expect(typed.code).toBe('Z1');
    expect(typed.tower).toBe('');
    expect(typed.area).toBe('');
  });

  it('shows No IPL in the overview but not in the detail dialog', async () => {
    const { getDetailRows, buildUnit, getEmptyDraft } = await import('./UnitModel');
    const detail = buildUnit({
      ...getEmptyDraft('hunian'), tower: 'Tower A', floor: '03', code: 'Z2', area: '30', invoiceIpl: 'no', iplInterval: ''
    }).detail;
    expect(detail.iplInterval).toBe('');
    expect(getDetailRows(detail, { includeEmpty: true })).toContainEqual(['IPL bill interval', 'No IPL']);
    expect(getDetailRows(detail).find(([l]) => l === 'IPL bill interval')).toBeUndefined();
  });
});

describe('digits-only detail fields', () => {

  it('keeps leading zeros in meter numbers', async () => {
    const { sanitizeInteger } = await import('./UnitModel');
    expect(sanitizeInteger('00123')).toBe('00123');
    expect(sanitizeInteger('WM-0101')).toBe('0101');
  });
});

// A Unit Detail draft with every required field filled in.
function fullDetail(getEmptyDraft, category = 'hunian', patch = {}) {
  return {
    ...getEmptyDraft(category),
    area: '36.5',
    electricCapacity: '2200',
    waterMeterNo: '20240101',
    electricMeterNo: '31240101',
    waterMeterStart: '0',
    electricMeterStart: '0',
    npp: '0.25',
    bedrooms: '2',
    iplInterval: '1',
    ...patch
  };
}

describe('Unit Detail is fully required', () => {
  it('lists the required fields per unit type', async () => {
    const { getRequiredDetailFields, getEmptyDraft } = await import('./UnitModel');
    const keys = (category, patch) =>
      getRequiredDetailFields({ ...getEmptyDraft(category), ...patch }).map(([key]) => key);
    expect(keys('hunian')).toEqual(expect.arrayContaining(['area', 'electricCapacity', 'waterMeterNo', 'electricMeterNo',
      'waterMeterStart', 'electricMeterStart', 'npp', 'bedrooms', 'iplInterval']));
    expect(keys('non_hunian')).not.toContain('bedrooms');
    expect(keys('non_hunian')).toContain('npp');
    expect(keys('non_unit')).not.toEqual(expect.arrayContaining(['npp']));
    expect(keys('non_unit')).not.toContain('iplInterval');
    expect(keys('hunian', { invoiceIpl: 'no' })).not.toContain('iplInterval');
  });

  it('keeps Next disabled until every required field is filled', async () => {
    const { isUnitStepComplete, getEmptyDraft } = await import('./UnitModel');
    const info = { ...getEmptyDraft('hunian'), tower: 'Tower A', floor: '03', code: 'Z0301' };
    expect(isUnitStepComplete(1, getEmptyDraft())).toBe(false);
    expect(isUnitStepComplete(1, info)).toBe(true);
    expect(isUnitStepComplete(1, { ...info, code: '   ' })).toBe(false);
    expect(isUnitStepComplete(2, info)).toBe(false);
    const full = fullDetail(getEmptyDraft);
    expect(isUnitStepComplete(2, full)).toBe(true);
    for (const key of ['area', 'electricCapacity', 'waterMeterNo', 'electricMeterNo', 'waterMeterStart',
      'electricMeterStart', 'npp', 'bedrooms', 'iplInterval']) {
      expect(isUnitStepComplete(2, { ...full, [key]: '' })).toBe(false);
    }
    expect(isUnitStepComplete(3, getEmptyDraft())).toBe(true);
  });

  it('only asks for what the unit type has', async () => {
    const { isUnitStepComplete, getEmptyDraft } = await import('./UnitModel');
    expect(isUnitStepComplete(2, fullDetail(getEmptyDraft, 'non_hunian', { bedrooms: '' }))).toBe(true);
    expect(isUnitStepComplete(2, fullDetail(getEmptyDraft, 'non_unit', { bedrooms: '', npp: '', iplInterval: '' }))).toBe(true);
    expect(isUnitStepComplete(2, fullDetail(getEmptyDraft, 'hunian', { invoiceIpl: 'no', iplInterval: '' }))).toBe(true);
  });

  it('names the first missing field', async () => {
    const { validateUnitDetail, getEmptyDraft } = await import('./UnitModel');
    expect(validateUnitDetail(getEmptyDraft('hunian'))).toBe('Unit area is required.');
    expect(validateUnitDetail(fullDetail(getEmptyDraft, 'hunian', { waterMeterStart: '' }))).toBe('Initial water meter is required.');
    expect(validateUnitDetail(fullDetail(getEmptyDraft, 'hunian', { electricMeterNo: '  ' }))).toBe('Electricity meter no is required.');
    expect(validateUnitDetail(fullDetail(getEmptyDraft))).toBe('');
  });

  it('rejects the wrong kind of number', async () => {
    const { validateUnitDetail, getEmptyDraft } = await import('./UnitModel');
    const bad = (patch) => validateUnitDetail(fullDetail(getEmptyDraft, 'hunian', patch));
    expect(bad({ area: '0' })).toMatch(/unit area/i);
    expect(bad({ waterMeterNo: 'WM-0101' })).toMatch(/water meter no must be digits only/i);
    expect(bad({ electricMeterNo: '12ab' })).toMatch(/electricity meter no must be digits only/i);
    expect(bad({ electricCapacity: '22.5' })).toMatch(/electric capacity must be digits only/i);
    expect(bad({ bedrooms: '2.5' })).toMatch(/bedroom must be digits only/i);
    expect(bad({ npp: 'abc' })).toMatch(/NPP/);
    expect(bad({ waterMeterStart: '12.5', electricMeterStart: '100.25' })).toBe('');
    expect(bad({ iplInterval: '0' })).toMatch(/IPL bill interval/);
    expect(bad({ invoiceIpl: 'no', iplInterval: '' })).toBe('');
  });

  it('formats bedrooms in the detail rows', async () => {
    const { getDetailRows } = await import('./UnitModel');
    expect(getDetailRows({ bedrooms: '1' })).toContainEqual(['Bedrooms', '1 bedroom']);
    expect(getDetailRows({ bedrooms: '3' })).toContainEqual(['Bedrooms', '3 bedrooms']);
  });

  it('keeps leading zeros and strips letters from meter numbers', async () => {
    const { sanitizeInteger } = await import('./UnitModel');
    expect(sanitizeInteger('00123')).toBe('00123');
    expect(sanitizeInteger('WM-0101')).toBe('0101');
  });
});

describe('Description is gone', () => {
  it('is neither stored nor listed', async () => {
    const { getEmptyDraft, buildUnit, getDetailRows } = await import('./UnitModel');
    const draft = { ...getEmptyDraft('hunian'), tower: 'Tower A', floor: '03', code: 'Z9', area: '30' };
    expect(draft).not.toHaveProperty('description');
    expect(buildUnit(draft).detail).not.toHaveProperty('description');
    expect(getDetailRows(buildUnit(draft).detail, { includeEmpty: true }).map(([l]) => l)).not.toContain('Description');
  });
});

describe('getUnitDetailRows', () => {
  it('lists every applicable field as blank for a unit without detail', async () => {
    const { getUnitDetailRows, SEED_UNITS: seed } = await import('./UnitModel');
    const blank = (category) => seed.find((u) => u.category === category && !u.detail);
    const labels = (category) => getUnitDetailRows(blank(category)).map(([l]) => l);
    expect(labels('hunian')).toEqual(expect.arrayContaining(['Unit area', 'NPP', 'Bedrooms', 'IPL bill interval']));
    expect(labels('non_hunian')).not.toContain('Bedrooms');
    expect(labels('non_unit')).not.toEqual(expect.arrayContaining(['NPP']));
    getUnitDetailRows(blank('hunian')).forEach(([, value]) => expect(value).toBe(''));
  });
});

describe('sample unit A0101', () => {
  it('has every detail field filled, and no other sample unit does', async () => {
    const { SEED_UNITS: seed, getUnitDetailRows, getRequiredDetailFields, getOccupant, describeOccupant } = await import('./UnitModel');
    const a0101 = seed.find((u) => u.code === 'A0101');
    expect(a0101.category).toBe('hunian');
    getUnitDetailRows(a0101).forEach(([label, value]) => expect(value, label).not.toBe(''));
    getRequiredDetailFields({ ...a0101.detail, category: 'hunian', invoiceIpl: 'yes' }).forEach(([key]) =>
      expect(String(a0101.detail[key] ?? '')).not.toBe('')
    );
    expect(a0101.ownerName).toBeTruthy();
    expect(describeOccupant(getOccupant(a0101))).toBe('Renter');
    expect(seed.filter((u) => u.detail).map((u) => u.code)).toEqual(['A0101']);
  });
});

describe('editing a unit', () => {
  it('fills the form from the unit and keeps the invoice defaults for a unit without detail', async () => {
    const { draftFromUnit, getRequiredDetailFields, SEED_UNITS: seed } = await import('./UnitModel');
    const a0101 = seed.find((u) => u.code === 'A0101');
    const d = draftFromUnit(a0101);
    expect(d).toMatchObject({
      category: 'hunian', tower: 'Tower A', floor: '01', code: 'A0101', area: '45.5',
      electricCapacity: '2200', waterMeterNo: '20240101', electricMeterStart: '1480',
      npp: '0.25', bedrooms: '2', iplInterval: '1', invoiceIpl: 'yes'
    });
    getRequiredDetailFields(d).forEach(([key]) => expect(d[key], key).not.toBe(''));

    const blank = draftFromUnit(seed.find((u) => u.category === 'hunian' && !u.detail));
    expect(blank.area).toBe('');
    expect(blank.invoiceElectric).toBe('yes');
    expect(blank.iplInterval).toBe('1');
  });

  it('restores IPL off as an empty interval', async () => {
    const { draftFromUnit, buildUnit, getEmptyDraft } = await import('./UnitModel');
    const unit = buildUnit({
      ...getEmptyDraft('hunian'), tower: 'Tower A', floor: '03', code: 'Z5', area: '30', invoiceIpl: 'no', iplInterval: ''
    });
    const d = draftFromUnit(unit);
    expect(d.invoiceIpl).toBe('no');
    expect(d.iplInterval).toBe('');
  });

  it('changes the unit but not its owner, status, occupant, or id when the type stays', async () => {
    const { applyUnitEdit, draftFromUnit, SEED_UNITS: seed } = await import('./UnitModel');
    const unit = seed.find((u) => u.code === 'A0101');
    const draft = { ...draftFromUnit(unit), code: 'A0101X', floor: '02', area: '50', ownerName: 'Hacker' };
    const next = applyUnitEdit(unit, draft);
    expect(next.id).toBe(unit.id);
    expect(next.category).toBe('hunian');
    expect(next.ownerName).toBe(unit.ownerName);
    expect(next.status).toBe(unit.status);
    expect(next.tenantName).toBe(unit.tenantName);
    expect(next.code).toBe('A0101X');
    expect(next.floor).toBe('02');
    expect(next.detail.area).toBe(50);
    expect(unit.code).toBe('A0101');
  });

  it('stores an edited sample unit as a copy, in place, with new units first', async () => {
    const { mergeUnits, applyUnitEdit, draftFromUnit, buildUnit, getEmptyDraft, SEED_UNITS: seed } = await import('./UnitModel');
    const target = seed[5];
    const edited = applyUnitEdit(target, { ...draftFromUnit(target), area: '99' });
    const fresh = buildUnit({ ...getEmptyDraft('hunian'), tower: 'Tower A', floor: '01', code: 'NEW1', area: '10' });
    const merged = mergeUnits(seed, [fresh, edited]);
    expect(merged).toHaveLength(seed.length + 1);
    expect(merged[0].code).toBe('NEW1');
    expect(merged.find((u) => u.id === target.id).detail.area).toBe(99);
    expect(merged.findIndex((u) => u.id === target.id)).toBe(seed.indexOf(target) + 1);
    expect(seed[5].detail).toBeUndefined();
  });
});

describe('changing the unit type while editing', () => {
  const draftFor = async (unit, category, patch = {}) => {
    const { getEmptyDraft } = await import('./UnitModel');
    return { ...getEmptyDraft(category), code: unit.code, tower: 'Tower A', floor: category === 'non_unit' ? 'GF' : '01', area: '20', ...patch };
  };

  it('to Non-Unit: the owner becomes P3SRS and Occupied becomes Vacant, without the proxy', async () => {
    const { applyUnitEdit, SEED_UNITS: seed } = await import('./UnitModel');
    const unit = seed.find((u) => u.category === 'hunian' && u.status === 'occupied' && u.occupant);
    const next = applyUnitEdit(unit, await draftFor(unit, 'non_unit'));
    expect(next.category).toBe('non_unit');
    expect(next.ownerName).toBe('P3SRS');
    expect(next.ownerType).toBe('p3srs');
    expect(next.status).toBe('vacant');
    expect(next).not.toHaveProperty('occupant');
    expect(next.id).toBe(unit.id);
    expect(next.detail).not.toHaveProperty('npp');
    expect(next.detail).not.toHaveProperty('bedrooms');
  });

  it('to Non-Unit: a rented unit stays rented with its renter', async () => {
    const { applyUnitEdit, SEED_UNITS: seed } = await import('./UnitModel');
    const unit = seed.find((u) => u.code === 'A0101');
    const next = applyUnitEdit(unit, await draftFor(unit, 'non_unit'));
    expect(next.status).toBe('rented');
    expect(next.tenantName).toBe(unit.tenantName);
    expect(next.ownerName).toBe('P3SRS');
  });

  it('from Non-Unit: the owner is cleared', async () => {
    const { applyUnitEdit, SEED_UNITS: seed } = await import('./UnitModel');
    const unit = seed.find((u) => u.category === 'non_unit' && u.status === 'rented');
    const next = applyUnitEdit(unit, await draftFor(unit, 'non_hunian', { floor: 'GF' }));
    expect(next.category).toBe('non_hunian');
    expect(next.ownerName).toBe('');
    expect(next.ownerType).toBe('person');
    expect(next.status).toBe('rented');
    expect(next.detail).toHaveProperty('npp');
  });

  it('between Residential and Non-Residential: ownership and occupant stay', async () => {
    const { applyUnitEdit, SEED_UNITS: seed } = await import('./UnitModel');
    const unit = seed.find((u) => u.category === 'hunian' && u.status === 'occupied' && u.occupant);
    const next = applyUnitEdit(unit, await draftFor(unit, 'non_hunian', { floor: 'GF' }));
    expect(next.category).toBe('non_hunian');
    expect(next.ownerName).toBe(unit.ownerName);
    expect(next.status).toBe('occupied');
    expect(next.occupant).toEqual(unit.occupant);
  });

  it('describes the change in words', async () => {
    const { describeTypeChange, SEED_UNITS: seed } = await import('./UnitModel');
    const occupied = seed.find((u) => u.category === 'hunian' && u.status === 'occupied');
    const rented = seed.find((u) => u.category === 'hunian' && u.status === 'rented');
    const facility = seed.find((u) => u.category === 'non_unit');
    expect(describeTypeChange(occupied, 'non_unit')).toBe('The owner becomes P3SRS and the status Occupied becomes Vacant.');
    expect(describeTypeChange(rented, 'non_unit')).toBe('The owner becomes P3SRS.');
    expect(describeTypeChange(facility, 'hunian')).toBe('The owner is cleared and shows Not assigned.');
    expect(describeTypeChange(occupied, 'non_hunian')).toBe('');
    expect(describeTypeChange(occupied, 'hunian')).toBe('');
  });
});
