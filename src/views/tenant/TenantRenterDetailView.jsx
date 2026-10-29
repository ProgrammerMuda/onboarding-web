import React from 'react';
import {
  ArrowRight,
  Buildings,
  CalendarBlank,
  CalendarCheck,
  DoorOpen,
  EnvelopeSimple,
  House,
  IdentificationCard,
  Paperclip,
  Phone,
  User,
  UsersThree
} from '@phosphor-icons/react';
import {
  DetailPage,
  DetailCard,
  DetailSpec,
  DetailPerson,
  DoorList,
  formatIsoDate
} from './DetailParts';
import { initialsOf } from '../../models/UnitModel';
import { memberTypeLabel } from '../../models/TenantMemberModel';

// Read-only page for one renter: identity, what they rent and for how long, the owner, doors and members.
export function TenantRenterDetailView({ renter: r, members, onBack, onViewMembers }) {
  const inactive = r.status === 'Inactive';
  const doors = r.doorAccess ?? [];
  const rentals = r.rentals ?? [];
  const pending = members.filter((m) => m.status === 'Pending').length;
  const shownMembers = members.slice(0, 5);

  return (
    <DetailPage
      crumbs={[
        { label: 'Tenant Management' },
        { label: 'Tenant Member', onClick: onBack },
        { label: 'Detail Renter' }
      ]}
      tag="RENTER"
      title={r.name}
      subtitle={`Renter of ${r.ownerName} · ${r.unitCodes.join(', ')}`}
      status={r.status}
      onBack={onBack}
      backLabel="Back to Tenant Member"
    >
      {inactive && (
        <p className="tm-d-note" role="status">This tenant is deactivated and no longer has door access.</p>
      )}

      <div className="unit-d-layout">
        <div className="unit-d-main">
          <DetailCard title="Renter Info" Icon={IdentificationCard}>
            <dl className="unit-specs tm-d-identity">
              <DetailSpec label="Name" Icon={User} value={r.name} />
              <DetailSpec label="Email" Icon={EnvelopeSimple} value={r.email} />
              <DetailSpec label={`${r.idType ?? 'KTP'} number`} Icon={IdentificationCard} value={r.idNumber} />
              <DetailSpec label="Phone number" Icon={Phone} value={r.phone} />
              <DetailSpec label="Supporting file" Icon={Paperclip} value={r.supportingFile} />
            </dl>
          </DetailCard>

          <DetailCard
            title={rentals.length > 1 ? `Rent Details (${rentals.length} units)` : 'Rent Details'}
            Icon={CalendarBlank}
          >
            <div className="tm-d-rentals">
              {rentals.map((x) => (
                <div key={x.code} className="tm-d-rental">
                  <dl className="unit-specs tm-d-rent">
                    <DetailSpec label="Unit" Icon={House} value={x.code} />
                    <DetailSpec label="Rent period" Icon={CalendarBlank}>
                      <strong>{x.period}</strong><small>months</small>
                    </DetailSpec>
                    <DetailSpec label="Start rent" Icon={CalendarCheck} value={formatIsoDate(x.start)} />
                    <DetailSpec label="Date out" Icon={CalendarCheck} value={x.out} />
                  </dl>
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Owner" Icon={Buildings}>
            <div className="unit-d-people">
              <DetailPerson label="Member of" name={r.ownerName} role="Owner" />
              <div className="tm-d-type">
                <span className="tm-d-type__label">Member type</span>
                <span className="tm-d-type__value">{memberTypeLabel({ relation: 'Renter' })}</span>
              </div>
            </div>
          </DetailCard>
        </div>

        <div className="unit-d-side">
          <DetailCard title="Door Access" Icon={DoorOpen} aside={<span className="tm-d-count">{doors.length}</span>}>
            <DoorList doors={doors} />
          </DetailCard>

          <DetailCard title="Members" Icon={UsersThree} aside={<span className="tm-d-count">{members.length}</span>}>
            {members.length === 0 ? (
              <p className="tm-d-empty">No members registered under this renter yet.</p>
            ) : (
              <>
                <ul className="tm-d-members">
                  {shownMembers.map((m) => (
                    <li key={m.id}>
                      <span className="tm-avatar" aria-hidden="true">{initialsOf(m.name)}</span>
                      <span className="tm-d-members__text">
                        <span className="tm-d-members__name">{m.name}</span>
                        <span className="tm-d-members__rel">{memberTypeLabel(m)}</span>
                      </span>
                      <span className={`tm-status tm-status--${m.status.toLowerCase()}`}>{m.status}</span>
                    </li>
                  ))}
                </ul>
                {pending > 0 && <p className="tm-d-hint">{pending} waiting for approval</p>}
                <button type="button" className="tm-rv__edit tm-d-viewall" onClick={onViewMembers}>
                  <span>{members.length > shownMembers.length ? `View all ${members.length} members` : 'View in member list'}</span>
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </button>
              </>
            )}
          </DetailCard>
        </div>
      </div>
    </DetailPage>
  );
}

export default TenantRenterDetailView;
