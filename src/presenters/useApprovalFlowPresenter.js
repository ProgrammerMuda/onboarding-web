/**
 * useApprovalFlowPresenter.js - Presenter Layer (MVP)
 * Encapsulates all business logic, draft state management, validation,
 * switching safeguards, and live resolution preview for the Approval Flow settings.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  REQUEST_TYPES,
  ROLES,
  DEPARTMENTS,
  EMPLOYEES,
  INITIAL_APPROVAL_CONFIGS,
  GLOBAL_FALLBACK_CHAIN,
  createDefaultChain,
  resolveApprovalChain
} from '../models/ApprovalFlowModel';

export function useApprovalFlowPresenter() {
  // 1. Data Store State
  const [configs, setConfigs] = useState(INITIAL_APPROVAL_CONFIGS);
  const [employees, setEmployees] = useState(EMPLOYEES);
  const [departments] = useState(DEPARTMENTS);
  const [roles] = useState(ROLES);
  const [requestTypes] = useState(REQUEST_TYPES);

  // 2. Navigation / Target Selection State
  const [targetType, setTargetType] = useState('department'); // 'department' | 'employee'
  const [selectedTargetId, setSelectedTargetId] = useState('dept-bm');
  const [searchQuery, setSearchQuery] = useState('');

  // 3. Editor Mode & Tab State
  const [editorMode, setEditorMode] = useState('all_types'); // 'all_types' | 'per_type'
  const [activeRequestType, setActiveRequestType] = useState('leave'); // 'leave' | 'manual_attendance' | ...

  // 4. Working Drafts for the selected target
  // Stores current edits for each scope: { all_types: chain, leave: chain, ... }
  const [draftChains, setDraftChains] = useState(() => {
    return initializeDrafts('dept-bm', 'department', INITIAL_APPROVAL_CONFIGS);
  });

  // Track if current working copy has modifications
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [notification, setNotification] = useState(null); // { type: 'success'|'error'|'info', message }

  // 5. Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    cancelText: 'Batal',
    variant: 'primary',
    onConfirm: () => {}
  });

  // Helper to initialize draft chains from configs
  function initializeDrafts(targetId, targetKind, currentConfigs) {
    const targetConfigs = currentConfigs.filter(
      (c) => c.targetType === targetKind && c.targetId === targetId
    );

    const allTypesConfig = targetConfigs.find((c) => c.scope === 'all_types');
    
    // If target is employee and has no config, inherit from department
    let baseChain;
    if (allTypesConfig) {
      baseChain = JSON.parse(JSON.stringify(allTypesConfig.chain));
    } else if (targetKind === 'employee') {
      const emp = EMPLOYEES.find((e) => e.id === targetId);
      const deptConfig = currentConfigs.find(
        (c) => c.targetType === 'department' && c.targetId === emp?.departmentId && c.scope === 'all_types'
      );
      baseChain = deptConfig
        ? JSON.parse(JSON.stringify(deptConfig.chain))
        : createDefaultChain(['role-spv']);
    } else {
      baseChain = createDefaultChain(['role-spv']);
    }

    const drafts = {
      all_types: baseChain
    };

    REQUEST_TYPES.forEach((rt) => {
      const typeConfig = targetConfigs.find((c) => c.scope === rt.id);
      if (typeConfig) {
        drafts[rt.id] = JSON.parse(JSON.stringify(typeConfig.chain));
      } else {
        drafts[rt.id] = JSON.parse(JSON.stringify(baseChain));
      }
    });

    return drafts;
  }

  // Active target object
  const currentTarget = useMemo(() => {
    if (targetType === 'department') {
      return departments.find((d) => d.id === selectedTargetId) || departments[0];
    } else {
      return employees.find((e) => e.id === selectedTargetId) || employees[0];
    }
  }, [targetType, selectedTargetId, departments, employees]);

  // Target Status Badge calculation
  const targetStatus = useMemo(() => {
    if (targetType === 'department') {
      return {
        label: 'Department Default',
        variant: 'primary',
        isCustom: false
      };
    } else {
      const hasOverride = configs.some(
        (c) => c.targetType === 'employee' && c.targetId === selectedTargetId
      );
      return {
        label: hasOverride ? 'Custom Employee Override' : 'Follows Department Approval',
        variant: hasOverride ? 'warning' : 'secondary',
        isCustom: hasOverride
      };
    }
  }, [targetType, selectedTargetId, configs]);

  // Per-type custom status map
  const perTypeCustomMap = useMemo(() => {
    const map = {};
    REQUEST_TYPES.forEach((rt) => {
      const exists = configs.some(
        (c) => c.targetType === targetType && c.targetId === selectedTargetId && c.scope === rt.id
      );
      map[rt.id] = exists;
    });
    return map;
  }, [configs, targetType, selectedTargetId]);

  // Current active chain being viewed/edited
  const activeChain = useMemo(() => {
    const currentScope = editorMode === 'all_types' ? 'all_types' : activeRequestType;
    return draftChains[currentScope] || draftChains.all_types || createDefaultChain();
  }, [draftChains, editorMode, activeRequestType]);

  // Department metadata (employee count & custom overrides count)
  const departmentStats = useMemo(() => {
    const stats = {};
    departments.forEach((dept) => {
      const empsInDept = employees.filter((e) => e.departmentId === dept.id);
      const customCount = empsInDept.filter((e) =>
        configs.some((c) => c.targetType === 'employee' && c.targetId === e.id)
      ).length;
      stats[dept.id] = {
        employeeCount: empsInDept.length,
        customOverridesCount: customCount
      };
    });
    return stats;
  }, [departments, employees, configs]);

  // Filtered lists for left column
  const filteredDepartments = useMemo(() => {
    if (!searchQuery) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter(
      (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    );
  }, [departments, searchQuery]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.nik.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  // Change Target handler with unsaved changes guard
  const handleSelectTarget = useCallback(
    (newTargetId, newTargetType = targetType) => {
      if (newTargetId === selectedTargetId && newTargetType === targetType) return;

      if (isDirty) {
        setConfirmDialog({
          isOpen: true,
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to switch targets and discard your current edits?',
          confirmText: 'Leave & Discard',
          cancelText: 'Stay Here',
          variant: 'danger',
          onConfirm: () => {
            setTargetType(newTargetType);
            setSelectedTargetId(newTargetId);
            setDraftChains(initializeDrafts(newTargetId, newTargetType, configs));
            setIsDirty(false);
            setValidationErrors({});
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }
        });
      } else {
        setTargetType(newTargetType);
        setSelectedTargetId(newTargetId);
        setDraftChains(initializeDrafts(newTargetId, newTargetType, configs));
        setIsDirty(false);
        setValidationErrors({});
      }
    },
    [isDirty, targetType, selectedTargetId, configs]
  );

  // Switch Editor Mode (All Types vs Per Type) with safeguard
  const handleToggleEditorMode = useCallback(
    (newMode) => {
      if (newMode === editorMode) return;

      if (newMode === 'per_type') {
        // Copy all_types chain to all types that don't have custom chains
        setDraftChains((prev) => {
          const updated = { ...prev };
          REQUEST_TYPES.forEach((rt) => {
            if (!perTypeCustomMap[rt.id]) {
              updated[rt.id] = JSON.parse(JSON.stringify(prev.all_types));
            }
          });
          return updated;
        });
        setEditorMode('per_type');
      } else {
        // Switching to 'all_types' when per-type chains exist
        const hasPerTypeConfigs = Object.values(perTypeCustomMap).some(Boolean);
        if (hasPerTypeConfigs) {
          setConfirmDialog({
            isOpen: true,
            title: 'Switch to All Types Mode',
            message:
              'This target has custom configurations for specific request types. Do you want to apply the general rule to all types, or retain per-type customizations?',
            confirmText: 'Apply General Rule to All',
            cancelText: 'Cancel',
            variant: 'warning',
            onConfirm: () => {
              setEditorMode('all_types');
              setIsDirty(true);
              setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            }
          });
        } else {
          setEditorMode('all_types');
        }
      }
    },
    [editorMode, perTypeCustomMap]
  );

  // Update chain helper
  const updateCurrentDraftChain = useCallback(
    (updater) => {
      const currentScope = editorMode === 'all_types' ? 'all_types' : activeRequestType;
      setDraftChains((prev) => {
        const current = prev[currentScope] || prev.all_types;
        const next = typeof updater === 'function' ? updater(current) : updater;
        return {
          ...prev,
          [currentScope]: next
        };
      });
      setIsDirty(true);
      setValidationErrors({});
    },
    [editorMode, activeRequestType]
  );

  // Level Management Handlers
  const handleAddLevel = useCallback(() => {
    updateCurrentDraftChain((current) => {
      if (current.levels.length >= 5) return current;
      const newLevel = {
        id: `lvl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        roleId: '',
        mode: 'all',
        userIds: [],
        rule: 'any'
      };
      return {
        ...current,
        levels: [...current.levels, newLevel]
      };
    });
  }, [updateCurrentDraftChain]);

  const handleRemoveLevel = useCallback(
    (levelIndex) => {
      updateCurrentDraftChain((current) => {
        if (current.levels.length <= 1) return current;
        return {
          ...current,
          levels: current.levels.filter((_, idx) => idx !== levelIndex)
        };
      });
    },
    [updateCurrentDraftChain]
  );

  const handleUpdateLevelRole = useCallback(
    (levelIndex, newRoleId) => {
      updateCurrentDraftChain((current) => {
        const nextLevels = [...current.levels];
        nextLevels[levelIndex] = {
          ...nextLevels[levelIndex],
          roleId: newRoleId,
          userIds: [] // Reset selected people when role changes
        };
        return { ...current, levels: nextLevels };
      });
    },
    [updateCurrentDraftChain]
  );

  const handleUpdateLevelMode = useCallback(
    (levelIndex, newMode) => {
      updateCurrentDraftChain((current) => {
        const nextLevels = [...current.levels];
        nextLevels[levelIndex] = {
          ...nextLevels[levelIndex],
          mode: newMode,
          userIds: newMode === 'all' ? [] : nextLevels[levelIndex].userIds
        };
        return { ...current, levels: nextLevels };
      });
    },
    [updateCurrentDraftChain]
  );

  const handleAddUserToLevel = useCallback(
    (levelIndex, userId) => {
      updateCurrentDraftChain((current) => {
        const nextLevels = [...current.levels];
        const userIds = nextLevels[levelIndex].userIds || [];
        if (!userIds.includes(userId)) {
          nextLevels[levelIndex] = {
            ...nextLevels[levelIndex],
            userIds: [...userIds, userId]
          };
        }
        return { ...current, levels: nextLevels };
      });
    },
    [updateCurrentDraftChain]
  );

  const handleRemoveUserFromLevel = useCallback(
    (levelIndex, userId) => {
      updateCurrentDraftChain((current) => {
        const nextLevels = [...current.levels];
        nextLevels[levelIndex] = {
          ...nextLevels[levelIndex],
          userIds: (nextLevels[levelIndex].userIds || []).filter((id) => id !== userId)
        };
        return { ...current, levels: nextLevels };
      });
    },
    [updateCurrentDraftChain]
  );

  const handleUpdateLevelRule = useCallback(
    (levelIndex, newRule) => {
      updateCurrentDraftChain((current) => {
        const nextLevels = [...current.levels];
        nextLevels[levelIndex] = {
          ...nextLevels[levelIndex],
          rule: newRule
        };
        return { ...current, levels: nextLevels };
      });
    },
    [updateCurrentDraftChain]
  );

  const handleUpdateRejectNoteOption = useCallback(
    (requireRejectNote) => {
      updateCurrentDraftChain((current) => ({
        ...current,
        requireRejectNote
      }));
    },
    [updateCurrentDraftChain]
  );

  const handleUpdateFallbackOption = useCallback(
    (fallback) => {
      updateCurrentDraftChain((current) => ({
        ...current,
        fallback
      }));
    },
    [updateCurrentDraftChain]
  );

  // Validation
  const validateChain = useCallback((chain) => {
    const errors = {};
    (chain.levels || []).forEach((lvl, idx) => {
      if (!lvl.roleId) {
        errors[`level_${idx}`] = 'Please select an approver department for this level.';
      } else if (lvl.mode === 'selected' && (!lvl.userIds || lvl.userIds.length === 0)) {
        errors[`level_${idx}`] = 'Please select at least one person for this level.';
      }
    });
    return errors;
  }, []);

  // Save changes
  const handleSave = useCallback(() => {
    const currentScope = editorMode === 'all_types' ? 'all_types' : activeRequestType;
    const chainToSave = draftChains[currentScope];

    const errors = validateChain(chainToSave);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setNotification({
        type: 'danger',
        message: 'Please select an approver department and complete required assignments before saving.'
      });
      return;
    }

    setConfigs((prev) => {
      // Remove existing config for this target + scope
      let nextConfigs = prev.filter(
        (c) => !(c.targetType === targetType && c.targetId === selectedTargetId && c.scope === currentScope)
      );

      // Add updated config
      nextConfigs.push({
        id: `cfg-${targetType}-${selectedTargetId}-${currentScope}`,
        targetType,
        targetId: selectedTargetId,
        scope: currentScope,
        chain: JSON.parse(JSON.stringify(chainToSave))
      });

      return nextConfigs;
    });

    setIsDirty(false);
    setValidationErrors({});
    setNotification({
      type: 'success',
      message: 'Approval flow configuration saved successfully. Changes apply to new requests.'
    });

    setTimeout(() => {
      setNotification(null);
    }, 4500);
  }, [editorMode, activeRequestType, draftChains, validateChain, targetType, selectedTargetId]);

  // Cancel edits and reload
  const handleCancel = useCallback(() => {
    setDraftChains(initializeDrafts(selectedTargetId, targetType, configs));
    setIsDirty(false);
    setValidationErrors({});
  }, [selectedTargetId, targetType, configs]);

  // Reset employee override to department default
  const handleResetToDepartmentDefault = useCallback(() => {
    if (targetType !== 'employee') return;

    setConfirmDialog({
      isOpen: true,
      title: 'Reset to Department Default',
      message: 'All custom approval flow overrides for this employee will be deleted and reset to follow their department settings.',
      confirmText: 'Reset Now',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: () => {
        setConfigs((prev) =>
          prev.filter((c) => !(c.targetType === 'employee' && c.targetId === selectedTargetId))
        );
        const emp = employees.find((e) => e.id === selectedTargetId);
        const deptConfig = configs.find(
          (c) => c.targetType === 'department' && c.targetId === emp?.departmentId && c.scope === 'all_types'
        );
        const base = deptConfig ? JSON.parse(JSON.stringify(deptConfig.chain)) : createDefaultChain();
        setDraftChains({
          all_types: base,
          leave: JSON.parse(JSON.stringify(base)),
          manual_attendance: JSON.parse(JSON.stringify(base)),
          overtime: JSON.parse(JSON.stringify(base)),
          change_shift: JSON.parse(JSON.stringify(base))
        });
        setIsDirty(false);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setNotification({
          type: 'info',
          message: 'Employee configuration has been reset to department default.'
        });
      }
    });
  }, [targetType, selectedTargetId, configs, employees]);

  // Reset a single request type override to general rule
  const handleResetTypeToGeneralRule = useCallback(
    (typeId) => {
      setConfirmDialog({
        isOpen: true,
        title: 'Follow General Rule',
        message: `Remove custom rules for "${REQUEST_TYPES.find((r) => r.id === typeId)?.label}" and follow the general rule?`,
        confirmText: 'Follow General Rule',
        cancelText: 'Cancel',
        variant: 'primary',
        onConfirm: () => {
          setConfigs((prev) =>
            prev.filter(
              (c) => !(c.targetType === targetType && c.targetId === selectedTargetId && c.scope === typeId)
            )
          );
          setDraftChains((prev) => ({
            ...prev,
            [typeId]: JSON.parse(JSON.stringify(prev.all_types))
          }));
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          setNotification({
            type: 'info',
            message: `Request type now follows the general rule.`
          });
        }
      });
    },
    [targetType, selectedTargetId]
  );

  return {
    // State
    configs,
    employees,
    departments,
    roles,
    requestTypes,
    targetType,
    setTargetType,
    selectedTargetId,
    currentTarget,
    targetStatus,
    searchQuery,
    setSearchQuery,
    filteredDepartments,
    filteredEmployees,
    departmentStats,
    editorMode,
    activeRequestType,
    setActiveRequestType,
    activeChain,
    draftChains,
    isDirty,
    validationErrors,
    notification,
    confirmDialog,
    setConfirmDialog,
    perTypeCustomMap,

    // Actions
    handleSelectTarget,
    handleToggleEditorMode,
    handleAddLevel,
    handleRemoveLevel,
    handleUpdateLevelRole,
    handleUpdateLevelMode,
    handleAddUserToLevel,
    handleRemoveUserFromLevel,
    handleUpdateLevelRule,
    handleUpdateRejectNoteOption,
    handleUpdateFallbackOption,
    handleSave,
    handleCancel,
    handleResetToDepartmentDefault,
    handleResetTypeToGeneralRule,
    setNotification
  };
}
