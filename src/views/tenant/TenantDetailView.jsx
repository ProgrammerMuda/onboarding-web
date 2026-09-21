import React, { useState } from 'react';
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
  SignOut
} from '@phosphor-icons/react';

export function TenantDetailView({ presenter }) {
  const {
    selectedTenant,
    detailActiveTab,
    setDetailActiveTab,
    handleBackToList
  } = presenter;

  const [notification, setNotification] = useState(null);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [openUnitActionDropdown, setOpenUnitActionDropdown] = useState(null);
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

  const tabs = [
    { id: 'information', label: 'Information', icon: Info, count: null },
    { id: 'units', label: 'Units', icon: Buildings, count: selectedTenant.units?.length || 0 },
    { id: 'members', label: 'Members', icon: Users, count: selectedTenant.members?.length || 0 },
    { id: 'vehicles', label: 'Vehicles', icon: Car, count: selectedTenant.vehicles?.length || 0 }
  ];

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

      {/* 1. Page Header: Back Icon (←) + Large Title + Subtle Sub-text */}
      <div 
        className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
        style={{ marginBottom: '24px' }}
      >
        <div className="d-flex align-items-center gap-3">
          {/* Back Arrow Icon Button */}
          <button 
            type="button" 
            className="btn btn-light d-flex align-items-center justify-content-center border shadow-none"
            style={{ 
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              color: '#002B7F',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
              transition: 'all 0.15s ease'
            }}
            onClick={handleBackToList}
            title="Back to Tenants List"
          >
            <ArrowLeft size={22} weight="bold" color="#002B7F" />
          </button>

          {/* Large Title & Sub-text */}
          <div>
            <h2 className="fw-bold mb-0.5" style={{ fontSize: '1.75rem', letterSpacing: '-0.025em', color: '#002B7F', lineHeight: 1.2 }}>
              Detail Tenant: {selectedTenant.name}
            </h2>
            <div className="text-muted fw-medium" style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Tenant Management
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="d-flex align-items-center gap-2.5">
          <button 
            type="button" 
            className="btn text-white fw-semibold px-4 py-2 d-flex align-items-center gap-2 shadow-none border-0"
            style={{ 
              backgroundColor: '#002B7F', 
              borderRadius: '8px', 
              fontSize: '0.875rem',
              transition: 'background-color 0.15s ease'
            }}
            onClick={() => handleAction(`Edit modal opened for ${selectedTenant.name}`)}
          >
            <PencilSimple size={16} weight="bold" />
            <span>Edit</span>
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

        {/* Integrated Tab Navigation Bar */}
        <div 
          className="d-flex align-items-center px-4 border-top"
          style={{ borderColor: '#F1F5F9', backgroundColor: '#FFFFFF', gap: '8px' }}
        >
          {tabs.map((tab) => {
            const isActive = detailActiveTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                className={`btn d-inline-flex align-items-center gap-2 border-0 py-3 px-3.5 fw-bold position-relative ${
                  isActive ? 'text-primary' : 'text-muted'
                }`}
                style={{
                  fontSize: '0.875rem',
                  color: isActive ? '#002B7F' : '#64748B',
                  backgroundColor: 'transparent',
                  borderRadius: '0',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setDetailActiveTab(tab.id)}
              >
                <Icon size={18} weight={isActive ? 'bold' : 'regular'} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span 
                    className={`badge rounded-pill px-2 py-0.5 ${
                      isActive ? 'bg-primary text-white' : 'bg-light text-muted border'
                    }`}
                    style={{ fontSize: '0.72rem', backgroundColor: isActive ? '#002B7F' : '#F1F5F9' }}
                  >
                    {tab.count}
                  </span>
                )}
                {/* Active Indicator Underline */}
                {isActive && (
                  <div 
                    className="position-absolute bottom-0 start-0 end-0"
                    style={{ height: '3px', backgroundColor: '#002B7F', borderRadius: '3px 3px 0 0' }}
                  />
                )}
              </button>
            );
          })}
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
            <div 
              className="d-flex align-items-center justify-content-between border-bottom" 
              style={{ borderColor: '#F1F5F9', paddingBottom: '20px', marginBottom: '28px' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div 
                  className="d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#EFF6FF',
                    color: '#002B7F'
                  }}
                >
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

              <button
                type="button"
                className="btn btn-sm d-inline-flex align-items-center fw-semibold border shadow-none"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                  color: '#002B7F',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => handleAction('Edit Tenant Information')}
              >
                <PencilSimple size={16} weight="bold" />
                <span>Edit</span>
              </button>
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
            <div 
              className="d-flex align-items-center justify-content-between border-bottom" 
              style={{ borderColor: '#F1F5F9', paddingBottom: '20px', marginBottom: '28px' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div 
                  className="d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626'
                  }}
                >
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

              <button
                type="button"
                className="btn btn-sm d-inline-flex align-items-center fw-semibold border shadow-none"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                  color: '#002B7F',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => handleAction('Edit Emergency Contact')}
              >
                <PencilSimple size={16} weight="bold" />
                <span>Edit</span>
              </button>
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

      {/* 5. Tab Content: Units */}
      {detailActiveTab === 'units' && (
        <div 
          className="card border bg-white shadow-2xs"
          style={{ borderRadius: '12px', borderColor: '#E2E8F0', overflow: 'visible' }}
        >
          {/* Top Toolbar: Search Bar + Onboarding Action Button */}
          <div 
            className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-3 p-4 border-bottom"
            style={{ borderColor: '#F1F5F9', backgroundColor: '#FFFFFF', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
          >
            {/* Search Box */}
            <div className="position-relative" style={{ minWidth: '280px', maxWidth: '380px' }}>
              <MagnifyingGlass 
                size={18} 
                weight="bold" 
                className="position-absolute top-50 translate-middle-y"
                style={{ left: '14px', color: '#64748B', pointerEvents: 'none' }} 
              />
              <input
                type="text"
                className="form-control shadow-none"
                style={{
                  paddingLeft: '40px',
                  paddingRight: unitSearchQuery ? '36px' : '14px',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  borderRadius: '8px',
                  borderColor: '#CBD5E1',
                  fontSize: '0.875rem',
                  backgroundColor: '#F8FAFC',
                  color: '#1E293B'
                }}
                placeholder="Search unit code, tower, role..."
                value={unitSearchQuery}
                onChange={(e) => setUnitSearchQuery(e.target.value)}
              />
              {unitSearchQuery && (
                <button
                  type="button"
                  className="btn btn-link p-0 position-absolute top-50 translate-middle-y text-muted text-decoration-none"
                  style={{ right: '12px', width: '20px', height: '20px' }}
                  onClick={() => setUnitSearchQuery('')}
                  title="Clear search"
                >
                  <X size={15} weight="bold" />
                </button>
              )}
            </div>

            {/* Action: Onboarding Button with Plus icon */}
            <button
              type="button"
              className="btn text-white fw-semibold d-inline-flex align-items-center justify-content-center gap-2 shadow-none border-0"
              style={{
                backgroundColor: '#002B7F',
                borderRadius: '8px',
                padding: '9px 20px',
                fontSize: '0.875rem',
                transition: 'all 0.15s ease'
              }}
              onClick={() => setIsOnboardingModalOpen(true)}
            >
              <Plus size={18} weight="bold" />
              <span>Onboarding</span>
            </button>
          </div>

          {/* Units Table */}
          <div className="table-responsive" style={{ overflow: 'visible' }}>
            <table className="table align-middle mb-0 bg-white">
              <thead style={{ backgroundColor: '#E2E8F0' }}>
                <tr className="border-bottom" style={{ borderColor: '#CBD5E1' }}>
                  <th className="py-3 ps-4 text-uppercase fw-bold" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    UNIT CODE
                  </th>
                  <th className="py-3 text-uppercase fw-bold" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    TOWER
                  </th>
                  <th className="py-3 text-uppercase fw-bold" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    ROLE / TYPE
                  </th>
                  <th className="py-3 text-uppercase fw-bold" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    ENTRY DATE
                  </th>
                  <th className="py-3 text-uppercase fw-bold" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    STATUS
                  </th>
                  <th className="py-3 text-uppercase fw-bold text-center" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em', width: '90px' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#FFFFFF' }}>
                {(() => {
                  const unitsList = selectedTenant.units || [];
                  const filtered = unitsList.filter((u) => {
                    if (!unitSearchQuery.trim()) return true;
                    const q = unitSearchQuery.toLowerCase();
                    return (
                      (u.code && u.code.toLowerCase().includes(q)) ||
                      (u.tower && u.tower.toLowerCase().includes(q)) ||
                      (u.role && u.role.toLowerCase().includes(q)) ||
                      (u.handoverDate && u.handoverDate.toLowerCase().includes(q)) ||
                      (u.status && u.status.toLowerCase().includes(q))
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted fw-medium">
                          {unitSearchQuery ? `No units match "${unitSearchQuery}".` : 'No units assigned to this tenant yet.'}
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((u, idx) => {
                    const itemKey = u.code || idx;
                    const isDropdownOpen = openUnitActionDropdown === itemKey;

                    return (
                      <tr key={idx} className="border-bottom" style={{ borderColor: '#F1F5F9' }}>
                        <td className="py-3.5 ps-4 fw-bold font-monospace text-dark" style={{ fontSize: '0.9rem' }}>
                          {u.code}
                        </td>
                        <td className="py-3.5 text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>
                          {u.tower || 'Tower A'}
                        </td>
                        <td className="py-3.5">
                          {(() => {
                            const roleLower = (u.role || '').toLowerCase();
                            const isOwner = roleLower === 'owner';
                            const isRenter = roleLower === 'renter';
                            const isProxy = roleLower === 'proxy' || roleLower === 'proxies';

                            const bg = isOwner ? '#DCFCE7' : isRenter ? '#FEF3C7' : isProxy ? '#E0F2FE' : '#F1F5F9';
                            const color = isOwner ? '#15803D' : isRenter ? '#B45309' : isProxy ? '#0284C7' : '#475569';
                            const label = u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1).toLowerCase()) : '';

                            return (
                              <span 
                                className="badge px-2.5 py-1 fw-bold border-0"
                                style={{ 
                                  backgroundColor: bg, 
                                  color: color, 
                                  fontSize: '0.75rem'
                                }}
                              >
                                {label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 text-muted fw-medium" style={{ fontSize: '0.85rem' }}>
                          {u.handoverDate || '15 Jan 2022'}
                        </td>
                        <td className="py-3.5">
                          {(() => {
                            const isOwnerRole = (u.role || '').toUpperCase() === 'OWNER';
                            const isUnoccupied = isOwnerRole && (u.status === 'Unoccupied' || u.code === 'C0303');

                            if (isUnoccupied) {
                              return (
                                <span 
                                  className="badge px-2.5 py-1 fw-bold border-0"
                                  style={{ 
                                    backgroundColor: '#F1F5F9', 
                                    color: '#475569', 
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  Unoccupied
                                </span>
                              );
                            }

                            return (
                              <span 
                                className="badge px-2.5 py-1 fw-bold border-0"
                                style={{ 
                                  backgroundColor: '#DCFCE7', 
                                  color: '#15803D', 
                                  fontSize: '0.75rem'
                                }}
                              >
                                Occupant
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 text-center position-relative">
                          <button
                            type="button"
                            className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center shadow-none p-0 mx-auto"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: isDropdownOpen ? '#EEF2F6' : 'transparent',
                              color: '#334155',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenUnitActionDropdown(isDropdownOpen ? null : itemKey);
                            }}
                            title="Unit Actions"
                          >
                            <DotsThreeVertical size={20} weight="bold" />
                          </button>

                          {/* Action Dropdown Popup */}
                          {isDropdownOpen && (
                            <>
                              <div 
                                className="position-fixed top-0 start-0 w-100 h-100" 
                                style={{ zIndex: 1040 }}
                                onClick={() => setOpenUnitActionDropdown(null)} 
                              />
                              <div
                                className="position-absolute end-0 bg-white border shadow-lg"
                                style={{
                                  top: 'calc(100% + 4px)',
                                  right: '8px',
                                  borderRadius: '10px',
                                  borderColor: '#E2E8F0',
                                  minWidth: '220px',
                                  width: 'max-content',
                                  zIndex: 1050,
                                  padding: '6px',
                                  textAlign: 'left',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)'
                                }}
                              >
                                <button
                                  type="button"
                                  className="d-flex align-items-center text-dark fw-semibold border-0 w-100 text-start"
                                  style={{ 
                                    gap: '10px', 
                                    padding: '8px 14px', 
                                    fontSize: '0.85rem', 
                                    cursor: 'pointer', 
                                    backgroundColor: 'transparent',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                    transition: 'background-color 0.15s ease' 
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  onClick={() => {
                                    setOpenUnitActionDropdown(null);
                                    handleAction(`Viewing details for Unit ${u.code}`);
                                  }}
                                >
                                  <Eye size={16} weight="bold" className="flex-shrink-0" style={{ color: '#002B7F' }} />
                                  <span style={{ whiteSpace: 'nowrap' }}>View Detail Unit</span>
                                </button>
                                
                                <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 0' }} />
                                
                                <button
                                  type="button"
                                  className="d-flex align-items-center text-danger fw-semibold border-0 w-100 text-start"
                                  style={{ 
                                    gap: '10px', 
                                    padding: '8px 14px', 
                                    fontSize: '0.85rem', 
                                    cursor: 'pointer', 
                                    backgroundColor: 'transparent',
                                    borderRadius: '6px',
                                    whiteSpace: 'nowrap',
                                    transition: 'background-color 0.15s ease' 
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  onClick={() => {
                                    setOpenUnitActionDropdown(null);
                                    handleAction(`Offboarding Ownership flow initiated for Unit ${u.code}`);
                                  }}
                                >
                                  <SignOut size={16} weight="bold" className="flex-shrink-0" style={{ color: '#DC2626' }} />
                                  <span style={{ whiteSpace: 'nowrap' }}>Offboarding Ownership</span>
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab Content: Members (Organized Per Unit) */}
      {detailActiveTab === 'members' && (
        <div className="d-flex flex-column" style={{ gap: '24px' }}>
          {(!selectedTenant.units || selectedTenant.units.length === 0) ? (
            <div 
              className="card border bg-white shadow-2xs text-center"
              style={{ borderRadius: '12px', borderColor: '#E2E8F0', padding: '48px 24px' }}
            >
              <Users size={44} weight="duotone" className="text-muted mb-2.5 mx-auto" />
              <h6 className="fw-bold text-dark mb-1">No Units Assigned</h6>
              <p className="text-muted small mb-0">There are no units or registered members for this tenant yet.</p>
            </div>
          ) : (
            selectedTenant.units.map((unit, unitIdx) => {
              const roleLower = (unit.role || '').toLowerCase();
              const isOwner = roleLower === 'owner';
              const isRenter = roleLower === 'renter';
              const isProxy = roleLower === 'proxy' || roleLower === 'proxies';

              const roleBg = isOwner ? '#DCFCE7' : isRenter ? '#FEF3C7' : isProxy ? '#E0F2FE' : '#F1F5F9';
              const roleColor = isOwner ? '#15803D' : isRenter ? '#B45309' : isProxy ? '#0284C7' : '#475569';
              const roleLabel = unit.role ? (unit.role.charAt(0).toUpperCase() + unit.role.slice(1).toLowerCase()) : 'Owner';

              const isUnoccupied = isOwner && (unit.status === 'Unoccupied' || unit.code === 'C0303');
              
              // Resolve members for this unit
              const unitMembers = unit.members !== undefined 
                ? unit.members 
                : (isUnoccupied ? [] : (unitIdx === 0 ? (selectedTenant.members || []) : []));

              return (
                <div 
                  key={unit.code || unitIdx}
                  className="card border bg-white shadow-2xs overflow-hidden"
                  style={{ borderRadius: '12px', borderColor: '#E2E8F0' }}
                >
                  {/* Unit Section Header Bar */}
                  <div 
                    className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 border-bottom"
                    style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', padding: '16px 24px' }}
                  >
                    <div className="d-flex flex-wrap align-items-center" style={{ gap: '12px' }}>
                      <div 
                        className="d-inline-flex align-items-center justify-content-center fw-bold font-monospace text-dark border"
                        style={{ 
                          backgroundColor: '#FFFFFF', 
                          borderColor: '#CBD5E1', 
                          borderRadius: '6px', 
                          padding: '6px 14px',
                          fontSize: '0.9rem' 
                        }}
                      >
                        <Door size={16} weight="bold" className="me-1.5 text-muted" />
                        {unit.code}
                      </div>

                      <span className="text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>
                        {unit.tower || 'Tower A'}
                      </span>

                      {/* Role Badge */}
                      <span 
                        className="badge fw-bold border-0"
                        style={{ 
                          backgroundColor: roleBg, 
                          color: roleColor, 
                          fontSize: '0.75rem',
                          padding: '5px 10px'
                        }}
                      >
                        {roleLabel}
                      </span>

                      {/* Status Badge (Only for Unoccupied units) */}
                      {isUnoccupied && (
                        <span 
                          className="badge fw-bold border-0"
                          style={{ 
                            backgroundColor: '#F1F5F9', 
                            color: '#475569', 
                            fontSize: '0.75rem',
                            padding: '5px 10px'
                          }}
                        >
                          Unoccupied
                        </span>
                      )}
                    </div>

                    <div className="d-flex align-items-center" style={{ gap: '10px' }}>
                      <span 
                        className="badge fw-semibold border"
                        style={{ 
                          backgroundColor: '#EFF6FF',
                          color: '#002B7F',
                          borderColor: '#BFDBFE',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          padding: '6px 12px'
                        }}
                      >
                        {unitMembers.length} {unitMembers.length === 1 ? 'Member' : 'Members'}
                      </span>

                      <button
                        type="button"
                        className="btn btn-sm d-inline-flex align-items-center fw-semibold shadow-none border-0 text-white"
                        style={{
                          backgroundColor: '#0F172A',
                          borderRadius: '8px',
                          fontSize: '0.8125rem',
                          padding: '6px 16px',
                          gap: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0F172A'}
                        onClick={() => handleOpenAddMemberModal(unit)}
                      >
                        <Plus size={16} weight="bold" />
                        <span>Add Member</span>
                      </button>
                    </div>
                  </div>

                  {/* Members Table */}
                  <div className="table-responsive">
                    <table className="table align-middle mb-0 bg-white" style={{ tableLayout: 'fixed', width: '100%' }}>
                      <thead style={{ backgroundColor: '#E2E8F0' }}>
                        <tr className="border-bottom" style={{ borderColor: '#CBD5E1' }}>
                          <th className="py-3 ps-4 text-uppercase fw-bold" style={{ width: '24%', backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                            MEMBER NAME
                          </th>
                          <th className="py-3 text-uppercase fw-bold" style={{ width: '15%', backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                            RELATIONSHIP
                          </th>
                          <th className="py-3 text-uppercase fw-bold" style={{ width: '18%', backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                            NIK
                          </th>
                          <th className="py-3 text-uppercase fw-bold" style={{ width: '19%', backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                            EMAIL
                          </th>
                          <th className="py-3 text-uppercase fw-bold" style={{ width: '12%', backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                            STATUS
                          </th>
                          <th className="py-3 pe-4 text-uppercase fw-bold text-end" style={{ width: '12%', backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                            ACTION
                          </th>
                        </tr>
                      </thead>
                      <tbody style={{ backgroundColor: '#FFFFFF' }}>
                        {unitMembers.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center text-muted fw-medium" style={{ padding: '36px 20px', fontSize: '0.875rem' }}>
                              <div className="d-flex flex-column align-items-center justify-content-center gap-2">
                                <span>
                                  {isUnoccupied 
                                    ? 'This unit is currently unoccupied. No active members registered.' 
                                    : `No family members or occupants registered for Unit ${unit.code}.`}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-sm d-inline-flex align-items-center fw-semibold border shadow-none mt-2"
                                  style={{
                                    backgroundColor: '#FFFFFF',
                                    color: '#0F172A',
                                    borderColor: '#CBD5E1',
                                    borderRadius: '8px',
                                    fontSize: '0.8125rem',
                                    padding: '7px 18px',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onClick={() => handleOpenAddMemberModal(unit)}
                                >
                                  <Plus size={16} weight="bold" />
                                  <span>Add Member to Unit {unit.code}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          unitMembers.map((m) => {
                            const isPending = (m.status || '').toLowerCase() === 'pending';
                            return (
                              <tr key={m.id} className="border-bottom" style={{ borderColor: '#F1F5F9' }}>
                                <td className="py-3.5 ps-4 fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem' }}>
                                  {m.name}
                                </td>
                                <td className="py-3.5 text-muted fw-semibold text-truncate" style={{ fontSize: '0.85rem' }}>
                                  {m.relationship}
                                </td>
                                <td className="py-3.5 font-monospace text-dark fw-medium text-truncate" style={{ fontSize: '0.85rem' }}>
                                  {m.nik}
                                </td>
                                <td className="py-3.5 text-muted fw-medium text-truncate" style={{ fontSize: '0.85rem' }}>
                                  {m.email || (m.name ? `${m.name.trim().toLowerCase().replace(/\s+/g, '.')}@gmail.com` : '—')}
                                </td>
                                <td className="py-3.5">
                                  <span 
                                    className="badge fw-semibold rounded-pill px-2.5 py-1"
                                    style={{
                                      backgroundColor: isPending ? '#FEF3C7' : '#DCFCE7',
                                      color: isPending ? '#B45309' : '#15803D',
                                      fontSize: '0.75rem',
                                      border: isPending ? '1px solid #FDE68A' : '1px solid #BBF7D0'
                                    }}
                                  >
                                    {isPending ? 'Pending' : 'Active'}
                                  </span>
                                </td>
                                <td className="py-3.5 pe-4 text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm d-inline-flex align-items-center fw-semibold shadow-none border"
                                    style={{
                                      backgroundColor: '#F8FAFC',
                                      borderColor: '#CBD5E1',
                                      color: '#002B7F',
                                      borderRadius: '6px',
                                      padding: '5px 12px',
                                      fontSize: '0.8rem',
                                      gap: '6px',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onClick={() => handleViewMemberDetail(m, unit)}
                                    title="Member detail"
                                  >
                                    <Eye size={15} weight="bold" />
                                    <span>Detail</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 7. Tab Content: Vehicles */}
      {detailActiveTab === 'vehicles' && (
        <div 
          className="card border bg-white shadow-2xs overflow-hidden"
          style={{ borderRadius: '12px', borderColor: '#E2E8F0' }}
        >
          <div className="table-responsive">
            <table className="table align-middle mb-0 bg-white">
              <thead style={{ backgroundColor: '#E2E8F0' }}>
                <tr className="border-bottom" style={{ borderColor: '#CBD5E1' }}>
                  <th className="py-3 ps-4 text-uppercase fw-bold" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    LICENSE PLATE
                  </th>
                  <th className="py-3 text-uppercase fw-bold" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    TYPE
                  </th>
                  <th className="py-3 text-uppercase fw-bold" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    VEHICLE BRAND & MODEL
                  </th>
                  <th className="py-3 text-uppercase fw-bold" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    COLOR
                  </th>
                  <th className="py-3 text-uppercase fw-bold" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    PARKING SLOT
                  </th>
                  <th className="py-3 pe-4 text-uppercase fw-bold text-end" style={{ backgroundColor: '#E2E8F0', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.06em' }}>
                    RFID ACCESS
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#FFFFFF' }}>
                {!selectedTenant.vehicles || selectedTenant.vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted fw-medium" style={{ padding: '48px 24px', fontSize: '0.875rem' }}>
                      No vehicles registered for this tenant.
                    </td>
                  </tr>
                ) : (
                  selectedTenant.vehicles.map((v) => (
                    <tr key={v.id} className="border-bottom" style={{ borderColor: '#F1F5F9' }}>
                      <td className="py-3.5 ps-4">
                        <span 
                          className="badge bg-dark text-white px-2.5 py-1.5 font-monospace fw-bold"
                          style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}
                        >
                          {v.plate}
                        </span>
                      </td>
                      <td className="py-3.5 fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                        {v.type}
                      </td>
                      <td className="py-3.5 text-dark fw-medium" style={{ fontSize: '0.85rem' }}>
                        {v.brand}
                      </td>
                      <td className="py-3.5 text-muted fw-medium" style={{ fontSize: '0.85rem' }}>
                        {v.color}
                      </td>
                      <td className="py-3.5 font-monospace fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                        {v.slot}
                      </td>
                      <td className="py-3.5 pe-4 text-end font-monospace text-muted fw-medium" style={{ fontSize: '0.825rem' }}>
                        {v.rfid}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                {/* Target Unit Pill Display */}
                <div>
                  <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                    Target Unit
                  </label>
                  <div 
                    className="d-flex align-items-center justify-content-between px-3 py-2 border"
                    style={{ 
                      borderRadius: '8px', 
                      borderColor: '#CBD5E1', 
                      height: '42px', 
                      backgroundColor: '#F8FAFC' 
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <Door size={16} weight="bold" className="text-primary" />
                      <span className="fw-bold text-dark font-monospace" style={{ fontSize: '0.9rem' }}>
                        {selectedUnitForMember?.code}
                      </span>
                      <span className="text-muted small">
                        ({selectedUnitForMember?.tower || 'Tower A'})
                      </span>
                    </div>
                    <span 
                      className="badge fw-semibold"
                      style={{ 
                        backgroundColor: '#EFF6FF', 
                        color: '#002B7F',
                        fontSize: '0.725rem',
                        padding: '4px 8px'
                      }}
                    >
                      {selectedUnitForMember?.role || 'Occupant'}
                    </span>
                  </div>
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
