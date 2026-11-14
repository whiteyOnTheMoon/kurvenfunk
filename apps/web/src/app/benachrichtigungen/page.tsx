import type { Metadata } from 'next';

import { NotificationInbox } from '../../features/notifications/notification-inbox';
import { env } from '../../lib/env';

export const metadata: Metadata = {
  title: 'Benachrichtigungen | Kurvenfunk',
  robots: { index: false, follow: false },
};

export default function BenachrichtigungenPage() {
  return <NotificationInbox apiUrl={env.API_URL} />;
}
