import React, { useState } from 'react';
import {
  Wallet,
  Coins,
  Plus,
  DotsThreeVertical,
  ClockCounterClockwise,
  Vault,
  Buildings,
  HourglassMedium,
  FileXls,
  Eye,
  MagnifyingGlass,
  ArrowsClockwise,
  CaretLeft,
  CaretRight,
  X
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import { ActionToast, useActionToast } from '../components/AddMenuButton';
import { BALANCE_FILTERS, formatRupiah } from '../../models/DepositModel';
import { UnitBadge, RoleChip, FilterSelect, RowActionMenu, rowMenuAnchor } from '../tenant/ListParts';
import { DepositDetailView } from './DepositDetailView';
import { DepositTopUpPanel } from './DepositTopUpPanel';
import '../employee/employee.css';
import '../schedule/work-schedule.css';
import '../unit/unit.css';
import '../tenant/tenant-member.css';
import './deposit.css';

const COLUMNS = ['Unit', 'Tenant', 'Deposit Balance'];

function StatCard({ tone, icon: Icon, label, value }) {
  return (
    <div className="emp-stat-card">
      <div className={`emp-stat-icon-wrap ${tone}`}>
        <Icon size={22} weight="bold" aria-hidden="true" />
      </div>
      <div className="emp-stat-content">
        <span className="emp-stat-label">{label}</span>
        <span className="emp-stat-number">{value}</span>
      </div>
    </div>
  );
}

function TenantCell({ name, role }) {
  if (!name) return <span className="dep-no-tenant">No tenant</span>;
  return (
    <div className="tm-memberof">
      <span className="tm-memberof__name">{name}</span>
      <RoleChip role={role} />
    </div>
  );
}

function Table({ rows, menuRowId, onToggleMenu }) {
  return (
    <div className="emp-table-responsive">
      <table className="emp-table unit-table dep-table">
        <thead>
          <tr>
            <th scope="col">{COLUMNS[0]}</th>
            <th scope="col">{COLUMNS[1]}</th>
            <th scope="col" className="dep-col-balance">{COLUMNS[2]}</th>
            <th scope="col" className="unit-col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-label={COLUMNS[0]}>
                <div className="dep-unit">
                  <UnitBadge code={row.unitCode} />
                  <span className="dep-unit__tower">{row.tower}</span>
                </div>
              </td>
              <td data-label={COLUMNS[1]}><TenantCell name={row.tenantName} role={row.tenantRole} /></td>
              <td data-label={COLUMNS[2]} className="dep-col-balance">
                <span className={`dep-balance${row.balance > 0 ? '' : ' is-zero'}`}>{formatRupiah(row.balance)}</span>
                {row.unpaidInvoices > 0 && (
                  <span className="dep-chip dep-chip--pending dep-row-pending">
                    {row.unpaidInvoices === 1 ? 'Top up invoice unpaid' : `${row.unpaidInvoices} top up invoices unpaid`}
                  </span>
                )}
                {row.draftInvoices > 0 && (
                  <span className="dep-chip dep-row-pending">
                    {row.draftInvoices === 1 ? 'Invoice draft not sent' : `${row.draftInvoices} invoice drafts not sent`}
                  </span>
                )}
                {row.pendingApprovals > 0 && (
                  <span className="dep-chip dep-chip--pending dep-row-pending">Awaiting approval</span>
                )}
              </td>
              <td className="unit-col-action">
                <button
                  type="button"
                  className={`unit-btn-dots${menuRowId === row.id ? ' is-open' : ''}`}
                  aria-label={`Actions for ${row.unitCode}`}
                  aria-haspopup="menu"
                  aria-expanded={menuRowId === row.id}
                  onClick={(e) => onToggleMenu(row, e.currentTarget)}
                >
                  <DotsThreeVertical size={18} weight="bold" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableFooter({ presenter }) {
  const { currentPage, totalPages, pageItems, setPage, totalRecords, pageSize } = presenter;
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalRecords);
  return (
    <div className="emp-table-footer">
      <div className="emp-table-footer-info">
        Showing <strong className="emp-text-dark">{from}</strong> to{' '}
        <strong className="emp-text-dark">{to}</strong> of{' '}
        <strong className="emp-text-dark">{totalRecords}</strong> units
      </div>
      <div className="emp-pagination-controls" aria-label="Pagination">
        <button
          type="button"
          className="emp-page-btn"
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
          aria-label="Previous page"
        >
          <CaretLeft size={14} weight="bold" />
        </button>
        {pageItems.map((item, i) => (
          item === 'gap' ? (
            <span key={`gap-${i}`} className="emp-page-ellipsis" aria-hidden="true">…</span>
          ) : (
            <button
              key={item}
              type="button"
              className={`emp-page-btn ${currentPage === item ? 'active' : ''}`}
              onClick={() => setPage(item)}
              aria-current={currentPage === item ? 'page' : undefined}
              aria-label={`Page ${item}`}
            >
              {item}
            </button>
          )
        ))}
        <button
          type="button"
          className="emp-page-btn"
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
          aria-label="Next page"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}

export function DepositMonthlyView({ presenter }) {
  const {
    stats, filters, setFilter, resetFilters, hasActiveFilters,
    options, pagedRows, totalRecords, exportExcel, exporting
  } = presenter;
  const [toast, notify] = useActionToast();
  const [menu, setMenu] = useState(null);
  const { selected, panel, panelUnit, panelEntry } = presenter;

  const itemsFor = (row) => {
    const items = [{ key: 'view', label: 'View detail', icon: Eye, run: () => { setMenu(null); presenter.openDetail(row); } }];
    if (!row.tenantName) return items;
    items.push({ key: 'topup', label: 'Top up', icon: Plus, run: () => { setMenu(null); presenter.openPanel(row.id, 'topup'); } });
    if (row.balance > 0) {
      items.push({ key: 'allocate', label: 'Pay bills from balance', icon: Coins, run: () => { setMenu(null); presenter.openPanel(row.id, 'allocate'); } });
    }
    return items;
  };
  const toggleMenu = (row, trigger) => {
    if (menu?.row.id === row.id) { setMenu(null); return; }
    setMenu(rowMenuAnchor({ ...row, name: row.unitCode }, trigger, itemsFor(row).length));
  };
  const closeMenu = (restoreFocus) => {
    if (restoreFocus) menu?.trigger?.focus();
    setMenu(null);
  };

  const onSubmit = (draft) => {
    const { entry, edited } = presenter.submitEntry(draft);
    if (entry.type === 'rule') notify('Auto deduction choices updated.');
    else if (entry.type !== 'topup') notify('Payment from the balance sent for approval.');
    else if (edited) notify(`Draft ${entry.invoice.number} updated.`);
    else notify(`Draft ${entry.invoice.number} saved. Check it, then send it to the tenant.`);
  };

  // Shown over the list and the detail page.
  const overlays = (
    <>
      {panel && panelUnit && (
        <DepositTopUpPanel
          key={`${panel.unitId}-${panel.mode}-${panel.editId ?? 'new'}`}
          mode={panel.mode}
          unit={panelUnit}
          editing={panelEntry}
          onClose={presenter.closePanel}
          onSubmit={onSubmit}
        />
      )}
      <ActionToast message={toast} />
    </>
  );

  if (selected) {
    return (
      <>
        <DepositDetailView
          key={selected.row.id}
          unit={selected}
          invoiceId={presenter.invoiceId}
          onOpenInvoice={presenter.openInvoice}
          onCloseInvoice={presenter.closeInvoice}
          onBack={presenter.closeDetail}
          onTopUp={() => presenter.openPanel(selected.row.id, 'topup')}
          onManage={() => presenter.openPanel(selected.row.id, 'manage')}
          onEditDraft={(entry) => presenter.openPanel(selected.row.id, 'topup', entry.id)}
          onExport={async (unit, shown) => {
            if (!(await presenter.exportHistory(unit, shown))) notify('The export could not be created. Try again.');
          }}
          onDecide={(kind, entry, reason, proofName) => {
            if (kind === 'send') { presenter.sendDraft(entry.id); notify(`${entry.invoice.number} sent to ${selected.row.tenantName}. It is due in 24 hours.`); }
            if (kind === 'discard') { presenter.discardDraft(entry.id); notify(`Draft ${entry.invoice.number} discarded.`); }
            if (kind === 'paid') { presenter.markPaid(entry.id, proofName); notify(`${entry.invoice.number} paid. ${formatRupiah(entry.amount)} is in the deposit and the bills are updated.`); }
            if (kind === 'approve') { presenter.approveEntry(entry.id); notify('Approved. The balance and bills are updated.'); }
            if (kind === 'reject') { presenter.rejectEntry(entry.id, reason); notify('Rejected. The sender can see the reason in the history.'); }
          }}
        />
        {overlays}
      </>
    );
  }

  const onExport = async () => {
    if (!(await exportExcel())) notify('The export could not be created. Try again.');
  };

  return (
    <div className="ws-container unit-page tm-page dep-page">
      <Breadcrumb items={[{ label: 'Finance' }, { label: 'Deposit' }, { label: 'Deposit Monthly' }]} />

      <div className="ws-hero">
        <div className="ws-hero-left">
          <div className="ws-hero-icon-box">
            <Vault size={28} weight="bold" />
          </div>
          <div>
            <div className="ws-hero-tag">FINANCE</div>
            <h1 className="ws-hero-title">Deposit monthly</h1>
            <p className="ws-hero-desc">
              The deposit balance held for each unit, and who it is billed to.
            </p>
          </div>
        </div>
      </div>

      <div className="emp-stats-grid tm-stats-grid">
        <StatCard tone="sum" icon={Wallet} label="Total deposit balance" value={formatRupiah(stats.totalBalance)} />
        <StatCard tone="active" icon={Buildings} label="Units with deposit" value={stats.unitsWithDeposit.toLocaleString('id-ID')} />
        <StatCard tone="total" icon={HourglassMedium} label="Units at zero balance" value={stats.unitsWithoutDeposit.toLocaleString('id-ID')} />
        <StatCard tone="pending" icon={ClockCounterClockwise} label="Unpaid top up invoices" value={stats.unpaidInvoices.toLocaleString('id-ID')} />
      </div>

      <div className="emp-card-container">
        <div className="emp-card-header">
          <div>
            <h2 className="emp-card-title">Unit Deposit</h2>
            <p className="emp-card-desc">One row per unit. A top up is billed as an Other Invoice and enters the balance once that invoice is paid.</p>
          </div>
          <div className="emp-card-actions">
            <button type="button" className="emp-btn-secondary" onClick={onExport} disabled={exporting || totalRecords === 0}>
              <FileXls size={16} weight="bold" aria-hidden="true" />
              <span>{exporting ? 'Exporting…' : 'Export Excel'}</span>
            </button>
          </div>
        </div>

        <div className="emp-search-row unit-filter-row">
          <div className="emp-search-input-group unit-search-group">
            <MagnifyingGlass size={16} weight="bold" className="emp-search-input-icon" aria-hidden="true" />
            <input
              type="text"
              className="emp-search-input"
              aria-label="Search deposits"
              placeholder="Search unit or tenant"
              value={filters.query}
              onChange={(e) => setFilter('query', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            />
            {filters.query && (
              <button type="button" className="unit-search-clear" onClick={() => setFilter('query', '')} aria-label="Clear search">
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          <FilterSelect label="Filter tower or area" value={filters.tower} onChange={(e) => setFilter('tower', e.target.value)}>
            <option value="">All towers and areas</option>
            {options.towers.map((t) => <option key={t} value={t}>{t}</option>)}
          </FilterSelect>

          <FilterSelect label="Filter balance" value={filters.balance} onChange={(e) => setFilter('balance', e.target.value)}>
            <option value="">All balances</option>
            {BALANCE_FILTERS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </FilterSelect>

          <button type="button" className="emp-btn-secondary" onClick={resetFilters} disabled={!hasActiveFilters}>
            <ArrowsClockwise size={16} weight="bold" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>

        <div className="emp-card-body">
          <div className="emp-table-card-inner">
            {totalRecords === 0 ? (
              <div className="unit-empty">
                <Vault size={36} color="#cbd5e1" aria-hidden="true" />
                <h3>{hasActiveFilters ? 'No units match these filters' : 'No unit deposits yet'}</h3>
                <p>{hasActiveFilters ? 'Change or reset the filters to see more.' : 'Units appear here once they are registered.'}</p>
              </div>
            ) : (
              <>
                <Table rows={pagedRows} menuRowId={menu?.row.id} onToggleMenu={toggleMenu} />
                <TableFooter presenter={presenter} />
              </>
            )}
          </div>
        </div>
      </div>

      {menu && <RowActionMenu anchor={menu} items={itemsFor(menu.row)} onClose={closeMenu} />}
      {overlays}
    </div>
  );
}

export default DepositMonthlyView;
