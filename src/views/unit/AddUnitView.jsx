import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Buildings,
  Ruler,
  ClipboardText,
  FloppyDisk,
  Info,
  WarningCircle
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  UNIT_CATEGORIES,
  NON_UNIT_AREAS,
  TOWER_OPTIONS,
  sanitizeInteger,
  sanitizeDecimal,
  getDetailFields,
  getDetailRows,
  describeTypeChange,
  isUnitStepComplete,
  getFloorOptions,
  getFloorLabel,
  buildUnit,
  getCategory
} from '../../models/UnitModel';
import '../employee/employee.css';
import '../employee/add-employee.css';
import './unit.css';

const STEPS = [
  { id: 1, title: 'Unit Info', desc: 'Type, Tower, Floor & Name', Icon: Buildings },
  { id: 2, title: 'Unit Detail', desc: 'Area, Meters & Billing', Icon: Ruler },
  { id: 3, title: 'Overview', desc: 'Review & Save', Icon: ClipboardText }
];

function Field({ label, required, children, hint, wide }) {
  return (
    <div className={`${wide ? 'col-12' : 'col-md-6'} add-emp-field-col`}>
      <div className="add-emp-label-wrap">
        <label className="add-emp-label">
          {label} {required && <span className="req">*</span>}
        </label>
        {hint && <span className="add-emp-digit-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// Input with a grey unit tag at its right end, like an input group.
function WithUnit({ unit, children }) {
  return (
    <div className="input-group unit-input-group">
      {children}
      <span className="input-group-text unit-addon">{unit}</span>
    </div>
  );
}

function YesNo({ value, onChange, label }) {
  return (
    <select aria-label={label} className="form-select add-emp-input" value={value} onChange={onChange}>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
}

function OverviewSection({ title, rows, onEdit }) {
  return (
    <section className="unit-overview__section">
      <header className="unit-overview__head">
        <h4>{title}</h4>
        <button type="button" className="unit-overview__edit" onClick={onEdit}>Edit</button>
      </header>
      <dl className="unit-overview__list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || <span className="unit-muted">Not filled</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AddUnitView({ presenter }) {
  const {
    wizardStep, wizardDraft: d, updateWizardDraft, goToStep, nextStep, saveUnit, cancelAdd, formError
  } = presenter;

  const set = (key) => (e) => updateWizardDraft({ [key]: e.target.value });
  const isNonUnit = d.category === 'non_unit';
  const applies = getDetailFields(d.category);
  const step = STEPS[wizardStep - 1];
  const lastStep = wizardStep === STEPS.length;
  const isStepDisabled = !isUnitStepComplete(wizardStep, d);
  const typeLabel = d.category ? getCategory(d.category).label : '';
  const isEdit = presenter.pageMode === 'edit';
  const typeChanged = isEdit && Boolean(presenter.editingUnit) && d.category !== presenter.editingUnit.category;
  const typeChangeEffect = typeChanged ? describeTypeChange(presenter.editingUnit, d.category) : '';

  const onSubmit = (e) => {
    e.preventDefault();
    if (isStepDisabled) return;
    if (lastStep) saveUnit();
    else nextStep();
  };

  return (
    <div className="add-emp-container unit-add">
      <Breadcrumb
        className="add-emp-breadcrumb"
        items={[
          { label: 'Unit' },
          { label: 'List Unit', onClick: cancelAdd },
          { label: isEdit ? 'Edit Unit' : 'Add Unit' }
        ]}
      />

      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button type="button" className="emp-hero-back-btn" onClick={cancelAdd} title="Back to List Unit" aria-label="Back to List Unit">
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="emp-hero-banner-tag">MASTER TABLE</div>
              <h1 className="emp-hero-banner-title">{isEdit ? 'Edit Unit' : 'Add New Unit'}</h1>
              <p className="emp-hero-banner-desc">
                {isEdit
                  ? 'Update the unit info and detail, then review and save the changes.'
                  : 'Complete the 3-step form to register a new unit.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="add-emp-stepper-card">
        <div className="add-emp-stepper">
          {STEPS.map((s, i) => {
            const done = wizardStep > s.id;
            const active = wizardStep === s.id;
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  className={`add-emp-step-item unit-step-btn ${active ? 'active' : ''} ${done ? 'completed' : ''}`}
                  onClick={() => { if (done) goToStep(s.id); }}
                  aria-current={active ? 'step' : undefined}
                  disabled={!done && !active}
                >
                  <span className="add-emp-step-circle">{done ? <Check size={18} weight="bold" /> : s.id}</span>
                  <span className="add-emp-step-content">
                    <span className="add-emp-step-title">Step {s.id}: {s.title}</span>
                    <span className="add-emp-step-desc">{s.desc}</span>
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`add-emp-step-connector ${wizardStep > s.id ? 'completed' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="add-emp-form-card">
        <div className="add-emp-card-header">
          <div className="add-emp-heading-badge">
            <step.Icon size={20} weight="bold" color="#0088cc" />
          </div>
          <div>
            <h3 className="add-emp-heading-title">{step.title}</h3>
            <p className="add-emp-heading-subtitle">
              {wizardStep === 1 && 'Which kind of unit this is and where it sits.'}
              {wizardStep === 2 && 'Size, meters, and what goes onto the invoice.'}
              {wizardStep === 3 && 'Check everything before saving the unit.'}
            </p>
          </div>
        </div>

        {formError && (
          <div className="add-emp-error-banner" role="alert">
            <WarningCircle size={20} weight="fill" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          {wizardStep === 1 && (
            <div className="add-emp-step-pane">
              <div className="row g-4">
                <Field label="Unit Type" required>
                  <select
                    className="form-select add-emp-input"
                    value={d.category}
                    onChange={set('category')}
                    autoFocus={!isEdit}
                  >
                    <option value="">-- Choose Unit Type --</option>
                    {UNIT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  {isEdit && (
                    <p className={`unit-type-note${typeChanged ? ' is-changed' : ''}`} role={typeChanged ? 'status' : undefined}>
                      <Info size={14} weight="bold" aria-hidden="true" />
                      <span>
                        {typeChanged
                          ? `Type changed. Tower, floor, and detail were reset, so fill them in again. ${typeChangeEffect}`.trim()
                          : 'Changing the unit type resets tower, floor, and detail.'}
                      </span>
                    </p>
                  )}
                </Field>
                <Field label={isNonUnit ? 'Tower or Area' : 'Tower'} required>
                  <select className="form-select add-emp-input" value={d.tower} onChange={set('tower')} disabled={!d.category}>
                    <option value="">{d.category ? '-- Choose Tower --' : '-- Choose Unit Type First --'}</option>
                    {(isNonUnit ? NON_UNIT_AREAS : TOWER_OPTIONS).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Floor" required>
                  <select className="form-select add-emp-input" value={d.floor} onChange={set('floor')} disabled={!d.tower}>
                    <option value="">{d.tower ? '-- Choose Floor --' : '-- Choose Tower First --'}</option>
                    {getFloorOptions(d.category, d.tower).map((f) => (
                      <option key={f} value={f}>{getFloorLabel(f)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Unit Name" required>
                  <input
                    className="form-control add-emp-input"
                    value={d.code}
                    onChange={set('code')}
                    placeholder="e.g. A0101, ATOKO1"
                  />
                </Field>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="add-emp-step-pane">
              <div className="row g-4">
                <Field label="Unit Area" required>
                  <WithUnit unit="m²">
                    <input className="form-control add-emp-input" inputMode="decimal" value={d.area} onChange={(e) => updateWizardDraft({ area: sanitizeDecimal(e.target.value) })} placeholder="e.g. 36.5" autoFocus />
                  </WithUnit>
                </Field>
                <Field label="Electric Capacity" required>
                  <WithUnit unit="VA">
                    <input className="form-control add-emp-input" inputMode="numeric" value={d.electricCapacity} onChange={(e) => updateWizardDraft({ electricCapacity: sanitizeInteger(e.target.value) })} placeholder="e.g. 2200" />
                  </WithUnit>
                </Field>
                <Field label="Water Meter No" required>
                  <input className="form-control add-emp-input" inputMode="numeric" value={d.waterMeterNo} onChange={(e) => updateWizardDraft({ waterMeterNo: sanitizeInteger(e.target.value) })} placeholder="e.g. 20240101" />
                </Field>
                <Field label="Electricity Meter No" required>
                  <input className="form-control add-emp-input" inputMode="numeric" value={d.electricMeterNo} onChange={(e) => updateWizardDraft({ electricMeterNo: sanitizeInteger(e.target.value) })} placeholder="e.g. 31240101" />
                </Field>
                <Field label="Initial Water Meter" required>
                  <WithUnit unit="m³">
                    <input className="form-control add-emp-input" inputMode="decimal" value={d.waterMeterStart} onChange={(e) => updateWizardDraft({ waterMeterStart: sanitizeDecimal(e.target.value) })} placeholder="e.g. 0" />
                  </WithUnit>
                </Field>
                <Field label="Initial Electricity Meter" required>
                  <WithUnit unit="kWh">
                    <input className="form-control add-emp-input" inputMode="decimal" value={d.electricMeterStart} onChange={(e) => updateWizardDraft({ electricMeterStart: sanitizeDecimal(e.target.value) })} placeholder="e.g. 0" />
                  </WithUnit>
                </Field>
                {applies.npp && (
                  <Field label="NPP" required>
                    <input className="form-control add-emp-input" inputMode="decimal" value={d.npp} onChange={(e) => updateWizardDraft({ npp: sanitizeDecimal(e.target.value) })} placeholder="e.g. 0.25" />
                  </Field>
                )}
                {applies.bedrooms && (
                  <Field label="Number of Bedroom" required>
                    <WithUnit unit="Bedroom">
                      <input
                        className="form-control add-emp-input"
                        inputMode="numeric"
                        value={d.bedrooms}
                        onChange={(e) => updateWizardDraft({ bedrooms: sanitizeInteger(e.target.value) })}
                        placeholder="e.g. 2"
                      />
                    </WithUnit>
                  </Field>
                )}
                <Field label="Insert Electric Utility To Invoice">
                  <YesNo label="Insert electric utility to invoice" value={d.invoiceElectric} onChange={set('invoiceElectric')} />
                </Field>
                <Field label="Insert Water Utility To Invoice">
                  <YesNo label="Insert water utility to invoice" value={d.invoiceWater} onChange={set('invoiceWater')} />
                </Field>
                {applies.ipl && (
                  <>
                    <Field label="Insert IPL To Invoice">
                      <YesNo label="Insert IPL to invoice" value={d.invoiceIpl} onChange={set('invoiceIpl')} />
                    </Field>
                    <Field label="IPL Bill Interval" required={d.invoiceIpl !== 'no'}>
                      <WithUnit unit="Month">
                        <input
                          className="form-control add-emp-input"
                          inputMode="numeric"
                          value={d.iplInterval}
                          onChange={(e) => updateWizardDraft({ iplInterval: sanitizeInteger(e.target.value) })}
                          placeholder={d.invoiceIpl === 'no' ? 'This unit has no IPL on its invoice' : 'e.g. 1'}
                          disabled={d.invoiceIpl === 'no'}
                        />
                      </WithUnit>
                    </Field>
                  </>
                )}
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="add-emp-step-pane">
              {typeChanged && (
                <p className="unit-type-note is-changed" role="status">
                  <Info size={14} weight="bold" aria-hidden="true" />
                  <span>
                    Unit type changes from {getCategory(presenter.editingUnit.category).label} to {typeLabel}.{' '}
                    {typeChangeEffect}
                  </span>
                </p>
              )}
              <OverviewSection
                title="Unit Info"
                onEdit={() => goToStep(1)}
                rows={[
                  ['Unit type', typeLabel],
                  [isNonUnit ? 'Tower or area' : 'Tower', d.tower],
                  ['Floor', d.floor ? getFloorLabel(d.floor) : ''],
                  ['Unit name', d.code]
                ]}
              />
              <OverviewSection
                title="Unit Detail"
                onEdit={() => goToStep(2)}
                rows={getDetailRows(buildUnit(d).detail, { includeEmpty: true })}
              />
            </div>
          )}

          <div className="add-emp-footer">
            <button type="button" className="btn add-emp-btn-cancel" onClick={cancelAdd}>Cancel</button>
            <div className="add-emp-footer-actions">
              {wizardStep > 1 && (
                <button type="button" className="btn add-emp-btn-prev" onClick={() => goToStep(wizardStep - 1)}>
                  <ArrowLeft size={16} weight="bold" />
                  <span>Previous</span>
                </button>
              )}
              {lastStep ? (
                <button
                  type="submit"
                  className="btn add-emp-btn-submit"
                  disabled={isStepDisabled}
                  title={isStepDisabled ? 'Please fill all required fields to save' : (isEdit ? 'Save changes to this unit' : 'Save new unit')}
                >
                  <FloppyDisk size={18} weight="bold" />
                  <span>{isEdit ? 'Save Changes' : 'Save Unit'}</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn add-emp-btn-next"
                  disabled={isStepDisabled}
                  title={isStepDisabled ? 'Please fill all required fields to continue' : 'Proceed to next step'}
                >
                  <span>Next Step</span>
                  <ArrowRight size={16} weight="bold" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUnitView;
