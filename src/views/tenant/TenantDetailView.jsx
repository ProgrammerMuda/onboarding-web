import React, { useRef, useState } from 'react';
import { 
  ArrowLeft, 
  PencilSimple, 
  EnvelopeSimple, 
  Phone, 
  Buildings, 
  Users, 
  Car, 
  Info, 
  IdentificationCard, 
  HouseLine, 
  Key, 
  UserSwitch, 
  ShieldCheck, 
  CheckCircle, 
  FileText,
  Copy,
  Check,
  Door,
  CalendarBlank,
  MapPin,
  GlobeHemisphereWest,
  Receipt,
  User,
  Heart,
  MagnifyingGlass,
  Plus,
  X,
  DotsThreeVertical,
  Eye,
  SignOut,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import { AddVehicleDialog } from './AddVehicleDialog';
import { PersonCell, UnitBadge, RoleChip, StatusPill, FilterSelect, RowActionMenu, rowMenuAnchor } from './ListParts';
import '../employee/employee.css';
import '../employee/add-employee.css';
import '../employee/employee-detail.css';

const UNIT_COLUMNS = ['Unit', 'Tower', 'Role', 'Entry date', 'Status'];
const MEMBER_COLUMNS = ['Member', 'Relation', 'NIK', 'Unit', 'Status'];
const VEHICLE_COLUMNS = ['Plate', 'Type', 'Brand & model', 'Color', 'Parking slot', 'RFID'];
const UNIT_STATUSES = ['Occupant', 'Unoccupied'];
const MEMBER_ROW_STATUSES = ['Active', 'Pending'];
const EMPTY_UNIT_FILTERS = { query: '', role: '', status: '' };
const EMPTY_MEMBER_FILTERS = { query: '', unit: '', relation: '', status: '' };
const EMPTY_VEHICLE_FILTERS = { query: '', type: '' };

const hasFilters = (filters) => Object.values(filters).some(Boolean);
const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');
const matches = (query, ...fields) => {
  const q = query.trim().toLowerCase();
  return !q || fields.some((f) => (f || '').toLowerCase().includes(q));
};

function SearchBox({ label, placeholder, value, onChange }) {
  return (
    <div className="emp-search-input-group unit-search-group">
      <MagnifyingGlass size={16} weight="bold" className="emp-search-input-icon" aria-hidden="true" />
      <input
        type="text"
        className="emp-search-input"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
      />
      {value && (
        <button type="button" className="unit-search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}

function ResetButton({ disabled, onClick }) {
  return (
    <button type="button" className="emp-btn-secondary" onClick={onClick} disabled={disabled}>
      <ArrowsClockwise size={16} weight="bold" aria-hidden="true" />
      <span>Reset</span>
    </button>
  );
}

function EmptyState({ Icon, filtered, noun, idle }) {
  return (
    <div className="unit-empty">
      <Icon size={36} color="#cbd5e1" aria-hidden="true" />
      <h3>{filtered ? `No ${noun} match these filters` : `No ${noun} yet`}</h3>
      <p>{filtered ? 'Change or reset the filters to see more.' : idle}</p>
    </div>
  );
}

function DotsButton({ name, open, onClick }) {
  return (
    <button
      type="button"
      className={`unit-btn-dots${open ? ' is-open' : ''}`}
      aria-label={`Actions for ${name}`}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={(e) => onClick(e.currentTarget)}
    >
      <DotsThreeVertical size={18} weight="bold" />
    </button>
  );
}

export function TenantDetailView({ presenter }) {
  const {
    selectedTenant,
    detailActiveTab,
    setDetailActiveTab,
    handleBackToList
  } = presenter;

  const [notification, setNotification] = useState(null);
  const [unitFilters, setUnitFilters] = useState(EMPTY_UNIT_FILTERS);
  const [memberFilters, setMemberFilters] = useState(EMPTY_MEMBER_FILTERS);
  const [vehicleFilters, setVehicleFilters] = useState(EMPTY_VEHICLE_FILTERS);
  const [rowMenu, setRowMenu] = useState(null);
  const tabRefs = useRef({});
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const setUnitFilter = (key, value) => setUnitFilters((f) => ({ ...f, [key]: value }));
  const setMemberFilter = (key, value) => setMemberFilters((f) => ({ ...f, [key]: value }));
  const setVehicleFilter = (key, value) => setVehicleFilters((f) => ({ ...f, [key]: value }));
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({
    tenancyType: 'Owner',
    unitCode: '',
    entryDate: '21/09/2026',
    rentalPeriod: 12,
    startRent: '21/09/2026'
  });

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedUnitForMember, setSelectedUnitForMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    relationship: 'Spouse',
    nik: '',
    email: '',
    phone: '',
    status: 'Active',
    accessCard: '',
    rentalPeriod: 12,
    startRent: '21/09/2026'
  });

  const [isViewMemberModalOpen, setIsViewMemberModalOpen] = useState(false);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState(null);
  const [selectedMemberUnitContext, setSelectedMemberUnitContext] = useState(null);

  const handleViewMemberDetail = (member, unit) => {
    setSelectedMemberForDetail(member);
    setSelectedMemberUnitContext(unit);
    setIsViewMemberModalOpen(true);
  };

  const calculateEndRentDate = (startDateStr, months) => {
    try {
      let day = 21, month = 8, year = 2026;
      if (startDateStr && startDateStr.includes('/')) {
        const parts = startDateStr.split('/');
        day = parseInt(parts[0], 10) || 21;
        month = (parseInt(parts[1], 10) - 1) || 8;
        year = parseInt(parts[2], 10) || 2026;
      }
      const d = new Date(year, month, day);
      d.setMonth(d.getMonth() + parseInt(months || 12, 10));
      
      const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${monthsNames[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) {
      return '21 Sep 2027';
    }
  };

  const handleAction = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOnboardingSubmit = (e) => {
    e.preventDefault();
    if (!onboardingForm.unitCode) {
      handleAction('Please select a unit to onboard.');
      return;
    }

    const towerLetter = onboardingForm.unitCode.charAt(0).toUpperCase();
    const towerName = `Tower ${towerLetter}`;
    const isRenter = onboardingForm.tenancyType === 'Renter';
    const effectiveDate = isRenter ? (onboardingForm.startRent || '21 Sep 2026') : (onboardingForm.entryDate || '21 Sep 2026');
    
    const newUnit = {
      code: onboardingForm.unitCode,
      tower: towerName,
      role: onboardingForm.tenancyType.toUpperCase(),
      handoverDate: effectiveDate,
      status: 'Occupant',
      rentalPeriod: isRenter ? onboardingForm.rentalPeriod : undefined,
      endRentDate: isRenter ? calculateEndRentDate(onboardingForm.startRent, onboardingForm.rentalPeriod) : undefined
    };

    if (!selectedTenant.units) {
      selectedTenant.units = [];
    }

    const exists = selectedTenant.units.some(u => u.code === newUnit.code);
    if (exists) {
      handleAction(`Unit ${newUnit.code} is already assigned to ${selectedTenant.name}.`);
      return;
    }

    selectedTenant.units.push(newUnit);
    
    setIsOnboardingModalOpen(false);
    setOnboardingForm({
      tenancyType: 'Owner',
      unitCode: '',
      entryDate: '21/09/2026',
      rentalPeriod: 12,
      startRent: '21/09/2026'
    });
    handleAction(`Unit ${newUnit.code} successfully onboarded as ${onboardingForm.tenancyType}!`);
  };

  const handleOpenAddMemberModal = (unit) => {
    setSelectedUnitForMember(unit);
    const randomCard = `AC-${Math.floor(1000 + Math.random() * 9000)}`;
    setMemberForm({
      name: '',
      relationship: 'Spouse',
      nik: '',
      email: '',
      phone: '',
      status: 'Active',
      accessCard: randomCard,
      rentalPeriod: 12,
      startRent: '21/09/2026'
    });
    setIsAddMemberModalOpen(true);
  };

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.nik.trim()) {
      handleAction('Please fill in required fields (Name and NIK).');
      return;
    }

    if (!selectedUnitForMember) {
      handleAction('No unit selected.');
      return;
    }

    const isRenterMember = memberForm.relationship === 'Renter';
    const newMember = {
      id: Date.now(),
      name: memberForm.name.trim(),
      relationship: memberForm.relationship,
      nik: memberForm.nik.trim(),
      email: memberForm.email.trim() || `${memberForm.name.trim().toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      phone: memberForm.phone.trim() || '—',
      status: memberForm.status || 'Active',
      accessCard: memberForm.accessCard.trim() || `AC-${Math.floor(1000 + Math.random() * 9000)}`,
      rentalPeriod: isRenterMember ? (memberForm.rentalPeriod || 12) : undefined,
      startRent: isRenterMember ? (memberForm.startRent || '21/09/2026') : undefined,
      endRentDate: isRenterMember ? calculateEndRentDate(memberForm.startRent, memberForm.rentalPeriod || 12) : undefined
    };

    if (selectedTenant.units) {
      const targetUnit = selectedTenant.units.find(u => u.code === selectedUnitForMember.code);
      if (targetUnit) {
        if (!targetUnit.members) {
          // If unit doesn't have members array yet, initialize with current unit members or empty
          const isOwner = (targetUnit.role || '').toUpperCase() === 'OWNER';
          const isUnoccupied = isOwner && (targetUnit.status === 'Unoccupied' || targetUnit.code === 'C0303');
          const isFirstUnit = selectedTenant.units[0]?.code === targetUnit.code;
          const initialMembers = isUnoccupied ? [] : (isFirstUnit ? [...(selectedTenant.members || [])] : []);
          targetUnit.members = [...initialMembers];
        }
        targetUnit.members.push(newMember);
        if (targetUnit.status === 'Unoccupied') {
          targetUnit.status = 'Occupant';
        }
      }
    } else {
      if (!selectedTenant.members) {
        selectedTenant.members = [];
      }
      selectedTenant.members.push(newMember);
    }

    setIsAddMemberModalOpen(false);
    handleAction(`Member ${newMember.name} successfully added to Unit ${selectedUnitForMember.code}!`);
  };

  if (!selectedTenant) {
    return (
      <div className="card p-5 text-center bg-white border shadow-sm" style={{ borderRadius: '12px' }}>
        <h5 className="text-dark mb-2">No tenant selected</h5>
        <button 
          type="button" 
          className="btn btn-primary mx-auto d-inline-flex align-items-center gap-2"
          onClick={handleBackToList}
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Back to Tenants List</span>
        </button>
      </div>
    );
  }

  // Initials for avatar
  const initials = selectedTenant.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const units = (selectedTenant.units || []).map((u, idx) => {
    const roleLabel = titleCase(u.role) || 'Owner';
    const isUnoccupied = roleLabel === 'Owner' && (u.status === 'Unoccupied' || u.code === 'C0303');
    // Units without their own member list fall back to the tenant's members on the first unit.
    const members = u.members !== undefined
      ? u.members
      : (isUnoccupied ? [] : (idx === 0 ? (selectedTenant.members || []) : []));
    return { ...u, roleLabel, statusLabel: isUnoccupied ? 'Unoccupied' : 'Occupant', members };
  });
  const unitRoleOptions = [...new Set(units.map((u) => u.roleLabel))];
  const filteredUnits = units.filter((u) =>
    matches(unitFilters.query, u.code, u.tower)
    && (!unitFilters.role || u.roleLabel === unitFilters.role)
    && (!unitFilters.status || u.statusLabel === unitFilters.status)
  );

  const memberRows = units.flatMap((unit) => unit.members.map((m) => ({
    unit,
    member: {
      ...m,
      email: m.email || `${m.name.trim().toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      statusLabel: (m.status || '').toLowerCase() === 'pending' ? 'Pending' : 'Active'
    }
  })));
  const memberRelationOptions = [...new Set(memberRows.map((r) => r.member.relationship))];
  const filteredMembers = memberRows.filter(({ member: m, unit }) =>
    matches(memberFilters.query, m.name, m.email, m.nik)
    && (!memberFilters.unit || unit.code === memberFilters.unit)
    && (!memberFilters.relation || m.relationship === memberFilters.relation)
    && (!memberFilters.status || m.statusLabel === memberFilters.status)
  );

  const vehicles = selectedTenant.vehicles || [];
  const vehicleTypeOptions = [...new Set(vehicles.map((v) => v.type))];
  const filteredVehicles = vehicles.filter((v) =>
    matches(vehicleFilters.query, v.plate, v.brand, v.slot)
    && (!vehicleFilters.type || v.type === vehicleFilters.type)
  );

  const rowMenuItems = (row) => (row.kind === 'unit'
    ? [
      { key: 'view', label: 'View detail unit', icon: Eye, run: () => { setRowMenu(null); handleAction(`Viewing details for Unit ${row.unit.code}`); } },
      { key: 'offboard', label: 'Offboarding ownership', icon: SignOut, danger: true, run: () => { setRowMenu(null); handleAction(`Offboarding Ownership flow initiated for Unit ${row.unit.code}`); } }
    ]
    : [
      { key: 'view', label: 'View detail', icon: Eye, run: () => { setRowMenu(null); handleViewMemberDetail(row.member, row.unit); } }
    ]);

  const toggleRowMenu = (row, trigger) => {
    const same = rowMenu && (rowMenu.row.key ?? rowMenu.row.name) === (row.key ?? row.name);
    setRowMenu(same ? null : rowMenuAnchor(row, trigger, rowMenuItems(row).length));
  };

  const closeRowMenu = (restoreFocus) => {
    if (restoreFocus) rowMenu?.trigger?.focus();
    setRowMenu(null);
  };

  // "Owner A0101 · Renter C0303" under the name in the banner.
  const unitSummary = selectedTenant.units?.length
    ? selectedTenant.units.map((u) => `${u.role.charAt(0)}${u.role.slice(1).toLowerCase()} ${u.code}`).join(' · ')
    : 'No units assigned';

  const tabs = [
    { id: 'information', label: 'Information', icon: Info, count: null },
    { id: 'units', label: 'Units', icon: Buildings, count: units.length },
    { id: 'members', label: 'Members', icon: Users, count: memberRows.length },
    { id: 'vehicles', label: 'Vehicles', icon: Car, count: vehicles.length }
  ];

  const onTabKeyDown = (e, index) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setDetailActiveTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <div className="w-100 position-relative pb-4">
      {/* Toast Notification */}
      {notification && (
        <div 
          className="position-fixed bottom-0 end-0 p-4" 
          style={{ zIndex: 1100 }}
        >
          <div className="alert alert-dark shadow-lg d-flex align-items-center mb-0 py-3 px-4 text-white border-0 rounded-pill" style={{ gap: '10px' }}>
            <CheckCircle size={20} className="text-info" weight="bold" />
            <span className="small fw-semibold">{notification}</span>
          </div>
        </div>
      )}

      <Breadcrumb
        className="add-emp-breadcrumb"
        items={[
          { label: 'Tenant Management' },
          { label: 'Tenant List', onClick: handleBackToList },
          { label: 'Detail Tenant' }
        ]}
      />

      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button type="button" className="emp-hero-back-btn" onClick={handleBackToList} aria-label="Back to Tenant List">
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="emp-hero-banner-tag">TENANT</div>
              <h1 className="emp-hero-banner-title">{selectedTenant.name}</h1>
              <p className="emp-hero-banner-desc">{unitSummary}</p>
            </div>
          </div>
          <button
            type="button"
            className="emp-hero-edit-btn"
            onClick={() => handleAction(`Edit modal opened for ${selectedTenant.name}`)}
          >
            <PencilSimple size={19} weight="bold" aria-hidden="true" />
            <span>Edit tenant</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Profile Header Card with Integrated Tabs */}
      <div 
        className="card border bg-white shadow-2xs mb-4 overflow-hidden"
        style={{ borderRadius: '12px', borderColor: '#E2E8F0' }}
      >
        {/* Profile Info Section */}
        <div style={{ padding: '28px 36px 20px 36px' }}>
          <div className="d-flex align-items-center gap-4">
            {/* Avatar */}
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
              style={{
                width: '72px',
                height: '72px',
                backgroundColor: '#EEF2F6',
                color: '#002B7F',
                fontSize: '1.6rem',
                border: '1.5px solid #E2E8F0'
              }}
            >
              {initials}
            </div>

            {/* Name & Contact Details */}
            <div>
              <h3 className="fw-bold mb-2 text-dark" style={{ fontSize: '1.55rem', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                {selectedTenant.name}
              </h3>
              <div className="d-flex flex-wrap align-items-center" style={{ fontSize: '1.15rem', gap: '28px', color: '#334155' }}>
                <div className="d-inline-flex align-items-center" style={{ gap: '12px' }}>
                  <EnvelopeSimple size={22} weight="regular" style={{ color: '#64748B' }} />
                  <span className="fw-medium">{selectedTenant.email}</span>
                </div>
                <span className="text-muted opacity-40" style={{ fontSize: '1.3rem' }}>•</span>
                <div className="d-inline-flex align-items-center" style={{ gap: '12px' }}>
                  <Phone size={22} weight="regular" style={{ color: '#64748B' }} />
                  <span className="fw-medium">{selectedTenant.phone || '089906151251'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tnm-detail-tabs">
          <div className="ws-toolbar-tabs" role="tablist" aria-label="Tenant detail">
            {tabs.map((tab, i) => {
              const active = detailActiveTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[tab.id] = el; }}
                  type="button"
                  role="tab"
                  id={`tnm-detail-tab-${tab.id}`}
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  className={`ws-toolbar-tab ${active ? 'is-active' : ''}`}
                  onClick={() => setDetailActiveTab(tab.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                >
                  <Icon size={15} weight={active ? 'bold' : 'regular'} aria-hidden="true" />
                  <span>{tab.label}</span>
                  {tab.count !== null && <span className="unit-tab-count">{tab.count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Tab Content Area (Modern & Engaging Data Tiles) */}
      {detailActiveTab === 'information' && (
        <div className="d-flex flex-column gap-4">
          {/* Card 1: Tenant Information */}
          <div 
            className="card border bg-white shadow-2xs"
            style={{ borderRadius: '12px', borderColor: '#E2E8F0', padding: '32px 36px' }}
          >
            {/* Header */}
            <div className="tnm-info-card__head">
              <div className="d-flex align-items-center gap-3">
                <div className="emp-detail-card-badge emp-badge-secondary tnm-info-card__badge" aria-hidden="true">
                  <IdentificationCard size={22} weight="bold" />
                </div>
                <div>
                  <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                    Tenant Information
                  </h4>
                  <div className="text-muted fw-medium" style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    Personal, legal, and identification records
                  </div>
                </div>
              </div>
            </div>

            {/* Modern 2-Column Grid of Structured Field Tiles */}
            <div className="row g-4">
              {/* NIK */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <IdentificationCard size={16} style={{ color: '#002B7F' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      NIK (Identity Number)
                    </span>
                  </div>
                  <div className="fw-semibold text-dark font-monospace" style={{ fontSize: '0.975rem' }}>
                    {selectedTenant.nik || '3174051204850001'}
                  </div>
                </div>
              </div>

              {/* CITIZENSHIP */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <GlobeHemisphereWest size={16} style={{ color: '#002B7F' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      Citizenship
                    </span>
                  </div>
                  <div className="fw-semibold text-dark" style={{ fontSize: '0.975rem' }}>
                    {selectedTenant.citizenship || 'Indonesian (WNI)'}
                  </div>
                </div>
              </div>

              {/* PHONE NUMBER */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <Phone size={16} style={{ color: '#002B7F' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      Phone Number
                    </span>
                  </div>
                  <div className="fw-semibold text-dark font-monospace" style={{ fontSize: '0.975rem' }}>
                    {selectedTenant.phone || '089906151251'}
                  </div>
                </div>
              </div>

              {/* NPWP NUMBER */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <Receipt size={16} style={{ color: '#002B7F' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      NPWP Number
                    </span>
                  </div>
                  <div className="fw-semibold text-dark font-monospace" style={{ fontSize: '0.975rem' }}>
                    {selectedTenant.npwp || '09.254.678.9-012.000'}
                  </div>
                </div>
              </div>

              {/* PROVINCE */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <MapPin size={16} style={{ color: '#002B7F' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      Province
                    </span>
                  </div>
                  <div className="fw-semibold text-dark" style={{ fontSize: '0.975rem' }}>
                    {selectedTenant.province || 'DKI Jakarta'}
                  </div>
                </div>
              </div>

              {/* POSTAL CODE */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <Buildings size={16} style={{ color: '#002B7F' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      Postal Code
                    </span>
                  </div>
                  <div className="fw-semibold text-dark font-monospace" style={{ fontSize: '0.975rem' }}>
                    {selectedTenant.postalCode || '12190'}
                  </div>
                </div>
              </div>

              {/* KTP ADDRESS (Full Width Tile with Ultra Spacious Padding & Line Height) */}
              <div className="col-12">
                <div 
                  className="border"
                  style={{ 
                    backgroundColor: '#F8FAFC', 
                    borderColor: '#E2E8F0', 
                    borderRadius: '10px', 
                    padding: '24px 28px' 
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2.5 text-muted">
                    <MapPin size={18} style={{ color: '#002B7F' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      KTP / Legal Address
                    </span>
                  </div>
                  <div className="fw-semibold text-dark" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
                    {selectedTenant.ktpAddress || 'Jl. Jend. Sudirman Kav. 52-53, Kel. Karet Semanggi, Kec. Setiabudi, Jakarta Selatan'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Emergency Contact */}
          <div 
            className="card border bg-white shadow-2xs"
            style={{ borderRadius: '12px', borderColor: '#E2E8F0', padding: '32px 36px' }}
          >
            {/* Header */}
            <div className="tnm-info-card__head">
              <div className="d-flex align-items-center gap-3">
                <div className="emp-detail-card-badge emp-badge-secondary tnm-info-card__badge" aria-hidden="true">
                  <ShieldCheck size={22} weight="bold" />
                </div>
                <div>
                  <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                    Emergency Contact
                  </h4>
                  <div className="text-muted fw-medium" style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    Designated emergency point of contact
                  </div>
                </div>
              </div>
            </div>

            {/* Modern 2-Column Grid of Structured Field Tiles */}
            <div className="row g-4">
              {/* CONTACT NAME */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <User size={16} style={{ color: '#DC2626' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      Contact Name
                    </span>
                  </div>
                  <div className="fw-semibold text-dark" style={{ fontSize: '0.975rem' }}>
                    {selectedTenant.emergencyContact?.name || 'Siti Rahmawati'}
                  </div>
                </div>
              </div>

              {/* RELATIONSHIP */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <Heart size={16} style={{ color: '#DC2626' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      Relationship
                    </span>
                  </div>
                  <div className="fw-semibold text-dark" style={{ fontSize: '0.975rem' }}>
                    {selectedTenant.emergencyContact?.relationship || 'Spouse'}
                  </div>
                </div>
              </div>

              {/* EMERGENCY PHONE */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <Phone size={16} style={{ color: '#DC2626' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      Phone Number
                    </span>
                  </div>
                  <div className="fw-semibold text-dark font-monospace" style={{ fontSize: '0.975rem' }}>
                    {selectedTenant.emergencyContact?.phone || '081298765432'}
                  </div>
                </div>
              </div>

              {/* NIK */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <IdentificationCard size={16} style={{ color: '#DC2626' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      NIK (Identity Number)
                    </span>
                  </div>
                  <div className="fw-semibold text-dark font-monospace" style={{ fontSize: '0.975rem' }}>
                    {selectedTenant.emergencyContact?.nik || '3174055508890002'}
                  </div>
                </div>
              </div>

              {/* KTP ADDRESS */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <MapPin size={16} style={{ color: '#DC2626' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      KTP Address
                    </span>
                  </div>
                  <div className="fw-semibold text-dark" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {selectedTenant.emergencyContact?.ktpAddress || 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan'}
                  </div>
                </div>
              </div>

              {/* CURRENT ADDRESS */}
              <div className="col-12 col-md-6">
                <div 
                  className="border h-100 d-flex flex-column"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: '10px', padding: '18px 22px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                    <MapPin size={16} style={{ color: '#DC2626' }} weight="bold" />
                    <span className="fw-bold text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em', color: '#64748B' }}>
                      Current Address
                    </span>
                  </div>
                  <div className="fw-semibold text-dark" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {selectedTenant.emergencyContact?.currentAddress || 'Same as KTP Address'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailActiveTab === 'units' && (
        <div className="emp-card-container tm-page">
          <div className="emp-card-header">
            <div>
              <h2 className="emp-card-title">Units</h2>
              <p className="emp-card-desc">Units this tenant owns, rents, or holds a proxy for.</p>
            </div>
            <div className="emp-card-actions">
              <button type="button" className="emp-btn-primary" onClick={() => setIsOnboardingModalOpen(true)}>
                <Plus size={16} weight="bold" aria-hidden="true" />
                <span>Onboarding</span>
              </button>
            </div>
          </div>

          <div className="emp-search-row unit-filter-row">
            <SearchBox label="Search units" placeholder="Search unit code or tower" value={unitFilters.query} onChange={(v) => setUnitFilter('query', v)} />
            <FilterSelect label="Filter role" value={unitFilters.role} onChange={(e) => setUnitFilter('role', e.target.value)}>
              <option value="">All roles</option>
              {unitRoleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </FilterSelect>
            <FilterSelect label="Filter status" value={unitFilters.status} onChange={(e) => setUnitFilter('status', e.target.value)}>
              <option value="">All statuses</option>
              {UNIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>
            <ResetButton disabled={!hasFilters(unitFilters)} onClick={() => setUnitFilters(EMPTY_UNIT_FILTERS)} />
          </div>

          <div className="emp-card-body">
            <div className="emp-table-card-inner">
              {filteredUnits.length === 0 ? (
                <EmptyState
                  Icon={Buildings}
                  filtered={hasFilters(unitFilters)}
                  noun="units"
                  idle="Units appear here once this tenant is onboarded to one."
                />
              ) : (
                <div className="emp-table-responsive">
                  <table className="emp-table tm-table">
                    <thead>
                      <tr>
                        {UNIT_COLUMNS.map((c) => <th key={c} scope="col">{c}</th>)}
                        <th scope="col" className="unit-col-action">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnits.map((u) => (
                        <tr key={u.code}>
                          <td data-label="Unit"><UnitBadge code={u.code} /></td>
                          <td data-label="Tower"><span className="tm-memberof__name">{u.tower}</span></td>
                          <td data-label="Role"><RoleChip role={u.roleLabel} /></td>
                          <td data-label="Entry date"><span className="unit-muted">{u.handoverDate}</span></td>
                          <td data-label="Status"><StatusPill status={u.statusLabel} /></td>
                          <td className="unit-col-action">
                            <DotsButton
                              name={u.code}
                              open={rowMenu?.row.name === u.code}
                              onClick={(trigger) => toggleRowMenu({ name: u.code, unit: u, kind: 'unit' }, trigger)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailActiveTab === 'members' && (
        <div className="emp-card-container tm-page">
          <div className="emp-card-header">
            <div>
              <h2 className="emp-card-title">Members</h2>
              <p className="emp-card-desc">Family and staff registered under this tenant, per unit.</p>
            </div>
            <div className="emp-card-actions">
              <button
                type="button"
                className="emp-btn-primary"
                disabled={units.length === 0}
                onClick={() => handleOpenAddMemberModal(units.find((u) => u.code === memberFilters.unit) ?? units[0])}
              >
                <Plus size={16} weight="bold" aria-hidden="true" />
                <span>Add member</span>
              </button>
            </div>
          </div>

          <div className="emp-search-row unit-filter-row">
            <SearchBox label="Search members" placeholder="Search name, email, or NIK" value={memberFilters.query} onChange={(v) => setMemberFilter('query', v)} />
            <FilterSelect label="Filter unit" value={memberFilters.unit} onChange={(e) => setMemberFilter('unit', e.target.value)}>
              <option value="">All units</option>
              {units.map((u) => <option key={u.code} value={u.code}>{u.code}</option>)}
            </FilterSelect>
            <FilterSelect label="Filter relation" value={memberFilters.relation} onChange={(e) => setMemberFilter('relation', e.target.value)}>
              <option value="">All relations</option>
              {memberRelationOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </FilterSelect>
            <FilterSelect label="Filter status" value={memberFilters.status} onChange={(e) => setMemberFilter('status', e.target.value)}>
              <option value="">All statuses</option>
              {MEMBER_ROW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>
            <ResetButton disabled={!hasFilters(memberFilters)} onClick={() => setMemberFilters(EMPTY_MEMBER_FILTERS)} />
          </div>

          <div className="emp-card-body">
            <div className="emp-table-card-inner">
              {filteredMembers.length === 0 ? (
                <EmptyState
                  Icon={Users}
                  filtered={hasFilters(memberFilters)}
                  noun="members"
                  idle={units.length === 0 ? 'Onboard this tenant to a unit first, then add members to it.' : 'Use Add member to register family or staff to a unit.'}
                />
              ) : (
                <div className="emp-table-responsive">
                  <table className="emp-table tm-table">
                    <thead>
                      <tr>
                        {MEMBER_COLUMNS.map((c) => <th key={c} scope="col">{c}</th>)}
                        <th scope="col" className="unit-col-action">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map(({ member: m, unit }) => (
                        <tr key={`${unit.code}-${m.id}`}>
                          <td data-label="Member"><PersonCell name={m.name} email={m.email} /></td>
                          <td data-label="Relation"><span className="tm-relation">{m.relationship}</span></td>
                          <td data-label="NIK"><span className="unit-muted">{m.nik}</span></td>
                          <td data-label="Unit"><UnitBadge code={unit.code} /></td>
                          <td data-label="Status"><StatusPill status={m.statusLabel} /></td>
                          <td className="unit-col-action">
                            <DotsButton
                              name={m.name}
                              open={rowMenu?.row.key === `${unit.code}-${m.id}`}
                              onClick={(trigger) => toggleRowMenu({ key: `${unit.code}-${m.id}`, name: m.name, member: m, unit, kind: 'member' }, trigger)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailActiveTab === 'vehicles' && (
        <div className="emp-card-container tm-page">
          <div className="emp-card-header">
            <div>
              <h2 className="emp-card-title">Vehicles</h2>
              <p className="emp-card-desc">Vehicles registered to this tenant and the parking slot each one uses.</p>
            </div>
            <div className="emp-card-actions">
              <button type="button" className="emp-btn-primary" onClick={() => setIsAddVehicleOpen(true)}>
                <Plus size={16} weight="bold" aria-hidden="true" />
                <span>Add vehicle</span>
              </button>
            </div>
          </div>

          <div className="emp-search-row unit-filter-row">
            <SearchBox label="Search vehicles" placeholder="Search plate, brand, or slot" value={vehicleFilters.query} onChange={(v) => setVehicleFilter('query', v)} />
            <FilterSelect label="Filter type" value={vehicleFilters.type} onChange={(e) => setVehicleFilter('type', e.target.value)}>
              <option value="">All types</option>
              {vehicleTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </FilterSelect>
            <ResetButton disabled={!hasFilters(vehicleFilters)} onClick={() => setVehicleFilters(EMPTY_VEHICLE_FILTERS)} />
          </div>

          <div className="emp-card-body">
            <div className="emp-table-card-inner">
              {filteredVehicles.length === 0 ? (
                <EmptyState
                  Icon={Car}
                  filtered={hasFilters(vehicleFilters)}
                  noun="vehicles"
                  idle="Vehicles appear here once registered to this tenant."
                />
              ) : (
                <div className="emp-table-responsive">
                  <table className="emp-table tm-table">
                    <thead>
                      <tr>
                        {VEHICLE_COLUMNS.map((c) => <th key={c} scope="col">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehicles.map((v) => (
                        <tr key={v.id}>
                          <td data-label="Plate"><span className="tm-unit-badge">{v.plate}</span></td>
                          <td data-label="Type"><span className="tm-relation">{v.type}</span></td>
                          <td data-label="Brand & model"><span className="tm-memberof__name">{v.brand}</span></td>
                          <td data-label="Color"><span className="unit-muted">{v.color}</span></td>
                          <td data-label="Parking slot"><span className="tm-memberof__name">{v.slot}</span></td>
                          <td data-label="RFID"><span className="unit-muted">{v.rfid}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddVehicleOpen && (
        <AddVehicleDialog
          tenantName={selectedTenant.name}
          existingPlates={vehicles.map((v) => v.plate)}
          onCancel={() => setIsAddVehicleOpen(false)}
          onSave={(vehicle) => {
            selectedTenant.vehicles = [...vehicles, { ...vehicle, id: Date.now() }];
            setIsAddVehicleOpen(false);
            handleAction(`Vehicle ${vehicle.plate} added to ${selectedTenant.name}.`);
          }}
        />
      )}

      {rowMenu && <RowActionMenu anchor={rowMenu} items={rowMenuItems(rowMenu.row)} onClose={closeRowMenu} />}

      {/* 8. Onboarding Unit Modal (Matches User Screenshot) */}
      {isOnboardingModalOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.55)', 
            zIndex: 1060,
            backdropFilter: 'blur(3px)',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOnboardingModalOpen(false);
          }}
        >
          <div 
            className="bg-white border shadow-2xl w-100 overflow-hidden"
            style={{ 
              maxWidth: '540px', 
              borderRadius: '16px',
              borderColor: '#E2E8F0',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Modal Header */}
            <div 
              className="d-flex align-items-start justify-content-between px-4 pt-4 pb-3"
              style={{ borderBottom: '1px solid #F1F5F9' }}
            >
              <div>
                <h5 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: '1.2rem', letterSpacing: '-0.01em' }}>
                  Onboarding Unit
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                  Select unit to connect to this tenant
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-link p-1 text-muted text-decoration-none d-flex align-items-center justify-content-center border-0 shadow-none"
                style={{ borderRadius: '8px', width: '32px', height: '32px', marginTop: '-4px', marginRight: '-4px', cursor: 'pointer' }}
                onClick={() => setIsOnboardingModalOpen(false)}
                title="Close"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleOnboardingSubmit}>
              <div className="p-4 d-flex flex-column" style={{ gap: '16px' }}>
                {/* Tenancy Type */}
                <div>
                  <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                    Tenancy Type <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="form-select shadow-none"
                    style={{ 
                      borderRadius: '8px', 
                      borderColor: '#CBD5E1', 
                      height: '42px',
                      fontSize: '0.875rem',
                      color: '#1E293B',
                      backgroundColor: '#FFFFFF',
                      padding: '0 14px',
                      cursor: 'pointer'
                    }}
                    value={onboardingForm.tenancyType}
                    onChange={(e) => setOnboardingForm(prev => ({ ...prev, tenancyType: e.target.value }))}
                    required
                  >
                    <option value="Owner">Owner</option>
                    <option value="Renter">Renter</option>
                    <option value="Proxy">Proxy</option>
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                    Unit <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="form-select shadow-none"
                    style={{ 
                      borderRadius: '8px', 
                      borderColor: '#CBD5E1', 
                      height: '42px',
                      fontSize: '0.875rem',
                      color: onboardingForm.unitCode ? '#1E293B' : '#64748B',
                      backgroundColor: '#FFFFFF',
                      padding: '0 14px',
                      cursor: 'pointer'
                    }}
                    value={onboardingForm.unitCode}
                    onChange={(e) => setOnboardingForm(prev => ({ ...prev, unitCode: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Unit --</option>
                    <option value="A0101">A0101 (Tower A - Floor 1)</option>
                    <option value="A0205">A0205 (Tower A - Floor 2)</option>
                    <option value="AA0708">AA0708 (Tower A - Floor 7)</option>
                    <option value="B0502">B0502 (Tower B - Floor 5)</option>
                    <option value="B1204">B1204 (Tower B - Floor 12)</option>
                    <option value="C0303">C0303 (Tower C - Floor 3)</option>
                    <option value="C0808">C0808 (Tower C - Floor 8)</option>
                    <option value="D0201">D0201 (Tower D - Floor 2)</option>
                    <option value="D1005">D1005 (Tower D - Floor 10)</option>
                  </select>
                </div>

                {/* Entry Date / Renter Fields */}
                {onboardingForm.tenancyType === 'Renter' ? (
                  <div>
                    <div className="row g-3">
                      {/* Rental Period (month) */}
                      <div className="col-12 col-sm-6">
                        <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                          Rental Period (month) <span className="text-danger">*</span>
                        </label>
                        <select 
                          className="form-select shadow-none"
                          style={{ 
                            borderRadius: '8px', 
                            borderColor: '#CBD5E1', 
                            height: '42px',
                            fontSize: '0.875rem',
                            color: '#1E293B',
                            backgroundColor: '#FFFFFF',
                            padding: '0 14px',
                            cursor: 'pointer'
                          }}
                          value={onboardingForm.rentalPeriod || 12}
                          onChange={(e) => setOnboardingForm(prev => ({ ...prev, rentalPeriod: parseInt(e.target.value, 10) }))}
                          required
                        >
                          <option value={1}>1</option>
                          <option value={3}>3</option>
                          <option value={6}>6</option>
                          <option value={12}>12</option>
                          <option value={24}>24</option>
                          <option value={36}>36</option>
                        </select>
                      </div>

                      {/* Start Rent */}
                      <div className="col-12 col-sm-6">
                        <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                          Start Rent <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                          <input 
                            type="text" 
                            className="form-control shadow-none"
                            style={{ 
                              borderRadius: '8px', 
                              borderColor: '#CBD5E1', 
                              height: '42px',
                              fontSize: '0.875rem', 
                              color: '#1E293B',
                              backgroundColor: '#FFFFFF',
                              padding: '0 38px 0 14px'
                            }}
                            value={onboardingForm.startRent || '21/09/2026'}
                            onChange={(e) => setOnboardingForm(prev => ({ ...prev, startRent: e.target.value }))}
                            placeholder="21/09/2026"
                            required
                          />
                          <CalendarBlank 
                            size={18} 
                            weight="bold" 
                            className="position-absolute top-50 translate-middle-y" 
                            style={{ right: '14px', color: '#64748B', pointerEvents: 'none' }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notice & Calculation */}
                    <div className="mt-2 text-muted" style={{ fontSize: '0.785rem', lineHeight: '1.45' }}>
                      <div>
                        Estimated End Rent Date: <strong className="text-dark">{calculateEndRentDate(onboardingForm.startRent, onboardingForm.rentalPeriod || 12)}.</strong>
                      </div>
                      <div className="mt-0.5" style={{ color: '#64748B' }}>
                        After end date, unit will be automatically unlinked from renter account.
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Entry Date for Owner & Proxy */
                  <div>
                    <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                      Entry Date <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <input 
                        type="text" 
                        className="form-control shadow-none"
                        style={{ 
                          borderRadius: '8px', 
                          borderColor: '#CBD5E1', 
                          height: '42px',
                          fontSize: '0.875rem', 
                          color: '#1E293B',
                          backgroundColor: '#FFFFFF',
                          padding: '0 38px 0 14px'
                        }}
                        value={onboardingForm.entryDate}
                        onChange={(e) => setOnboardingForm(prev => ({ ...prev, entryDate: e.target.value }))}
                        placeholder="21/09/2026"
                        required
                      />
                      <CalendarBlank 
                        size={18} 
                        weight="bold" 
                        className="position-absolute top-50 translate-middle-y" 
                        style={{ right: '14px', color: '#64748B', pointerEvents: 'none' }} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div 
                className="px-4 py-3 d-flex justify-content-end"
                style={{ borderTop: '1px solid #F1F5F9', backgroundColor: '#FFFFFF' }}
              >
                <button 
                  type="submit" 
                  className="btn text-white fw-bold shadow-none border-0"
                  style={{ 
                    backgroundColor: '#0F172A', 
                    borderRadius: '8px', 
                    padding: '9px 26px', 
                    fontSize: '0.875rem',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0F172A'}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Add Member Modal */}
      {isAddMemberModalOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.55)', 
            zIndex: 1060,
            backdropFilter: 'blur(3px)',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddMemberModalOpen(false);
          }}
        >
          <div 
            className="bg-white border shadow-2xl w-100 overflow-hidden"
            style={{ 
              maxWidth: '540px', 
              borderRadius: '16px', 
              borderColor: '#E2E8F0',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Modal Header */}
            <div 
              className="d-flex align-items-start justify-content-between px-4 pt-4 pb-3"
              style={{ borderBottom: '1px solid #F1F5F9' }}
            >
              <div>
                <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                  Add Member to Unit {selectedUnitForMember?.code}
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.825rem' }}>
                  Register a family member or occupant for this unit.
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-light border-0 p-1.5 text-muted d-flex align-items-center justify-content-center"
                style={{ borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => setIsAddMemberModalOpen(false)}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddMemberSubmit}>
              <div className="p-4 d-flex flex-column" style={{ gap: '16px' }}>
                <div>
                  <label htmlFor="tnm-member-unit" className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                    Target Unit
                  </label>
                  <select
                    id="tnm-member-unit"
                    className="form-select shadow-none"
                    style={{
                      borderRadius: '8px',
                      borderColor: '#CBD5E1',
                      height: '42px',
                      fontSize: '0.875rem',
                      color: '#1E293B',
                      backgroundColor: '#FFFFFF',
                      padding: '0 14px',
                      cursor: 'pointer'
                    }}
                    value={selectedUnitForMember?.code ?? ''}
                    onChange={(e) => setSelectedUnitForMember(units.find((u) => u.code === e.target.value))}
                  >
                    {units.map((u) => (
                      <option key={u.code} value={u.code}>{u.code} · {u.tower} · {u.roleLabel}</option>
                    ))}
                  </select>
                </div>

                {/* Member Name */}
                <div>
                  <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control shadow-none"
                    style={{ 
                      borderRadius: '8px', 
                      borderColor: '#CBD5E1', 
                      height: '42px',
                      fontSize: '0.875rem', 
                      color: '#1E293B',
                      backgroundColor: '#FFFFFF',
                      padding: '0 14px'
                    }}
                    value={memberForm.name}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Siti Rahmawati"
                    required
                  />
                </div>

                {/* Row: Relationship & NIK */}
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                      Relationship <span className="text-danger">*</span>
                    </label>
                    <select 
                      className="form-select shadow-none"
                      style={{ 
                        borderRadius: '8px', 
                        borderColor: '#CBD5E1', 
                        height: '42px',
                        fontSize: '0.875rem',
                        color: '#1E293B',
                        backgroundColor: '#FFFFFF',
                        padding: '0 14px',
                        cursor: 'pointer'
                      }}
                      value={memberForm.relationship}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, relationship: e.target.value }))}
                      required
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Relative">Relative</option>
                      <option value="Renter">Renter</option>
                      <option value="Proxy / Representative">Proxy / Representative</option>
                      <option value="Assistant / Driver">Assistant / Driver</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                      NIK (National ID) <span className="text-danger">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-control shadow-none font-monospace"
                      style={{ 
                        borderRadius: '8px', 
                        borderColor: '#CBD5E1', 
                        height: '42px',
                        fontSize: '0.875rem', 
                        color: '#1E293B',
                        backgroundColor: '#FFFFFF',
                        padding: '0 14px'
                      }}
                      value={memberForm.nik}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, nik: e.target.value }))}
                      placeholder="e.g. 3174051204850001"
                      required
                    />
                  </div>
                </div>

                {/* Row: Email & Phone */}
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      className="form-control shadow-none"
                      style={{ 
                        borderRadius: '8px', 
                        borderColor: '#CBD5E1', 
                        height: '42px',
                        fontSize: '0.875rem', 
                        color: '#1E293B',
                        backgroundColor: '#FFFFFF',
                        padding: '0 14px'
                      }}
                      value={memberForm.email}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. member@gmail.com"
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                      Phone Number
                    </label>
                    <input 
                      type="text" 
                      className="form-control shadow-none"
                      style={{ 
                        borderRadius: '8px', 
                        borderColor: '#CBD5E1', 
                        height: '42px',
                        fontSize: '0.875rem', 
                        color: '#1E293B',
                        backgroundColor: '#FFFFFF',
                        padding: '0 14px'
                      }}
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. 081288990011"
                    />
                  </div>
                </div>

                {/* Row: Member Status & Access Card */}
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                      Status <span className="text-danger">*</span>
                    </label>
                    <select 
                      className="form-select shadow-none"
                      style={{ 
                        borderRadius: '8px', 
                        borderColor: '#CBD5E1', 
                        height: '42px',
                        fontSize: '0.875rem',
                        color: '#1E293B',
                        backgroundColor: '#FFFFFF',
                        padding: '0 14px',
                        cursor: 'pointer'
                      }}
                      value={memberForm.status || 'Active'}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                      Access Card
                    </label>
                    <input 
                      type="text" 
                      className="form-control shadow-none font-monospace"
                      style={{ 
                        borderRadius: '8px', 
                        borderColor: '#CBD5E1', 
                        height: '42px',
                        fontSize: '0.875rem', 
                        color: '#1E293B',
                        backgroundColor: '#FFFFFF',
                        padding: '0 14px'
                      }}
                      value={memberForm.accessCard}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, accessCard: e.target.value }))}
                      placeholder="e.g. AC-1042"
                    />
                  </div>
                </div>

                {/* Conditional Renter Fields when Member Relationship is Renter */}
                {memberForm.relationship === 'Renter' && (
                  <div className="p-3 border rounded-3" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
                    <div className="row g-3">
                      {/* Rental Period (month) */}
                      <div className="col-12 col-sm-6">
                        <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                          Rental Period (month) <span className="text-danger">*</span>
                        </label>
                        <select 
                          className="form-select shadow-none"
                          style={{ 
                            borderRadius: '8px', 
                            borderColor: '#CBD5E1', 
                            height: '42px',
                            fontSize: '0.875rem',
                            color: '#1E293B',
                            backgroundColor: '#FFFFFF',
                            padding: '0 14px',
                            cursor: 'pointer'
                          }}
                          value={memberForm.rentalPeriod || 12}
                          onChange={(e) => setMemberForm(prev => ({ ...prev, rentalPeriod: parseInt(e.target.value, 10) }))}
                          required
                        >
                          <option value={1}>1</option>
                          <option value={3}>3</option>
                          <option value={6}>6</option>
                          <option value={12}>12</option>
                          <option value={24}>24</option>
                          <option value={36}>36</option>
                        </select>
                      </div>

                      {/* Start Rent */}
                      <div className="col-12 col-sm-6">
                        <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                          Start Rent <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                          <input 
                            type="text" 
                            className="form-control shadow-none"
                            style={{ 
                              borderRadius: '8px', 
                              borderColor: '#CBD5E1', 
                              height: '42px',
                              fontSize: '0.875rem', 
                              color: '#1E293B',
                              backgroundColor: '#FFFFFF',
                              padding: '0 38px 0 14px'
                            }}
                            value={memberForm.startRent || '21/09/2026'}
                            onChange={(e) => setMemberForm(prev => ({ ...prev, startRent: e.target.value }))}
                            placeholder="21/09/2026"
                            required
                          />
                          <CalendarBlank 
                            size={18} 
                            weight="bold" 
                            className="position-absolute top-50 translate-middle-y" 
                            style={{ right: '14px', color: '#64748B', pointerEvents: 'none' }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notice & Calculation */}
                    <div className="mt-2 text-muted" style={{ fontSize: '0.785rem', lineHeight: '1.45' }}>
                      <div>
                        Estimated End Rent Date: <strong className="text-dark">{calculateEndRentDate(memberForm.startRent, memberForm.rentalPeriod || 12)}.</strong>
                      </div>
                      <div className="mt-0.5" style={{ color: '#92400E' }}>
                        After end date, rental access for this member will automatically expire.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div 
                className="px-4 py-3 d-flex justify-content-end align-items-center"
                style={{ borderTop: '1px solid #F1F5F9', backgroundColor: '#FFFFFF', gap: '10px' }}
              >
                <button
                  type="button"
                  className="btn btn-light border fw-semibold shadow-none"
                  style={{
                    borderRadius: '8px',
                    borderColor: '#CBD5E1',
                    padding: '8px 18px',
                    fontSize: '0.875rem',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                  onClick={() => setIsAddMemberModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn text-white fw-bold shadow-none border-0"
                  style={{ 
                    backgroundColor: '#0F172A', 
                    borderRadius: '8px', 
                    padding: '8px 24px', 
                    fontSize: '0.875rem',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0F172A'}
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. View Member Detail Modal */}
      {isViewMemberModalOpen && selectedMemberForDetail && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1055, backdropFilter: 'blur(3px)' }}
        >
          <div 
            className="card border-0 shadow-2xl bg-white animate-fade-in"
            style={{ width: '92%', maxWidth: '560px', borderRadius: '16px', overflow: 'hidden' }}
          >
            {/* Modal Header */}
            <div 
              className="px-4 py-3.5 d-flex align-items-center justify-content-between text-white"
              style={{ backgroundColor: '#002B7F' }}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div 
                  className="d-flex align-items-center justify-content-center rounded-circle text-white"
                  style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <User size={18} weight="bold" />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold text-white" style={{ fontSize: '1.05rem' }}>
                    Tenant Member Details
                  </h5>
                  <div className="text-white-50 small" style={{ fontSize: '0.78rem' }}>
                    Unit {selectedMemberUnitContext?.code || '—'} • {selectedMemberUnitContext?.tower || 'Tower A'}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-link text-white p-1 text-decoration-none shadow-none opacity-75 hover-opacity-100"
                onClick={() => setIsViewMemberModalOpen(false)}
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 d-flex flex-column" style={{ gap: '20px', maxHeight: '78vh', overflowY: 'auto' }}>
              {/* Member Profile Highlight Card */}
              <div 
                className="p-3.5 rounded-3 d-flex align-items-center justify-content-between"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-xs text-primary"
                    style={{ width: '48px', height: '48px', backgroundColor: '#EFF6FF', fontSize: '1.1rem' }}
                  >
                    {selectedMemberForDetail.name ? selectedMemberForDetail.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'M'}
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0.5" style={{ fontSize: '1rem' }}>
                      {selectedMemberForDetail.name}
                    </h6>
                    <div className="text-muted small fw-medium">
                      Relationship: <strong className="text-dark">{selectedMemberForDetail.relationship}</strong>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                {(() => {
                  const isPending = (selectedMemberForDetail.status || '').toLowerCase() === 'pending';
                  return (
                    <span 
                      className="badge fw-semibold rounded-pill px-3 py-1.5"
                      style={{
                        backgroundColor: isPending ? '#FEF3C7' : '#DCFCE7',
                        color: isPending ? '#B45309' : '#15803D',
                        fontSize: '0.8rem',
                        border: isPending ? '1px solid #FDE68A' : '1px solid #BBF7D0'
                      }}
                    >
                      {isPending ? 'Pending' : 'Active'}
                    </span>
                  );
                })()}
              </div>

              {/* Detail Key-Value Grid */}
              <div className="row g-3">
                {/* NIK */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded-2 border bg-white" style={{ borderColor: '#E2E8F0' }}>
                    <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                      NATIONAL ID (NIK)
                    </div>
                    <div className="fw-bold font-monospace text-dark" style={{ fontSize: '0.9rem' }}>
                      {selectedMemberForDetail.nik || '—'}
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded-2 border bg-white" style={{ borderColor: '#E2E8F0' }}>
                    <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                      EMAIL ADDRESS
                    </div>
                    <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.875rem' }}>
                      {selectedMemberForDetail.email || '—'}
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded-2 border bg-white" style={{ borderColor: '#E2E8F0' }}>
                    <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                      PHONE NUMBER
                    </div>
                    <div className="fw-semibold text-dark" style={{ fontSize: '0.875rem' }}>
                      {selectedMemberForDetail.phone || '—'}
                    </div>
                  </div>
                </div>

                {/* Access Card */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded-2 border bg-white" style={{ borderColor: '#E2E8F0' }}>
                    <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                      ACCESS CARD
                    </div>
                    <div className="fw-bold font-monospace text-primary" style={{ fontSize: '0.9rem' }}>
                      {selectedMemberForDetail.accessCard || '—'}
                    </div>
                  </div>
                </div>

                {/* Assigned Unit */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded-2 border bg-white" style={{ borderColor: '#E2E8F0' }}>
                    <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                      ASSIGNED UNIT
                    </div>
                    <div className="fw-bold font-monospace text-dark" style={{ fontSize: '0.9rem' }}>
                      {selectedMemberUnitContext?.code || '—'} ({selectedMemberUnitContext?.tower || 'Tower A'})
                    </div>
                  </div>
                </div>

                {/* Unit Role */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded-2 border bg-white" style={{ borderColor: '#E2E8F0' }}>
                    <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                      UNIT ROLE
                    </div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                      {selectedMemberUnitContext?.role || 'OWNER'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Renter Specific Details */}
              {(selectedMemberForDetail.relationship === 'Renter' || selectedMemberForDetail.rentalPeriod) && (
                <div className="p-3.5 rounded-3 border" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
                  <h6 className="fw-bold text-dark mb-2.5 d-flex align-items-center gap-2" style={{ fontSize: '0.875rem' }}>
                    <HouseLine size={18} className="text-warning" weight="bold" />
                    <span>Rental Agreement Details</span>
                  </h6>
                  <div className="row g-2">
                    <div className="col-6 col-sm-4">
                      <div className="text-muted small fw-medium" style={{ fontSize: '0.75rem' }}>Period</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                        {selectedMemberForDetail.rentalPeriod || 12} Months
                      </div>
                    </div>
                    <div className="col-6 col-sm-4">
                      <div className="text-muted small fw-medium" style={{ fontSize: '0.75rem' }}>Start Rent</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                        {selectedMemberForDetail.startRent || '01/03/2026'}
                      </div>
                    </div>
                    <div className="col-12 col-sm-4">
                      <div className="text-muted small fw-medium" style={{ fontSize: '0.75rem' }}>End Rent Date</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                        {selectedMemberForDetail.endRentDate || calculateEndRentDate(selectedMemberForDetail.startRent, selectedMemberForDetail.rentalPeriod)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div 
              className="px-4 py-3 d-flex justify-content-end align-items-center"
              style={{ borderTop: '1px solid #F1F5F9', backgroundColor: '#FFFFFF' }}
            >
              <button 
                type="button" 
                className="btn text-white fw-bold shadow-none border-0"
                style={{ 
                  backgroundColor: '#002B7F', 
                  borderRadius: '8px', 
                  padding: '8px 24px', 
                  fontSize: '0.875rem' 
                }}
                onClick={() => setIsViewMemberModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
