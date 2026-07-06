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
    <div aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height={lineHeight}
          style={{ marginBottom: '0.75rem' }}
        />
      ))}
    </div>
  );
}
