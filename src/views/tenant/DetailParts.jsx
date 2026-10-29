import React from 'react';
import { ArrowLeft, CheckCircle, Clock, DoorOpen, Handshake, Key, Prohibit, ShieldCheck, User, UsersThree, XCircle } from '@phosphor-icons/react';
import { Breadcrumb } from '../components/Breadcrumb';
import { initialsOf } from '../../models/UnitModel';
import '../employee/employee.css';
import '../employee/add-employee.css';
import '../employee/employee-detail.css';
import '../unit/unit.css';
import './tenant-member.css';

// Building blocks shared by the member and renter detail pages. They follow the Unit detail page:
// a banner, a main column of cards, and a narrower side column.

const ROLE_ICONS = { Owner: Key, Renter: Handshake, Proxy: ShieldCheck };
const STATUS_ICONS = { Active: CheckCircle, Pending: Clock, Rejected: XCircle, Inactive: Prohibit, Unoccupied: Prohibit };
const ROLE_TONES = { Owner: 'owner', Renter: 'rented', Proxy: 'occupied' };

export const BLANK = <span className="unit-muted">-</span>;

export function DetailPage({ crumbs, tag, title, subtitle, status, onBack, backLabel, children }) {
  return (
    <div className="emp-detail-page unit-detail-page tm-detail">
      <Breadcrumb className="add-emp-breadcrumb" items={crumbs} />

      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button type="button" className="emp-hero-back-btn" onClick={onBack} aria-label={backLabel}>
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="emp-hero-banner-tag">{tag}</div>
              <h1 className="emp-hero-banner-title">{title}</h1>
              <p className="emp-hero-banner-desc">{subtitle}</p>
            </div>
          </div>
          <span className={`tm-status tm-status--${status.toLowerCase()} tm-detail__status`}>
            {React.createElement(STATUS_ICONS[status] ?? CheckCircle, { size: 16, weight: 'bold', 'aria-hidden': true })}
            {status}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}

export function DetailCard({ title, Icon, aside, children }) {
  return (
    <section className="emp-detail-card unit-d-card">
      <div className="emp-detail-card-head">
        <div className="emp-detail-card-head-left">
          <div className="emp-detail-card-badge emp-badge-secondary">
            <Icon size={20} weight="bold" aria-hidden="true" />
          </div>
          <h3 className="emp-detail-card-title">{title}</h3>
        </div>
        {aside}
      </div>
      <div className="unit-d-body">{children}</div>
    </section>
  );
}

// One tile: a small icon label over the value. Pass `value` for plain text or `children` for richer content.
export function DetailSpec({ label, Icon, value, children }) {
  const empty = !children && (value === '' || value === undefined || value === null);
  return (
    <div className="unit-spec">
      <dt><Icon size={16} weight="bold" aria-hidden="true" />{label}</dt>
      <dd>{empty ? BLANK : children ?? <strong>{value}</strong>}</dd>
    </div>
  );
}

export function DetailPerson({ label, name, role }) {
  const Icon = ROLE_ICONS[role];
  return (
    <div className={`unit-d-person unit-d-person--${ROLE_TONES[role] ?? 'owner'}`}>
      <span className="unit-d-person__avatar" aria-hidden="true">{initialsOf(name)}</span>
      <div className="unit-d-person__text">
        <span className="unit-d-person__label">{label}</span>
        <span className="unit-d-person__name">{name}</span>
        {Icon && (
          <span className="unit-d-person__caption tm-d-role"><Icon size={13} weight="bold" aria-hidden="true" />{role}</span>
        )}
      </div>
    </div>
  );
}

// Same tile as DetailPerson, for the relation: its icon in the avatar, the relation as the name,
// and under it "Proxy" or "Non-proxy" as a plain icon and text.
export function DetailRelation({ relation, isProxy }) {
  const StatusIcon = isProxy ? ShieldCheck : User;
  return (
    <div className="unit-d-person unit-d-person--occupied">
      <span className="unit-d-person__avatar" aria-hidden="true"><UsersThree size={22} weight="bold" /></span>
      <div className="unit-d-person__text">
        <span className="unit-d-person__label">Relation</span>
        <span className="unit-d-person__name">{relation}</span>
        <span className="unit-d-person__caption tm-d-role">
          <StatusIcon size={13} weight="bold" aria-hidden="true" />{isProxy ? 'Proxy' : 'Non-proxy'}
        </span>
      </div>
    </div>
  );
}

export function DoorList({ doors }) {
  if (doors.length === 0) return <p className="tm-d-empty">No doors set yet. Edit to choose which doors open.</p>;
  return (
    <ul className="tm-d-doors">
      {doors.map((door) => (
        <li key={door}>
          <span className="tm-d-doors__icon"><DoorOpen size={16} weight="bold" aria-hidden="true" /></span>
          <span>{door}</span>
        </li>
      ))}
    </ul>
  );
}

export const formatIsoDate = (iso) => {
  const [y, m, d] = String(iso ?? '').split('-');
  return y ? `${d}/${m}/${y}` : '';
};
