import { OnboardingCompletion } from '../../features/onboarding/onboarding-completion';
import { env } from '../../lib/env';

export default function OnboardingPage() {
  return (
    <main>
      <h1>Welcome to Kurvenfunk</h1>
      <p>Your account setup is not complete yet.</p>

      <OnboardingCompletion apiUrl={env.API_URL} />
    </main>
  );
}
