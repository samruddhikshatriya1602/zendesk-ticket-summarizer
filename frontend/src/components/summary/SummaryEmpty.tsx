interface SummaryEmptyProps {
    onGenerate: () => void;
    disabled?: boolean;
  }
  
  export function SummaryEmpty({ onGenerate, disabled = false }: SummaryEmptyProps) {
    return (
      <div className="summary-empty">
        <p className="summary-empty__text">No summary yet for this ticket.</p>
        <button
          type="button"
          className="summary-empty__button"
          onClick={onGenerate}
          disabled={disabled}
        >
          Generate Summary
        </button>
      </div>
    );
  }