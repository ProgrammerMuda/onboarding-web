import React from 'react';
import {
  Buildings,
  CalendarBlank,
  CalendarCheck,
  CheckCircle,
  Check,
  X,
  WarningCircle,
  DoorOpen,
  EnvelopeSimple,
  House,
  IdentificationCard,
  Paperclip,
  Phone,
  ShieldCheck,
  User
} from '@phosphor-icons/react';
import {
  DetailPage,
  DetailCard,
  DetailSpec,
  DetailPerson,
  DetailRelation,
  DoorList,
  formatIsoDate
} from './DetailParts';
import { unitOwnerOf } from '../../models/TenantMemberModel';

// Read-only page for one member: who they are, where they sit, rent (for renters) and the doors they can open.
export function TenantMemberDetailView({ member: m, onBack, onApprove, onReject, feedback, onDismissFeedback }) {
  const inactive = m.status === 'Inactive';
  const owner = unitOwnerOf(m);
  const doors = m.doorAccess ?? [];
  const showOwner = m.parentRole !== 'Owner' && Boolean(owner);

  return (
    <DetailPage
      crumbs={[
        { label: 'Tenant Management' },
        { label: 'Tenant Member', onClick: onBack },
        { label: 'Detail Member' }
      ]}
      tag="TENANT MEMBER"
      title={m.name}
      subtitle={`${m.relation} of ${m.tenantName} · ${m.unitCodes[0]}`}
      status={m.status}
      onBack={onBack}
      backLabel="Back to Tenant Member"
    >
      {inactive && (
        <p className="tm-d-note" role="status">This member is deactivated and no longer has door access.</p>
      )}

      {feedback && (
        <div className={`tm-feedback tm-feedback--${feedback.type}`} role="alert">
          <div className="tm-feedback__body">
            {feedback.type === 'success' ? <CheckCircle size={20} weight="fill" /> : <WarningCircle size={20} weight="fill" />}
            <div><strong>{feedback.title}:</strong> {feedback.message}</div>
          </div>
          <button type="button" className="tm-feedback__close" onClick={onDismissFeedback} aria-label="Close notification">
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {m.status === 'Rejected' && !feedback && (
        <p className="tm-d-note tm-d-note--rejected" role="status">
          This member was rejected and has no door access.{m.rejectReason ? ` Reason: ${m.rejectReason}` : ''}
        </p>
      )}

      {m.status === 'Pending' && (
        <section className="tm-ab" role="region" aria-label="Tenant member approval actions">
          <div className="tm-ab__left">
            <span className="tm-ab__icon"><ShieldCheck size={24} weight="bold" /></span>
            <div className="tm-ab__text">
              <div className="tm-ab__title">
                <span>Action Required: Tenant Member Approval</span>
                <span className="tm-ab__badge">Pending</span>
              </div>
              <p className="tm-ab__desc">
                <strong>{m.name}</strong> was added under <strong>{m.tenantName}</strong> in unit {m.unitCodes[0]}.
                Your sign-off as <strong>Building Manager</strong> is required before this member can open any door.
              </p>
            </div>
          </div>
          <div className="tm-ab__actions">
            <button type="button" className="tm-ab__reject" onClick={onReject} aria-label="Reject Tenant Member">
              <X size={15} weight="bold" />
              <span>Reject Member</span>
            </button>
            <button type="button" className="tm-ab__approve" onClick={onApprove} aria-label="Approve Tenant Member">
              <Check size={16} weight="bold" />
              <span>Approve Member</span>
            </button>
          </div>
        </section>
      )}

      <div className="unit-d-layout">
        <div className="unit-d-main">
          <DetailCard title="Member Info" Icon={IdentificationCard}>
            <dl className="unit-specs tm-d-identity">
              <DetailSpec label="Name" Icon={User} value={m.name} />
              <DetailSpec label="Email" Icon={EnvelopeSimple} value={m.email} />
              <DetailSpec label={`${m.idType ?? 'KTP'} number`} Icon={IdentificationCard} value={m.idNumber} />
              <DetailSpec label="Phone number" Icon={Phone} value={m.phone} />
              <DetailSpec label="Supporting file" Icon={Paperclip} value={m.supportingFile} />
            </dl>
          </DetailCard>

          <DetailCard title="Unit & Relation" Icon={Buildings}>
            {/* One two-column grid, so Unit, Tower, Relation and Member of all get the same width. */}
            <div className="tm-d-unitrel">
              <dl className="tm-d-cell"><DetailSpec label="Unit" Icon={House} value={m.unitCodes[0]} /></dl>
              <dl className="tm-d-cell"><DetailSpec label="Tower" Icon={Buildings} value={m.towers[0]} /></dl>
              <DetailRelation relation={m.relation} isProxy={Boolean(m.isProxy)} />
              <DetailPerson label="Member of" name={m.tenantName} role={m.parentRole} />
              {showOwner && <DetailPerson label="Unit owner" name={owner} role="Owner" />}
            </div>
          </DetailCard>

          {m.rentalPeriod && (
            <DetailCard title="Rent Details" Icon={CalendarBlank}>
              <dl className="unit-specs tm-d-rent">
                <DetailSpec label="Unit" Icon={House} value={m.unitCodes[0]} />
                <DetailSpec label="Rent period" Icon={CalendarBlank}>
                  <strong>{m.rentalPeriod}</strong><small>months</small>
                </DetailSpec>
                <DetailSpec label="Start rent" Icon={CalendarCheck} value={formatIsoDate(m.startRent)} />
                <DetailSpec label="Date out" Icon={CalendarCheck} value={m.endRentDate} />
              </dl>
            </DetailCard>
          )}
        </div>

        <div className="unit-d-side">
          <DetailCard
            title="Door Access"
            Icon={DoorOpen}
            aside={<span className="tm-d-count">{doors.length}</span>}
          >
            <DoorList doors={doors} />
          </DetailCard>
        </div>
      </div>
    </DetailPage>
  );
}

export default TenantMemberDetailView;
