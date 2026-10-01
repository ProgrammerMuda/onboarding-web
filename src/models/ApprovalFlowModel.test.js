/**
 * ApprovalFlowModel.test.js
 * Unit tests for resolveApprovalChain() covering all resolution dimensions, edge cases,
 * self-approval skip, duplicate consecutive skips, and empty pool fallbacks.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveApprovalChain,
  INITIAL_APPROVAL_CONFIGS,
  EMPLOYEES,
  ROLES,
  GLOBAL_FALLBACK_CHAIN
} from './ApprovalFlowModel';

describe('resolveApprovalChain() Unit Tests', () => {
  const sampleRequester = {
    id: 'emp-003', // Ahmad Fauzi (Supervisor in Engineering dept-eng)
    name: 'Ahmad Fauzi',
    departmentId: 'dept-eng',
    roleId: 'role-spv'
  };

  const sampleManager = {
    id: 'emp-002', // Jessica Tanuwijaya (Manager in Tenant Relation dept-tr, has custom override)
    name: 'Jessica Tanuwijaya',
    departmentId: 'dept-tr',
    roleId: 'role-mgr'
  };

  // 1. Resolution Specificity Order Tests
  describe('Resolution Specificity Hierarchy', () => {
    it('1. Resolves Employee + Specific Type when defined (Highest Priority)', () => {
      const customConfigs = [
        ...INITIAL_APPROVAL_CONFIGS,
        {
          id: 'cfg-emp1-leave',
          targetType: 'employee',
          targetId: 'emp-003',
          scope: 'leave',
          chain: {
            levels: [{ id: 'lvl-1', roleId: 'role-dir', mode: 'all', userIds: [], rule: 'any' }],
            requireRejectNote: true,
            fallback: 'escalate'
          }
        }
      ];

      const result = resolveApprovalChain(sampleRequester, 'leave', customConfigs);
      expect(result.resolutionSource).toBe('employee_specific');
      expect(result.resolvedLevels[0].roleId).toBe('role-dir');
    });

    it('2. Resolves Employee + All Types when specific type is not defined', () => {
      // emp-002 has an employee override for all_types
      const result = resolveApprovalChain(sampleManager, 'leave', INITIAL_APPROVAL_CONFIGS);
      expect(result.resolutionSource).toBe('employee_all_types');
      expect(result.matchedConfig.targetId).toBe('emp-002');
    });

    it('3. Resolves Department + Specific Type when employee has no override', () => {
      // dept-eng has an overtime override
      const result = resolveApprovalChain(sampleRequester, 'overtime', INITIAL_APPROVAL_CONFIGS);
      expect(result.resolutionSource).toBe('department_specific');
      expect(result.matchedConfig.targetId).toBe('dept-eng');
      expect(result.matchedConfig.scope).toBe('overtime');
    });

    it('4. Resolves Department + All Types when no specific type exists', () => {
      // dept-eng general rule for manual_attendance
      const result = resolveApprovalChain(sampleRequester, 'manual_attendance', INITIAL_APPROVAL_CONFIGS);
      expect(result.resolutionSource).toBe('department_all_types');
      expect(result.matchedConfig.targetId).toBe('dept-eng');
    });

    it('5. Resolves Global Fallback when employee has unknown department or no config exists', () => {
      const orphanEmployee = {
        id: 'emp-999',
        name: 'Orphan User',
        departmentId: 'dept-non-existent',
        roleId: 'role-spv'
      };

      const result = resolveApprovalChain(orphanEmployee, 'leave', []);
      expect(result.resolutionSource).toBe('global_fallback');
      expect(result.resolvedLevels.length).toBe(GLOBAL_FALLBACK_CHAIN.levels.length);
    });
  });

  // 2. Self-Approval Skip Edge Case
  describe('Self-Approval Edge Case', () => {
    it('Automatically removes requester from approvers pool if requester is in the same role', () => {
      // emp-003 (Supervisor) requests overtime. Level 1 is Supervisor (role-spv) mode: 'all'
      const result = resolveApprovalChain(sampleRequester, 'overtime', INITIAL_APPROVAL_CONFIGS);
      
      const level1 = result.resolvedLevels.find((lvl) => lvl.roleId === 'role-spv');
      expect(level1).toBeDefined();
      // Ensure emp-003 is NOT among the approvers
      const hasSelf = level1.approvers.some((u) => u.id === sampleRequester.id);
      expect(hasSelf).toBe(false);
      expect(level1.selfApprovalSkipped).toBe(true);
    });

    it('Bypasses level if requester was the ONLY approver in selected mode', () => {
      const configWithSoloRequester = [
        {
          id: 'cfg-solo',
          targetType: 'employee',
          targetId: sampleRequester.id,
          scope: 'all_types',
          chain: {
            levels: [
              {
                id: 'lvl-solo-1',
                roleId: 'role-spv',
                mode: 'selected',
                userIds: [sampleRequester.id], // requester is sole approver
                rule: 'any'
              },
              {
                id: 'lvl-solo-2',
                roleId: 'role-mgr',
                mode: 'selected',
                userIds: ['emp-002'],
                rule: 'any'
              }
            ],
            requireRejectNote: true,
            fallback: 'escalate'
          }
        }
      ];

      const result = resolveApprovalChain(sampleRequester, 'leave', configWithSoloRequester);
      // Level 1 should be bypassed (escalated) because the pool became empty after self-skip
      expect(result.resolvedLevels.length).toBe(1);
      expect(result.resolvedLevels[0].roleId).toBe('role-mgr');
    });
  });

  // 3. Consecutive Duplicate Approvers Auto-Skip
  describe('Consecutive Duplicate Approvers', () => {
    it('Auto-skips subsequent level if it resolves to the exact same sole approver as preceding level', () => {
      const duplicateLevelsConfig = [
        {
          id: 'cfg-duplicate',
          targetType: 'department',
          targetId: 'dept-eng',
          scope: 'all_types',
          chain: {
            levels: [
              {
                id: 'lvl-d1',
                roleId: 'role-spv',
                mode: 'selected',
                userIds: ['emp-004'], // Bambang
                rule: 'any'
              },
              {
                id: 'lvl-d2',
                roleId: 'role-mgr',
                mode: 'selected',
                userIds: ['emp-004'], // Bambang again in next level
                rule: 'any'
              }
            ],
            requireRejectNote: true,
            fallback: 'escalate'
          }
        }
      ];

      const result = resolveApprovalChain({ id: 'emp-003', departmentId: 'dept-eng' }, 'leave', duplicateLevelsConfig);
      // Should collapse the duplicate consecutive level
      expect(result.resolvedLevels.length).toBe(1);
      expect(result.resolvedLevels[0].approvers[0].id).toBe('emp-004');
    });
  });

  // 4. Deactivated / Empty Pool Fallback
  describe('Empty Approver Pool Fallbacks', () => {
    it('Applies "role_all" fallback when selected users are inactive or empty', () => {
      const emptySelectedConfig = [
        {
          id: 'cfg-empty',
          targetType: 'department',
          targetId: 'dept-fin',
          scope: 'all_types',
          chain: {
            levels: [
              {
                id: 'lvl-e1',
                roleId: 'role-mgr',
                mode: 'selected',
                userIds: ['emp-inactive-999'],
                rule: 'any'
              }
            ],
            requireRejectNote: true,
            fallback: 'role_all' // Broadens to all active managers
          }
        }
      ];

      const result = resolveApprovalChain({ id: 'emp-005', departmentId: 'dept-fin' }, 'leave', emptySelectedConfig);
      expect(result.resolvedLevels[0].approvers.length).toBeGreaterThan(0);
      expect(result.resolvedLevels[0].fallbackApplied).toContain('Broadened to all role members');
    });
  });
});
