/**
 * Whether the long-press hint still needs to be on screen.
 *
 * A long-press is not a gesture anyone discovers on their own, so the list
 * teaches it once at the top. But a tip that never leaves is just a line of
 * permanent clutter on the screen where vertical space is scarcest — and it
 * keeps teaching something the user has already learned. So the hint retires
 * itself the first time somebody actually performs the gesture.
 *
 * Per browser, not per account: it is about what this person's hands know, and
 * a failed read (private mode, cleared storage) just shows the tip again, which
 * is the harmless direction to be wrong in.
 */

const KEY = 'sw_grocery_gesture_seen';
const EVENT = 'grocery:gesture-learned';

export const hasLearnedGesture = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

/** Called by a row when its long-press fires. Idempotent. */
export const markGestureLearned = () => {
  if (hasLearnedGesture()) return;
  try {
    localStorage.setItem(KEY, '1');
  } catch { /* private mode — the hint simply stays */ }
  try {
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch { /* no window (tests) */ }
};

/** Subscribe to the moment it is learned, so the hint can leave immediately. */
export const onGestureLearned = (handler) => {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};
