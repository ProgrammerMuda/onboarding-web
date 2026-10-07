import { useEffect, useRef, useState } from 'react';
import { 
  ArrowClockwise, 
  CaretLeft, 
  CaretRight, 
  Check, 
  CheckCircle, 
  ClipboardText, 
  Info, 
  MagnifyingGlass, 
  PencilSimple, 
  Plus, 
  Power, 
  Prohibit, 
  X 
} from '@phosphor-icons/react';
import { ALLOWED_DATE_OPTIONS, formatPermitReset, RESET_FREQUENCIES, validatePermitType } from '../../models/PermitTypeModel';
import './permit-type.css';

function PermitDialog({ title, description, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className="permit-dialog" aria-labelledby="permit-dialog-title" aria-describedby={description ? 'permit-dialog-description' : undefined} onCancel={onClose}>
    <div className="permit-dialog-heading">
      <div><h2 id="permit-dialog-title">{title}</h2>{description && <p id="permit-dialog-description" className="text-muted mb-0">{description}</p>}</div>
      <button type="button" className="btn btn-link p-1 text-muted text-decoration-none d-flex align-items-center justify-content-center border-0 shadow-none permit-dialog-close" aria-label="Close" title="Close" onClick={onClose}><X size={20} weight="bold" /></button>
    </div>
    {children}
  </dialog>;
}

export function PermitTypeView({ presenter: p }) {
  const [goToPage, setGoToPage] = useState('');
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const canSave = Boolean(p.draft && !validatePermitType(p.draft, []));
  const selectedFrequency = RESET_FREQUENCIES.find((frequency) => frequency.value === p.draft?.frequency);
  const pages = p.totalPages <= 5
    ? Array.from({ length: p.totalPages }, (_, index) => index + 1)
    : p.currentPage <= 3 ? [1, 2, 3, '…', p.totalPages]
      : p.currentPage >= p.totalPages - 2 ? [1, '…', p.totalPages - 2, p.totalPages - 1, p.totalPages]
        : [1, '…', p.currentPage, '…', p.totalPages];

  return <section className="permit-page">
    <header className="permit-header d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
      <div>
        <h1 className="h3 fw-bold text-primary mb-1" style={{ letterSpacing: '-0.02em' }}>Permit Type</h1>
        <p className="text-muted small mb-0">Configure permit types, employee quotas, and reset schedules</p>
      </div>
      <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => p.openEditor()}><Plus size={18} weight="bold" /> Add Permit Type</button>
    </header>

    {p.notification && <div className="permit-notification" role="status"><CheckCircle size={20} /><span>{p.notification}</span><button className="permit-icon-button" aria-label="Dismiss notification" onClick={() => p.setNotification('')}><X size={18} /></button></div>}

    <div className="permit-table-card">
      <div className="permit-toolbar flex-wrap gap-3">
        <div className="permit-search bg-white shadow-xs"><MagnifyingGlass size={17} className="text-secondary flex-shrink-0" weight="bold" /><input className="form-control border-0 p-0 shadow-none bg-transparent" type="search" aria-label="Search permit types" placeholder="Search permit names or descriptions..." value={p.query} onChange={(e) => p.setQuery(e.target.value)} /></div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select className="form-select" aria-label="Filter by status" value={p.statusFilter} onChange={(e) => p.setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
          <select className="form-select" aria-label="Filter by reset frequency" value={p.frequency} onChange={(e) => p.setFrequency(e.target.value)}>
            <option value="all">All reset frequencies</option>
            {RESET_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            <option value="unlimited">Unlimited quota</option>
          </select>
        </div>
      </div>
      <div className="table-responsive">
        <table className="permit-table">
          <thead>
            <tr>
              <th scope="col">PERMIT NAME</th>
              <th scope="col">STATUS</th>
              <th scope="col">QUOTA PER EMPLOYEE</th>
              <th scope="col">RESET FREQUENCY</th>
              <th scope="col">NEXT RESET</th>
              <th scope="col">ALLOWED DATES</th>
              <th scope="col" className="text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>{p.paginatedPermits.map((permit) => {
            const frequency = RESET_FREQUENCIES.find((f) => f.value === permit.frequency);
            const isActive = permit.isActive !== false;
            return <tr key={permit.id} className={!isActive ? 'permit-row-inactive' : ''}>
              <td>
                <div className="permit-name-cell">
                  <span className="permit-row-icon"><ClipboardText size={22} /></span>
                  <div>
                    <strong>{permit.name}</strong>
                    <p>{permit.description || 'No description provided'}</p>
                  </div>
                </div>
              </td>
              <td>
                {isActive ? (
                  <span className="permit-status-badge active"><Check size={12} weight="bold" /> Active</span>
                ) : (
                  <span className="permit-status-badge inactive"><Prohibit size={12} weight="bold" /> Inactive</span>
                )}
              </td>
              <td>{permit.hasQuota ? <><div className="permit-quota"><strong>{permit.quota}</strong> <span className="text-secondary">{permit.quota === 1 ? 'day' : 'days'}</span> <span>/ {frequency?.period}</span></div><p className="permit-cell-note">For each employee</p></> : <><span className="permit-unlimited">Unlimited</span><p className="permit-cell-note">No quota limit</p></>}</td>
              <td>{permit.hasQuota ? <><span className="permit-frequency"><ArrowClockwise size={14} />{frequency?.label}</span><p className="permit-cell-note">{frequency?.detail}</p></> : <span className="permit-cell-note">No reset</span>}</td>
              <td>{permit.hasQuota ? <><strong className="permit-reset-date">{formatPermitReset(permit.frequency, now)}</strong><p className="permit-cell-note">00:00 WIB</p></> : <span className="permit-cell-note">No reset</span>}</td>
              <td><span className="permit-date-policy">{ALLOWED_DATE_OPTIONS.find((option) => option.value === permit.allowedDates)?.label}</span></td>
              <td>
                <div className="d-flex gap-2 justify-content-end">
                  <button className="permit-icon-button btn-edit" aria-label={`Edit ${permit.name}`} title="Edit permit type" onClick={() => p.openEditor(permit)}>
                    <PencilSimple size={18} weight="bold" />
                  </button>
                  {isActive ? (
                    <button className="permit-icon-button btn-deactivate" aria-label={`Deactivate ${permit.name}`} title="Deactivate permit type" onClick={() => p.requestToggleStatus(permit)}>
                      <Power size={18} weight="bold" />
                    </button>
                  ) : (
                    <button className="permit-icon-button btn-activate" aria-label={`Activate ${permit.name}`} title="Reactivate permit type" onClick={() => p.requestToggleStatus(permit)}>
                      <CheckCircle size={18} weight="bold" />
                    </button>
                  )}
                </div>
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      {!p.filteredPermits.length && <div className="permit-empty"><MagnifyingGlass size={32} /><h3>{p.permits.length ? 'No permit types found' : 'No permit types yet'}</h3><p>{p.permits.length ? 'Try a different keyword, status, or reset frequency.' : 'Add your first permit type to set employee quotas.'}</p><button className="btn btn-sm btn-outline-primary" onClick={() => { if (p.permits.length) { p.setQuery(''); p.setFrequency('all'); p.setStatusFilter('all'); } else p.openEditor(); }}>{p.permits.length ? 'Clear filters' : 'Add Permit Type'}</button></div>}
      <div className="permit-table-footer d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>Showing <strong className="text-dark">{p.filteredPermits.length ? (p.currentPage - 1) * p.pageSize + 1 : 0}–{Math.min(p.currentPage * p.pageSize, p.filteredPermits.length)}</strong> of <strong className="text-dark">{p.filteredPermits.length}</strong></div>
        {p.totalPages > 1 && <div className="d-flex flex-wrap align-items-center gap-3">
          <nav className="d-flex align-items-center gap-2" aria-label="Permit table pagination">
            <button type="button" className="permit-page-button" aria-label="Previous page" disabled={p.currentPage === 1} onClick={() => p.setCurrentPage(p.currentPage - 1)}><CaretLeft size={16} weight="bold" /></button>
            {pages.map((page, index) => page === '…'
              ? <span key={`ellipsis-${index}`} className="text-muted px-1">…</span>
              : <button key={page} type="button" className={`permit-page-button${p.currentPage === page ? ' active' : ''}`} aria-label={`Page ${page}`} aria-current={p.currentPage === page ? 'page' : undefined} onClick={() => p.setCurrentPage(page)}>{page}</button>)}
            <button type="button" className="permit-page-button" aria-label="Next page" disabled={p.currentPage === p.totalPages} onClick={() => p.setCurrentPage(p.currentPage + 1)}><CaretRight size={16} weight="bold" /></button>
          </nav>
          <form className="d-flex align-items-center gap-2" onSubmit={(e) => { e.preventDefault(); const page = Number(goToPage); if (Number.isInteger(page) && page >= 1 && page <= p.totalPages) { p.setCurrentPage(page); setGoToPage(''); } }}>
            <label htmlFor="permit-go-to-page" className="text-muted text-nowrap">Go to</label>
            <div className="input-group input-group-sm permit-page-jump"><input id="permit-go-to-page" type="number" min="1" max={p.totalPages} required className="form-control text-center shadow-none" placeholder={`1–${p.totalPages}`} value={goToPage} onChange={(e) => setGoToPage(e.target.value)} /><button type="submit" className="btn btn-primary">Go</button></div>
          </form>
        </div>}
      </div>
    </div>

    {p.draft && <PermitDialog title={p.draft.id ? 'Edit Permit Type' : 'Add Permit Type'} description="Define the permit type and quota rules for each employee." onClose={p.closeEditor}>
      <form onSubmit={(e) => { e.preventDefault(); p.save(); }}>
        <div className="permit-form-body">
          {p.error && <div className="alert alert-danger small" role="alert">{p.error}</div>}
          <label className="form-label" htmlFor="permit-name">Permit name <span className="text-danger">*</span></label><input id="permit-name" className="form-control mb-3" autoFocus required maxLength={100} placeholder="e.g., Sick Leave" value={p.draft.name} onChange={(e) => p.setDraft({ ...p.draft, name: e.target.value })} />
          <label className="form-label" htmlFor="permit-description">Description <span className="permit-optional">(optional)</span></label><textarea id="permit-description" className="form-control mb-4" rows={3} maxLength={500} placeholder="Describe when this permit type should be used..." value={p.draft.description} onChange={(e) => p.setDraft({ ...p.draft, description: e.target.value })} />
          <fieldset className="mb-4">
            <legend className="form-label float-none w-auto">Allowed dates <span className="text-danger">*</span></legend>
            <p id="permit-allowed-dates-help" className="permit-cell-note mt-0 mb-3">Choose whether employees can request permits for past dates, future dates, or both.</p>
            <div className="d-flex flex-wrap align-items-center gap-4">
              {ALLOWED_DATE_OPTIONS.map((option) => <div className="form-check mb-0" key={option.value}>
                <input className="form-check-input" type="radio" name="permit-allowed-dates" id={`permit-allowed-dates-${option.value}`} value={option.value} required checked={p.draft.allowedDates === option.value} aria-describedby="permit-allowed-dates-help" onChange={(e) => p.setDraft({ ...p.draft, allowedDates: e.target.value })} />
                <label className="form-check-label" htmlFor={`permit-allowed-dates-${option.value}`}>{option.label}</label>
              </div>)}
            </div>
          </fieldset>
          <div className="permit-quota-toggle"><div><label htmlFor="permit-has-quota">Set a quota limit</label><p>Set the number of permit days per employee.</p></div><div className="form-check form-switch m-0"><input className="form-check-input" type="checkbox" role="switch" id="permit-has-quota" checked={p.draft.hasQuota} onChange={(e) => p.setDraft({ ...p.draft, hasQuota: e.target.checked, frequency: p.draft.frequency || 'annual' })} /></div></div>
          {p.draft.hasQuota ? <div className="permit-quota-fields"><div><label className="form-label" htmlFor="permit-quota">Quota per employee <span className="text-danger">*</span></label><div className="input-group"><input id="permit-quota" className="form-control" type="number" required min="1" step="1" max="9007199254740991" placeholder="12" value={p.draft.quota ?? ''} onChange={(e) => p.setDraft({ ...p.draft, quota: e.target.value })} /><span className="input-group-text bg-white">days</span></div></div><div><label className="form-label" htmlFor="permit-frequency">Reset frequency <span className="text-danger">*</span></label><select id="permit-frequency" className="form-select" value={p.draft.frequency} onChange={(e) => p.setDraft({ ...p.draft, frequency: e.target.value })}>{RESET_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div></div> : null}
          {p.draft.hasQuota ? (
            <div className="permit-summary-cards mt-3">
              {/* Card 1: Employee receives */}
              <div className="permit-summary-card">
                <div className="permit-summary-card-header">
                  <div className="permit-summary-card-icon icon-blue">
                    <ClipboardText size={16} weight="bold" />
                  </div>
                  <span className="permit-summary-card-label">Employee receives</span>
                </div>
                <div className="permit-summary-card-body">
                  <div className="permit-summary-card-val">
                    <span className="permit-summary-num">{p.draft.quota ? p.draft.quota : 0}</span>
                    <span className="permit-summary-unit">{Number(p.draft.quota) === 1 ? 'day' : 'days'}</span>
                  </div>
                  <span className="permit-summary-card-sub">per {selectedFrequency?.period || 'period'}</span>
                </div>
              </div>

              {/* Card 2: Next reset */}
              <div className="permit-summary-card">
                <div className="permit-summary-card-header">
                  <div className="permit-summary-card-icon icon-cyan">
                    <ArrowClockwise size={16} weight="bold" />
                  </div>
                  <span className="permit-summary-card-label">Next reset</span>
                </div>
                <div className="permit-summary-card-body">
                  <div className="permit-summary-card-val">
                    <span className="permit-summary-date">{formatPermitReset(p.draft.frequency, now)}</span>
                  </div>
                  <span className="permit-summary-card-sub">{selectedFrequency?.resetCycleNote || '00:00 WIB • Start of period'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="permit-form-summary mt-3">
              <Info size={18} className="text-secondary flex-shrink-0" />
              <span>This permit has no quota limit and does not require a reset schedule.</span>
            </div>
          )}
        </div>
        <div className="permit-dialog-footer"><button type="button" className="btn btn-light bg-white border" onClick={p.closeEditor}>Cancel</button><button type="submit" className="btn btn-primary permit-save-button" disabled={!canSave}>Save Permit Type</button></div>
      </form>
    </PermitDialog>}

    {p.statusTarget && <PermitDialog title={p.statusTarget.isActive !== false ? 'Deactivate permit type?' : 'Activate permit type?'} onClose={p.closeStatusModal}>
      <div className="permit-form-body">
        {p.error && <div className="alert alert-danger" role="alert">{p.error}</div>}
        {p.statusTarget.isActive !== false ? (
          <div>
            <p className="mb-2">Are you sure you want to deactivate <strong>{p.statusTarget.name}</strong>?</p>
            <p className="text-muted mb-0" style={{ fontSize: '0.825rem', lineHeight: '1.5' }}>
              Employees will no longer be able to select this permit type for new requests. Historical submissions, approved leave logs, and used quotas will remain safely preserved in reports.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-2">Are you sure you want to reactivate <strong>{p.statusTarget.name}</strong>?</p>
            <p className="text-muted mb-0" style={{ fontSize: '0.825rem', lineHeight: '1.5' }}>
              Employees will immediately be able to select and submit requests for this permit type again.
            </p>
          </div>
        )}
      </div>
      <div className="permit-dialog-footer">
        <button type="button" className="btn btn-light bg-white border" onClick={p.closeStatusModal}>Cancel</button>
        <button 
          type="button" 
          className={`btn ${p.statusTarget.isActive !== false ? 'btn-danger text-white fw-semibold' : 'btn-primary'}`} 
          onClick={p.confirmToggleStatus}
        >
          {p.statusTarget.isActive !== false ? 'Deactivate Permit Type' : 'Activate Permit Type'}
        </button>
      </div>
    </PermitDialog>}
  </section>;
}

