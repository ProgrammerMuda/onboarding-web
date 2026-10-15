import { useState, useCallback, useEffect } from 'react';
import { INITIAL_POSITIONS, POSITION_STORAGE_KEY, TOP_POSITION_ID, getNextPositionCode, getParentIds, isValidPositionData, normalizePositionHierarchy, validatePosition } from '../models/PositionModel';
import { getResolvedDepartments, getResolvedDivisions } from '../models/EmployeeModel';

function readPositions() {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY) || localStorage.getItem('proapps.hr.positions.v10');
    let positionsToNormalize = INITIAL_POSITIONS;
    let isExample = true;

    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.positions) && saved.positions.length > 0) {
        isExample = typeof saved.isExample === 'boolean' ? saved.isExample : false;
        const existingNames = new Set(
          saved.positions.map((p) => (p?.name || '').trim().toLowerCase()).filter(Boolean)
        );
        const missingDefaults = INITIAL_POSITIONS.filter(
          (dp) => !existingNames.has(dp.name.trim().toLowerCase())
        );
        positionsToNormalize = [...saved.positions, ...missingDefaults];
      }
    }

    const defaultPosMap = new Map(INITIAL_POSITIONS.map((p) => [p.id, p]));

    const normalized = normalizePositionHierarchy(positionsToNormalize);
    
    const usedCodes = new Set(['001']);
    let maxNum = 1;
    const positionsWithCode = normalized.map((p) => {
      const defaultEntry = defaultPosMap.get(p.id);
      let deptId = p.departmentId || defaultEntry?.departmentId || '';
      let divId = p.divisionId || defaultEntry?.divisionId || '';

      // Infer if missing
      if (!divId) {
        const lowerName = (p.name || '').toLowerCase();
        if (lowerName.includes('security') || lowerName.includes('danru')) {
          deptId = deptId || 'dept-bs';
          divId = 'div-sec';
        } else if (lowerName.includes('mep') || lowerName.includes('engineering')) {
          deptId = deptId || 'dept-eng';
          divId = 'div-eng';
        } else if (lowerName.includes('house keeping') || lowerName.includes('cleaning')) {
          deptId = deptId || 'dept-bs';
          divId = 'div-hk';
        } else if (lowerName.includes('finance') || lowerName.includes('accounting')) {
          deptId = deptId || 'dept-fin';
          divId = 'div-fin';
        } else if (lowerName.includes('tenant')) {
          deptId = deptId || 'dept-tr';
          divId = 'div-tr';
        } else if (lowerName.includes('building manager') || lowerName.includes('general operation')) {
          deptId = deptId || 'dept-bm';
          divId = 'div-bm';
        }
      }

      if (p.id === TOP_POSITION_ID) {
        return { ...p, code: '001', departmentId: deptId || 'dept-bm', divisionId: divId || 'div-bm' };
      }
      let c = p.code;
      if (!c || c === '001' || usedCodes.has(c)) {
        maxNum += 1;
        c = String(maxNum).padStart(3, '0');
        while (usedCodes.has(c)) {
          maxNum += 1;
          c = String(maxNum).padStart(3, '0');
        }
      } else {
        const val = parseInt(c, 10);
        if (!isNaN(val) && val > maxNum) maxNum = val;
      }
      usedCodes.add(c);
      return { ...p, code: c, departmentId: deptId, divisionId: divId };
    });

    return { positions: positionsWithCode, isExample, loadError: '' };
  } catch {
    return { positions: INITIAL_POSITIONS, isExample: false, loadError: '' };
  }
}

export function usePositionPresenter() {
  const [data, setData] = useState(readPositions);
  const [departments, setDepartments] = useState(getResolvedDepartments);
  const [divisions, setDivisions] = useState(getResolvedDivisions);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [successModal, setSuccessModal] = useState(null);

  const refreshDepsAndDivs = useCallback(() => {
    setDepartments(getResolvedDepartments());
    setDivisions(getResolvedDivisions());
  }, []);

  useEffect(() => {
    refreshDepsAndDivs();
  }, [refreshDepsAndDivs]);

  function persist(positions, message) {
    if (data.loadError) return false;
    if (!isValidPositionData(positions)) { setError('Invalid hierarchy. There must be exactly one top position.'); return false; }
    try {
      const next = { positions, isExample: data.isExample };
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(next));
      setData({ ...next, loadError: '' });
      setNotice(message);
      setError('');
      return true;
    } catch {
      setError('Changes could not be saved. Check browser storage permissions or available space, then try again.');
      return false;
    }
  }

  return {
    ...data,
    departments,
    divisions,
    query,
    setQuery,
    dialog,
    error,
    notice,
    setNotice,
    successModal,
    closeSuccessModal() { setSuccessModal(null); },
    filtered: data.positions.filter((item) => {
      const q = query.trim().toLocaleLowerCase('id');
      if (!q) return true;
      const dept = departments.find((d) => d.id === item.departmentId);
      const div = divisions.find((d) => d.id === item.divisionId);
      return (
        item.name.toLocaleLowerCase('id').includes(q) ||
        (item.code && item.code.toLocaleLowerCase('id').includes(q)) ||
        (dept && dept.name.toLocaleLowerCase('id').includes(q)) ||
        (div && div.name.toLocaleLowerCase('id').includes(q))
      );
    }),
    open(kind, position) {
      if (position?.id === TOP_POSITION_ID && kind === 'delete') return;
      refreshDepsAndDivs();
      setError('');
      setDialog({ kind, position });
    },
    close() { setDialog(null); setError(''); },
    retry() { setData(readPositions()); },
    save(draft) {
      const isTop = draft.id === TOP_POSITION_ID;
      const pIds = isTop ? [] : (draft.parentIds?.length ? draft.parentIds : [TOP_POSITION_ID]);
      const code = isTop
        ? '001'
        : (draft.code && draft.code !== '001' ? draft.code : getNextPositionCode(data.positions));
      const normalizedDraft = { ...draft, code, parentIds: pIds };
      const validation = validatePosition(normalizedDraft, data.positions);
      if (validation) { setError(validation); return; }
      const exists = data.positions.some((item) => item.id === draft.id);
      const item = {
        ...normalizedDraft,
        id: draft.id || crypto.randomUUID(),
        name: draft.name.trim(),
        departmentId: draft.departmentId || '',
        divisionId: draft.divisionId || ''
      };
      const next = exists ? data.positions.map((row) => row.id === item.id ? item : row) : [...data.positions, item];
      if (persist(next, `Position ${item.name} saved.`)) {
        setDialog(null);
        if (exists) {
          setSuccessModal({
            title: 'Position Updated Successfully!',
            subtext: `Position "${item.name}" settings have been saved.`
          });
        } else {
          setSuccessModal({
            title: 'Position Created Successfully!',
            subtext: `Position "${item.name}" has been added.`
          });
        }
      }
    },
    remove(position) {
      if (position.id === TOP_POSITION_ID) {
        setError('The top position cannot be deleted.');
        return;
      }
      const next = data.positions
        .filter((item) => item.id !== position.id)
        .map((item) => {
          const pIds = getParentIds(item);
          if (pIds.includes(position.id)) {
            const filteredPIds = pIds.filter((p) => p !== position.id);
            return {
              ...item,
              parentIds: filteredPIds.length > 0 ? filteredPIds : [TOP_POSITION_ID]
            };
          }
          return item;
        });
      if (persist(next, `Position ${position.name} deleted.`)) {
        setDialog(null);
        setSuccessModal({
          title: 'Position Deleted Successfully!',
          subtext: `Position "${position.name}" has been removed.`
        });
      }
    },
  };
}
