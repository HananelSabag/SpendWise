import '@testing-library/jest-dom';

// jsdom ships no matchMedia, but the app's stores probe it on import to detect the system
// theme — so any test that renders a component touching the stores dies before it starts.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
