import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Buildings,
  IdentificationCard,
  DoorOpen,
  FloppyDisk,
  House,
  Key,
  Handshake,
  ShieldCheck,
  User,
  ClipboardText
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import { MemberSummary } from './MemberSummary';
import { Field, IdentityFields } from './MemberFormFields';
import {
  searchUnitChoices,
  getUnitChoice,
  relationsFor,
  parentOptions,
  parentOf,
  DOOR_ACCESS_OPTIONS,
  isMemberStepFilled,
  occupantNotice,
  canBeProxy,
  needsRent,
  endRentDate,
  fieldErrors,
  digitsOnly,
  rentPeriodProblem,
  RENT_PERIOD_MAX
} from '../../models/TenantMemberModel';
import '../employee/employee.css';
import '../employee/add-employee.css';
import '../unit/unit.css';
import './tenant-member.css';

const ROLE_ICONS = { Owner: Key, Renter: Handshake, Proxy: ShieldCheck };

const STEPS = [
  { id: 1, title: 'Unit & Relation', desc: 'Unit, relation & tenant', Icon: Buildings, subtitle: 'Pick the unit, whose member this is, and how they are related.' },
  { id: 2, title: 'Member Data', heading: 'Member details', desc: 'Identity & contact', Icon: IdentificationCard, subtitle: 'Identity and contact details of the member.' },
  { id: 3, title: 'Rent & Access', desc: 'Doors the member can open', Icon: DoorOpen, subtitle: 'Choose which doors this member can enter.' },
  { id: 4, title: 'Review', desc: 'Check & save', Icon: ClipboardText, subtitle: 'Check everything before saving the member. It is saved as Pending until approved.' }
]

// The form card clips its content (overflow: hidden), so dropdown lists render in a portal,
// pinned under their field and free to extend past the card. They open upward when the
// space below is too small, and follow the field on scroll and resize.
const LIST_MAX_HEIGHT = 320;

function useFloatingList(anchorRef, open) {
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < 200 && above > below;
      setStyle({
        position: 'fixed',
        left: r.left,
        width: r.width,
        right: 'auto',
        zIndex: 1060,
        maxHeight: Math.min(LIST_MAX_HEIGHT, up ? above : below),
        ...(up ? { top: 'auto', bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4, bottom: 'auto' })
      });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, anchorRef]);

  return open ? style : null;
}

