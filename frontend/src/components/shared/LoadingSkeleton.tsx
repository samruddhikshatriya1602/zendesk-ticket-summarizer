// LoadingSkeleton.tsx — pulsing placeholder bars while content is loading.
// Parent decides when to show it (e.g. TicketListPanel when useTickets.loading is true).

import { Skeleton } from '@zendeskgarden/react-loaders';

interface LoadingSkeletonProps {
  lines?: number;
  lineHeight?: string;
}

export function LoadingSkeleton({
  lines = 3,
  lineHeight = '12px',
}: LoadingSkeletonProps) {
  return (
    // Decorative only — parent sets aria-busy; screen readers skip these bars.
    <div aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          // Shorter last line looks more natural (ticket list uses lines={10} lineHeight="40px").
          width={index === lines - 1 ? '60%' : '100%'}
          height={lineHeight}
          style={{ marginBottom: '0.75rem' }}
        />
      ))}
    </div>
  );
}
