import { describe, expect, it } from 'vitest';
import { getNextPermitReset, validatePermitType, INITIAL_PERMIT_TYPES, calculateHolidayImpact, buildApprovalChain, getCurrentApprovalStep, INITIAL_ADJUSTMENTS, createInitialBalances } from './PermitTypeModel';

describe('Permit reset calendar in Jakarta', () => {
  it.each([
    ['daily', '2026-10-07T12:00:00+07:00', '2026-10-07T17:00:00.000Z'],
    ['weekly', '2026-10-07T12:00:00+07:00', '2026-10-11T17:00:00.000Z'],
    ['weekly', '2026-10-12T00:00:00+07:00', '2026-10-18T17:00:00.000Z'],
    ['monthly', '2026-12-31T23:59:00+07:00', '2026-12-31T17:00:00.000Z'],
    ['quarterly', '2026-10-07T12:00:00+07:00', '2026-12-31T17:00:00.000Z'],
    ['semiannual', '2026-02-07T12:00:00+07:00', '2026-06-30T17:00:00.000Z'],
    ['annual', '2026-10-07T12:00:00+07:00', '2026-12-31T17:00:00.000Z'],
    ['daily', '2028-02-28T18:00:00Z', '2028-02-29T17:00:00.000Z'],
  ])('%s reset follows calendar boundaries at %s', (frequency, now, expected) => {
    expect(getNextPermitReset(frequency, new Date(now)).toISOString()).toBe(expected);
  });
  it('does not schedule a reset without a frequency', () => {
    expect(getNextPermitReset(null)).toBeNull();
  });
});

describe('Allowed permit dates', () => {
  it.each(['past', 'future', 'both'])('accepts %s for limited and unlimited permits', (allowedDates) => {
    for (const hasQuota of [true, false]) {
      expect(validatePermitType({ ...INITIAL_PERMIT_TYPES[0], allowedDates, hasQuota }, [])).toBe('');
    }
  });
  it('rejects an unsupported date policy', () => {
    expect(validatePermitType({ ...INITIAL_PERMIT_TYPES[0], allowedDates: 'invalid' }, [])).toBeTruthy();
  });
});

describe('Supporting document policy', () => {
  it('requires documents for every leave type', () => {
    expect(validatePermitType({ ...INITIAL_PERMIT_TYPES[0], requiresDocument: 'none' }, [])).toBeTruthy();
    expect(validatePermitType({ ...INITIAL_PERMIT_TYPES[0], requiresDocument: 'duration_exceeded' }, [])).toBeTruthy();
    expect(validatePermitType(INITIAL_PERMIT_TYPES[0], [])).toBe('');
  });
});

describe('Leave category entitlements', () => {
  it('accepts only the three supported categories', () => {
    expect(validatePermitType({ ...INITIAL_PERMIT_TYPES[0], category: 'other' }, [])).toBeTruthy();
  });
  it('requires a positive annual allowance', () => {
    expect(validatePermitType({ ...INITIAL_PERMIT_TYPES[0], quota: '' }, [])).toBeTruthy();
  });
  it('requires a per-event duration for special leave', () => {
    const special = { ...INITIAL_PERMIT_TYPES[1], eventDurationDays: '' };
    expect(validatePermitType(special, [])).toBeTruthy();
    expect(validatePermitType({ ...special, eventDurationDays: 3 }, [])).toBe('');
  });
  it('does not require a quota for unpaid leave', () => {
    expect(validatePermitType(INITIAL_PERMIT_TYPES.find((item) => item.category === 'unpaid'), [])).toBe('');
  });
});

describe('Collective leave department scope', () => {
  const employees = [
    { id: 'e1', departmentId: 'dept-eng' },
    { id: 'e2', departmentId: 'dept-eng' },
    { id: 'e3', departmentId: 'dept-fin' }
  ];

  it('covers every employee when scope is all departments', () => {
    const impact = calculateHolidayImpact({ isCutiBersama: true, treatment: 'deduct_annual', scope: 'all' }, employees);
    expect(impact.affectedEmployeesCount).toBe(3);
    expect(impact.totalDaysDeducted).toBe(3);
  });

  it('only counts employees in the selected departments', () => {
    const impact = calculateHolidayImpact(
      { isCutiBersama: true, treatment: 'deduct_annual', scope: 'departments', scopeValue: ['dept-eng'] },
      employees
    );
    expect(impact.affectedEmployeesCount).toBe(2);
    expect(impact.totalDaysDeducted).toBe(2);
  });

  it('does not deduct balances for a company holiday', () => {
    const impact = calculateHolidayImpact(
      { isCutiBersama: true, treatment: 'free_leave', scope: 'departments', scopeValue: ['dept-fin'] },
      employees
    );
    expect(impact.affectedEmployeesCount).toBe(1);
    expect(impact.totalDaysDeducted).toBe(0);
  });
});

describe('Balance adjustment approval chain', () => {
  it('needs only the Building Manager when HR files the request', () => {
    expect(buildApprovalChain('hr').map((step) => step.role)).toEqual(['bm']);
  });

  it('needs only the Building Manager when Building Service files the request', () => {
    expect(buildApprovalChain('bs').map((step) => step.role)).toEqual(['bm']);
  });

  it('needs HR first, then the Building Manager, when the employee files it', () => {
    expect(buildApprovalChain('employee').map((step) => step.role)).toEqual(['hr', 'bm']);
  });

  it('points at the first step that is still pending', () => {
    const ticket = { status: 'pending', approvalChain: buildApprovalChain('employee') };
    expect(getCurrentApprovalStep(ticket).role).toBe('hr');

    ticket.approvalChain[0].status = 'approved';
    expect(getCurrentApprovalStep(ticket).role).toBe('bm');
  });

  it('has no current step once the ticket is closed', () => {
    expect(getCurrentApprovalStep({ status: 'approved', approvalChain: [{ role: 'bm', status: 'approved' }] })).toBeNull();
  });

  it('seeds a ticket waiting on the Building Manager after HR approved', () => {
    const seeded = INITIAL_ADJUSTMENTS.find((ticket) => ticket.id === 'adj-001');
    expect(getCurrentApprovalStep(seeded).role).toBe('bm');
  });
});

