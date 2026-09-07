import { useEffect, useState } from 'react';

/**
 * How many pixels of the viewport the on-screen keyboard is covering.
 *
 * Needed because a `position: fixed` bar docked to the bottom of the screen is
 * anchored to the LAYOUT viewport, and the keyboard does not shrink that — it
 * shrinks the VISUAL viewport. So the bar ends up behind the keyboard, and the
 * browser, trying to reveal the input the user just tapped, scrolls the whole
 * document instead. On the grocery list that threw the page to the very bottom
 * on every tap of the add field, which is how it was reported.
 *
 * Lifting the bar by this value puts it above the keyboard where the browser
 * can see it, so there is nothing left for it to scroll to.
 *
 * Returns 0 where `visualViewport` is unavailable, which is also the correct
 * answer on a desktop with no on-screen keyboard.
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const update = () => {
      // What the layout viewport has that the visual one does not: the keyboard,
      // plus any browser chrome that slid in. Small values are that chrome, not
      // a keyboard, so they are ignored rather than nudging the bar around.
      const covered = window.innerHeight - (viewport.height + viewport.offsetTop);
      setInset(covered > 120 ? Math.round(covered) : 0);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}

export default useKeyboardInset;
