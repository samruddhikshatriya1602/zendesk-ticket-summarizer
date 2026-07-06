import { Tag } from '@zendeskgarden/react-tags';

interface PriorityTagProps {
  priority: string | null;
}

function getPriorityHue(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return 'red';
    case 'high':
      return 'yellow';
    case 'normal':
      return 'blue';
    case 'low':
      return 'grey';
    default:
      return 'grey';
  }
}

function formatPriorityLabel(priority: string | null): string {
  if (!priority) {
    return 'None';
  }

  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function PriorityTag({ priority }: PriorityTagProps) {
  const hue = priority ? getPriorityHue(priority) : 'grey';

  return (
    <Tag size="small" hue={hue} isPill isRegular>
      {formatPriorityLabel(priority)}
    </Tag>
  );
}
