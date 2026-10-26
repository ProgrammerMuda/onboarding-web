import { describe, expect, it } from 'vitest';
import { getNextPermitReset, validatePermitType, INITIAL_PERMIT_TYPES, calculateHolidayImpact } from './PermitTypeModel';

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
