export function formatRelativeDate(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
  
    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }
  
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'just now';
  
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
  
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
  
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
  
    // Older than a week — show short date instead of "45d ago"
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
  
  export function formatFullDate(isoDate: string): string {
    const date = new Date(isoDate);
  
    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }
  
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }