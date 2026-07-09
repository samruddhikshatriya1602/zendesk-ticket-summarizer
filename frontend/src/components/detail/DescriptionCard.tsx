import { useState } from 'react';

const TRUNCATE_LENGTH = 200;

interface DescriptionCardProps {
  description: string;
}

export function DescriptionCard({ description }: DescriptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const trimmed = description.trim();
  const needsTruncation = trimmed.length > TRUNCATE_LENGTH;

  const displayText =
    !needsTruncation || isExpanded
      ? trimmed
      : `${trimmed.slice(0, TRUNCATE_LENGTH).trimEnd()}…`;

  return (
    <section
      className="description-card"
      aria-labelledby="ticket-description-heading"
    >
      <h3 id="ticket-description-heading" className="description-card__heading">
        Description
      </h3>

      <div className="description-card__body">
        {trimmed.length === 0 ? (
          <p className="description-card__empty">No description provided.</p>
        ) : (
          <>
            <p className="description-card__text">{displayText}</p>

            {needsTruncation && (
              <button
                type="button"
                className="description-card__toggle"
                onClick={() => setIsExpanded((current) => !current)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? 'Show less' : 'Show full description'}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}