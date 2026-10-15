import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  readOrgStructure,
  persistOrgStructure,
  validateDepartmentDraft,
  validateDivisionDraft,
  validatePositionDraft,
  getNextDepartmentDraftCode,
  getNextDivisionDraftCode,
  getDirectSubordinates,
  formatPositionNameWithDivision,
  SAMPLE_ORG_STRUCTURE,
  EMPTY_ORG_STRUCTURE
} from '../models/OrgStructureModel';
import { readMasterPositions, TOP_POSITION_ID } from '../models/PositionModel';

export function useOrgStructurePresenter() {
  const [structure, setStructure] = useState(() => readOrgStructure());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'Inactive'

  // Live Sync with master storage whenever window gains focus or storage changes
  useEffect(() => {
    function handleSync() {
      setStructure(readOrgStructure());
    }
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  // Department Modal State
  const [deptModal, setDeptModal] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    id: null,
    code: '',
    name: '',
    status: 'Active',
    reportsTo: 'Building Manager',
    description: '',
    error: ''
  });

  // Division Modal State
  const [divModal, setDivModal] = useState({
    isOpen: false,
    mode: 'add',
    id: null,
    departmentId: '',
    code: '',
    name: '',
    description: '',
    error: ''
  });

  // Position Modal State
  const [posModal, setPosModal] = useState({
    isOpen: false,
    mode: 'add',
    id: null,
    divisionId: '',
    name: '',
    superiorId: '',
    employeeCount: 0,
    status: 'Active',
    description: '',
    error: ''
  });

  // Root Authority Modal State (Building Manager / Highest Rank)
  const [rootModal, setRootModal] = useState({
    isOpen: false,
    title: '',
    name: '',
    error: ''
  });

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null, // 'department' | 'division' | 'position'
    item: null,
    warning: ''
  });

  // Persistence helper
  const updateStructure = useCallback((next) => {
    setStructure(next);
    persistOrgStructure(next);
  }, []);

  // Root Authority Actions
  const openEditRootModal = useCallback(() => {
    setRootModal({
      isOpen: true,
      title: structure.rootAuthority?.title || 'Building Manager',
      name: structure.rootAuthority?.name || 'Building Manager',
      error: ''
    });
  }, [structure.rootAuthority]);

  const closeRootModal = useCallback(() => {
    setRootModal((prev) => ({ ...prev, isOpen: false, error: '' }));
  }, []);

  const saveRootAuthority = useCallback(() => {
    if (!rootModal.title.trim()) {
      setRootModal((prev) => ({ ...prev, error: 'Authority title is required.' }));
      return false;
    }
    const updated = {
      ...structure,
      rootAuthority: {
        id: 'bm',
        title: rootModal.title.trim(),
        name: (rootModal.name.trim() || rootModal.title.trim())
      }
    };
    updateStructure(updated);
    closeRootModal();
    return true;
  }, [rootModal, structure, updateStructure, closeRootModal]);

  // Department Actions
  const openAddDeptModal = useCallback(() => {
    setDeptModal({
      isOpen: true,
      mode: 'add',
      id: null,
      code: getNextDepartmentDraftCode(structure.departments),
      name: '',
      status: 'Active',
      reportsTo: structure.rootAuthority?.title || 'Building Manager',
      description: '',
      error: ''
    });
  }, [structure.rootAuthority, structure.departments]);

  const openEditDeptModal = useCallback((dept) => {
    if (!dept) return;
    setDeptModal({
      isOpen: true,
      mode: 'edit',
      id: dept.id,
      code: dept.code,
      name: dept.name,
      status: dept.status || 'Active',
      reportsTo: dept.reportsTo || structure.rootAuthority?.title || 'Building Manager',
      description: dept.description || '',
      error: ''
    });
  }, [structure.rootAuthority]);

  const closeDeptModal = useCallback(() => {
    setDeptModal((prev) => ({ ...prev, isOpen: false, error: '' }));
  }, []);

  const saveDepartment = useCallback(() => {
    const assignedCode = deptModal.code && deptModal.code.trim()
      ? deptModal.code.trim().toUpperCase()
      : getNextDepartmentDraftCode(structure.departments);

    const draft = {
      id: deptModal.id,
      code: assignedCode,
      name: deptModal.name.trim(),
      status: deptModal.status,
      reportsTo: deptModal.reportsTo || structure.rootAuthority?.title || 'Building Manager',
      description: deptModal.description.trim()
    };

    const err = validateDepartmentDraft(draft, structure.departments);
    if (err) {
      setDeptModal((prev) => ({ ...prev, error: err }));
      return false;
    }

    let nextDepts;
    if (deptModal.mode === 'add') {
      const newDept = {
        ...draft,
        id: `dept-${Date.now()}`
      };
      nextDepts = [...structure.departments, newDept];
    } else {
      nextDepts = structure.departments.map((d) => (d.id === draft.id ? { ...d, ...draft } : d));
    }

    updateStructure({
      ...structure,
      departments: nextDepts
    });
    closeDeptModal();
    return true;
  }, [deptModal, structure, updateStructure, closeDeptModal]);

  // Division Actions
  const openAddDivModal = useCallback((departmentId) => {
    setDivModal({
      isOpen: true,
      mode: 'add',
      id: null,
      departmentId: departmentId || structure.departments[0]?.id || '',
      code: getNextDivisionDraftCode(structure.divisions),
      name: '',
      description: '',
      error: ''
    });
  }, [structure.departments, structure.divisions]);

  const openEditDivModal = useCallback((div) => {
    if (!div) return;
    setDivModal({
      isOpen: true,
      mode: 'edit',
      id: div.id,
      departmentId: div.departmentId,
      code: div.code,
      name: div.name,
      description: div.description || '',
      error: ''
    });
  }, []);

  const closeDivModal = useCallback(() => {
    setDivModal((prev) => ({ ...prev, isOpen: false, error: '' }));
  }, []);

  const saveDivision = useCallback(() => {
    const assignedCode = divModal.code && divModal.code.trim()
      ? divModal.code.trim().toUpperCase()
      : getNextDivisionDraftCode(structure.divisions);

    const draft = {
      id: divModal.id,
      departmentId: divModal.departmentId,
      code: assignedCode,
      name: divModal.name.trim(),
      description: divModal.description.trim()
    };

    const err = validateDivisionDraft(draft, structure.divisions);
    if (err) {
      setDivModal((prev) => ({ ...prev, error: err }));
      return false;
    }

    let nextDivs;
    if (divModal.mode === 'add') {
      const newDiv = {
        ...draft,
        id: `div-${Date.now()}`
      };
      nextDivs = [...structure.divisions, newDiv];
    } else {
      nextDivs = structure.divisions.map((d) => (d.id === draft.id ? { ...d, ...draft } : d));
    }

    updateStructure({
      ...structure,
      divisions: nextDivs
    });
    closeDivModal();
    return true;
  }, [divModal, structure, updateStructure, closeDivModal]);

  const [masterPositions, setMasterPositions] = useState(() =>
    readMasterPositions().filter((p) => p.id !== TOP_POSITION_ID && p.code !== '001')
  );

  const refreshMasterPositions = useCallback(() => {
    setMasterPositions(
      readMasterPositions().filter((p) => p.id !== TOP_POSITION_ID && p.code !== '001')
    );
  }, []);

  // Position Actions
  const openAddPosModal = useCallback((divisionId, superiorId) => {
    refreshMasterPositions();
    setPosModal({
      isOpen: true,
      mode: 'add',
      id: null,
      divisionId: divisionId || structure.divisions[0]?.id || '',
      name: '',
      superiorId: superiorId !== undefined ? superiorId : (structure.positions[0]?.id || 'bm'),
      employeeCount: 0,
      status: 'Active',
      description: '',
      error: ''
    });
  }, [structure.divisions, structure.positions, refreshMasterPositions]);

  const openEditPosModal = useCallback((pos) => {
    if (!pos) return;
    refreshMasterPositions();
    const posName = pos.name || '';
    const matchedMaster = masterPositions.find(
      (mp) =>
        posName &&
        (posName.toLowerCase() === mp.name.toLowerCase() ||
          posName.toLowerCase().startsWith(mp.name.toLowerCase()))
    );

    setPosModal({
      isOpen: true,
      mode: 'edit',
      id: pos.id,
      divisionId: pos.divisionId,
      name: matchedMaster ? matchedMaster.name : posName,
      superiorId: pos.superiorId || 'bm',
      employeeCount: pos.employeeCount || 0,
      status: pos.status || 'Active',
      description: pos.description || '',
      error: ''
    });
  }, [masterPositions, refreshMasterPositions]);

  const closePosModal = useCallback(() => {
    setPosModal((prev) => ({ ...prev, isOpen: false, error: '' }));
  }, []);

  const savePosition = useCallback(() => {
    const isEdit = posModal.mode === 'edit' && Boolean(posModal.id);
    const positionId = isEdit
      ? posModal.id
      : `pos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const matched = masterPositions.find(
      (mp) => mp.name.toLowerCase() === posModal.name.trim().toLowerCase()
    );

    const positionCode = posModal.code || matched?.code || '';

    const targetDiv = structure.divisions.find((d) => d.id === posModal.divisionId);
    const formattedName = formatPositionNameWithDivision(
      posModal.name,
      targetDiv?.name
    );

    const draft = {
      id: positionId,
      divisionId: posModal.divisionId,
      name: formattedName,
      code: positionCode,
      superiorId: posModal.superiorId || 'bm',
      employeeCount: Number(posModal.employeeCount) || 0,
      status: posModal.status || 'Active',
      description: (posModal.description || '').trim()
    };

    const err = validatePositionDraft(draft, structure.positions);
    if (err) {
      setPosModal((prev) => ({ ...prev, error: err }));
      return false;
    }

    let nextPositions;
    const exists = structure.positions.some((p) => p.id === draft.id);
    if (exists) {
      nextPositions = structure.positions.map((p) =>
        p.id === draft.id ? { ...p, ...draft } : p
      );
    } else {
      nextPositions = [...structure.positions, draft];
    }

    updateStructure({
      ...structure,
      positions: nextPositions
    });
    closePosModal();
    return true;
  }, [posModal, masterPositions, structure, updateStructure, closePosModal]);

  // Delete Actions
  const openDeleteModal = useCallback((type, item) => {
    if (!type || !item) return;
    let warning = '';
    if (type === 'department') {
      const relatedDivs = structure.divisions.filter((d) => d.departmentId === item.id);
      if (relatedDivs.length > 0) {
        warning = `Deleting this department will also remove ${relatedDivs.length} division(s) and their associated position(s).`;
      }
    } else if (type === 'division') {
      const relatedPos = structure.positions.filter((p) => p.divisionId === item.id);
      if (relatedPos.length > 0) {
        warning = `Deleting this division will also remove ${relatedPos.length} position(s).`;
      }
    } else if (type === 'position') {
      const subs = getDirectSubordinates(structure.positions, item.id);
      if (subs.length > 0) {
        warning = `${subs.length} position(s) report directly to this role. Deleting it will reassign their direct superior to ${structure.rootAuthority?.title || 'Building Manager'}.`;
      }
    }
    setDeleteModal({
      isOpen: true,
      type,
      item,
      warning
    });
  }, [structure]);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ isOpen: false, type: null, item: null, warning: '' });
  }, []);

  const confirmDelete = useCallback(() => {
    const { type, item } = deleteModal;
    if (!type || !item) return;

    if (type === 'department') {
      const divIdsToRemove = new Set(
        structure.divisions.filter((d) => d.departmentId === item.id).map((d) => d.id)
      );
      const nextDepts = structure.departments.filter((d) => d.id !== item.id);
      const nextDivs = structure.divisions.filter((d) => d.departmentId !== item.id);
      const nextPositions = structure.positions.filter((p) => !divIdsToRemove.has(p.divisionId));
      updateStructure({
        ...structure,
        departments: nextDepts,
        divisions: nextDivs,
        positions: nextPositions
      });
    } else if (type === 'division') {
      const nextDivs = structure.divisions.filter((d) => d.id !== item.id);
      const nextPositions = structure.positions.filter((p) => p.divisionId !== item.id);
      updateStructure({
        ...structure,
        divisions: nextDivs,
        positions: nextPositions
      });
    } else if (type === 'position') {
      const nextPositions = structure.positions
        .filter((p) => p.id !== item.id)
        .map((p) => (p.superiorId === item.id ? { ...p, superiorId: 'bm' } : p));
      updateStructure({
        ...structure,
        positions: nextPositions
      });
    }
    closeDeleteModal();
  }, [deleteModal, structure, updateStructure, closeDeleteModal]);

  // Reporting and hierarchy lookup helpers
  const getPositionSuperiorLabel = useCallback(
    (superiorId) => {
      if (!superiorId || superiorId === 'bm') {
        return structure.rootAuthority?.title || 'Building Manager';
      }
      const sup = structure.positions.find((p) => p.id === superiorId);
      return sup ? sup.name : 'No superior';
    },
    [structure.rootAuthority, structure.positions]
  );

  const getSubordinatesList = useCallback(
    (positionId) => {
      const subs = getDirectSubordinates(structure.positions, positionId);
      return subs.map((sub) => {
        const div = structure.divisions.find((d) => d.id === sub.divisionId);
        return {
          id: sub.id,
          name: sub.name,
          divisionName: div ? div.name : ''
        };
      });
    },
    [structure.positions, structure.divisions]
  );

  // Filtered tree presentation keeping context
  const filteredTree = useMemo(() => {
    let depts = structure.departments;
    if (statusFilter !== 'all') {
      depts = depts.filter((d) => (d.status || 'Active') === statusFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return depts.map((dept) => {
        const deptDivs = structure.divisions.filter((d) => d.departmentId === dept.id);
        const deptDivsWithPositions = deptDivs.map((div) => {
          let divPositions = structure.positions.filter((p) => p.divisionId === div.id);
          if (statusFilter !== 'all') {
            divPositions = divPositions.filter((p) => (p.status || 'Active') === statusFilter);
          }
          return { ...div, positions: divPositions };
        });
        const totalPos = deptDivsWithPositions.reduce(
          (sum, d) => sum + d.positions.length,
          0
        );
        return {
          ...dept,
          divisions: deptDivsWithPositions,
          totalPositions: totalPos
        };
      });
    }

    // Filter matching while keeping reporting context
    return depts
      .map((dept) => {
        const deptMatches =
          dept.name.toLowerCase().includes(q) ||
          dept.code.toLowerCase().includes(q) ||
          (dept.reportsTo && dept.reportsTo.toLowerCase().includes(q));

        const deptDivs = structure.divisions.filter((d) => d.departmentId === dept.id);
        const filteredDivs = deptDivs
          .map((div) => {
            const divMatches =
              div.name.toLowerCase().includes(q) || div.code.toLowerCase().includes(q);

            let divPositions = structure.positions.filter((p) => p.divisionId === div.id);
            if (statusFilter !== 'all') {
              divPositions = divPositions.filter((p) => (p.status || 'Active') === statusFilter);
            }
            const matchedPositions = divPositions.filter((pos) => {
              const supLabel = getPositionSuperiorLabel(pos.superiorId).toLowerCase();
              return (
                pos.name.toLowerCase().includes(q) ||
                (pos.description && pos.description.toLowerCase().includes(q)) ||
                supLabel.includes(q)
              );
            });

            // If division or department matches, keep positions visible; otherwise keep matching positions
            if (deptMatches || divMatches) {
              return { ...div, positions: divPositions };
            }
            if (matchedPositions.length > 0) {
              return { ...div, positions: matchedPositions };
            }
            return null;
          })
          .filter(Boolean);

        if (deptMatches || filteredDivs.length > 0) {
          const totalPos = filteredDivs.reduce((sum, d) => sum + d.positions.length, 0);
          return {
            ...dept,
            divisions: filteredDivs,
            totalPositions: totalPos
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [searchQuery, statusFilter, structure, getPositionSuperiorLabel]);

  // Positions not assigned to any existing division (e.g. created in master Jabatan)
  const unassignedPositions = useMemo(() => {
    if (structure.departments.length === 0) return [];
    const list = structure.positions.filter((p) => {
      return !p.divisionId || !structure.divisions.some((d) => d.id === p.divisionId);
    });
    if (statusFilter !== 'all') {
      return list.filter((p) => (p.status || 'Active') === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const supLabel = getPositionSuperiorLabel(p.superiorId).toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        supLabel.includes(q)
      );
    });
  }, [structure.departments, structure.positions, structure.divisions, statusFilter, searchQuery, getPositionSuperiorLabel]);

  // Overall counts
  const totalDepartments = structure.departments.length;
  const totalDivisions = structure.divisions.length;
  const totalPositions = structure.positions.length;

  // Quick actions
  const loadSampleTemplate = useCallback(() => {
    updateStructure(SAMPLE_ORG_STRUCTURE);
  }, [updateStructure]);

  const clearToEmpty = useCallback(() => {
    updateStructure(EMPTY_ORG_STRUCTURE);
  }, [updateStructure]);

  return {
    structure,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredTree,
    unassignedPositions,
    totalDepartments,
    totalDivisions,
    totalPositions,

    // Template / Reset
    loadSampleTemplate,
    clearToEmpty,

    // Root authority
    rootModal,
    setRootModal,
    openEditRootModal,
    closeRootModal,
    saveRootAuthority,

    // Department actions
    deptModal,
    setDeptModal,
    openAddDeptModal,
    openEditDeptModal,
    closeDeptModal,
    saveDepartment,

    // Division actions
    divModal,
    setDivModal,
    openAddDivModal,
    openEditDivModal,
    closeDivModal,
    saveDivision,

    // Position actions
    posModal,
    setPosModal,
    openAddPosModal,
    openEditPosModal,
    closePosModal,
    savePosition,
    masterPositions,

    // Delete actions
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,

    // Helpers
    getPositionSuperiorLabel,
    getSubordinatesList
  };
}
