import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Plus,
  FileArrowUp,
  FileArrowDown,
  FileXls,
  MagnifyingGlass,
  ArrowsClockwise,
  CaretLeft,
  CaretRight,
  CaretDown,
  Table,
  GridFour,
  House,
  Storefront,
  Elevator,
  Buildings,
  CheckCircle,
  DotsThreeVertical,
  Eye,
  MapPin,
  PencilSimple,
  UserCircle,
  X
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import { AddMenuButton, ActionToast, useActionToast, runTemplateDownload } from '../components/AddMenuButton';
import { downloadUnitImportTemplate } from '../../utils/excelExport';
import {
  UNIT_CATEGORIES,
  getStatusOptions,
  getCategory,
  getStatusLabel,
  getOccupant,
  describeOccupant,
  initialsOf
} from '../../models/UnitModel';
import '../employee/employee.css';
import '../schedule/work-schedule.css';
import { AddUnitView } from './AddUnitView';
import { UnitDetailView } from './UnitDetailView';
import { UnitTemplateDialog } from './UnitTemplateDialog';
import { UnitImportModal } from './UnitImportModal';
import './unit.css';

const TAB_ICONS = { hunian: House, non_hunian: Storefront, non_unit: Elevator };

const TAB_HINTS = {
  hunian: 'Units people live in.',
  non_hunian: 'Retail, F&B, and offices.',
  non_unit: 'Facilities owned by P3SRS.'
};

const COLUMNS = {
  hunian: ['Unit', 'Location', 'Owner', 'Occupant', 'Status'],
  non_hunian: ['Unit', 'Location', 'Owner', 'Occupant', 'Status'],
  non_unit: ['Unit', 'Location', 'Owner', 'Occupant', 'Status']
};

function unitTitle(unit) {
  return unit.code;
}

function floorLabel(unit) {
  return /^\d+$/.test(unit.floor) ? `Floor ${unit.floor}` : unit.floor;
}

function unitLocation(unit) {
  return `${unit.tower} · ${floorLabel(unit)}`;
}

function StatusBadge({ unit }) {
  return (
    <span className={`unit-status unit-status--${unit.status}`}>
      {getStatusLabel(unit.category, unit.status)}
    </span>
  );
}

function cellsFor(unit) {
  const none = <span className="unit-muted">None</span>;
  const title = (
    <>
      <span className="ws-emp-name-bold">{unitTitle(unit)}</span>
    </>
  );
  const status = <StatusBadge key="s" unit={unit} />;
  const location = (
    <>
      <span className="ws-emp-name-bold">{unit.tower}</span>
      <span className="ws-emp-email-muted">{floorLabel(unit)}</span>
    </>
  );
  const owner = unit.ownerName
    ? <span className="unit-owner">{unit.ownerName}</span>
    : <span className="unit-muted">Not assigned</span>;
  const who = getOccupant(unit);
  const occupant = who ? (
    <>
      <span className="ws-emp-name-bold">{who.name}</span>
      <span className="ws-emp-email-muted">{describeOccupant(who)}</span>
    </>
  ) : none;
  return [title, location, owner, occupant, status];
}

const MENU_HEIGHT = 92;

// The three-dot trigger shared by the table rows and the cards.
function ActionButton({ unit, open, onToggle }) {
  return (
    <button
      type="button"
      className={`unit-btn-dots${open ? ' is-open' : ''}`}
      title="Actions"
      aria-label={`Actions for ${unitTitle(unit)}`}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={(e) => onToggle(unit, e.currentTarget)}
    >
      <DotsThreeVertical size={18} weight="bold" />
    </button>
  );
}

