import { forwardRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar({ value, onChange }, ref) {
    return (
      <input
        ref={ref}
        type="search"
        className="list-search-input"
        placeholder="Search by subject or ID..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search tickets"
      />
    );
  }
);
