import { describe, expect, it } from 'vitest';
import { INITIAL_POSITIONS, ancestors, descendants, isValidPositionData, normalizePositionHierarchy, validatePosition, validatePositionRemoval, getNextPositionCode, formatPositionNameWithDivision } from './PositionModel';

const SAMPLE_POSITIONS = [
  { id: 'bm', code: '001', name: 'Building Manager', parentIds: [] },
  { id: 'chief', code: '002', name: 'Chief', parentIds: ['bm'] },
  { id: 'spv', code: '003', name: 'Supervisor', parentIds: ['chief'] },
  { id: 'staff', code: '004', name: 'Staff', parentIds: ['spv'] },
];

describe('position hierarchy integrity', () => {
  it('generates sequential position codes (001, 002, 003)', () => {
    expect(getNextPositionCode([])).toBe('001');
    expect(getNextPositionCode([{ code: '001', name: 'BM' }])).toBe('002');
    expect(getNextPositionCode([{ id: 'bm', name: 'Building Manager' }])).toBe('002');
    expect(getNextPositionCode(SAMPLE_POSITIONS)).toBe('005');
  });
  it('derives all superiors and descendants across branches', () => {
    expect(ancestors(SAMPLE_POSITIONS, 'staff').map((item) => item.id)).toEqual(['spv', 'chief', 'bm']);
    expect([...descendants(SAMPLE_POSITIONS, 'chief')].sort()).toEqual(['spv', 'staff']);
    expect(ancestors(SAMPLE_POSITIONS, 'bm')).toEqual([]);
  });

  it('rejects self references, cycles and missing parents', () => {
    for (const parentId of ['chief', 'staff', 'missing']) {
      expect(validatePosition({ id: 'chief', name: 'Chief', parentIds: [parentId] }, SAMPLE_POSITIONS)).not.toBe('');
    }
    expect(validatePosition({ id: 'staff', name: 'Staff', parentIds: ['spv'] }, SAMPLE_POSITIONS)).toBe('');
  });

  it('rejects duplicate and blank names and additional root positions', () => {
    expect(validatePosition({ name: ' Building Manager ', parentIds: [] }, SAMPLE_POSITIONS)).not.toBe('');
    expect(validatePosition({ name: '  ', parentIds: [] }, SAMPLE_POSITIONS)).not.toBe('');
    expect(validatePosition({ id: 'new', name: 'New Role', parentIds: [] }, SAMPLE_POSITIONS)).not.toBe('');
    expect(validatePosition({ id: 'chief', name: 'Chief Security', parentIds: ['bm'] }, SAMPLE_POSITIONS)).toBe('');
  });

  it('validates position hierarchy structure', () => {
    expect(isValidPositionData(SAMPLE_POSITIONS)).toBe(true);
    expect(isValidPositionData(INITIAL_POSITIONS)).toBe(true);
    expect(isValidPositionData([])).toBe(false);
  });

  it('allows renaming the top position but prevents deletion and assigning a superior', () => {
    expect(validatePosition({ id: 'bm', name: 'Director', parentIds: [] }, SAMPLE_POSITIONS)).toBe('');
    expect(validatePosition({ id: 'bm', name: 'Director', parentIds: ['chief'] }, SAMPLE_POSITIONS)).not.toBe('');
    expect(validatePositionRemoval(SAMPLE_POSITIONS[0], SAMPLE_POSITIONS)).not.toBe('');
    expect(validatePositionRemoval(SAMPLE_POSITIONS[3], SAMPLE_POSITIONS)).toBe('');
  });

  it('normalizes position hierarchy properly', () => {
    const raw = [{ id: 'bm', name: 'Building Manager', parentIds: [] }, { id: 'staff', name: 'Staff' }];
    const normalized = normalizePositionHierarchy(raw);
    expect(isValidPositionData(normalized)).toBe(true);
    expect(normalized.find((item) => item.id === 'staff').parentIds).toEqual(['bm']);
  });

  it('formats position name with division correctly and prevents duplicates', () => {
    expect(formatPositionNameWithDivision('Staff', 'Security')).toBe('Staff Security');
    expect(formatPositionNameWithDivision('Supervisor', 'Engineering')).toBe('Supervisor Engineering');
    expect(formatPositionNameWithDivision('Staff Security', 'Security')).toBe('Staff Security');
    expect(formatPositionNameWithDivision('Staff', '')).toBe('Staff');
    expect(formatPositionNameWithDivision('', 'Security')).toBe('');
  });
});
