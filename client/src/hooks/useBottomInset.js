import { useEffect, useState } from 'react';

/**
 * Publish how much of the bottom of the screen a fixed element covers, as a CSS
 * custom property on the root element.
 *
 * Anything anchored to the bottom of the viewport — the navigation bar, the
 * grocery list's quick-add composer — is invisible to the normal-flow content
 * it sits over. Every consumer used to guess: 84px here, 112px there, 80px of
 * padding somewhere else. The guesses were wrong by a few pixels, drifted when
 * padding changed, and could never account for the safe-area inset on a real
 * phone. Two separate overlaps were reported from a phone before this existed.
 *
 * The measurement is the union of the element and its children, so a control
 * that protrudes ABOVE its container — the centre button in full SpendWise
 * mode's nav — is included without anyone having to know about it.
 *
 * Returns a CALLBACK ref, not a ref object, deliberately: a ref object does not
 * re-render, so an element that appears later (after a page's loading skeleton,
 * say) would never be measured — the effect would have run once against `null`
 * and published zero forever.
 *
 * @param {string} property   e.g. '--sw-bottom-nav-height'
 * @returns {(node: HTMLElement | null) => void} ref callback for the element
 */
export function useBottomInset(property) {
  const [node, setNode] = useState(null);

  useEffect(() => {
    if (!node) {
      document.documentElement.style.setProperty(property, '0px');
      return undefined;
    }

    const publish = () => {
      const rects = [node, ...node.querySelectorAll('*')]
        .map((element) => element.getBoundingClientRect())
        // A hidden element reports an all-zero rect, whose top of 0 would
        // otherwise claim this covers the entire screen.
        .filter((rect) => rect.width > 0 && rect.height > 0);

      const height = rects.length === 0
        ? 0
        : Math.max(0, Math.round(window.innerHeight - Math.min(...rects.map((r) => r.top))));

      document.documentElement.style.setProperty(property, `${height}px`);
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    window.addEventListener('resize', publish);
    window.addEventListener('orientationchange', publish);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', publish);
      window.removeEventListener('orientationchange', publish);
      document.documentElement.style.removeProperty(property);
    };
  }, [node, property]);

  return setNode;
}

export default useBottomInset;
