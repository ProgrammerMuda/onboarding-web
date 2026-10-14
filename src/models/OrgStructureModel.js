/**
 * OrgStructureModel.js - Model Layer (MVP)
 * Manages consolidated Organizational Structure:
 * Root Authority (Building Manager) -> Departments -> Divisions -> Positions with Reporting Lines.
 */

import { DEPARTMENT_STORAGE_KEY } from './DepartmentModel';
import { DIVISION_STORAGE_KEY } from './DivisionModel';
import { POSITION_STORAGE_KEY, TOP_POSITION_ID, getParentIds } from './PositionModel';

export const ORG_STRUCTURE_STORAGE_KEY = 'proapps.hr.org_structure.v3';

export const DEFAULT_ROOT_AUTHORITY = {
  id: 'bm',
  title: 'Building Manager',
  name: 'Building Manager'
};

export const EMPTY_ORG_STRUCTURE = {
  rootAuthority: DEFAULT_ROOT_AUTHORITY,
  departments: [],
  divisions: [],
  positions: []
};

export const SAMPLE_ORG_STRUCTURE = {
  rootAuthority: DEFAULT_ROOT_AUTHORITY,
  departments: [
    {
      id: 'dept-bo',
      code: 'BUILDING_OPERATION',
      name: 'Building Operation',
      status: 'Active',
      reportsTo: 'Building Manager',
      description: 'Core facility and operational management for property tenants and infrastructure'
    }
  ],
  divisions: [
    {
      id: 'div-gen',
      departmentId: 'dept-bo',
      code: '001',
      name: 'General Operation',
      description: 'Operational leadership, administration, and inter-division coordination'
    },
    {
      id: 'div-eng',
      departmentId: 'dept-bo',
      code: '006',
      name: 'MEP',
      description: 'Mechanical, electrical, and plumbing (MEP) maintenance'
    },
    {
      id: 'div-sec',
      departmentId: 'dept-bo',
      code: '008',
      name: 'Security',
      description: 'Physical security, surveillance, access control, and safety protocols'
    },
    {
      id: 'div-hk',
      departmentId: 'dept-bo',
      code: '007',
      name: 'House Keeping',
      description: 'Cleanliness, sanitation, waste management, and public area upkeep'
    }
  ],
  positions: [
    {
      id: 'pos-1',
      divisionId: 'div-gen',
      codeNumber: 1,
      name: 'Chief General Operation',
      superiorId: 'bm',
      employeeCount: 1,
      status: 'Active',
      description: 'Heads operations and oversees all operational divisions'
    },
    {
      id: 'pos-2',
      divisionId: 'div-gen',
      codeNumber: 2,
      name: 'Admin General Operation',
      superiorId: 'pos-1',
      employeeCount: 1,
      status: 'Active',
      description: 'Provides administrative support and documentation for operations'
    },
    {
      id: 'pos-3',
      divisionId: 'div-eng',
      codeNumber: 3,
      name: 'Supervisor (SPV) MEP',
      superiorId: 'pos-1',
      employeeCount: 1,
      status: 'Active',
      description: 'Supervises MEP team, shifts, and technical facilities'
    },
    {
      id: 'pos-4',
      divisionId: 'div-eng',
      codeNumber: 4,
      name: 'Staff MEP',
      superiorId: 'pos-3',
      employeeCount: 3,
      status: 'Active',
      description: 'Executes preventive maintenance and corrective work orders'
    },
    {
      id: 'pos-5',
      divisionId: 'div-sec',
      codeNumber: 5,
      name: 'Komandan Regu (Danru) Security',
      superiorId: 'pos-1',
      employeeCount: 1,
      status: 'Active',
      description: 'Supervises security guards, patrols, and incident investigations'
    },
    {
      id: 'pos-6',
      divisionId: 'div-sec',
      codeNumber: 6,
      name: 'Staff Security',
      superiorId: 'pos-5',
      employeeCount: 8,
      status: 'Active',
      description: 'Performs post guard duty, visitor log, and regular patrols'
    }
  ]
};

