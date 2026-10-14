import { useState, useMemo, useCallback } from 'react';
import { 
  readDivisions, 
  persistDivisions, 
  validateDivision,
  getNextDivisionCode
} from '../models/DivisionModel';
import { DEPARTMENT_STORAGE_KEY, DEFAULT_DEPARTMENTS } from '../models/DepartmentModel';

function readCurrentDepartments() {
  try {
    const raw = localStorage.getItem(DEPARTMENT_STORAGE_KEY);
    if (!raw) return DEFAULT_DEPARTMENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_DEPARTMENTS;
  } catch {
    return DEFAULT_DEPARTMENTS;
  }
}

export function useDivisionPresenter() {
  const [divisions, setDivisions] = useState(readDivisions);
  const [departments, setDepartments] = useState(readCurrentDepartments);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formError, setFormError] = useState('');
  const [successModal, setSuccessModal] = useState(null);

  // Refresh departments list whenever dialog opens to keep live sync
  const refreshDepartments = useCallback(() => {
    setDepartments(readCurrentDepartments());
  }, []);

  const persist = (nextData) => {
    const ok = persistDivisions(nextData);
    if (ok) {
      setDivisions(nextData);
      return true;
    }
    setFormError('Failed to save division to local storage.');
    return false;
  };

  const filteredDivisions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return divisions;

    return divisions.filter((div) => {
      const matchCode = div.code.toLowerCase().includes(q);
      const matchName = div.name.toLowerCase().includes(q);
      const matchDesc = (div.description || '').toLowerCase().includes(q);
      const deptObj = departments.find((d) => d.id === div.departmentId);
      const deptName = deptObj ? deptObj.name.toLowerCase() : (div.departmentName || '').toLowerCase();
      const matchDept = deptName.includes(q);

      return matchCode || matchName || matchDesc || matchDept;
    });
  }, [divisions, departments, query]);

  const openDialog = (kind, division = null) => {
    refreshDepartments();
    setFormError('');
    setDialog({ kind, division });
  };

  const closeDialog = () => {
    setFormError('');
    setDialog(null);
  };

  const saveDivision = (draft) => {
    const isEdit = dialog?.kind === 'edit';
    const assignedCode = draft.code && draft.code.trim()
      ? draft.code.trim().toUpperCase()
      : getNextDivisionCode(divisions);

    const cleanDraft = {
      ...draft,
      code: assignedCode,
      name: draft.name.trim(),
      departmentId: draft.departmentId || '',
      description: (draft.description || '').trim()
    };

    const error = validateDivision(cleanDraft, divisions);
    if (error) {
      setFormError(error);
      return false;
    }

    let nextDivisions;

    if (isEdit) {
      nextDivisions = divisions.map((div) =>
        div.id === cleanDraft.id ? { ...div, ...cleanDraft } : div
      );
    } else {
      const newDivision = {
        ...cleanDraft,
        id: `div-${Date.now()}`
      };
      nextDivisions = [newDivision, ...divisions];
    }

    const saved = persist(nextDivisions);
    if (saved) {
      closeDialog();
      setSuccessModal({
        title: isEdit ? 'Division Updated!' : 'Division Added!',
        subtext: `Division ${cleanDraft.name} (${cleanDraft.code}) has been saved successfully.`
      });
      return true;
    }
    return false;
  };

  const confirmDelete = (division) => {
    setDeleteConfirm(division);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;
    const target = deleteConfirm;
    const nextDivisions = divisions.filter((div) => div.id !== target.id);
    const saved = persist(nextDivisions);
    if (saved) {
      setDeleteConfirm(null);
      setSuccessModal({
        title: 'Division Deleted!',
        subtext: `Division ${target.name} (${target.code}) has been permanently deleted.`
      });
    }
  };

  return {
    divisions,
    departments,
    query,
    setQuery,
    filteredDivisions,
    dialog,
    openDialog,
    closeDialog,
    saveDivision,
    deleteConfirm,
    confirmDelete,
    cancelDelete,
    executeDelete,
    formError,
    getNextCode: () => getNextDivisionCode(divisions),
    successModal,
    setSuccessModal
  };
}
