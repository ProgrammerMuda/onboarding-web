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
  FolderSimple,
  MapPin
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
                <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f1f5f9" />
                  <stop offset="50%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
              </defs>
              <rect width="400" height="160" fill="url(#curveGrad)" />
              <path
                d="M-20 40 C 120 10, 260 140, 420 80 L 420 160 L -20 160 Z"
                fill="#ffffff"
                fillOpacity="0.45"
              />
              <path
                d="M-20 80 C 100 30, 220 160, 420 120 L 420 160 L -20 160 Z"
                fill="#ffffff"
                fillOpacity="0.6"
              />
            </svg>
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

            <div className="emp-detail-role-pill">
              {emp.position || 'Employee'}
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

              {/* 3. Work Location */}
              <div className="emp-detail-info-item">
                <div className="emp-detail-info-icon">
                  <MapPin size={16} weight="bold" />
                </div>
                <div className="emp-detail-info-texts">
                  <span className="emp-detail-info-label">Work Location</span>
                  <span className="emp-detail-info-val">{emp.workLocation || 'Head Office'}</span>
                </div>
              </div>

              {/* 4. Status */}
              <div className="emp-detail-info-item">
                <div className="emp-detail-info-icon">
                  <ShieldCheck size={16} weight="bold" />
                </div>
                <div className="emp-detail-info-texts">
                  <span className="emp-detail-info-label">Status</span>
                  <span className="emp-detail-info-val">
                    {emp.status === 'Active' ? (
                      <span className="emp-status-pill-active">
                        <CheckCircle size={12} weight="fill" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="emp-status-pill-resigned">
                        <span>Resigned</span>
                      </span>
                    )}
                  </span>
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
                    <span className="emp-detail-kv-label">Type of Hire</span>
                    <span className="emp-detail-kv-value">{emp.employmentType || 'PKWT/KONTRAK'}</span>
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
                              {isPdf ? <FileText size={20} weight="bold" /> : <IdentificationCard size={20} weight="bold" />}
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
                            <Receipt size={20} weight="bold" />
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
                            <Briefcase size={20} weight="bold" />
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
                            <IdentificationCard size={20} weight="bold" />
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
              {/* Card 1: Organizational Role */}
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <Buildings size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Organizational Placement</h3>
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
                    <span className="emp-detail-kv-label">Job Position</span>
                    <span className="emp-detail-kv-value">{emp.position}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Work Location</span>
                    <span className="emp-detail-kv-value">{emp.workLocation || 'Head Office / Property Site'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Shift Schedule</span>
                    <span className="emp-detail-kv-value">{emp.shiftSchedule || 'Normal (08:00 - 17:00)'}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Employment Tenure & Contract */}
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <Briefcase size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Employment Contract &amp; Tenure</h3>
                  </div>
                </div>

                <div className="emp-detail-table-wrap">
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Employment Status</span>
                    <span className="emp-detail-kv-value">{emp.employmentType || 'PKWT/KONTRAK'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Join Date (Start Date)</span>
                    <span className="emp-detail-kv-value">{emp.joinDate || '2024-01-01'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Contract End Date</span>
                    <span className="emp-detail-kv-value text-danger">{emp.endDate || '2025-12-31'}</span>
                  </div>
                  {emp.resignDate && (
                    <div className="emp-detail-kv-row">
                      <span className="emp-detail-kv-label">Resignation Date</span>
                      <span className="emp-detail-kv-value text-danger">{emp.resignDate}</span>
                    </div>
                  )}
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Current Status</span>
                    <span className="emp-detail-kv-value">
                      <span className={emp.status === 'Active' ? 'emp-status-pill-active' : 'emp-status-pill-resigned'}>
                        {emp.status}
                      </span>
                    </span>
                  </div>
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
                    <h3 className="emp-detail-card-title">Social Security &amp; Insurance</h3>
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
              {/* Card 1: Primary Emergency Contact */}
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <Phone size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Primary Emergency Contact</h3>
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

              {/* Card 2: Home Address */}
              <div className="emp-detail-card">
                <div className="emp-detail-card-head">
                  <div className="emp-detail-card-head-left">
                    <div className="emp-detail-card-badge emp-badge-secondary">
                      <House size={20} weight="bold" />
                    </div>
                    <h3 className="emp-detail-card-title">Home &amp; Domicile Address</h3>
                  </div>
                </div>

                <div className="emp-detail-table-wrap">
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Address (ID Card / KTP)</span>
                    <span className="emp-detail-kv-value">
                      {emp.idCardAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng'}
                    </span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Domicile Address</span>
                    <span className="emp-detail-kv-value">
                      {emp.domicileAddress || emp.idCardAddress || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng'}
                    </span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">City</span>
                    <span className="emp-detail-kv-value">{emp.city || 'Jakarta Selatan'}</span>
                  </div>
                  <div className="emp-detail-kv-row">
                    <span className="emp-detail-kv-label">Postal Code</span>
                    <span className="emp-detail-kv-value">{emp.postalCode || '12950'}</span>
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