export const INITIAL_SAMPLE_STRUCTURE = SAMPLE_ORG_STRUCTURE;

export function readOrgStructure() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return EMPTY_ORG_STRUCTURE;
    }

    // 1. Read Departments from master Department storage
    let departments = [];
    const rawDept = window.localStorage.getItem(DEPARTMENT_STORAGE_KEY);
    if (rawDept) {
      try {
        const parsed = JSON.parse(rawDept);
        if (Array.isArray(parsed)) departments = parsed;
      } catch {}
    }

    // 2. Read Divisions from master Division storage
    let divisions = [];
    const rawDiv = window.localStorage.getItem(DIVISION_STORAGE_KEY);
    if (rawDiv) {
      try {
        const parsed = JSON.parse(rawDiv);
        if (Array.isArray(parsed)) divisions = parsed;
      } catch {}
    }

    // 3. Read Positions from master Position storage
    let positions = [];
    let rootAuthority = DEFAULT_ROOT_AUTHORITY;
    const rawPos = window.localStorage.getItem(POSITION_STORAGE_KEY) || window.localStorage.getItem('proapps.hr.positions.v9') || window.localStorage.getItem('proapps.hr.positions.v8');
    if (rawPos) {
      try {
        const parsed = JSON.parse(rawPos);
        const list = Array.isArray(parsed?.positions)
          ? parsed.positions
          : Array.isArray(parsed)
          ? parsed
          : [];

        const bm = list.find((p) => p.id === TOP_POSITION_ID || p.code === '001');
        if (bm) {
          rootAuthority = {
            id: 'bm',
            title: bm.name || 'Building Manager',
            name: bm.name || 'Building Manager'
          };
        }

        positions = list
          .filter((p) => p.id !== TOP_POSITION_ID && p.code !== '001')
          .map((p, idx) => {
            const pIds = getParentIds(p);
            const superiorId = p.superiorId || pIds[0] || 'bm';
            return {
              id: p.id || `pos-${idx + 1}`,
              divisionId: p.divisionId || '',
              code: p.code || String(idx + 2).padStart(3, '0'),
              codeNumber: p.codeNumber || (parseInt(p.code, 10) || idx + 2),
              name: p.name || 'Unnamed Position',
              superiorId,
              employeeCount: p.employeeCount ?? 0,
              status: p.status || 'Active',
              description: p.description || ''
            };
          });
      } catch {}
    }

    // 4. Merge/Fallback with ORG_STRUCTURE_STORAGE_KEY for backward compatibility or direct edits
    const rawOrg = window.localStorage.getItem(ORG_STRUCTURE_STORAGE_KEY);
    if (rawOrg) {
      try {
        const parsedOrg = JSON.parse(rawOrg);
        if (parsedOrg) {
          if (parsedOrg.rootAuthority && (!rawPos || rootAuthority.title === 'Building Manager')) {
            rootAuthority = parsedOrg.rootAuthority;
          }
          if (departments.length === 0 && Array.isArray(parsedOrg.departments) && parsedOrg.departments.length > 0) {
            departments = parsedOrg.departments;
          }
          if (divisions.length === 0 && Array.isArray(parsedOrg.divisions) && parsedOrg.divisions.length > 0) {
            divisions = parsedOrg.divisions;
          }
          if (Array.isArray(parsedOrg.positions) && parsedOrg.positions.length > 0) {
            positions = parsedOrg.positions;
          }
        }
      } catch {}
    }

    departments = departments.map((d) => ({
      ...d,
      reportsTo: d.reportsTo || rootAuthority.title || 'Building Manager',
      status: d.status || 'Active',
      description: d.description || ''
    }));

    divisions = divisions.map((div) => {
      if (div && typeof div.name === 'string' && div.name.trim().toLowerCase() === 'engineering') {
        return { ...div, name: 'MEP' };
      }
      return div;
    });

    positions = positions.map((pos) => {
      let name = pos.name || '';
      if (typeof name === 'string' && name.trim().toLowerCase() === 'supervisor engineering') {
        name = 'Supervisor MEP';
      }
      return { ...pos, name };
    });

    if (departments.length === 0) {
      divisions = [];
      positions = [];
    }

    return {
      rootAuthority,
      departments,
      divisions,
      positions
    };
  } catch {
    return EMPTY_ORG_STRUCTURE;
  }
}

