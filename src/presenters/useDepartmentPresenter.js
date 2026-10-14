import { useState, useMemo } from 'react';
import { 
  DEPARTMENT_STORAGE_KEY, 
  DEFAULT_DEPARTMENTS, 
  validateDepartment, 
  validateDepartmentRemoval,
  getNextDepartmentCode
} from '../models/DepartmentModel';
import { readDivisions, persistDivisions } from '../models/DivisionModel';

function readDepartments() {
  try {
    const raw = localStorage.getItem(DEPARTMENT_STORAGE_KEY);
    if (!raw) return DEFAULT_DEPARTMENTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_DEPARTMENTS;
  } catch {
    return DEFAULT_DEPARTMENTS;
  }
}

export function useDepartmentPresenter() {
  const [departments, setDepartments] = useState(readDepartments);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formError, setFormError] = useState('');
  const [successModal, setSuccessModal] = useState(null);

  const persist = (nextData) => {
    try {
      localStorage.setItem(DEPARTMENT_STORAGE_KEY, JSON.stringify(nextData));
      setDepartments(nextData);
      return true;
    } catch {
      setFormError('Failed to save to local storage.');
      return false;
    }
  };

  const departmentsWithDivisions = useMemo(() => {
    const liveDivisions = readDivisions();
    return departments.map((dept) => {
      const assigned = liveDivisions
        .filter((div) => div.departmentId === dept.id)
        .map((div) => div.name);
      return {
        ...dept,
        divisions: assigned.length > 0 ? assigned : (dept.divisions || [])
      };
    });
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departmentsWithDivisions;

    return departmentsWithDivisions.filter((dept) => {
      const matchCode = dept.code.toLowerCase().includes(q);
      const matchName = dept.name.toLowerCase().includes(q);
      const matchDesc = (dept.description || '').toLowerCase().includes(q);
      const matchDivisions = (dept.divisions || []).some((div) => div.toLowerCase().includes(q));

      return matchCode || matchName || matchDesc || matchDivisions;
    });
  }, [departmentsWithDivisions, query]);

  const stats = useMemo(() => {
    const totalDepartments = departments.length;
    const totalDivisions = departments.reduce(
      (acc, d) => acc + (Array.isArray(d.divisions) ? d.divisions.length : 0),
      0
    );
    const totalPositions = departments.reduce((acc, d) => acc + (d.positionCount || 0), 0);
    const totalEmployees = departments.reduce((acc, d) => acc + (d.employeeCount || 0), 0);

    return { totalDepartments, totalDivisions, totalPositions, totalEmployees };
  }, [departments]);

  const openDialog = (kind, department = null) => {
    setFormError('');
    setDialog({ kind, department });
  };

  const closeDialog = () => {
    setFormError('');
    setDialog(null);
  };

  const saveDepartment = (draft) => {
    const isEdit = Boolean(draft.id);
    const assignedCode = draft.code && draft.code.trim()
      ? draft.code.trim().toUpperCase()
      : getNextDepartmentCode(departments);

    const cleanDraft = {
      ...draft,
      code: assignedCode,
      name: draft.name.trim(),
      divisions: (draft.divisions || []).map((d) => d.trim()).filter(Boolean),
      description: (draft.description || '').trim()
    };

    const err = validateDepartment(cleanDraft, departments);
    if (err) {
      setFormError(err);
      return false;
    }

    let nextList;

    if (isEdit) {
      nextList = departments.map((d) => (d.id === cleanDraft.id ? { ...d, ...cleanDraft } : d));
    } else {
      const newDept = {
        ...cleanDraft,
        id: `dept-${cleanDraft.code.toLowerCase()}-${Date.now().toString(36)}`,
        positionCount: cleanDraft.positionCount || 0,
        employeeCount: cleanDraft.employeeCount || 0
      };
      nextList = [...departments, newDept];
    }

    if (persist(nextList)) {
      closeDialog();
      setSuccessModal({
        title: isEdit ? 'Department Updated' : 'Department Created',
        subtext: `Department "${cleanDraft.name}" (${cleanDraft.code}) has been saved successfully.`
      });
      return true;
    }
    return false;
  };

  const confirmDelete = (dept) => {
    const liveDivisions = readDivisions();
    const err = validateDepartmentRemoval(dept, liveDivisions);
    if (err) {
      setFormError(err);
      return;
    }
    setDeleteConfirm(dept);
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;
    const liveDivisions = readDivisions();
    const err = validateDepartmentRemoval(deleteConfirm, liveDivisions);
    if (err) {
      setFormError(err);
      return;
    }
    const nextList = departments.filter((d) => d.id !== deleteConfirm.id);
    if (persist(nextList)) {
      const removedName = deleteConfirm.name;
      // Unlink any divisions that were associated with this deleted department
      const liveDivisions = readDivisions();
      const updatedDivisions = liveDivisions.map((div) =>
        div.departmentId === deleteConfirm.id ? { ...div, departmentId: '' } : div
      );
      persistDivisions(updatedDivisions);

      setDeleteConfirm(null);
      setSuccessModal({
        title: 'Department Removed',
        subtext: `Department "${removedName}" has been successfully deleted.`
      });
    }
  };

  return {
    departments: departmentsWithDivisions,
    filteredDepartments,
    stats,
    query,
    setQuery,
    dialog,
    openDialog,
    closeDialog,
    deleteConfirm,
    setDeleteConfirm,
    confirmDelete,
    executeDelete,
    formError,
    setFormError,
    saveDepartment,
    getNextCode: () => getNextDepartmentCode(departments),
    successModal,
    closeSuccessModal: () => setSuccessModal(null)
  };
}