// Each option shows the unit, its tower, and its owner. Type to search units, arrow keys to move, Enter to pick, Escape to close.
function UnitCombobox({ id, units, value, onChange }) {
  const listId = useId();
  const selected = getUnitChoice(value, units);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const listStyle = useFloatingList(wrapRef, open);
  const results = searchUnitChoices(query, units).slice(0, 50);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Opening lands on the chosen unit so it is visible and highlighted.
  const openList = () => {
    if (open) return;
    setActive(Math.max(0, results.findIndex((u) => u.code === value)));
    setOpen(true);
  };

  // The portaled list exists only once it has a position, so wait for that before scrolling.
  const listReady = Boolean(listStyle);
  useEffect(() => {
    if (listReady) document.getElementById(`${listId}-${value}`)?.scrollIntoView({ block: 'nearest' });
  }, [listReady, listId, value]);

  const pick = (unit) => {
    onChange(unit.code);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => (a + step + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Enter') {
      if (open && results[active]) {
        e.preventDefault();
        pick(results[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Closed with a unit chosen: the input keeps the text for screen readers, the overlay draws icon + code + gray tower.
  const showChosen = !open && Boolean(selected);
  const display = open ? query : selected ? `${selected.code} · ${selected.tower}` : '';

  return (
    <div className="tm-combo" ref={wrapRef}>
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        className={`form-select add-emp-input tm-combo__input${showChosen ? ' has-chosen' : ''}`}
        placeholder="Search and choose a unit"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${results[active].code}` : undefined}
        value={display}
        onFocus={openList}
        onClick={openList}
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={onKeyDown}
      />
      {showChosen && (
        <span className="tm-combo__chosen" aria-hidden="true">
          <House size={16} weight="bold" />
          <span className="tm-combo__chosen-code">{selected.code}</span>
          <span className="tm-combo__chosen-tower">{selected.tower}</span>
        </span>
      )}
      {open && listStyle && createPortal(
        <ul ref={listRef} className="tm-combo__list" role="listbox" id={listId} style={listStyle}>
          {results.length === 0 ? (
            <li className="tm-combo__empty" role="presentation">No unit matches “{query}”.</li>
          ) : results.map((u, i) => (
            <li
              key={u.code}
              id={`${listId}-${u.code}`}
              role="option"
              aria-selected={u.code === value}
              className={`tm-combo__option${i === active ? ' is-active' : ''}${u.code === value ? ' is-selected' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(u); }}
            >
              <span className="tm-unit-badge">
                <House size={14} weight="bold" aria-hidden="true" />
                <span>{u.code}</span>
              </span>
              <span className="tm-combo__meta">{u.tower}</span>
              <span className="tm-combo__owner">
                <span className="tm-combo__owner-label">Owner</span>
                <span className="tm-combo__owner-name">{u.ownerName}</span>
              </span>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}

function ChoiceCards({ name, legend, value, onChange, options }) {
  return (
    <fieldset className="tm-parent">
      <legend className="add-emp-label">{legend} <span className="req">*</span></legend>
      <div className="tm-parent__grid tm-parent__grid--two">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label key={o.value} className={`tm-parent__card${checked ? ' is-on' : ''}`}>
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} />
              <span className="tm-parent__icon"><o.icon size={18} weight="bold" aria-hidden="true" /></span>
              <span className="tm-parent__text">
                <span className="tm-parent__name">{o.title}</span>
                <span className="tm-parent__reason">{o.text}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// Owner / Renter / Proxy as radio cards. A role the unit does not have stays visible, disabled, with the reason.
function ParentPicker({ unit, value, onChange }) {
  return (
    <fieldset className="tm-parent">
      <legend className="add-emp-label">Member of <span className="req">*</span></legend>
      <div className="tm-parent__grid">
        {parentOptions(unit).map((p) => {
          const Icon = ROLE_ICONS[p.role];
          const available = Boolean(p.name);
          const checked = value === p.role;
          return (
            <label key={p.role} className={`tm-parent__card${checked ? ' is-on' : ''}${available ? '' : ' is-off'}`}>
              <input
                type="radio"
                name="tm-parent"
                value={p.role}
                checked={checked}
                disabled={!available}
                onChange={() => onChange(p.role)}
              />
              <span className="tm-parent__icon"><Icon size={18} weight="bold" aria-hidden="true" /></span>
              <span className="tm-parent__text">
                <span className="tm-parent__role">{p.role}</span>
                <span className={available ? 'tm-parent__name' : 'tm-parent__reason'}>{available ? p.name : p.reason}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// Dropdown with checkable options. Arrow keys move, Space or Enter toggles, Escape closes.
function DoorMultiSelect({ id, value, onChange, describedBy }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const listStyle = useFloatingList(wrapRef, open);

  const listReady = Boolean(listStyle);
  useEffect(() => {
    if (listReady) listRef.current?.focus({ preventScroll: true });
  }, [listReady]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // The list scrolls with 10 doors; keep the keyboard-highlighted row in view.
  useEffect(() => {
    if (listReady) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [listReady, active, listId]);

  const toggle = (door) => onChange(value.includes(door) ? value.filter((x) => x !== door) : [...value, door]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onListKey = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => (a + step + DOOR_ACCESS_OPTIONS.length) % DOOR_ACCESS_OPTIONS.length);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle(DOOR_ACCESS_OPTIONS[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="tm-multi" ref={wrapRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="form-select add-emp-input tm-multi__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-describedby={describedBy}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); } }}
      >
        {value.length === 0 ? (
          <span className="tm-multi__placeholder">Select doors</span>
        ) : (
          <span className="tm-multi__chips">
            {value.map((door) => (
              <span key={door} className="tm-unit-badge">
                <DoorOpen size={14} weight="bold" aria-hidden="true" />
                <span>{door}</span>
              </span>
            ))}
          </span>
        )}
      </button>
      {open && listStyle && createPortal(
        <ul
          ref={listRef}
          style={listStyle}
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label="Door access"
          tabIndex={-1}
          className="tm-combo__list tm-multi__list"
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
        >
          {DOOR_ACCESS_OPTIONS.map((door, i) => {
            const checked = value.includes(door);
            return (
              <li
                key={door}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={checked}
                className={`tm-combo__option tm-multi__option${i === active ? ' is-active' : ''}${checked ? ' is-selected' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); setActive(i); toggle(door); }}
              >
                <span className={`tm-multi__box${checked ? ' is-on' : ''}`} aria-hidden="true">
                  {checked && <Check size={12} weight="bold" />}
                </span>
                <span>{door}</span>
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}

export function AddTenantMemberView({ presenter }) {
  const { wizardStep, goToStep, nextStep, draft: d, updateDraft, unitChoices } = presenter;
  // Editing a renter reuses this wizard: same steps and look, but the lease is locked and rent is per unit.
  const isRenterEdit = presenter.isRenterEdit;
  const cancelAdd = isRenterEdit ? presenter.cancelRenterEdit : presenter.cancelAdd;
  const saveMember = isRenterEdit ? presenter.saveRenter : presenter.saveMember;
  const unit = getUnitChoice(d.unitCode, unitChoices);
  const parent = parentOf(unit, d.parentRole);
  const relations = relationsFor(d.unitCode, d.parentRole, unitChoices);
  const proxyAsked = canBeProxy(d, unitChoices);
  const rent = needsRent(d);
  const dateOut = endRentDate(d.startRent, d.rentalPeriod);
  // Errors appear as helper text after Next is pressed, and clear as each field is fixed.
  const shown = presenter.showErrors ? fieldErrors(d, presenter.rentingById) : {};
  const step = STEPS[wizardStep - 1];
  const isEdit = presenter.isEditing || isRenterEdit;
  const ownerName = unit?.ownerName ?? '';
  const rentals = d.rentals ?? [];
  const lastStep = wizardStep === STEPS.length;
  const blocked = !isMemberStepFilled(wizardStep, d, unitChoices);
  const set = (key, clean = (v) => v) => (e) => updateDraft({ [key]: clean(e.target.value) });
  const describe = (key) => `tm-add-${key}-msg`;

  const onSubmit = (e) => {
    e.preventDefault();
    if (blocked) return;
    if (lastStep) saveMember();
    else nextStep();
  };

  return (
    <div className="add-emp-container tm-add">
      <Breadcrumb
        className="add-emp-breadcrumb"
        items={[
          { label: 'Tenant Management' },
          { label: 'Tenant Member', onClick: cancelAdd },
          { label: isEdit ? 'Edit Tenant Member' : 'Add Tenant Member' }
        ]}
      />

      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button type="button" className="emp-hero-back-btn" onClick={cancelAdd} aria-label="Back to Tenant Member">
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="emp-hero-banner-tag">TENANT MANAGEMENT</div>
              <h1 className="emp-hero-banner-title">{isEdit ? 'Edit Tenant Member' : 'Add Tenant Member'}</h1>
              <p className="emp-hero-banner-desc">
                {isEdit
                  ? 'Update the member across the 4 steps, then review and save the changes.'
                  : 'Complete the 4-step form to register a new tenant member.'}
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
                  <div className={`add-emp-step-connector ${done ? 'completed' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="add-emp-form-card">
        <div className="add-emp-card-header">
          <div className="add-emp-heading-badge">
            <step.Icon size={20} weight="bold" />
          </div>
          <div>
            <h3 className="add-emp-heading-title">{step.heading ?? step.title}</h3>
            <p className="add-emp-heading-subtitle">{isEdit && step.id === 4 ? 'Check the changes before saving. The member keeps their current status.' : isRenterEdit && step.id === 1 ? 'The lease details for this renter. They are locked here.' : step.id === 3 && (rent || isRenterEdit) ? 'Set the rent period, then choose which doors this member can enter.' : step.subtitle}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate>
          {wizardStep === 1 && isRenterEdit && (
            <div className="add-emp-step-pane">
              <div className="row g-4">
                <Field id="tm-add-lockunit" label={rentals.length === 1 ? 'Unit' : `Units (${rentals.length})`} wide hint="The lease fixes the unit, owner and relation, so they are shown here but not changed.">
                  <input id="tm-add-lockunit" className="form-control add-emp-input" value={rentals.map((x) => x.code).join(', ')} disabled />
                </Field>
                <Field id="tm-add-lockowner" label="Member of" wide>
                  <input id="tm-add-lockowner" className="form-control add-emp-input" value={`${ownerName} (Owner)`} disabled />
                </Field>
                <Field id="tm-add-lockrelation" label="Member Relation" wide>
                  <input id="tm-add-lockrelation" className="form-control add-emp-input" value="Renter" disabled />
                </Field>
              </div>
            </div>
          )}

          {wizardStep === 1 && !isRenterEdit && (
            <div className="add-emp-step-pane">
              <div className="row g-4">
                <Field id="tm-add-unit" label="Unit" required wide>
                  <UnitCombobox id="tm-add-unit" units={unitChoices} value={d.unitCode} onChange={(code) => updateDraft({ unitCode: code })} />
                </Field>

                <div className="col-12">
                  {unit ? (
                    <ParentPicker unit={unit} value={d.parentRole} onChange={(role) => updateDraft({ parentRole: role })} />
                  ) : (
                    <fieldset className="tm-parent" disabled>
                      <legend className="add-emp-label">Member of <span className="req">*</span></legend>
                      <p className="tm-add-wait">Select a unit first to see its owner, renter, and proxy.</p>
                    </fieldset>
                  )}
                </div>

                <Field
                  id="tm-add-relation"
                  label="Member Relation"
                  required
                  wide
                  hint={parent && d.parentRole === 'Owner' ? occupantNotice(unit) : ''}
                >
                  <div className="unit-select-wrap tm-add-select">
                    <select
                      id="tm-add-relation"
                      className="form-select add-emp-input"
                      value={d.relation}
                      onChange={set('relation')}
                      disabled={!parent}
                      aria-describedby={describe('relation')}
                    >
                      <option value="">
                        {!unit ? 'Select a unit first to choose the member relation' : !parent ? 'Choose Member of first to choose the member relation' : '-- Select Member Relation --'}
                      </option>
                      {relations.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </Field>

                {proxyAsked && (
                  <div className="col-12">
                    <ChoiceCards
                      name="tm-proxy"
                      legend={`Make this ${d.relation.toLowerCase()} the unit's proxy?`}
                      value={d.isProxy ? 'yes' : 'no'}
                      onChange={(v) => updateDraft({ isProxy: v === 'yes' })}
                      options={[
                        { value: 'no', icon: User, title: 'No', text: `Regular member of ${parent.name}.` },
                        { value: 'yes', icon: ShieldCheck, title: 'Yes, as proxy', text: `Lives in ${unit.code} for ${parent.name}. The unit then takes no renter.` }
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="add-emp-step-pane">
              <IdentityFields draft={d} update={updateDraft} showErrors={presenter.showErrors} renting={presenter.rentingById} />
            </div>
          )}

          {wizardStep === 3 && (
            <div className="add-emp-step-pane">
              <div className="row g-4">
                {isRenterEdit && rentals.flatMap((x, i) => {
                  const problem = presenter.showErrors ? rentPeriodProblem(x.period) : '';
                  return [
                    <Field key={`u${i}`} id={`tm-add-rentunit-${i}`} label="Unit" quarter>
                      <input id={`tm-add-rentunit-${i}`} className="form-control add-emp-input" value={x.code} disabled />
                    </Field>,
                    <Field key={`p${i}`} id={`tm-add-period-${i}`} label="Rent Period" required quarter error={problem} counter={`max ${RENT_PERIOD_MAX}`}>
                      <div className="input-group unit-input-group">
                        <input
                          id={`tm-add-period-${i}`}
                          className={`form-control add-emp-input font-monospace${problem ? ' is-invalid' : ''}`}
                          inputMode="numeric"
                          maxLength={3}
                          placeholder="e.g. 12"
                          value={x.period}
                          onChange={(e) => presenter.updateRental(i, { period: digitsOnly(e.target.value).slice(0, 3) })}
                          aria-invalid={problem ? true : undefined}
                          aria-describedby={`tm-add-period-${i}-msg`}
                        />
                        <span className="input-group-text unit-addon">Month</span>
                      </div>
                    </Field>,
                    <Field key={`s${i}`} id={`tm-add-start-${i}`} label="Start Rent" required quarter>
                      <input
                        id={`tm-add-start-${i}`}
                        type="date"
                        className="form-control add-emp-input"
                        value={x.start}
                        onChange={(e) => presenter.updateRental(i, { start: e.target.value })}
                      />
                    </Field>,
                    <Field key={`o${i}`} id={`tm-add-dateout-${i}`} label="Calculated Date Out" quarter>
                      <input id={`tm-add-dateout-${i}`} className="form-control add-emp-input" value={endRentDate(x.start, x.period)} placeholder="-" disabled />
                    </Field>
                  ];
                })}

                {!isRenterEdit && rent && (
                  <>
                    <Field id="tm-add-rentunit" label="Unit" quarter>
                      <input id="tm-add-rentunit" className="form-control add-emp-input" value={unit ? `${unit.code} · ${unit.tower}` : ''} disabled />
                    </Field>
                    <Field id="tm-add-period" label="Rent Period" required quarter error={shown.rentalPeriod} counter={`max ${RENT_PERIOD_MAX}`}>
                      <div className="input-group unit-input-group">
                        <input
                          id="tm-add-period"
                          className={`form-control add-emp-input font-monospace${shown.rentalPeriod ? ' is-invalid' : ''}`}
                          inputMode="numeric"
                          maxLength={3}
                          placeholder="e.g. 12"
                          value={d.rentalPeriod}
                          onChange={set('rentalPeriod', (v) => digitsOnly(v).slice(0, 3))}
                          aria-invalid={shown.rentalPeriod ? true : undefined}
                          aria-describedby={describe('period')}
                        />
                        <span className="input-group-text unit-addon">Month</span>
                      </div>
                    </Field>
                    <Field id="tm-add-start" label="Start Rent" required quarter>
                      <input id="tm-add-start" type="date" className="form-control add-emp-input" value={d.startRent} onChange={set('startRent')} />
                    </Field>
                    <Field id="tm-add-dateout" label="Calculated Date Out" quarter>
                      <input id="tm-add-dateout" className="form-control add-emp-input" value={dateOut} placeholder="-" disabled />
                    </Field>
                  </>
                )}

                <Field id="tm-add-doors" label="Door Access" required wide hint="Pick every door this member's card should open.">
                  <DoorMultiSelect
                    id="tm-add-doors"
                    value={d.doorAccess}
                    onChange={(doors) => updateDraft({ doorAccess: doors })}
                    describedBy={describe('doors')}
                  />
                </Field>
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="add-emp-step-pane tm-rv">
              <MemberSummary
                member={{
                  unitCode: unit?.code,
                  unitCodes: isRenterEdit ? rentals.map((x) => x.code) : undefined,
                  tower: unit?.tower,
                  parentName: parent?.name,
                  parentRole: parent?.role,
                  relation: d.relation,
                  isProxy: proxyAsked && d.isProxy,
                  name: d.name.trim(),
                  email: d.email.trim(),
                  idType: d.idType,
                  idNumber: d.idNumber,
                  phone: d.phone,
                  fileLabel: d.file ? `${d.file.name} (${(d.file.size / 1024 / 1024).toFixed(1)} MB)` : '',
                  rent: !isRenterEdit && rent ? { period: d.rentalPeriod, start: d.startRent, out: dateOut } : null,
                  rents: isRenterEdit ? rentals.map((x) => ({ code: x.code, period: x.period, start: x.start, out: endRentDate(x.start, x.period) })) : undefined,
                  doorAccess: d.doorAccess
                }}
                onEdit={goToStep}
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
                <button type="submit" className="btn add-emp-btn-submit" disabled={blocked}>
                  <FloppyDisk size={18} weight="bold" />
                  <span>{isEdit ? 'Save Changes' : 'Save Member'}</span>
                </button>
              ) : (
                <button type="submit" className="btn add-emp-btn-next" disabled={blocked}>
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

export default AddTenantMemberView;
