# Prüfprotokoll und Grenzen

Prüfstand: `develop` @ `17693e9ca3e51d8b13161be90a47a7d3491ad164`, 22.10.2026 UTC. Node 24.19.0, pnpm 11.20.0 aus dem Projektvertrag. Ergebnisse liegen außerhalb des Repositorys. Alle nachfolgenden Läufe sind neu für diesen Stand ausgeführt.

## Repository-Gates

| Prüfung / Kommando | Ergebnis | Rohbeleg |
|---|---|---|
| `pnpm install --frozen-lockfile` | bestanden | [install.log](install.log) |
| `pnpm --filter @kurvenfunk/database exec prisma generate` | Client 7.9.1 generiert | [prisma.log](prisma.log) |
| `pnpm --filter @kurvenfunk/database exec prisma validate` | Schema gültig | [schema.log](schema.log) |
| `pnpm --filter @kurvenfunk/database exec prisma migrate deploy` | alle 11 Migrationen auf leerem PostgreSQL erfolgreich | [migrate.log](migrate.log) |
| `pnpm --filter @kurvenfunk/database seed` | 28 Clubs, 90 Aliases, 3 Wettbewerbe, 3 Saisons, 3 Stages, 3 User, 9 Spiele, 18 Artikel | [seed.log](seed.log) |
| `pnpm --filter api exec jest --runInBand` | 43 Suites / 439 Tests bestanden | [api-tests.log](api-tests.log) |
| `pnpm --filter worker exec jest --runInBand` | 18 Suites / 120 Tests bestanden | [worker-tests.log](worker-tests.log) |
| `pnpm --filter @kurvenfunk/validation test` | 90 Tests bestanden | [validation-tests.log](validation-tests.log) |
| `pnpm --filter web test` | nur 28 Tests ausgewählt, bestanden | [web-tests.log](web-tests.log) |
| `pnpm --filter web exec node --experimental-strip-types --test 'src/**/*.spec.mjs'` | alle vorhandenen 50 Helpertests bestanden; enthält die obigen 28 | [web-all-tests.log](web-all-tests.log) |
| `pnpm --filter api test:e2e` | FEHLER: 1 Suite, **0 ausgeführte Tests**, ESM-Export aus Workspacepackage | [api-e2e.log](api-e2e.log) |
| `pnpm turbo lint typecheck --force` | 8 Tasks erfolgreich, kein Cache; 3 Web-img-Warnungen, 1 API-Typwarnung | [static.log](static.log) |
| `pnpm --filter api exec tsc --noEmit` | bestanden | [api-typecheck.log](api-typecheck.log) |
| `pnpm --filter worker exec tsc --noEmit` | **FEHLER TS2741**: Testfixture ohne `trustedForAutoPublish` | [worker-typecheck.log](worker-typecheck.log) |
| `pnpm --filter web exec tsc --noEmit` | bestanden | [web-typecheck.log](web-typecheck.log) |
| `NODE_ENV=production NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm turbo build --force --concurrency=2` | 7 Builds erfolgreich, kein Cache | [build.log](build.log) |
| `pnpm format:check` | bestanden | [format.log](format.log) |
| Compose-Basis + je DEV/STAGING/PROD-Overlay `config --quiet`, synthetische Variablen | alle 3 Exit 0; reine lokale Konfigurationsprüfung | [compose-checks.json](compose-checks.json) |
| `bash -n` auf Infrastruktur-Shellscripts | 12 Scripts syntaktisch gültig; nicht ausgeführt | Infrastruktur-Dateien im Evidence-Manifest |
| `pnpm audit --prod --json` | Exit 1, 38 Advisory-Einträge: 6 critical, 18 high, 12 moderate, 2 low | [dependency-audit-prod.json](dependency-audit-prod.json) |

**699 unterschiedliche Repositorytests bestanden** = 439 API + 120 Worker + 90 Validation + 50 Web. Die reguläre Auswahl umfasst nur 677. Testanzahlen beweisen weder alle Anforderungen noch Browserfunktionen. Registry-Advisories sind Meldungen über Dependencyversionen, keine 38 bestätigten Angriffe.

`turbo typecheck` umfasst hier fünf Shared Packages; API/Web/Worker besitzen keinen entsprechenden Package-Task. Der separate Worker-Typecheck scheitert in `apps/worker/src/services/raw-payload.service.spec.ts:16`. Der Nest-Build schließt diese Testfixture aus. Deshalb widersprechen sich erfolgreicher Build/Jest und fehlgeschlagenes `tsc --noEmit` nicht. CI vermittelt bislang eine unvollständige Typecheckabdeckung.

## Zusätzliche echte lokale Integrationsproben

Die externen Prüfskripte [run-isolated.py](run-isolated.py) und [integration.cjs](integration.cjs) sind Auditwerkzeuge, keine Änderung der Anwendung oder der bestehenden Tests. Sie erzeugen ausschließlich eigene temporäre PostgreSQL-17- und Redis-7.4-Container an zufälligen Loopbackports mit frisch generierten Testcredentials. Frische Migrationen und der unveränderte Seed stammen aus `develop`. Die beiden Container werden im finally-Pfad entfernt. Keine bestehenden Datenbanken geleert, keine produktiven Credentials oder Hosts benutzt.

Das Harness lädt die frisch gebauten **echten** AppModule, Services, Guards, Prisma-, jose- und BullMQ-Pakete des geprüften Commits. Es setzt für die HTTP-App wie `main.ts` den Prefix, Errorfilter und Responseinterceptor. CORS, Swagger und HTTP-Logginginterceptor werden vom Harness nicht konfiguriert; entsprechende Eigenschaften werden durch diese Proben nicht behauptet. Kein DB-/Redis-/Businessservice-Mocking. Der externe IdP ist durch einen lokalen Test-JWKS-HTTPserver und selbst signierte RSA-Testtokens ersetzt: echte kryptografische Verifikation, aber **kein Keycloak-/Google-/Registrierungs-/Browser-E2E**.

