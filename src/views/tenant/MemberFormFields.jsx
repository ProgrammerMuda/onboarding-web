import React, { useRef, useState } from 'react';
import {
  ID_TYPES,
  PHONE_MAX,
  digitsOnly,
  fieldErrors,
  supportingFileError
} from '../../models/TenantMemberModel';

// Label row (with an optional digit counter, like Add Employee), the control, then hint or error text.
export function Field({ id, label, required, hint, error, wide, quarter, counter, children }) {
  return (
    <div className={`${wide ? 'col-12' : quarter ? 'col-md-3' : 'col-md-6'} add-emp-field-col`}>
      <div className="add-emp-label-wrap">
        <label className="add-emp-label" htmlFor={id}>
          {label} {required && <span className="req">*</span>}
        </label>
        {counter && <span className="add-emp-digit-hint" aria-hidden="true">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p className="tm-error" id={`${id}-msg`}>{error}</p>
      ) : hint ? (
        <p className="tm-hint" id={`${id}-msg`}>{hint}</p>
      ) : null}
    </div>
  );
}

// Name, email, ID, phone, and supporting file. Used by the member wizard (step 2) and the tenant edit page.
// Format errors show as helper text once showErrors is on, and clear as each field is fixed.
export function IdentityFields({ draft: d, update, showErrors, renting, idPrefix = 'tm-add' }) {
  const shown = showErrors ? fieldErrors(d, renting) : {};
  const idRule = ID_TYPES[d.idType];
  const fileRef = useRef(null);
  const [fileError, setFileError] = useState('');
  const set = (key, clean = (v) => v) => (e) => update({ [key]: clean(e.target.value) });
  const fid = (key) => `${idPrefix}-${key}`;
  const describe = (key) => `${idPrefix}-${key}-msg`;

  // Only the name and size are kept; a refused file never reaches the draft.
  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const problem = supportingFileError(file);
    setFileError(problem);
    if (problem) {
      e.target.value = '';
      return;
    }
    update({ file: { name: file.name, size: file.size, type: file.type } });
  };

  const clearFile = () => {
    if (fileRef.current) fileRef.current.value = '';
    setFileError('');
    update({ file: null });
  };

  return (
    <div className="row g-4">
      <Field id={fid('name')} label="Name" required>
        <input id={fid('name')} className="form-control add-emp-input" value={d.name} onChange={set('name')} placeholder="Full name as on ID" autoFocus />
      </Field>
      <Field id={fid('email')} label="Email" required error={shown.email}>
        <input
          id={fid('email')}
          type="email"
          className={`form-control add-emp-input${shown.email ? ' is-invalid' : ''}`}
          value={d.email}
          onChange={set('email')}
          placeholder="e.g. siti.rahmawati@gmail.com"
          aria-invalid={shown.email ? true : undefined}
          aria-describedby={describe('email')}
        />
      </Field>

      <Field id={fid('idtype')} label="ID Type" required>
        <div className="unit-select-wrap tm-add-select">
          <select id={fid('idtype')} className="form-select add-emp-input" value={d.idType} onChange={set('idType')}>
            {Object.keys(ID_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </Field>
      <Field
        id={fid('idnumber')}
        label="ID Number"
        required
        error={shown.idNumber}
        counter={`${d.idNumber.length} / ${idRule.max} ${idRule.unit}`}
      >
        <input
          id={fid('idnumber')}
          className={`form-control add-emp-input font-monospace${shown.idNumber ? ' is-invalid' : ''}`}
          inputMode={d.idType === 'KTP' ? 'numeric' : 'text'}
          maxLength={idRule.max}
          value={d.idNumber}
          onChange={set('idNumber', idRule.clean)}
          placeholder={idRule.placeholder}
          aria-invalid={shown.idNumber ? true : undefined}
          aria-describedby={describe('idnumber')}
        />
      </Field>

      <Field id={fid('phone')} label="Phone Number" error={shown.phone} counter={`${d.phone.length} / ${PHONE_MAX} digits`}>
        <input
          id={fid('phone')}
          className={`form-control add-emp-input font-monospace${shown.phone ? ' is-invalid' : ''}`}
          inputMode="numeric"
          maxLength={PHONE_MAX}
          value={d.phone}
          onChange={set('phone', (v) => digitsOnly(v).slice(0, PHONE_MAX))}
          placeholder="e.g. 081234567890"
          aria-invalid={shown.phone ? true : undefined}
          aria-describedby={describe('phone')}
        />
      </Field>
      <Field id={fid('file')} label="Supporting File (PDF/Image)" error={fileError} hint="Max file size: 5MB">
        {/* The native picker forgets its file when the step remounts, so the field shows the draft's file name itself. */}
        <div className={`tm-file add-emp-input${fileError ? ' is-invalid' : ''}`}>
          <input
            ref={fileRef}
            id={fid('file')}
            type="file"
            accept="application/pdf,image/*"
            className="tm-file__native"
            onChange={onFile}
            aria-invalid={fileError ? true : undefined}
            aria-describedby={describe('file')}
          />
          <label htmlFor={fid('file')} className="tm-file__button">Choose File</label>
          <span className={`tm-file__name${d.file ? '' : ' is-empty'}`} title={d.file?.name}>
            {d.file ? `${d.file.name} (${(d.file.size / 1024 / 1024).toFixed(1)} MB)` : 'No file chosen'}
          </span>
          {d.file && (
            <button type="button" className="tm-file__remove" onClick={clearFile} aria-label={`Remove ${d.file.name}`}>
              Remove
            </button>
          )}
        </div>
      </Field>
    </div>
  );
}
