import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  UsersThree,
  CaretRight,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Briefcase,
  Phone,
  WarningCircle,
  FloppyDisk,
  UploadSimple,
  IdentificationCard,
  FileImage,
  CheckCircle,
  Eye,
  X,
  CaretDown,
  MagnifyingGlass,
  Globe,
  CreditCard,
  ShieldCheck,
  Bank,
  FileText,
  Trash,
  Plus,
  DownloadSimple
} from '@phosphor-icons/react';
import './add-employee.css';
import './employee.css';
import './employee-detail.css';

const BANK_OPTIONS = [
  'Bank Central Asia (BCA)',
  'Bank Mandiri',
  'Bank Rakyat Indonesia (BRI)',
  'Bank Negara Indonesia (BNI)',
  'Bank Syariah Indonesia (BSI)',
  'Bank CIMB Niaga',
  'Bank Permata',
  'Bank Danamon',
  'Bank Tabungan Pensiunan Nasional (BTPN / Jenius)',
  'Bank Mega',
  'Bank Panin',
  'Bank OCBC NISP',
  'Bank Maybank Indonesia',
  'Other'
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
];

const APPROVER_OPTIONS = [
  { id: 'appr-1', name: 'Direct Manager / Supervisor' },
  { id: 'appr-2', name: 'Head of Department' },
  { id: 'appr-3', name: 'General Operation Manager' },
  { id: 'appr-4', name: 'HR & GA Director' }
];

export const COUNTRY_OPTIONS = [
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'BN', name: 'Brunei Darussalam', flag: '🇧🇳' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' }
];

