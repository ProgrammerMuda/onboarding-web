import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  UsersThree,
  UserCircle,
  House,
  ShieldCheck,
  Key,
  Handshake,
  User,
  FileXls,
  DotsThreeVertical,
  Check,
  CheckCircle,
  Eye,
  Warning,
  PencilSimple,
  Prohibit,
  Plus,
  MagnifyingGlass,
  ArrowsClockwise,
  CaretDown,
  CaretLeft,
  CaretRight,
  X
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  TENANT_MEMBER_TABS,
  TENANT_STATUSES,
  MEMBER_STATUSES
} from '../../models/TenantMemberModel';
import { initialsOf } from '../../models/UnitModel';
import '../employee/employee.css';
import '../schedule/work-schedule.css';
import '../unit/unit.css';
import { AddTenantMemberView } from './AddTenantMemberView';
import { TenantMemberDetailView } from './TenantMemberDetailView';
import { TenantRenterDetailView } from './TenantRenterDetailView';
import './tenant-member.css';

const ITEM_HEIGHT = 38;

const COLUMNS = {
  tenant: ['Tenant', 'Relation', 'Member of', 'Units', 'Status'],
  member: ['Member', 'Relation', 'Member of', 'Units', 'Status']
};

const TAB_HINTS = {
  tenant: 'Renters, the units they rent, and whether they live there.',
  member: 'Family and staff registered under a tenant, and their approval status.'
};

function PersonCell({ name, email }) {
  return (
    <div className="tm-person">
      <span className="tm-avatar" aria-hidden="true">{initialsOf(name)}</span>
      <div className="tm-person__text">
        <span className="ws-emp-name-bold">{name}</span>
        <span className="ws-emp-email-muted">{email}</span>
      </div>
    </div>
  );
}

function UnitBadge({ code }) {
  return (
    <span className="tm-unit-badge">
      <House size={14} weight="bold" aria-hidden="true" />
      <span>{code}</span>
    </span>
  );
}

function StatusPill({ status }) {
  return <span className={`tm-status tm-status--${status.toLowerCase()}`}>{status}</span>;
}

const ROLE_ICONS = { Owner: Key, Renter: Handshake, Proxy: ShieldCheck };

// Who this person belongs to and that person's role. One line, so every row has the same height.
function MemberOfCell({ name, role }) {
  const Icon = ROLE_ICONS[role];
  return (
    <div className="tm-memberof">
      <span className="tm-memberof__name">{name}</span>
      <span className="tm-role-chip">
        <Icon size={14} weight="bold" aria-hidden="true" />
        {role}
      </span>
    </div>
  );
}

function cellsFor(tab, row) {
  const person = <PersonCell name={row.name} email={row.email} />;
  const relation = row.isProxy ? (
    <span className="tm-memberof">
      <span className="tm-relation">{row.relation}</span>
      <span className="tm-role-chip"><ShieldCheck size={14} weight="bold" aria-hidden="true" />Proxy</span>
    </span>
  ) : <span className="tm-relation">{row.relation}</span>;
  const units = <UnitBadge code={row.unitCodes[0]} />;
  const status = <StatusPill status={row.status} />;
  return tab === 'member'
    ? [person, relation, <MemberOfCell name={row.tenantName} role={row.parentRole} />, units, status]
    : [person, relation, <MemberOfCell name={row.ownerName} role="Owner" />, units, status];
}

function Table({ tab, rows, menuRowId, onToggleMenu }) {
  const columns = COLUMNS[tab];
  return (
    <div className="emp-table-responsive">
      <table className="emp-table tm-table">
        <thead>
          <tr>
            {columns.map((c) => <th key={c} scope="col">{c}</th>)}
            <th scope="col" className="unit-col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {cellsFor(tab, row).map((cell, i) => (
                <td key={columns[i]} data-label={columns[i]}>{cell}</td>
              ))}
              <td className="unit-col-action">
                <button
                  type="button"
                  className={`unit-btn-dots${menuRowId === row.id ? ' is-open' : ''}`}
                  aria-label={`Actions for ${row.name}`}
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

