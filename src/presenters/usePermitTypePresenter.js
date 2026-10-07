import { useState } from 'react';
import { INITIAL_PERMIT_TYPES, PERMIT_STORAGE_KEY, validatePermitType } from '../models/PermitTypeModel';

export function usePermitTypePresenter() {
  const [permits, setPermits] = useState(() => {
    let existing = INITIAL_PERMIT_TYPES;
    try {
      const raw = JSON.parse(localStorage.getItem(PERMIT_STORAGE_KEY));
      const saved = Array.isArray(raw) ? raw.map((item) => item && ({ 
        ...item, 
        allowedDates: item.allowedDates ?? 'both',
        isActive: item.isActive !== false
      })) : raw;
      if (Array.isArray(saved) && saved.every((item) => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.description === 'string' && typeof item.hasQuota === 'boolean' && !validatePermitType(item, []))) existing = saved;
      // Seed the demo examples once, preserving saved records and later updates.
      const seedKey = `${PERMIT_STORAGE_KEY}.demo-v2`;
      if (localStorage.getItem(seedKey)) return existing;
      const missing = INITIAL_PERMIT_TYPES.filter((sample) => !existing.some((item) =>
        item.id === sample.id || item.name.trim().toLowerCase() === sample.name.toLowerCase()));
      const seeded = [...existing, ...missing];
      localStorage.setItem(PERMIT_STORAGE_KEY, JSON.stringify(seeded));
      localStorage.setItem(seedKey, 'true');
      return seeded;
    } catch { /* Keep existing data when browser storage is unavailable. */ }
    return existing;
  });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [frequency, setFrequency] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draft, setDraft] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  function persist(next, message) {
    try {
      localStorage.setItem(PERMIT_STORAGE_KEY, JSON.stringify(next));
      setPermits(next);
      setPage(1);
      setNotification(message);
      setError('');
      return true;
    } catch {
      setError('Changes could not be saved. Browser storage is unavailable. Please try again.');
      return false;
    }
  }

  const filteredPermits = permits.filter((permit) => {
    const matchesQuery = `${permit.name} ${permit.description}`.toLocaleLowerCase('id').includes(query.trim().toLocaleLowerCase('id'));
    const matchesFrequency = frequency === 'all' || (frequency === 'unlimited' ? !permit.hasQuota : permit.hasQuota && permit.frequency === frequency);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? permit.isActive !== false : permit.isActive === false);
    return matchesQuery && matchesFrequency && matchesStatus;
  });

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredPermits.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  return {
    permits, query, frequency, statusFilter, draft, setDraft, statusTarget,
    setQuery(value) { setQuery(value); setPage(1); },
    setFrequency(value) { setFrequency(value); setPage(1); },
    setStatusFilter(value) { setStatusFilter(value); setPage(1); },
    error, notification, setNotification, filteredPermits,
    currentPage, totalPages, pageSize,
    setCurrentPage(value) {
      if (Number.isInteger(value)) setPage(Math.max(1, Math.min(value, totalPages)));
    },
    paginatedPermits: filteredPermits.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    openEditor(permit) {
      setError('');
      setDraft(permit ? { ...permit } : { name: '', description: '', hasQuota: true, quota: '', frequency: 'annual', allowedDates: 'both', isActive: true });
    },
    closeEditor() { setDraft(null); setError(''); },
    requestToggleStatus(permit) { setError(''); setStatusTarget(permit); },
    closeStatusModal() { setStatusTarget(null); setError(''); },
    confirmToggleStatus() {
      if (!statusTarget) return;
      const willBeActive = statusTarget.isActive === false;
      const next = permits.map((p) => p.id === statusTarget.id ? { ...p, isActive: willBeActive } : p);
      if (persist(next, `Permit type “${statusTarget.name}” is now ${willBeActive ? 'Active' : 'Deactivated'}.`)) {
        setStatusTarget(null);
      }
    },
    toggleStatusDirect(permit) {
      const willBeActive = permit.isActive === false;
      const next = permits.map((p) => p.id === permit.id ? { ...p, isActive: willBeActive } : p);
      persist(next, `Permit type “${permit.name}” is now ${willBeActive ? 'Active' : 'Deactivated'}.`);
    },
    save() {
      const validation = validatePermitType(draft, permits);
      if (validation) { setError(validation); return; }
      const item = { 
        ...draft, 
        id: draft.id || crypto.randomUUID(), 
        name: draft.name.trim(), 
        description: draft.description.trim(), 
        quota: draft.hasQuota ? Number(draft.quota) : null, 
        frequency: draft.hasQuota ? draft.frequency : null,
        isActive: draft.isActive !== false
      };
      const next = draft.id ? permits.map((permit) => permit.id === draft.id ? item : permit) : [...permits, item];
      if (persist(next, `Permit type “${item.name}” ${draft.id ? 'updated' : 'added'} successfully.`)) setDraft(null);
    },
  };
}

