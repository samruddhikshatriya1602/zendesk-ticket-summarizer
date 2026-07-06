import { Alert } from '@zendeskgarden/react-notifications';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({
  title = 'Something went wrong',
  message,
  onDismiss,
}: ErrorAlertProps) {
  return (
    <Alert type="error" role="alert">
      <Alert.Title>{title}</Alert.Title>
      <Alert.Paragraph>{message}</Alert.Paragraph>
      {onDismiss && (
        <Alert.Close aria-label="Dismiss error" onClick={onDismiss} />
      )}
    </Alert>
  );
}
