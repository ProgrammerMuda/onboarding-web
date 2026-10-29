import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { UnitView } from './UnitView';
import {
  SEED_UNITS,
  countByCategory,
  filterUnits,
  getFilterOptions,
  getPageItems
} from '../../models/UnitModel';

function makePresenter(activeTab, viewMode, filters = {}) {
  const f = { tower: '', floor: '', status: '', query: '', ...filters };
  const filtered = filterUnits(SEED_UNITS, { category: activeTab, ...f });
  const pageSize = viewMode === 'table' ? 10 : 9;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const noop = () => {};
  return {
    activeTab, setActiveTab: noop, counts: countByCategory(SEED_UNITS), filters: f, setFilter: noop,
    resetFilters: noop, hasActiveFilters: Object.values(f).some(Boolean),
    options: getFilterOptions(SEED_UNITS, activeTab), viewMode, setViewMode: noop,
    totalRecords: filtered.length, pagedUnits: filtered.slice(0, pageSize), pageSize,
    currentPage: 1, totalPages, pageItems: getPageItems(1, totalPages), setPage: noop,
    selectedUnit: null, openDetail: noop, closeDetail: noop, addDialog: null,
    pageMode: 'list', startAdd: noop, formError: '', successModal: null, closeSuccessModal: noop, exportExcel: noop, exporting: false
  };
}

describe('UnitView', () => {
  ['hunian', 'non_hunian', 'non_unit'].forEach((tab) => {
    ['table', 'cards'].forEach((mode) => {
      it(`renders ${tab} as ${mode}`, () => {
        const html = renderToString(<UnitView presenter={makePresenter(tab, mode)} />);
        expect(html).toContain('role="tablist"');
        expect(html).toContain('emp-table-footer-info');
      });
    });
  });

  it('shows the empty state when nothing matches', () => {
    const html = renderToString(<UnitView presenter={makePresenter('hunian', 'table', { query: 'zzzz-none' })} />);
    expect(html).toContain('No units match these filters');
    expect(html).not.toContain('emp-table-footer-info');
  });

  it('shows facility codes with an occupant column', () => {
    const html = renderToString(<UnitView presenter={makePresenter('non_unit', 'table')} />);
    expect(html).toContain('AKIOS1');
    expect(html).toContain('Occupant');
    expect(html).not.toContain('Lessee');
  });
});

describe('UnitView success modal', () => {
  it('shows the saved unit in a dialog after Save Unit', () => {
    const presenter = {
      ...makePresenter('hunian', 'table'),
      successModal: { title: 'New Unit Added!', subtext: 'Residential Unit "A0199" has been saved successfully.' }
    };
    const html = renderToString(<UnitView presenter={presenter} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('New Unit Added!');
    expect(html).toContain('A0199');
    expect(html).toContain('aria-label="Close"');
  });

  it('shows no dialog when nothing was saved', () => {
    const html = renderToString(<UnitView presenter={makePresenter('hunian', 'table')} />);
    expect(html).not.toContain('New Unit Added!');
  });
});

describe('UnitView row actions', () => {
  it('uses a three-dot menu button in the table instead of the eye', () => {
    const html = renderToString(<UnitView presenter={makePresenter('hunian', 'table')} />);
    expect(html).toContain('unit-btn-dots');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Actions for A0101"');
    expect(html).not.toContain('unit-btn-eye');
  });

  it('puts the same menu button on each card next to the status', () => {
    const html = renderToString(<UnitView presenter={makePresenter('hunian', 'cards')} />);
    expect((html.match(/unit-btn-dots/g) || []).length).toBe(9);
    expect(html).toContain('unit-card__head-actions');
    expect(html).toContain('View detail');
  });
});

describe('UnitTemplateDialog', () => {
  it('lists the three unit types and preselects the one passed in', async () => {
    const { renderToString } = await import('react-dom/server');
    const { UnitTemplateDialog } = await import('./UnitTemplateDialog');
    const html = renderToString(<UnitTemplateDialog initialType="non_unit" onDownload={() => {}} onCancel={() => {}} />);
    expect(html).toContain('Residential Unit');
    expect(html).toContain('Non-Residential Unit');
    expect(html).toMatch(/is-checked"><input[^>]*value="non_unit"/);
    expect(html.match(/is-checked/g)).toHaveLength(1);
  });
});

describe('UnitImportModal', () => {
  it('looks like the Import Employees modal and starts with the active type', async () => {
    const { renderToString } = await import('react-dom/server');
    const { UnitImportModal } = await import('./UnitImportModal');
    const html = renderToString(<UnitImportModal initialType="non_hunian" prepare={async () => ({})} onImport={() => {}} onClose={() => {}} />);
    expect(html).toContain('emp-import-template-banner');
    expect(html).toContain('add-emp-unified-dropzone');
    expect(html).toMatch(/<option value="non_hunian" selected="">/);
    expect(html).toMatch(/emp-btn-save"[^>]*disabled=""/);
  });
});
