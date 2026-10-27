import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AddUnitView } from './AddUnitView';
import { getEmptyDraft, SEED_UNITS } from '../../models/UnitModel';

function makePresenter(step, category, patch = {}, formError = '') {
  const noop = () => {};
  return {
    wizardStep: step,
    wizardDraft: { ...getEmptyDraft(category), ...patch },
    updateWizardDraft: noop,
    goToStep: noop,
    nextStep: noop,
    saveUnit: noop,
    cancelAdd: noop,
    formError
  };
}

describe('AddUnitView', () => {
  it('step 1 asks for the unit type and drops Site Name', () => {
    const html = renderToString(<AddUnitView presenter={makePresenter(1, '')} />);
    expect(html).toContain('-- Choose Unit Type --');
    expect(html).toContain('Residential Unit');
    expect(html).toContain('Non-Residential Unit');
    expect(html).toContain('Non-Unit');
    expect(html).not.toContain('Site Name');
    expect(html).not.toContain('Hunian');
    expect(html).toContain('Unit Info');
  });

  it('step 2 drops the ownership document and adapts to the unit type', () => {
    const residential = renderToString(<AddUnitView presenter={makePresenter(2, 'hunian')} />);
    expect(residential).not.toContain('Surat Kepemilikan');
    expect(residential).toContain('Number of Bedroom');
    expect(residential).toContain('NPP');
    expect(residential).toContain('IPL Bill Interval');
    expect(residential).not.toContain('Every 1 Month');

    const commercial = renderToString(<AddUnitView presenter={makePresenter(2, 'non_hunian')} />);
    expect(commercial).not.toContain('Number of Bedroom');
    expect(commercial).toContain('NPP');

    const facility = renderToString(<AddUnitView presenter={makePresenter(2, 'non_unit')} />);
    expect(facility).not.toContain('NPP');
    expect(facility).not.toContain('IPL');
    expect(facility).not.toContain('Number of Bedroom');
  });

  it('step 3 is an overview with no ownership fields', () => {
    const html = renderToString(
      <AddUnitView
        presenter={makePresenter(3, 'hunian', { tower: 'Tower A', floor: '03', code: 'A0399', area: '36' })}
      />
    );
    expect(html).toContain('Overview');
    expect(html).toContain('A0399');
    expect(html).toContain('36 m²');
    expect(html).toContain('Not filled');
    expect(html).toContain('Save Unit');
    expect(html).not.toContain('Proxy Name');
    expect(html).not.toContain('Renter');
    expect(html).not.toContain('Occupant');
    expect(html).not.toContain('assigned separately');
    expect(html).not.toContain('starts as Vacant');
  });

  it('step 3 for a Non-Unit skips NPP and IPL', () => {
    const html = renderToString(
      <AddUnitView presenter={makePresenter(3, 'non_unit', { tower: 'Tower A', floor: 'GF', code: 'AKIOS9', area: '6' })} />
    );
    expect(html).not.toContain('NPP');
    expect(html).not.toContain('IPL');
  });

  it('shows the error banner', () => {
    const html = renderToString(<AddUnitView presenter={makePresenter(1, 'hunian', {}, 'Unit name is required.')} />);
    expect(html).toContain('Unit name is required.');
  });
});

describe('AddUnitView floor dropdown', () => {
  it('waits for a tower, then lists that tower floors for the unit type', () => {
    const before = renderToString(<AddUnitView presenter={makePresenter(1, 'hunian')} />);
    expect(before).toContain('-- Choose Tower First --');

    const after = renderToString(<AddUnitView presenter={makePresenter(1, 'hunian', { tower: 'Tower A' })} />);
    expect(after).toContain('-- Choose Floor --');
    expect(after).toContain('Floor 01');
    expect(after).not.toContain('Ground Floor (GF)');

    const shops = renderToString(<AddUnitView presenter={makePresenter(1, 'non_hunian', { tower: 'Tower B' })} />);
    expect(shops).toContain('Ground Floor (GF)');
    expect(shops).toContain('Lower Ground (LG)');
    expect(shops).not.toContain('Floor 01');
  });
});

describe('AddUnitView Next button', () => {
  it('is disabled until the required fields are filled', () => {
    const empty = renderToString(<AddUnitView presenter={makePresenter(1, 'hunian')} />);
    expect(empty).toMatch(/<button[^>]*add-emp-btn-next[^>]*disabled=""/);
    expect(empty).toContain('Please fill all required fields to continue');

    const filled = renderToString(
      <AddUnitView presenter={makePresenter(1, 'hunian', { tower: 'Tower A', floor: '03', code: 'Z0301' })} />
    );
    expect(filled).not.toMatch(/<button[^>]*add-emp-btn-next[^>]*disabled=""/);
    expect(filled).toContain('Proceed to next step');
  });

  it('keeps Next disabled on step 2 until every field is filled', () => {
    const partial = renderToString(<AddUnitView presenter={makePresenter(2, 'hunian', { area: '36' })} />);
    expect(partial).toMatch(/<button[^>]*add-emp-btn-next[^>]*disabled=""/);
    const full = renderToString(
      <AddUnitView
        presenter={makePresenter(2, 'hunian', {
          area: '36.5', electricCapacity: '2200', waterMeterNo: '20240101', electricMeterNo: '31240101',
          waterMeterStart: '0', electricMeterStart: '0', npp: '0.25', bedrooms: '2', iplInterval: '1'
        })}
      />
    );
    expect(full).not.toMatch(/<button[^>]*add-emp-btn-next[^>]*disabled=""/);
  });

  it('leaves Save Unit enabled on the overview', () => {
    const html = renderToString(<AddUnitView presenter={makePresenter(3, 'hunian')} />);
    expect(html).not.toMatch(/<button[^>]*add-emp-btn-submit[^>]*disabled=""/);
  });
});

