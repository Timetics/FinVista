/**
 * Ownership rules for the transaction rows shown in the UI.
 *
 * Rows loaded from Supabase belong to a specific account. The UI must never
 * keep showing one account's financial data after that account's session ends,
 * so the visible rows are derived from the current session rather than cleared
 * imperatively.
 */

/** Rows produced in an anonymous session, e.g. the built-in sample data. */
export const ANONYMOUS_OWNER = null;

/**
 * May these rows be shown to the session identified by `currentOwner`?
 *
 * @param {string|null} rowsOwner    the account the rows belong to
 * @param {string|null} currentOwner the account that is signed in now
 */
export const isRowVisible = (rowsOwner, currentOwner) =>
  rowsOwner === ANONYMOUS_OWNER || rowsOwner === currentOwner;

/**
 * Filter the rows down to the ones the current session may see.
 *
 * @param {Array} rows
 * @param {string|null} rowsOwner
 * @param {string|null} currentOwner
 */
export const visibleRows = (rows, rowsOwner, currentOwner) =>
  isRowVisible(rowsOwner, currentOwner) ? rows : [];
