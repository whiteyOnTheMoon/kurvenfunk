import { ProfilePage } from '../../features/profile/profile-page';
import { env } from '../../lib/env';

export default function UserProfilePage() {
  return <ProfilePage apiUrl={env.API_URL} />;
}
