import { useEffect, type RefObject } from 'react';
import { isTypingTarget } from '../utils/isTypingTarget';

interface UseKeyboardShortcutsOptions {
  searchInputRef: RefObject<HTMLInputElement | null>;
  helpOpen: boolean;
  onOpenHelp: () => void;
  onCloseHelp: () => void;
  onBackToList?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  searchInputRef,
  helpOpen,
  onOpenHelp,
  onCloseHelp,
  onBackToList,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (helpOpen) {
        if (event.key === 'Escape') {
          event.preventDefault();
          onCloseHelp();
        }
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        onOpenHelp();
        return;
      }

      if (event.key === 'Escape') {
        onBackToList?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    helpOpen,
    onBackToList,
    onCloseHelp,
    onOpenHelp,
    searchInputRef,
  ]);
}
