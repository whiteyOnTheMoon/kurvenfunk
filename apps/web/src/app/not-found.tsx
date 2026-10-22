import { ErrorState } from '../features/errors/error-state';

export default function NotFound() {
  return (
    <ErrorState
      status={404}
      title="Diese Seite ist wie Flasche leer."
      attribution="Giovanni Trappocodi"
      description="Hier gibt es nichts mehr zu holen. Vielleicht wurde die Seite verschoben oder ist nicht mehr verfügbar."
    />
  );
}
