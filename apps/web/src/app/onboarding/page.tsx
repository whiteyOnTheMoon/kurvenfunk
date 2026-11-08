import { OnboardingCompletion } from '../../features/onboarding/onboarding-completion';
import styles from './page.module.css';
import { env } from '../../lib/env';

export default function OnboardingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>DEIN KURVENFUNK</p>
        <h1>Dein Profil einrichten</h1>
        <p>Wähle deinen Nickname und deinen Lieblingsverein. Danach kann es losgehen.</p>
      </header>
      <OnboardingCompletion apiUrl={env.API_URL} />
    </div>
  );
}
