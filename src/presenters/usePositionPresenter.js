import { useState } from 'react';
import { INITIAL_POSITIONS, POSITION_STORAGE_KEY, TOP_POSITION_ID, descendants, getParentIds, isValidPositionData, normalizePositionHierarchy, validatePosition, validatePositionRemoval } from '../models/PositionModel';

function readPositions() {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (raw === null) return { positions: INITIAL_POSITIONS, isExample: true, loadError: '' };
    const saved = JSON.parse(raw);
    if (!saved || typeof saved.isExample !== 'boolean') throw new Error('Invalid positions');
    return { ...saved, positions: normalizePositionHierarchy(saved.positions), loadError: '' };
  } catch {
    return { positions: [], isExample: false, loadError: 'Could not load positions. Check browser storage permissions and try again. Your saved data has not been overwritten.' };
  }
}

export function usePositionPresenter() {
  const [data, setData] = useState(readPositions);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [successModal, setSuccessModal] = useState(null);

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
    ...data, query, setQuery, dialog, error, notice, setNotice,
    successModal,
    closeSuccessModal() { setSuccessModal(null); },
    filtered: data.positions.filter((item) => item.name.toLocaleLowerCase('id').includes(query.trim().toLocaleLowerCase('id'))),
    open(kind, position) {
      if (position?.id === TOP_POSITION_ID && kind !== 'hierarchy' && kind !== 'edit') return;
      if (kind === 'relationship') {
        const excluded = descendants(data.positions, position?.id);
        const candidates = data.positions.filter((item) => item.id !== position?.id && !excluded.has(item.id));
        if (candidates.length <= 1) return;
      }
      setError(''); setDialog({ kind, position });
    },
    close() { setDialog(null); setError(''); },
    retry() { setData(readPositions()); },
    save(draft, isRelationship = false) {
      const pIds = draft.id === TOP_POSITION_ID ? [] : getParentIds(draft);
      const normalizedDraft = { ...draft, parentIds: pIds };
      const validation = validatePosition(normalizedDraft, data.positions);
      if (validation) { setError(validation); return; }
      const exists = data.positions.some((item) => item.id === draft.id);
      const item = { ...normalizedDraft, id: draft.id || crypto.randomUUID(), name: draft.name.trim() };
      const next = exists ? data.positions.map((row) => row.id === item.id ? item : row) : [...data.positions, item];
      if (persist(next, `Position ${item.name} saved.`)) {
        setDialog(null);
        if (isRelationship) {
          setSuccessModal({
            title: 'Superiors Updated Successfully!',
            subtext: `Direct reporting lines for "${item.name}" have been saved.`
          });
        } else if (exists) {
          setSuccessModal({
            title: 'Position Updated Successfully!',
            subtext: `Position "${item.name}" settings have been saved.`
          });
        } else {
          setSuccessModal({
            title: 'Position Created Successfully!',
            subtext: `Position "${item.name}" has been added to the organization.`
          });
        }
      }
    },
    remove(position) {
      const validation = validatePositionRemoval(position, data.positions);
      if (validation) { setError(validation); return; }
      if (persist(data.positions.filter((item) => item.id !== position.id), `Position ${position.name} deleted.`)) {
        setDialog(null);
        setSuccessModal({
          title: 'Position Deleted Successfully!',
          subtext: `Position "${position.name}" has been removed from the hierarchy.`
        });
      }
    },
  };
}
