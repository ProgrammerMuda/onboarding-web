import { describe, it, expect } from 'vitest';
import { validateDivision, DEFAULT_DIVISIONS, getNextDivisionCode } from './DivisionModel';

describe('DivisionModel', () => {
  it('defaults to an empty division list', () => {
    expect(DEFAULT_DIVISIONS).toEqual([]);
  });

  it('generates sequential primary key codes (001, 002, 003)', () => {
    expect(getNextDivisionCode([])).toBe('001');
    expect(getNextDivisionCode([{ code: '001', name: 'Ops' }])).toBe('002');
    expect(getNextDivisionCode([
      { code: '001', name: 'Ops' },
      { code: '002', name: 'Technical' }
    ])).toBe('003');
  });

  it('handles existing alphanumeric codes and skips collisions', () => {
    expect(getNextDivisionCode([{ code: 'OPS', name: 'Ops' }])).toBe('001');
    expect(getNextDivisionCode([
      { code: 'OPS', name: 'Ops' },
      { code: '001', name: 'Cleaning' }
    ])).toBe('002');
  });

  it('validates required code and length limits', () => {
    expect(validateDivision({ code: '', name: 'Operations' })).toBe('Division code is required.');
    expect(validateDivision({ code: 'A', name: 'Operations' })).toBe('Division code must be between 2 and 8 characters.');
    expect(validateDivision({ code: 'TOOLONGCODE', name: 'Operations' })).toBe('Division code must be between 2 and 8 characters.');
  });

  it('validates required name and length limits', () => {
    expect(validateDivision({ code: 'OPS', name: '' })).toBe('Division name is required.');
    expect(validateDivision({ code: 'OPS', name: 'A'.repeat(61) })).toBe('Division name must be 60 characters or fewer.');
  });

  it('prevents duplicate codes and names', () => {
    const existing = [
      { id: 'div-1', code: 'OPS', name: 'Operations' }
    ];

    expect(validateDivision({ id: 'div-2', code: 'ops', name: 'New Division' }, existing))
      .toBe('Division code "OPS" is already in use.');

    expect(validateDivision({ id: 'div-2', code: 'NEW', name: 'operations' }, existing))
      .toBe('Division name "operations" is already in use.');

    // Updating existing division itself should pass
    expect(validateDivision({ id: 'div-1', code: 'OPS', name: 'Operations' }, existing)).toBe('');
  });
});
