import React from 'react';
import {
  ArrowLeft,
  Bed,
  Buildings,
  CalendarBlank,
  Door,
  Drop,
  Gauge,
  House,
  HouseLine,
  Lightning,
  Percent,
  Plug,
  Receipt,
  Ruler,
  Stairs,
  UserCircle,
  UsersThree
} from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  getCategory,
  getDetailFields,
  getEmptyDetail,
  getFloorLabel,
  getOccupant,
  getStatusLabel,
  describeOccupant,
  initialsOf
} from '../../models/UnitModel';
import '../employee/employee.css';
import '../employee/add-employee.css';
import '../employee/employee-detail.css';
import './unit.css';

// Empty fields read "-" so a half-filled unit stays easy to scan.
const BLANK = <span className="unit-muted">-</span>;
const show = (value, format = (v) => v) => (value === '' || value === undefined || value === null ? BLANK : format(value));

function Card({ title, Icon, children, className = '' }) {
  return (
    <section className={`emp-detail-card unit-d-card ${className}`.trim()}>
      <div className="emp-detail-card-head">
        <div className="emp-detail-card-head-left">
          <div className="emp-detail-card-badge emp-badge-secondary">
            <Icon size={20} weight="bold" aria-hidden="true" />
          </div>
          <h3 className="emp-detail-card-title">{title}</h3>
        </div>
      </div>
      <div className="unit-d-body">{children}</div>
    </section>
  );
}

// A big number with its unit beside it, so the spec reads at a glance.
function Spec({ label, Icon, value, unit }) {
  return (
    <div className="unit-spec">
      <dt><Icon size={16} weight="bold" aria-hidden="true" />{label}</dt>
      <dd>
        {value === '' || value === undefined || value === null ? (
          BLANK
        ) : (
          <>
            <strong>{value}</strong>
            {unit && <small>{unit}</small>}
          </>
        )}
      </dd>
    </div>
  );
}

function Person({ label, name, caption, tone }) {
  return (
    <div className={`unit-d-person unit-d-person--${tone}`}>
      <span className="unit-d-person__avatar" aria-hidden="true">
        {name ? initialsOf(name) : <UserCircle size={26} />}
      </span>
      <div className="unit-d-person__text">
        <span className="unit-d-person__label">{label}</span>
        <span className="unit-d-person__name">{name || 'No one yet'}</span>
        {caption && <span className="unit-d-person__caption">{caption}</span>}
      </div>
    </div>
  );
}

const SETTING_HINT = {
  active: 'Added to the invoice',
  inactive: 'Not added to the invoice',
  unset: 'Not set up yet'
};

// A read-only switch: the track and knob show on or off, the text says it too.
function Switch({ state }) {
  const text = { active: 'Active', inactive: 'Inactive', unset: 'Not set' }[state];
  return (
    <span className="unit-d-switchwrap">
      <span className={`unit-d-switch unit-d-switch--${state}`} aria-hidden="true"><span /></span>
      <span className={`unit-d-switchtext unit-d-switchtext--${state}`}>{text}</span>
    </span>
  );
}

const stateOf = (value) => (value === 'yes' ? 'active' : value === 'no' ? 'inactive' : 'unset');

// One bill per row. The icon color marks the kind of bill; the switch says whether it is on.
function SettingRow({ label, hint, Icon, kind, children }) {
  return (
    <li className="unit-d-setting">
      <span className={`unit-d-setting__icon unit-d-setting__icon--${kind}`} aria-hidden="true">
        <Icon size={20} weight="bold" />
      </span>
      <div className="unit-d-setting__text">
        <span className="unit-d-setting__label">{label}</span>
        <span className="unit-d-setting__hint">{hint}</span>
      </div>
      <div className="unit-d-setting__control">{children}</div>
    </li>
  );
}

// One meter per block: the meter number leads in its own panel, the supporting numbers sit side by side.
function MeterCard({ title, Icon, kind, meterNo, children }) {
  return (
    <section className={`unit-d-meter unit-d-meter--${kind}`} aria-label={`${title} meter`}>
      <header className="unit-d-meter__head">
        <span className="unit-d-meter__icon" aria-hidden="true"><Icon size={18} weight="bold" /></span>
        <h4 className="unit-d-meter__title">{title}</h4>
      </header>
      <div className="unit-d-meter__no">
        <span className="unit-d-meter__nolabel">Meter no</span>
        <span className="unit-d-meter__noval">{show(meterNo)}</span>
      </div>
      <dl className="unit-d-meter__stats">{children}</dl>
    </section>
  );
}

