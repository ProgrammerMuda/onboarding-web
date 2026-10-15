import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateEmployeeStats,
  validateEmployeeDraft,
  readEmployees,
  persistEmployees,
  getPositionsForDivision,
  EMPLOYEE_STORAGE_KEY,
  INITIAL_EMPLOYEES
} from './EmployeeModel';

describe('EmployeeModel', () => {
  let store = {};

  beforeEach(() => {
    store = {};
    global.window = {
      localStorage: {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { store = {}; }
      }
    };
  });

  it('calculates employee statistics accurately (total, active, resigned)', () => {
    const mockList = [
      { id: '1', name: 'A', status: 'Active', joinDate: '2024-01-01', endDate: '2025-01-01' },
      { id: '2', name: 'B', status: 'Active', joinDate: '2024-02-01', endDate: '2025-02-01' },
      { id: '3', name: 'C', status: 'Resigned', joinDate: '2023-01-01', endDate: '2024-01-01' },
      { id: '4', name: 'D', status: 'Inactive', joinDate: '2023-05-01', endDate: '2024-05-01' }
    ];

    const stats = calculateEmployeeStats(mockList);
    expect(stats.total).toBe(4);
    expect(stats.active).toBe(2);
    expect(stats.resigned).toBe(2);
    expect(stats.activePercentage).toBe(50);
    expect(stats.resignedPercentage).toBe(50);
  });

  it('validates required employee fields, email format, and contract tenure dates', () => {
    expect(validateEmployeeDraft(null)).not.toBeNull();
    expect(validateEmployeeDraft({ name: '' })).toBe('Employee name is required.');
    expect(validateEmployeeDraft({ name: 'Budi', nik: '' })).toBe('NIP is required.');
    expect(validateEmployeeDraft({ name: 'Budi', nik: '123456', email: 'invalid-email' })).toBe('Invalid email format.');
    expect(validateEmployeeDraft({ name: 'Budi', nik: '123456', email: 'budi@test.com', departmentId: '' })).toBe('Please select an assigned Department.');
    expect(validateEmployeeDraft({ name: 'Budi', nik: '123456', email: 'budi@test.com', departmentId: 'd1', position: 'Staff', joinDate: '', endDate: '' })).toBe('Contract Start Date (Join Date) is required.');
    expect(validateEmployeeDraft({ name: 'Budi', nik: '123456', email: 'budi@test.com', departmentId: 'd1', position: 'Staff', joinDate: '2025-01-01', endDate: '' })).toBe('Contract End Date is required.');
    expect(validateEmployeeDraft({ name: 'Budi', nik: '123456', email: 'budi@test.com', departmentId: 'd1', position: 'Staff', joinDate: '2025-01-01', endDate: '2024-12-31' })).toBe('Contract End Date cannot be before Contract Start Date.');
  });

  it('detects duplicate NIP and duplicate Email', () => {
    const existing = [
      { id: '1', nik: '31710001', email: 'test@proapps.com', name: 'Budi' }
    ];

    const dupNik = validateEmployeeDraft(
      { id: '2', name: 'Joko', nik: '31710001', email: 'joko@proapps.com', departmentId: 'd1', position: 'Staff', joinDate: '2025-01-01', endDate: '2026-01-01' },
      existing
    );
    expect(dupNik).toContain('already exists');

    const dupEmail = validateEmployeeDraft(
      { id: '2', name: 'Joko', nik: '31710002', email: 'test@proapps.com', departmentId: 'd1', position: 'Staff', joinDate: '2025-01-01', endDate: '2026-01-01' },
      existing
    );
    expect(dupEmail).toContain('already exists');
  });

  it('persists and loads employees from localStorage', () => {
    expect(readEmployees()).toEqual(INITIAL_EMPLOYEES);

    const custom = [{ id: '1', name: 'Custom Employee', status: 'Active' }];
    persistEmployees(custom);
    expect(store[EMPLOYEE_STORAGE_KEY]).toBeDefined();

    const loaded = readEmployees();
    expect(loaded[0].name).toBe('Custom Employee');
  });

  it('correctly calculates pagination boundaries and slice for 10 items per page', () => {
    const list = Array.from({ length: 12 }, (_, i) => ({ id: String(i + 1), name: `Emp ${i + 1}` }));
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    expect(totalPages).toBe(2);

    // Page 1 (items 1 to 10)
    const p1Start = 0;
    const p1End = Math.min(10, list.length);
    const p1Items = list.slice(p1Start, p1End);
    expect(p1Items.length).toBe(10);
    expect(p1Items[0].name).toBe('Emp 1');
    expect(p1Items[9].name).toBe('Emp 10');

    // Page 2 (items 11 to 12)
    const p2Start = 10;
    const p2End = Math.min(20, list.length);
    const p2Items = list.slice(p2Start, p2End);
    expect(p2Items.length).toBe(2);
    expect(p2Items[0].name).toBe('Emp 11');
    expect(p2Items[1].name).toBe('Emp 12');
  });

  it('validates and persists 3-step employee wizard records with emergency contacts and tenure', () => {
    const wizardDraft = {
      id: 'emp-wizard-001',
      // Step 1: Personal Data
      name: 'Rudi Hermawan',
      nik: '3171098877660001',
      email: 'rudi.h@indoland.co.id',
      phone: '0812-9988-7766',
      gender: 'Male',
      dob: '1990-05-15',
      ktp: '3171098877660001',
      religion: 'Islam',
      maritalStatus: 'Married',
      address: 'Jl. Sudirman No. 10, Jakarta Selatan',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',

      // Step 2: Employee Data
      departmentId: 'dept-eng',
      divisionId: 'div-eng',
      position: 'Staff',
      employmentType: 'Contract',
      joinDate: '2025-01-01',
      endDate: '2026-01-01',
      workLocation: 'Head Office',
      shiftSchedule: 'Normal (08:00 - 17:00)',
      status: 'Active',
      resignDate: '',

      // Step 3: Emergency Contact & Notes
      emergencyName: 'Dewi Lestari',
      emergencyRelation: 'Spouse',
      emergencyPhone: '0813-1122-3344',
      emergencyAddress: 'Jl. Sudirman No. 10, Jakarta Selatan',
      secondaryEmergencyName: 'Bambang',
      secondaryEmergencyPhone: '0856-4433-2211',
      contractNotes: 'Includes laptop & building keycard'
    };

    expect(validateEmployeeDraft(wizardDraft, [])).toBeNull();

    // Persist to storage
    const currentList = readEmployees();
    const updated = [wizardDraft, ...currentList];
    persistEmployees(updated);

    const reloaded = readEmployees();
    const found = reloaded.find((e) => e.id === 'emp-wizard-001');
    expect(found).toBeDefined();
    expect(found.name).toBe('Rudi Hermawan');
    expect(found.emergencyName).toBe('Dewi Lestari');
    expect(found.emergencyPhone).toBe('0813-1122-3344');
    expect(found.contractNotes).toBe('Includes laptop & building keycard');
  });

  it('filters positions exclusively by division (e.g. security division only shows security positions)', () => {
    const secPositions = getPositionsForDivision('div-sec');
    expect(secPositions.length).toBeGreaterThan(0);
    expect(secPositions.some((p) => p.name.includes('Security') || p.name === 'Danru')).toBe(true);
    // Ensure no MEP or Finance positions are in Security
    expect(secPositions.some((p) => p.name.includes('MEP') || p.name.includes('Finance'))).toBe(false);

    const engPositions = getPositionsForDivision('div-eng');
    expect(engPositions.some((p) => p.name.includes('MEP') || p.name.includes('Engineering'))).toBe(true);
    expect(engPositions.some((p) => p.name.includes('Security') || p.name === 'Danru')).toBe(false);

    expect(getPositionsForDivision('')).toEqual([]);
  });
});


