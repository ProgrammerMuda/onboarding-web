import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_DEPARTMENTS, 
  validateDepartment, 
  validateDepartmentRemoval,
  getNextDepartmentCode
} from './DepartmentModel';

describe('DepartmentModel', () => {
  it('starts with an empty department list by default', () => {
    expect(DEFAULT_DEPARTMENTS).toEqual([]);
  });

  it('generates sequential primary key codes (001, 002, 003)', () => {
    expect(getNextDepartmentCode([])).toBe('001');
    expect(getNextDepartmentCode([{ code: '001', name: 'Ops' }])).toBe('002');
    expect(getNextDepartmentCode([
      { code: '001', name: 'Ops' },
      { code: '002', name: 'Engineering' }
    ])).toBe('003');
  });

  it('handles existing alphanumeric codes and skips duplicates', () => {
    expect(getNextDepartmentCode([{ code: 'ENG', name: 'Engineering' }])).toBe('001');
    expect(getNextDepartmentCode([
      { code: 'ENG', name: 'Engineering' },
      { code: '001', name: 'Security' }
    ])).toBe('002');
  });

  it('validates department code format and length', () => {
    expect(validateDepartment({ code: '', name: 'General' })).toBe('Department code is required.');
    expect(validateDepartment({ code: 'A', name: 'General' })).toBe('Department code must be between 2 and 8 characters.');
    expect(validateDepartment({ code: 'TOOLONGLONG', name: 'General' })).toBe('Department code must be between 2 and 8 characters.');
  });

  it('detects duplicate department codes or names', () => {
    const existing = [
      { id: '1', code: 'SEC', name: 'Security', divisions: [] }
    ];
    expect(validateDepartment({ code: 'sec', name: 'Guards' }, existing)).toBe(
      'Department code "SEC" is already in use.'
    );
    expect(validateDepartment({ code: 'SEC2', name: 'Security' }, existing)).toBe(
      'Department name "Security" is already in use.'
    );
  });

  it('protects departments with active employees from deletion', () => {
    expect(validateDepartmentRemoval({ id: 'dept-sec', name: 'Security', employeeCount: 5 })).toBe(
      'Department "Security" cannot be deleted because it still has 5 active personnel. Reassign personnel first.'
    );
    expect(validateDepartmentRemoval({ id: 'dept-empty', name: 'Empty Dept', employeeCount: 0 })).toBe('');
  });

  it('protects departments with active divisions from deletion', () => {
    expect(validateDepartmentRemoval({ id: 'dept-ops', name: 'Operations', divisions: ['Security', 'Housekeeping'] })).toBe(
      'Department "Operations" cannot be deleted because it still has 2 active divisions. Delete or reassign its divisions first.'
    );
    expect(validateDepartmentRemoval({ id: 'dept-empty', name: 'Empty Dept', divisions: [] })).toBe('');
    expect(validateDepartmentRemoval({ id: 'dept-1', name: 'Ops' }, [{ departmentId: 'dept-1' }])).toBe(
      'Department "Ops" cannot be deleted because it still has 1 active division. Delete or reassign its divisions first.'
    );
  });
});
