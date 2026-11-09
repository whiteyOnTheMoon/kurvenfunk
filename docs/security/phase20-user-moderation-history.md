# Phase 20.188 – User Moderation History

Status: Feature-Branch; **noch nicht DEV DONE** bis PR-CI, Merge und eigenem DEV-Smoke.

## Funktion

Eine vertrauliche, **lesende** Historie für ein einzelnes Nutzerkonto. Einstieg über die Moderationsübersicht per UUID-Suche oder Karte/Sanktion; Route `/admin/moderation/benutzer/:userId`. Der bereits bestehende `AdminLayout` schützt alle Unterpfade clientseitig. **Maßgeblich ist ausschließlich die API:** `GET /api/v1/moderation/users/:userId/history` verlangt `user.warn` und eine gültige UUIDv4. Nur ACTIVE MODERATOR/ADMIN/SUPERADMIN erhalten Zugriff. USER, TRUSTED_USER, EDITOR, LIMITED, BANNED und Anonyme bekommen 403/401, unabhängig von der Oberfläche. Eine unbekannte UUID ergibt 404. Antwort: `Cache-Control: private, no-store`.

Die Historie enthält:

- Meldungen **über** das ausgewählte Konto (direkt gemeldeter Nutzer oder Autor gemeldeter Kommentare/Forenbeiträge), einschließlich Fallstatus, Entscheidung und interner Notizen, **nicht** andere Meldungen, die dieses Konto selbst als Reporter eingereicht hat.
- Gelbe, blaue und rote Karten inklusive widerrufener und abgelaufener Karten, internem Vermerk, Benutzer-Nachricht, Eskalation und Widerrufsangaben.
- LIMITED, COMMENT_BLOCK, FORUM_BLOCK und ACCOUNT_BAN-Sanktionen samt Status, Zeitpunkten und internen Notizen, einschließlich früherer Sperren. IP_BLOCK bleibt **ausgeschlossen**, da Netzwerkmaßnahmen in Task 184/185 nur im SUPERADMIN-Schutzbereich behandelt werden.
- Historische `USER_STATUS_CHANGED`-Auditereignisse (Zeit, Art). Audit-`metadata`, `reason`, Request-/Correlation-IDs, IP-bezogene Beziehungen und freie Netzwerkdiagnosen werden bewusst **nicht** ausgeliefert.

Die Datenbank-Query verwendet `select`-Projektionen; jeder Bereich ist separat auf die **50 neuesten** Einträge mit stabiler Sortierung begrenzt und signalisiert ältere Ergebnisse mit `hasMore`. Es gibt derzeit bewusst **keine** serverseitige Detail-Paginierung oder exportierbaren Vollbestand. Für das erste Paket werden nur die neuesten 50 je Kategorie angeboten.

### Schutzgrenzen

Interne Vermerke können persönliche Informationen enthalten und erscheinen **niemals** im allgemeineren Task-187-Dashboard oder auf öffentlichen Profilen. React rendert sie ausschließlich als escapten Text ohne HTML-Injektion. Browser-Fetch verwendet `cache: 'no-store'`, lädt nur beim Vorliegen eines JWTs, ist abbrechbar und hält keine Moderationshistorie in LocalStorage, URL-Querystrings, Analytics oder Logs. Die Route enthält ausschließlich eine UUID, keine Notizen. Die App bietet keine Export-, Bearbeitungs-, Revoke- oder Review-Funktion.

Task **20.189 Einsprüche** bleibt getrennt, besonders BANNED-Authentifizierung und Vier-Augen-Prinzip. Draft-PR #29 wird wegen veralteter Auth-Änderungen nicht unverändert gemergt. Diese Implementierung verwendet keine neue DB-Migration und ändert weder bestehenden Status noch reale Nutzer.

## Tests & Abnahme

1. Unit: `user.warn` am konkreten Controller-Handler; Rollenmatrix inkl. LIMITED/BANNED; fehlende UUID; Scope nach Nutzer-ID über direkte und Content-Autor-Relation; vollständige Positiv-/Negativ-Projektionsprüfung; auf 50 begrenzte Listen.
2. Isoliertes PostgreSQL/Redis/JWKS HTTP-E2E `phase20-user-moderation-history.e2e-spec.ts`: gültige und falsche Rollen, `401/403/404/400`, Notizen im richtigen berechtigten Verlauf, keinerlei fremde Notizen, keine Netzwerk-Sanktion oder Audit-Metadaten, abgelaufene/widerrufene Sperren bleiben lesend sichtbar, `no-store`, kein DB-Zustandswechsel. Vollständige Bereinigung ausschließlich der eigenen synthetischen Fixtures.
3. Gesamte PR-CI (Format/Lint/Typecheck/Unit/Build, isolierter HTTP-E2E, Worker-/Prisma-Docker, Gateway-Redis-Ausfalltest) vollständig grün.
4. Nach Review und Merge triggert der Marker `[phase20-188-dev-history]` **einmalig nach erfolgreichem DEV-Deploy** `dev-phase20-188-history.sh`: strikt `ap`, `develop`, exakter SHA, sauberer Checkout und `.env.dev` Modus 600; Rollenberechtigungen, kompilierten Endpunkt, echte DB-404 für zufällige unbenutzte UUID und anonymous HTTP-401 prüfen. **Keine** vorhandene Moderationshistorie wird aus DEV gelesen, exportiert oder geloggt; keine Testkonten, Statusänderungen oder Sanktionen werden erzeugt.
5. Erst nach positivem DEV-Smoke `DEV DONE` und Roadmap-Checkbox setzen. STAGING/PROD sowie IP-Block-Flags unverändert.

**Grenze:** Der DEV-Smoke prüft bewusst keine echten Notizen. Das berechtigte Positivlesen vertraulicher Testdaten und die Isolation mehrerer Konten wird ausschließlich über isoliertes HTTP-E2E auf wegwerfbarer Datenbank nachgewiesen. Ein manueller Browser-/Mobile-Screenshot muss separat erfolgen und darf keine realen Vermerke abbilden.
