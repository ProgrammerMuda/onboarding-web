import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TenantDetailView } from './TenantDetailView';
import { TenantManagementView } from './TenantManagementView';
import { TenantModel } from '../../models/TenantModel';
import { useTenantPresenter } from '../../presenters/useTenantPresenter';

const noop = () => {};
const render = (tab, tenant = TenantModel.getTenantById(1)) => renderToString(
  <TenantDetailView
    presenter={{ selectedTenant: tenant, detailActiveTab: tab, setDetailActiveTab: noop, handleBackToList: noop }}
  />
);

describe('TenantDetailView', () => {
  it('uses the Tenant Member header and breadcrumb', () => {
    const html = render('information');
    expect(html).toContain('emp-hero-banner');
    expect(html).toContain('Tenant List');
    expect(html).toContain('Detail Tenant');
  });

  it('lists units in the shared table with search and filters', () => {
    const html = render('units');
    expect(html).toContain('emp-table tm-table');
    expect(html).toContain('Search units');
    expect(html).toContain('All roles');
    expect(html).toContain('tm-status--');
  });

  it('lists members of every unit in one table', () => {
    const tenant = TenantModel.getAllTenants().find((t) => t.units.some((u) => u.members?.length));
    const html = render('members', tenant);
    expect(html).toContain('emp-table tm-table');
    expect(html).toContain('All relations');
    expect(html).toContain('tm-unit-badge');
  });

  it('lists vehicles with a type filter', () => {
    const html = render('vehicles');
    expect(html).toContain('emp-table tm-table');
    expect(html).toContain('All types');
  });

  it('shows the empty state when the tenant has no units', () => {
    const html = render('members', { ...TenantModel.getTenantById(1), units: [], members: [] });
    expect(html).toContain('No members yet');
  });
});

describe('TenantManagementView', () => {
  it('renders the list with live search and filters', () => {
    function Page() {
      return <TenantManagementView presenter={useTenantPresenter()} />;
    }
    const html = renderToString(<Page />);
    expect(html).toContain('Tenant directory');
    expect(html).toContain('Search tenants');
    expect(html).toContain('All Towers');
  });
});

describe('Vehicles tab', () => {
  it('offers Add vehicle', () => {
    expect(render('vehicles')).toContain('Add vehicle');
  });
});

describe('Detail tabs', () => {
  it('use the Unit list segmented tabs with counts', () => {
    const html = render('units');
    expect(html).toContain('ws-toolbar-tabs');
    expect(html).toContain('unit-tab-count');
    expect(html).toMatch(/aria-selected="true"[^>]*>.*Units/);
  });
});

describe('Tenant list table', () => {
  it('uses the Tenant Member table and an eye button per row', () => {
    function Page() {
      return <TenantManagementView presenter={useTenantPresenter()} />;
    }
    const html = renderToString(<Page />);
    expect(html).toContain('emp-table tm-table');
    expect(html).toContain('emp-table-footer');
    expect(html).toContain('View detail of');
    expect(html).not.toContain('table align-middle');
  });
});

describe('Add tenant dropdown', () => {
  it('replaces Other Action with one Add tenant button', () => {
    function Page() {
      return <TenantManagementView presenter={useTenantPresenter()} />;
    }
    const html = renderToString(<Page />);
    expect(html).not.toContain('Other Action');
    expect(html).toContain('emp-add-dropdown-wrap');
    expect(html).toContain('Add tenant');
  });
});

describe('Export Excel', () => {
  it('sits next to Add tenant', () => {
    function Page() {
      return <TenantManagementView presenter={useTenantPresenter()} />;
    }
    const html = renderToString(<Page />);
    expect(html.indexOf('Export Excel')).toBeGreaterThan(-1);
    expect(html.indexOf('Export Excel')).toBeLessThan(html.indexOf('emp-add-dropdown-wrap'));
  });
});

describe('Add menus on Unit and Tenant Member', () => {
  it('Tenant Member uses the shared Add dropdown', async () => {
    const { TenantMemberView } = await import('./TenantMemberView');
    const { useTenantMemberPresenter } = await import('../../presenters/useTenantMemberPresenter');
    function Page() {
      return <TenantMemberView presenter={useTenantMemberPresenter()} />;
    }
    const html = renderToString(<Page />);
    expect(html).toContain('emp-add-dropdown-wrap');
    expect(html).toContain('Add tenant member');
  });

  it('Unit uses the shared Add dropdown', async () => {
    const { UnitView } = await import('../unit/UnitView');
    const { useUnitPresenter } = await import('../../presenters/useUnitPresenter');
    function Page() {
      return <UnitView presenter={useUnitPresenter()} />;
    }
    const html = renderToString(<Page />);
    expect(html).toContain('emp-add-dropdown-wrap');
    expect(html).toContain('Add Unit');
  });
});

describe('TenantMemberImportModal', () => {
  it('starts with the chosen kind and the shared import layout', async () => {
    const { TenantMemberImportModal } = await import('./TenantMemberImportModal');
    const html = renderToString(<TenantMemberImportModal initialKind="member" prepare={async () => ({})} onImport={() => {}} onDownloadTemplate={() => {}} onClose={() => {}} />);
    expect(html).toContain('Import Tenant Members');
    expect(html).toMatch(/<option value="member" selected="">/);
    expect(html).toContain('add-emp-unified-dropzone');
  });
});
