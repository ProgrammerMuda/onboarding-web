import { describe, expect, it } from 'vitest';
import { requestInstallmentTransfer, reviewInstallmentTransfer, transferInstallmentAmount } from './installmentTransfer';

const plan = { status: 'Active', amount: 3000, paid: 1000, billed: 1000, months: 3, start: '2026-02' };
const schedule = [
  { periodYyyyMm: '2026-02', amount: 1000, status: 'PAID', linkedInvoice: 'INV-1' },
  { periodYyyyMm: '2026-03', amount: 1000, status: 'UNPAID', linkedInvoice: 'INV-1' },
  { periodYyyyMm: '2026-04', amount: 1000, status: 'UNBILLED', linkedInvoice: null }
];

describe('installment transfers', () => {
  it('moves an amount to an existing month while keeping the plan total', () => {
    const updated = transferInstallmentAmount(plan, schedule, '2026-03', '2026-04', 400, false);
    expect(updated.scheduleAmounts).toEqual([1000, 600, 1400]);
    expect(updated.scheduleAmounts.reduce((sum, amount) => sum + amount, 0)).toBe(plan.amount);
    expect(updated.billed).toBe(600);
    expect(updated.paidInstallmentsCount).toBe(1);
  });

  it('adds a new month in date order without changing paid installments', () => {
    const updated = transferInstallmentAmount(plan, schedule, '2026-03', '2026-05', 250, true);
    expect(updated.scheduleMonths).toEqual(['2026-02', '2026-03', '2026-04', '2026-05']);
    expect(updated.scheduleAmounts).toEqual([1000, 750, 1000, 250]);
    expect(updated.months).toBe(4);
    expect(updated.paidInstallmentsCount).toBe(1);
  });

  it('rejects a full transfer and a paid destination', () => {
    expect(() => transferInstallmentAmount(plan, schedule, '2026-03', '2026-04', 1000, false)).toThrow();
    expect(() => transferInstallmentAmount(plan, schedule, '2026-03', '2026-02', 100, false)).toThrow();
  });

  it('keeps the schedule unchanged until Chief Finance and Building Manager both approve', () => {
    const requested = requestInstallmentTransfer(plan, schedule, '2026-03', '2026-04', 400, false);
    expect(requested.scheduleAmounts).toBeUndefined();
    expect(requested.transferRequests[0].status).toBe('pending');
    expect(() => requestInstallmentTransfer(requested, schedule, '2026-03', '2026-04', 100, false)).toThrow();

    const financeApproved = reviewInstallmentTransfer(requested, schedule, 1, 'chiefFinance', 'approved');
    expect(financeApproved.scheduleAmounts).toBeUndefined();
    expect(financeApproved.transferRequests[0].status).toBe('pending');

    const fullyApproved = reviewInstallmentTransfer(financeApproved, schedule, 1, 'buildingManager', 'approved');
    expect(fullyApproved.scheduleAmounts).toEqual([1000, 600, 1400]);
    expect(fullyApproved.transferRequests[0].status).toBe('approved');
  });

  it('leaves the schedule unchanged when either approver rejects', () => {
    const requested = requestInstallmentTransfer(plan, schedule, '2026-03', '2026-05', 250, true);
    const financeApproved = reviewInstallmentTransfer(requested, schedule, 1, 'chiefFinance', 'approved');
    const rejected = reviewInstallmentTransfer(financeApproved, schedule, 1, 'buildingManager', 'rejected', 'Incorrect month');
    expect(rejected.scheduleMonths).toBeUndefined();
    expect(rejected.transferRequests[0].status).toBe('rejected');
    expect(rejected.transferRequests[0].rejectionReason).toBe('Incorrect month');
    expect(() => reviewInstallmentTransfer(rejected, schedule, 1, 'buildingManager', 'approved')).toThrow();
  });

  it('requires Chief Finance approval before Building Manager can review a new-month transfer', () => {
    const requested = requestInstallmentTransfer(plan, schedule, '2026-03', '2026-05', 250, true);
    expect(() => reviewInstallmentTransfer(requested, schedule, 1, 'buildingManager', 'approved')).toThrow('Chief Finance must approve');
    const financeApproved = reviewInstallmentTransfer(requested, schedule, 1, 'chiefFinance', 'approved');
    expect(financeApproved.scheduleMonths).toBeUndefined();
    const approved = reviewInstallmentTransfer(financeApproved, schedule, 1, 'buildingManager', 'approved');
    expect(approved.scheduleMonths).toEqual(['2026-02', '2026-03', '2026-04', '2026-05']);
    expect(approved.scheduleAmounts).toEqual([1000, 750, 1000, 250]);
  });
});
