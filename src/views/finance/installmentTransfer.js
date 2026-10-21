export function transferInstallmentAmount(plan, scheduleItems, sourcePeriod, targetPeriod, amount, createMonth) {
  const source = scheduleItems.find((item) => item.periodYyyyMm === sourcePeriod);
  const target = scheduleItems.find((item) => item.periodYyyyMm === targetPeriod);

  if (plan.status !== 'Active' || !source || source.status === 'PAID' || source.status === 'REJECTED') {
    throw new Error('This installment cannot be transferred.');
  }
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount >= source.amount) {
    throw new Error('Enter an amount smaller than the current installment.');
  }
  if (targetPeriod <= sourcePeriod || (createMonth ? Boolean(target) || scheduleItems.length >= 60 : !target || target.status === 'PAID' || target.status === 'REJECTED')) {
    throw new Error('Choose an available later month.');
  }

  const installments = scheduleItems.map((item) => ({ period: item.periodYyyyMm, amount: item.amount }));
  installments.find((item) => item.period === sourcePeriod).amount -= amount;
  if (createMonth) {
    installments.push({ period: targetPeriod, amount });
  } else {
    installments.find((item) => item.period === targetPeriod).amount += amount;
  }
  installments.sort((a, b) => a.period.localeCompare(b.period));

  const billedPeriod = scheduleItems.find((item) => item.status === 'UNPAID' && item.linkedInvoice)?.periodYyyyMm;
  return {
    ...plan,
    months: installments.length,
    scheduleMonths: installments.map((item) => item.period),
    scheduleAmounts: installments.map((item) => item.amount),
    paidInstallmentsCount: scheduleItems.filter((item) => item.status === 'PAID').length,
    billed: billedPeriod ? installments.find((item) => item.period === billedPeriod).amount : plan.billed
  };
}

export function requestInstallmentTransfer(plan, scheduleItems, sourcePeriod, targetPeriod, amount, createMonth) {
  if (plan.transferRequests?.some((request) => request.status === 'pending')) {
    throw new Error('Review the pending transfer request before submitting another.');
  }
  transferInstallmentAmount(plan, scheduleItems, sourcePeriod, targetPeriod, amount, createMonth);
  const requests = plan.transferRequests || [];
  return {
    ...plan,
    transferRequests: [...requests, {
      id: requests.length + 1,
      sourcePeriod,
      targetPeriod,
      amount,
      createMonth,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      approvals: { chiefFinance: 'pending', buildingManager: 'pending' }
    }]
  };
}

export function reviewInstallmentTransfer(plan, scheduleItems, requestId, role, decision, reason = '') {
  if (!['chiefFinance', 'buildingManager'].includes(role) || !['approved', 'rejected'].includes(decision)) {
    throw new Error('Invalid transfer review.');
  }
  const request = plan.transferRequests?.find((item) => item.id === requestId);
  if (!request || request.status !== 'pending' || request.approvals[role] !== 'pending') {
    throw new Error('This transfer request is no longer awaiting review.');
  }
  if (role === 'buildingManager' && request.approvals.chiefFinance !== 'approved') {
    throw new Error('Chief Finance must approve before Building Manager review.');
  }
  const approvals = { ...request.approvals, [role]: decision };
  const completed = approvals.chiefFinance === 'approved' && approvals.buildingManager === 'approved';
  const reviewedAt = new Date().toISOString();
  const updatedRequest = {
    ...request,
    approvals,
    status: decision === 'rejected' ? 'rejected' : completed ? 'approved' : 'pending',
    ...(decision === 'rejected' ? { rejectionReason: reason.trim() } : {}),
    [`${role}ReviewedAt`]: reviewedAt
  };
  const updatedPlan = completed
    ? transferInstallmentAmount(plan, scheduleItems, request.sourcePeriod, request.targetPeriod, request.amount, request.createMonth)
    : plan;
  return {
    ...updatedPlan,
    transferRequests: plan.transferRequests.map((item) => item.id === requestId ? updatedRequest : item)
  };
}
