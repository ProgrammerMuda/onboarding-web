import React, { useState } from 'react';
import { ImportModal } from '../components/ImportModal';
import { UNIT_CATEGORIES, getCategory } from '../../models/UnitModel';
import { downloadUnitImportTemplate } from '../../utils/excelExport';

const TEMPLATE_DESC = {
  hunian: 'Excel template (.xlsx) for Residential Unit: Unit Info, Unit Detail with NPP and bedrooms, and Billing.',
  non_hunian: 'Excel template (.xlsx) for Non-Residential Unit: Unit Info, Unit Detail with NPP, and Billing.',
  non_unit: 'Excel template (.xlsx) for Non-Unit: Unit Info, Unit Detail without NPP, and Billing.'
};

// Import Units: the unit type picks which template the file must follow.
export function UnitImportModal({ initialType, prepare, onImport, onClose }) {
  const [type, setType] = useState(initialType);
  const label = getCategory(type).label;

  return (
    <ImportModal
      title="Import Units"
      subtitle="Upload a filled Unit template to batch add units of one type."
      templateDesc={TEMPLATE_DESC[type]}
      onDownloadTemplate={() => downloadUnitImportTemplate(type)}
      parse={(file) => prepare(file, type)}
      onImport={onImport}
      onClose={onClose}
      noun="units"
      confirmLabel={(n) => (n ? `Import ${n} ${n === 1 ? 'unit' : 'units'}` : 'Import Units')}
      resetKey={type}
    >
      <div className="imp-type">
        <label htmlFor="unit-import-type">Unit type <span className="text-danger">*</span></label>
        <select
          id="unit-import-type"
          className="form-select add-emp-input"
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-describedby="unit-import-type-hint"
        >
          {UNIT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <small id="unit-import-type-hint" className="text-muted">Upload the {label} template. Changing the type removes the attached file.</small>
      </div>
    </ImportModal>
  );
}

export default UnitImportModal;
