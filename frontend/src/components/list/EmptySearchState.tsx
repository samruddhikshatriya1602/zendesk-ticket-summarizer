interface EmptySearchStateProps {
    onClear: () => void;
  }
  
  export function EmptySearchState({ onClear }: EmptySearchStateProps) {
    return (
      <div className="empty-search-state">
        <strong>No tickets match</strong>
        <p>Try a different search term or clear your filters.</p>
        <button type="button" className="empty-search-state__button" onClick={onClear}>
          Clear search and filters
        </button>
      </div>
    );
  }
