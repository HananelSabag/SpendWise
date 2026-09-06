/**
 * Family Hub access list.
 *
 * The Family Hub holds one household's private planning data — salaries,
 * standing charges, pensions, debts. It is not a per-user feature: everyone on
 * this list sees and edits the SAME rows, which is the entire point (two people
 * filling in one picture together).
 *
 * That makes the list itself the security boundary, so it lives in one place and
 * is checked in exactly one middleware (`middleware/familyAccess.js`). Adding
 * someone here grants full read/write access to the household's finances — never
 * add anyone to "let them take a look".
 *
 * ── Why account IDs and not email addresses ──────────────────────────────────
 * The list is by `users.id` on purpose: this file is committed to a public
 * repository, and the members are a private household, not a company. An account
 * id is meaningless outside this database; a personal address is not, and once
 * pushed it is in the history for good. Nothing in this repo should ever hard-code
 * one.
 *
 * Both env vars below are overrides for another deployment (or for moving the
 * household to different accounts) and are read from the environment only —
 * `FAMILY_HUB_USER_IDS` ("1,44") and, if addresses really are the more convenient
 * handle somewhere, `FAMILY_HUB_EMAILS`. Set them in the host's environment
 * (Render / a local `.env`), never in a tracked file.
 */

const DEFAULT_MEMBER_IDS = [1, 44];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const parseList = (raw) => String(raw || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

/** Account ids allowed in. Env wins when set, so a fork can hand it its own. */
const memberIds = () => {
  const configured = parseList(process.env.FAMILY_HUB_USER_IDS)
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
  return configured.length ? configured : [...DEFAULT_MEMBER_IDS];
};

/** Extra addresses allowed in. Empty unless the environment supplies them. */
const memberEmails = () => parseList(process.env.FAMILY_HUB_EMAILS).map(normalizeEmail);

/**
 * Is this account allowed into the household's data?
 * Accepts the request's user object — an id match is enough, an env-supplied
 * address is the alternative.
 */
const isFamilyMember = (user) => {
  if (!user) return false;
  const id = Number(user.id);
  if (Number.isInteger(id) && id > 0 && memberIds().includes(id)) return true;

  const email = normalizeEmail(user.email);
  return !!email && memberEmails().includes(email);
};

module.exports = { isFamilyMember, memberIds, memberEmails, normalizeEmail };
