/**
 * DivisionModel.js - Model Layer (MVP)
 * Manages master Division data and its relationship to Departments.
 * Defaults to an empty list for fresh property onboarding.
 */

export const DIVISION_STORAGE_KEY = 'proapps.hr.divisions.v1';

export const DEFAULT_DIVISIONS = [];

export function getNextDivisionCode(existingDivisions = []) {
  let maxNum = 0;
  existingDivisions.forEach((div) => {
    if (div && div.code) {
      const match = div.code.trim().match(/^(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }
  });
  let nextNum = maxNum + 1;
  let nextCode = String(nextNum).padStart(3, '0');
  while (
    existingDivisions.some(
      (div) => div && div.code && div.code.trim().toUpperCase() === nextCode
    )
  ) {
    nextNum += 1;
    nextCode = String(nextNum).padStart(3, '0');
  }
  return nextCode;
}

export function readDivisions() {
  try {
    const raw = localStorage.getItem(DIVISION_STORAGE_KEY);
    if (!raw) return DEFAULT_DIVISIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_DIVISIONS;
  } catch {
    return DEFAULT_DIVISIONS;
  }
}

export function persistDivisions(list) {
  try {
    localStorage.setItem(DIVISION_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function validateDivision(draft, existingDivisions = []) {
  if (!draft.code || !draft.code.trim()) {
    return 'Division code is required.';
  }
  const cleanCode = draft.code.trim().toUpperCase();
  if (cleanCode.length < 2 || cleanCode.length > 8) {
    return 'Division code must be between 2 and 8 characters.';
  }

  if (!draft.name || !draft.name.trim()) {
    return 'Division name is required.';
  }
  if (draft.name.trim().length > 60) {
    return 'Division name must be 60 characters or fewer.';
  }

  const isDuplicateCode = existingDivisions.some(
    (div) => div.id !== draft.id && div.code.trim().toUpperCase() === cleanCode
  );
  if (isDuplicateCode) {
    return `Division code "${cleanCode}" is already in use.`;
  }

  const isDuplicateName = existingDivisions.some(
    (div) => div.id !== draft.id && div.name.trim().toLowerCase() === draft.name.trim().toLowerCase()
  );
  if (isDuplicateName) {
    return `Division name "${draft.name.trim()}" is already in use.`;
  }

  return '';
}
