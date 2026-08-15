'use client';

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  Dropdown,
  EmptyState,
  Field,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Textarea,
  Toast,
  Tooltip,
} from '@kurvenfunk/ui';
import { useMemo, useState } from 'react';
import {
  clubThemeToCssProperties,
  getReadableTextColor,
  resolveClubTheme,
  resolveDefaultKurvenfunkTheme,
} from '../../features/personalization/club-theme';
import styles from './design-system.module.css';

interface ThemeDefinition {
  name: string;
  slug: string | null;
  color1Hex: string;
  color2Hex: string | null;
  color3Hex: string | null;
  accentColorHex: string | null;
}

const THEMES: ThemeDefinition[] = [
  {
    name: 'Kurvenfunk / Neutral',
    slug: null,
    color1Hex: '#171717',
    color2Hex: null,
    color3Hex: null,
    accentColorHex: '#D71920',
  },
  {
    name: 'LASK',
    slug: 'lask',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#F02020',
  },
  {
    name: 'Sturm Graz',
    slug: 'sk-sturm-graz',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#43A94D',
  },
  {
    name: 'RB Salzburg',
    slug: 'fc-red-bull-salzburg',
    color1Hex: '#E31147',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#FFFFFF',
  },
  {
    name: 'Austria Wien',
    slug: 'fk-austria-wien',
    color1Hex: '#441678',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#441678',
  },
  {
    name: 'Rapid Wien',
    slug: 'sk-rapid-wien',
    color1Hex: '#00794C',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#E3000F',
  },
  {
    name: 'Hartberg',
    slug: 'tsv-hartberg',
    color1Hex: '#0095DA',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#EE191F',
  },
  {
    name: 'Ried',
    slug: 'sv-ried',
    color1Hex: '#000000',
    color2Hex: '#007C4F',
    color3Hex: null,
    accentColorHex: '#FFFFFF',
  },
  {
    name: 'WAC',
    slug: 'wolfsberger-ac',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#EB1923',
  },
  {
    name: 'SCR Altach',
    slug: 'scr-altach',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#F7CF00',
  },
  {
    name: 'GAK',
    slug: 'grazer-ak-1902',
    color1Hex: '#C3171F',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#3862FF',
  },
  {
    name: 'WSG Tirol',
    slug: 'wsg-tirol',
    color1Hex: '#0FAB53',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#E21D26',
  },
  {
    name: 'Austria Lustenau',
    slug: 'sc-austria-lustenau',
    color1Hex: '#009540',
    color2Hex: '#FFFFFF',
    color3Hex: '#000000',
    accentColorHex: '#DFB800',
  },
  {
    name: 'BW Linz',
    slug: 'fc-blau-weiss-linz',
    color1Hex: '#363B92',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#FFFFFF',
  },
  {
    name: 'SKN St. Pölten',
    slug: 'skn-st-poelten',
    color1Hex: '#085DA4',
    color2Hex: '#FFED00',
    color3Hex: null,
    accentColorHex: '#E2000B',
  },
  {
    name: 'Admira Wacker',
    slug: 'admira-wacker',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#FF4306',
  },
  {
    name: 'FAC',
    slug: 'fac-wien',
    color1Hex: '#0062AA',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#0062AA',
  },
  {
    name: 'FC Liefering',
    slug: 'fc-liefering',
    color1Hex: '#DC0935',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#1A2143',
  },
  {
    name: 'SKU Amstetten',
    slug: 'sku-amstetten',
    color1Hex: '#2D2E82',
    color2Hex: '#FFFFFF',
    color3Hex: '#009639',
    accentColorHex: '#000000',
  },
  {
    name: 'First Vienna',
    slug: 'first-vienna-fc-1894',
    color1Hex: '#315CA3',
    color2Hex: '#FCE900',
    color3Hex: null,
    accentColorHex: '#000000',
  },
  {
    name: 'Young Violets',
    slug: 'young-violets-austria-wien',
    color1Hex: '#441678',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#441678',
  },
  {
    name: 'SV Austria Salzburg',
    slug: 'sv-austria-salzburg',
    color1Hex: '#452172',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#452172',
  },
  {
    name: 'FC Hertha Wels',
    slug: 'fc-hertha-wels',
    color1Hex: '#00A556',
    color2Hex: '#0968B3',
    color3Hex: null,
    accentColorHex: '#E84941',
  },
  {
    name: 'Rapid II',
    slug: 'sk-rapid-ii',
    color1Hex: '#00794C',
    color2Hex: '#FFFFFF',
    color3Hex: '#064F81',
    accentColorHex: '#E3000F',
  },
  {
    name: 'Kapfenberger SV',
    slug: 'ksv-1919',
    color1Hex: '#E21C2A',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#C9CCCD',
  },
  {
    name: 'Sturm II',
    slug: 'sk-sturm-graz-ii',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#43A94D',
  },
  {
    name: 'SW Bregenz',
    slug: 'schwarz-weiss-bregenz',
    color1Hex: '#000000',
    color2Hex: '#FFFFFF',
    color3Hex: null,
    accentColorHex: '#000000',
  },
  {
    name: 'Voitsberg',
    slug: 'ask-voitsberg',
    color1Hex: '#FFFFFF',
    color2Hex: '#000000',
    color3Hex: null,
    accentColorHex: '#000000',
  },
  {
    name: 'Wacker Innsbruck',
    slug: 'fc-wacker-innsbruck',
    color1Hex: '#008747',
    color2Hex: '#000000',
    color3Hex: null,
    accentColorHex: '#008747',
  },
];

