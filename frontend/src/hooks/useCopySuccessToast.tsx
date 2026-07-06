import { Notification, useToast } from '@zendeskgarden/react-notifications';

const COPY_TOAST_MS = 3000;

export function useCopySuccessToast() {
  const { addToast } = useToast();

  const showCopySuccess = () => {
    addToast(
      ({ close }) => (
        <Notification type="success">
          <Notification.Title>Copied!</Notification.Title>
          Summary copied to clipboard.
          <Notification.Close onClick={close} aria-label="Close notification" />
        </Notification>
      ),
      {
        autoDismiss: COPY_TOAST_MS,
        placement: 'top-end',
      }
    );
  };

  return { showCopySuccess };
}
