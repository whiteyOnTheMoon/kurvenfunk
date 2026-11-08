# Phase 20.186 – Keycloak Session Revoke: Wiederanlauf und Abnahme

**Status: in Arbeit, keine DEV-Freigabe.** Änderungen ausschließlich über geprüften Feature-PR nach `develop`. STAGING und PROD bleiben unangetastet.

## Bestehender Schutz

- Automatische rote Karte nach drei gültigen gelben Karten und direkt vergebene rote Karte sperren das Kurvenfunk-Benutzerkonto auf `BANNED` innerhalb der Datenbanktransaktion.
- Dieselbe Transaktion erzeugt eine `RED_CARD`-Benachrichtigung mit dauerhaft gespeichertem `metadata.sessionRevocation=PENDING`.
- Erst nach Commit versucht die API über den dedizierten Keycloak-Serviceaccount mit begrenzter Berechtigung `realm-management/manage-users` den Session-Logout (`POST /admin/realms/kurvenfunk/users/:subject/logout`).
- Ein erfolgreiches `204` wird als `REVOKED` in der Benachrichtigung gespeichert. Fehler oder Keycloak-Unverfügbarkeit lassen `PENDING` bestehen. Der Status-Guard blockiert BANNED-Zugriffe selbst mit älteren oder neuen JWTs bereits vor erfolgreichem externen Logout.
- Ein nachgelagerter Retry liest höchstens 20 PENDING-Benachrichtigungen je Scan, ausschließlich für weiterhin BANNED-Konten.

## Erweiterung 20.186

- Sofortige, fehlertolerante Wiederaufnahme eines PENDING-Scans beim API-Modulstart sowie regelmäßiger Scan alle 60 Sekunden.
- Kein zweiter Scan gleichzeitig innerhalb derselben API-Instanz; nach Keycloak-/Datenbankfehlern wird die Sperre im `finally` freigegeben.
- Für aktive Konten wird nicht nachträglich ein Logout ausgelöst. Interne Notizen, Session-Tokens und Passwörter dürfen niemals als Logs oder API-Antworten ausgegeben werden.
- Ein Neustart der API ist kein notwendiger Bestandteil der erfolgreichen Normalfunktion. Die laufende Instanz versucht PENDING erneut, und ein späterer Neustart darf die noch gespeicherten PENDING-Einträge nicht verlieren.

## Erforderliche vollständige Abnahme

1. CI: Format, Lint, Typecheck, Unit-Tests, Build und isolierte HTTP-E2E sowie Docker-/Prisma-Build.
2. Isolierter Mock-Keycloak/DB-Nachweis: direkte und automatische rote Karte, erzwungenes Keycloak-Timeout/401/403, persistiertes `PENDING`, Wiederherstellung ohne Entsperren, erneuter Scan nach simulierter Prozessneustart-Situation, `REVOKED` und idempotentes Verhalten.
3. Real DEV: ausschließlich neue synthetische Keycloak- und Kurvenfunk-Konten, Authorization Code + PKCE statt Direct Grant, echte aktive Keycloak-Sitzung, rote Karte, danach Keycloak-Sessions leer. Älterer JWT wird serverseitig mit `403 ACCOUNT_BANNED` zurückgewiesen; kein realer Benutzer betroffen.
4. Kontrollierte Wiederholung von PENDING auf DEV ohne echte Unterbrechung der gemeinsam verwendeten Keycloak-Instanz. Gegebenenfalls gezielt gesetzter PENDING-Testdatensatz für eine synthetische, bereits BANNED-Identität (kein globaler Keycloak-Ausfall).
5. Strikte Prüfung von Cleanup aller eigenen Benutzer, Sitzungen, Benachrichtigungen und Audit-Datensätze; keine Keycloak-Sicherheitsoptionen verändern, kein STAGING/PROD.
6. Negative Browser- und Mobil-Regression des BANNED-Zustands, ohne allgemeinen BANNED-Bypass. Einspruchsausnahmen werden erst in Task 189 definiert.

`DONE` erst nach CI und nachvollziehbarer isolierter sowie realer DEV-Abnahme. Ein positives Unit-Testergebnis alleine bedeutet nur `PARTIAL`.
