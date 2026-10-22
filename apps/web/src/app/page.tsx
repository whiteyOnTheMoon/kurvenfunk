import { PersonalizedStartpage } from '../features/personalization/personalized-startpage';
import { env } from '../lib/env';

export default function Home() {
  return <PersonalizedStartpage apiUrl={env.API_URL} />;
}
