'use client';

import { Alert, Badge, Button, Field, Input, Textarea } from '@kurvenfunk/ui';
import { BIO_MAX_LENGTH, DISPLAY_NAME_MAX_LENGTH } from '@kurvenfunk/validation';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import { FanPreferenceSettings } from '../profile/fan-preference-settings';
import styles from './user-settings-page.module.css';

interface UserSettingsPageProps {
  apiUrl: string;
}

interface ProfileData {
  nickname: string | null;
  displayName: string | null;
  bio: string | null;
}

interface ProfileResponse {
  data?: ProfileData;
}

interface ProfileUpdateResponse {
  data?: {
    displayName: string | null;
    bio: string | null;
  };
}

type SettingsSection = 'profile' | 'club' | 'account' | 'privacy' | 'notifications' | 'sessions';

const sections: Array<{
  id: SettingsSection;
  label: string;
  description: string;
}> = [
  {
    id: 'profile',
    label: 'Profil',
    description: 'Name und Bio',
  },
  {
    id: 'club',
    label: 'Lieblingsverein',
    description: 'Personalisierung',
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Anmeldung und Status',
  },
  {
    id: 'privacy',
    label: 'Datenschutz',
    description: 'Deine Daten',
  },
  {
    id: 'notifications',
    label: 'Benachrichtigungen',
    description: 'Mitteilungen',
  },
  {
    id: 'sessions',
    label: 'Sessions',
    description: 'Angemeldete Geräte',
  },
];

