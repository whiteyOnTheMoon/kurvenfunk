# Phase 23 – Benachrichtigungen (Masterplan 224–229)

Stand: 13.11.2026. Nur DEV und isolierte CI. **Phase 22 bleibt technisch abgeschlossen; ihre echte Fachabnahme in GitHub #185 ist weiterhin offen.**

## Umsetzungsschritte

| Aufgabe | Inhalt | Stand |
| --- | --- | --- |
| 224 | Notification Types | PR #187 gemergt, DEV-CI #43519283165 PASS; keine manuellen Producer aktiv |
| 225 | Notification Queue | PR #188 gemergt; PR-CI #43523858245 PASS, DEV-CI #43524486565 PASS; Redis-Ausfallpfad durch Unit-Test simuliert, keine DEV-Störung |
| 226 | In-App Notifications | Implementierung in PR; PR-CI, DEV-CI und manuelle Browserabnahme ausstehend |
| 227 | Read/Unread | Offen: atomare und empfängergebundene Lesemarkierung |
| 228 | E-Mail Notifications | Offen: async Versand, Templates, Opt-outs, Retries und Anbieterabnahme |
| 229 | Notification Preferences | Offen: sichere Kanalpräferenzen mit verpflichtenden Moderationsnachrichten |

## 23.224 – Typen- und Persistenzvertrag

- **Eine Taxonomie:** Das gemeinsame Paket `@kurvenfunk/types` definiert nur die neun vorhandenen Prisma-`NotificationType`-Werte und sieben `NotificationSourceType`-Werte. Keine Migration, kein spekulativer Typ, keine zusätzliche Datenbank.
- **Sichere statische Vorlagen:** Jeder Typ bekommt Titel und Body auf Deutsch. Nutzergenerierte Textinhalte, vertrauliche Moderatornotizen, Tokens und Auditdetails werden niemals in die Vorlagen interpoliert.
- **Quellzuordnung:** `COMMENT_REPLY` zu `COMMENT`, `THREAD_REPLY` zu `POST`/`THREAD`, Moderationskarten zu `MODERATION_CARD`, Einschränkung/Sperre zu `SANCTION`, Einsprüche zu `APPEAL` und Systemnachrichten optional zu `SYSTEM`.
- **Pflichtinhalte:** `YELLOW_CARD`, `BLUE_CARD`, `RED_CARD`, `LIMITED` und `BAN` sind als zwingend im In-App-Kanal markiert. Spätere Präferenzen dürfen sie nicht unterdrücken. Moderatoren werden bei Moderationsbenachrichtigungen nicht als Nutzer-Akteure offengelegt. Selbstbenachrichtigungen auf eigene Antworten werden unterbunden.
- **Interner Service:** `NotificationsService.persist()` ist ein intern exportierter Provider, aber **kein öffentlicher Endpunkt**. Er prüft gültige Empfänger/Quellen/Actors/Event-Keys und sichere relative URLs, erstellt bestehende `Notification`-Datensätze und akzeptiert keine freie `metadata`-Eingabe.
- **Idempotenz:** `dedupeKey` umfasst Empfänger, Typ und stabiles Ereignis. Ein Unique-Constraint verhindert konkurrierende Doppelzustellung. Identische Retries liefern denselben Record, bei widersprüchlicher Quellen-/Akteurszuordnung wird ein Konflikt geworfen; ein bereits gesetztes `readAt` wird nicht zurückgesetzt.
- **Tests:** Unit-Tests prüfen Typen, Pflichtnachrichten, statische Vorlagen, Validierung, externe URLs, Selbstbenachrichtigungen und Deduplizierung. Isolierte PostgreSQL/Redis-E2E prüfen tatsächliche DB-Enums, parallele Deduplizierung, Lesestandschutz und sichere Moderationsnachrichten.
- **Noch nicht aktiv:** Keine Produzenten in Kommentar-/Foren-/Moderationsdiensten, kein Queue-Versand, keine E-Mails, keine öffentlichen Leserechte/API, keine Benachrichtigungs-UI. Diese Aufgaben werden bewusst getrennt in 225–229 integriert.

## 23.225 – PostgreSQL-Outbox und BullMQ-Worker

