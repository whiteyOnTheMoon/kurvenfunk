# Phase 20.185 – Rote Karte + optionaler IP-Schutz

**Status: Code-Entwurf, nicht DEV-abgenommen.** Umsetzung ausschließlich über Feature-Branch und geprüften PR nach `develop`. Keine STAGING-/PROD-Aktivierung.

## Fachliche Grenze

Eine rote Karte sperrt das Konto und veranlasst den separaten Keycloak-Session-Revoke-Pfad. Sie löst **niemals selbst** eine IP-Sperre aus. Eine bekannte IP darf bei nachgewiesenem schwerem Missbrauch nur durch eine **eigene** SUPERADMIN-Entscheidung kurzzeitig geschützt werden. Die IP ist ein Netzwerkmerkmal und kein Beweis für die Identität einer Person: VPN, Shared IPs, Mobilfunk, CGNAT und öffentliche Netze können Dritte treffen.

Es werden weder Client-IP noch HMAC-Secret noch private Moderationsnotiz in API-Antworten oder Audit-Metadaten der Anlage zurückgegeben. HMAC und Schlüsselversion bleiben nur intern in `IPBlock`. Der Accountban bleibt unabhängig von einer technischen Netzwerksperre.

## API

**Anlegen:** `POST /api/v1/moderation/red-cards/:cardId/ip-protection`

Nur aktiver `SUPERADMIN` mit serverseitig geprüftem `user.ipban`; nicht für `MODERATOR`, `ADMIN`, `LIMITED` oder `BANNED`. `:cardId` ist eine UUIDv4 einer aktiven roten Karte auf einem weiterhin `BANNED`-Account. Der Request enthält ausschließlich:

- `ipAddress`: bekannte einzelne IPv4/IPv6-Adresse, serverseitig normalisiert und HMAC-gehasht
- `duration`: `15M`, `1H` oder `24H`; keine unbegrenzte, automatische oder langfristige Sperre
- `reasonCode`: begründeter kodierter Anlass, zum Beispiel `REPEATED_BAN_EVASION`
- `moderatorNote`: nichtöffentliche überprüfbare Evidenz
- `sharedIpRiskAccepted: true`: bewusste Bestätigung des Fremdbetroffenenrisikos

Ein leeres, fremdes, inaktives oder gelöschtes RED-Ticket wird abgewiesen. Schon vorhandene aktive Blockierungen dieser IP (einschließlich alter HMAC-Schlüsselversionen) oder bereits bestehender aktiver IP-Schutz der Karte werden als Konflikt behandelt. Keine Client-Angabe darf Actor, Source, Hash oder permanente Laufzeit vorgeben.

**Widerrufen:** `POST /api/v1/moderation/red-cards/:cardId/ip-protection/:blockId/revoke`

Gleiche Berechtigung; `reasonCode` und `moderatorNote` sind Pflicht. Nur die tatsächlich mit dieser Karte verknüpfte, noch aktive und nicht abgelaufene IP-Sperre (`source=SANCTION`) kann aufgehoben werden. Wiederholung liefert Konflikt statt doppelten Audit-Einträgen. Die rote Karte bleibt gültig, das Benutzerkonto bleibt `BANNED`. Der normale manuelle IP-Ban aus Task 184 ist ein anderer Workflow und kann hier nicht widerrufen werden.

## Datenspeicherung und Audit

Ein erfolgreicher Antrag erzeugt atomar unter `Serializable`:

1. `IPBlock(source=SANCTION, active=true, startsAt, expiresAt, keyed HMAC)`
2. `Sanction(type=IP_BLOCK, sourceCardId=<RED>, ipBlockId=<block>, expiresAt)`
3. Audit `IP_BLOCK_CREATED` und `SANCTION_CREATED` mit Karten-, Block- und Sanktionsbezug

`Sanction.userId` bleibt leer, da die IP nicht zweifelsfrei einer Einzelperson zuzuordnen ist. Der Herkunftsnachweis wird über `sourceCardId` geführt. Widerruf verändert ausschließlich IPBlock/Sanction und erzeugt `IP_BLOCK_DEACTIVATED` sowie `SANCTION_REVOKED`. Der bestehende Expiration Worker führt abgelaufene IP-Sperren unabhängig vom Accountstatus zurück.

## Rollout-Grenzen und Abnahme

`IP_TEMP_BLOCK_ENABLED` und `IP_TEMP_AUTO_BLOCK_ENABLED` werden **nicht** automatisch aktiviert. Eine gespeicherte Sperre wird erst durch eine getrennt kontrollierte Freigabe des bestehenden Schutzguards erzwungen. Kein automatisches dauerhaftes Sperren, kein Ermitteln beliebiger früherer Login-IPs, kein browserseitiges Freigabeformular als Bestandteil dieser API-Task (Dashboard Task 187).

Vor `DONE` erforderlich:

- Grüne Format-/Lint-/Typecheck-/Unit-/Build-/isolierte PostgreSQL-/Redis-/JWKS-HTTP-E2E-CI.
- Negative Rechte-, Input-, unbekannte/Kartenstatus-, Duplikat-, Key-Version- und Race-Tests, Audit-/Geheimhaltungstests.
- Nachweis, dass bestehende Red-Card-Erstellung **keine** IP-Sanktion erzeugt und weder Widerruf noch Ablauf den Benutzer entsperrt.
- Einmalige **synthetische DEV-Abnahme** mit Dokumentations-IP und ephemerem HMAC, kontrollierter Aktorberechtigung und vollständigem Cleanup; keine Änderung bestehender Benutzer oder produktiver IPs.
- Feature-Branch erst nach CI/Review nach `develop` mergen. STAGING/PROD unverändert.
