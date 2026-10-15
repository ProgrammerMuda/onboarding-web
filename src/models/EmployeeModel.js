/**
 * EmployeeModel.js - Model Layer (MVP)
 * Manages employee master directory, department/division/position bindings, statuses, and statistics.
 */

import { readDepartments } from './DepartmentModel';
import { readDivisions } from './DivisionModel';
import { readMasterPositions } from './PositionModel';

export const EMPLOYEE_STORAGE_KEY = 'proapps.hr.employees.v3';

export const DEFAULT_EMPLOYEE_DEPARTMENTS = [
  { id: 'dept-eng', code: 'ENG', name: 'Engineering' },
  { id: 'dept-bs', code: 'BS', name: 'Building Service' },
  { id: 'dept-bm', code: 'BM', name: 'Building Management' },
  { id: 'dept-tr', code: 'TR', name: 'Tenant Relation' },
  { id: 'dept-fin', code: 'FIN', name: 'Finance & Accounting' }
];

export const DEFAULT_EMPLOYEE_DIVISIONS = [
  { id: 'div-eng', departmentId: 'dept-eng', code: 'ENG', name: 'Engineering' },
  { id: 'div-sec', departmentId: 'dept-bs', code: 'SEC', name: 'Security' },
  { id: 'div-hk', departmentId: 'dept-bs', code: 'HK', name: 'House Keeping' },
  { id: 'div-bm', departmentId: 'dept-bm', code: 'GEN', name: 'General Operation' },
  { id: 'div-tr', departmentId: 'dept-tr', code: 'TR', name: 'Tenant Relation' },
  { id: 'div-fin', departmentId: 'dept-fin', code: 'FIN', name: 'Finance' }
];

/**
 * Resolves available departments by merging customized onboarding departments with default directory departments
 */
export function getResolvedDepartments() {
  const custom = readDepartments();
  if (Array.isArray(custom) && custom.length > 0) {
    const customIds = new Set(custom.map((d) => d.id));
    const merged = [...custom];
    DEFAULT_EMPLOYEE_DEPARTMENTS.forEach((d) => {
      if (!customIds.has(d.id)) {
        merged.push(d);
      }
    });
    return merged;
  }
  return DEFAULT_EMPLOYEE_DEPARTMENTS;
}

/**
 * Resolves available divisions by merging customized onboarding divisions with default directory divisions
 */
export function getResolvedDivisions() {
  const custom = readDivisions();
  if (Array.isArray(custom) && custom.length > 0) {
    const customIds = new Set(custom.map((d) => d.id));
    const merged = [...custom];
    DEFAULT_EMPLOYEE_DIVISIONS.forEach((d) => {
      if (!customIds.has(d.id)) {
        merged.push(d);
      }
    });
    return merged;
  }
  return DEFAULT_EMPLOYEE_DIVISIONS;
}

/**
 * Standard positions catalog mapped specifically by division
 */
export const DIVISION_POSITIONS_MAP = {
  'div-sec': [
    { id: 'pos-danru-sec', name: 'Komandan Regu (Danru) Security' },
    { id: 'pos-staff-sec', name: 'Staff Security' },
    { id: 'pos-chief-sec', name: 'Chief Security' },
    { id: 'pos-spv-sec', name: 'Supervisor Security' },
    { id: 'pos-danru', name: 'Danru' }
  ],
  'div-eng': [
    { id: 'pos-chief-eng', name: 'Chief Engineering' },
    { id: 'pos-spv-eng', name: 'Supervisor (SPV) MEP' },
    { id: 'pos-staff-eng', name: 'Staff MEP' },
    { id: 'pos-tech-eng', name: 'Technician MEP' }
  ],
  'div-hk': [
    { id: 'pos-spv-hk', name: 'Supervisor House Keeping' },
    { id: 'pos-tl-hk', name: 'Team Leader House Keeping' },
    { id: 'pos-staff-hk', name: 'Staff House Keeping' }
  ],
  'div-bm': [
    { id: 'pos-bm', name: 'Building Manager' },
    { id: 'pos-abm', name: 'Assistant Building Manager (ABM)' },
    { id: 'pos-chief-gen', name: 'Chief General Operation' },
    { id: 'pos-admin-gen', name: 'Admin General Operation' },
    { id: 'pos-staff-gen', name: 'Staff General Operation' }
  ],
  'div-gen': [
    { id: 'pos-bm', name: 'Building Manager' },
    { id: 'pos-abm', name: 'Assistant Building Manager (ABM)' },
    { id: 'pos-chief-gen', name: 'Chief General Operation' },
    { id: 'pos-admin-gen', name: 'Admin General Operation' },
    { id: 'pos-staff-gen', name: 'Staff General Operation' }
  ],
  'div-tr': [
    { id: 'pos-chief-tr', name: 'Chief Tenant Relation' },
    { id: 'pos-spv-tr', name: 'Supervisor Tenant Relation' },
    { id: 'pos-staff-tr', name: 'Staff Tenant Relation' },
    { id: 'pos-admin-tr', name: 'Admin Tenant Relation' }
  ],
  'div-fin': [
    { id: 'pos-spv-fin', name: 'Supervisor Finance' },
    { id: 'pos-staff-fin', name: 'Staff Finance' },
    { id: 'pos-admin-fin', name: 'Admin Finance' }
  ]
};