- **Atomare Ursprungsdaten:** `NotificationsService.persist()` erzeugt `Notification` und genau einen `NotificationOutbox`-Datensatz in derselben PostgreSQL-Transaktion. Ein Fehler beim Outbox-Schreiben rollt die neue Benachrichtigung zurück. Bestehender `dedupeKey` schützt Wiederholungen.
- **Dauerhafter Übergang:** Neue Outbox-Tabelle mit FK/Cascade, einmaliger `notificationId`, `attemptCount`, `nextAttemptAt`, `processedAt` und neutralem `lastErrorCode`. Keine Backfills oder Demo-Records.
- **Recovery-Dispatcher:** Beim Workerstart und alle 30 Sekunden höchstens 25 offene Einträge. PostgreSQL-CAS mit `processedAt IS NULL` und `nextAttemptAt <= now` reserviert gegen konkurrierende Worker; 60 Sekunden später wird ein nicht bestätigter Claim wieder fällig, auch wenn zwischen DB und Redis ein Prozess abstürzt. Redis-Ausfälle vernichten keine offenen Einträge.
- **Minimale Queue-Payload:** BullMQ `notifications` erhält nur die Notification-UUID, nie Text, User-ID, Token oder Moderationsnotizen. Deterministische Job-ID; drei interne BullMQ-Versuche mit Backoff, danach Wiederaufnahme aus PostgreSQL ohne dauerhaft blockierende Redis-Duplikat-ID.
- **Idempotenter Consumer:** Jobname, UUID, ID und Payload werden validiert. Er markiert ausschließlich `NotificationOutbox.processedAt`, nicht `Notification.readAt` oder irgendeine E-Mail-Zustellung. Bereits bestätigte/verwaiste Jobs verändern keine Nutzerobjekte.
- **Grenzen:** In 225 gibt es weiterhin keine aktivierten Domain-Producer, öffentliche Notification-API oder E-Mail-/Push-Zustellung. Ein eigener Dead-Letter- und Zustellvertrag für echte E-Mails gehört zu 228; Redis-Ausfälle werden hier bewusst unbefristet wiederholt, nicht terminal dead-lettered.
- **Tests:** Atomarer Rollback, konkurrierende Reservierungen, sichere Payload, Redis-Fehlercodes, Wiederholung, reales PostgreSQL/Redis/Nest-Worker-Acknowledgment in isolierter CI. Auf DEV ausschließlich ein lesender Schema-Gate ohne Testdaten, Logs mit Nutzer-IDs oder mutierende Queue-Tests. Keine STAGING-/PROD-Änderung.
## 23.226 – Private In-App-Anzeige und Read-only-API

- **Keine öffentliche Inbox:** `GET /api/v1/notifications` und `GET /api/v1/notifications/unread-count` tragen jeweils `AuthGuard` und `Cache-Control: private, no-store`. Der Empfänger ist ausschließlich `request.user.kurvenfunkUserId` aus einem verifizierten Keycloak-JWT. `userId` aus Query/URL wird nie ausgewertet; auch Administratoren haben hier keinen Querschnittszugriff.
- **Minimalprojektion:** Nur `id`, `type`, `title`, `body`, validierte interne Ziel-URL, `createdAt`, `readAt`; keine `actorUserId`, `metadata`, `sourceId`, Queue-Outbox, Dedupe-, Sicherheits- oder Moderatornotizen. `BANNED` bleibt durch AccountStatusGuard ausgeschlossen; `LIMITED` darf eigene wichtige Mitteilungen lesen.
- **Stabile Pagination:** höchstens 50 Elemente, Standard 20; Opaque-Cursor mit Datum + UUID und an den gewählten Filter gebunden, `createdAt DESC, id DESC` zur stabilen Seek-Pagination. Abgelaufene Einträge bleiben im Datenspeicher, sind aber von Inbox und Zähler ausgeschlossen. `filter=unread` und separater `unread-count` sind ausschließlich lesend.
- **Web:** private `/benachrichtigungen`-Seite, responsive Listenansicht, Alle/Ungelesen-Filter, Nachladen, Fehler-/Leerzustand und Header-Bell mit begrenztem Ungelesen-Badge. URL-Ziele werden vor dem Rendern gegen externe Schemes, `//`, Backslashes und Steuerzeichen abgesichert. Die UI enthält keine Bearer-Tokens in URLs, Logs oder LocalStorage; Daten werden bei Tokenwechsel/Logout nicht angezeigt.
- **Keine impliziten Writes:** Das Öffnen/Anklicken von Benachrichtigungen setzt `readAt` nicht; Lesebestätigung folgt in 23.227. Domain-Producer sind weiterhin nicht angeschlossen; bis dahin sind echte Accounts ohne bestehende Nachrichten leer. Es wird weder DEV gesät noch eine E-Mail verschickt.
- **Automatisierte Abnahme:** Parser-/Sicherheits-Web-Tests, API-Cursor-Unit-Tests und echte isolierte PostgreSQL/Redis + signierte JWT HTTP-E2E für 401/403, Zweitaccount-Isolation, Limit/Seek-Paging, abgelaufene Zeilen, korrekte Lesezahlen und Nichtoffenlegung von Moderationsdaten. DEV-Gate prüft ausschließlich öffentliche Browser-Shell und negativ unautorisierte HTTP-Anfragen.
- **Offene reale Fachabnahme:** Interaktiver Desktop-/Mobile-Browsertest mit freigegebenen echten DEV-Accounts, nicht im PR fingiert. Keine STAGING-/PROD-Änderung.
## Nachweis- und Sicherheitsgrenzen

Alle Testkonten/Notification-Einträge existieren ausschließlich in einer ausdrücklich überprüften wegwerfbaren E2E-PostgreSQL-Datenbank; kein DEV-Seeding und keine E-Mails. Vollständig grüne PR-CI einschließlich isolierter E2E und Docker vor Merge; danach exakten Merge-Push-/DEV-CI-Abschluss kontrollieren. Keine Änderungen an STAGING/PROD.

Für 225 ist vor Aktivierung zuerst ein abgestimmter Crash-/Redis-Ausfall-Vertrag notwendig: PostgreSQL bleibt Quelle der Wahrheit, BullMQ kann mit At-least-once verarbeitet werden, und Producer-Domainaktionen dürfen nicht synchron von einem externen Mailprovider abhängen.