// Portal menu; closes on outside click, scroll, resize, Tab, and Escape.
function RowActionMenu({ anchor, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const list = () => [...(ref.current?.querySelectorAll('[role="menuitem"]') ?? [])];
    list()[0]?.focus({ preventScroll: true });

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
        const els = list();
        const at = els.indexOf(document.activeElement);
        const step = e.key === 'ArrowDown' ? 1 : -1;
        els[(at + step + els.length) % els.length]?.focus({ preventScroll: true });
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
      aria-label={`Actions for ${anchor.row.name}`}
      style={{ position: 'fixed', top: `${anchor.top}px`, right: `${anchor.right}px`, zIndex: 99999 }}
    >
      {items.map(({ key, label, icon: Icon, run, danger, success }) => (
        <button key={key} type="button" role="menuitem" className={`unit-action-menu__item${danger ? ' tm-menu-danger' : ''}${success ? ' tm-menu-success' : ''}`} onClick={run}>
          <Icon size={16} weight="bold" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
}

const REJECT_PRESETS = ['ID number does not match the KTP', 'Relation could not be verified', 'Supporting document is incomplete'];

function ModalShell({ labelledBy, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="emp-modal-backdrop" onClick={onClose}>
      <div
        className="emp-modal-card tm-decide"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// Approve or reject a Pending member, laid out like the installment approval dialogs.
// Rejecting needs a reason, which is shown on the member's page.
function ApprovalDialog({ change, onConfirm, onCancel }) {
  const { row, action } = change;
  const approving = action === 'approve';
  const [reason, setReason] = useState('');
  const firstRef = useRef(null);
  useEffect(() => { firstRef.current?.focus(); }, []);
  const doors = row.doorAccess ?? [];

  return (
    <ModalShell labelledBy="tm-decide-title" onClose={onCancel}>
      <div className="tm-decide__head">
        <span className={`tm-decide__icon ${approving ? 'is-approve' : 'is-reject'}`}>
          {approving ? <CheckCircle size={24} weight="bold" /> : <Warning size={24} weight="bold" />}
        </span>
        <div>
          <h3 className="tm-decide__title" id="tm-decide-title">{approving ? 'Approve Tenant Member?' : 'Reject Tenant Member?'}</h3>
          <span className="tm-decide__sub">
            {approving ? `Authorize door access for ${row.name}` : `State the reason for rejecting ${row.name}`}
          </span>
        </div>
      </div>

      {approving ? (
        <>
          <div className="tm-decide__summary">
            <div><span>Member</span><strong>{row.name}</strong></div>
            <div><span>Unit</span><strong>{row.unitCodes[0]} · {row.towers[0]}</strong></div>
            <div><span>Member of</span><strong>{row.tenantName} ({row.parentRole})</strong></div>
            <div><span>Doors</span><strong>{doors.length} {doors.length === 1 ? 'door' : 'doors'}</strong></div>
          </div>
          <p className="tm-decide__text">
            By confirming, <strong>{row.name}</strong> becomes <strong>Active</strong> and can open the doors set for this member.
          </p>
        </>
      ) : (
        <div className="tm-decide__field">
          <label htmlFor="tm-reject-reason">Rejection Reason <span className="req">*</span></label>
          <textarea
            id="tm-reject-reason"
            ref={firstRef}
            rows={3}
            maxLength={200}
            className="form-control add-emp-input"
            placeholder="e.g. the ID number does not match the KTP, or the relation could not be verified..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="tm-decide__presets">
            {REJECT_PRESETS.map((preset) => (
              <button key={preset} type="button" onClick={() => setReason(preset)}>+ {preset}</button>
            ))}
          </div>
        </div>
      )}

      <div className="tm-decide__foot">
        <button type="button" className="emp-btn-secondary" onClick={onCancel}>Cancel</button>
        {approving ? (
          <button ref={firstRef} type="button" className="emp-btn-primary tm-btn-success" onClick={() => onConfirm('')}>
            <Check size={16} weight="bold" aria-hidden="true" />
            <span>Yes, Approve Member</span>
          </button>
        ) : (
          <button
            type="button"
            className="emp-btn-primary tm-btn-danger"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            <X size={15} weight="bold" aria-hidden="true" />
            <span>Confirm Rejection</span>
          </button>
        )}
      </div>
    </ModalShell>
  );
}

// Shown after an approval: what was approved and the new status.
function ApprovedModal({ member, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => { closeRef.current?.focus(); }, []);

  return (
    <ModalShell labelledBy="tm-approved-title" onClose={onClose}>
      <button type="button" className="tm-decide__close" onClick={onClose} aria-label="Close">
        <X size={18} weight="bold" />
      </button>
      <div className="tm-approved">
        <span className="tm-approved__icon"><CheckCircle size={32} weight="fill" /></span>
        <h3 className="tm-decide__title" id="tm-approved-title">Tenant Member Approved</h3>
        <p className="tm-decide__text">
          <strong>{member.name}</strong> has been approved and is now <strong>ACTIVE</strong>.
        </p>
        <div className="tm-decide__list">
          <div><span>Member:</span><strong>{member.name}</strong></div>
          <div><span>Unit:</span><strong>{member.unitCode}</strong></div>
          <div><span>Member of:</span><strong>{member.parentName} ({member.parentRole})</strong></div>
          <div className="is-last"><span>Status:</span><strong className="is-active">Active</strong></div>
        </div>
        <button ref={closeRef} type="button" className="emp-btn-primary tm-approved__ok" onClick={onClose}>Done</button>
      </div>
    </ModalShell>
  );
}

// Confirms a status change. `change` is { row, action: 'activate' | 'deactivate', kind: 'renter' | 'member', returnsTo }.
function StatusDialog({ change, onConfirm, onCancel }) {
  const { row, action, kind, returnsTo } = change;
  const activating = action === 'activate';
  const noun = kind === 'renter' ? 'tenant' : 'member';
  const cancelRef = useRef(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  let text;
  if (activating) {
    const back = returnsTo === 'Pending' ? 'waiting for approval' : 'Active';
    text = kind === 'renter'
      ? `${row.name} goes back to ${back} and can open the doors in ${row.unitCodes.join(', ')} again.`
      : `${row.name} goes back to ${back} on ${row.tenantName}'s member list and can open the doors in ${row.unitCodes[0]} again.`;
  } else {
    text = kind === 'renter'
      ? `${row.name} stays on the tenant list as Inactive and can no longer open any door in ${row.unitCodes.join(', ')}. Their members are not changed.`
      : `${row.name} stays on ${row.tenantName}'s member list as Inactive and can no longer open any door in ${row.unitCodes[0]}.`;
  }

  return (
    <div className="emp-modal-backdrop" onClick={onCancel}>
      <div
        className="emp-modal-card tm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="tm-status-title"
        aria-describedby="tm-status-text"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="tm-dialog__title" id="tm-status-title">{activating ? 'Activate' : 'Deactivate'} {row.name}?</h2>
        <p className="tm-dialog__text" id="tm-status-text">{text}</p>
        <div className="tm-dialog__foot">
          <button ref={cancelRef} type="button" className="emp-btn-secondary" onClick={onCancel}>
            {activating ? 'Keep inactive' : 'Keep active'}
          </button>
          <button
            type="button"
            className={`emp-btn-primary ${activating ? 'tm-btn-success' : 'tm-btn-danger'}`}
            onClick={onConfirm}
          >
            {activating ? 'Activate' : 'Deactivate'} {noun}
          </button>
        </div>
      </div>
    </div>
  );
}

function TableFooter({ presenter }) {
  const { currentPage, totalPages, pageItems, setPage, totalRecords, pageSize, activeTab } = presenter;
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalRecords);
  const noun = activeTab === 'member' ? 'members' : 'tenants';
  return (
    <div className="emp-table-footer">
      <div className="emp-table-footer-info">
        Showing <strong className="emp-text-dark">{from}</strong> to{' '}
        <strong className="emp-text-dark">{to}</strong> of{' '}
        <strong className="emp-text-dark">{totalRecords}</strong> {noun}
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

function FilterSelect({ label, children, ...rest }) {
  return (
    <div className="unit-select-wrap">
      <select aria-label={rest.id ? undefined : label} className="emp-search-input unit-select" {...rest}>
        {children}
      </select>
      <CaretDown size={14} weight="bold" className="unit-select-caret" aria-hidden="true" />
    </div>
  );
}

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

function successCopy(m) {
  if (m.kind === 'edit') return { title: 'Changes saved', text: `${m.name}'s details are updated.`, button: 'Done' };
  if (m.kind === 'activate') {
    return {
      title: m.entity === 'tenant' ? 'Tenant activated' : 'Member activated',
      text: m.status === 'Pending'
        ? `${m.name} is back to waiting for approval.`
        : `${m.name} is active again and can open their doors.`,
      button: 'Done'
    };
  }
  return {
    title: 'Sent for approval',
    text: `${m.name} is waiting for approval. Once approved, they join ${m.parentName}'s members in ${m.unitCode}.`,
    button: 'View in list'
  };
}

function SuccessModal({ member, onClose }) {
  const copy = successCopy(member);
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
        aria-labelledby="tm-success-title"
        aria-describedby="tm-success-text"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="emp-modal-close unit-success__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <div className="d-flex justify-content-center unit-success__icon">
          <CheckCircle size={64} weight="fill" color="#10B981" />
        </div>
        <h4 id="tm-success-title" className="unit-success__title">{copy.title}</h4>
        <p id="tm-success-text" className="unit-success__text">{copy.text}</p>
        <button ref={closeRef} type="button" className="emp-btn-primary tm-success__ok" onClick={onClose}>
          {copy.button}
        </button>
      </div>
    </div>
  );
}

export function TenantMemberView({ presenter }) {
  const {
    activeTab, setActiveTab, stats, filters, setFilter, resetFilters, hasActiveFilters,
    options, pagedRows, totalRecords, exportExcel, exporting
  } = presenter;
  const tabRefs = useRef({});
  const [menu, setMenu] = useState(null);
  const [statusChange, setStatusChange] = useState(null);
  const [approval, setApproval] = useState(null);
  const askDeactivate = (row, kind) => setStatusChange({ row, kind, action: 'deactivate' });
  const askActivate = (row, kind) => setStatusChange({
    row, kind, action: 'activate', returnsTo: presenter.statusBeforeDeactivation(row.id, kind)
  });

  // Member rows: View detail, Edit, Deactivate member (left out once the member is Inactive).
  const itemsFor = (row) => {
    if (activeTab === 'tenant') {
      const items = [
        { key: 'view', label: 'View detail', icon: Eye, run: () => { setMenu(null); presenter.openRenterDetail(row); } },
        { key: 'edit', label: 'Edit', icon: PencilSimple, run: () => { setMenu(null); presenter.startRenterEdit(row); } }
      ];
      if (row.status === 'Inactive') {
        items.push({ key: 'activate', label: 'Activate tenant', icon: CheckCircle, success: true, run: () => { setMenu(null); askActivate(row, 'renter'); } });
      } else {
        items.push({ key: 'deactivate', label: 'Deactivate tenant', icon: Prohibit, danger: true, run: () => { setMenu(null); askDeactivate(row, 'renter'); } });
      }
      return items;
    }
    const items = [
      { key: 'view', label: 'View detail', icon: Eye, run: () => { setMenu(null); presenter.openDetail(row); } },
      { key: 'edit', label: 'Edit', icon: PencilSimple, run: () => { setMenu(null); presenter.startEdit(row); } }
    ];
    if (row.status === 'Rejected') return items;
    if (row.status === 'Inactive') {
      items.push({ key: 'activate', label: 'Activate member', icon: CheckCircle, success: true, run: () => { setMenu(null); askActivate(row, 'member'); } });
    } else {
      items.push({ key: 'deactivate', label: 'Deactivate member', icon: Prohibit, danger: true, run: () => { setMenu(null); askDeactivate(row, 'member'); } });
    }
    return items;
  };

  // Shown over every page mode: the list, the wizard, and the detail page.
  const overlays = (
    <>
      {presenter.successModal && (presenter.successModal.kind === 'approve'
        ? <ApprovedModal member={presenter.successModal} onClose={presenter.closeSuccessModal} />
        : <SuccessModal member={presenter.successModal} onClose={presenter.closeSuccessModal} />)}
      {approval && (
        <ApprovalDialog
          change={approval}
          onCancel={() => setApproval(null)}
          onConfirm={(reason) => {
            if (approval.action === 'approve') presenter.approveMember(approval.row);
            else presenter.rejectMember(approval.row, reason);
            setApproval(null);
          }}
        />
      )}
      {statusChange && (
        <StatusDialog
          change={statusChange}
          onCancel={() => setStatusChange(null)}
          onConfirm={() => {
            const { row, kind, action } = statusChange;
            if (action === 'activate') (kind === 'renter' ? presenter.activateRenter : presenter.activateMember)(row.id);
            else (kind === 'renter' ? presenter.deactivateRenter : presenter.deactivateMember)(row.id);
            setStatusChange(null);
          }}
        />
      )}
    </>
  );

  const closeMenu = (restoreFocus) => {
    if (restoreFocus) menu?.trigger?.focus();
    setMenu(null);
  };

  const toggleMenu = (row, trigger) => {
    if (menu?.row.id === row.id) {
      setMenu(null);
      return;
    }
    const height = itemsFor(row).length * ITEM_HEIGHT + 14;
    const rect = trigger.getBoundingClientRect();
    const openUp = window.innerHeight - rect.bottom < height + 16;
    setMenu({
      row,
      trigger,
      top: openUp ? rect.top - height - 4 : rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right)
    });
  };

  if (presenter.pageMode === 'add' || presenter.pageMode === 'edit') {
    return <>{<AddTenantMemberView presenter={presenter} />}{overlays}</>;
  }
  if (presenter.pageMode === 'renter-edit') {
    return <>{<AddTenantMemberView presenter={presenter} />}{overlays}</>;
  }
  if (presenter.pageMode === 'renter-detail' && presenter.selectedRenter) {
    const renter = presenter.selectedRenter;
    return (
      <>
        <TenantRenterDetailView
          renter={renter}
          members={presenter.selectedRenterMembers}
          onBack={presenter.closeRenterDetail}
          onViewMembers={() => presenter.viewMembersOf(renter.name)}
        />
        {overlays}
      </>
    );
  }
  if (presenter.pageMode === 'detail' && presenter.selectedMember) {
    const member = presenter.selectedMember;
    return (
      <>
        <TenantMemberDetailView
          member={member}
          onBack={presenter.closeDetail}
          feedback={presenter.feedback}
          onDismissFeedback={presenter.dismissFeedback}
          onApprove={() => setApproval({ row: member, action: 'approve' })}
          onReject={() => setApproval({ row: member, action: 'reject' })}
        />
        {overlays}
      </>
    );
  }

  const onTabKeyDown = (e, index) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = TENANT_MEMBER_TABS[(index + step + TENANT_MEMBER_TABS.length) % TENANT_MEMBER_TABS.length];
    setActiveTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  const isMember = activeTab === 'member';
  const title = isMember ? 'Members' : 'Tenants';

  return (
    <div className="ws-container unit-page tm-page">
      <Breadcrumb items={[{ label: 'Tenant Management' }, { label: 'Tenant Member' }]} />

      <div className="ws-hero">
        <div className="ws-hero-left">
          <div className="ws-hero-icon-box">
            <UsersThree size={28} weight="bold" />
          </div>
          <div>
            <div className="ws-hero-tag">TENANT MANAGEMENT</div>
            <h1 className="ws-hero-title">Tenant member directory</h1>
            <p className="ws-hero-desc">
              Renters, the family and staff registered under them, and who still waits for approval.
            </p>
          </div>
        </div>
      </div>

      <div className="emp-stats-grid tm-stats-grid">
        <StatCard tone="sum" icon={UsersThree} label="Total members" value={stats.totalMembers} />
        <StatCard tone="total" icon={UserCircle} label="Renters" value={stats.totalRenters} />
        <StatCard tone="active" icon={ShieldCheck} label="Members with proxy" value={stats.membersWithProxy} />
        <StatCard tone="pending" icon={User} label="Regular members" value={stats.regularMembers} />
      </div>

      <div className="emp-card-container">
        <div className="emp-card-header">
          <div>
            <h2 className="emp-card-title">Tenant Member</h2>
            <p className="emp-card-desc">{TAB_HINTS[activeTab]}</p>
          </div>
          <div className="emp-card-actions">
            <button type="button" className="emp-btn-secondary" onClick={exportExcel} disabled={exporting}>
              <FileXls size={16} weight="bold" aria-hidden="true" />
              <span>{exporting ? 'Exporting…' : 'Export Excel'}</span>
            </button>
            <button type="button" className="emp-btn-primary" onClick={presenter.startAdd}>
              <Plus size={16} weight="bold" aria-hidden="true" />
              <span>Add tenant member</span>
            </button>
          </div>
        </div>

        <div className="tm-tabs-row">
          <div className="ws-toolbar-tabs" role="tablist" aria-label="Directory">
            {TENANT_MEMBER_TABS.map((t, i) => {
              const active = t.id === activeTab;
              const Icon = t.id === 'member' ? UsersThree : UserCircle;
              return (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[t.id] = el; }}
                  type="button"
                  role="tab"
                  id={`tm-tab-${t.id}`}
                  aria-selected={active}
                  aria-controls="tm-panel"
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
              aria-label={isMember ? 'Search members' : 'Search tenants'}
              placeholder="Search name, email, or unit"
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

          <FilterSelect label="Filter tower" value={filters.tower} onChange={(e) => setFilter('tower', e.target.value)}>
            <option value="">All towers</option>
            {options.towers.map((t) => <option key={t} value={t}>{t}</option>)}
          </FilterSelect>

          {isMember && (
            <FilterSelect label="Filter relation" value={filters.relation} onChange={(e) => setFilter('relation', e.target.value)}>
              <option value="">All relations</option>
              {options.relations.map((r) => <option key={r} value={r}>{r}</option>)}
            </FilterSelect>
          )}

          <FilterSelect label="Filter status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {(isMember ? MEMBER_STATUSES : TENANT_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>

          <button type="button" className="emp-btn-secondary" onClick={resetFilters} disabled={!hasActiveFilters}>
            <ArrowsClockwise size={16} weight="bold" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>

        <div className="emp-card-body" id="tm-panel" role="tabpanel" aria-labelledby={`tm-tab-${activeTab}`}>
          <div className="emp-table-card-inner">
            {totalRecords === 0 ? (
              <div className="unit-empty">
                <UsersThree size={36} color="#cbd5e1" aria-hidden="true" />
                <h3>{hasActiveFilters ? `No ${title.toLowerCase()} match these filters` : `No ${title.toLowerCase()} yet`}</h3>
                <p>{hasActiveFilters ? 'Change or reset the filters to see more.' : 'They appear here once registered.'}</p>
              </div>
            ) : (
              <>
                <Table tab={activeTab} rows={pagedRows} menuRowId={menu?.row.id} onToggleMenu={toggleMenu} />
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

export default TenantMemberView;
