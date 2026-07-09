import { Tag } from '@zendeskgarden/react-tags';

interface StatusTagProps {
  status: string;
}

function getStatusHue(status: string): string {
  switch (status.toLowerCase()) {
    case 'open':
      return 'blue';
    case 'pending':
      return 'yellow';
    case 'solved':
    case 'closed':
      return 'grey';
    default:
      return 'kale';
  }
}

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function StatusTag({ status }: StatusTagProps) {
  return (
    <Tag size="small" hue={getStatusHue(status)} isPill isRegular>
      {formatStatusLabel(status)}
    </Tag>
  );
}
