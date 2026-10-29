import React, { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle, FileArrowDown, FileArrowUp, FileXls, Plus, Trash, UploadSimple, Warning, X } from '@phosphor-icons/react';
import '../employee/employee.css';
import '../employee/add-employee.css';
import './import-modal.css';

const ERRORS_SHOWN = 8;

/**
 * The Import Employees modal, shared: template banner, dropzone, the attached file, then what the file holds.
 * `parse(file)` resolves to { ready, errors, payload }: ready rows, row problems ({ rowNumber, message }),
 * and whatever `onImport(payload)` needs. It rejects with a readable message when the file cannot be used.
 * `resetKey` clears the attached file when it changes (for example when the unit type changes).
 */
export function ImportModal({
  title, subtitle, templateDesc, onDownloadTemplate, parse, onImport, onClose,
  noun, confirmLabel, children, resetKey
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const clear = () => {
    setFile(null);
    setResult(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  useEffect(clear, [resetKey]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pick = async (picked) => {
    if (!picked) return;
    setFile(picked);
    setResult(null);
    setError('');
    setReading(true);
    try {
      setResult(await parse(picked));
    } catch (err) {
      setError(err.message || 'The file could not be read.');
    } finally {
      setReading(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await onDownloadTemplate();
    } finally {
      setDownloading(false);
    }
  };

  const browse = () => inputRef.current?.click();
  const ready = result?.ready ?? 0;
  const problems = result?.errors ?? [];

  let meta = 'Reading the file…';
  if (!reading && error) meta = 'Could not be read';
  else if (!reading && result) meta = `${ready} ${noun} ready${problems.length ? ` · ${problems.length} with problems` : ''}`;

  return (
    <div className="emp-modal-backdrop" onClick={onClose}>
      <div
        className="emp-modal-card emp-import-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${inputId}-title`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '860px' }}
      >
        <div className="emp-modal-header emp-import-modal-header">
          <div className="emp-import-modal-header-left">
            <div className="emp-import-modal-icon-badge" aria-hidden="true">
              <FileArrowUp size={22} weight="bold" />
            </div>
            <div className="emp-import-modal-title-group">
              <h3 className="emp-modal-title emp-import-modal-title" id={`${inputId}-title`}>{title}</h3>
              <p className="emp-modal-subtitle emp-import-modal-subtitle">{subtitle}</p>
            </div>
          </div>
          <button type="button" className="emp-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="emp-modal-body">
          {children}

          <div className="emp-import-template-banner">
            <div className="emp-import-template-left">
              <div className="emp-import-template-icon-wrap">
                <FileArrowDown size={22} weight="bold" />
              </div>
              <div className="emp-import-template-info">
                <div className="emp-import-template-title-row">
                  <span className="emp-import-template-title">Official Import Template</span>
                  <span className="emp-import-template-pill">.xlsx format</span>
                </div>
                <div className="emp-import-template-desc">{templateDesc}</div>
              </div>
            </div>
            <button type="button" className="emp-import-template-btn" onClick={download} disabled={downloading}>
              <FileArrowDown size={16} weight="bold" />
              <span>{downloading ? 'Downloading...' : 'Download Template (.xlsx)'}</span>
            </button>
          </div>

          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            className="d-none"
            onChange={(e) => pick(e.target.files?.[0])}
          />

          <div
            className={`add-emp-unified-dropzone ${dragging ? 'is-dragging' : ''}`}
            onClick={browse}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload the filled template"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); browse(); } }}
          >
            <div className="dropzone-icon-box">
              <UploadSimple size={26} weight="bold" />
            </div>
            <span className="add-emp-dropzone-headline">Click or drag &amp; drop files here to upload</span>
            <span className="add-emp-dropzone-sub">Upload the completed template (.xlsx or .csv) up to 10MB.</span>
            <button
              type="button"
              className="btn add-emp-dropzone-browse-btn"
              onClick={(e) => { e.stopPropagation(); browse(); }}
            >
              <Plus size={14} weight="bold" />
              <span>Browse Documents</span>
            </button>
          </div>

          {file && (
            <div className="add-emp-doc-files-wrap" style={{ marginTop: '16px' }}>
              <div className="add-emp-doc-files-header">
                <span>Attached File (1)</span>
                <button
                  type="button"
                  className="btn btn-link text-primary p-0 text-decoration-none fw-semibold"
                  style={{ fontSize: '12px' }}
                  onClick={browse}
                >
                  Change file
                </button>
              </div>
              <div className="add-emp-doc-file-card">
                <div className="add-emp-doc-file-left">
                  <div className="add-emp-doc-file-icon" style={{ backgroundColor: '#eaf8ff', color: '#002B7F', borderColor: '#bfdbfe' }}>
                    <FileXls size={20} weight="duotone" />
                  </div>
                  <div className="add-emp-doc-file-info">
                    <span className="add-emp-doc-file-name" title={file.name}>{file.name}</span>
                    <span className="add-emp-doc-file-meta">{(file.size / 1024).toFixed(1)} KB &bull; {meta}</span>
                  </div>
                </div>
                <div className="add-emp-doc-file-actions">
                  <button
                    type="button"
                    className="add-emp-btn-doc-delete"
                    onClick={(e) => { e.stopPropagation(); clear(); }}
                    title="Remove file"
                    aria-label="Remove file"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="emp-form-error" style={{ marginTop: '14px' }} role="alert">{error}</div>
          )}

          {result && (
            <div className="imp-summary" role="status">
              <div className={`imp-summary__line ${ready ? 'is-ok' : 'is-empty'}`}>
                <CheckCircle size={16} weight="bold" aria-hidden="true" />
                <span><strong>{ready}</strong> {noun} ready to import</span>
              </div>
              {problems.length > 0 && (
                <div className="imp-summary__problems">
                  <div className="imp-summary__line is-warn">
                    <Warning size={16} weight="bold" aria-hidden="true" />
                    <span>
                      <strong>{problems.length}</strong> {problems.length === 1 ? 'row has' : 'rows have'} problems and will be skipped. Fix them in the file and upload it again to include them.
                    </span>
                  </div>
                  <ul className="imp-summary__list">
                    {problems.slice(0, ERRORS_SHOWN).map((p) => (
                      <li key={p.rowNumber}><span className="imp-summary__row">Row {p.rowNumber}</span>{p.message}</li>
                    ))}
                  </ul>
                  {problems.length > ERRORS_SHOWN && (
                    <p className="imp-summary__more">and {problems.length - ERRORS_SHOWN} more.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="emp-modal-footer">
          <button type="button" className="emp-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="emp-btn-save"
            disabled={!ready || reading}
            onClick={() => onImport(result.payload)}
          >
            {confirmLabel(ready)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
