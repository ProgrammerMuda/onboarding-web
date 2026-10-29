import React, { useRef, useState } from 'react';
import {
  UsersThree,
  HouseLine,
  Key,
  UserSwitch,
  MagnifyingGlass,
  ArrowsClockwise,
  CaretLeft,
  CaretRight,
  Buildings,
  FileArrowUp,
  FileArrowDown,
  Eye,
  UserPlus,
  FileXls,
  X
} from '@phosphor-icons/react';
import { TenantDetailView } from './TenantDetailView';
import { Breadcrumb } from '../components/Breadcrumb';
import { AddMenuButton, ActionToast, useActionToast, runTemplateDownload } from '../components/AddMenuButton';
import { ImportModal } from '../components/ImportModal';
import '../employee/employee.css';
import '../schedule/work-schedule.css';
import '../unit/unit.css';
import './tenant-member.css';
import { FilterSelect, PersonCell } from './ListParts';
import { getPageItems } from '../../models/UnitModel';
import { downloadTenantImportTemplate, downloadTenantUnitImportTemplate } from '../../utils/excelExport';

const TABS = [
  { id: 'all', label: 'All Tenants', icon: UsersThree },
  { id: 'owners', label: 'Owners', icon: Key },
  { id: 'renters', label: 'Renters', icon: HouseLine },
  { id: 'proxies', label: 'Proxies', icon: UserSwitch }
];

const COLUMNS = ['Tenant', 'Units'];

// Same layout as the Add employee dropdown: add by hand, import, then the templates the imports expect.
const ADD_MENU = [
  { id: 'manual', title: 'Add Tenant Manually', desc: 'Fill in tenant information directly via form', Icon: UserPlus, tone: '' },
  'divider',
  { id: 'import-tenant', title: 'Import Tenant (Excel)', desc: 'Bulk upload tenant records from a spreadsheet', Icon: FileArrowUp, tone: 'secondary' },
  { id: 'import-unit', title: 'Import Tenant Unit (Excel)', desc: 'Bulk assign units, roles, and entry dates', Icon: Buildings, tone: 'secondary' },
  'divider',
  { id: 'template-tenant', title: 'Download Template Tenant', desc: 'Excel template for Import Tenant', Icon: FileArrowDown, tone: 'download' },
  { id: 'template-unit', title: 'Download Template Tenant Unit', desc: 'Excel template for Import Tenant Unit', Icon: FileArrowDown, tone: 'download' }
];

const TAB_HINTS = {
  all: 'Everyone who owns, rents, or holds a proxy for a unit.',
  owners: 'Tenants who own at least one unit.',
  renters: 'Tenants who rent at least one unit.',
  proxies: 'Tenants who act as proxy for a unit owner.'
};

function StatCard({ tone, icon: Icon, label, value }) {
  return (
    <div className="emp-stat-card">
      <div className={`emp-stat-icon-wrap ${tone}`}>
        <Icon size={22} weight="bold" aria-hidden="true" />
      </div>
      <div className="emp-stat-content">
        <span className="emp-stat-label">{label}</span>
        <span className="emp-stat-number">{value.toLocaleString('en-US')}</span>
      </div>
    </div>
  );
}