export function UserSettingsPage({ apiUrl }: UserSettingsPageProps) {
  const { authenticated, initialized, logout, token, user } = useAuth();

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [profile, setProfile] = useState<ProfileData>();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string>();
  const [profileSuccess, setProfileSuccess] = useState<string>();

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!authenticated || !token) {
      return;
    }

    const controller = new AbortController();

    async function loadProfile() {
      setLoadingProfile(true);
      setProfileError(undefined);

      try {
        const response = await fetch(`${apiUrl}/api/v1/profiles/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const body = (await response.json().catch(() => undefined)) as ProfileResponse | undefined;

        if (!response.ok || !body?.data) {
          setProfileError('Deine Profileinstellungen konnten nicht geladen werden.');
          return;
        }

        setProfile(body.data);
        setDisplayName(body.data.displayName ?? '');
        setBio(body.data.bio ?? '');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setProfileError('Deine Profileinstellungen konnten nicht geladen werden.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [apiUrl, authenticated, initialized, token]);

  async function saveProfile() {
    if (!token || savingProfile) {
      return;
    }

    setSavingProfile(true);
    setProfileError(undefined);
    setProfileSuccess(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/profiles/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName,
          bio,
        }),
      });

      const body = (await response.json().catch(() => undefined)) as
        ProfileUpdateResponse | undefined;

      if (!response.ok || !body?.data) {
        setProfileError('Deine Profiländerungen konnten nicht gespeichert werden.');
        return;
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              displayName: body.data?.displayName ?? null,
              bio: body.data?.bio ?? null,
            }
          : current,
      );

      setDisplayName(body.data.displayName ?? '');
      setBio(body.data.bio ?? '');
      setProfileSuccess('Deine Profiländerungen wurden gespeichert.');
    } catch {
      setProfileError('Deine Profiländerungen konnten nicht gespeichert werden.');
    } finally {
      setSavingProfile(false);
    }
  }

  if (!initialized || (authenticated && loadingProfile)) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateCard}>Einstellungen werden geladen …</div>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.stateCard}>
            <span className={styles.eyebrow}>Einstellungen</span>
            <h1>Anmeldung erforderlich</h1>
            <p>Deine persönlichen Einstellungen sind nur angemeldet verfügbar.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Mein Kurvenfunk</span>
          <h1>Einstellungen</h1>
          <p>Verwalte dein Profil, deine Personalisierung und deine Account-Einstellungen.</p>
        </header>

        <div className={styles.layout}>
          <nav className={styles.navigation} aria-label="Einstellungsbereiche">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={
                  activeSection === section.id
                    ? `${styles.navItem} ${styles.navItemActive}`
                    : styles.navItem
                }
                onClick={() => setActiveSection(section.id)}
              >
                <strong>{section.label}</strong>
                <span>{section.description}</span>
              </button>
            ))}
          </nav>

          <div className={styles.content}>
            {activeSection === 'profile' ? (
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.eyebrow}>Öffentliches Profil</span>
                    <h2>Profil</h2>
                    <p>Diese Angaben erscheinen auf deinem Kurvenfunk-Profil.</p>
                  </div>
                </div>

                {profileError ? <Alert variant="danger">{profileError}</Alert> : null}
                {profileSuccess ? <Alert variant="success">{profileSuccess}</Alert> : null}

                <div className={styles.form}>
                  <Field label="Nickname" hint="Dein Nickname wurde beim Onboarding festgelegt.">
                    <Input value={profile?.nickname ?? ''} disabled />
                  </Field>

                  <Field
                    label="Anzeigename"
                    hint={`Optional, maximal ${DISPLAY_NAME_MAX_LENGTH} Zeichen.`}
                  >
                    <Input
                      value={displayName}
                      maxLength={DISPLAY_NAME_MAX_LENGTH}
                      onChange={(event) => {
                        setDisplayName(event.target.value);
                        setProfileSuccess(undefined);
                      }}
                      placeholder={profile?.nickname ?? 'Anzeigename'}
                    />
                  </Field>

                  <Field label="Bio" hint={`${bio.length}/${BIO_MAX_LENGTH} Zeichen`}>
                    <Textarea
                      value={bio}
                      maxLength={BIO_MAX_LENGTH}
                      rows={6}
                      onChange={(event) => {
                        setBio(event.target.value);
                        setProfileSuccess(undefined);
                      }}
                      placeholder="Erzähl der Community etwas über dich."
                    />
                  </Field>

                  <div className={styles.actions}>
                    <Button disabled={savingProfile} onClick={() => void saveProfile()}>
                      {savingProfile ? 'Wird gespeichert …' : 'Profil speichern'}
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            {activeSection === 'club' ? (
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.eyebrow}>Personalisierung</span>
                    <h2>Lieblingsverein</h2>
                    <p>
                      Dein Lieblingsverein beeinflusst Branding, News und Sportansichten. Du kannst
                      jederzeit wieder Neutral wählen.
                    </p>
                  </div>
                </div>

                <FanPreferenceSettings apiUrl={apiUrl} />
              </section>
            ) : null}

            {activeSection === 'account' ? (
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.eyebrow}>Zugang</span>
                    <h2>Account</h2>
                    <p>
                      Anmeldung, Identität und Passwort werden sicher über Kurvenfunk Auth
                      verwaltet.
                    </p>
                  </div>
                  <Badge>{user?.status ?? 'ACTIVE'}</Badge>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoCard}>
                    <span>Accountstatus</span>
                    <strong>{user?.status ?? '–'}</strong>
                  </div>

                  <div className={styles.infoCard}>
                    <span>Kurvenfunk User-ID</span>
                    <strong className={styles.codeValue}>{user?.id ?? '–'}</strong>
                  </div>
                </div>

                <Alert variant="info">
                  Passwortänderungen und weitere Login-Verfahren werden über die zentrale
                  Authentifizierung verwaltet.
                </Alert>
              </section>
            ) : null}

            {activeSection === 'privacy' ? (
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.eyebrow}>Deine Daten</span>
                    <h2>Datenschutz</h2>
                    <p>Hier werden später Datenexport und Accountlöschung verwaltet.</p>
                  </div>
                  <Badge>Geplant</Badge>
                </div>

                <Alert variant="info">
                  Datenexport und Accountlöschung werden in der späteren Datenschutz-Phase
                  vollständig umgesetzt. Bis dahin werden hier keine nicht funktionierenden Aktionen
                  angeboten.
                </Alert>
              </section>
            ) : null}

            {activeSection === 'notifications' ? (
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.eyebrow}>Mitteilungen</span>
                    <h2>Benachrichtigungen</h2>
                    <p>
                      Hier kannst du später festlegen, welche Community- und Systemereignisse dich
                      erreichen.
                    </p>
                  </div>
                  <Badge>Geplant</Badge>
                </div>

                <Alert variant="info">
                  Die Datenstruktur für Benachrichtigungseinstellungen ist vorbereitet. Die
                  vollständige Benutzersteuerung folgt mit dem Notification-System.
                </Alert>
              </section>
            ) : null}

            {activeSection === 'sessions' ? (
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.eyebrow}>Sicherheit</span>
                    <h2>Sessions</h2>
                    <p>Kurvenfunk-Sessions werden über die zentrale Authentifizierung verwaltet.</p>
                  </div>
                </div>

                <div className={styles.sessionCard}>
                  <div>
                    <strong>Aktuelle Session</strong>
                    <span>Dieses Gerät ist derzeit angemeldet.</span>
                  </div>
                  <Badge>Aktiv</Badge>
                </div>

                <div className={styles.actions}>
                  <Button variant="outline" onClick={() => void logout()}>
                    Auf diesem Gerät abmelden
                  </Button>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
