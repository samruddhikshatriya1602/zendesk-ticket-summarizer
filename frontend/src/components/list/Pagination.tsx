interface PaginationProps {
    page: number;
    hasMore: boolean;
    onPrev: () => void;
    onNext: () => void;
  }
  
  export function Pagination({
    page,
    hasMore,
    onPrev,
    onNext,
  }: PaginationProps) {
    return (
      <nav className="list-pagination" aria-label="Ticket list pagination">
        <button
          type="button"
          className="list-pagination__button"
          onClick={onPrev}
          disabled={page <= 1}
        >
          Prev
        </button>
  
        <span className="list-pagination__page" aria-current="page">
          Page {page}
        </span>
  
        <button
          type="button"
          className="list-pagination__button"
          onClick={onNext}
          disabled={!hasMore}
        >
          Next
        </button>
      </nav>
    );
}