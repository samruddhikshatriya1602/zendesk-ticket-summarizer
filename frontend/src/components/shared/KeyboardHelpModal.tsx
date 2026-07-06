import { useEffect, useRef } from 'react';

interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: '/', description: 'Focus search' },
  { keys: '?', description: 'Show keyboard shortcuts' },
  { keys: '↑ ↓', description: 'Move between tickets in the list' },
  { keys: 'Enter', description: 'Open the focused ticket' },
  { keys: 'Esc', description: 'Close this dialog or return to the ticket list' },
];

export function KeyboardHelpModal({ isOpen, onClose }: KeyboardHelpModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="keyboard-help-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="keyboard-help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-help-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="keyboard-help-modal__header">
          <h2 id="keyboard-help-title">Keyboard shortcuts</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="keyboard-help-modal__close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            ×
          </button>
        </div>

        <dl className="keyboard-help-modal__list">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.keys} className="keyboard-help-modal__item">
              <dt>
                <kbd>{shortcut.keys}</kbd>
              </dt>
              <dd>{shortcut.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
