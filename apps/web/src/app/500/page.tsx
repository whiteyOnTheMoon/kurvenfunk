import { ErrorState } from '../../features/errors/error-state';

export default function InternalServerErrorPage() {
  return (
    <ErrorState
      status={500}
      title="Etwas ist schiefgelaufen"
      description="Beim Laden dieser Seite ist ein unerwarteter Fehler aufgetreten. Bitte versuche es später erneut."
    />
  );
}
