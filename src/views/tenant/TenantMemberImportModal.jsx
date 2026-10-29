import React, { useState } from 'react';
import { ImportModal } from '../components/ImportModal';
import { downloadTenantMemberImportTemplate } from '../../utils/excelExport';

const KINDS = {
  renter: {
    label: 'Renter',
    desc: 'Excel template (.xlsx) for Renter: Unit, Renter Data, and Rent & Access.'
  },
  member: {
    label: 'Member',
    desc: 'Excel template (.xlsx) for Member: Unit & Relation, Member Data, and Access.'
  }
};

// Import Tenant Member: what is imported (renter or member) picks which template the file must follow.
export function TenantMemberImportModal({ initialKind, prepare, onImport, onDownloadTemplate, onClose }) {
  const [kind, setKind] = useState(initialKind);
  const { label, desc } = KINDS[kind];
  const noun = kind === 'renter' ? 'renters' : 'members';

  return (
    <ImportModal
      title="Import Tenant Members"
      subtitle="Upload a filled Renter or Member template. Imported people are saved as Pending until approved."
      templateDesc={desc}
      onDownloadTemplate={() => onDownloadTemplate(() => downloadTenantMemberImportTemplate(kind))}
      parse={(file) => prepare(file, kind)}
      onImport={onImport}
      onClose={onClose}
      noun={noun}
      confirmLabel={(n) => (n ? `Import ${n} ${n === 1 ? noun.slice(0, -1) : noun}` : `Import ${label}s`)}
      resetKey={kind}
    >
      <div className="imp-type">
        <label htmlFor="tm-import-kind">Import for <span className="text-danger">*</span></label>
        <select
          id="tm-import-kind"
          className="form-select add-emp-input"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          aria-describedby="tm-import-kind-hint"
        >
          <option value="renter">Renter</option>
          <option value="member">Member (family or staff)</option>
        </select>
        <small id="tm-import-kind-hint" className="text-muted">Upload the {label} template. Changing this removes the attached file.</small>
      </div>
    </ImportModal>
  );
}

export default TenantMemberImportModal;