Alle **20 Prüfgruppen** wurden im abschließenden Lauf erfüllt: **17 positive Funktion-/Ablehnungsgruppen und 3 bewusste Defektreproduktionen**. Ein grüner Defektreproduktionstest ist kein grünes Abnahmekriterium des Produkts. [integration-results.json](integration-results.json), [integration.log](integration.log), [isolated-run.log](isolated-run.log).

| ID | Prüfgruppe / Ergebnis | Einordnung |
|---|---|---|
| I01 | API live/ready HTTP 200 mit realem PostgreSQL/Redis | Integration |
| I02 | Missing/malformed/unverified/expired/wrong issuer/wrong audience/wrong signature jeweils 401 | echte HTTP-/JWKS-/Kryptoprüfung |
| I03 | Gültiger Token erzeugt User mit UNSET und onboardingCompleted=false | DB-Integration |
| I04 | Incomplete Nutzer erstellt Kommentar HTTP 201 | **Defekt aus 102 bestätigt** |
| I05 | Unmittelbares Duplikat 409, anderer Kommentar im Cooldown 429 | echte Redis-Lua-Integration |
| I06 | Neutralcompletion persistiert; zweiter User mit case-insensitiv gleichem Namen 409 | DB-Constraint-/HTTPprüfung |
| I07 | Lieblingsclub gesetzt und wieder Neutral; DBwerte stimmen | HTTP-/DBprüfung |
| I08 | Fremder Kommentar nicht editierbar 403; eigener Edit speichert Revision | Ownership-/DBprüfung |
| I09 | Reply HTTP 201 mit echtem parentId | HTTP-/DBprüfung |
| I10 | LIMITED post 403, Vote auf fremden Kommentar 200; BANNED me 403 | Status-/Permissionintegration |
| I11 | Kommentarreport 201 und erneuter Report 409 | echte DB-/Uniqueprüfung |
| I12 | Drei Sortierungen HTTP 200; kaputter Cursor 400 | SQL-/Validationprüfung |
| I13 | Softdelete speichert deletedAt | HTTP-/DBprüfung |
| I14 | Deaktivierte Diagnoseroute HTTP 404 | Sicherheitsregression des Defaultpfads |
| I15 | Editor erstellt/ändert Artikel mit Beziehungen/SEO, Revision; REVIEW/PUBLISHED; öffentlich lesbar; Archive/Delete/Restore | echter HTTP-/DBdurchlauf, keine Browserabnahme |
| I16 | `/media/not-a-uuid/content` liefert HTTP 500 | **Validierungslücke aus 088 bestätigt** |
| I17 | Zwei echte BullMQ-Importjobs: erst 5 RawPayloads, 4 REVIEW_REQUIRED + 1 CREATED; danach 10 RawPayloads und zusätzlich 5 DUPLICATE | Worker-/Queue-/DB-Integration; ein Artikel entsteht |
| I18 | Reviewfreigabe persistiert MATCHED/APPROVED, Artikelanzahl bleibt gleich | **offener Review→Artikel-Pfad aus 159 bestätigt**, zusätzlich statische Consumerprüfung |
| I19 | 25 neue Rootfixtures; je newest/oldest/popular mehrere Seiten ohne wiederholte IDs | echte PostgreSQL-Cursorprüfung bei statischem Datenbestand |
| I20 | Ein fälliger SCHEDULED-Artikel wird PUBLISHED; zweiter Scannerlauf ändert nichts | realer Service-/DBübergang; kein vollständiger Timerflow |

Zur Reproduzierbarkeit: Umgebung zunächst mit dem lokalen Setuphelper laden, Shared Packages/API/Worker auf diesem Commit frisch bauen, dann `python run-isolated.py`. Das Harness verlangt Dockerzugriff und die lokal vorbereiteten DEV-Variablen für Web-/Storagekonfiguration; seine DB-/Rediswerte werden vollständig überschrieben. Es führt keinen Liveproviderabruf aus. OTS wird zwar als Adapter geladen, der eingereihte Provider ist ausschließlich `fake`.

Bei der Entwicklung des Audit-Harness gab es reine Fixture-/Harnessfehler: eigener Kommentar war zu Recht nicht votierbar, der erste Scheduledfixture fehlte `content`, der Cursor liegt in `data.pagination`. Diese Fehler wurden nur außerhalb des Repositorys korrigiert und der komplette Lauf jeweils mit frischen Diensten wiederholt. Frühe Logs liegen mit `initial-`/`second-` vor; allein das unpräfixierte abschließende Resultat trägt die Schlussfolgerungen. Der Worker-tsc-Fehler und die drei Defektreproduktionen sind dagegen Repositorybefunde.

## Nicht abgedeckt

Keine Browserautomatisierung, kein Mobile-/Screenreader-/Accessibilitytest; kein echter Keycloak-/SMTP-/Googleflow, Tokenrefresh, Linking oder Sessionrevoke; kein MinIO/R2-Roundtrip; kein Meili-Testindex; kein Live-OTS-/Sportprovider; keine App-Dockerimageabnahme, Persistenz-/Restart-/Rollback-/Restore-/Lastprobe; keine Staging- oder Productionzugriffe. Dafür werden keine erfolgreichen Abnahmen behauptet. Die Masterplan-DoD bleibt für vertikale Features offen.
