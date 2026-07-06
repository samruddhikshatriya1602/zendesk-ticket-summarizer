import { ErrorAlert } from './ErrorAlert';

interface ListErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ListErrorBanner({ message, onRetry }: ListErrorBannerProps) {
  return (
    <div className="list-error-banner" role="alert">
      <div className="list-error-banner__content">
        <ErrorAlert title="Couldn't load tickets" message={message} />
        <button
          type="button"
          className="list-error-banner__retry"
          onClick={onRetry}
        >
          Try again
        </button>
      </div>
    </div>
  );
}