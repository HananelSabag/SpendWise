import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BottomSheet from '../BottomSheet';

vi.mock('../../../stores', () => ({
  useTranslation: () => ({ t: (key, options) => options?.fallback ?? key, isRTL: false }),
}));

/**
 * The sheet pushes a history entry so the Android back gesture closes it
 * instead of leaving the app. Retracting that entry is the delicate half: the
 * effect's cleanup runs on ANY unmount, and an unconditional `history.back()`
 * there walked the browser off the page under the user — reported as the
 * grocery list's share sheet "crashing the page" on a phone.
 */
describe('BottomSheet history handling', () => {
  let back;

  beforeEach(() => {
    back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const open = (props = {}) => render(
    <BottomSheet isOpen onClose={() => {}} title="Sheet" {...props}>
      <p>body</p>
    </BottomSheet>
  );

  it('pushes a tagged entry when it opens', () => {
    open();
    expect(window.history.state?.bottomSheet).toMatch(/^sheet_/);
  });

  it('retracts its own entry on a deliberate close', () => {
    const view = open();
    view.rerender(
      <BottomSheet isOpen={false} onClose={() => {}} title="Sheet"><p>body</p></BottomSheet>
    );
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('leaves history alone when something else navigated while it was open', () => {
    const view = open();

    // A navigation (or another sheet) replaced the entry this one pushed.
    window.history.pushState({ somethingElse: true }, '');

    view.unmount();

    expect(back).not.toHaveBeenCalled();
  });

  it('does not retract twice when the back gesture already closed it', () => {
    const onClose = vi.fn();
    const view = render(
      <BottomSheet isOpen onClose={onClose} title="Sheet"><p>body</p></BottomSheet>
    );

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onClose).toHaveBeenCalled();

    view.rerender(
      <BottomSheet isOpen={false} onClose={onClose} title="Sheet"><p>body</p></BottomSheet>
    );

    expect(back).not.toHaveBeenCalled();
  });
});
