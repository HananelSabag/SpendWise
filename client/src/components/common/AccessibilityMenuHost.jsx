import React, { useCallback, useEffect, useState } from 'react';
import AccessibilityMenu from './AccessibilityMenu';

export const ACCESSIBILITY_MENU_EVENT = 'open-accessibility';

export const openAccessibilityMenu = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ACCESSIBILITY_MENU_EVENT));
  }
};

const AccessibilityMenuHost = () => {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(ACCESSIBILITY_MENU_EVENT, open);
    return () => window.removeEventListener(ACCESSIBILITY_MENU_EVENT, open);
  }, []);

  return <AccessibilityMenu isOpen={isOpen} onClose={close} />;
};

export default AccessibilityMenuHost;