describe('AddUnitView placeholders', () => {
  it('shows an e.g. hint in every empty step 2 number field', () => {
    const html = renderToString(<AddUnitView presenter={makePresenter(2, 'hunian')} />);
    ['e.g. 36.5', 'e.g. 2200', 'e.g. 20240101', 'e.g. 31240101', 'e.g. 0.25']
      .forEach((hint) => expect(html).toContain(`placeholder="${hint}"`));
    expect((html.match(/placeholder="e\.g\. 0"/g) || []).length).toBe(2);
  });
});

describe('AddUnitView unit tags', () => {
  it('puts a unit tag at the end of the six number fields', () => {
    const html = renderToString(<AddUnitView presenter={makePresenter(2, 'hunian')} />);
    ['m²', 'VA', 'm³', 'kWh'].forEach((unit) =>
      expect(html).toContain(`<span class="input-group-text unit-addon">${unit}</span>`)
    );
    expect(html).toContain('<span class="input-group-text unit-addon">Bedroom</span>');
    expect(html).toContain('<span class="input-group-text unit-addon">Month</span>');
    expect((html.match(/unit-addon/g) || []).length).toBe(6);
  });
});

describe('AddUnitView IPL bill interval', () => {
  const field = (html) => html.match(/<input[^>]*placeholder="(?:e\.g\. 1|This unit has no IPL on its invoice)"[^>]*>/)?.[0] ?? '';

  it('can be typed in when IPL is on the invoice', () => {
    const html = renderToString(<AddUnitView presenter={makePresenter(2, 'hunian', { invoiceIpl: 'yes' })} />);
    expect(field(html)).toContain('placeholder="e.g. 1"');
    expect(field(html)).not.toContain('disabled');
  });

  it('is disabled and explains why when IPL is not on the invoice', () => {
    const html = renderToString(
      <AddUnitView presenter={makePresenter(2, 'hunian', { invoiceIpl: 'no', iplInterval: '' })} />
    );
    expect(field(html)).toContain('placeholder="This unit has no IPL on its invoice"');
    expect(field(html)).toContain('disabled');
  });
});

describe('AddUnitView required marks on step 2', () => {
  it('marks every field required for a residential unit', () => {
    const html = renderToString(<AddUnitView presenter={makePresenter(2, 'hunian')} />);
    expect((html.match(/<span class="req">\*<\/span>/g) || []).length).toBe(9);
  });

  it('drops the marks for fields that do not apply or are switched off', () => {
    const facility = renderToString(<AddUnitView presenter={makePresenter(2, 'non_unit')} />);
    expect((facility.match(/<span class="req">\*<\/span>/g) || []).length).toBe(6);
    const noIpl = renderToString(<AddUnitView presenter={makePresenter(2, 'hunian', { invoiceIpl: 'no', iplInterval: '' })} />);
    expect((noIpl.match(/<span class="req">\*<\/span>/g) || []).length).toBe(8);
  });
});

describe('AddUnitView in edit mode', () => {
  const editPresenter = (step, patch = {}) => ({ ...makePresenter(step, 'hunian', patch), pageMode: 'edit' });

  it('says Edit in the breadcrumb and hero, and lets the unit type be changed', () => {
    const html = renderToString(
      <AddUnitView presenter={editPresenter(1, { tower: 'Tower A', floor: '01', code: 'A0101' })} />
    );
    expect(html).toContain('Edit Unit');
    expect(html).not.toContain('Add New Unit');
    expect(html).not.toMatch(/<select[^>]*disabled=""[^>]*>\s*<option value="">-- Choose Unit Type --/);
    expect(html).toContain('Changing the unit type resets tower, floor, and detail.');
    expect(html).toContain('A0101');
  });

  it('warns about what a type change does once the type differs from the original', () => {
    const original = SEED_UNITS.find((u) => u.category === 'hunian' && u.status === 'occupied');
    const presenter = {
      ...makePresenter(1, 'non_unit', { code: original.code }),
      pageMode: 'edit',
      editingUnit: original
    };
    const html = renderToString(<AddUnitView presenter={presenter} />);
    expect(html).toContain('Type changed. Tower, floor, and detail were reset');
    expect(html).toContain('The owner becomes P3SRS and the status Occupied becomes Vacant.');
    expect(html).toContain('role="status"');
  });

  it('shows the type change on the overview too', () => {
    const original = SEED_UNITS.find((u) => u.category === 'hunian' && u.status === 'occupied');
    const presenter = {
      ...makePresenter(3, 'non_unit', { code: original.code, tower: 'Tower A', floor: 'GF', area: '12' }),
      pageMode: 'edit',
      editingUnit: original
    };
    const html = renderToString(<AddUnitView presenter={presenter} />);
    expect(html).toContain('Unit type changes from');
    expect(html.replaceAll('<!-- -->', '')).toContain('Unit type changes from Residential Unit to Non-Unit.');
    expect(html).toContain('The owner becomes P3SRS');
  });

  it('ends with Save Changes on the overview', () => {
    const html = renderToString(<AddUnitView presenter={editPresenter(3, { tower: 'Tower A', floor: '01', code: 'A0101', area: '45' })} />);
    expect(html).toContain('Save Changes');
    expect(html).not.toContain('Save Unit');
  });

  it('keeps the Add wording in add mode', () => {
    const html = renderToString(<AddUnitView presenter={makePresenter(1, 'hunian')} />);
    expect(html).toContain('Add New Unit');
    expect(html).not.toContain('Edit Unit');
  });
});
