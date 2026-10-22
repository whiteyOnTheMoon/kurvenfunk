import { ErrorState } from '../../features/errors/error-state';

export default function ForbiddenPage() {
  return (
    <ErrorState
      status={403}
      title="Kein Zugriff"
      description="Du hast keine Berechtigung, diese Seite aufzurufen."
    />
  );
}
