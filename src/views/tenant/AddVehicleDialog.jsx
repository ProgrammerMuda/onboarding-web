import React, { useEffect, useRef, useState } from 'react';
import { Car, Plus } from '@phosphor-icons/react';

export const VEHICLE_TYPES = ['Car', 'Motorcycle'];

const EMPTY_VEHICLE = { plate: '', type: 'Car', brand: '', color: '', slot: '', rfid: '' };

const FIELDS = [
  { key: 'brand', label: 'Brand & model', placeholder: 'e.g. Toyota Avanza' },
  { key: 'color', label: 'Color', placeholder: 'e.g. Silver' },
  { key: 'slot', label: 'Parking slot', placeholder: 'e.g. B1-024' },
  { key: 'rfid', label: 'RFID', placeholder: 'e.g. RF-90120' }
];

// Registers a vehicle to the tenant. Only the plate is required; the plate must be new for this tenant.
export function AddVehicleDialog({ tenantName, existingPlates, onSave, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_VEHICLE);
  const plateRef = useRef(null);
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    plateRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const plate = draft.plate.trim().toUpperCase().replace(/\s+/g, ' ');
  const duplicate = plate && existingPlates.some((p) => p.toUpperCase() === plate);

  const submit = (e) => {
    e.preventDefault();
    if (!plate || duplicate) return;
    onSave({
      ...draft,
      plate,
      brand: draft.brand.trim() || '-',
      color: draft.color.trim() || '-',
      slot: draft.slot.trim().toUpperCase() || '-',
      rfid: draft.rfid.trim().toUpperCase() || '-'
    });
  };

  return (
    <div className="emp-modal-backdrop" onClick={onCancel}>
      <form
        className="emp-modal-card tm-decide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tnm-vehicle-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="tm-decide__head">
          <span className="tm-decide__icon is-approve"><Car size={24} weight="bold" /></span>
          <div>
            <h3 className="tm-decide__title" id="tnm-vehicle-title">Add vehicle</h3>
            <span className="tm-decide__sub">Register a vehicle to {tenantName}</span>
          </div>
        </div>

        <div className="tm-vehicle-grid">
          <div className="tm-decide__field">
            <label htmlFor="tnm-vehicle-plate">License plate <span className="req">*</span></label>
            <input
              id="tnm-vehicle-plate"
              ref={plateRef}
              type="text"
              className="form-control add-emp-input"
              placeholder="e.g. B 1234 XYZ"
              maxLength={12}
              value={draft.plate}
              onChange={(e) => set('plate', e.target.value)}
              aria-invalid={duplicate || undefined}
              aria-describedby={duplicate ? 'tnm-vehicle-plate-error' : undefined}
            />
            {duplicate && (
              <span id="tnm-vehicle-plate-error" className="tm-vehicle-error">This plate is already registered to this tenant.</span>
            )}
          </div>

          <div className="tm-decide__field">
            <label htmlFor="tnm-vehicle-type">Type <span className="req">*</span></label>
            <select
              id="tnm-vehicle-type"
              className="form-select add-emp-input"
              value={draft.type}
              onChange={(e) => set('type', e.target.value)}
            >
              {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="tm-decide__field">
              <label htmlFor={`tnm-vehicle-${key}`}>{label}</label>
              <input
                id={`tnm-vehicle-${key}`}
                type="text"
                className="form-control add-emp-input"
                placeholder={placeholder}
                value={draft[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="tm-decide__foot">
          <button type="button" className="emp-btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="emp-btn-primary" disabled={!plate || duplicate}>
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Add vehicle</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddVehicleDialog;
