import { env } from '../../lib/env';
import { AppealsClient } from './appeals-client';

export default function AppealsPage() {
  return <AppealsClient apiUrl={env.API_URL} />;
}
