/**
 * useEmployeePresenter.js - Presenter Layer (MVP)
 * Manages employee directory state, statistical aggregations, filters, and CRUD operations.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  readEmployees,
  persistEmployees,
  calculateEmployeeStats,
  validateEmployeeDraft,
  getResolvedDepartments,
  getResolvedDivisions,
  getPositionsForDivision
} from '../models/EmployeeModel';
import { readDepartments } from '../models/DepartmentModel';
import { readDivisions } from '../models/DivisionModel';
import { readMasterPositions, TOP_POSITION_ID } from '../models/PositionModel';

const EMPTY_DRAFT = {
  id: '',
  // Step 1: Personal Data
  name: '',
  gender: '',
  ktp: '', // NIK (ID Card)
  npwp: '',
  idCardAddress: '',
  domicileAddress: '',
  sameAsIdCard: false,
  birthPlace: '',
  dob: '',
  phone: '',
  email: '',
  religion: '',
  maritalStatus: '',
  citizenship: 'Indonesia',
  avatar: '',
  avatarFileName: '',
  documents: [], // Document attachments (KTP, NPWP, KK, etc.)

  // Step 2: Employee Data
  nik: '', // NIP
  departmentId: '',
  divisionId: '',
  position: '',
  employmentType: '', // Employee Status (PKWT/KONTRAK, PKWT/PERMANEN, Vendor, Magang)
  joinDate: '',
  endDate: '',
  approvalLine: '',
  status: 'Active',
  resignDate: '',

  // Step 3: Payroll & Social Security
  bankName: '',
  bankAccount: '',
  beneficiaryName: '',
  paymentSchedule: 'Monthly (Every 25th)',
  bpjsTk: '',
  bpjsKesehatan: '',
  coverageTier: 'Class 1 Corporate Comprehensive',

  // Step 4: Emergency Contact
  emergencyName: '',
  emergencyRelation: '',
  emergencyNik: '',
  emergencyPhone: '',
  emergencyIdAddress: '',
  emergencyCurrentAddress: '',

  // Legacy/Additional support
  address: '',
  workLocation: 'Head Office',
  shiftSchedule: 'Normal (08:00 - 17:00)',
  contractNotes: ''
};

export function useEmployeePresenter() {
  const [employees, setEmployees] = useState(readEmployees);
  const [departments, setDepartments] = useState(getResolvedDepartments);
  const [divisions, setDivisions] = useState(getResolvedDivisions);
  const [positions, setPositions] = useState(() =>
    readMasterPositions().filter((p) => p.id !== TOP_POSITION_ID && p.code !== '001')
  );

  // View Mode: 'list' (Employee Directory) | 'add' (3-step Add Employee Page) | 'edit' (Edit Employee Page) | 'detail' (Profile Page)
  const [viewMode, setViewMode] = useState('list');
  const [returnViewMode, setReturnViewMode] = useState('list');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardDraft, setWizardDraft] = useState(EMPTY_DRAFT);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'Resigned'
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');

  // Modals
  const [modal, setModal] = useState({
    isOpen: false,
    mode: 'add',
    data: EMPTY_DRAFT,
    error: ''
  });

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    employee: null
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    employee: null
  });

  const [successModal, setSuccessModal] = useState(null);

  // Sync master references on mount
  useEffect(() => {
    setDepartments(getResolvedDepartments());
    setDivisions(getResolvedDivisions());
    setPositions(readMasterPositions().filter((p) => p.id !== TOP_POSITION_ID && p.code !== '001'));
  }, []);

  // Compute Statistics: Total, Active, Resigned/Inactive
  const stats = useMemo(() => {
    return calculateEmployeeStats(employees);
  }, [employees]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'Active' && emp.status !== 'Active') return false;
        if (statusFilter === 'Resigned' && emp.status !== 'Resigned' && emp.status !== 'Inactive') return false;
      }

      // 2. Department Filter
      if (departmentFilter !== 'all' && emp.departmentId !== departmentFilter) {
        return false;
      }

      // 3. Division Filter
      if (divisionFilter !== 'all' && emp.divisionId !== divisionFilter) {
        return false;
      }

      // 4. Search Query
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesNik = emp.nik.toLowerCase().includes(q);
        const matchesEmail = emp.email.toLowerCase().includes(q);
        const matchesPos = emp.position && emp.position.toLowerCase().includes(q);
        return matchesName || matchesNik || matchesEmail || matchesPos;
      }

      return true;
    });
  }, [employees, statusFilter, departmentFilter, divisionFilter, searchQuery]);

  // Divisions available for selected department in form
  const getDivisionsForDept = useCallback((deptId) => {
    if (!deptId) return [];
    return divisions.filter((d) => d.departmentId === deptId);
  }, [divisions]);

  // Add / Edit Modal Actions
  const openAddEmployeePage = useCallback(() => {
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    const defaultJoin = today.toISOString().slice(0, 10);
    const defaultEnd = nextYear.toISOString().slice(0, 10);

    setWizardDraft({
      ...EMPTY_DRAFT,
      id: `emp-${Date.now()}`,
      departmentId: '',
      divisionId: '',
      position: '',
      employmentType: '',
      joinDate: defaultJoin,
      endDate: defaultEnd,
      avatar: '',
      avatarFileName: '',
      status: 'Active'
    });
    setReturnViewMode('list');
    setWizardStep(1);
    setViewMode('add');
  }, []);

  const goBackToList = useCallback(() => {
    setViewMode(returnViewMode === 'detail' && selectedEmployee ? 'detail' : 'list');
    setWizardStep(1);
  }, [returnViewMode, selectedEmployee]);

  const updateWizardDraft = useCallback((fields) => {
    setWizardDraft((prev) => ({ ...prev, ...fields }));
  }, []);

  const saveWizardEmployee = useCallback((draft) => {
    const errorMsg = validateEmployeeDraft(draft, employees);
    if (errorMsg) {
      return { success: false, error: errorMsg };
    }

    const isEdit = viewMode === 'edit';
    const nextList = isEdit
      ? employees.map((e) => (e.id === draft.id ? draft : e))
      : [draft, ...employees];

    setEmployees(nextList);
    persistEmployees(nextList);
    if (selectedEmployee && selectedEmployee.id === draft.id) {
      setSelectedEmployee(draft);
    }

    const targetView = returnViewMode === 'detail' && selectedEmployee ? 'detail' : 'list';
    setViewMode(targetView);
    setWizardStep(1);

    setSuccessModal({
      title: isEdit ? 'Employee Profile Updated!' : 'New Employee Added!',
      subtext: `Employee profile for "${draft.name}" (${draft.position}) has been saved successfully.`
    });
    return { success: true };
  }, [viewMode, returnViewMode, employees, selectedEmployee]);

  const openAddModal = useCallback(() => {
    // Navigate directly to the 4-step Add Employee page
    openAddEmployeePage();
  }, [openAddEmployeePage]);

  const openEditModal = useCallback((emp) => {
    if (!emp) return;
    setReturnViewMode(viewMode === 'detail' ? 'detail' : 'list');

    // Populate all wizard fields from the employee being edited
    setWizardDraft({
      ...EMPTY_DRAFT,
      ...emp,
      // Step 1: Personal Data
      name: emp.name || '',
      nik: emp.nik || '', // NIP
      ktp: emp.ktp || emp.nik || '3171015508920001',
      npwp: emp.npwp || '09.254.678.9-012.000',
      gender: emp.gender || (emp.name?.toLowerCase().includes('dewi') || emp.name?.toLowerCase().includes('jessica') || emp.name?.toLowerCase().includes('ratna') ? 'Female' : 'Male'),
      citizenship: emp.citizenship || 'Indonesia',
      idCardAddress: emp.idCardAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan',
      domicileAddress: emp.domicileAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan',
      sameAsIdCard: emp.sameAsIdCard !== undefined ? Boolean(emp.sameAsIdCard) : true,
      birthPlace: emp.birthPlace || 'Jakarta',
      dob: emp.dob || '1992-05-15',
      phone: emp.phone ? String(emp.phone).replace(/\D/g, '') : '081234567890',
      email: emp.email || '',
      religion: emp.religion || 'Islam',
      maritalStatus: emp.maritalStatus || 'Married',
      avatar: emp.avatar || '',
      documents: Array.isArray(emp.documents) && emp.documents.length > 0 ? emp.documents : [],

      // Step 2: Employee Data
      departmentId: emp.departmentId || '',
      divisionId: emp.divisionId || '',
      position: emp.position || '',
      employmentType: emp.employmentType || 'PKWT / Kontrak',
      joinDate: emp.joinDate || '2024-01-01',
      endDate: emp.endDate || '2025-12-31',
      approvalLine: emp.approvalLine || 'Direct Manager / Supervisor',
      status: emp.status || 'Active',

      // Step 3: Payroll & Social Security
      bankName: emp.bankName || 'Bank Central Asia (BCA)',
      bankAccount: emp.bankAccount || '8830192841',
      beneficiaryName: emp.beneficiaryName || emp.name || '',
      paymentSchedule: emp.paymentSchedule || 'Monthly (Every 25th)',
      bpjsTk: emp.bpjsTk || '000192837465',
      bpjsKesehatan: emp.bpjsKesehatan || '000987654321',
      coverageTier: emp.coverageTier || 'Class 1 Corporate Comprehensive',

      // Step 4: Emergency Contact
      emergencyName: emp.emergencyName || (emp.name?.toLowerCase().includes('dewi') ? 'Rian Pratama' : 'Siti Rahmawati'),
      emergencyRelation: emp.emergencyRelation || 'Spouse',
      emergencyNik: emp.emergencyNik || '3171015508920099',
      emergencyPhone: emp.emergencyPhone ? String(emp.emergencyPhone).replace(/\D/g, '') : '081399887766',
      emergencyIdAddress: emp.emergencyIdAddress || emp.idCardAddress || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan',
      emergencyCurrentAddress: emp.emergencyCurrentAddress || emp.domicileAddress || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan'
    });
    setWizardStep(1);
    setViewMode('edit');
  }, [viewMode]);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false, error: '' }));
  }, []);

  const saveEmployee = useCallback((draft) => {
    const errorMsg = validateEmployeeDraft(draft, employees);
    if (errorMsg) {
      setModal((prev) => ({ ...prev, error: errorMsg }));
      return false;
    }

    const isEdit = modal.mode === 'edit';
    const nextList = isEdit
      ? employees.map((e) => (e.id === draft.id ? draft : e))
      : [draft, ...employees];

    setEmployees(nextList);
    persistEmployees(nextList);
    if (selectedEmployee && selectedEmployee.id === draft.id) {
      setSelectedEmployee(draft);
    }
    closeModal();

    setSuccessModal({
      title: isEdit ? 'Employee Updated Successfully!' : 'New Employee Added!',
      subtext: `Employee profile for "${draft.name}" (${draft.position}) has been saved successfully.`
    });
    return true;
  }, [modal.mode, employees, selectedEmployee, closeModal]);

  // Detail Profile Actions (Dedicated View & Modal fallback)
  const openEmployeeDetail = useCallback((emp) => {
    setSelectedEmployee(emp);
    setViewMode('detail');
  }, []);

  const closeEmployeeDetail = useCallback(() => {
    setSelectedEmployee(null);
    setViewMode('list');
  }, []);

  const openDetailModal = useCallback((emp) => {
    openEmployeeDetail(emp);
  }, [openEmployeeDetail]);

  const closeDetailModal = useCallback(() => {
    setDetailModal({ isOpen: false, employee: null });
  }, []);

  // Delete Modal Actions
  const openDeleteModal = useCallback((emp) => {
    setDeleteModal({ isOpen: true, employee: emp });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ isOpen: false, employee: null });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteModal.employee) return;
    const targetId = deleteModal.employee.id;
    const targetName = deleteModal.employee.name;

    const nextList = employees.filter((e) => e.id !== targetId);
    setEmployees(nextList);
    persistEmployees(nextList);
    closeDeleteModal();

    setSuccessModal({
      title: 'Employee Deleted Successfully',
      subtext: `Employee record for "${targetName}" has been removed from the directory.`
    });
  }, [deleteModal.employee, employees, closeDeleteModal]);

  const closeSuccessModal = useCallback(() => {
    setSuccessModal(null);
  }, []);

  const importEmployees = useCallback((records = []) => {
    if (!Array.isArray(records) || records.length === 0) return 0;
    const existingNips = new Set(employees.map((e) => (e.nik || '').trim()));
    const existingEmails = new Set(employees.map((e) => (e.email || '').trim().toLowerCase()));

    const newEmployees = [];
    records.forEach((rec, idx) => {
      const cleanNip = (rec.nik || '').trim();
      const cleanEmail = (rec.email || '').trim().toLowerCase();
      if (!cleanNip || existingNips.has(cleanNip)) return;
      if (cleanEmail && existingEmails.has(cleanEmail)) return;

      existingNips.add(cleanNip);
      if (cleanEmail) existingEmails.add(cleanEmail);

      const id = rec.id || `emp-imp-${Date.now()}-${idx}`;
      newEmployees.push({
        id,
        nik: cleanNip,
        name: rec.name || 'Unnamed Employee',
        email: rec.email || '',
        phone: rec.phone || '',
        departmentId: rec.departmentId || 'dept-bm',
        divisionId: rec.divisionId || 'div-bm',
        position: rec.position || 'Staff',
        joinDate: rec.joinDate || new Date().toISOString().slice(0, 10),
        endDate: rec.endDate || '',
        resignDate: rec.resignDate || '',
        status: rec.status || 'Active',
        avatar: rec.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      });
    });

    if (newEmployees.length === 0) return 0;

    const nextList = [...newEmployees, ...employees];
    setEmployees(nextList);
    persistEmployees(nextList);

    setSuccessModal({
      title: 'Employees Imported Successfully!',
      subtext: `Successfully imported ${newEmployees.length} employee record(s) into the directory.`
    });
    return newEmployees.length;
  }, [employees]);

  return {
    employees,
    filteredEmployees,
    departments,
    divisions,
    positions,
    stats,

    // Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    divisionFilter,
    setDivisionFilter,
    getDivisionsForDept,
    getPositionsForDivision,

    // View Mode, Detail View & 3-Step Wizard for Add Employee
    viewMode,
    setViewMode,
    returnViewMode,
    setReturnViewMode,
    selectedEmployee,
    setSelectedEmployee,
    openEmployeeDetail,
    closeEmployeeDetail,
    wizardStep,
    setWizardStep,
    wizardDraft,
    updateWizardDraft,
    openAddEmployeePage,
    goBackToList,
    saveWizardEmployee,

    // Modals
    modal,
    openAddModal,
    openEditModal,
    closeModal,
    saveEmployee,
    importEmployees,

    detailModal,
    openDetailModal,
    closeDetailModal,

    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,

    successModal,
    closeSuccessModal
  };
}