export function formatPositionNameWithDivision(positionName, divisionName) {
  if (!positionName || !positionName.trim()) return '';
  const cleanPos = positionName.trim();
  if (!divisionName || !divisionName.trim()) return cleanPos;
  const cleanDiv = divisionName.trim();
  if (cleanPos.toLowerCase().includes(cleanDiv.toLowerCase())) {
    return cleanPos;
  }
  return `${cleanPos} ${cleanDiv}`;
}

export function persistOrgStructure(data) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    // 1. Sync Departments to master Department storage
    if (Array.isArray(data.departments)) {
      window.localStorage.setItem(
        DEPARTMENT_STORAGE_KEY,
        JSON.stringify(data.departments)
      );
    }

    // 2. Sync Divisions to master Division storage
    if (Array.isArray(data.divisions)) {
      window.localStorage.setItem(
        DIVISION_STORAGE_KEY,
        JSON.stringify(data.divisions)
      );
    }

    // 3. Sync Positions to master Position storage
    if (Array.isArray(data.positions)) {
      const bmPos = {
        id: TOP_POSITION_ID,
        code: '001',
        name: data.rootAuthority?.title || 'Building Manager',
        parentIds: []
      };
      const formattedPositions = [
        bmPos,
        ...data.positions.map((p, idx) => ({
          id: p.id || `pos-${idx + 1}`,
          code: p.code || String(p.codeNumber || idx + 2).padStart(3, '0'),
          name: p.name,
          parentIds: [p.superiorId || TOP_POSITION_ID],
          divisionId: p.divisionId || '',
          employeeCount: p.employeeCount || 0,
          status: p.status || 'Active',
          description: p.description || ''
        }))
      ];
      window.localStorage.setItem(
        POSITION_STORAGE_KEY,
        JSON.stringify({ positions: formattedPositions, isExample: false })
      );
    }

    // 4. Save to ORG_STRUCTURE_STORAGE_KEY as well
    window.localStorage.setItem(ORG_STRUCTURE_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function getNextDepartmentDraftCode(existingDepartments = []) {
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

export function getNextDivisionDraftCode(existingDivisions = []) {
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

export function validateDepartmentDraft(draft, existingDepartments = []) {
  if (!draft.code || !draft.code.trim()) {
    return 'Department code is required.';
  }
  const cleanCode = draft.code.trim().toUpperCase();
  if (cleanCode.length < 2 || cleanCode.length > 20) {
    return 'Department code must be between 2 and 20 characters.';
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

export function validateDivisionDraft(draft, existingDivisions = []) {
  if (!draft.code || !draft.code.trim()) {
    return 'Division code is required.';
  }
  const cleanCode = draft.code.trim().toUpperCase();
  if (cleanCode.length < 2 || cleanCode.length > 12) {
    return 'Division code must be between 2 and 12 characters.';
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

export function validatePositionDraft(draft, existingPositions = []) {
  if (!draft.name || !draft.name.trim()) {
    return 'Position name is required.';
  }
  if (draft.name.trim().length > 80) {
    return 'Position name must be 80 characters or fewer.';
  }
  if (!draft.divisionId && draft.superiorId !== 'bm') {
    return 'Please select an assigned division.';
  }

  const isDuplicateName = existingPositions.some(
    (pos) =>
      pos.id !== draft.id &&
      (!pos.divisionId || !draft.divisionId || pos.divisionId === draft.divisionId) &&
      pos.name.trim().toLowerCase() === draft.name.trim().toLowerCase()
  );
  if (isDuplicateName) {
    return `Position name "${draft.name.trim()}" is already in use in this division.`;
  }

  return '';
}

/**
 * Get direct subordinates for a position ID
 */
export function getDirectSubordinates(positions, positionId) {
  return positions.filter((pos) => pos.superiorId === positionId);
}