export default function AddEmployeeView({ presenter, onBack, isEdit }) {
  const isEditMode = Boolean(isEdit || presenter?.viewMode === 'edit');
  const {
    wizardStep,
    setWizardStep,
    wizardDraft,
    updateWizardDraft,
    departments,
    positions,
    getDivisionsForDept,
    getPositionsForDivision,
    saveWizardEmployee,
    employees
  } = presenter;

  const [stepError, setStepError] = useState('');
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const fileInputRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const docInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setIsCountryDropdownOpen(false);
      }
    }
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCountryDropdownOpen]);

  const selectedCountry = useMemo(() => {
    const val = (wizardDraft.citizenship || '').trim();
    if (!val) return null;
    return COUNTRY_OPTIONS.find(
      (c) => c.name.toLowerCase() === val.toLowerCase() || c.code.toLowerCase() === val.toLowerCase()
    );
  }, [wizardDraft.citizenship]);

  const filteredCountries = useMemo(() => {
    const q = countrySearchQuery.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearchQuery]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (isPhotoPreviewOpen) setIsPhotoPreviewOpen(false);
        if (previewDoc) setPreviewDoc(null);
      }
    }
    if (isPhotoPreviewOpen || previewDoc) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isPhotoPreviewOpen, previewDoc]);

  // Numeric only handler for NIP (max 20 digits)
  const handleNipChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 20);
    updateWizardDraft({ nik: digitsOnly });
  };

  // Numeric only handler for NIK / KTP (16 digits)
  const handleKtpChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 16);
    updateWizardDraft({ ktp: digitsOnly });
  };

  // Numeric only handler for NPWP (16 digits)
  const handleNpwpChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 16);
    updateWizardDraft({ npwp: digitsOnly });
  };

  // Numeric only handler for Phone Number (max 15 digits, flexible length)
  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
    updateWizardDraft({ phone: digitsOnly });
  };

  // Numeric only handler for Emergency Phone Number (max 15 digits, flexible length)
  const handleEmergencyPhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
    updateWizardDraft({ emergencyPhone: digitsOnly });
  };

  // Sync Domicile Address when "Same as ID card address" is checked
  const handleToggleSameAddress = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      updateWizardDraft({
        sameAsIdCard: true,
        domicileAddress: wizardDraft.idCardAddress || ''
      });
    } else {
      updateWizardDraft({ sameAsIdCard: false });
    }
  };

  const handleIdCardAddressChange = (val) => {
    if (wizardDraft.sameAsIdCard) {
      updateWizardDraft({
        idCardAddress: val,
        domicileAddress: val
      });
    } else {
      updateWizardDraft({ idCardAddress: val });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        updateWizardDraft({
          avatar: uploadEvent.target.result,
          avatarFileName: file.name,
          avatarFileSize: file.size
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const displayFileSize = useMemo(() => {
    if (wizardDraft.avatarFileSize) {
      const bytes = wizardDraft.avatarFileSize;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (wizardDraft.avatar && typeof wizardDraft.avatar === 'string' && wizardDraft.avatar.startsWith('data:')) {
      const base64Str = wizardDraft.avatar.split(',')[1] || '';
      const bytes = Math.round(base64Str.length * 0.75);
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return '380 KB';
  }, [wizardDraft.avatar, wizardDraft.avatarFileSize]);

  const formatDocSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processUploadedFiles = async (files) => {
    const validFiles = [];
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds 5MB limit and was skipped.`);
      } else {
        validFiles.push(f);
      }
    }
    if (validFiles.length === 0) return;

    const readPromises = validFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
          const lowerName = file.name.toLowerCase();
          let category = 'ID Card (KTP)';
          if (lowerName.includes('ktp')) category = 'ID Card (KTP)';
          else if (lowerName.includes('npwp')) category = 'NPWP Card';
          else if (lowerName.includes('kk') || lowerName.includes('keluarga')) category = 'Family Card (KK)';
          else if (lowerName.includes('kontrak') || lowerName.includes('contract')) category = 'Work Contract';
          else if (lowerName.includes('ijazah') || lowerName.includes('diploma')) category = 'Diploma';
          else if (lowerName.includes('sertifikat') || lowerName.includes('cert')) category = 'Certificate';

          resolve({
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            category,
            name: file.name,
            size: file.size,
            type: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            isPdf,
            fileData: uploadEvent.target.result,
            uploadedAt: new Date().toISOString()
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newDocs = await Promise.all(readPromises);
    const currentDocs = wizardDraft.documents || [];
    updateWizardDraft({ documents: [...currentDocs, ...newDocs] });
  };

  const handleMultipleDocUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await processUploadedFiles(files);
    e.target.value = '';
  };


  const handleRemoveDoc = (docId) => {
    const currentDocs = wizardDraft.documents || [];
    updateWizardDraft({ documents: currentDocs.filter((d) => d.id !== docId) });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      await processUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!wizardDraft.name || !wizardDraft.name.trim()) {
      return 'Employee Name is required.';
    }
    if (!wizardDraft.nik || !wizardDraft.nik.trim()) {
      return 'NIP is required.';
    }
    if (!/^\d{1,20}$/.test(wizardDraft.nik.trim())) {
      return 'NIP must be numeric and maximum 20 digits.';
    }
    const dupNik = employees.find(
      (e) => e.id !== wizardDraft.id && e.nik.trim() === wizardDraft.nik.trim()
    );
    if (dupNik) {
      return `An employee with NIP "${wizardDraft.nik.trim()}" already exists (${dupNik.name}).`;
    }

    if (!wizardDraft.ktp || !wizardDraft.ktp.trim()) {
      return 'NIK (ID Card) is required.';
    }
    if (!/^\d{16}$/.test(wizardDraft.ktp.trim())) {
      return `NIK (ID Card) must be 16 numeric digits (currently ${(wizardDraft.ktp || '').length} digits).`;
    }
    if (wizardDraft.npwp && wizardDraft.npwp.trim()) {
      const cleanNpwp = wizardDraft.npwp.replace(/\D/g, '');
      if (cleanNpwp.length > 16) {
        return 'NPWP Number cannot exceed 16 digits.';
      }
    }
    if (!wizardDraft.gender) {
      return 'Please select Gender.';
    }
    if (!wizardDraft.idCardAddress || !wizardDraft.idCardAddress.trim()) {
      return 'Address (ID Card) is required.';
    }
    const effectiveDomicile = wizardDraft.sameAsIdCard
      ? (wizardDraft.idCardAddress || wizardDraft.domicileAddress || '')
      : (wizardDraft.domicileAddress || '');
    if (!effectiveDomicile || !effectiveDomicile.trim()) {
      return wizardDraft.sameAsIdCard
        ? 'Please enter Address (ID Card) to populate domicile address.'
        : 'Domicile Address is required (or check "Same as ID card address").';
    }
    if (!wizardDraft.birthPlace || !wizardDraft.birthPlace.trim()) {
      return 'Place of Birth is required.';
    }
    if (!wizardDraft.dob || !wizardDraft.dob.trim()) {
      return 'Date of Birth is required.';
    }
    if (!wizardDraft.phone || !wizardDraft.phone.trim()) {
      return 'Phone Number is required.';
    }
    const cleanPhone = wizardDraft.phone.replace(/\D/g, '');
    if (cleanPhone.length > 15) {
      return 'Phone Number cannot exceed 15 digits.';
    }
    if (!wizardDraft.email || !wizardDraft.email.trim()) {
      return 'Email is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(wizardDraft.email.trim())) {
      return 'Invalid email format (e.g. employee@company.com).';
    }
    const dupEmail = employees.find(
      (e) => e.id !== wizardDraft.id && e.email.trim().toLowerCase() === wizardDraft.email.trim().toLowerCase()
    );
    if (dupEmail) {
      return `An employee with Email "${wizardDraft.email.trim()}" already exists (${dupEmail.name}).`;
    }
    if (!wizardDraft.religion) {
      return 'Please select Religion.';
    }
    if (!wizardDraft.maritalStatus) {
      return 'Please select Marital Status.';
    }
    if (!wizardDraft.citizenship || !wizardDraft.citizenship.trim()) {
      return 'Citizenship is required.';
    }
    return null;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!wizardDraft.departmentId) {
      return 'Please select a Department.';
    }
    if (!wizardDraft.divisionId) {
      return 'Please select a Division.';
    }
    if (!wizardDraft.position) {
      return 'Please select a Position.';
    }
    if (!wizardDraft.employmentType) {
      return 'Please select Employee Status.';
    }
    if (!wizardDraft.joinDate || !wizardDraft.joinDate.trim()) {
      return 'Join Date is required.';
    }
    if (!wizardDraft.endDate || !wizardDraft.endDate.trim()) {
      return 'Contract End Date is required.';
    }
    if (wizardDraft.joinDate && wizardDraft.endDate && wizardDraft.endDate < wizardDraft.joinDate) {
      return 'Contract End Date cannot be before Join Date.';
    }
    return null;
  };

  // Step 3 Validation (Bank Account & Social Security)
  const validateStep3 = () => {
    if (!wizardDraft.bankName || !wizardDraft.bankName.trim()) {
      return 'Bank Name is required.';
    }
    if (!wizardDraft.bankAccount || !wizardDraft.bankAccount.trim()) {
      return 'Account Number is required.';
    }
    const cleanAccount = wizardDraft.bankAccount.replace(/\D/g, '');
    if (!cleanAccount) {
      return 'Account Number must contain digits only.';
    }
    if (cleanAccount.length > 15) {
      return 'Account Number cannot exceed 15 digits.';
    }
    if (!wizardDraft.beneficiaryName || !wizardDraft.beneficiaryName.trim()) {
      return 'Account Holder Name is required.';
    }
    if (wizardDraft.bpjsTk && wizardDraft.bpjsTk.trim()) {
      const cleanBpjs = wizardDraft.bpjsTk.replace(/\D/g, '');
      if (cleanBpjs.length > 16) {
        return 'BPJS Ketenagakerjaan number cannot exceed 16 digits.';
      }
    }
    if (wizardDraft.bpjsKesehatan && wizardDraft.bpjsKesehatan.trim()) {
      const cleanBpjs = wizardDraft.bpjsKesehatan.replace(/\D/g, '');
      if (cleanBpjs.length > 16) {
        return 'BPJS Kesehatan number cannot exceed 16 digits.';
      }
    }
    return null;
  };

  // Step 4 Validation (Emergency Contact)
  const validateStep4 = () => {
    if (!wizardDraft.emergencyName || !wizardDraft.emergencyName.trim()) {
      return 'Contact Name is required.';
    }
    if (!wizardDraft.emergencyRelation) {
      return 'Relationship is required.';
    }
    if (!wizardDraft.emergencyPhone || !wizardDraft.emergencyPhone.trim()) {
      return 'Phone Number is required.';
    }
    const cleanEmergencyPhone = wizardDraft.emergencyPhone.replace(/\D/g, '');
    if (cleanEmergencyPhone.length > 15) {
      return 'Emergency Phone Number cannot exceed 15 digits.';
    }
    return null;
  };

  // Check if all mandatory fields in each step are filled (not empty)
  const isStep1Filled = useMemo(() => {
    const hasName = Boolean(wizardDraft.name && wizardDraft.name.trim());
    const hasNip = Boolean(wizardDraft.nik && wizardDraft.nik.trim());
    const hasKtp = Boolean(wizardDraft.ktp && wizardDraft.ktp.trim());
    const hasGender = Boolean(wizardDraft.gender);
    const hasCitizenship = Boolean(wizardDraft.citizenship && wizardDraft.citizenship.trim());
    const hasIdCardAddress = Boolean(wizardDraft.idCardAddress && wizardDraft.idCardAddress.trim());
    const hasDomicile = wizardDraft.sameAsIdCard
      ? hasIdCardAddress
      : Boolean(wizardDraft.domicileAddress && wizardDraft.domicileAddress.trim());
    const hasBirthPlace = Boolean(wizardDraft.birthPlace && wizardDraft.birthPlace.trim());
    const hasDob = Boolean(wizardDraft.dob && wizardDraft.dob.trim());
    const hasPhone = Boolean(wizardDraft.phone && wizardDraft.phone.trim());
    const hasEmail = Boolean(wizardDraft.email && wizardDraft.email.trim());
    const hasReligion = Boolean(wizardDraft.religion);
    const hasMaritalStatus = Boolean(wizardDraft.maritalStatus);

    return (
      hasName &&
      hasNip &&
      hasKtp &&
      hasGender &&
      hasCitizenship &&
      hasIdCardAddress &&
      hasDomicile &&
      hasBirthPlace &&
      hasDob &&
      hasPhone &&
      hasEmail &&
      hasReligion &&
      hasMaritalStatus
    );
  }, [wizardDraft]);

  const isStep2Filled = useMemo(() => {
    const hasDept = Boolean(wizardDraft.departmentId);
    const hasDiv = Boolean(wizardDraft.divisionId);
    const hasPos = Boolean(wizardDraft.position);
    const hasStatus = Boolean(wizardDraft.employmentType);
    const hasJoinDate = Boolean(wizardDraft.joinDate && wizardDraft.joinDate.trim());
    const hasEndDate = Boolean(wizardDraft.endDate && wizardDraft.endDate.trim());

    return hasDept && hasDiv && hasPos && hasStatus && hasJoinDate && hasEndDate;
  }, [wizardDraft]);

  const isStep3Filled = useMemo(() => {
    const hasBank = Boolean(wizardDraft.bankName && wizardDraft.bankName.trim());
    const hasAccount = Boolean(wizardDraft.bankAccount && wizardDraft.bankAccount.trim());
    const hasBeneficiary = Boolean(wizardDraft.beneficiaryName && wizardDraft.beneficiaryName.trim());

    return hasBank && hasAccount && hasBeneficiary;
  }, [wizardDraft]);

  const isStep4Filled = useMemo(() => {
    const hasName = Boolean(wizardDraft.emergencyName && wizardDraft.emergencyName.trim());
    const hasRel = Boolean(wizardDraft.emergencyRelation);
    const hasPhone = Boolean(wizardDraft.emergencyPhone && wizardDraft.emergencyPhone.trim());

    return hasName && hasRel && hasPhone;
  }, [wizardDraft]);

  // Disable button ONLY when mandatory fields are still empty
  const isCurrentStepDisabled = useMemo(() => {
    if (wizardStep === 1) return !isStep1Filled;
    if (wizardStep === 2) return !isStep2Filled;
    if (wizardStep === 3) return !isStep3Filled;
    if (wizardStep === 4) return !isStep4Filled;
    return false;
  }, [wizardStep, isStep1Filled, isStep2Filled, isStep3Filled, isStep4Filled]);

  const handleNext = () => {
    setStepError('');
    if (wizardStep === 1) {
      if (wizardDraft.sameAsIdCard && wizardDraft.idCardAddress && wizardDraft.domicileAddress !== wizardDraft.idCardAddress) {
        updateWizardDraft({ domicileAddress: wizardDraft.idCardAddress });
      }
      const err = validateStep1();
      if (err) {
        setStepError(err);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setWizardStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (wizardStep === 2) {
      const err = validateStep2();
      if (err) {
        setStepError(err);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!wizardDraft.beneficiaryName && wizardDraft.name) {
        updateWizardDraft({ beneficiaryName: wizardDraft.name });
      }
      setWizardStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (wizardStep === 3) {
      const err = validateStep3();
      if (err) {
        setStepError(err);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setWizardStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setStepError('');
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStepError('');
    const err1 = validateStep1();
    if (err1) {
      setStepError(err1);
      setWizardStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const err2 = validateStep2();
    if (err2) {
      setStepError(err2);
      setWizardStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const err3 = validateStep3();
    if (err3) {
      setStepError(err3);
      setWizardStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const err4 = validateStep4();
    if (err4) {
      setStepError(err4);
      setWizardStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const res = saveWizardEmployee(wizardDraft);
    if (res && !res.success) {
      setStepError(res.error || 'Failed to save employee.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const availableDivisions = getDivisionsForDept(wizardDraft.departmentId);

  const availablePositions = useMemo(() => {
    if (!wizardDraft.divisionId) return [];
    if (typeof getPositionsForDivision === 'function') {
      return getPositionsForDivision(wizardDraft.divisionId);
    }
    return positions;
  }, [wizardDraft.divisionId, getPositionsForDivision, positions]);

  return (
    <div className="add-emp-container">
      {/* 1. Breadcrumbs */}
      <nav className="add-emp-breadcrumb" aria-label="Breadcrumb">
        <span className="add-emp-breadcrumb-item">HR Parameter</span>
        <CaretRight size={14} weight="bold" className="add-emp-breadcrumb-sep" />
        <button type="button" className="add-emp-breadcrumb-link" onClick={onBack}>
          <span>List Employee</span>
        </button>
        <CaretRight size={14} weight="bold" className="add-emp-breadcrumb-sep" />
        <span className="add-emp-breadcrumb-current">
          {isEditMode ? 'Edit Employee' : 'Add Employee'}
        </span>
      </nav>

      {/* 2. Top Hero Banner matching Employee Profile View */}
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
              <h1 className="emp-hero-banner-title">
                {isEditMode ? 'Edit Employee' : 'Add New Employee'}
              </h1>
              <p className="emp-hero-banner-desc">
                {isEditMode
                  ? 'Update employee details, organization assignment, and document records.'
                  : 'Complete the 4-step registration form to register a new employee.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Stepper Progress Timeline */}
      <div className="add-emp-stepper-card">
        <div className="add-emp-stepper">
          {/* Step 1 Item */}
          <div
            className={`add-emp-step-item ${wizardStep === 1 ? 'active' : ''} ${
              wizardStep > 1 ? 'completed' : ''
            }`}
            onClick={() => {
              if (wizardStep > 1) {
                setStepError('');
                setWizardStep(1);
              }
            }}
          >
            <div className="add-emp-step-circle">
              {wizardStep > 1 ? <Check size={18} weight="bold" /> : '1'}
            </div>
            <div className="add-emp-step-content">
              <span className="add-emp-step-title">Step 1: Personal Data</span>
              <span className="add-emp-step-desc">Identity &amp; Personal Contact</span>
            </div>
          </div>

          <div className={`add-emp-step-connector ${wizardStep > 1 ? 'completed' : ''}`} />

          {/* Step 2 Item */}
          <div
            className={`add-emp-step-item ${wizardStep === 2 ? 'active' : ''} ${
              wizardStep > 2 ? 'completed' : ''
            }`}
            onClick={() => {
              if (wizardStep > 2) {
                setStepError('');
                setWizardStep(2);
              }
            }}
          >
            <div className="add-emp-step-circle">
              {wizardStep > 2 ? <Check size={18} weight="bold" /> : '2'}
            </div>
            <div className="add-emp-step-content">
              <span className="add-emp-step-title">Step 2: Employee Data</span>
              <span className="add-emp-step-desc">Department, Position &amp; Contract</span>
            </div>
          </div>

          <div className={`add-emp-step-connector ${wizardStep > 2 ? 'completed' : ''}`} />

          {/* Step 3 Item */}
          <div
            className={`add-emp-step-item ${wizardStep === 3 ? 'active' : ''} ${
              wizardStep > 3 ? 'completed' : ''
            }`}
            onClick={() => {
              if (wizardStep > 3) {
                setStepError('');
                setWizardStep(3);
              }
            }}
          >
            <div className="add-emp-step-circle">
              {wizardStep > 3 ? <Check size={18} weight="bold" /> : '3'}
            </div>
            <div className="add-emp-step-content">
              <span className="add-emp-step-title">Step 3: Payroll &amp; Insurance</span>
              <span className="add-emp-step-desc">Bank Account &amp; Social Security</span>
            </div>
          </div>

          <div className={`add-emp-step-connector ${wizardStep > 3 ? 'completed' : ''}`} />

          {/* Step 4 Item */}
          <div className={`add-emp-step-item ${wizardStep === 4 ? 'active' : ''}`}>
            <div className="add-emp-step-circle">4</div>
            <div className="add-emp-step-content">
              <span className="add-emp-step-title">Step 4: Emergency Contact</span>
              <span className="add-emp-step-desc">Emergency Contact &amp; Address</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Form Card */}
      <div className="add-emp-form-card">
        {/* Top Header Card matching user reference photo */}
        <div className="add-emp-card-header">
          {wizardStep === 1 && (
            <>
              <div className="add-emp-heading-badge">
                <IdentificationCard size={20} weight="bold" color="#0088cc" />
              </div>
              <div>
                <h3 className="add-emp-heading-title">Personal information</h3>
                <p className="add-emp-heading-subtitle">
                  Identity, contact details, and personal information.
                </p>
              </div>
            </>
          )}

          {wizardStep === 2 && (
            <>
              <div className="add-emp-heading-badge">
                <Briefcase size={20} weight="bold" color="#0088cc" />
              </div>
              <div>
                <h3 className="add-emp-heading-title">Employee Data</h3>
                <p className="add-emp-heading-subtitle">
                  Department, position, tenure, and organizational placement.
                </p>
              </div>
            </>
          )}

          {wizardStep === 3 && (
            <>
              <div className="add-emp-heading-badge">
                <CreditCard size={20} weight="bold" color="#0088cc" />
              </div>
              <div>
                <h3 className="add-emp-heading-title">Payroll &amp; Insurance</h3>
                <p className="add-emp-heading-subtitle">
                  Bank account details for payroll transfer and BPJS insurance coverage.
                </p>
              </div>
            </>
          )}

          {wizardStep === 4 && (
            <>
              <div className="add-emp-heading-badge">
                <Phone size={20} weight="bold" color="#0088cc" />
              </div>
              <div>
                <h3 className="add-emp-heading-title">Emergency Contact</h3>
                <p className="add-emp-heading-subtitle">
                  Emergency contact details, relationship, and address.
                </p>
              </div>
            </>
          )}
        </div>

        {stepError && (
          <div className="add-emp-error-banner" role="alert">
            <WarningCircle size={20} weight="fill" />
            <span>{stepError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ============================================================ */}
          {/* STEP 1: PERSONAL DATA                                        */}
          {/* ============================================================ */}
          {wizardStep === 1 && (
            <div className="add-emp-step-pane">
              {/* DEDICATED PROFILE PICTURE SECTION */}
              <div className="add-emp-avatar-card">
                <div className="add-emp-avatar-card-header">
                  <span className="add-emp-avatar-card-title">Profile Picture</span>
                </div>

                <div className="add-emp-avatar-card-body">
                  <div className="add-emp-avatar-display-wrap">
                    {wizardDraft.avatar ? (
                      <div
                        className="add-emp-avatar-preview-trigger"
                        onClick={() => setIsPhotoPreviewOpen(true)}
                        title="Click to view full photo"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setIsPhotoPreviewOpen(true);
                          }
                        }}
                      >
                        <img
                          src={wizardDraft.avatar}
                          alt="Profile preview"
                          className="add-emp-avatar-large"
                        />
                        <div className="add-emp-avatar-zoom-overlay">
                          <Eye size={22} weight="bold" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="add-emp-avatar-empty"
                        onClick={() => fileInputRef.current?.click()}
                        title="Click to upload profile photo"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            fileInputRef.current?.click();
                          }
                        }}
                      >
                        <User size={38} weight="regular" />
                      </div>
                    )}
                  </div>

                  <div className="add-emp-avatar-actions-wrap">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="d-none"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />

                    {wizardDraft.avatar ? (
                      <div className="add-emp-avatar-file-card">
                        <div className="add-emp-avatar-file-left">
                          <div className="add-emp-avatar-file-icon-box">
                            <FileImage size={18} weight="duotone" />
                          </div>
                          <div className="add-emp-avatar-file-details">
                            <span
                              className="add-emp-avatar-file-name"
                              title={wizardDraft.avatarFileName || 'profile-photo.png'}
                            >
                              {wizardDraft.avatarFileName || 'profile-photo.png'}
                            </span>
                            <span className="add-emp-avatar-file-meta">
                              <CheckCircle size={13} weight="fill" />
                              <span>Photo attached</span>
                            </span>
                          </div>
                        </div>

                        <div className="add-emp-avatar-file-right">
                          <button
                            type="button"
                            className="btn add-emp-btn-upload-photo"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <UploadSimple size={16} weight="bold" />
                            <span>Change Photo</span>
                          </button>
                          <button
                            type="button"
                            className="btn add-emp-btn-reset-photo"
                            onClick={() =>
                              updateWizardDraft({
                                avatar: '',
                                avatarFileName: ''
                              })
                            }
                            title="Remove uploaded photo"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center">
                        <button
                          type="button"
                          className="btn add-emp-btn-upload-photo"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadSimple size={16} weight="bold" />
                          <span>Upload Photo</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Data Form Grid */}
              <div className="row g-4">
                {/* Row 1: Employee Name & NIP (16 Digits Numeric Only) */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Employee Name <span className="req">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    className="form-control add-emp-input"
                    placeholder="e.g. Budi Santoso"
                    value={wizardDraft.name}
                    onChange={(e) => updateWizardDraft({ name: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      NIP <span className="req">*</span>
                    </label>
                    <span className="add-emp-digit-hint">
                      {(wizardDraft.nik || '').length} / 20 digits
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={20}
                    placeholder="Numeric NIP (max 20 digits)"
                    className="form-control add-emp-input font-monospace"
                    value={wizardDraft.nik}
                    onChange={handleNipChange}
                  />
                </div>

                {/* Row 2: NIK (16 Digits Numeric Only) & Gender */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      NIK <span className="req">*</span>
                    </label>
                    <span className="add-emp-digit-hint">
                      {(wizardDraft.ktp || '').length} / 16 digits
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    placeholder="16-digit numeric ID Card number"
                    className="form-control add-emp-input font-monospace"
                    value={wizardDraft.ktp}
                    onChange={handleKtpChange}
                  />
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Gender <span className="req">*</span>
                    </label>
                  </div>
                  <select
                    className="form-select add-emp-input"
                    value={wizardDraft.gender}
                    onChange={(e) => updateWizardDraft({ gender: e.target.value })}
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Row 3: NPWP Number (16 Digits) & Citizenship */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">NPWP Number</label>
                    <span className="add-emp-digit-hint">
                      {(wizardDraft.npwp || '').length} / 16 digits
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    placeholder="16-digit numeric NPWP (e.g. 0925432910130000)"
                    className="form-control add-emp-input font-monospace"
                    value={wizardDraft.npwp}
                    onChange={handleNpwpChange}
                  />
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Citizenship <span className="req">*</span>
                    </label>
                  </div>
                  <div className="add-emp-country-dropdown-wrap" ref={countryDropdownRef}>
                    <button
                      type="button"
                      className={`form-control add-emp-input add-emp-country-trigger ${isCountryDropdownOpen ? 'active' : ''}`}
                      onClick={() => {
                        setIsCountryDropdownOpen((prev) => !prev);
                        setCountrySearchQuery('');
                      }}
                      aria-haspopup="listbox"
                      aria-expanded={isCountryDropdownOpen}
                    >
                      <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
                        {selectedCountry ? (
                          <>
                            <span className="add-emp-country-flag">{selectedCountry.flag}</span>
                            <span className="add-emp-country-name">{selectedCountry.name}</span>
                          </>
                        ) : wizardDraft.citizenship ? (
                          <>
                            <span className="add-emp-country-flag">🌐</span>
                            <span className="add-emp-country-name">{wizardDraft.citizenship}</span>
                          </>
                        ) : (
                          <span className="text-muted" style={{ fontWeight: 400 }}>-- Select Citizenship --</span>
                        )}
                      </div>
                      <CaretDown size={14} weight="bold" className={`add-emp-country-caret ${isCountryDropdownOpen ? 'open' : ''}`} />
                    </button>

                    {isCountryDropdownOpen && (
                      <div className="add-emp-country-menu" role="listbox">
                        <div className="add-emp-country-search-wrap">
                          <MagnifyingGlass size={14} weight="bold" className="add-emp-country-search-icon" />
                          <input
                            type="text"
                            className="form-control add-emp-country-search-input"
                            placeholder="Search country..."
                            value={countrySearchQuery}
                            onChange={(e) => setCountrySearchQuery(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <div className="add-emp-country-list">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((item) => {
                              const isSelected = selectedCountry?.code === item.code;
                              return (
                                <button
                                  type="button"
                                  key={item.code}
                                  className={`add-emp-country-item ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    updateWizardDraft({ citizenship: item.name });
                                    setIsCountryDropdownOpen(false);
                                  }}
                                  role="option"
                                  aria-selected={isSelected}
                                >
                                  <span className="add-emp-country-flag">{item.flag}</span>
                                  <span className="add-emp-country-item-name">{item.name}</span>
                                  {isSelected && <Check size={14} weight="bold" className="ms-auto text-primary" />}
                                </button>
                              );
                            })
                          ) : (
                            <div className="add-emp-country-empty">No country found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 4: Address (ID Card) & Domicile Address with Checkbox */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Address (ID Card) <span className="req">*</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={255}
                    className="form-control add-emp-input add-emp-textarea"
                    placeholder="Enter full ID card address..."
                    value={wizardDraft.idCardAddress}
                    onChange={(e) => handleIdCardAddressChange(e.target.value)}
                  />
                  <div className="add-emp-char-counter">
                    {(wizardDraft.idCardAddress || '').length} / 255
                  </div>
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Domicile Address <span className="req">*</span>
                    </label>
                    <label className="add-emp-checkbox-label">
                      <input
                        type="checkbox"
                        className="form-check-input add-emp-checkbox"
                        checked={wizardDraft.sameAsIdCard || false}
                        onChange={handleToggleSameAddress}
                      />
                      <span>Same as ID card address</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={255}
                    className="form-control add-emp-input add-emp-textarea"
                    placeholder="Enter current domicile address..."
                    value={wizardDraft.domicileAddress}
                    disabled={wizardDraft.sameAsIdCard}
                    onChange={(e) => updateWizardDraft({ domicileAddress: e.target.value })}
                  />
                  <div className="add-emp-char-counter">
                    {(wizardDraft.domicileAddress || '').length} / 255
                  </div>
                </div>

                {/* Row 5: Place of Birth & Date of Birth */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Place of Birth <span className="req">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    className="form-control add-emp-input"
                    placeholder="e.g. Jakarta"
                    value={wizardDraft.birthPlace}
                    onChange={(e) => updateWizardDraft({ birthPlace: e.target.value })}
                  />
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Date of Birth <span className="req">*</span>
                    </label>
                  </div>
                  <input
                    type="date"
                    className="form-control add-emp-input"
                    value={wizardDraft.dob}
                    onChange={(e) => updateWizardDraft({ dob: e.target.value })}
                  />
                </div>

                {/* Row 6: Phone Number with +62 & Email */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Phone Number <span className="req">*</span>
                    </label>
                    <span className="add-emp-digit-hint">
                      {(wizardDraft.phone || '').length} / 15 digits
                    </span>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text add-emp-phone-prefix">+62</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={15}
                      className="form-control add-emp-input font-monospace"
                      placeholder="81234567890"
                      value={wizardDraft.phone}
                      onChange={handlePhoneChange}
                    />
                  </div>
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Email <span className="req">*</span>
                    </label>
                  </div>
                  <input
                    type="email"
                    className="form-control add-emp-input"
                    placeholder="e.g. budi.santoso@indoland.co.id"
                    value={wizardDraft.email}
                    onChange={(e) => updateWizardDraft({ email: e.target.value })}
                  />
                </div>

                {/* Row 7: Religion & Marital Status */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Religion <span className="req">*</span>
                    </label>
                  </div>
                  <select
                    className="form-select add-emp-input"
                    value={wizardDraft.religion}
                    onChange={(e) => updateWizardDraft({ religion: e.target.value })}
                  >
                    <option value="">-- Select Religion --</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Marital Status <span className="req">*</span>
                    </label>
                  </div>
                  <select
                    className="form-select add-emp-input"
                    value={wizardDraft.maritalStatus}
                    onChange={(e) => updateWizardDraft({ maritalStatus: e.target.value })}
                  >
                    <option value="">-- Select Marital Status --</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
              </div>

              {/* Document Attachments Card - Single Unified Multiple-Upload Form */}
              {(() => {
                const docs = wizardDraft.documents || [];

                return (
                  <div className="add-emp-attachment-card">
                    <div className="add-emp-attachment-header">
                      <div className="add-emp-attachment-title-group">
                        <div className="add-emp-attachment-icon-box">
                          <FileText size={20} weight="duotone" />
                        </div>
                        <div>
                          <h4 className="add-emp-attachment-title">Document Attachments</h4>
                          <p className="add-emp-attachment-subtitle">
                            Upload employee identity files (KTP, NPWP, Family Card/KK, etc.). Supports multiple file uploads.
                          </p>
                        </div>
                      </div>
                      <div className={`add-emp-attachment-badge ${docs.length > 0 ? 'has-docs' : ''}`}>
                        <CheckCircle size={14} weight={docs.length > 0 ? 'fill' : 'regular'} />
                        <span>{docs.length} file{docs.length !== 1 ? 's' : ''} attached</span>
                      </div>
                    </div>

                    {/* Single Unified Dropzone */}
                    <input
                      type="file"
                      ref={docInputRef}
                      className="d-none"
                      multiple
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleMultipleDocUpload}
                    />

                    <div
                      className={`add-emp-unified-dropzone ${isDragging ? 'is-dragging' : ''}`}
                      onClick={() => docInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') docInputRef.current?.click();
                      }}
                    >
                      <div className="dropzone-icon-box">
                        <UploadSimple size={26} weight="bold" />
                      </div>
                      <span className="add-emp-dropzone-headline">
                        Click or drag &amp; drop files here to upload
                      </span>
                      <span className="add-emp-dropzone-sub">
                        Upload employee documents (Foto KTP, NPWP, Kartu Keluarga, etc.). Supports PDF, JPG, PNG, and WebP up to 5MB. You can select multiple files at once.
                      </span>
                      <button
                        type="button"
                        className="btn add-emp-dropzone-browse-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          docInputRef.current?.click();
                        }}
                      >
                        <Plus size={14} weight="bold" />
                        <span>Browse Documents</span>
                      </button>
                    </div>

                    {/* Uploaded Documents List */}
                    {docs.length > 0 && (
                      <div className="add-emp-doc-files-wrap">
                        <div className="add-emp-doc-files-header">
                          <span>Attached Documents ({docs.length})</span>
                          <button
                            type="button"
                            className="btn btn-link text-primary p-0 text-decoration-none fw-semibold"
                            style={{ fontSize: '12px' }}
                            onClick={() => docInputRef.current?.click()}
                          >
                            + Add more files
                          </button>
                        </div>

                        {docs.map((doc) => (
                          <div key={doc.id} className="add-emp-doc-file-card">
                            <div className="add-emp-doc-file-left">
                              <div className={`add-emp-doc-file-icon ${doc.isPdf ? 'is-pdf' : ''}`}>
                                {doc.isPdf ? <FileText size={20} weight="duotone" /> : <FileImage size={20} weight="duotone" />}
                              </div>
                              <div className="add-emp-doc-file-info">
                                <span className="add-emp-doc-file-name" title={doc.name}>{doc.name}</span>
                                <span className="add-emp-doc-file-meta">{formatDocSize(doc.size)}</span>
                              </div>
                            </div>

                            <div className="add-emp-doc-file-actions">
                              <button
                                type="button"
                                className="add-emp-btn-doc-action"
                                onClick={() => setPreviewDoc(doc)}
                                title="Preview document"
                              >
                                <Eye size={13} weight="bold" />
                                <span>Preview</span>
                              </button>
                              <a
                                href={doc.fileData}
                                download={doc.name}
                                className="add-emp-btn-doc-action"
                                title={`Download ${doc.name}`}
                              >
                                <DownloadSimple size={13} weight="bold" />
                                <span>Download</span>
                              </a>
                              <button
                                type="button"
                                className="add-emp-btn-doc-delete"
                                onClick={() => handleRemoveDoc(doc.id)}
                                title="Remove document"
                              >
                                <Trash size={13} weight="bold" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: EMPLOYEE DATA                                        */}
          {/* ============================================================ */}
          {wizardStep === 2 && (
            <div className="add-emp-step-pane">
              <div className="row g-4">
                {/* Row 1: Department & Division */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Department <span className="req">*</span>
                    </label>
                  </div>
                  <select
                    className="form-select add-emp-input"
                    value={wizardDraft.departmentId}
                    onChange={(e) => {
                      const newDeptId = e.target.value;
                      updateWizardDraft({
                        departmentId: newDeptId,
                        divisionId: '',
                        position: ''
                      });
                    }}
                    autoFocus
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Division <span className="req">*</span>
                    </label>
                  </div>
                  <select
                    className="form-select add-emp-input"
                    value={wizardDraft.divisionId}
                    disabled={!wizardDraft.departmentId}
                    onChange={(e) => {
                      const nextDivId = e.target.value;
                      updateWizardDraft({
                        divisionId: nextDivId,
                        position: ''
                      });
                    }}
                  >
                    <option value="">
                      {!wizardDraft.departmentId
                        ? '-- Please Select Department First --'
                        : '-- Select Division --'}
                    </option>
                    {availableDivisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 2: Position & Employee Status */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Position <span className="req">*</span>
                    </label>
                  </div>
                  <select
                    className="form-select add-emp-input"
                    value={wizardDraft.position}
                    disabled={!wizardDraft.divisionId}
                    onChange={(e) => updateWizardDraft({ position: e.target.value })}
                  >
                    <option value="">
                      {!wizardDraft.divisionId
                        ? '-- Please Select Division First --'
                        : '-- Select Position --'}
                    </option>
                    {availablePositions.map((p) => (
                      <option key={p.id || p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Employee Status <span className="req">*</span>
                    </label>
                  </div>
                  <select
                    className="form-select add-emp-input"
                    value={wizardDraft.employmentType}
                    onChange={(e) => updateWizardDraft({ employmentType: e.target.value })}
                  >
                    <option value="">-- Select Employee Status --</option>
                    <option value="PKWT/KONTRAK">PKWT/KONTRAK</option>
                    <option value="PKWT/PERMANEN">PKWT/PERMANEN</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Magang">Magang</option>
                  </select>
                </div>

                {/* Row 3: Join Date & Contract End Date */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Join Date <span className="req">*</span>
                    </label>
                  </div>
                  <input
                    type="date"
                    className="form-control add-emp-input"
                    value={wizardDraft.joinDate}
                    onChange={(e) => updateWizardDraft({ joinDate: e.target.value })}
                  />
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Contract End Date <span className="req">*</span>
                    </label>
                  </div>
                  <input
                    type="date"
                    className="form-control add-emp-input"
                    value={wizardDraft.endDate}
                    onChange={(e) => updateWizardDraft({ endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: PAYROLL & SOCIAL SECURITY                            */}
          {/* ============================================================ */}
          {wizardStep === 3 && (
            <div className="add-emp-step-pane">
              {/* Card 1: Bank Account */}
              <div className="add-emp-subcard mb-4">
                <div className="add-emp-subcard-header">
                  <div className="add-emp-subcard-badge emp-badge-secondary">
                    <Bank size={20} weight="bold" />
                  </div>
                  <h4 className="add-emp-subcard-title">Bank Account</h4>
                </div>

                <div className="row g-4">
                  {/* Bank Name */}
                  <div className="col-md-6 add-emp-field-col">
                    <div className="add-emp-label-wrap">
                      <label className="add-emp-label">
                        Bank Name <span className="req">*</span>
                      </label>
                    </div>
                    <select
                      className="form-select add-emp-input"
                      value={wizardDraft.bankName}
                      onChange={(e) => updateWizardDraft({ bankName: e.target.value })}
                      autoFocus
                    >
                      <option value="">-- Select Bank Name --</option>
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Number */}
                  <div className="col-md-6 add-emp-field-col">
                    <div className="add-emp-label-wrap">
                      <label className="add-emp-label">
                        Account Number <span className="req">*</span>
                      </label>
                      <span className="add-emp-digit-hint">
                        {(wizardDraft.bankAccount || '').length} / 15 digits
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={15}
                      className="form-control add-emp-input font-monospace"
                      placeholder="e.g. 102938475619283"
                      value={wizardDraft.bankAccount}
                      onChange={(e) =>
                        updateWizardDraft({
                          bankAccount: e.target.value.replace(/\D/g, '').slice(0, 15)
                        })
                      }
                    />
                  </div>

                  {/* Account Holder Name */}
                  <div className="col-md-6 add-emp-field-col">
                    <div className="add-emp-label-wrap">
                      <label className="add-emp-label">
                        Account Holder Name <span className="req">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      className="form-control add-emp-input"
                      placeholder="e.g. Raga Murtadha"
                      value={wizardDraft.beneficiaryName}
                      onChange={(e) => updateWizardDraft({ beneficiaryName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Insurance */}
              <div className="add-emp-subcard">
                <div className="add-emp-subcard-header">
                  <div className="add-emp-subcard-badge emp-badge-secondary">
                    <ShieldCheck size={20} weight="bold" />
                  </div>
                  <h4 className="add-emp-subcard-title">Insurance</h4>
                </div>

                <div className="row g-4">
                  {/* BPJS Ketenagakerjaan */}
                  <div className="col-md-6 add-emp-field-col">
                    <div className="add-emp-label-wrap">
                      <label className="add-emp-label">BPJS Ketenagakerjaan</label>
                      <span className="add-emp-digit-hint">
                        {(wizardDraft.bpjsTk || '').length} / 16 digits
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      className="form-control add-emp-input font-monospace"
                      placeholder="e.g. 0001892839210001"
                      value={wizardDraft.bpjsTk}
                      onChange={(e) =>
                        updateWizardDraft({
                          bpjsTk: e.target.value.replace(/\D/g, '').slice(0, 16)
                        })
                      }
                    />
                  </div>

                  {/* BPJS Kesehatan */}
                  <div className="col-md-6 add-emp-field-col">
                    <div className="add-emp-label-wrap">
                      <label className="add-emp-label">BPJS Kesehatan</label>
                      <span className="add-emp-digit-hint">
                        {(wizardDraft.bpjsKesehatan || '').length} / 16 digits
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      className="form-control add-emp-input font-monospace"
                      placeholder="e.g. 0002938491820002"
                      value={wizardDraft.bpjsKesehatan}
                      onChange={(e) =>
                        updateWizardDraft({
                          bpjsKesehatan: e.target.value.replace(/\D/g, '').slice(0, 16)
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: EMERGENCY CONTACT                                    */}
          {/* ============================================================ */}
          {wizardStep === 4 && (
            <div className="add-emp-step-pane">
              <div className="row g-4">
                {/* Row 1: Contact Name & Relationship */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Contact Name <span className="req">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    className="form-control add-emp-input"
                    placeholder="e.g. Siti Rahmawati"
                    value={wizardDraft.emergencyName}
                    onChange={(e) => updateWizardDraft({ emergencyName: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Relationship <span className="req">*</span>
                    </label>
                  </div>
                  <select
                    className="form-select add-emp-input"
                    value={wizardDraft.emergencyRelation}
                    onChange={(e) => updateWizardDraft({ emergencyRelation: e.target.value })}
                  >
                    <option value="">-- Select Relationship --</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Relative">Relative</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>

                {/* Row 2: NIK & Phone Number */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">NIK</label>
                    <span className="add-emp-digit-hint">
                      {(wizardDraft.emergencyNik || '').length} / 16 digits
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    placeholder="16-digit numeric ID Card number"
                    className="form-control add-emp-input font-monospace"
                    value={wizardDraft.emergencyNik}
                    onChange={(e) =>
                      updateWizardDraft({
                        emergencyNik: e.target.value.replace(/\D/g, '').slice(0, 16)
                      })
                    }
                  />
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">
                      Phone Number <span className="req">*</span>
                    </label>
                    <span className="add-emp-digit-hint">
                      {(wizardDraft.emergencyPhone || '').length} / 15 digits
                    </span>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text add-emp-phone-prefix">+62</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={15}
                      className="form-control add-emp-input font-monospace"
                      placeholder="81398765432"
                      value={wizardDraft.emergencyPhone}
                      onChange={handleEmergencyPhoneChange}
                    />
                  </div>
                </div>

                {/* Row 3: Address (ID Card) & Current Address */}
                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">Address (ID Card)</label>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={255}
                    className="form-control add-emp-input add-emp-textarea"
                    placeholder="Enter ID card address..."
                    value={wizardDraft.emergencyIdAddress}
                    onChange={(e) => updateWizardDraft({ emergencyIdAddress: e.target.value })}
                  />
                  <div className="add-emp-char-counter">
                    {(wizardDraft.emergencyIdAddress || '').length} / 255
                  </div>
                </div>

                <div className="col-md-6 add-emp-field-col">
                  <div className="add-emp-label-wrap">
                    <label className="add-emp-label">Current Address</label>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={255}
                    className="form-control add-emp-input add-emp-textarea"
                    placeholder="Enter current residential address..."
                    value={wizardDraft.emergencyCurrentAddress}
                    onChange={(e) => updateWizardDraft({ emergencyCurrentAddress: e.target.value })}
                  />
                  <div className="add-emp-char-counter">
                    {(wizardDraft.emergencyCurrentAddress || '').length} / 255
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Navigation Action Footer */}
          <div className="add-emp-footer">
            <button
              type="button"
              className="btn add-emp-btn-cancel"
              onClick={onBack}
            >
              Cancel
            </button>

            {stepError && (
              <div className="add-emp-footer-error" role="alert">
                <WarningCircle size={16} weight="fill" />
                <span>{stepError}</span>
              </div>
            )}

            <div className="add-emp-footer-actions">
              {wizardStep > 1 && (
                <button
                  type="button"
                  className="btn add-emp-btn-prev"
                  onClick={handlePrev}
                >
                  <ArrowLeft size={16} weight="bold" />
                  <span>Previous</span>
                </button>
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  className="btn add-emp-btn-next"
                  onClick={handleNext}
                  disabled={isCurrentStepDisabled}
                  title={isCurrentStepDisabled ? 'Please fill all required fields to continue' : 'Proceed to next step'}
                >
                  <span>Next Step</span>
                  <ArrowRight size={16} weight="bold" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn add-emp-btn-submit"
                  disabled={isCurrentStepDisabled}
                  title={isCurrentStepDisabled ? 'Please fill all required fields to save' : (isEditMode ? 'Save changes to employee profile' : 'Save new employee profile')}
                >
                  <FloppyDisk size={18} weight="bold" />
                  <span>{isEditMode ? 'Edit Employee' : 'Save Employee'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* PHOTO PREVIEW MODAL */}
      {isPhotoPreviewOpen && wizardDraft.avatar && (
        <div
          className="emp-modal-backdrop add-emp-photo-modal-backdrop"
          onClick={() => setIsPhotoPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="emp-modal-card add-emp-photo-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="emp-modal-header">
              <div className="d-flex align-items-center gap-2">
                <FileImage size={20} weight="duotone" style={{ color: '#002B7F' }} />
                <h3 className="m-0" style={{ fontSize: '15px' }}>Profile Photo Preview</h3>
              </div>
              <button
                type="button"
                className="emp-modal-close"
                onClick={() => setIsPhotoPreviewOpen(false)}
                aria-label="Close photo preview"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="add-emp-photo-modal-body">
              <img
                src={wizardDraft.avatar}
                alt={wizardDraft.avatarFileName || 'Profile preview'}
                className="add-emp-photo-modal-img"
              />
            </div>

            <div className="add-emp-photo-modal-footer">
              <div className="add-emp-photo-modal-meta">
                <span className="add-emp-photo-modal-filename" title={wizardDraft.avatarFileName}>
                  {wizardDraft.avatarFileName || 'profile-photo.png'}
                </span>
                <span className="add-emp-photo-modal-size">
                  {displayFileSize}
                </span>
              </div>
              <div className="d-flex align-items-center">
                <button
                  type="button"
                  className="btn add-emp-btn-upload-photo"
                  onClick={() => {
                    setIsPhotoPreviewOpen(false);
                    fileInputRef.current?.click();
                  }}
                >
                  <UploadSimple size={15} weight="bold" />
                  <span>Change Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div
          className="emp-modal-backdrop add-emp-photo-modal-backdrop"
          onClick={() => setPreviewDoc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="emp-modal-card add-emp-photo-modal-card"
            style={{ maxWidth: '820px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="emp-modal-header">
              <div className="d-flex align-items-center gap-2">
                <FileText size={20} weight="duotone" style={{ color: '#002B7F' }} />
                <h3 className="m-0" style={{ fontSize: '15px' }}>
                  {previewDoc.categoryLabel || previewDoc.name}
                </h3>
              </div>
              <button
                type="button"
                className="emp-modal-close"
                onClick={() => setPreviewDoc(null)}
                aria-label="Close document preview"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="add-emp-doc-modal-body">
              {previewDoc.isPdf ? (
                <iframe
                  src={previewDoc.fileData}
                  title={previewDoc.name}
                  className="add-emp-doc-modal-iframe"
                />
              ) : (
                <img
                  src={previewDoc.fileData}
                  alt={previewDoc.name}
                  className="add-emp-doc-modal-img"
                />
              )}
            </div>

            <div className="add-emp-photo-modal-footer">
              <div className="add-emp-photo-modal-meta">
                <span className="add-emp-photo-modal-filename" title={previewDoc.name}>
                  {previewDoc.name}
                </span>
                <span className="add-emp-photo-modal-size">
                  {formatDocSize(previewDoc.size)}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <a
                  href={previewDoc.fileData}
                  download={previewDoc.name}
                  className="btn add-emp-btn-upload-photo"
                  style={{ textDecoration: 'none' }}
                >
                  <DownloadSimple size={15} weight="bold" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
