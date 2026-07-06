import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ColumnFilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterableColumnHeaderProps<T extends string> {
  label: string;
  value: T;
  defaultValue: T;
  options: ColumnFilterOption<T>[];
  onChange: (value: T) => void;
  openMenu: string | null;
  onOpenMenu: (menuId: string | null) => void;
}

export function FilterableColumnHeader<T extends string>({
  label,
  value,
  defaultValue,
  options,
  onChange,
  openMenu,
  onOpenMenu,
}: FilterableColumnHeaderProps<T>) {
  const menuId = useId();
  const isOpen = openMenu === menuId;
  const isActive = value !== defaultValue;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom - 1,
        left: rect.left + rect.width / 2,
        minWidth: Math.max(rect.width, 180),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }

      onOpenMenu(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenMenu]);

  return (
    <th scope="col" className="ticket-table__filter-header">
      <button
        ref={triggerRef}
        type="button"
        className={`ticket-table__filter-trigger${
          isActive ? ' is-active' : ''
        }${isOpen ? ' is-open' : ''}`}
        onClick={() => onOpenMenu(isOpen ? null : menuId)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        <span>{label}</span>
        <span className="ticket-table__filter-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="ticket-table__filter-menu"
            style={menuStyle}
            role="listbox"
            aria-label={`${label} filter options`}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={value === option.value}
                className={
                  value === option.value
                    ? 'ticket-table__filter-option is-selected'
                    : 'ticket-table__filter-option'
                }
                onClick={() => {
                  onChange(option.value);
                  onOpenMenu(null);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </th>
  );
}