function MeterStat({ label, Icon, children }) {
  return (
    <div className="unit-d-meter__stat">
      <dt><Icon size={14} weight="bold" aria-hidden="true" />{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function UnitDetailView({ unit, onBack }) {
  const category = getCategory(unit.category);
  const d = unit.detail ?? getEmptyDetail(unit.category);
  const applies = getDetailFields(unit.category);
  const occupant = getOccupant(unit);

  const secondCaption = occupant ? describeOccupant(occupant) : 'Available';

  return (
    <div className="emp-detail-page unit-detail-page">
      <Breadcrumb
        className="add-emp-breadcrumb"
        items={[
          { label: 'Unit' },
          { label: 'List Unit', onClick: onBack },
          { label: 'Detail Unit' }
        ]}
      />

      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button type="button" className="emp-hero-back-btn" onClick={onBack} title="Back to List Unit" aria-label="Back to List Unit">
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="emp-hero-banner-tag">{category.label.toUpperCase()}</div>
              <h1 className="emp-hero-banner-title">{unit.code}</h1>
              <p className="emp-hero-banner-desc">
                {unit.tower}, {getFloorLabel(unit.floor)}
              </p>
            </div>
          </div>
          <span className={`unit-status unit-status--${unit.status} unit-detail-page__status`}>
            {getStatusLabel(unit.category, unit.status)}
          </span>
        </div>
      </div>

      <div className="unit-d-layout">
        <div className="unit-d-main">
          <Card title="Unit Info" Icon={Buildings}>
            <dl className="unit-specs unit-specs--identity">
              <Spec label="Unit name" Icon={House} value={unit.code} />
              <Spec label="Unit type" Icon={Door} value={category.label} />
              <Spec label={unit.category === 'non_unit' ? 'Tower or area' : 'Tower'} Icon={Buildings} value={unit.tower} />
              <Spec label="Floor" Icon={Stairs} value={getFloorLabel(unit.floor)} />
            </dl>
            <dl className="unit-specs">
              <Spec label="Unit area" Icon={Ruler} value={d.area} unit="m²" />
              {applies.npp && <Spec label="NPP" Icon={Percent} value={d.npp} />}
              {applies.bedrooms && (
                <Spec label="Bedrooms" Icon={Bed} value={d.bedrooms} unit={d.bedrooms === '1' ? 'bedroom' : 'bedrooms'} />
              )}
            </dl>
          </Card>

          <Card title="Owner & Occupant" Icon={UsersThree}>
            <div className="unit-d-people">
              <Person label="Owner" name={unit.ownerName} caption={unit.ownerName ? '' : 'Not assigned'} tone="owner" />
              <Person label="Occupant" name={occupant?.name} caption={secondCaption} tone={unit.status} />
            </div>
          </Card>

          <Card title="Bill Settings" Icon={Receipt}>
            <ul className="unit-d-settings">
              <SettingRow label="Electric bill" hint={SETTING_HINT[stateOf(d.invoiceElectric)]} Icon={Lightning} kind="electric">
                <Switch state={stateOf(d.invoiceElectric)} />
              </SettingRow>
              <SettingRow label="Water bill" hint={SETTING_HINT[stateOf(d.invoiceWater)]} Icon={Drop} kind="water">
                <Switch state={stateOf(d.invoiceWater)} />
              </SettingRow>
              {applies.ipl && (
                <>
                  <SettingRow label="IPL bill" hint={SETTING_HINT[stateOf(d.invoiceIpl)]} Icon={HouseLine} kind="ipl">
                    <Switch state={stateOf(d.invoiceIpl)} />
                  </SettingRow>
                  <SettingRow
                    label="IPL bill interval"
                    hint={d.invoiceIpl === 'no' ? 'IPL is not on the invoice' : 'How often IPL is billed'}
                    Icon={CalendarBlank}
                    kind="interval"
                  >
                    <span className="unit-d-setting__value">
                      {d.invoiceIpl === 'no'
                        ? <span className="unit-muted">No IPL</span>
                        : show(d.iplInterval, (v) => `Every ${v} month${v === '1' ? '' : 's'}`)}
                    </span>
                  </SettingRow>
                </>
              )}
            </ul>
          </Card>
        </div>

        <aside className="unit-d-side">
          <Card title="Meters" Icon={Gauge}>
            <div className="unit-d-meters">
              <MeterCard title="Electricity" Icon={Lightning} kind="electric" meterNo={d.electricMeterNo}>
                <MeterStat label="Capacity" Icon={Plug}>{show(d.electricCapacity, (v) => `${v} VA`)}</MeterStat>
                <MeterStat label="Initial meter" Icon={Gauge}>{show(d.electricMeterStart, (v) => `${v} kWh`)}</MeterStat>
              </MeterCard>
              <MeterCard title="Water" Icon={Drop} kind="water" meterNo={d.waterMeterNo}>
                <MeterStat label="Initial meter" Icon={Gauge}>{show(d.waterMeterStart, (v) => `${v} m³`)}</MeterStat>
              </MeterCard>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default UnitDetailView;