/**
 * Returns positions belonging exclusively to a specific division
 */
export function getPositionsForDivision(divisionId) {
  if (!divisionId) return [];

  let list = [];
  if (DIVISION_POSITIONS_MAP[divisionId]) {
    list = [...DIVISION_POSITIONS_MAP[divisionId]];
  }

  // Also check if dynamic positions exist in Org Structure storage for this division
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('proapps.hr.org_structure.v3');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.positions)) {
          const orgPositions = parsed.positions.filter((p) => p.divisionId === divisionId && p.name);
          orgPositions.forEach((op) => {
            if (!list.some((item) => item.name.toLowerCase() === op.name.toLowerCase())) {
              list.unshift({ id: op.id || `pos-${Date.now()}`, name: op.name });
            }
          });
        }
      }
    }
  } catch {}

  // If division is custom or unmapped by direct ID, match by division name keyword
  if (list.length === 0) {
    const allDivs = getResolvedDivisions();
    const divObj = allDivs.find((d) => d.id === divisionId);
    const divName = (divObj?.name || '').toLowerCase();

    if (divName.includes('security') || divName.includes('keamanan') || divName.includes('satpam')) {
      return [...DIVISION_POSITIONS_MAP['div-sec']];
    }
    if (divName.includes('engineering') || divName.includes('mep') || divName.includes('teknik')) {
      return [...DIVISION_POSITIONS_MAP['div-eng']];
    }
    if (divName.includes('house keeping') || divName.includes('cleaning') || divName.includes('kebersihan')) {
      return [...DIVISION_POSITIONS_MAP['div-hk']];
    }
    if (divName.includes('tenant') || divName.includes('relation')) {
      return [...DIVISION_POSITIONS_MAP['div-tr']];
    }
    if (divName.includes('finance') || divName.includes('keuangan') || divName.includes('accounting')) {
      return [...DIVISION_POSITIONS_MAP['div-fin']];
    }
    if (divName.includes('general') || divName.includes('operasional') || divName.includes('management')) {
      return [...DIVISION_POSITIONS_MAP['div-bm']];
    }

    const label = divObj?.name || 'Division';
    return [
      { id: `pos-spv-${divisionId}`, name: `Supervisor ${label}` },
      { id: `pos-staff-${divisionId}`, name: `Staff ${label}` },
      { id: `pos-admin-${divisionId}`, name: `Admin ${label}` }
    ];
  }

  return list;
}

