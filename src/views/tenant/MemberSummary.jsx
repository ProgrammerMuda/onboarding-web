import React from 'react';
import { DoorOpen, Handshake, House, Key, PencilSimple, ShieldCheck } from '@phosphor-icons/react';

const formatDate = (iso) => {
  const [y, m, d] = String(iso).split('-');
  return y ? `${d}/${m}/${y}` : '';
};

const ROLE_ICONS = { Owner: Key, Renter: Handshake, Proxy: ShieldCheck };

// One row: section name (and Edit, when editable) on the left, its values on an aligned grid on the right.
export function SummarySection({ title, onEdit, children }) {
  return (
    <section className="tm-rv__section">
      <div className="tm-rv__side">
        <h4>{title}</h4>
        {onEdit && (
          <button type="button" className="tm-rv__edit" onClick={onEdit} aria-label={`Edit ${title}`}>
            <PencilSimple size={14} weight="bold" aria-hidden="true" />
            <span>Edit</span>
          </button>
        )}
      </div>
      <dl className="tm-rv__items">{children}</dl>
    </section>
  );
}

export function SummaryItem({ label, wide, full, children }) {
  return (
    <div className={`tm-rv__item${wide ? ' is-wide' : ''}${full ? ' is-full' : ''}`}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// Shared by the wizard's Review step and the member detail page.
// onEdit(step) shows an Edit button per section that opens that wizard step.
export function MemberSummary({ member: m, onEdit }) {
  const RoleIcon = ROLE_ICONS[m.parentRole];
  const edit = (step) => (onEdit ? () => onEdit(step) : undefined);
  const muted = (text) => <span className="tm-rv__muted">{text}</span>;

  return (
    <>
      <SummarySection title="Unit & Relation" onEdit={edit(1)}>
        <SummaryItem label="Unit">
          {(m.unitCodes ?? [m.unitCode]).map((code) => (
            <span key={code} className="tm-unit-badge"><House size={14} weight="bold" aria-hidden="true" /><span>{code}</span></span>
          ))}
          {!m.unitCodes && <span className="tm-rv__muted">{m.tower}</span>}
        </SummaryItem>
        <SummaryItem label="Member of">
          <span>{m.parentName}</span>
          {RoleIcon && (
            <span className="tm-role-chip"><RoleIcon size={14} weight="bold" aria-hidden="true" />{m.parentRole}</span>
          )}
        </SummaryItem>
        <SummaryItem label="Relation">
          <span className="tm-relation">{m.relation}</span>
          {m.isProxy && <span className="tm-role-chip"><ShieldCheck size={14} weight="bold" aria-hidden="true" />Proxy</span>}
        </SummaryItem>
      </SummarySection>

      <SummarySection title="Member Data" onEdit={edit(2)}>
        <SummaryItem label="Name">{m.name}</SummaryItem>
        <SummaryItem label="Email">{m.email || muted('Not filled')}</SummaryItem>
        <SummaryItem label={`${m.idType} number`}>
          {m.idNumber ? <span className="font-monospace">{m.idNumber}</span> : muted('Not filled')}
        </SummaryItem>
        <SummaryItem label="Phone number">
          {m.phone ? <span className="font-monospace">{m.phone}</span> : muted('Not filled')}
        </SummaryItem>
        <SummaryItem label="Supporting file" wide>{m.fileLabel || muted('Not attached')}</SummaryItem>
      </SummarySection>

      {m.rents && m.rents.length > 0 && (
        <SummarySection title="Rent Details" onEdit={edit(3)}>
          {m.rents.map((x) => (
            <SummaryItem key={x.code} label={`Unit ${x.code}`} wide>
              {x.period} months, from {formatDate(x.start)} until {x.out}
            </SummaryItem>
          ))}
        </SummarySection>
      )}

      {m.rent && (
        <SummarySection title="Rent Details" onEdit={edit(3)}>
          <SummaryItem label="Rent period">{m.rent.period} months</SummaryItem>
          <SummaryItem label="Start rent">{formatDate(m.rent.start)}</SummaryItem>
          <SummaryItem label="Date out">{m.rent.out}</SummaryItem>
        </SummarySection>
      )}

      <SummarySection title="Door Access" onEdit={edit(3)}>
        <SummaryItem label={`${m.doorAccess.length} ${m.doorAccess.length === 1 ? 'door' : 'doors'}`} full>
          {m.doorAccess.length === 0
            ? muted('No doors set yet')
            : m.doorAccess.map((door) => (
              <span key={door} className="tm-unit-badge"><DoorOpen size={14} weight="bold" aria-hidden="true" /><span>{door}</span></span>
            ))}
        </SummaryItem>
      </SummarySection>
    </>
  );
}
