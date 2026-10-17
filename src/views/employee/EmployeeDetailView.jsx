import React, { useState, useMemo, useEffect } from 'react';
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
  ClockCounterClockwise,
  Check,
  Info
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
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

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

  // Resolve avatar source from all potential photo properties with auto HD upgrade for crisp rendering
  const avatarSrc = useMemo(() => {
    let src = emp.avatar || emp.photo || emp.photoUrl || emp.avatarUrl || emp.image || '';
    if (src && typeof src === 'string' && src.includes('images.unsplash.com')) {
      // Upgrade low-res thumbnail (e.g. w=150) to high-res HD (w=800) to prevent blur/pixelation
      src = src.replace(/w=\d+/, 'w=800');
      if (!src.includes('q=')) src += '&q=85';
    }
    return src;
  }, [emp.avatar, emp.photo, emp.photoUrl, emp.avatarUrl, emp.image]);

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [avatarSrc]);

  const hasPhoto = Boolean(avatarSrc && !imageError);

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

  const displayNip = useMemo(() => {
    return emp.nip || emp.nik || emp.id || '—';
  }, [emp.nip, emp.nik, emp.id]);

  const { firstName, lastName } = useMemo(() => {
    if (!emp.name) return { firstName: 'Employee', lastName: '—' };
    const parts = emp.name.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '—' };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }, [emp.name]);

  const handleCopy = (text, label) => {
    if (!text || text === '—') return;
    try {
      navigator.clipboard.writeText(text);
      showToast(label || 'Copied to clipboard!');
    } catch {
      showToast('Copied to clipboard!');
    }
  };

  const formattedJoinDate = useMemo(() => {
    if (!emp.joinDate) return '14 February 2024';
    try {
      const d = new Date(emp.joinDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch {}
    return emp.joinDate;
  }, [emp.joinDate]);

  const displayWorkModel = useMemo(() => {
    if (!emp.workLocation) return 'Hybrid';
    const wl = emp.workLocation.toLowerCase();
    if (wl.includes('head office') || wl.includes('onsite') || wl.includes('on-site')) return 'Onsite';
    if (wl.includes('remote')) return 'Remote';
    return 'Hybrid';
  }, [emp.workLocation]);

  const displayEmploymentType = useMemo(() => {
    if (!emp.employmentType) return 'Full-Time';
    const et = emp.employmentType.toLowerCase();
    if (et.includes('pkwt') || et.includes('kontrak') || et.includes('contract')) return 'Contract';
    if (et.includes('intern')) return 'Internship';
    if (et.includes('part')) return 'Part-Time';
    return 'Full-Time';
  }, [emp.employmentType]);

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
        {/* LEFT COLUMN: Executive Profile Card (Matching Uploaded Mockup) */}
        {/* ============================================================ */}
        <div className="emp-exec-card">
          {/* 1. Top Header: Name & Title (Above Photo) */}
          <div className="emp-exec-header">
            <h2 className="emp-exec-name">{emp.name}</h2>
            <div className="emp-exec-role">
              {displayPosition}
            </div>
          </div>

          {/* 2. Photo Box with Status Badge */}
          <div className="emp-exec-photo-box">
            {hasPhoto ? (
              <img
                src={avatarSrc}
                alt={emp.name}
                className="emp-exec-photo-img"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="emp-exec-photo-placeholder">
                <User size={80} weight="duotone" />
              </div>
            )}
            <span
              className={`emp-exec-status-badge ${
                emp.status === 'Resigned' ? 'emp-exec-status-badge--resigned' : 'emp-exec-status-badge--active'
              }`}
            >
              <span className="emp-exec-status-dot" />
              <span>{emp.status === 'Resigned' ? 'Resigned' : 'Active'}</span>
            </span>
          </div>

          {/* 3. Dashed Ticket/Card Divider */}
          <div className="emp-exec-divider" />

          {/* 5. Basic Data (1-Line Horizontal Key-Value Rows) */}
          <div className="emp-exec-details-section">
            <h3 className="emp-exec-section-title">
              <span className="emp-exec-section-icon emp-badge-secondary" aria-hidden="true">
                <Info size={20} weight="bold" />
              </span>
              <span>Basic Data</span>
            </h3>

            <div className="emp-exec-rows-list">
              <div className="emp-exec-row">
                <span className="emp-exec-row-label">Email</span>
                {emp.email ? (
                  <a
                    href={`mailto:${emp.email}`}
                    className="emp-exec-row-val emp-exec-row-val--email"
                    title={emp.email}
                  >
                    {emp.email}
                  </a>
                ) : (
                  <span className="emp-exec-row-val">—</span>
                )}
              </div>
              <div className="emp-exec-row">
                <span className="emp-exec-row-label">Mobile Phone</span>
                <span className="emp-exec-row-val">{emp.phone || '—'}</span>
              </div>
              <div className="emp-exec-row">
                <span className="emp-exec-row-label">Gender</span>
                <span className="emp-exec-row-val">{emp.gender || 'Male'}</span>
              </div>
              <div className="emp-exec-row">
                <span className="emp-exec-row-label">Nationality</span>
                <span className="emp-exec-row-val">{emp.citizenship || 'Indonesia'}</span>
              </div>
              <div className="emp-exec-row">
                <span className="emp-exec-row-label">Age</span>
                <span className="emp-exec-row-val">{calculatedAge} Years</span>
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
                    <div className="emp-detail-address-label">
                      <CalendarBlank size={15} weight="bold" />
                      <span>Current</span>
                    </div>
                    <div className="emp-detail-address-text">
                      {emp.domicileAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan'}
                    </div>
                  </div>

                  {/* Kanan: Address ID Card */}
                  <div className="emp-detail-address-panel">
                    <div className="emp-detail-address-label">
                      <CalendarBlank size={15} weight="bold" />
                      <span>Address ID Card</span>
                    </div>
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
                    <div className="emp-detail-address-label">
                      <CalendarBlank size={15} weight="bold" />
                      <span>Current</span>
                    </div>
                    <div className="emp-detail-address-text">
                      {emp.domicileAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan'}
                    </div>
                  </div>

                  {/* Kanan: Address ID Card */}
                  <div className="emp-detail-address-panel">
                    <div className="emp-detail-address-label">
                      <CalendarBlank size={15} weight="bold" />
                      <span>Address ID Card</span>
                    </div>
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

      {/* Interactive Feedback Toast */}
      {toastMsg && (
        <div className="emp-detail-copied-toast">
          <Check size={16} weight="bold" color="#16a34a" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
