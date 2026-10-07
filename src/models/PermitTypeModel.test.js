import { describe, expect, it } from 'vitest';
import { getNextPermitReset, validatePermitType, INITIAL_PERMIT_TYPES } from './PermitTypeModel';

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
