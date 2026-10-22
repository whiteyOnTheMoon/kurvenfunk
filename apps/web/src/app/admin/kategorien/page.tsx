import { CategoryAdmin } from '../../../features/admin/categories/category-admin';
import { env } from '../../../lib/env';

export default function AdminCategoriesPage() {
  return <CategoryAdmin apiUrl={env.API_URL} />;
}
