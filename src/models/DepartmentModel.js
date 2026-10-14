/**
 * DepartmentModel.js - Model Layer (MVP)
 * Manages master Department data and operational Divisions under each department.
 * Defaults to an empty list for fresh property onboarding.
 */

export const DEPARTMENT_STORAGE_KEY = 'proapps.hr.departments.v2';

export const DEFAULT_DEPARTMENTS = [];

export function getNextDepartmentCode(existingDepartments = []) {
  let maxNum = 0;
  existingDepartments.forEach((dept) => {
    if (dept && dept.code) {
      const match = dept.code.trim().match(/^(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }
  });
  let nextNum = maxNum + 1;
  let nextCode = String(nextNum).padStart(3, '0');
  while (
    existingDepartments.some(
      (dept) => dept && dept.code && dept.code.trim().toUpperCase() === nextCode
    )
  ) {
    nextNum += 1;
    nextCode = String(nextNum).padStart(3, '0');
  }
  return nextCode;
}

export function validateDepartment(draft, existingDepartments = []) {
  if (!draft.code || !draft.code.trim()) {
    return 'Department code is required.';
  }
  const cleanCode = draft.code.trim().toUpperCase();
  if (cleanCode.length < 2 || cleanCode.length > 8) {
    return 'Department code must be between 2 and 8 characters.';
  }
  if (!draft.name || !draft.name.trim()) {
    return 'Department name is required.';
  }
  if (draft.name.trim().length > 60) {
    return 'Department name must be 60 characters or fewer.';
  }

  const isDuplicateCode = existingDepartments.some(
    (dept) => dept.id !== draft.id && dept.code.trim().toUpperCase() === cleanCode
  );
  if (isDuplicateCode) {
    return `Department code "${cleanCode}" is already in use.`;
  }

  const isDuplicateName = existingDepartments.some(
    (dept) => dept.id !== draft.id && dept.name.trim().toLowerCase() === draft.name.trim().toLowerCase()
  );
  if (isDuplicateName) {
    return `Department name "${draft.name.trim()}" is already in use.`;
  }

  return '';
}

export function validateDepartmentRemoval(dept, allDivisions = []) {
  if (dept.id === 'dept-bm' && dept.isPermanent) {
    return 'Building Management is a core department and cannot be deleted.';
  }
  const hasDivisions = (Array.isArray(dept.divisions) && dept.divisions.length > 0) ||
    allDivisions.some((div) => div.departmentId === dept.id);
  if (hasDivisions) {
    const count = Array.isArray(dept.divisions) && dept.divisions.length > 0 
      ? dept.divisions.length 
      : allDivisions.filter((div) => div.departmentId === dept.id).length;
    return `Department "${dept.name}" cannot be deleted because it still has ${count} active ${count === 1 ? 'division' : 'divisions'}. Delete or reassign its divisions first.`;
  }
  if (dept.employeeCount && dept.employeeCount > 0) {
    return `Department "${dept.name}" cannot be deleted because it still has ${dept.employeeCount} active personnel. Reassign personnel first.`;
  }
  return '';
}
