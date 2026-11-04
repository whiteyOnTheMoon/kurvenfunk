# ADR 002 – Keycloak-Authentifizierung

- **Status:** Proposed (bestehende technische Wahl, Freigabe ausstehend)
- **Stand:** 04.11.2026

## Kontext

Registrierung, Anmeldung und Sitzungen sollen nicht mit einem zweiten
Passwortsystem in der Fach-API dupliziert werden.

## Vorgeschlagene Entscheidung

Keycloak als Identity Provider mit PKCE im Web. Die API validiert
Tokens und prüft zusätzlich fachliche Rollen, Onboarding und
Accountstatus. Token-Erneuerung und Session-Revoke bleiben getrennte
Betriebs- und Testverantwortungen.

## Folgen und Alternativen

Fachbenutzerdaten bleiben in PostgreSQL, Identität und Sitzungen bei
Keycloak. Ausfälle, Refresh, Browser-Sicherheit und widerrufene
Sitzungen brauchen eigene Integrationsabnahmen.

## Abnahme

Identity-/Security-Review und dokumentierte Recovery-Fälle offen.