export const INITIAL_EMPLOYEES = [
  {
    id: 'emp-001',
    nik: '3171015508920001',
    name: 'Budi Hartono',
    email: 'budi.hartono@indoland.co.id',
    phone: '0812-3456-7890',
    departmentId: 'dept-bm',
    divisionId: 'div-bm',
    position: 'Building Manager',
    joinDate: '2024-01-01',
    endDate: '2025-12-31',
    resignDate: '',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-002',
    nik: '3171015508920002',
    name: 'Jessica Tanuwijaya',
    email: 'jessica.t@indoland.co.id',
    phone: '0813-8877-6655',
    departmentId: 'dept-tr',
    divisionId: 'div-tr',
    position: 'Chief',
    joinDate: '2024-06-01',
    endDate: '2026-05-31',
    resignDate: '',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-003',
    nik: '3174021406890003',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@indoland.co.id',
    phone: '0817-9988-1122',
    departmentId: 'dept-eng',
    divisionId: 'div-eng',
    position: 'Supervisor',
    joinDate: '2024-03-01',
    endDate: '2025-02-28',
    resignDate: '',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-004',
    nik: '3275031902800004',
    name: 'Bambang Sudibyo',
    email: 'bambang.s@indoland.co.id',
    phone: '0815-2233-4455',
    departmentId: 'dept-eng',
    divisionId: 'div-eng',
    position: 'Staff',
    joinDate: '2025-01-15',
    endDate: '2026-01-14',
    resignDate: '',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-005',
    nik: '3173064811910005',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@indoland.co.id',
    phone: '0819-4455-6677',
    departmentId: 'dept-fin',
    divisionId: 'div-fin',
    position: 'Supervisor',
    joinDate: '2024-08-01',
    endDate: '2025-07-31',
    resignDate: '',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-006',
    nik: '3174052109840006',
    name: 'Robert Gunawan',
    email: 'robert.g@indoland.co.id',
    phone: '0811-1234-5678',
    departmentId: 'dept-fin',
    divisionId: 'div-fin',
    position: 'Staff',
    joinDate: '2023-08-01',
    endDate: '2024-07-31',
    resignDate: '2024-07-31',
    status: 'Resigned',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-007',
    nik: '3175081203950007',
    name: 'Siti Rahmawati',
    email: 'siti.rahma@indoland.co.id',
    phone: '0857-1122-3344',
    departmentId: 'dept-bs',
    divisionId: 'div-sec',
    position: 'Danru',
    joinDate: '2024-04-18',
    endDate: '2025-04-17',
    resignDate: '',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-008',
    nik: '3171092804870008',
    name: 'Hendro Prasetyo',
    email: 'hendro.p@indoland.co.id',
    phone: '0812-9900-1122',
    departmentId: 'dept-bs',
    divisionId: 'div-sec',
    position: 'Staff',
    joinDate: '2025-02-01',
    endDate: '2026-01-31',
    resignDate: '',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-009',
    nik: '3276041507930009',
    name: 'Rian Hidayat',
    email: 'rian.hidayat@indoland.co.id',
    phone: '0813-4455-6677',
    departmentId: 'dept-bs',
    divisionId: 'div-hk',
    position: 'Team Leader',
    joinDate: '2024-09-01',
    endDate: '2025-08-31',
    resignDate: '',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-010',
    nik: '3174092201940010',
    name: 'Maya Indah',
    email: 'maya.indah@indoland.co.id',
    phone: '0856-7788-9900',
    departmentId: 'dept-bs',
    divisionId: 'div-hk',
    position: 'Staff',
    joinDate: '2024-01-15',
    endDate: '2024-12-31',
    resignDate: '2024-12-31',
    status: 'Resigned',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-011',
    nik: '3171051108860011',
    name: 'Dimas Wicaksono',
    email: 'dimas.w@indoland.co.id',
    phone: '0812-7766-5544',
    departmentId: 'dept-eng',
    divisionId: 'div-eng',
    position: 'Coordinator',
    joinDate: '2024-07-01',
    endDate: '2025-06-30',
    resignDate: '',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'emp-012',
    nik: '3172041909950012',
    name: 'Ratna Sari',
    email: 'ratna.sari@indoland.co.id',
    phone: '0818-3344-5566',
    departmentId: 'dept-bm',
    divisionId: 'div-bm',
    position: 'Admin',
    joinDate: '2025-03-01',
    endDate: '2026-02-28',
    resignDate: '',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80'
  }
];

/**
 * Calculate statistical breakdown: Total, Active, Resigned/Inactive
 */
export function calculateEmployeeStats(employees = []) {
  const total = employees.length;
  let active = 0;
  let resigned = 0;

  employees.forEach((emp) => {
    const isAct = emp.status === 'Active';
    if (isAct) {
      active += 1;
    } else {
      resigned += 1;
    }
  });

  const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;
  const resignedPercentage = total > 0 ? Math.round((resigned / total) * 100) : 0;

  return {
    total,
    active,
    resigned,
    activePercentage,
    resignedPercentage
  };
}

/**
 * Read employees from localStorage or return default initial employees
 */
