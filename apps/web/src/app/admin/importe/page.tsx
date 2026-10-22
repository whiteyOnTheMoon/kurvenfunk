import { ImportAdmin } from '../../../features/admin/imports/import-admin';
import { env } from '../../../lib/env';

export default function AdminImportsPage() {
  return <ImportAdmin apiUrl={env.API_URL} />;
}
