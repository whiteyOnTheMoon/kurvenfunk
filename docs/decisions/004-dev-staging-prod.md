# ADR 004 – DEV, STAGING und PROD getrennt betreiben

- **Status:** Proposed (bestehende technische Wahl, Freigabe ausstehend)
- **Stand:** 04.11.2026

## Kontext

Tests und Entwicklung dürfen reale Nutzer und produktive Daten nicht
beeinträchtigen.

## Vorgeschlagene Entscheidung

Unabhängige Umgebungsvariablen, Daten, Volumes, Zugangsdaten und
Freigaben für DEV, STAGING und PROD. `develop` darf nach CI nur DEV
automatisiert verändern; STAGING/PROD erhalten getrennte Freigaben.

## Folgen und Alternativen

Echte Integrationstests sollen bevorzugt eigene isolierte Ressourcen
verwenden. Cross-Environment-Secrets und ungeprüfte Schemaänderungen
sind auszuschließen.

## Abnahme

Tatsächliche Netz-, Backup- und Rechteisolation auf den Zielsystemen
muss geprüft werden.