export function readEmployees() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return INITIAL_EMPLOYEES;
    }
    let raw = window.localStorage.getItem(EMPLOYEE_STORAGE_KEY);
    // If v3 does not exist yet, check v2 to migrate custom additions
    if (!raw) {
      const legacyRaw = window.localStorage.getItem('proapps.hr.employees.v2');
      if (legacyRaw) {
        try {
          const parsedLegacy = JSON.parse(legacyRaw);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            raw = legacyRaw;
          }
        } catch {}
      }
    }

    if (!raw) {
      window.localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let changed = false;
      const normalized = parsed.map((emp) => {
        let updated = { ...emp };
        const seedMatch = INITIAL_EMPLOYEES.find((s) => s.id === updated.id);

        if (seedMatch) {
          // Guarantee dummy employees always maintain their verified department and division pairings
          if (
            updated.departmentId !== seedMatch.departmentId ||
            updated.divisionId !== seedMatch.divisionId
          ) {
            updated.departmentId = seedMatch.departmentId;
            updated.divisionId = seedMatch.divisionId;
            changed = true;
          }
        } else {
          // Custom employee record: ensure department and division are filled
          if (updated.departmentId === 'dept-sec' || updated.departmentId === 'dept-hk') {
            const div = updated.departmentId === 'dept-sec' ? 'div-sec' : 'div-hk';
            updated.departmentId = 'dept-bs';
            updated.divisionId = updated.divisionId || div;
            changed = true;
          } else if (!updated.departmentId) {
            updated.departmentId = 'dept-bm';
            changed = true;
          }

          if (!updated.divisionId) {
            if (updated.departmentId === 'dept-eng') updated.divisionId = 'div-eng';
            else if (updated.departmentId === 'dept-bs') updated.divisionId = 'div-sec';
            else if (updated.departmentId === 'dept-bm') updated.divisionId = 'div-bm';
            else if (updated.departmentId === 'dept-tr') updated.divisionId = 'div-tr';
            else if (updated.departmentId === 'dept-fin') updated.divisionId = 'div-fin';
            else updated.divisionId = 'div-bm';
            changed = true;
          }
        }

        return updated;
      });

      if (changed || !window.localStorage.getItem(EMPLOYEE_STORAGE_KEY)) {
        window.localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(normalized));
      }
      return normalized;
    }

    window.localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(INITIAL_EMPLOYEES));
    return INITIAL_EMPLOYEES;
  } catch {
    return INITIAL_EMPLOYEES;
  }
}

/**
 * Persist employee list to localStorage
 */
export function persistEmployees(employees) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(employees));
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate employee draft before saving
 */
export function validateEmployeeDraft(draft, existingEmployees = []) {
  if (!draft) return 'Invalid employee data.';
  if (!draft.name || !draft.name.trim()) return 'Employee name is required.';
  if (draft.name.trim().length < 2) return 'Employee name must be at least 2 characters.';

  if (!draft.nik || !draft.nik.trim()) return 'NIP is required.';
  if (draft.nik.trim().length > 20) return 'NIP cannot exceed 20 digits.';

  if (!draft.email || !draft.email.trim()) return 'Email is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(draft.email.trim())) return 'Invalid email format.';

  if (!draft.departmentId) return 'Please select an assigned Department.';
  if (!draft.position) return 'Please select a Position.';

  // Validate Masa Kerja (Join Date & End Date Kontrak)
  if (!draft.joinDate || !draft.joinDate.trim()) {
    return 'Contract Start Date (Join Date) is required.';
  }
  if (!draft.endDate || !draft.endDate.trim()) {
    return 'Contract End Date is required.';
  }
  if (draft.joinDate && draft.endDate && draft.endDate < draft.joinDate) {
    return 'Contract End Date cannot be before Contract Start Date.';
  }

  // Check duplicate NIP or Email
  const dupNik = existingEmployees.find(
    (e) => e.id !== draft.id && e.nik.trim() === draft.nik.trim()
  );
  if (dupNik) {
    return `An employee with NIP "${draft.nik.trim()}" already exists (${dupNik.name}).`;
  }

  const dupEmail = existingEmployees.find(
    (e) => e.id !== draft.id && e.email.trim().toLowerCase() === draft.email.trim().toLowerCase()
  );
  if (dupEmail) {
    return `An employee with Email "${draft.email.trim()}" already exists (${dupEmail.name}).`;
  }

  return null;
}

