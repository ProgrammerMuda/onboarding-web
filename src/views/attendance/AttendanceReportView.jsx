import React, { useState } from 'react';
import {
  CalendarCheck,
  SignIn,
  SignOut,
  Eye,
  Clock,
  Coffee,
  FileXls,
  MagnifyingGlass,
  ArrowsClockwise,
  CaretLeft,
  CaretRight,
  X
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import { ActionToast, useActionToast } from '../components/AddMenuButton';
import { FilterSelect } from '../tenant/ListParts';
import { formatLogDate, formatPunch, formatTotal } from '../../models/AttendanceReportModel';
import { DEFAULT_AVATAR, PhotoCell, StatusPills, RemarkChips, ShiftBadge } from './AttendanceParts';
import { AttendanceDetailDrawer } from './AttendanceDetailDrawer';
import { DatePeriodFilter } from './DatePeriodFilter';
import '../employee/employee.css';
import '../schedule/work-schedule.css';
import '../unit/unit.css';
import './attendance-report.css';

const COLUMNS = ['Employee', 'Position', 'Shift', 'Date', 'Check in and out', 'Photo', 'Status', 'Permission', 'Action'];

function Table({ rows, onView }) {
  return (
    <div className="emp-table-responsive">
      <table className="emp-table unit-table att-table">
        <thead>
          <tr>
            {COLUMNS.map((c) => <th key={c} scope="col">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td data-label={COLUMNS[0]}>
                <div className="emp-profile-cell">
                  <img
                    src={r.avatar || DEFAULT_AVATAR}
                    alt={r.name}
                    className="emp-avatar-img"
                    onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                  />
                  <div>
                    <span className="ws-emp-name-bold">{r.name}</span>
                    <span className="ws-emp-email-muted">NIP: {r.nip}</span>
                  </div>
                </div>
              </td>
              <td data-label={COLUMNS[1]}><span className="emp-pos-badge">{r.role}</span></td>
              <td data-label={COLUMNS[2]}>
                <div className="att-shift">
                  <span className="att-shift__name">{r.shift}</span>
                  <ShiftBadge shift={r.shiftType} />
                </div>
              </td>
              <td data-label={COLUMNS[3]} className="att-nowrap">{formatLogDate(r.date)}</td>
              <td data-label={COLUMNS[4]}>
                {r.checkIn || r.inResult === 'alpha' ? (
                  <div className="att-times">
                    <span className="att-time"><span className="att-tag att-tag--in"><SignIn size={12} weight="bold" aria-hidden="true" />In</span>{formatPunch(r, 'checkIn')}</span>
                    <span className="att-time"><span className="att-tag att-tag--out"><SignOut size={12} weight="bold" aria-hidden="true" />Out</span>{formatPunch(r, 'checkOut')}</span>
                    <span className="att-time" title="Time between check in and check out"><span className="att-tag att-tag--total"><Clock size={12} weight="bold" aria-hidden="true" />Total</span>{formatTotal(r)}</span>
                  </div>
                ) : r.remarks.includes('leave_permit') ? (
                  <span className="att-offday">
                    <Coffee size={13} weight="bold" aria-hidden="true" />Off day
                  </span>
                ) : (
                  <span className="att-photo-empty">No record</span>
                )}
              </td>
              <td data-label={COLUMNS[5]}>
                <div className="att-photos">
                  <PhotoCell src={r.checkInPhoto} label="Check in" name={r.name} />
                  <PhotoCell src={r.checkOutPhoto} label="Check out" name={r.name} />
                </div>
              </td>
              <td data-label={COLUMNS[6]}>
                <StatusPills row={r} />
              </td>
              <td data-label={COLUMNS[7]}><RemarkChips row={r} /></td>
              <td data-label={COLUMNS[8]} className="att-col-action">
                <button
                  type="button"
                  className="emp-btn-secondary att-btn-view"
                  onClick={() => onView(r)}
                  title={`View attendance detail for ${r.name}`}
                  aria-label={`View attendance detail for ${r.name}`}
                >
                  <Eye size={16} weight="bold" />
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
        <strong className="emp-text-dark">{totalRecords}</strong> logs
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

export function AttendanceReportView({ presenter }) {
  const {
    filters, setFilter, period, departments, shiftTypes, from, to, setPeriod, resetFilters, hasActiveFilters,
    pagedRows, totalRecords, exportExcel, exporting
  } = presenter;
  const [toast, notify] = useActionToast();
  const [detail, setDetail] = useState(null);

  const onExport = async () => {
    notify('Preparing the Excel file…');
    const result = await exportExcel();
    if (!result) notify('The export could not be created. Try again.');
    else notify(`Exported ${result.rows} log${result.rows === 1 ? '' : 's'} of ${result.employees} employee${result.employees === 1 ? '' : 's'}.`);
  };

  return (
    <div className="ws-container unit-page att-page">
      <Breadcrumb items={[{ label: 'HR Parameter' }, { label: 'Attendance' }, { label: 'Report Attendance' }]} />

      <div className="ws-hero">
        <div className="ws-hero-left">
          <div className="ws-hero-icon-box">
            <CalendarCheck size={28} weight="bold" />
          </div>
          <div>
            <div className="ws-hero-tag">ATTENDANCE</div>
            <h1 className="ws-hero-title">Report Attendance</h1>
            <p className="ws-hero-desc">
              Check in and check out logs per employee, with the photo taken at each tap.
            </p>
          </div>
        </div>
      </div>

      <div className="emp-card-container">
        <div className="emp-card-header">
          <div>
            <h2 className="emp-card-title">Attendance Logs</h2>
            <p className="emp-card-desc">Browse check in and check out records, shift status and photos.</p>
          </div>
          <div className="emp-card-actions">
            <button type="button" className="emp-btn-secondary" onClick={onExport} disabled={exporting || totalRecords === 0}>
              <FileXls size={16} weight="bold" aria-hidden="true" />
              <span>{exporting ? 'Exporting…' : 'Export Excel'}</span>
            </button>
          </div>
        </div>

        <div className="emp-search-row unit-filter-row">
          <DatePeriodFilter period={period} from={from} to={to} onChange={setPeriod} />

          <FilterSelect label="Filter by department" value={filters.department} onChange={(e) => setFilter('department', e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </FilterSelect>

          <FilterSelect label="Filter by shift" value={filters.shift} onChange={(e) => setFilter('shift', e.target.value)}>
            <option value="">All Shifts ({shiftTypes.length})</option>
            {shiftTypes.map((st) => <option key={st.id} value={st.id}>{st.code} &ndash; {st.name}</option>)}
          </FilterSelect>

          <div className="emp-search-input-group unit-search-group">
            <MagnifyingGlass size={16} weight="bold" className="emp-search-input-icon" aria-hidden="true" />
            <input
              type="text"
              className="emp-search-input"
              aria-label="Search employee"
              placeholder="Search name or NIP"
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

          <button type="button" className="emp-btn-secondary" onClick={resetFilters} disabled={!hasActiveFilters}>
            <ArrowsClockwise size={16} weight="bold" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>

        <div className="emp-card-body">
          <div className="emp-table-card-inner">
            {totalRecords === 0 ? (
              <div className="unit-empty">
                <CalendarCheck size={36} color="#cbd5e1" aria-hidden="true" />
                <h3>{hasActiveFilters ? 'No logs match these filters' : 'No attendance logs yet'}</h3>
                <p>{hasActiveFilters ? 'Change or reset the filters to see more.' : 'Logs appear here once employees check in.'}</p>
              </div>
            ) : (
              <>
                <Table rows={pagedRows} onView={setDetail} />
                <TableFooter presenter={presenter} />
              </>
            )}
          </div>
        </div>
      </div>

      {detail && <AttendanceDetailDrawer row={detail} onClose={() => setDetail(null)} />}
      <ActionToast message={toast} />
    </div>
  );
}

export default AttendanceReportView;
