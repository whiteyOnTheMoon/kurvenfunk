'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import styles from './profile-page.module.css';

interface ProfileData {
  id: string;
  nickname: string | null;
  displayName: string | null;
  bio: string | null;
  createdAt: string;
  fanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
  favoriteClub: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  } | null;
  avatar: {
    id: string;
    externalUrl: string | null;
    altText: string | null;
  } | null;
  community: {
    comments: number;
    threads: number;
    posts: number;
    reactions: number;
  };
}

interface ProfileResponse {
  data?: ProfileData;
}

interface ProfilePageProps {
  apiUrl: string;
}

function formatMemberSince(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '–';
  }

  return new Intl.DateTimeFormat('de-AT', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getInitials(profile: ProfileData): string {
  const source = profile.displayName?.trim() || profile.nickname?.trim() || 'KF';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function ProfilePage({ apiUrl }: ProfilePageProps) {
  const { authenticated, initialized, token } = useAuth();
  const [profile, setProfile] = useState<ProfileData>();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!initialized) {
        return;
      }

      if (!authenticated || !token) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setFailed(false);

      try {
        const response = await fetch(`${apiUrl}/api/v1/profiles/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('PROFILE_REQUEST_FAILED');
        }

        const body = (await response.json()) as ProfileResponse;

        if (!body.data) {
          throw new Error('INVALID_PROFILE_RESPONSE');
        }

        if (active) {
          setProfile(body.data);
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [apiUrl, authenticated, initialized, token]);

  const stats = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      { label: 'Kommentare', value: profile.community.comments },
      { label: 'Threads', value: profile.community.threads },
      { label: 'Forenbeiträge', value: profile.community.posts },
      { label: 'Likes vergeben', value: profile.community.reactions },
    ];
  }, [profile]);

  if (!initialized || loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingCard} aria-live="polite">
            Profil wird geladen …
          </div>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.stateCard}>
            <span className={styles.eyebrow}>Mein Profil</span>
            <h1>Anmeldung erforderlich</h1>
            <p>Dein Kurvenfunk-Profil ist nur sichtbar, wenn du angemeldet bist.</p>
          </section>
        </div>
      </main>
    );
  }

  if (failed || !profile) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.stateCard}>
            <span className={styles.eyebrow}>Mein Profil</span>
            <h1>Profil konnte nicht geladen werden</h1>
            <p>Bitte versuche es später noch einmal.</p>
          </section>
        </div>
      </main>
    );
  }

  const title = profile.displayName?.trim() || profile.nickname || 'Kurvenfunk User';

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.identity}>
            <div className={styles.avatar}>
              {profile.avatar?.externalUrl ? (
                <Image
                  src={profile.avatar.externalUrl}
                  alt={profile.avatar.altText ?? `Profilbild von ${title}`}
                  fill
                  sizes="112px"
                  className={styles.avatarImage}
                />
              ) : (
                <span aria-hidden="true">{getInitials(profile)}</span>
              )}
            </div>

            <div className={styles.identityText}>
              <span className={styles.eyebrow}>Mein Profil</span>
              <h1>{title}</h1>

              {profile.displayName && profile.nickname ? (
                <p className={styles.nickname}>@{profile.nickname}</p>
              ) : null}

              <p className={styles.memberSince}>
                Mitglied seit {formatMemberSince(profile.createdAt)}
              </p>
            </div>
          </div>

          <Link href="/settings/profile" className={styles.settingsLink}>
            Profil bearbeiten
          </Link>
        </section>

        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.eyebrow}>Über mich</span>
                  <h2>Bio</h2>
                </div>
              </div>

              {profile.bio ? (
                <p className={styles.bio}>{profile.bio}</p>
              ) : (
                <p className={styles.emptyText}>
                  Du hast noch keine Bio hinterlegt. In den Profileinstellungen kannst du später
                  etwas über dich erzählen.
                </p>
              )}
            </section>

            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.eyebrow}>Kurvenfunk</span>
                  <h2>Communityaktivität</h2>
                </div>
              </div>

              <div className={styles.statsGrid}>
                {stats.map((stat) => (
                  <div className={styles.stat} key={stat.label}>
                    <strong>{stat.value.toLocaleString('de-AT')}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>

              {stats.every((stat) => stat.value === 0) ? (
                <p className={styles.activityHint}>
                  Noch keine Communityaktivität. Deine Kommentare und Forenbeiträge werden hier
                  später zusammengefasst.
                </p>
              ) : null}
            </section>
          </div>

          <aside className={styles.sideColumn}>
            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.eyebrow}>Fanprofil</span>
                  <h2>Lieblingsverein</h2>
                </div>
              </div>

              {profile.fanPreference === 'CLUB' && profile.favoriteClub ? (
                <Link href={`/vereine/${profile.favoriteClub.slug}`} className={styles.club}>
                  <span className={styles.clubLogo}>
                    <Image
                      src={`/clubs/${profile.favoriteClub.slug}.svg`}
                      alt=""
                      width={64}
                      height={64}
                    />
                  </span>

                  <span className={styles.clubText}>
                    <strong>{profile.favoriteClub.name}</strong>
                    <span>Mein Verein</span>
                  </span>
                </Link>
              ) : profile.fanPreference === 'NEUTRAL' ? (
                <div className={styles.neutral}>
                  <span className={styles.neutralMark} aria-hidden="true">
                    KF
                  </span>
                  <div>
                    <strong>Neutral</strong>
                    <span>Kein Lieblingsverein gewählt</span>
                  </div>
                </div>
              ) : (
                <p className={styles.emptyText}>Noch kein Lieblingsverein ausgewählt.</p>
              )}
            </section>

            <section className={styles.card}>
              <span className={styles.eyebrow}>Account</span>
              <h2>Profileinstellungen</h2>
              <p className={styles.sideText}>
                Profilinformationen und Lieblingsverein kannst du in deinen Einstellungen verwalten.
              </p>
              <Link href="/settings/profile" className={styles.secondaryLink}>
                Zu den Einstellungen
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