// Portal menu with View detail and Edit. Closes on outside click, scroll, resize, Tab, and Escape.
function UnitActionMenu({ anchor, onClose, onView, onEdit }) {
  const ref = useRef(null);

  useEffect(() => {
    const items = () => [...(ref.current?.querySelectorAll('[role="menuitem"]') ?? [])];
    items()[0]?.focus({ preventScroll: true });

    const onDown = (e) => {
      if (ref.current?.contains(e.target) || anchor.trigger?.contains(e.target)) return;
      onClose(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(true);
      } else if (e.key === 'Tab') {
        onClose(false);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const list = items();
        const at = list.indexOf(document.activeElement);
        const step = e.key === 'ArrowDown' ? 1 : -1;
        list[(at + step + list.length) % list.length]?.focus({ preventScroll: true });
      }
    };
    const away = () => onClose(false);

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', away, true);
    window.addEventListener('resize', away);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', away, true);
      window.removeEventListener('resize', away);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={ref}
      className="unit-action-menu"
      role="menu"
      aria-label={`Actions for ${unitTitle(anchor.unit)}`}
      style={{ position: 'fixed', top: `${anchor.top}px`, right: `${anchor.right}px`, zIndex: 99999 }}
    >
      <button type="button" role="menuitem" className="unit-action-menu__item" onClick={() => onView(anchor.unit)}>
        <Eye size={16} weight="bold" aria-hidden="true" />
        <span>View detail</span>
      </button>
      <button type="button" role="menuitem" className="unit-action-menu__item" onClick={() => onEdit(anchor.unit)}>
        <PencilSimple size={16} weight="bold" aria-hidden="true" />
        <span>Edit</span>
      </button>
    </div>,
    document.body
  );
}

function UnitTable({ category, units, menuUnitId, onToggleMenu }) {
  const columns = COLUMNS[category];
  return (
    <div className="emp-table-responsive">
      <table className="emp-table unit-table">
        <thead>
          <tr>
            {columns.map((c) => <th key={c} scope="col">{c}</th>)}
            <th scope="col" className="unit-col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.id}>
              {cellsFor(unit).map((cell, i) => (
                <td key={columns[i]} data-label={columns[i]} className={i === 0 ? 'unit-cell-main' : undefined}>
                  {cell}
                </td>
              ))}
              <td className="unit-col-action">
                <ActionButton unit={unit} open={menuUnitId === unit.id} onToggle={onToggleMenu} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PersonRow({ label, name, caption, tone, emptyText = 'No one yet' }) {
  return (
    <div className={`unit-card__person unit-card__person--${tone}`}>
      <span className="unit-card__avatar" aria-hidden="true">
        {name ? initialsOf(name) : <UserCircle size={22} />}
      </span>
      <div className="unit-card__person-text">
        <span className="unit-card__person-label">{label}</span>
        <span className="unit-card__person-name">{name || emptyText}</span>
        {caption && <span className="unit-card__person-role">{caption}</span>}
      </div>
    </div>
  );
}

function UnitCards({ units, onOpen, menuUnitId, onToggleMenu }) {
  return (
    <div className="unit-cards">
      {units.map((unit) => {
        const who = getOccupant(unit);

        return (
          <article key={unit.id} className={`unit-card unit-card--${unit.status}`}>
            <header className="unit-card__head">
              <div className="unit-card__id">
                <h3 className="unit-card__title">{unitTitle(unit)}</h3>
                <p className="unit-card__loc">
                  <MapPin size={14} weight="bold" aria-hidden="true" />
                  <span>{unitLocation(unit)}</span>
                </p>
              </div>
              <div className="unit-card__head-actions">
                <StatusBadge unit={unit} />
                <ActionButton unit={unit} open={menuUnitId === unit.id} onToggle={onToggleMenu} />
              </div>
            </header>

            <div className="unit-card__persons">
              <PersonRow label="Owner" name={unit.ownerName} emptyText="Not assigned" tone="owner" />
              <PersonRow label="Occupant" name={who?.name} caption={describeOccupant(who)} tone="second" />
            </div>

            <footer className="unit-card__foot">
              <button
                type="button"
                className="unit-card__link unit-card__open"
                aria-label={`View detail of ${unitTitle(unit)}`}
                onClick={() => onOpen(unit)}
              >
                <span>View detail</span>
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </button>
            </footer>
          </article>
        );
      })}
    </div>
  );
}

function TableFooter({ presenter }) {
  const { currentPage, totalPages, pageItems, setPage, totalRecords, pageSize } = presenter;
  const from = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalRecords);
  return (
    <div className="emp-table-footer">
      <div className="emp-table-footer-info">
        Showing <strong className="emp-text-dark">{from}</strong> to{' '}
        <strong className="emp-text-dark">{to}</strong> of{' '}
        <strong className="emp-text-dark">{totalRecords}</strong> units
      </div>
      <div className="emp-pagination-controls" aria-label="Unit pagination">
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

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="unit-select-wrap">
      <select aria-label={label} className="emp-search-input unit-select" value={value} onChange={onChange}>
        {children}
      </select>
      <CaretDown size={14} weight="bold" className="unit-select-caret" aria-hidden="true" />
    </div>
  );
}

function SuccessModal({ title, subtext, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="emp-modal-backdrop" onClick={onClose}>
      <div
        className="emp-modal-card text-center unit-success"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unit-success-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="emp-modal-close unit-success__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <div className="d-flex justify-content-center unit-success__icon">
          <CheckCircle size={64} weight="fill" color="#10B981" />
        </div>
        <h4 id="unit-success-title" className="unit-success__title">{title}</h4>
        <p className="unit-success__text">{subtext}</p>
      </div>
    </div>
  );
}

const ADD_UNIT_MENU = [
  { id: 'manual', title: 'Add Unit Manually', desc: 'Fill in unit details directly via form', Icon: Plus, tone: '' },
  'divider',
  { id: 'import', title: 'Import Units (Excel)', desc: 'Bulk upload units from a filled template', Icon: FileArrowUp, tone: 'secondary' },
  { id: 'template', title: 'Download Template Unit', desc: 'Pick Residential, Non-Residential, or Non-Unit', Icon: FileArrowDown, tone: 'download' }
];

export function UnitView({ presenter }) {
  const {
    activeTab, setActiveTab, counts, viewMode, setViewMode, totalRecords, pagedUnits,
    filters, setFilter, options, hasActiveFilters, resetFilters,
    selectedUnit, openDetail, closeDetail,
    pageMode, startAdd, startEdit, exportExcel, exporting, successModal, closeSuccessModal
  } = presenter;

  const category = getCategory(activeTab);
  const tabRefs = useRef({});
  const [toast, notify] = useActionToast();
  const [templateOpen, setTemplateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const onAddSelect = (id) => {
    if (id === 'manual') startAdd();
    else if (id === 'import') setImportOpen(true);
    else setTemplateOpen(true);
  };
  const [menu, setMenu] = useState(null);

  const closeMenu = (restoreFocus) => {
    if (restoreFocus) menu?.trigger?.focus();
    setMenu(null);
  };

  const toggleMenu = (unit, trigger) => {
    if (menu?.unit.id === unit.id) {
      setMenu(null);
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const openUp = window.innerHeight - rect.bottom < MENU_HEIGHT + 16;
    setMenu({
      unit,
      trigger,
      top: openUp ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right)
    });
  };

  if (pageMode === 'add' || pageMode === 'edit') return <AddUnitView presenter={presenter} />;
  if (pageMode === 'detail' && selectedUnit) return <UnitDetailView unit={selectedUnit} onBack={closeDetail} />;

  const onTabKeyDown = (e, index) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = UNIT_CATEGORIES[(index + step + UNIT_CATEGORIES.length) % UNIT_CATEGORIES.length];
    setActiveTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <div className="ws-container unit-page">
      <Breadcrumb items={[{ label: 'Unit' }, { label: 'List Unit' }]} />

      <div className="ws-hero">
        <div className="ws-hero-left">
          <div className="ws-hero-icon-box">
            <Buildings size={28} weight="bold" />
          </div>
          <div>
            <div className="ws-hero-tag">MASTER TABLE</div>
            <h1 className="ws-hero-title">Unit</h1>
            <p className="ws-hero-desc">
              Residential units, commercial units, and building facilities, grouped by how the building uses them.
            </p>
          </div>
        </div>
      </div>

      <div className="emp-card-container">
        <div className="emp-card-header">
          <div>
            <h2 className="emp-card-title">{category.label}</h2>
            <p className="emp-card-desc">{TAB_HINTS[activeTab]}</p>
          </div>
          <div className="emp-card-actions">
            <div className="ws-toolbar-tabs" role="tablist" aria-label="Unit category">
              {UNIT_CATEGORIES.map((c, i) => {
                const active = c.id === activeTab;
                const Icon = TAB_ICONS[c.id];
                return (
                  <button
                    key={c.id}
                    ref={(el) => { tabRefs.current[c.id] = el; }}
                    type="button"
                    role="tab"
                    id={`unit-tab-${c.id}`}
                    aria-selected={active}
                    aria-controls="unit-panel"
                    tabIndex={active ? 0 : -1}
                    className={`ws-toolbar-tab ${active ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(c.id)}
                    onKeyDown={(e) => onTabKeyDown(e, i)}
                  >
                    <Icon size={15} weight={active ? 'bold' : 'regular'} aria-hidden="true" />
                    <span>{c.label}</span>
                    <span className="unit-tab-count">{counts[c.id]}</span>
                  </button>
                );
              })}
            </div>

            <button type="button" className="emp-btn-secondary" onClick={exportExcel} disabled={totalRecords === 0 || exporting}>
              <FileXls size={16} weight="bold" aria-hidden="true" />
              <span>{exporting ? 'Exporting…' : 'Export Excel'}</span>
            </button>

            <AddMenuButton label="Add Unit" items={ADD_UNIT_MENU} onSelect={onAddSelect} />
          </div>
        </div>

        <div className="emp-search-row unit-filter-row">
          <div className="emp-search-input-group unit-search-group">
            <MagnifyingGlass size={16} weight="bold" className="emp-search-input-icon" aria-hidden="true" />
            <input
              type="text"
              className="emp-search-input"
              aria-label="Search units"
              placeholder="Search code, name, owner, occupant"
              value={filters.query}
              onChange={(e) => setFilter('query', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            />
            {filters.query && (
              <button
                type="button"
                className="unit-search-clear"
                onClick={() => setFilter('query', '')}
                aria-label="Clear search"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          <FilterSelect
            label={activeTab === 'non_unit' ? 'Filter tower or area' : 'Filter tower'}
            value={filters.tower}
            onChange={(e) => setFilter('tower', e.target.value)}
          >
            <option value="">{activeTab === 'non_unit' ? 'All towers and areas' : 'All towers'}</option>
            {options.towers.map((t) => <option key={t} value={t}>{t}</option>)}
          </FilterSelect>

          <FilterSelect label="Filter floor" value={filters.floor} onChange={(e) => setFilter('floor', e.target.value)}>
            <option value="">All floors</option>
            {options.floors.map((f) => <option key={f} value={f}>{f}</option>)}
          </FilterSelect>

          <FilterSelect label="Filter status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {getStatusOptions(activeTab).map((s) => (
              <option key={s} value={s}>{getStatusLabel(activeTab, s)}</option>
            ))}
          </FilterSelect>

          <button type="button" className="emp-btn-secondary" onClick={resetFilters} disabled={!hasActiveFilters}>
            <ArrowsClockwise size={16} weight="bold" aria-hidden="true" />
            <span>Reset</span>
          </button>

          <div className="ws-toolbar-tabs unit-view-toggle" role="group" aria-label="Layout">
            <button
              type="button"
              className={`ws-toolbar-tab ${viewMode === 'table' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
            >
              <Table size={14} weight="bold" aria-hidden="true" />
              <span>Table</span>
            </button>
            <button
              type="button"
              className={`ws-toolbar-tab ${viewMode === 'cards' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
            >
              <GridFour size={14} weight="bold" aria-hidden="true" />
              <span>Cards</span>
            </button>
          </div>
        </div>

        <div className="emp-card-body" id="unit-panel" role="tabpanel" aria-labelledby={`unit-tab-${activeTab}`}>
          <div className="emp-table-card-inner">
            {totalRecords === 0 ? (
              <div className="unit-empty">
                <Buildings size={36} color="#cbd5e1" aria-hidden="true" />
                <h3>{hasActiveFilters ? 'No units match these filters' : 'No units in this category yet'}</h3>
                <p>
                  {hasActiveFilters
                    ? 'Change or reset the filters to see more.'
                    : 'Use Add Unit to create the first one.'}
                </p>
              </div>
            ) : viewMode === 'table' ? (
              <UnitTable category={activeTab} units={pagedUnits} menuUnitId={menu?.unit.id} onToggleMenu={toggleMenu} />
            ) : (
              <UnitCards units={pagedUnits} onOpen={openDetail} menuUnitId={menu?.unit.id} onToggleMenu={toggleMenu} />
            )}
            {totalRecords > 0 && <TableFooter presenter={presenter} />}
          </div>
        </div>
      </div>

      {menu && (
        <UnitActionMenu
          anchor={menu}
          onClose={closeMenu}
          onView={(unit) => { setMenu(null); openDetail(unit); }}
          onEdit={(unit) => { setMenu(null); startEdit(unit); }}
        />
      )}
      {importOpen && (
        <UnitImportModal
          initialType={activeTab}
          prepare={presenter.prepareUnitImport}
          onClose={() => setImportOpen(false)}
          onImport={(units) => {
            if (presenter.importUnits(units)) setImportOpen(false);
            else notify('The units could not be saved. Try again.');
          }}
        />
      )}
      {templateOpen && (
        <UnitTemplateDialog
          initialType={activeTab}
          onCancel={() => setTemplateOpen(false)}
          onDownload={async (type) => {
            await runTemplateDownload(() => downloadUnitImportTemplate(type), notify);
            setTemplateOpen(false);
          }}
        />
      )}
      <ActionToast message={toast} />
      {successModal && (
        <SuccessModal title={successModal.title} subtext={successModal.subtext} onClose={closeSuccessModal} />
      )}
    </div>
  );
}

export default UnitView;