export function TenantManagementView({ presenter }) {
  const {
    viewMode,
    handleViewDetails,
    stats,
    activeTab,
    setActiveTab,
    towerOptions,
    unitOptions,
    filterTower,
    filterUnit,
    filterName,
    setFilter,
    resetFilters,
    hasActiveFilters,
    exportExcel,
    exporting,
    tenants,
    pageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalRecords
  } = presenter;

  const [notification, notify] = useActionToast();
  const [importKind, setImportKind] = useState(null);
  const tabRefs = useRef({});

  const runAddItem = (id) => {
    if (id === 'manual') notify('Add tenant form opened.');
    else if (id === 'import-tenant' || id === 'import-unit') setImportKind(id);
    else runTemplateDownload(id === 'template-tenant' ? downloadTenantImportTemplate : downloadTenantUnitImportTemplate, notify);
  };

  if (viewMode === 'detail') {
    return <TenantDetailView presenter={presenter} />;
  }

  const onTabKeyDown = (e, index) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = TABS[(index + step + TABS.length) % TABS.length];
    setActiveTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <div className="ws-container unit-page tm-page position-relative">
      <ActionToast message={notification} />

      {importKind === 'import-tenant' && (
        <ImportModal
          title="Import Tenants"
          subtitle="Upload a filled Tenant template to batch add tenants to the directory."
          templateDesc="Excel template (.xlsx) with Personal Data & Identity, Address, and Emergency Contact."
          onDownloadTemplate={() => runTemplateDownload(downloadTenantImportTemplate, notify)}
          parse={presenter.prepareTenantImport}
          onImport={(tenants) => {
            const n = presenter.importTenants(tenants);
            setImportKind(null);
            notify(`${n} ${n === 1 ? 'tenant' : 'tenants'} imported. Add their units with Import Tenant Unit.`);
          }}
          onClose={() => setImportKind(null)}
          noun="tenants"
          confirmLabel={(n) => (n ? `Import ${n} ${n === 1 ? 'tenant' : 'tenants'}` : 'Import Tenants')}
        />
      )}

      {importKind === 'import-unit' && (
        <ImportModal
          title="Import Tenant Units"
          subtitle="Upload a filled Tenant Unit template to assign units, roles, and entry dates to existing tenants."
          templateDesc="Excel template (.xlsx) with Tenant, Unit (role and entry date), and Rent for renters."
          onDownloadTemplate={() => runTemplateDownload(downloadTenantUnitImportTemplate, notify)}
          parse={presenter.prepareTenantUnitImport}
          onImport={(assignments) => {
            const n = presenter.importTenantUnits(assignments);
            setImportKind(null);
            notify(`${n} tenant ${n === 1 ? 'unit' : 'units'} assigned.`);
          }}
          onClose={() => setImportKind(null)}
          noun="tenant units"
          confirmLabel={(n) => (n ? `Import ${n} tenant ${n === 1 ? 'unit' : 'units'}` : 'Import Tenant Units')}
        />
      )}

      <Breadcrumb items={[{ label: 'Tenant Management' }, { label: 'Tenant List' }]} />

      <div className="ws-hero">
        <div className="ws-hero-left">
          <div className="ws-hero-icon-box">
            <Buildings size={28} weight="bold" />
          </div>
          <div>
            <div className="ws-hero-tag">TENANT MANAGEMENT</div>
            <h1 className="ws-hero-title">Tenant directory</h1>
            <p className="ws-hero-desc">
              Owners, renters, and proxies, with the units each of them holds.
            </p>
          </div>
        </div>
      </div>

      <div className="emp-stats-grid tm-stats-grid">
        <StatCard tone="sum" icon={UsersThree} label="Active tenants" value={stats.totalActiveTenants} />
        <StatCard tone="active" icon={Key} label="Owners" value={stats.owners} />
        <StatCard tone="pending" icon={HouseLine} label="Renters" value={stats.activeRenters} />
        <StatCard tone="total" icon={UserSwitch} label="Proxies" value={stats.activeProxies} />
      </div>

      <div className="emp-card-container">
        <div className="emp-card-header">
          <div>
            <h2 className="emp-card-title">Tenant List</h2>
            <p className="emp-card-desc">{TAB_HINTS[activeTab]}</p>
          </div>
          <div className="emp-card-actions">
            <button type="button" className="emp-btn-secondary" onClick={exportExcel} disabled={exporting || totalRecords === 0}>
              <FileXls size={16} weight="bold" aria-hidden="true" />
              <span>{exporting ? 'Exporting…' : 'Export Excel'}</span>
            </button>
            <AddMenuButton label="Add tenant" items={ADD_MENU} onSelect={runAddItem} />
          </div>
        </div>

        <div className="tm-tabs-row">
          <div className="ws-toolbar-tabs" role="tablist" aria-label="Tenant type">
            {TABS.map((t, i) => {
              const active = t.id === activeTab;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[t.id] = el; }}
                  type="button"
                  role="tab"
                  id={`tnm-tab-${t.id}`}
                  aria-selected={active}
                  aria-controls="tnm-panel"
                  tabIndex={active ? 0 : -1}
                  className={`ws-toolbar-tab ${active ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                >
                  <Icon size={15} weight={active ? 'bold' : 'regular'} aria-hidden="true" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="emp-search-row unit-filter-row">
          <div className="emp-search-input-group unit-search-group">
            <MagnifyingGlass size={16} weight="bold" className="emp-search-input-icon" aria-hidden="true" />
            <input
              type="text"
              className="emp-search-input"
              aria-label="Search tenants"
              placeholder="Search name, email, unit, or member"
              value={filterName}
              onChange={(e) => setFilter('name', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            />
            {filterName && (
              <button type="button" className="unit-search-clear" onClick={() => setFilter('name', '')} aria-label="Clear search">
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          <FilterSelect label="Filter tower" value={filterTower} onChange={(e) => setFilter('tower', e.target.value)}>
            {towerOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </FilterSelect>

          <FilterSelect label="Filter unit" value={filterUnit} onChange={(e) => setFilter('unit', e.target.value)}>
            {unitOptions.map((opt) => <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>)}
          </FilterSelect>

          <button type="button" className="emp-btn-secondary" onClick={resetFilters} disabled={!hasActiveFilters}>
            <ArrowsClockwise size={16} weight="bold" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>

        <div className="emp-card-body" id="tnm-panel" role="tabpanel" aria-labelledby={`tnm-tab-${activeTab}`}>
          <div className="emp-table-card-inner">
            {totalRecords === 0 ? (
              <div className="unit-empty">
                <UsersThree size={36} color="#cbd5e1" aria-hidden="true" />
                <h3>{hasActiveFilters ? 'No tenants match these filters' : 'No tenants yet'}</h3>
                <p>{hasActiveFilters ? 'Change or reset the filters to see more.' : 'They appear here once registered.'}</p>
              </div>
            ) : (
              <>
                <div className="emp-table-responsive">
                  <table className="emp-table tm-table">
                    <thead>
                      <tr>
                        {COLUMNS.map((c) => <th key={c} scope="col">{c}</th>)}
                        <th scope="col" className="unit-col-action">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map((item) => (
                        <tr key={item.id}>
                          <td data-label="Tenant"><PersonCell name={item.name} email={item.email} /></td>
                          <td data-label="Units">
                            {item.units.length === 0 ? (
                              <span className="tnm-unit-empty">No Units Assigned</span>
                            ) : (
                              <div className="tnm-unit-list">
                                {item.units.map((u) => (
                                  <span key={`${u.role}-${u.code}`} className="tnm-unit-pill">
                                    <span className={`tnm-unit-pill__role is-${(u.role || '').toLowerCase()}`}>{u.role}</span>
                                    <span className="tnm-unit-pill__code">{u.code}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="unit-col-action">
                            <button
                              type="button"
                              className="unit-btn-dots"
                              aria-label={`View detail of ${item.name}`}
                              title="View detail"
                              onClick={() => handleViewDetails(item.id)}
                            >
                              <Eye size={18} weight="bold" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="emp-table-footer">
                  <div className="emp-table-footer-info">
                    Showing <strong className="emp-text-dark">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                    <strong className="emp-text-dark">{Math.min(currentPage * pageSize, totalRecords)}</strong> of{' '}
                    <strong className="emp-text-dark">{totalRecords}</strong> tenants
                  </div>
                  <div className="emp-pagination-controls" aria-label="Pagination">
                    <button
                      type="button"
                      className="emp-page-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      aria-label="Previous page"
                    >
                      <CaretLeft size={14} weight="bold" />
                    </button>
                    {getPageItems(currentPage, totalPages).map((p, i) => (
                      p === 'gap' ? (
                        <span key={`gap-${i}`} className="emp-page-ellipsis" aria-hidden="true">…</span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          className={`emp-page-btn ${currentPage === p ? 'active' : ''}`}
                          onClick={() => setCurrentPage(p)}
                          aria-current={currentPage === p ? 'page' : undefined}
                          aria-label={`Page ${p}`}
                        >
                          {p}
                        </button>
                      )
                    ))}
                    <button
                      type="button"
                      className="emp-page-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      aria-label="Next page"
                    >
                      <CaretRight size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