function hexToRgba(hex: string): string {
  const normalized = hex.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, 1)`;
}

function buildTheme(definition: ThemeDefinition) {
  if (!definition.slug) {
    return resolveDefaultKurvenfunkTheme();
  }

  return resolveClubTheme({
    color1Hex: definition.color1Hex,
    color1Rgba: hexToRgba(definition.color1Hex),
    color2Hex: definition.color2Hex,
    color2Rgba: definition.color2Hex ? hexToRgba(definition.color2Hex) : null,
    color3Hex: definition.color3Hex,
    color3Rgba: definition.color3Hex ? hexToRgba(definition.color3Hex) : null,
    accentColorHex: definition.accentColorHex,
    accentColorRgba: definition.accentColorHex ? hexToRgba(definition.accentColorHex) : null,
    logo: null,
  });
}

export function DesignSystemClient() {
  const [themeSlug, setThemeSlug] = useState<string>('default');
  const [modalOpen, setModalOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(true);
  const [page, setPage] = useState(2);

  const activeTheme = useMemo(
    () => THEMES.find((theme) => (theme.slug ?? 'default') === themeSlug) ?? THEMES[0],
    [themeSlug],
  );

  function applyTheme(slug: string) {
    const definition = THEMES.find((theme) => (theme.slug ?? 'default') === slug) ?? THEMES[0];

    const theme = buildTheme(definition);
    const properties = clubThemeToCssProperties(theme);

    for (const [property, value] of Object.entries(properties)) {
      document.documentElement.style.setProperty(property, value);
    }

    document.documentElement.dataset.kfTheme = definition.slug ? 'club' : 'default';
    setThemeSlug(slug);
  }

  const swatches = [
    activeTheme.color1Hex,
    activeTheme.color2Hex,
    activeTheme.color3Hex,
    activeTheme.accentColorHex,
  ].filter((value): value is string => Boolean(value));

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <h1 className={styles.brandTitle}>Kurvenfunk Design System</h1>
            <p className={styles.brandText}>Task 116 · UI Components & visual reference</p>
          </div>

          <Badge>DEV only</Badge>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Theme</h2>
            <p>Kurvenfunk-Theme und alle Vereins-Themes direkt vergleichen.</p>
          </div>

          <div className={styles.themeBar}>
            <Field label="Aktives Theme">
              <Select value={themeSlug} onChange={(event) => applyTheme(event.target.value)}>
                {THEMES.map((theme) => (
                  <option key={theme.slug ?? 'default'} value={theme.slug ?? 'default'}>
                    {theme.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className={styles.themePreview}>
              {activeTheme.slug ? (
                <img
                  className={styles.themeLogo}
                  src={`/clubs/${activeTheme.slug}.svg`}
                  alt={`${activeTheme.name} Logo`}
                />
              ) : null}

              <div>
                <strong>{activeTheme.name}</strong>
                <div className={styles.swatches}>
                  {swatches.map((color, index) => (
                    <span
                      key={`${color}-${index}`}
                      className={styles.swatch}
                      title={`${color} · Text ${getReadableTextColor(color)}`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Typography & HTML</h2>
            <p>Globale Lesbarkeit und native HTML-Elemente.</p>
          </div>

          <div className={`${styles.demo} ${styles.prose}`}>
            <h1>Heading H1 – Kurvenfunk</h1>
            <h2>Heading H2 – Österreichischer Fußball</h2>
            <h3>Heading H3 – Vereinsnews</h3>
            <h4>Heading H4 – Diskussion</h4>
            <h5>Heading H5 – Detailüberschrift</h5>
            <h6>Heading H6 – Kleine Überschrift</h6>

            <p>
              Das ist ein normaler Absatz mit <strong>starkem Text</strong>, <em>betontem Text</em>,{' '}
              <mark>markiertem Text</mark>, <del>gelöschtem Text</del> und{' '}
              <ins>eingefügtem Text</ins>. Außerdem gibt es H<sub>2</sub>O und x<sup>2</sup>.
            </p>

            <p>
              Ein <a href="#links">normaler Link</a> innerhalb eines Fließtexts soll klar erkennbar
              sein und zum aktiven Theme passen.
            </p>

            <p>
              Inline-Code sieht so aus: <code>pnpm turbo build</code>. Eine Tastenkombination:{' '}
              <kbd>Ctrl</kbd> + <kbd>K</kbd>.
            </p>

            <blockquote>
              Fußball lebt von Emotionen. Das Interface sollte sie unterstützen, ohne die Lesbarkeit
              zu opfern.
            </blockquote>

            <pre>
              <code>{`const club = {
  name: 'SK Rapid Wien',
  theme: 'club',
};`}</code>
            </pre>

            <hr />

            <h3>Unordered List</h3>
            <ul>
              <li>News</li>
              <li>
                Community
                <ul>
                  <li>Kommentare</li>
                  <li>
                    Forum
                    <ol>
                      <li>Threads</li>
                      <li>Beiträge</li>
                    </ol>
                  </li>
                </ul>
              </li>
              <li>Sportdaten</li>
            </ul>

            <h3>Ordered List</h3>
            <ol>
              <li>Login</li>
              <li>
                Onboarding
                <ol>
                  <li>Nickname wählen</li>
                  <li>Verein oder Neutral wählen</li>
                </ol>
              </li>
              <li>Personalisierte Startseite</li>
            </ol>

            <h3>Definition List</h3>
            <dl>
              <dt>
                <strong>ACTIVE</strong>
              </dt>
              <dd>Normaler Accountstatus.</dd>
              <dt>
                <strong>LIMITED</strong>
              </dt>
              <dd>Lesen und voten erlaubt, Schreiben eingeschränkt.</dd>
            </dl>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Buttons</h2>
            <p>Varianten, Größen und Disabled-State.</p>
          </div>

          <div className={styles.demo}>
            <div className={styles.inline}>
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button disabled>Disabled</Button>
            </div>

            <div className={styles.inline}>
              <Button size="sm">Small</Button>
              <Button>Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Form Controls</h2>
            <p>Input, Textarea, Select, Checkbox und Switch.</p>
          </div>

          <div className={styles.grid}>
            <div className={styles.demo}>
              <Field label="Nickname" hint="3–24 Zeichen">
                <Input placeholder="Kurvenfan85" />
              </Field>

              <Field label="Fehlerzustand" error="Dieser Wert ist ungültig.">
                <Input defaultValue="!" aria-invalid="true" />
              </Field>

              <Field label="Bio">
                <Textarea placeholder="Erzähl etwas über dich …" />
              </Field>

              <Field label="Verein">
                <Select defaultValue="rapid">
                  <option value="rapid">Rapid Wien</option>
                  <option value="sturm">Sturm Graz</option>
                  <option value="neutral">Neutral</option>
                </Select>
              </Field>
            </div>

            <div className={styles.demo}>
              <Checkbox label="Benachrichtigungen aktivieren" defaultChecked />
              <Checkbox label="Disabled Checkbox" disabled />
              <Switch label="Club-Branding" defaultChecked />
              <Switch label="Disabled Switch" disabled />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Display Components</h2>
            <p>Card, Badge, Avatar, Alert, Skeleton und EmptyState.</p>
          </div>

          <div className={styles.grid}>
            <Card className={styles.stack}>
              <div className={styles.inline}>
                <Avatar
                  src={activeTheme.slug ? `/clubs/${activeTheme.slug}.svg` : undefined}
                  alt={activeTheme.name}
                  fallback="KF"
                />
                <div>
                  <strong>{activeTheme.name}</strong>
                  <div>
                    <Badge>Mein Verein</Badge>
                  </div>
                </div>
              </div>
              <p>Beispiel einer thematisierten Card.</p>
            </Card>

            <div className={`${styles.demo} ${styles.stack}`}>
              <Alert variant="info">Info Alert</Alert>
              <Alert variant="success">Success Alert</Alert>
              <Alert variant="warning">Warning Alert</Alert>
              <Alert variant="danger">Danger Alert</Alert>
            </div>

            <div className={styles.demo}>
              <div className={styles.skeletonRow}>
                <Skeleton style={{ height: '1.2rem', width: '45%' }} />
                <Skeleton style={{ height: '1rem' }} />
                <Skeleton style={{ height: '1rem', width: '80%' }} />
                <Skeleton style={{ height: '8rem' }} />
              </div>
            </div>

            <div className={styles.demo}>
              <EmptyState title="Noch keine Diskussionen">
                <p>Starte später die erste Diskussion zu diesem Thema.</p>
                <Button variant="outline">Zur Community</Button>
              </EmptyState>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Navigation & Interaction</h2>
            <p>Tabs, Dropdown, Tooltip und Pagination.</p>
          </div>

          <div className={styles.grid}>
            <div className={styles.demo}>
              <Tabs
                items={[
                  { value: 'news', label: 'News', content: <p>Aktuelle Vereinsnews.</p> },
                  { value: 'matches', label: 'Spiele', content: <p>Nächste und letzte Spiele.</p> },
                  { value: 'forum', label: 'Forum', content: <p>Aktive Diskussionen.</p> },
                ]}
              />
            </div>

            <div className={styles.demo}>
              <div className={styles.inline}>
                <Dropdown
                  label="Aktionen"
                  items={[
                    { id: 'edit', label: 'Bearbeiten' },
                    { id: 'report', label: 'Melden' },
                    { id: 'disabled', label: 'Nicht verfügbar', disabled: true },
                  ]}
                />

                <Tooltip content="Das ist ein Tooltip">
                  <Button variant="outline">Hover / Fokus</Button>
                </Tooltip>
              </div>
            </div>

            <div className={styles.demo}>
              <Pagination page={page} pageCount={5} onPageChange={setPage} />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Overlays & Feedback</h2>
            <p>Modal, Dialog und Toast.</p>
          </div>

          <div className={styles.grid}>
            <div className={styles.demo}>
              <div className={styles.inline}>
                <Button onClick={() => setModalOpen(true)}>Modal öffnen</Button>
                <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                  Dialog öffnen
                </Button>
              </div>
            </div>

            <div className={styles.demo}>
              {toastVisible ? (
                <div className={styles.toastStack}>
                  <Toast
                    title="Gespeichert"
                    variant="success"
                    onClose={() => setToastVisible(false)}
                  >
                    Deine Einstellungen wurden gespeichert.
                  </Toast>
                  <Toast title="Hinweis" variant="info">
                    Neue Vereinsnews sind verfügbar.
                  </Toast>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setToastVisible(true)}>
                  Toast wieder anzeigen
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <Modal
        open={modalOpen}
        title="Beispiel Modal"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => setModalOpen(false)}>Speichern</Button>
          </>
        }
      >
        <p>Dieses Modal verwendet das native HTML-Dialog-Element.</p>
      </Modal>

      <Dialog
        open={dialogOpen}
        title="Aktion bestätigen"
        onClose={() => setDialogOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Nein
            </Button>
            <Button variant="danger" onClick={() => setDialogOpen(false)}>
              Bestätigen
            </Button>
          </>
        }
      >
        <p>Soll diese Aktion wirklich durchgeführt werden?</p>
      </Dialog>
    </>
  );
}
