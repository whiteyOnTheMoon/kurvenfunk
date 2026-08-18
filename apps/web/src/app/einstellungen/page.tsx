import { UserSettingsPage } from '../../features/settings/user-settings-page';
import { env } from '../../lib/env';

export default function EinstellungenPage() {
  return <UserSettingsPage apiUrl={env.API_URL} />;
}