describe('Sample balances', () => {
  it('includes employees with a negative available balance', () => {
    const balances = createInitialBalances();
    const negative = balances.filter((item) => item.available < 0).map((item) => [item.employeeId, item.available]);
    expect(negative).toEqual([['emp-004', -3], ['emp-007', -1]]);
  });

  it('keeps the ledger running balance in line with available', () => {
    const overdrawn = createInitialBalances().find((item) => item.employeeId === 'emp-004');
    expect(overdrawn.ledger[0].balanceAfter).toBeLessThanOrEqual(overdrawn.baseEntitlement);
    expect(overdrawn.ledger.at(-1).balanceAfter).toBe(overdrawn.available);
  });
});

describe('Sample adjustment tickets', () => {
  it('has enough tickets to fill more than one page, covering every status and requester', () => {
    expect(INITIAL_ADJUSTMENTS.length).toBeGreaterThan(8);
    expect(new Set(INITIAL_ADJUSTMENTS.map((ticket) => ticket.status))).toEqual(new Set(['pending', 'approved', 'rejected']));
    expect(new Set(INITIAL_ADJUSTMENTS.map((ticket) => ticket.requesterRole))).toEqual(new Set(['hr', 'bs', 'employee']));
  });

  it('keeps ids unique and balances consistent with the amount', () => {
    expect(new Set(INITIAL_ADJUSTMENTS.map((ticket) => ticket.id)).size).toBe(INITIAL_ADJUSTMENTS.length);
    INITIAL_ADJUSTMENTS.forEach((ticket) => {
      const delta = ticket.type === 'add' ? ticket.amount : -ticket.amount;
      expect(ticket.afterBalance).toBe(ticket.beforeBalance + delta);
    });
  });

  it('keeps each ticket status in line with its approval steps', () => {
    INITIAL_ADJUSTMENTS.forEach((ticket) => {
      const statuses = ticket.approvalChain.map((step) => step.status);
      if (ticket.status === 'approved') expect(statuses.every((status) => status === 'approved')).toBe(true);
      if (ticket.status === 'rejected') expect(statuses).toContain('rejected');
      if (ticket.status === 'pending') expect(statuses).toContain('pending');
    });
  });

  it('lets only employees skip straight to a two-step chain', () => {
    INITIAL_ADJUSTMENTS.forEach((ticket) => {
      expect(ticket.approvalChain.length).toBe(ticket.requesterRole === 'employee' ? 2 : 1);
    });
  });
});

describe('Ledger and adjustments stay in sync', () => {
  const balances = createInitialBalances();

  it('puts every approved adjustment into its employee ledger', () => {
    INITIAL_ADJUSTMENTS.filter((ticket) => ticket.status === 'approved').forEach((ticket) => {
      const ledger = balances.find((item) => item.employeeId === ticket.employeeId).ledger;
      const entry = ledger.find((row) => row.ticketId === ticket.id);
      expect(entry).toBeTruthy();
      expect(entry.amount).toBe(ticket.type === 'add' ? ticket.amount : -ticket.amount);
    });
  });

  it('does not put open or rejected tickets in a ledger', () => {
    const ticketIds = balances.flatMap((item) => item.ledger.map((row) => row.ticketId).filter(Boolean));
    INITIAL_ADJUSTMENTS.filter((ticket) => ticket.status !== 'approved').forEach((ticket) => {
      expect(ticketIds).not.toContain(ticket.id);
    });
  });

  it('keeps entries in date order with a running balance that ends at available', () => {
    balances.forEach((item) => {
      const dates = item.ledger.map((row) => row.date);
      expect(dates).toEqual([...dates].sort());
      expect(item.ledger.at(-1).balanceAfter).toBe(item.available);
      expect(item.ledger.reduce((sum, row) => sum + row.amount, 0)).toBe(item.available);
    });
  });

  it('reconciles the summary: entitlement + carry-over - used - collective + adjustments = available', () => {
    balances.forEach((item) => {
      expect(item.baseEntitlement + item.carryOver - item.usedLeave - item.cutiBersamaDeduction + item.adjustmentTotal).toBe(item.available);
    });
  });

  it('shows approved tickets the same before/after balance the ledger reaches', () => {
    INITIAL_ADJUSTMENTS.filter((ticket) => ticket.status === 'approved').forEach((ticket) => {
      const row = balances.find((item) => item.employeeId === ticket.employeeId).ledger.find((entry) => entry.ticketId === ticket.id);
      expect(row.balanceAfter).toBe(ticket.afterBalance);
    });
  });
});

describe('Ledger history length', () => {
  const lengths = createInitialBalances().map((item) => item.ledger.length);

  it('has employees with more than 5 entries, so the ledger paginates', () => {
    expect(lengths.some((count) => count > 5)).toBe(true);
  });

  it('also has short histories that fit on one page', () => {
    expect(lengths.some((count) => count <= 5)).toBe(true);
  });
});
