# Phase 20.183 – befristete IP-Sperren

## Umfang und Abgrenzung

Task 183 ergänzt die bereits abgenommene IP-Ratenbegrenzung (182) um zeitlich
begrenzte technische Sperren. Wegen geteilter IPs, Carrier-NAT, WLANs und VPNs
sind sie **keine** Identitätsfeststellung und ersetzen weder Account-Sanktionen
noch Session-Widerruf. Login, E-Mail-Verifikation, Passwort-Reset, Lesezugriffe,
Moderation und spätere Appeals bleiben von dieser API-Schreibsperre unberührt.
Keycloak-/Cloudflare-IP-Sperren sind **nicht** Bestandteil dieses API-Guards.

Das bestehende Prisma-`IPBlock`-Modell und der Ablauf-Worker werden wiederverwendet.
Es gibt keine Migration. Gespeichert werden nur eine versionierte HMAC-IP,
Quelle, Grund, Anfang, Ende und gegebenenfalls die Moderator-ID. Keine
Klartext-IP, keine Secrets, keine automatischen permanenten Blocks.

## Durchsetzung

`TemporaryIpBlockGuard` prüft ausschließlich mit
`classifyIpLimitedWrite` erfasste API-Schreibaktionen: Kommentare,
Forum/Threads/Posts, Stimmen und Reports. Er vertraut nur dem über den
TCP-Peer verifizierten Cloudflare-Header. Er gleicht aktive und als vorherige
Version behaltene HMAC-Schlüssel ab.

- Solange `IP_TEMP_BLOCK_ENABLED=false`: keine Durchsetzung (sicherer Default).
- Aktive Sperre mit `startsAt <= now < expiresAt`: HTTP 403
  `IP_TEMPORARILY_BLOCKED`.
- Unverifizierter Peer, HMAC-/Datenbankfehler: geschützte Schreibaktion HTTP 503.
- Öffentliche GET-, Auth- und Moderations-Endpunkte werden nicht blockiert.
- Nach `expiresAt` gilt eine Sperre nicht mehr, **auch bevor** der Worker
  den Datensatz als inaktiv markiert. Der Worker deaktiviert ihn und protokolliert
  `IP_BLOCK_EXPIRED` sowie gegebenenfalls `SANCTION_EXPIRED`.

## Automatische Eskalation

Zusätzlich zu `IP_TEMP_BLOCK_ENABLED=true` ist explizit
`IP_TEMP_AUTO_BLOCK_ENABLED=true` erforderlich; andernfalls wird die automatische
Erstellung nicht aktiviert. Auch `IP_RATE_LIMIT_ENABLED=true` muss gelten.

Nur mindestens **drei verschiedene Minuten mit Überschreitung** des bestehenden
Rate-Limits **innerhalb von 30 Minuten** führen zu genau einer temporären
technischen Sperre von **15 Minuten** (`RATE_LIMIT_ESCALATION`).
Ein einzelner Burst reicht nicht. Redis-Lua zählt die verschiedenen Minuten
atomar und dedupliziert den Auslöser. Der Versuch bleibt 429, auch wenn
die optionale Erstellung fehlschlägt. Diese Eskalation ist ein konservativer
technischer Vorschlag und soll auf DEV erst nach gezielter
False-Positive-Abnahme aktiviert werden.

## Manuelle Ergänzung und Task 184

`TemporaryIpBlockService.issueManual` erzeugt eine auf 24h, 3d, 7d oder 30d
begrenzte Sperre mit korrespondierender `Sanction(IP_BLOCK)`, zwei Audits und
einem expliziten Actor. Es existiert **noch kein** öffentlicher manueller
HTTP-Endpunkt. Autorisierte Rollen, Eingabevalidierung, Revoke und Bedienoberfläche
werden separat in **20.184** eingeführt.

## Abnahme und Rollback

- Unit-Tests prüfen Grenzen, fehlende Proxy-Identität, HMAC-Key-Rotation,
  fehlende Datenbank, Ablauf, fehlerhafte Befehle, Audit und Konflikte.
- Isoliertes API-E2E mit wegwerfbarer PostgreSQL-/Redis-Umgebung prüft
  echte HTTP 403/200, Worker-Ablauf und die drei Redis-Eskalationsminuten.
- Vor einer DEV-Aktivierung ist mit ausschließlich synthetischen Netz-Identitäten
  zu prüfen, dass kein echter Nutzer eingeschränkt werden kann.
- **STAGING und PROD unverändert.** Die beiden neuen Flags bleiben bis zum
  gesonderten gesicherten DEV-Aktivierungslauf deaktiviert.
- Rücknahme: `IP_TEMP_AUTO_BLOCK_ENABLED=false`, dann
  `IP_TEMP_BLOCK_ENABLED=false` setzen und API auf DEV neu starten.
  Bestehende Daten oder Sanktionen werden dabei nicht gelöscht.
