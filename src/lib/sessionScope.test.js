import { describe, it, expect } from 'vitest';
import { visibleRows, isRowVisible, ANONYMOUS_OWNER } from './sessionScope';

describe('sessionScope', () => {
  const rows = [{ id: 1 }, { id: 2 }];

  it('shows rows that belong to the signed-in account', () => {
    expect(isRowVisible('user-b', 'user-b')).toBe(true);
    expect(visibleRows(rows, 'user-b', 'user-b')).toBe(rows);
  });

  it('hides rows that belong to a different account', () => {
    expect(isRowVisible('user-b', 'user-c')).toBe(false);
    expect(visibleRows(rows, 'user-b', 'user-c')).toEqual([]);
  });

  it('hides a signed-out account\'s rows once the session ends', () => {
    // Signed out -> currentOwner is null.
    expect(isRowVisible('user-b', null)).toBe(false);
    expect(visibleRows(rows, 'user-b', null)).toEqual([]);
  });

  it('shows anonymous rows (sample data) to anyone', () => {
    expect(ANONYMOUS_OWNER).toBeNull();
    expect(isRowVisible(null, null)).toBe(true);
    expect(isRowVisible(null, 'user-b')).toBe(true);
    expect(visibleRows(rows, null, 'user-b')).toBe(rows);
  });

  it('shows a signed-out account\'s rows again when that account signs back in', () => {
    expect(visibleRows(rows, 'user-b', 'user-b')).toBe(rows);
  });
});
