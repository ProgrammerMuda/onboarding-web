import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Trash,
  FileText,
  Clock,
  Hourglass,
  CheckCircle,
  XCircle,
  WarningCircle,
  Info,
  ShieldCheck,
  ArrowsClockwise,
  SlidersHorizontal,
  Warning,
  Check,
  X
} from '@phosphor-icons/react';
import { CalendarClock } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import '../employee/employee.css';
import '../employee/employee-detail.css';
import './installment-detail.css';
import ManageInstallmentView from './ManageInstallmentView';
import { reviewInstallmentTransfer } from './installmentTransfer';

const formatMoney = (val) =>
  val == null ? 'Rp 0' : `Rp ${Number(val).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;

const formatMonthName = (yyyyMm) => {
  if (!yyyyMm || typeof yyyyMm !== 'string') return '-';
  const parts = yyyyMm.split('-');
  if (parts.length < 2) return yyyyMm;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatBillingPeriodCode = (yyyyMm) => {
  if (!yyyyMm || typeof yyyyMm !== 'string') return '';
  const parts = yyyyMm.split('-');
  if (parts.length < 2) return yyyyMm;
  return `(${parts[1]}/${parts[0]})`;
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
};

const addMonthsToPeriod = (startPeriod, addCount) => {
  if (!startPeriod) return '';
  const [y, m] = startPeriod.split('-').map(Number);
  const totalMonths = y * 12 + (m - 1) + addCount;
  const newY = Math.floor(totalMonths / 12);
  const newM = (totalMonths % 12) + 1;
  return `${newY}-${String(newM).padStart(2, '0')}`;
};

export default function InstallmentDetailView({
  plan: initialPlan,
  onBack,
  onUpdatePlan,
  onDelete
}) {
  const [plan, setPlan] = useState(initialPlan);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showManagePage, setShowManagePage] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(
    Boolean(initialPlan?.deletionRequested || initialPlan?.status === 'Pending Deletion')
  );
  useEffect(() => {
    setPlan(initialPlan);
    if (initialPlan) {
      setDeleteRequested(Boolean(initialPlan.deletionRequested || initialPlan.status === 'Pending Deletion'));
    }
  }, [initialPlan]);

  // Building Manager Approval states & handlers
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessApproveModal, setShowSuccessApproveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);

  // Deletion Approval states & handlers
  const [showApproveDeletionModal, setShowApproveDeletionModal] = useState(false);
  const [showRejectDeletionModal, setShowRejectDeletionModal] = useState(false);
  const [showSuccessDeleteModal, setShowSuccessDeleteModal] = useState(false);
  const [rejectDeletionReason, setRejectDeletionReason] = useState('');
  const [reviewingTransfer, setReviewingTransfer] = useState(null);
  const [transferRejectReason, setTransferRejectReason] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(null);
  const transferReviewDialogRef = useRef(null);
  const transferSuccessDialogRef = useRef(null);
  useEffect(() => {
    if (reviewingTransfer && !transferReviewDialogRef.current?.open) transferReviewDialogRef.current?.showModal();
  }, [reviewingTransfer]);
  useEffect(() => {
    if (transferSuccess && !transferSuccessDialogRef.current?.open) transferSuccessDialogRef.current?.showModal();
  }, [transferSuccess]);

  // If no plan is passed, return empty fallback
  if (!plan) {
    return (
      <div className="inst-detail-container">
        <button type="button" className="inst-btn-back-bottom" onClick={onBack}>
          <ArrowLeft size={16} weight="bold" />
          Back to List
        </button>
        <p style={{ marginTop: '20px', color: '#64748b' }}>No installment plan data found.</p>
      </div>
    );
  }

  const count = plan.months || 1;
  const totalAmount = Number(plan.amount) || 0;
  const paidAmount = Number(plan.paid) || 0;
  const remainingUnpaid = Math.max(0, totalAmount - paidAmount);
  const monthlyAmount = Math.floor(totalAmount / count);
  const billedUnpaid = plan.billed != null ? Number(plan.billed) : (remainingUnpaid > 0 ? monthlyAmount : 0);

  // Progress
  const percentPaid = Math.min(100, Math.round((paidAmount / (totalAmount || 1)) * 100));
  const paidInstallmentsCount = Number.isInteger(plan.paidInstallmentsCount)
    ? Math.min(count, plan.paidInstallmentsCount)
    : plan.status === 'Completed'
    ? count
    : plan.status === 'Rejected' || plan.status === 'Pending Approval' || plan.status === 'Pending'
      ? 0
      : Math.min(count, Math.floor(paidAmount / (monthlyAmount || 1)));

  // Generate Schedule breakdown items
  const scheduleItems = (() => {
    const items = [];
    const basePeriods = plan.scheduleMonths && plan.scheduleMonths.length === count
      ? plan.scheduleMonths
      : Array.from({ length: count }, (_, idx) => addMonthsToPeriod(plan.start, idx));

    for (let i = 0; i < count; i++) {
      const isPaid = i < paidInstallmentsCount;
      const isLast = i === count - 1;
      const itemAmount = plan.scheduleAmounts?.length === count
        ? Number(plan.scheduleAmounts[i])
        : isLast ? totalAmount - monthlyAmount * (count - 1) : monthlyAmount;
      const periodYyyyMm = basePeriods[i] || addMonthsToPeriod(plan.start, i);

      let itemStatus = 'PENDING';
      let linkedInvoice = null;
      let linkedStatus = 'not_billed';

      if (plan.status === 'Completed') {
        itemStatus = 'PAID';
        linkedInvoice = plan.invoice;
        linkedStatus = 'settled';
      } else if (plan.status === 'Rejected') {
        itemStatus = 'REJECTED';
      } else if (plan.status === 'Pending Approval' || plan.status === 'Pending') {
        itemStatus = 'WAITING_APPROVAL';
        if (i === 0) {
          linkedInvoice = plan.invoice;
          linkedStatus = 'attached';
        }
      } else if (isPaid) {
        itemStatus = 'PAID';
        linkedInvoice = plan.invoice;
        linkedStatus = 'settled';
      } else {
        const isBilledNow = i === 0 || (i === paidInstallmentsCount && plan.billed);
        if (isBilledNow) {
          itemStatus = 'UNPAID';
          linkedInvoice = plan.invoice;
          linkedStatus = 'overdue';
        } else {
          itemStatus = 'UNBILLED';
          linkedInvoice = null;
          linkedStatus = 'not_billed';
        }
      }

      items.push({
        number: i + 1,
        revCode: `Rev ${i + 1}.1`,
        periodYyyyMm,
        periodLabel: formatMonthName(periodYyyyMm),
        periodCode: formatBillingPeriodCode(periodYyyyMm),
        amount: itemAmount,
        status: itemStatus,
        linkedInvoice,
        linkedStatus
      });
    }
    return items;
  })();

  // Overall schedule period range
  const firstPeriod = scheduleItems[0]?.periodLabel || '-';
  const lastPeriod = scheduleItems[scheduleItems.length - 1]?.periodLabel || '-';

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    setDeleteRequested(true);
    const updated = {
      ...plan,
      status: 'Pending Deletion',
      deletionRequested: true,
      deletionRequestedAt: new Date().toISOString(),
      chiefFinanceDeletionStatus: 'pending'
    };
    setPlan(updated);
    if (onUpdatePlan) {
      onUpdatePlan(updated);
    }
  };

  const isPendingPlan = plan.status === 'Pending Approval' || plan.status === 'Pending';
  const isDeletionPending = plan.status === 'Pending Deletion' || (deleteRequested && plan.chiefFinanceDeletionStatus !== 'rejected');
  const cfStatus = plan.chief_finance_status || (isPendingPlan ? 'approved' : 'approved');
  const bmStatus = plan.building_manager_status || (isPendingPlan ? 'pending' : 'approved');
  const isBmApprovalPending = !isDeletionPending && isPendingPlan && bmStatus === 'pending';
  const pendingTransfer = plan.transferRequests?.find((request) => request.status === 'pending');
  const transferReviewRole = pendingTransfer?.approvals.chiefFinance === 'approved'
    ? { key: 'buildingManager', label: 'Building Manager', step: 2 }
    : { key: 'chiefFinance', label: 'Chief Finance', step: 1 };
  const approvalRequestTimeline = [
    ...(deleteRequested || plan.deletionRequested || plan.status === 'Pending Deletion' ? [{ key: 'deletion', at: plan.deletionRequestedAt || '' }] : []),
    ...(plan.transferRequests || []).map((request) => ({ key: `transfer-${request.id}`, at: request.submittedAt || '' }))
  ].sort((a, b) => a.at.localeCompare(b.at) || a.key.localeCompare(b.key));
  const approvalRequestNumber = (key) => approvalRequestTimeline.findIndex((request) => request.key === key) + 2;
  const statusKey = isDeletionPending ? 'pending-deletion' : (plan.status || '').toLowerCase().replace(/\s+/g, '-');

  const handleApprovePlan = () => {
    const updated = {
      ...plan,
      building_manager_status: 'approved',
      status: cfStatus === 'approved' ? 'Active' : 'Pending Approval',
      bmApprovalDate: new Date().toISOString()
    };
    setPlan(updated);
    setShowApproveModal(false);
    setShowSuccessApproveModal(true);
    if (onUpdatePlan) {
      onUpdatePlan(updated);
    }
  };

  const handleRejectPlan = () => {
    const reasonText = rejectReason.trim() || 'Operational policy mismatch';
    const updated = {
      ...plan,
      building_manager_status: 'rejected',
      status: 'Rejected',
      rejectionReason: reasonText,
      bmApprovalDate: new Date().toISOString()
    };
    setPlan(updated);
    setShowRejectModal(false);
    setActionFeedback({
      type: 'danger',
      title: 'Plan Rejected',
      message: `Installment plan for Unit ${plan.unit} has been rejected by Building Manager: "${reasonText}".`
    });
    if (onUpdatePlan) {
      onUpdatePlan(updated);
    }
  };

  const handleApproveDeletion = () => {
    setShowApproveDeletionModal(false);
    setShowSuccessDeleteModal(true);
  };

  const handleRejectDeletion = () => {
    const reasonText = rejectDeletionReason.trim() || 'Plan termination rejected by Chief Finance';
    const updated = {
      ...plan,
      status: 'Active',
      deletionRequested: true,
      chiefFinanceDeletionStatus: 'rejected',
      deletionRejectReason: reasonText,
      deletionReviewedAt: new Date().toISOString()
    };
    setPlan(updated);
    setDeleteRequested(false);
    setShowRejectDeletionModal(false);
    setRejectDeletionReason('');
    setActionFeedback({
      type: 'danger',
      title: 'Deletion Request Rejected',
      message: `Deletion request for Unit ${plan.unit} was rejected: "${reasonText}". The installment plan remains ACTIVE.`
    });
    if (onUpdatePlan) {
      onUpdatePlan(updated);
    }
  };

  const submitTransferReview = () => {
    if (!reviewingTransfer || (reviewingTransfer.decision === 'rejected' && !transferRejectReason.trim())) return;
    try {
      const request = plan.transferRequests.find((item) => item.id === reviewingTransfer.requestId);
      const updated = reviewInstallmentTransfer(
        plan, scheduleItems, reviewingTransfer.requestId, reviewingTransfer.role,
        reviewingTransfer.decision, transferRejectReason
      );
      const reviewedRequest = updated.transferRequests.find((item) => item.id === reviewingTransfer.requestId);
      const completed = reviewedRequest.status === 'approved';
      setPlan(updated);
      onUpdatePlan?.(updated, completed
        ? 'Installment transfer approved. The schedule has been updated.'
        : 'Transfer review recorded.');
      if (completed) {
        setActionFeedback(null);
        setTransferSuccess({
          amount: request.amount,
          source: formatMonthName(request.sourcePeriod),
          destination: formatMonthName(request.targetPeriod),
          sourceAmount: updated.scheduleAmounts[updated.scheduleMonths.indexOf(request.sourcePeriod)],
          destinationAmount: updated.scheduleAmounts[updated.scheduleMonths.indexOf(request.targetPeriod)]
        });
      } else {
        setActionFeedback({
          type: reviewingTransfer.decision === 'rejected' ? 'danger' : 'success',
          title: reviewingTransfer.decision === 'rejected' ? 'Transfer Rejected' : 'Review Recorded',
          message: reviewingTransfer.decision === 'rejected'
            ? 'The installment schedule remains unchanged.'
            : 'The schedule remains unchanged until Building Manager approves.'
        });
      }
      transferReviewDialogRef.current?.close();
      setTransferRejectReason('');
    } catch (error) {
      setActionFeedback({ type: 'danger', title: 'Review could not be saved', message: error.message });
      transferReviewDialogRef.current?.close();
    }
  };

  if (showManagePage) {
    return (
      <ManageInstallmentView
        plan={plan}
        scheduleItems={scheduleItems}
        onRequestTransfer={(updatedPlan) => {
          setPlan(updatedPlan);
          onUpdatePlan?.(updatedPlan, `Transfer request for unit ${updatedPlan.unit} submitted for approval.`);
        }}
        onBack={() => setShowManagePage(false)}
        onList={onBack}
      />
    );
  }

  return (
    <div className="inst-detail-container">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        className="inst-detail-breadcrumb"
        items={[
          { label: 'Finance' },
          { label: 'Installments', onClick: onBack },
          { label: 'Installment Detail' }
        ]}
      />

      {/* Top Hero Banner matching Employee Detail View */}
      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          <div className="emp-hero-banner-left">
            <button
              type="button"
              className="emp-hero-back-btn"
              onClick={onBack}
              title="Return to Installments"
              aria-label="Return to Installments"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="emp-hero-banner-tag">FINANCE</div>
              <h1 className="emp-hero-banner-title">
                Installment Plan - {plan.unit}
              </h1>
              <p className="emp-hero-banner-desc">
                View detailed installment plan, billing schedule, payment progress, and approval workflow.
              </p>
            </div>
          </div>

          {/* Overall Status Badge & Primary Operational Action */}
          <div className="inst-hero-actions-wrap">
            <span className={`inst-hero-status-badge ${statusKey}`}>
              {isDeletionPending ? (
                <>
                  <Clock size={16} weight="bold" />
                  <span>Pending Deletion</span>
                </>
              ) : plan.status === 'Active' ? (
                <>
                  <ArrowsClockwise size={16} weight="bold" />
                  <span>Active Plan</span>
                </>
              ) : isBmApprovalPending ? (
                <>
                  <Clock size={16} weight="bold" />
                  <span>Pending BM Approval</span>
                </>
              ) : plan.status === 'Pending Approval' || plan.status === 'Pending' ? (
                <>
                  <Clock size={16} weight="bold" />
                  <span>Pending Approval</span>
                </>
              ) : plan.status === 'Completed' ? (
                <>
                  <CheckCircle size={16} weight="bold" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <XCircle size={16} weight="bold" />
                  <span>{plan.status || 'Rejected'}</span>
                </>
              )}
            </span>

            {plan.status === 'Active' && (
              <button
                type="button"
                className="inst-hero-manage-btn"
                onClick={() => setShowManagePage(true)}
                aria-label="Manage Installment Plan"
                title="Review installment schedule and payment actions"
              >
                <SlidersHorizontal size={16} weight="bold" />
                <span>Manage Plan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Feedback Banner (if user approved/rejected) */}
      {actionFeedback && (
        <div className={`inst-action-feedback-banner ${actionFeedback.type}`} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {actionFeedback.type === 'success' ? (
              <CheckCircle size={20} weight="fill" />
            ) : (
              <WarningCircle size={20} weight="fill" />
            )}
            <div>
              <strong>{actionFeedback.title}:</strong> {actionFeedback.message}
            </div>
          </div>
          <button
            type="button"
            className="inst-action-feedback-close"
            onClick={() => setActionFeedback(null)}
            aria-label="Close notification"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Contextual Action Alert Banner (Satu-satunya lokasi tombol aksi Approve / Reject di bawah Header) */}
      {isDeletionPending ? (
        <div className="inst-contextual-approval-banner deletion" role="region" aria-label="Plan Deletion Approval Action Banner">
          <div className="inst-contextual-banner-left">
            <div className="inst-contextual-banner-icon">
              <Warning size={24} weight="bold" />
            </div>
            <div className="inst-contextual-banner-text">
              <div className="inst-contextual-banner-title">
                <span>Action Required: Installment Plan Deletion Review</span>
                <span className="inst-contextual-banner-badge">Deletion Approval</span>
              </div>
              <p className="inst-contextual-banner-desc">
                Building Manager has requested deletion of this installment plan. Dual authorization is required to terminate this plan and restore the remaining unpaid balance of <strong>{formatMoney(remainingUnpaid)}</strong> to Invoice <strong>{plan.invoice}</strong>.
              </p>
            </div>
          </div>

          <div className="inst-contextual-banner-actions">
            <button
              type="button"
              className="inst-contextual-btn-reject"
              onClick={() => setShowRejectDeletionModal(true)}
              aria-label="Reject Plan Deletion"
            >
              <X size={15} weight="bold" />
              <span>Reject Deletion</span>
            </button>
            <button
              type="button"
              className="inst-contextual-btn-approve danger"
              onClick={() => setShowApproveDeletionModal(true)}
              aria-label="Approve Plan Deletion"
            >
              <Trash size={16} weight="bold" />
              <span>Approve Deletion</span>
            </button>
          </div>
        </div>
      ) : pendingTransfer ? (
        <div className="inst-contextual-approval-banner" role="region" aria-label="Transfer approval actions">
          <div className="inst-contextual-banner-left">
            <div className="inst-contextual-banner-icon"><ShieldCheck size={24} weight="bold" /></div>
            <div className="inst-contextual-banner-text">
              <div className="inst-contextual-banner-title">
                <span>Action Required: {transferReviewRole.label} Transfer Review</span>
                <span className="inst-contextual-banner-badge">Step {transferReviewRole.step} of 2</span>
              </div>
              <p className="inst-contextual-banner-desc">Review the transfer of <strong>{formatMoney(pendingTransfer.amount)}</strong> from {formatMonthName(pendingTransfer.sourcePeriod)} to {formatMonthName(pendingTransfer.targetPeriod)}. {transferReviewRole.step === 1 ? 'Chief Finance approval is required before Building Manager review.' : 'Chief Finance has approved. Building Manager approval will apply the transfer.'}</p>
            </div>
          </div>
          <div className="inst-contextual-banner-actions">
            <button type="button" className="inst-contextual-btn-reject" onClick={() => setReviewingTransfer({ requestId: pendingTransfer.id, role: transferReviewRole.key, label: transferReviewRole.label, decision: 'rejected' })}>
              <X size={15} weight="bold" /><span>Reject Transfer</span>
            </button>
            <button type="button" className="inst-contextual-btn-approve" onClick={() => setReviewingTransfer({ requestId: pendingTransfer.id, role: transferReviewRole.key, label: transferReviewRole.label, decision: 'approved' })}>
              <Check size={16} weight="bold" /><span>Approve Transfer</span>
            </button>
          </div>
        </div>
      ) : isBmApprovalPending ? (
        <div className="inst-contextual-approval-banner" role="region" aria-label="Building Manager Approval Action Banner">
          <div className="inst-contextual-banner-left">
            <div className="inst-contextual-banner-icon">
              <ShieldCheck size={24} weight="bold" />
            </div>
            <div className="inst-contextual-banner-text">
              <div className="inst-contextual-banner-title">
                <span>Action Required: Building Manager Review & Approval</span>
                <span className="inst-contextual-banner-badge">Step 2 of 2</span>
              </div>
              <p className="inst-contextual-banner-desc">
                Chief Finance has approved this installment plan. Your operational sign-off as <strong>Building Manager</strong> is required before invoices can be officially scheduled and billed.
              </p>
            </div>
          </div>

          <div className="inst-contextual-banner-actions">
            <button
              type="button"
              className="inst-contextual-btn-reject"
              onClick={() => setShowRejectModal(true)}
              aria-label="Reject Installment Plan"
            >
              <X size={15} weight="bold" />
              <span>Reject Plan</span>
            </button>
            <button
              type="button"
              className="inst-contextual-btn-approve"
              onClick={() => setShowApproveModal(true)}
              aria-label="Approve Installment Plan"
            >
              <Check size={16} weight="bold" />
              <span>Approve Plan</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* 3 Summary Metric Cards: Total Installment, Remaining Unpaid & Payment Progress, Approval Responsibility */}
      <div className="inst-detail-metrics-grid">
        {/* Metric 1: Total Installment */}
        <div className="inst-metric-card">
          <div className="inst-metric-label">TOTAL INSTALLMENT</div>
          <div className="inst-metric-value">{formatMoney(totalAmount)}</div>
          <div className="inst-metric-subtext">{count} Monthly Installments</div>
        </div>

        {/* Metric 2: Unified Remaining Unpaid & Payment Progress */}
        <div className="inst-metric-card">
          <div className="inst-metric-label">
            <span>REMAINING UNPAID</span>
            <span className={`inst-progress-pct-badge ${percentPaid === 0 ? 'zero' : ''}`}>
              {percentPaid}% paid
            </span>
          </div>

          <div className="inst-metric-progress-group">
            <div className="inst-metric-row-combined">
              <div className="inst-metric-value unpaid-red">{formatMoney(remainingUnpaid)}</div>
              <div className="inst-progress-count-tag">
                {paidInstallmentsCount} of {count} paid
              </div>
            </div>

            <div className="inst-progress-bar-wrap">
              <div className="inst-progress-bar-fill" style={{ width: `${percentPaid}%` }} />
            </div>
          </div>

          <div className="inst-metric-subtext-split">
            <span className="inst-subtext-paid">Paid: {formatMoney(paidAmount)}</span>
            <span className="inst-subtext-unpaid">Due This Month: {formatMoney(billedUnpaid)}</span>
          </div>
        </div>

        {/* Metric 3: Approval Responsibility (Purely Informational: Siapa saja pihak yang bertindak sebagai approver) */}
        <div className="inst-metric-card">
          <div className="inst-metric-label">
            <span>APPROVAL RESPONSIBILITY</span>
            <span className="inst-approver-count-tag">2 Approvers</span>
          </div>

          <div className="inst-approvers-info-list">
            {/* Approver 1: Chief Finance */}
            <div className="inst-approver-info-item">
              <span className="inst-approver-step-badge">1</span>
              <div className="inst-approver-info-body">
                <strong className="inst-approver-info-role">Chief Finance</strong>
                <span className="inst-approver-info-sub">Finance & Commercial Sign-off</span>
              </div>
            </div>

            {/* Approver 2: Building Manager */}
            <div className="inst-approver-info-item">
              <span className="inst-approver-step-badge">2</span>
              <div className="inst-approver-info-body">
                <strong className="inst-approver-info-role">Building Manager</strong>
                <span className="inst-approver-info-sub">Operations & Property Sign-off</span>
              </div>
            </div>
          </div>

          <div className="inst-metric-subtext">
            Multi-party approval required for this installment plan
          </div>
        </div>
      </div>

      {/* Installment Request Information Card (Full Width) */}
      <div className="inst-detail-card" style={{ marginBottom: '20px' }}>
        <div className="inst-detail-card-header">
          <div className="inst-card-icon-box secondary">
            <Info size={22} weight="bold" />
          </div>
          <h2 className="inst-detail-card-title">Installment Request Information</h2>
        </div>

        <dl className="inst-info-grid-full">
          <div>
            <dt>Unit</dt>
            <dd>
              <span className="inst-info-unit-badge">{plan.unit}</span>
            </dd>
          </div>

          <div>
            <dt>Original Invoice</dt>
            <dd>
              <span className="inst-info-invoice-link">
                <FileText size={15} weight="bold" />
                {plan.invoice}
              </span>
            </dd>
          </div>

          <div>
            <dt>Schedule Period</dt>
            <dd>{firstPeriod} – {lastPeriod}</dd>
          </div>

          <div>
            <dt>Duration</dt>
            <dd>{count} Months</dd>
          </div>

          <div>
            <dt>Requested By</dt>
            <dd>
              {plan.createdBy?.name || '-'}
              {plan.createdBy?.email ? (
                <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '6px' }}>
                  ({plan.createdBy.email})
                </span>
              ) : ''}
            </dd>
          </div>

          <div>
            <dt>Requested At</dt>
            <dd>{formatDate(plan.createdAt)} {formatTime(plan.createdAt)}</dd>
          </div>
        </dl>

        {/* Dedicated Notes Textarea Block below */}
        <div className="inst-notes-section">
          <label htmlFor="inst-plan-notes" className="inst-notes-label">
            Notes
          </label>
          <textarea
            id="inst-plan-notes"
            className="inst-notes-textarea"
            readOnly
            rows={3}
            value={plan.notes || '-'}
            placeholder="No additional notes provided"
          />
        </div>
      </div>

      {/* Main Card: Monthly Installment Schedule Table */}
      <div className="inst-schedule-card">
        <div className="inst-schedule-header">
          <div className="inst-schedule-header-left">
            <div className="inst-card-icon-box secondary">
              <CalendarClock size={22} strokeWidth={2.2} />
            </div>
            <h2 className="inst-schedule-title">Monthly Installment Schedule</h2>
          </div>
          <span className="inst-schedule-count-badge">
            {count} Installments
          </span>
        </div>

        <div className="inst-schedule-table-wrap">
          <table className="inst-schedule-table">
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                <th>BILLING PERIOD</th>
                <th>REVISION</th>
                <th>INSTALLMENT AMOUNT</th>
                <th>INSTALLMENT STATUS</th>
                <th>LINKED INVOICE & STATUS</th>
              </tr>
            </thead>
            <tbody>
              {scheduleItems.map((item) => (
                <tr key={item.number}>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                    {item.number}
                  </td>
                  <td>
                    <strong>{item.periodLabel}</strong>
                    <span className="inst-schedule-period-sub">{item.periodCode}</span>
                  </td>
                  <td>
                    <span className="inst-rev-badge">{item.revCode}</span>
                  </td>
                  <td>
                    <span className="inst-amount-col">{formatMoney(item.amount)}</span>
                  </td>
                  <td>
                    <span className={`inst-status-badge ${item.status.toLowerCase()}`}>
                      {item.status === 'PAID' ? (
                        <>
                          <CheckCircle size={13} weight="bold" />
                          PAID
                        </>
                      ) : item.status === 'WAITING_APPROVAL' ? (
                        <>
                          <Clock size={13} weight="bold" />
                          WAITING APPROVAL
                        </>
                      ) : item.status === 'REJECTED' ? (
                        <>
                          <XCircle size={13} weight="bold" />
                          REJECTED
                        </>
                      ) : item.status === 'UNPAID' ? (
                        <>
                          <Clock size={13} weight="bold" />
                          UNPAID
                        </>
                      ) : (
                        <>
                          <Hourglass size={13} weight="bold" />
                          UNBILLED
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    {item.linkedInvoice ? (
                      <div className="inst-linked-invoice-box">
                        <button
                          type="button"
                          className="inst-linked-invoice-num"
                          aria-label={`View linked invoice ${item.linkedInvoice}`}
                          title={`View invoice ${item.linkedInvoice}`}
                        >
                          <FileText size={14} weight="bold" />
                          <span>{item.linkedInvoice}</span>
                        </button>
                        {item.linkedStatus === 'overdue' && (
                          <span className="inst-tag-overdue">Invoice OVERDUE</span>
                        )}
                        {item.linkedStatus === 'settled' && (
                          <span className="inst-tag-settled">Settled</span>
                        )}
                        {item.linkedStatus === 'unpaid' && (
                          <span className="inst-tag-unpaid">Unpaid</span>
                        )}
                      </div>
                    ) : (
                      <span className="inst-tag-notbilled">Not yet billed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="inst-schedule-footer">
          <div className="inst-schedule-footer-left">
            <span className="inst-schedule-footer-label">Total Original Plan</span>
            <span className="inst-schedule-footer-total">{formatMoney(totalAmount)}</span>
          </div>
          <div className="inst-schedule-footer-right">
            <div className="inst-footer-stat-item">
              <span className="inst-footer-stat-label">Paid:</span>
              <span className="inst-footer-stat-value paid">{formatMoney(paidAmount)}</span>
            </div>
            <span className="inst-footer-stat-divider" aria-hidden="true">•</span>
            <div className="inst-footer-stat-item">
              <span className="inst-footer-stat-label">Remaining Unpaid:</span>
              <span className="inst-footer-stat-value unpaid">{formatMoney(remainingUnpaid)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Log Approval Card (Unified Per-Request View) */}
      <div className="inst-detail-card" style={{ marginBottom: '20px' }}>
        <div className="inst-detail-card-header">
          <div className="inst-card-icon-box secondary">
            <ShieldCheck size={22} weight="bold" />
          </div>
          <div>
            <h2 className="inst-detail-card-title" style={{ margin: 0 }}>
              Log Approval
            </h2>
            <p className="inst-approval-card-desc">
              Multi-party authorization history recorded per request.
            </p>
          </div>
        </div>

        <div className="inst-approval-requests-container">
          {/* Request 1: Plan Creation */}
          <div className="inst-approval-request-card">
            <div className="inst-approval-request-card-header">
              <div className="inst-approval-request-header-left">
                <span className="inst-approval-request-pill create">REQUEST #1 • PLAN CREATION</span>
                <h3 className="inst-approval-request-title">Installment Plan Creation Approval</h3>
              </div>
            </div>

            <div className="inst-approval-request-meta">
              <span>
                <strong>Submitted By:</strong> {plan.createdBy?.name || 'Building Manager'}
              </span>
              <span>•</span>
              <span>
                <strong>Requested At:</strong> {formatDate(plan.createdAt)} {formatTime(plan.createdAt)}
              </span>
            </div>

            <div className="inst-approval-log-list">
              {/* Approver 1: Chief Finance */}
              <div className="inst-approval-log-item">
                <div className="inst-approval-log-left">
                  <div className={`inst-approval-log-avatar ${cfStatus}`}>
                    {cfStatus === 'approved' ? (
                      <CheckCircle size={20} weight="fill" />
                    ) : cfStatus === 'rejected' ? (
                      <XCircle size={20} weight="fill" />
                    ) : (
                      <Clock size={20} weight="fill" />
                    )}
                  </div>
                  <div className="inst-approval-log-meta">
                    <div className="inst-approval-log-role">1. Chief Finance</div>
                    <div className="inst-approval-log-sub">
                      {cfStatus === 'approved'
                        ? `Approved on ${formatDate(plan.createdAt)} ${formatTime(plan.createdAt)}`
                        : 'Awaiting Chief Finance review & approval'}
                    </div>
                  </div>
                </div>

                <div className="inst-approval-log-right">
                  <span className={`inst-approval-status-pill ${cfStatus}`}>
                    {cfStatus === 'approved' ? (
                      <>
                        <Check size={13} weight="bold" />
                        Approved
                      </>
                    ) : cfStatus === 'rejected' ? (
                      <>
                        <X size={13} weight="bold" />
                        Rejected
                      </>
                    ) : (
                      <>
                        <Clock size={13} weight="bold" />
                        Pending Approval
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Approver 2: Building Manager */}
              <div className="inst-approval-log-item">
                <div className="inst-approval-log-left">
                  <div className={`inst-approval-log-avatar ${bmStatus}`}>
                    {bmStatus === 'approved' ? (
                      <CheckCircle size={20} weight="fill" />
                    ) : bmStatus === 'rejected' ? (
                      <XCircle size={20} weight="fill" />
                    ) : (
                      <Clock size={20} weight="fill" />
                    )}
                  </div>
                  <div className="inst-approval-log-meta">
                    <div className="inst-approval-log-role">2. Building Manager</div>
                    <div className="inst-approval-log-sub">
                      {bmStatus === 'approved'
                        ? `Approved by Building Manager (You) on ${formatDate(plan.bmApprovalDate || plan.createdAt)} ${formatTime(plan.bmApprovalDate || plan.createdAt)}`
                        : bmStatus === 'rejected'
                        ? `Rejected: "${plan.rejectionReason || 'Operational policy mismatch'}"`
                        : 'Awaiting your operational sign-off as Building Manager'}
                    </div>
                  </div>
                </div>

                <div className="inst-approval-log-right">
                  <span className={`inst-approval-status-pill ${bmStatus}`}>
                    {bmStatus === 'approved' ? (
                      <>
                        <Check size={13} weight="bold" />
                        Approved
                      </>
                    ) : bmStatus === 'rejected' ? (
                      <>
                        <X size={13} weight="bold" />
                        Rejected
                      </>
                    ) : (
                      <>
                        <Clock size={13} weight="bold" />
                        Pending Approval
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Request 2: Plan Deletion Request (Appears dynamically if deletion is requested) */}
          {(deleteRequested || plan.deletionRequested || plan.status === 'Pending Deletion') && (
            <div className="inst-approval-request-card deletion">
              <div className="inst-approval-request-card-header">
                <div className="inst-approval-request-header-left">
                  <span className="inst-approval-request-pill delete">REQUEST #{approvalRequestNumber('deletion')} • PLAN DELETION</span>
                  <h3 className="inst-approval-request-title">Plan Deletion & Invoice Restoration Request</h3>
                </div>
              </div>

              <div className="inst-approval-request-meta">
                <span>
                  <strong>Submitted By:</strong> Building Manager (You)
                </span>
                <span>•</span>
                <span>
                  <strong>Requested At:</strong> {formatDate(plan.deletionRequestedAt || new Date().toISOString())} {formatTime(plan.deletionRequestedAt || new Date().toISOString())}
                </span>
              </div>

              <div className="inst-approval-log-list">
                {/* Approver 1: Building Manager */}
                <div className="inst-approval-log-item">
                  <div className="inst-approval-log-left">
                    <div className="inst-approval-log-avatar approved">
                      <CheckCircle size={20} weight="fill" />
                    </div>
                    <div className="inst-approval-log-meta">
                      <div className="inst-approval-log-role">1. Building Manager (You)</div>
                      <div className="inst-approval-log-sub">
                        Deletion request initiated on {formatDate(plan.deletionRequestedAt || new Date().toISOString())} {formatTime(plan.deletionRequestedAt || new Date().toISOString())}
                      </div>
                    </div>
                  </div>
                  <div className="inst-approval-log-right">
                    <span className="inst-approval-status-pill approved">
                      <Check size={13} weight="bold" />
                      Requested
                    </span>
                  </div>
                </div>

                {/* Approver 2: Chief Finance */}
                <div className="inst-approval-log-item">
                  <div className="inst-approval-log-left">
                    <div className={`inst-approval-log-avatar ${plan.chiefFinanceDeletionStatus === 'rejected' ? 'rejected' : plan.chiefFinanceDeletionStatus === 'approved' ? 'approved' : 'pending'}`}>
                      {plan.chiefFinanceDeletionStatus === 'rejected' ? (
                        <XCircle size={20} weight="fill" />
                      ) : plan.chiefFinanceDeletionStatus === 'approved' ? (
                        <CheckCircle size={20} weight="fill" />
                      ) : (
                        <Clock size={20} weight="fill" />
                      )}
                    </div>
                    <div className="inst-approval-log-meta">
                      <div className="inst-approval-log-role">2. Chief Finance</div>
                      <div className="inst-approval-log-sub">
                        {plan.chiefFinanceDeletionStatus === 'rejected'
                          ? `Rejected: "${plan.deletionRejectReason || 'Terminating plan was rejected'}"`
                          : plan.chiefFinanceDeletionStatus === 'approved'
                          ? `Approved on ${formatDate(plan.deletionReviewedAt)} ${formatTime(plan.deletionReviewedAt)}`
                          : 'Awaiting review & sign-off to terminate plan and restore balance'}
                      </div>
                    </div>
                  </div>
                  <div className="inst-approval-log-right">
                    <span className={`inst-approval-status-pill ${plan.chiefFinanceDeletionStatus === 'rejected' ? 'rejected' : plan.chiefFinanceDeletionStatus === 'approved' ? 'approved' : 'pending'}`}>
                      {plan.chiefFinanceDeletionStatus === 'rejected' ? (
                        <>
                          <X size={13} weight="bold" />
                          Rejected
                        </>
                      ) : plan.chiefFinanceDeletionStatus === 'approved' ? (
                        <>
                          <Check size={13} weight="bold" />
                          Approved
                        </>
                      ) : (
                        <>
                          <Clock size={13} weight="bold" />
                          Pending Approval
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {plan.transferRequests?.map((request) => (
            <div className="inst-approval-request-card" key={`transfer-${request.id}`}>
              <div className="inst-approval-request-card-header">
                <div className="inst-approval-request-header-left">
                  <span className="inst-approval-request-pill manage">REQUEST #{approvalRequestNumber(`transfer-${request.id}`)} • TRANSFER</span>
                  <h3 className="inst-approval-request-title">Installment Transfer Approval</h3>
                </div>
              </div>
              <div className="inst-approval-request-meta inst-transfer-request-summary">
                <span><strong>From:</strong> {formatMonthName(request.sourcePeriod)}</span>
                <span><strong>To:</strong> {formatMonthName(request.targetPeriod)}{request.createMonth ? ' (new month)' : ''}</span>
                <span><strong>Amount:</strong> {formatMoney(request.amount)}</span>
                <span><strong>Requested:</strong> {formatDate(request.submittedAt)} {formatTime(request.submittedAt)}</span>
              </div>
              {request.status === 'rejected' && request.rejectionReason && <p className="inst-transfer-rejection">Reason: {request.rejectionReason}</p>}
              <div className="inst-approval-log-list">
                {[
                  { key: 'chiefFinance', label: 'Chief Finance' },
                  { key: 'buildingManager', label: 'Building Manager' }
                ].map(({ key, label }) => {
                  const approvalStatus = request.approvals[key];
                  return <div className="inst-approval-log-item" key={key}>
                    <div className="inst-approval-log-left">
                      <div className={`inst-approval-log-avatar ${approvalStatus}`}>
                        {approvalStatus === 'approved' ? <CheckCircle size={20} weight="fill" /> : approvalStatus === 'rejected' ? <XCircle size={20} weight="fill" /> : <Clock size={20} weight="fill" />}
                      </div>
                      <div className="inst-approval-log-meta">
                        <div className="inst-approval-log-role">{label}</div>
                        <div className="inst-approval-log-sub">{approvalStatus === 'pending' ? 'Awaiting review' : `${approvalStatus === 'approved' ? 'Approved' : 'Rejected'} on ${formatDate(request[`${key}ReviewedAt`])} ${formatTime(request[`${key}ReviewedAt`])}`}</div>
                      </div>
                    </div>
                    <div className="inst-transfer-review-actions">
                      <span className={`inst-approval-status-pill ${approvalStatus}`}>{approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'rejected' ? 'Rejected' : 'Pending Approval'}</span>
                    </div>
                  </div>;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Deletion Policy (Danger Zone) */}
      <div className="inst-governance-card">
        <div className="inst-governance-header">
          <div className="inst-governance-header-left">
            <div className="inst-card-icon-box secondary" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}>
              <Warning size={22} weight="bold" />
            </div>
            <div>
              <h2 className="inst-detail-card-title">Plan Deletion Policy</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Irreversible Administrative Action</span>
            </div>
          </div>
        </div>

        <div className="inst-governance-body">
          <p className="inst-governance-desc">
            Terminating this plan requires dual authorization (Chief Finance & Building Manager). Once approved, all remaining scheduled installments will be cancelled, and the unpaid balance will be restored to original invoice <strong>{plan.invoice}</strong>.
          </p>

          <div className="inst-governance-actions">
            <button
              type="button"
              className="inst-btn-delete-request"
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeletionPending || Boolean(pendingTransfer)}
              aria-label="Request Delete Plan"
            >
              <Trash size={16} weight="bold" />
              <span>{isDeletionPending ? 'Deletion Pending Approval' : pendingTransfer ? 'Transfer Pending Approval' : 'Request Delete Plan'}</span>
            </button>
          </div>
        </div>
      </div>


      <dialog ref={transferReviewDialogRef} className="inst-transfer-review-dialog" aria-labelledby="transfer-review-title" onClose={() => { setReviewingTransfer(null); setTransferRejectReason(''); }}>
        <div className="emp-modal-header">
          <h3 className="emp-modal-title" id="transfer-review-title">{reviewingTransfer?.decision === 'approved' ? 'Approve' : 'Reject'} Transfer Request</h3>
          <button type="button" className="emp-modal-close" aria-label="Close review" onClick={() => transferReviewDialogRef.current?.close()}><X size={18} /></button>
        </div>
        <div className="emp-modal-body">
          <p className="inst-transfer-review-copy">Review as <strong>{reviewingTransfer?.label}</strong>. The installment schedule changes only after both Chief Finance and Building Manager approve.</p>
          {reviewingTransfer?.decision === 'rejected' && <div className="inst-transfer-review-field">
            <label htmlFor="transfer-reject-reason">Reason for rejection <span aria-hidden="true">*</span></label>
            <textarea id="transfer-reject-reason" value={transferRejectReason} onChange={(event) => setTransferRejectReason(event.target.value)} rows={3} placeholder="Explain why this transfer cannot be approved" />
          </div>}
        </div>
        <div className="emp-modal-footer">
          <button type="button" className="emp-btn-secondary" onClick={() => transferReviewDialogRef.current?.close()}>Cancel</button>
          <button type="button" className={reviewingTransfer?.decision === 'rejected' ? 'inst-transfer-review-reject' : 'inst-transfer-review-approve'} disabled={reviewingTransfer?.decision === 'rejected' && !transferRejectReason.trim()} onClick={submitTransferReview}>Confirm {reviewingTransfer?.decision === 'approved' ? 'Approval' : 'Rejection'}</button>
        </div>
      </dialog>

      <dialog ref={transferSuccessDialogRef} className="inst-transfer-success-dialog" aria-labelledby="approved-transfer-title" onClose={() => setTransferSuccess(null)}>
        <div className="inst-transfer-success-content">
          <div className="inst-transfer-success-icon"><CheckCircle size={30} weight="fill" /></div>
          <h3 id="approved-transfer-title">Transfer successful</h3>
          <p>Chief Finance and Building Manager approved the transfer. The installment schedule has been updated.</p>
          <dl className="inst-transfer-success-details">
            <div><dt>Amount transferred</dt><dd>{formatMoney(transferSuccess?.amount)}</dd></div>
            <div><dt>{transferSuccess?.source} installment</dt><dd>{formatMoney(transferSuccess?.sourceAmount)}</dd></div>
            <div><dt>{transferSuccess?.destination} installment</dt><dd>{formatMoney(transferSuccess?.destinationAmount)}</dd></div>
          </dl>
          <button type="button" className="inst-transfer-success-action" onClick={() => { transferSuccessDialogRef.current?.close(); setTransferSuccess(null); setShowManagePage(true); }}>View Manage Plan</button>
        </div>
      </dialog>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Warning size={22} weight="bold" />
              </div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Request Delete Installment Plan?
              </h3>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Are you sure you want to request deletion of Installment Plan <strong>#{plan.id}</strong> for Unit <strong>{plan.unit}</strong>? This action will notify approvers and revert <strong>{formatMoney(remainingUnpaid)}</strong> back to Invoice <strong>{plan.invoice}</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #dc2626',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={handleDeleteConfirm}
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approve-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px'
          }}
          onClick={() => setShowApproveModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <CheckCircle size={24} weight="bold" />
              </div>
              <div>
                <h3 id="approve-modal-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  Approve Installment Plan?
                </h3>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Authorize operational activation for Unit {plan.unit}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>Unit & Invoice</span>
                  <strong style={{ color: '#0f172a' }}>{plan.unit} • {plan.invoice}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>Total Plan Amount</span>
                  <strong style={{ color: '#0f172a' }}>{formatMoney(totalAmount)}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>Duration</span>
                  <strong style={{ color: '#0f172a' }}>{count} Monthly Installments</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>Chief Finance Review</span>
                  <strong style={{ color: '#16a34a' }}>✓ Approved</strong>
                </div>
              </div>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              By confirming approval as <strong>Building Manager</strong>, this installment plan will transition to <strong>Active</strong>. Monthly invoices will be billed according to the schedule.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: '1px solid #16a34a',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(22, 163, 74, 0.28)'
                }}
                onClick={handleApprovePlan}
              >
                <Check size={16} weight="bold" />
                Yes, Approve Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Creation Approval Modal */}
      {showSuccessApproveModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-approve-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px'
          }}
          onClick={() => setShowSuccessApproveModal(false)}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px 24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onClick={() => setShowSuccessApproveModal(false)}
              aria-label="Close"
              title="Close notification"
            >
              <X size={18} weight="bold" />
            </button>

            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#16a34a',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.1)'
              }}
            >
              <CheckCircle size={32} weight="fill" />
            </div>

            <h3
              id="success-approve-modal-title"
              style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}
            >
              Installment Plan Approved
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Installment plan for Unit <strong>{plan.unit}</strong> has been officially approved by Building Manager and is now <strong>ACTIVE</strong>.
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                textAlign: 'left',
                marginBottom: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12.5px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Plan Reference:</span>
                <strong style={{ color: '#0f172a' }}>Plan #{plan.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Target Unit:</span>
                <strong style={{ color: '#0f172a' }}>Unit {plan.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Installment:</span>
                <strong style={{ color: '#0f172a' }}>{formatMoney(totalAmount)} ({count} Months)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Plan Status:</span>
                <strong style={{ color: '#16a34a', fontWeight: 700 }}>Active Plan</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px'
          }}
          onClick={() => {
            setShowRejectModal(false);
            setRejectReason('');
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Warning size={24} weight="bold" />
              </div>
              <div>
                <h3 id="reject-modal-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  Reject Installment Plan?
                </h3>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  State the operational reason for rejecting Unit {plan.unit}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="bm-reject-reason"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
              >
                Rejection Reason <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                id="bm-reject-reason"
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                placeholder="e.g. Duration exceeds building standard policy, pending lease renewal, or tenant requested recalculation..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {[
                  'Exceeds 12-month policy limit',
                  'Prior dues pending settlement',
                  'Tenant requested revised terms'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                    onClick={() => setRejectReason(preset)}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #dc2626',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={handleRejectPlan}
              >
                <X size={15} weight="bold" />
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Deletion Confirmation Modal */}
      {showApproveDeletionModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approve-deletion-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px'
          }}
          onClick={() => setShowApproveDeletionModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Trash size={22} weight="bold" />
              </div>
              <div>
                <h3 id="approve-deletion-modal-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  Approve Plan Deletion?
                </h3>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Final authorization for Installment Plan #{plan.id} • Unit {plan.unit}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                marginBottom: '18px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Impact Summary
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#7f1d1d', lineHeight: 1.6 }}>
                <li>Installment plan will be <strong>permanently removed</strong> from the system.</li>
                <li>Remaining unpaid balance of <strong>{formatMoney(remainingUnpaid)}</strong> will be restored to Invoice <strong>{plan.invoice}</strong>.</li>
                <li>Future billing schedules for this plan will be cancelled.</li>
              </ul>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to approve this deletion? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setShowApproveDeletionModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: '1px solid #dc2626',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(220, 38, 38, 0.28)'
                }}
                onClick={handleApproveDeletion}
              >
                <Trash size={16} weight="bold" />
                Yes, Delete & Restore Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Deletion Modal */}
      {showRejectDeletionModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-deletion-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px'
          }}
          onClick={() => {
            setShowRejectDeletionModal(false);
            setRejectDeletionReason('');
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Warning size={24} weight="bold" />
              </div>
              <div>
                <h3 id="reject-deletion-modal-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  Reject Plan Deletion?
                </h3>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  State the reason for rejecting deletion of Unit {plan.unit}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="del-reject-reason"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
              >
                Rejection Reason <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                id="del-reject-reason"
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                placeholder="e.g. Agreement already signed with tenant, ongoing payment verification in progress..."
                value={rejectDeletionReason}
                onChange={(e) => setRejectDeletionReason(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {[
                  'Payment verification underway',
                  'Agreement active & signed',
                  'Need prior reconciliation'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                    onClick={() => setRejectDeletionReason(preset)}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setShowRejectDeletionModal(false);
                  setRejectDeletionReason('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #dc2626',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={handleRejectDeletion}
              >
                <X size={15} weight="bold" />
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Deletion Modal */}
      {showSuccessDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-deletion-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px'
          }}
          onClick={() => {
            setShowSuccessDeleteModal(false);
            if (onDelete) onDelete(plan);
          }}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px 24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onClick={() => {
                setShowSuccessDeleteModal(false);
                if (onDelete) onDelete(plan);
              }}
              aria-label="Close"
              title="Close and return to list"
            >
              <X size={18} weight="bold" />
            </button>

            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#16a34a',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.1)'
              }}
            >
              <CheckCircle size={32} weight="fill" />
            </div>

            <h3
              id="success-deletion-modal-title"
              style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}
            >
              Installment Plan Deleted
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Installment plan for Unit <strong>{plan.unit}</strong> has been successfully approved for deletion and permanently removed.
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                textAlign: 'left',
                marginBottom: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12.5px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Plan Reference:</span>
                <strong style={{ color: '#0f172a' }}>Plan #{plan.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Target Unit:</span>
                <strong style={{ color: '#0f172a' }}>Unit {plan.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Restored to Invoice:</span>
                <strong style={{ color: '#0369a1' }}>{plan.invoice}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Restored Balance:</span>
                <strong style={{ color: '#16a34a', fontWeight: 700 }}>{formatMoney(remainingUnpaid)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
