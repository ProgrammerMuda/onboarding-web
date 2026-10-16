import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  CaretRight,
  PencilSimple,
  Envelope,
  Phone,
  Globe,
  GenderIntersex,
  CalendarBlank,
  ShieldCheck,
  Briefcase,
  IdentificationCard,
  House,
  Receipt,
  CreditCard,
  Bank,
  FileText,
  DownloadSimple,
  User,
  Buildings,
  CheckCircle,
  FolderSimple
} from '@phosphor-icons/react';
import './add-employee.css';
import './employee.css';
import './employee-detail.css';

export default function EmployeeDetailView({ presenter, employee, onBack }) {
  const {
    openEditModal,
    departments = [],
    divisions = []
  } = presenter;

  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'employee' | 'payroll' | 'emergency'

  // Fallback defaults if viewing an employee with partial data
  const emp = useMemo(() => {
    return {
      ...employee,
      citizenship: employee.citizenship || 'Indonesia',
      gender: employee.gender || 'Male',
      employmentType: employee.employmentType || 'PKWT/KONTRAK',
      workLocation: employee.workLocation || 'Head Office',
      shiftSchedule: employee.shiftSchedule || 'Normal (08:00 - 17:00)'
    };
  }, [employee]);

  // Resolve Department and Division names
  const deptName = useMemo(() => {
    const d = departments.find((item) => item.id === emp.departmentId);
    if (d) return d.name;
    if (emp.departmentId === 'dept-eng') return 'Engineering';
    if (emp.departmentId === 'dept-bs') return 'Building Service';
    if (emp.departmentId === 'dept-bm') return 'Building Management';
    if (emp.departmentId === 'dept-tr') return 'Tenant Relation';
    if (emp.departmentId === 'dept-fin') return 'Finance & Accounting';
    return 'Building Management';
  }, [departments, emp.departmentId]);

  const divName = useMemo(() => {
    const d = divisions.find((item) => item.id === emp.divisionId);
    if (d) return d.name;
    if (emp.divisionId === 'div-sec') return 'Security';
    if (emp.divisionId === 'div-eng') return 'MEP';
    if (emp.divisionId === 'div-hk') return 'House Keeping';
    if (emp.divisionId === 'div-bm' || emp.divisionId === 'div-gen') return 'General Operation';
    if (emp.divisionId === 'div-tr') return 'Tenant Relation';
    if (emp.divisionId === 'div-fin') return 'Finance';
    return 'General Operation';
  }, [divisions, emp.divisionId]);

  // Calculate age from DOB if available
  const calculatedAge = useMemo(() => {
    if (!emp.dob) return '32';
    const birth = new Date(emp.dob);
    if (isNaN(birth.getTime())) return '32';
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? String(age) : '32';
  }, [emp.dob]);

  // Format position cleanly (e.g. normalize to Supervisor Account Receivable)
  const displayPosition = useMemo(() => {
    if (!emp.position) return 'Employee';
    const lower = emp.position.toLowerCase();
    if (
      lower.includes('account receive') ||
      lower.includes('receiveble') ||
      lower.includes('receivable')
    ) {
      return 'Supervisor Account Receivable';
    }
    return emp.position;
  }, [emp.position]);

  const handleEdit = () => {
    if (typeof openEditModal === 'function') {
      openEditModal(emp);
    }
  };

  return (
    <div className="emp-detail-page">
      {/* 1. Breadcrumbs */}
      <nav className="add-emp-breadcrumb" aria-label="Breadcrumb">
        <span className="add-emp-breadcrumb-item">HR Parameter</span>
        <CaretRight size={14} weight="bold" className="add-emp-breadcrumb-sep" />
        <button type="button" className="add-emp-breadcrumb-link" onClick={onBack}>
          <span>List Employee</span>
        </button>
        <CaretRight size={14} weight="bold" className="add-emp-breadcrumb-sep" />
        <span className="add-emp-breadcrumb-current">Employee Profile</span>
      </nav>

      {/* 2. Top Hero Banner matching Organization Structure */}
      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button
              type="button"
              className="emp-hero-back-btn"
              onClick={onBack}
              title="Return to Employee Directory"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="emp-hero-banner-tag">PEOPLE MANAGEMENT</div>
              <h1 className="emp-hero-banner-title">Employee Profile</h1>
              <p className="emp-hero-banner-desc">
                View detailed employee profile, personal records, job status, and documents.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="emp-hero-edit-btn"
            onClick={handleEdit}
            title="Edit Employee Information"
          >
            <PencilSimple size={19} weight="bold" />
            <span>Edit Employee</span>
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Grid Layout */}
      <div className="emp-detail-layout">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Profile Summary Card                            */}
        {/* ============================================================ */}
        <div className="emp-detail-profile-card">
          {/* Decorative Modern Architecture Curve Banner */}
          <div className="emp-detail-cover">
            <svg
              className="emp-detail-cover-svg"
              viewBox="0 0 400 160"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="coverBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#052c6e" />
                  <stop offset="45%" stopColor="#004eb6" />
                  <stop offset="85%" stopColor="#007ecc" />
                  <stop offset="100%" stopColor="#09b2ff" />
                </linearGradient>
                <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#09b2ff" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="waveGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
                  <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="glowCircle" cx="85%" cy="20%" r="55%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Base Gradient Canvas */}
              <rect width="400" height="160" fill="url(#coverBgGrad)" />

              {/* Ambient Glow */}
              <circle cx="340" cy="30" r="120" fill="url(#glowCircle)" />

              {/* Subtle Tech / Architectural Grid Accent */}
              <g opacity="0.12" stroke="#ffffff" strokeWidth="0.75" strokeDasharray="3 3">
                <line x1="0" y1="40" x2="400" y2="40" />
                <line x1="0" y1="80" x2="400" y2="80" />
                <line x1="0" y1="120" x2="400" y2="120" />
                <line x1="100" y1="0" x2="100" y2="160" />
                <line x1="200" y1="0" x2="200" y2="160" />
                <line x1="300" y1="0" x2="300" y2="160" />
              </g>

              {/* Dynamic Curved Flow Lines & Waves */}
              <path
                d="M-20 60 C 110 15, 230 130, 420 45 L 420 160 L -20 160 Z"
                fill="url(#waveGrad1)"
              />
              <path
                d="M-20 95 C 100 40, 240 150, 420 90 L 420 160 L -20 160 Z"
                fill="url(#waveGrad2)"
              />
              <path
                d="M-20 120 C 130 85, 260 160, 420 125 L 420 160 L -20 160 Z"
                fill="#ffffff"
                fillOpacity="0.22"
              />
            </svg>

            {/* Top-Right Decorative Status Pill */}
            <div
              className={`emp-detail-cover-badge ${
                emp.status === 'Resigned'
                  ? 'emp-detail-cover-badge--resigned'
                  : 'emp-detail-cover-badge--active'
              }`}
            >
              <span
                className={`emp-detail-cover-badge-dot ${
                  emp.status === 'Resigned' ? 'emp-detail-cover-badge-dot--resigned' : ''
                }`}
              />
              <span>{emp.status || 'Active'}</span>
            </div>
          </div>

          {/* Avatar with overlap & floating edit button */}
          <div className="emp-detail-avatar-container">
            <div className="emp-detail-avatar-box">
              {emp.avatar ? (
                <img
                  src={emp.avatar}
                  alt={emp.name}
                  className="emp-detail-avatar-img"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                  }}
                />
              ) : (
                <div className="emp-detail-avatar-placeholder">
                  <User size={48} weight="duotone" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Identity Details */}
          <div className="emp-detail-profile-body">
            <div className="emp-detail-name-row">
              <h2 className="emp-detail-name">{emp.name}</h2>
            </div>

            <div className="emp-detail-role-wrap">
              <span className="emp-detail-role-pill secondary">
                <Briefcase size={14} weight="bold" />
                <span>{displayPosition}</span>
              </span>
            </div>

            {/* Basic Information Section */}
            <div className="emp-detail-subheading">Basic Information</div>

            <div className="emp-detail-info-list">
              {/* 1. Email */}
              <div className="emp-detail-info-item">
                <div className="emp-detail-info-icon">
                  <Envelope size={16} weight="bold" />
                </div>
                <div className="emp-detail-info-texts">
                  <span className="emp-detail-info-label">Email</span>
                  <span className="emp-detail-info-val">{emp.email || '—'}</span>
                </div>
              </div>

              {/* 2. Mobile Phone */}
              <div className="emp-detail-info-item">
                <div className="emp-detail-info-icon">
                  <Phone size={16} weight="bold" />
                </div>
                <div className="emp-detail-info-texts">
                  <span className="emp-detail-info-label">Mobile Phone</span>
                  <span className="emp-detail-info-val">{emp.phone || '—'}</span>
                </div>
              </div>


              {/* 5. Gender */}
              <div className="emp-detail-info-item">
                <div className="emp-detail-info-icon">
                  <GenderIntersex size={16} weight="bold" />
                </div>
                <div className="emp-detail-info-texts">
                  <span className="emp-detail-info-label">Gender</span>
                  <span className="emp-detail-info-val">{emp.gender || 'Male'}</span>
                </div>
              </div>

              {/* 6. Nationality */}
              <div className="emp-detail-info-item">
                <div className="emp-detail-info-icon">
                  <Globe size={16} weight="bold" />
                </div>
                <div className="emp-detail-info-texts">
                  <span className="emp-detail-info-label">Nationality</span>
                  <span className="emp-detail-info-val">{emp.citizenship || 'Indonesia'}</span>
                </div>
              </div>

              {/* 7. Age */}
              <div className="emp-detail-info-item">
                <div className="emp-detail-info-icon">
                  <CalendarBlank size={16} weight="bold" />
                </div>
                <div className="emp-detail-info-texts">
                  <span className="emp-detail-info-label">Age</span>
                  <span className="emp-detail-info-val">{calculatedAge}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Navigation Tabs & Information Content Cards     */}
        {/* ============================================================ */}
        <div className="emp-detail-right-content">
          {/* Tab Navigation Bar - 4 Tabs Matching Stepper */}
          <div className="emp-detail-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'personal'}
              className={`emp-detail-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Data
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'employee'}
              className={`emp-detail-tab-btn ${activeTab === 'employee' ? 'active' : ''}`}
              onClick={() => setActiveTab('employee')}
            >
              Employee Data
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'payroll'}
              className={`emp-detail-tab-btn ${activeTab === 'payroll' ? 'active' : ''}`}
              onClick={() => setActiveTab('payroll')}
            >
              Payroll &amp; Insurance
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'emergency'}
              className={`emp-detail-tab-btn ${activeTab === 'emergency' ? 'active' : ''}`}
              onClick={() => setActiveTab('emergency')}
            >
              Emergency Contact
            </button>
          </div>

          {/* TAB 1: PERSONAL DATA */}
          {activeTab === 'personal' && (
            <div>
              {/* Card 1: Professional Information / Identity */}
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <IdentificationCard size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Personal Information</h3>
                  </div>
                </div>

                <div className="emp-detail-table-wrap">
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Employee NIP</span>
                    <span className="emp-detail-kv-value font-monospace">{emp.nik || '—'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">NIK (ID Card / KTP)</span>
                    <span className="emp-detail-kv-value font-monospace">{emp.ktp || emp.nik || '3171015508920001'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Tax Number (NPWP)</span>
                    <span className="emp-detail-kv-value font-monospace">
                      {emp.npwp || '09.254.678.9-012.000'}
                    </span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Religion</span>
                    <span className="emp-detail-kv-value">{emp.religion || 'Islam'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Marital Status</span>
                    <span className="emp-detail-kv-value">{emp.maritalStatus || 'Married'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Place &amp; Date of Birth</span>
                    <span className="emp-detail-kv-value">
                      {emp.birthPlace ? `${emp.birthPlace}, ` : 'Jakarta, '}
                      {emp.dob || '15 May 1994'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Address (Side-by-side: Current & Address ID Card) */}
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <House size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Address</h3>
                  </div>
                </div>

                <div className="emp-detail-address-grid">
                  {/* Kiri: Current Address */}
                  <div className="emp-detail-address-panel">
                    <div className="emp-detail-address-label">Current</div>
                    <div className="emp-detail-address-text">
                      {emp.domicileAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan'}
                    </div>
                  </div>

                  {/* Kanan: Address ID Card */}
                  <div className="emp-detail-address-panel">
                    <div className="emp-detail-address-label">Address ID Card</div>
                    <div className="emp-detail-address-text">
                      {emp.idCardAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Document Attachments */}
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <FolderSimple size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Document Attachments</h3>
                  </div>
                </div>

                <div className="emp-detail-doc-grid">
                  {emp?.documents && emp.documents.length > 0 ? (
                    emp.documents.map((doc) => {
                      const isPdf = doc.isPdf || doc.name?.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={doc.id || doc.name} className="emp-detail-doc-card">
                          <div className="emp-detail-doc-left">
                            <div className="emp-detail-doc-icon">
                              <FileText size={20} weight="bold" />
                            </div>
                            <div className="emp-detail-doc-info">
                              <span className="emp-detail-doc-title">{doc.categoryLabel || doc.name}</span>
                              <span className="emp-detail-doc-meta">
                                {isPdf ? 'PDF' : 'Image'} &bull; {doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : '1.2 MB'} &bull; Verified
                              </span>
                            </div>
                          </div>
                          {doc.fileData ? (
                            <a
                              href={doc.fileData}
                              download={doc.name}
                              className="emp-detail-doc-action"
                              title={`Download ${doc.name}`}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                            >
                              <DownloadSimple size={16} weight="bold" />
                            </a>
                          ) : (
                            <button type="button" className="emp-detail-doc-action" title={`Download ${doc.name}`}>
                              <DownloadSimple size={16} weight="bold" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="emp-detail-doc-card">
                        <div className="emp-detail-doc-left">
                          <div className="emp-detail-doc-icon">
                            <FileText size={20} weight="bold" />
                          </div>
                          <div className="emp-detail-doc-info">
                            <span className="emp-detail-doc-title">ID Card (KTP)</span>
                            <span className="emp-detail-doc-meta">PDF &bull; 1.2 MB &bull; Verified</span>
                          </div>
                        </div>
                        <button type="button" className="emp-detail-doc-action" title="Download KTP">
                          <DownloadSimple size={16} weight="bold" />
                        </button>
                      </div>

                      <div className="emp-detail-doc-card">
                        <div className="emp-detail-doc-left">
                          <div className="emp-detail-doc-icon">
                            <FileText size={20} weight="bold" />
                          </div>
                          <div className="emp-detail-doc-info">
                            <span className="emp-detail-doc-title">NPWP Tax Card</span>
                            <span className="emp-detail-doc-meta">PDF &bull; 850 KB &bull; Verified</span>
                          </div>
                        </div>
                        <button type="button" className="emp-detail-doc-action" title="Download NPWP">
                          <DownloadSimple size={16} weight="bold" />
                        </button>
                      </div>

                      <div className="emp-detail-doc-card">
                        <div className="emp-detail-doc-left">
                          <div className="emp-detail-doc-icon">
                            <FileText size={20} weight="bold" />
                          </div>
                          <div className="emp-detail-doc-info">
                            <span className="emp-detail-doc-title">Work Contract (PKWT)</span>
                            <span className="emp-detail-doc-meta">PDF &bull; 2.4 MB &bull; Signed</span>
                          </div>
                        </div>
                        <button type="button" className="emp-detail-doc-action" title="Download Contract">
                          <DownloadSimple size={16} weight="bold" />
                        </button>
                      </div>

                      <div className="emp-detail-doc-card">
                        <div className="emp-detail-doc-left">
                          <div className="emp-detail-doc-icon">
                            <FileText size={20} weight="bold" />
                          </div>
                          <div className="emp-detail-doc-info">
                            <span className="emp-detail-doc-title">Training Certificate</span>
                            <span className="emp-detail-doc-meta">PDF &bull; 1.8 MB &bull; Active</span>
                          </div>
                        </div>
                        <button type="button" className="emp-detail-doc-action" title="Download Certificate">
                          <DownloadSimple size={16} weight="bold" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYEE DATA */}
          {activeTab === 'employee' && (
            <div>
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <Buildings size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Employee Data</h3>
                  </div>
                </div>

                <div className="emp-detail-table-wrap">
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Department</span>
                    <span className="emp-detail-kv-value">{deptName}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Division</span>
                    <span className="emp-detail-kv-value">{divName}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Position</span>
                    <span className="emp-detail-kv-value">{displayPosition}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Employee Status</span>
                    <span className="emp-detail-kv-value">{emp.employmentType || 'PKWT/KONTRAK'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Join Date</span>
                    <span className="emp-detail-kv-value">{emp.joinDate || '2024-01-01'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">End Date</span>
                    <span className="emp-detail-kv-value text-danger">{emp.endDate || '2025-12-31'}</span>
                  </div>
                  {emp.resignDate && (
                    <div className="emp-detail-kv-row">
                      <span className="emp-detail-kv-label">Resignation Date</span>
                      <span className="emp-detail-kv-value text-danger">{emp.resignDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYROLL & INSURANCE */}
          {activeTab === 'payroll' && (
            <div>
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <Bank size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Bank Account</h3>
                  </div>
                </div>

                <div className="emp-detail-table-wrap">
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Bank Name</span>
                    <span className="emp-detail-kv-value">{emp.bankName || 'Bank Central Asia (BCA)'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Account Number</span>
                    <span className="emp-detail-kv-value font-monospace">{emp.bankAccount || '8271-9920-112'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Account Holder Name</span>
                    <span className="emp-detail-kv-value">{emp.beneficiaryName || emp.name}</span>
                  </div>
                </div>
              </div>

              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <ShieldCheck size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Insurance</h3>
                  </div>
                </div>

                <div className="emp-detail-table-wrap">
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">BPJS Ketenagakerjaan (KPJ)</span>
                    <span className="emp-detail-kv-value font-monospace">{emp.bpjsTk || '000189283921'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">BPJS Kesehatan</span>
                    <span className="emp-detail-kv-value font-monospace">{emp.bpjsKesehatan || '000293849182'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EMERGENCY CONTACT */}
          {activeTab === 'emergency' && (
            <div>
              {/* Card 1: Emergency Contact */}
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <Phone size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Emergency Contact</h3>
                  </div>
                </div>

                <div className="emp-detail-table-wrap">
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Contact Person Name</span>
                    <span className="emp-detail-kv-value">{emp.emergencyName || 'Dewi Lestari'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Relationship</span>
                    <span className="emp-detail-kv-value">{emp.emergencyRelation || 'Spouse'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Emergency Phone Number</span>
                    <span className="emp-detail-kv-value">{emp.emergencyPhone || '0812-8899-0011'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Contact Address</span>
                    <span className="emp-detail-kv-value">
                      {emp.emergencyIdAddress || emp.idCardAddress || 'Same as Domicile Address'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Address (Side-by-side: Current & Address ID Card) */}
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <House size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Address</h3>
                  </div>
                </div>

                <div className="emp-detail-address-grid">
                  {/* Kiri: Current Address */}
                  <div className="emp-detail-address-panel">
                    <div className="emp-detail-address-label">Current</div>
                    <div className="emp-detail-address-text">
                      {emp.domicileAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan'}
                    </div>
                  </div>

                  {/* Kanan: Address ID Card */}
                  <div className="emp-detail-address-panel">
                    <div className="emp-detail-address-label">Address ID Card</div>
                    <div className="emp-detail-address-text">
                      {emp.idCardAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
