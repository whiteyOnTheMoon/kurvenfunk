import { FanPreferenceSettings } from '../../../features/profile/fan-preference-settings';
import { env } from '../../../lib/env';

export default function ProfileSettingsPage() {
  return (
    <main>
      <h1>Profile settings</h1>
      <p>Change your favourite club or switch to Neutral.</p>
      <FanPreferenceSettings apiUrl={env.API_URL} />
    </main>
  );
}
