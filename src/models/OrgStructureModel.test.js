import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_ROOT_AUTHORITY,
  INITIAL_SAMPLE_STRUCTURE,
  readOrgStructure,
  persistOrgStructure,
  validateDepartmentDraft,
  validateDivisionDraft,
  validatePositionDraft,
  getDirectSubordinates,
  formatPositionNameWithDivision
} from './OrgStructureModel';

describe('OrgStructureModel', () => {
  let store = {};

  beforeEach(() => {
    store = {};
    global.window = {
      localStorage: {
        getItem: (key) => store[key] || null,
        setItem: (key, val) => {
          store[key] = String(val);
        },
        removeItem: (key) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        }
      }
    };
  });

  describe('Storage & Default Seed', () => {
    it('returns default empty structure when localStorage is empty', () => {
      const data = readOrgStructure();
      expect(data.rootAuthority).toEqual(DEFAULT_ROOT_AUTHORITY);
      expect(data.departments).toEqual([]);
      expect(data.divisions).toEqual([]);
      expect(data.positions).toEqual([]);
    });

    it('persists and restores custom structure', () => {
      const custom = {
        rootAuthority: { id: 'bm', title: 'Managing Director', name: 'Managing Director' },
        departments: [{ id: 'd1', code: 'FIN', name: 'Finance', status: 'Active' }],
        divisions: [{ id: 'div1', departmentId: 'd1', code: 'ACC', name: 'Accounting' }],
        positions: [{ id: 'p1', divisionId: 'div1', name: 'Senior Accountant', superiorId: 'bm' }]
      };
      const saved = persistOrgStructure(custom);
      expect(saved).toBe(true);

      const loaded = readOrgStructure();
      expect(loaded.rootAuthority.title).toBe('Managing Director');
      expect(loaded.departments[0].name).toBe('Finance');
      expect(loaded.positions[0].name).toBe('Senior Accountant');
    });

    it('automatically reads departments, divisions, and positions saved in master storage keys', () => {
      // Simulate department saved in Department module
      store['proapps.hr.departments.v2'] = JSON.stringify([
        { id: 'dept-eng', code: '001', name: 'Engineering', status: 'Active' }
      ]);
      // Simulate division saved in Division module
      store['proapps.hr.divisions.v1'] = JSON.stringify([
        { id: 'div-mep', departmentId: 'dept-eng', code: '001', name: 'MEP Maintenance' }
      ]);
      // Simulate position saved in Position module
      store['proapps.hr.positions.v8'] = JSON.stringify({
        positions: [
          { id: 'bm', code: '001', name: 'Building Manager', parentIds: [] },
          { id: 'pos-10', code: '002', name: 'Chief Engineer', parentIds: ['bm'] }
        ],
        isExample: false
      });

      const loaded = readOrgStructure();
      expect(loaded.departments).toHaveLength(1);
      expect(loaded.departments[0].name).toBe('Engineering');
      expect(loaded.divisions).toHaveLength(1);
      expect(loaded.divisions[0].name).toBe('MEP Maintenance');
      expect(loaded.positions).toHaveLength(1);
      expect(loaded.positions[0].name).toBe('Chief Engineer');
      expect(loaded.positions[0].superiorId).toBe('bm');
    });
  });

  describe('validateDepartmentDraft', () => {
    it('requires code and name', () => {
      expect(validateDepartmentDraft({ code: '', name: 'Ops' })).toContain('code is required');
      expect(validateDepartmentDraft({ code: 'OPS', name: '' })).toContain('name is required');
    });

    it('disallows duplicate code or name', () => {
      const existing = [{ id: '1', code: 'ENG', name: 'Engineering' }];
      expect(validateDepartmentDraft({ id: '2', code: 'eng', name: 'Other' }, existing)).toContain('already in use');
      expect(validateDepartmentDraft({ id: '2', code: 'TECH', name: 'Engineering' }, existing)).toContain('already in use');
    });

    it('passes for valid draft', () => {
      expect(validateDepartmentDraft({ code: 'HR', name: 'Human Resources' }, [])).toBe('');
    });
  });

  describe('validateDivisionDraft', () => {
    it('requires code and name', () => {
      expect(validateDivisionDraft({ code: '', name: 'Div' })).toContain('code is required');
      expect(validateDivisionDraft({ code: '001', name: '' })).toContain('name is required');
    });

    it('validates duplicate division code and name', () => {
      const existing = [{ id: '1', code: '001', name: 'Maintenance' }];
      expect(validateDivisionDraft({ id: '2', code: '001', name: 'Civil' }, existing)).toContain('already in use');
      expect(validateDivisionDraft({ id: '2', code: '002', name: 'maintenance' }, existing)).toContain('already in use');
    });

    it('passes for valid draft', () => {
      expect(validateDivisionDraft({ code: '009', name: 'Landscape' }, [])).toBe('');
    });
  });

  describe('validatePositionDraft', () => {
    it('requires name and assigned division', () => {
      expect(validatePositionDraft({ name: '', divisionId: 'div-1' })).toContain('name is required');
      expect(validatePositionDraft({ name: 'Tech', divisionId: '' })).toContain('assigned division');
    });

    it('disallows duplicate position name within the same division, but allows across different divisions', () => {
      const existing = [{ id: 'p1', divisionId: 'div-bs', name: 'Chief' }];
      // Duplicate in the same division
      expect(validatePositionDraft({ id: 'p2', name: 'chief', divisionId: 'div-bs' }, existing)).toContain('already in use');
      // Allowed in another division (e.g. Chief in Engineering)
      expect(validatePositionDraft({ id: 'p3', name: 'chief', divisionId: 'div-eng' }, existing)).toBe('');
    });

    it('passes for valid position', () => {
      expect(validatePositionDraft({ name: 'Chief Security', divisionId: 'div-sec' }, [])).toBe('');
    });
  });

  describe('formatPositionNameWithDivision', () => {
    it('appends division name to role if not already included', () => {
      expect(formatPositionNameWithDivision('Chief', 'Security')).toBe('Chief Security');
      expect(formatPositionNameWithDivision('Supervisor (SPV)', 'MEP')).toBe('Supervisor (SPV) MEP');
      expect(formatPositionNameWithDivision('Staff', 'Engineering')).toBe('Staff Engineering');
      // Should not duplicate if already present
      expect(formatPositionNameWithDivision('Chief Security', 'Security')).toBe('Chief Security');
      expect(formatPositionNameWithDivision('Chief', '')).toBe('Chief');
    });
  });

  describe('getDirectSubordinates', () => {
    it('correctly filters positions reporting to given positionId', () => {
      const positions = INITIAL_SAMPLE_STRUCTURE.positions;
      const subordinates = getDirectSubordinates(positions, 'pos-1');
      const names = subordinates.map((s) => s.name);
      expect(names).toContain('Admin General Operation');
      expect(names).toContain('Supervisor (SPV) MEP');
      expect(names).toContain('Komandan Regu (Danru) Security');
    });
  });
});
