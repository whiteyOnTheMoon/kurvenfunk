import { ErrorState } from '../../features/errors/error-state';

export default function TooManyRequestsPage() {
  return (
    <ErrorState
      status={429}
      title="Zu viele Anfragen"
      description="Es wurden zu viele Anfragen in kurzer Zeit gesendet. Bitte warte einen Moment und versuche es anschließend erneut."
    />
  );
}
