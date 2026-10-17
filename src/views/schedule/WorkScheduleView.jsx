import React, { useState } from 'react';
import {
  CalendarCheck,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Plus,
  Clock,
  UsersThree,
  CheckCircle,
  X,
  Info,
  ArrowsClockwise,
  Briefcase
} from '@phosphor-icons/react';
import { formatDateKey } from '../../models/WorkScheduleModel';
import './work-schedule.css';

export default function WorkScheduleView({ presenter }) {
  const {
    shiftTypes,
    allShiftsWithOff,
    schedules,
    departments,
    filteredEmployees,
    weekDates,
    referenceDate,
    selectedDepartment,
    setSelectedDepartment,
    searchQuery,
    setSearchQuery,
    prevWeek,
    nextWeek,
    goToToday,
    resolveShift,
    getEmployeeStats,
    rosterSummary,
    assignModal,
    openAssignModal,
    closeAssignModal,
    saveAssignShift,
    bulkModal,
    openBulkModal,
    closeBulkModal,
    saveBulkAssign,
    successModal,
    closeSuccessModal,
    syncShiftTypes
  } = presenter;

  // Local state for modal selections
  const [selectedShiftId, setSelectedShiftId] = useState(assignModal.currentShiftId || 'off');
  const [assignNote, setAssignNote] = useState('');

  // Bulk modal local state
  const [bulkDept, setBulkDept] = useState('all');
  const [bulkShiftId, setBulkShiftId] = useState(shiftTypes[0]?.id || 's-1');
  const [bulkStart, setBulkStart] = useState(formatDateKey(weekDates[0]));
  const [bulkEnd, setBulkEnd] = useState(formatDateKey(weekDates[6]));
  const [bulkEmpIds, setBulkEmpIds] = useState([]);

  // Sync modal values on open
  React.useEffect(() => {
    if (assignModal.isOpen) {
      setSelectedShiftId(assignModal.currentShiftId || 'off');
      setAssignNote(assignModal.note || '');
    }
  }, [assignModal.isOpen, assignModal.currentShiftId, assignModal.note]);

  React.useEffect(() => {
    if (bulkModal.isOpen) {
      setBulkStart(formatDateKey(weekDates[0]));
      setBulkEnd(formatDateKey(weekDates[6]));
      setBulkShiftId(shiftTypes[0]?.id || 's-1');
      setBulkDept(selectedDepartment === 'all' ? 'dept-eng' : selectedDepartment);
      const initialEmps = filteredEmployees.slice(0, 6).map((e) => e.id);
      setBulkEmpIds(initialEmps);
    }
  }, [bulkModal.isOpen, weekDates, shiftTypes, selectedDepartment, filteredEmployees]);

  // Format header date range
  const startDateStr = weekDates[0]?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endDateStr = weekDates[6]?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const todayStr = formatDateKey(new Date());

  return (
    <div className="ws-container">
      {/* 1. Breadcrumb */}
      <div className="ws-breadcrumb">
        <span className="ws-breadcrumb-item">HR Parameter</span>
        <span className="ws-breadcrumb-sep">&gt;</span>
        <span className="ws-breadcrumb-item">Attendance</span>
        <span className="ws-breadcrumb-sep">&gt;</span>
        <span className="ws-breadcrumb-current">Work Schedules</span>
      </div>

      {/* 2. Hero Header with Live Shift Type Connection indicator */}
      <div className="ws-hero">
        <div className="ws-hero-left">
          <div className="ws-hero-icon-box">
            <CalendarCheck size={28} weight="bold" />
          </div>
          <div>
            <div className="ws-hero-tag">PEOPLE &amp; ATTENDANCE</div>
            <h1 className="ws-hero-title">Work Schedules &amp; Shift Roster</h1>
            <p className="ws-hero-desc">
              Manage weekly operational rosters with live synchronization to master Shift Types.
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="ws-hero-badge-sync" title="Shifts are dynamically populated from Shift Type Model">
            <span className="ws-sync-dot" />
            <span>Connected to Shift Types ({shiftTypes.length} types)</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
            style={{ borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}
            onClick={syncShiftTypes}
            title="Refresh shifts from Shift Type module"
          >
            <ArrowsClockwise size={14} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 3. Summary Stat Cards */}
      <div className="ws-stats-grid">
        <div className="ws-stat-card">
          <div className="ws-stat-icon hours">
            <Clock size={22} weight="bold" />
          </div>
          <div>
            <div className="ws-stat-label">Scheduled Hours</div>
            <div className="ws-stat-number">{rosterSummary.totalScheduledHours} hrs</div>
            <div className="ws-stat-sub">For current 7-day period</div>
          </div>
        </div>

        <div className="ws-stat-card">
          <div className="ws-stat-icon roster">
            <UsersThree size={22} weight="bold" />
          </div>
          <div>
            <div className="ws-stat-label">Active Staff</div>
            <div className="ws-stat-number">{rosterSummary.totalEmployees} Staff</div>
            <div className="ws-stat-sub">Across active departments</div>
          </div>
        </div>

        <div className="ws-stat-card">
          <div className="ws-stat-icon shifts">
            <Briefcase size={22} weight="bold" />
          </div>
          <div>
            <div className="ws-stat-label">Shift Breakdown</div>
            <div className="ws-stat-number" style={{ fontSize: '15px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 600 }}>
                {rosterSummary.morningCount} Pagi
              </span>
              <span className="badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 600 }}>
                {rosterSummary.afternoonCount} Siang
              </span>
              <span className="badge" style={{ backgroundColor: '#EEF2FF', color: '#4338CA', fontWeight: 600 }}>
                {rosterSummary.nightCount} Malam
              </span>
              <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontWeight: 600 }}>
                {rosterSummary.offCount} Off
              </span>
            </div>
            <div className="ws-stat-sub">Weekly shift slots allocated</div>
          </div>
        </div>
      </div>

      {/* 4. Live Shift Types Legend Bar */}
      <div className="ws-legend-box">
        <div className="ws-legend-header">
          <div className="ws-legend-title">
            <Briefcase size={15} color="#002B7F" weight="bold" />
            <span>Active Shift Types Available</span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
            Click any roster cell below to assign these shift types
          </span>
        </div>
        <div className="ws-legend-items">
          {allShiftsWithOff.map((st) => (
            <div key={st.id} className="ws-legend-pill">
              <span
                className="ws-legend-color-dot"
                style={{ backgroundColor: st.color || '#94a3b8' }}
              />
              <span style={{ color: '#0f172a' }}>{st.code}</span>
              <span style={{ color: '#475569' }}>{st.name}</span>
              <span className="ws-legend-time">
                {st.id === 'off' ? '(Day Off)' : `${st.checkIn} - ${st.checkOut} (${st.workHours}h)`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Toolbar Controls */}
      <div className="ws-toolbar">
        {/* Navigation Date Cluster */}
        <div className="ws-nav-cluster">
          <button type="button" className="ws-btn-nav" onClick={prevWeek} title="Previous week">
            <CaretLeft size={16} weight="bold" />
          </button>
          <button type="button" className="ws-btn-today" onClick={goToToday}>
            Today
          </button>
          <button type="button" className="ws-btn-nav" onClick={nextWeek} title="Next week">
            <CaretRight size={16} weight="bold" />
          </button>
          <div className="ws-date-range-badge">
            <CalendarCheck size={18} color="#002B7F" weight="fill" />
            <span>{startDateStr} &ndash; {endDateStr}</span>
          </div>
        </div>

        {/* Search, Dept Filter, & Bulk Assign */}
        <div className="ws-toolbar-actions">
          <div className="ws-search-input">
            <MagnifyingGlass size={15} className="ws-search-icon" />
            <input
              type="text"
              placeholder="Search employee, NIK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="ws-dept-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <button type="button" className="ws-btn-bulk" onClick={openBulkModal}>
            <Plus size={16} weight="bold" />
            <span>Bulk Assign</span>
          </button>
        </div>
      </div>

      {/* 6. Matrix Roster Table */}
      <div className="ws-matrix-card">
        <div className="ws-table-container">
          <table className="ws-table">
            <thead>
              <tr>
                <th className="col-emp">Employee</th>
                {weekDates.map((dateObj) => {
                  const dStr = formatDateKey(dateObj);
                  const isToday = dStr === todayStr;
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = dateObj.getDate();

                  return (
                    <th key={dStr} className={`col-day ${isToday ? 'is-today' : ''}`}>
                      <span className="ws-day-name">{dayName}</span>
                      <span className="ws-day-num">{dayNum}</span>
                    </th>
                  );
                })}
                <th className="col-summary">Weekly Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <UsersThree size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No employees match the selected filters.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const stats = getEmployeeStats(emp.id);
                  const dept = departments.find((d) => d.id === emp.departmentId);

                  return (
                    <tr key={emp.id}>
                      {/* Sticky Employee Cell */}
                      <td className="col-emp">
                        <div className="ws-emp-cell">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="ws-emp-avatar"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                            }}
                          />
                          <div className="ws-emp-info">
                            <span className="ws-emp-name">{emp.name}</span>
                            <div className="ws-emp-sub">
                              <span className="ws-dept-tag">{dept ? dept.code : 'STAFF'}</span>
                              <span>{emp.position || 'Staff'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 7 Daily Shift Cells */}
                      {weekDates.map((dateObj) => {
                        const dStr = formatDateKey(dateObj);
                        const key = `${emp.id}_${dStr}`;
                        const entry = schedules[key];
                        const shift = resolveShift(entry?.shiftTypeId);
                        const isOff = shift.id === 'off';

                        return (
                          <td key={dStr} className="ws-slot-cell">
                            <button
                              type="button"
                              className={`ws-shift-btn ${isOff ? 'is-off' : ''}`}
                              style={{
                                borderColor: isOff ? '#e2e8f0' : `${shift.color}55`,
                                backgroundColor: isOff ? '#f8fafc' : `${shift.color}14`
                              }}
                              onClick={() => openAssignModal(emp, dateObj)}
                              title={
                                isOff
                                  ? `${emp.name} - Day Off on ${dStr}`
                                  : `${emp.name} - ${shift.name} (${shift.checkIn} - ${shift.checkOut}, ${shift.workHours}h)`
                              }
                            >
                              <span
                                className="ws-shift-code-tag"
                                style={{ color: isOff ? '#64748b' : shift.color }}
                              >
                                {shift.code}
                              </span>
                              <span className="ws-shift-timing-text" style={{ color: isOff ? '#94a3b8' : '#334155' }}>
                                {isOff ? 'Off' : `${shift.workHours}h`}
                              </span>
                            </button>
                          </td>
                        );
                      })}

                      {/* Weekly Summary Cell */}
                      <td className="ws-summary-cell">
                        <div className="ws-summary-hours">{stats.totalHours} hrs</div>
                        <div className="ws-summary-days">
                          {stats.workDays} days &bull; {stats.offDays} off
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Assign Shift Modal */}
      {assignModal.isOpen && assignModal.employee && (
        <div className="ws-modal-backdrop" onClick={closeAssignModal}>
          <div className="ws-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ws-modal-header">
              <h3>Assign Work Shift</h3>
              <button type="button" className="ws-modal-close" onClick={closeAssignModal}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="ws-modal-body">
              {/* Employee Banner */}
              <div className="ws-modal-emp-banner">
                <img
                  src={assignModal.employee.avatar}
                  alt={assignModal.employee.name}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                    {assignModal.employee.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {assignModal.employee.position} &bull; {formatDateKey(assignModal.date)}
                  </div>
                </div>
              </div>

              {/* Select Shift from connected Shift Types */}
              <label className="ws-modal-label">
                Select Shift Type (Connected from Master Shift Types)
              </label>
              <div className="ws-shift-picker-grid">
                {allShiftsWithOff.map((st) => {
                  const isSelected = selectedShiftId === st.id;

                  return (
                    <div
                      key={st.id}
                      className={`ws-picker-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedShiftId(st.id)}
                    >
                      <div className="ws-picker-header">
                        <span className="ws-picker-code" style={{ color: st.color || '#64748b' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: st.color || '#94a3b8'
                            }}
                          />
                          {st.code}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                          {st.id === 'off' ? '0h' : `${st.workHours} hrs`}
                        </span>
                      </div>
                      <div className="ws-picker-name">{st.name}</div>
                      <div className="ws-picker-time">
                        {st.id === 'off' ? 'No work scheduled' : `${st.checkIn} - ${st.checkOut}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Optional Notes */}
              <div>
                <label className="ws-modal-label">Schedule Note (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '13px' }}
                  placeholder="e.g. Overtime replacement or shift swap"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                />
              </div>
            </div>
            <div className="ws-modal-footer">
              <button type="button" className="ws-btn-cancel" onClick={closeAssignModal}>
                Cancel
              </button>
              <button
                type="button"
                className="ws-btn-save"
                onClick={() => saveAssignShift(selectedShiftId, assignNote)}
              >
                Apply Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Bulk Assign Modal */}
      {bulkModal.isOpen && (
        <div className="ws-modal-backdrop" onClick={closeBulkModal}>
          <div className="ws-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ws-modal-header">
              <h3>Bulk Assign Work Shifts</h3>
              <button type="button" className="ws-modal-close" onClick={closeBulkModal}>
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="ws-modal-body">
              <div style={{ marginBottom: '14px' }}>
                <label className="ws-modal-label">Target Department</label>
                <select
                  className="form-select"
                  style={{ fontSize: '13px' }}
                  value={bulkDept}
                  onChange={(e) => {
                    const dVal = e.target.value;
                    setBulkDept(dVal);
                    const matching = filteredEmployees.filter((emp) => dVal === 'all' || emp.departmentId === dVal);
                    setBulkEmpIds(matching.map((m) => m.id));
                  }}
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="ws-modal-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ fontSize: '13px' }}
                    value={bulkStart}
                    onChange={(e) => setBulkStart(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="ws-modal-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ fontSize: '13px' }}
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* Shift Type to Assign */}
              <div style={{ marginBottom: '16px' }}>
                <label className="ws-modal-label">Select Shift Type</label>
                <select
                  className="form-select"
                  style={{ fontSize: '13px' }}
                  value={bulkShiftId}
                  onChange={(e) => setBulkShiftId(e.target.value)}
                >
                  {allShiftsWithOff.map((st) => (
                    <option key={st.id} value={st.id}>
                      [{st.code}] {st.name} ({st.id === 'off' ? 'Day Off' : `${st.checkIn} - ${st.checkOut}, ${st.workHours}h`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff Count preview */}
              <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '12.5px', color: '#1e40af' }}>
                <Info size={16} style={{ marginRight: '6px' }} />
                <span>
                  This will assign the shift to <strong>{bulkEmpIds.length} employee(s)</strong> over the selected date range.
                </span>
              </div>
            </div>
            <div className="ws-modal-footer">
              <button type="button" className="ws-btn-cancel" onClick={closeBulkModal}>
                Cancel
              </button>
              <button
                type="button"
                className="ws-btn-save"
                onClick={() => saveBulkAssign(bulkEmpIds, bulkStart, bulkEnd, bulkShiftId)}
              >
                Apply Bulk Shifts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Success Modal Feedback */}
      {successModal && (
        <div className="ws-modal-backdrop" onClick={closeSuccessModal}>
          <div
            className="ws-modal-card text-center"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', position: 'relative', padding: '40px 32px 32px' }}
          >
            <button
              type="button"
              className="ws-modal-close"
              onClick={closeSuccessModal}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: '#94a3b8'
              }}
            >
              <X size={20} />
            </button>
            <div className="d-flex justify-content-center" style={{ marginBottom: '16px' }}>
              <CheckCircle size={64} weight="fill" color="#10B981" />
            </div>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', lineHeight: 1.3 }}>
              {successModal.title}
            </h4>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: 1.55 }}>
              {successModal.subtext}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
