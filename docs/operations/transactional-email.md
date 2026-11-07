# KURVENFUNK – Transaktions-E-Mail für Keycloak

## Ziel

E-Mail-Verifizierung, Registrierung und Passwort-zurücksetzen laufen in
Keycloak 26.x. Keine zweite Passwort-/Reset-Verwaltung in NestJS.

**DEV:** isolierter Mailpit-Catcher (Docker `mailpit:1025`, UI nur am VPS
`127.0.0.1:3107`). Kein Versand an echte Empfänger. Bereits im
`compose.dev.yml` vorhanden.

**STAGING / PROD:** externer, geprüfter Transaktions-SMTP-Dienst mit
Authentifizierung und TLS/SSL. Die Konfiguration ist anbieterneutral.
Kein eigener Mailserver, keine öffentlich erreichbare SMTP- oder Mailpit-UI.

## Vorbereitungs-Checkliste für echten Versand

1. Bei einem Transaktionsmail-Anbieter (zum Beispiel Brevo oder Resend) ein
   Konto und einen **ausschließlich für KURVENFUNK vorgesehenen SMTP-Key**
   anlegen. Provider-Zugriff und Secrets getrennt nach Umgebung.
2. Absenderadresse wie `no-reply@kurvenfunk.at` und die zugehörige
   Absenderdomain beim Anbieter verifizieren.
3. Im Cloudflare-DNS die vom Anbieter vorgegebenen DKIM- und
   SPF-Einträge setzen; bestehenden SPF-Eintrag **ergänzen statt einen zweiten
   SPF-TXT-Record zu erstellen**. DMARC für die Domain konfigurieren und
   Berichte beobachten. DNS ausschließlich aus offiziellen Provider-Werten.
4. Vertragliche Datenschutz-/Auftragsverarbeitungsbedingungen und
   Aufbewahrung der Versand-/Bounce-Logs prüfen. Nur notwendige
   Transaktionsmails versenden.
5. SMTP-Port, TLS-Modus, Absenderauthentifizierung, Bounce-/Suppression-Handling,
   Versandlimits und providerseitige Zustellung mit einem Testpostfach prüfen.
6. Nie echte SMTP-Keys in GitHub-Issues, Screenshots, Chat, Logs oder
   CLI-Argumenten veröffentlichen.

## Private Environment-Konfiguration

In der jeweiligen **nicht versionierten** `.env.staging` oder `.env.prod`
mit Dateirechten `0600`:

```dotenv
MAIL_TRANSPORT=smtp
MAIL_FROM=no-reply@kurvenfunk.at
MAIL_FROM_NAME=KURVENFUNK
MAIL_REPLY_TO=no-reply@kurvenfunk.at
MAIL_SMTP_HOST=smtp.provider.example
MAIL_SMTP_PORT=465
MAIL_SMTP_ENCRYPTION=ssl
MAIL_SMTP_USERNAME=REPLACE_IN_PRIVATE_ENV
MAIL_SMTP_PASSWORD=REPLACE_IN_PRIVATE_ENV
```

Alternativ Port `587` ausschließlich mit
`MAIL_SMTP_ENCRYPTION=starttls`. Für STAGING/PROD ist unverschlüsselter
SMTP-Versand verboten. Der konkrete Host und die SMTP-Zugangsdaten werden
vom gewählten Anbieter vorgegeben. `smtp.provider.example` ist nur ein
Platzhalter, keine erreichbare Adresse.

DEV benötigt keine externen SMTP-Daten. `MAIL_TRANSPORT=mailpit` ist
optional; das Tool erzwingt die Mailpit-Route in DEV unabhängig von
versehentlichen SMTP-Providerwerten.

## Tool – sicherer Workflow

Die Befehle werden auf dem jeweils passenden VPS/Checkout ausgeführt.
Standardmodus ändert **nichts**:

```bash
bash infrastructure/scripts/keycloak/configure-transactional-email.sh dev --check
bash infrastructure/scripts/keycloak/configure-transactional-email.sh staging --check
bash infrastructure/scripts/keycloak/configure-transactional-email.sh prod --check
```

Nach geprüfter Verbindung / Credentials / DNS und expliziter
Freigabe pro Umgebung:

```bash
bash infrastructure/scripts/keycloak/configure-transactional-email.sh dev --apply
# Erst nach erfolgreicher STAGING-Abnahme:
bash infrastructure/scripts/keycloak/configure-transactional-email.sh staging --apply
# PROD ist ein separater, expliziter Change:
bash infrastructure/scripts/keycloak/configure-transactional-email.sh prod --apply
```

`--audit` liest nur die bereits gespeicherten Realm-Parameter und gibt
`PASS` oder eine neutrale Fehlermeldung aus. SMTP-Passwörter dürfen dabei
nicht gedruckt werden. `--apply` überträgt die Zugangsdaten aus dem
privaten Env-File über eine nicht protokollierte STDIN-Pipe an einen
temporären, nur im Keycloak-Container gespeicherten 0600-JSON-File,
konfiguriert den Realm `kurvenfunk`, löscht die temporäre Datei und
vergleicht die nicht geheimen SMTP-Einstellungen.

Das Tool ändert nur `smtpServer`, nicht `registrationAllowed`,
`verifyEmail`, `resetPasswordAllowed` oder bestehende Keycloak-Benutzer.
Die bereits vorhandene DEV-Registrierungskonfiguration nutzt Mailpit.
Der alte `configure-email-registration.sh`-Bootstrap ist ausdrücklich
auf DEV beschränkt.

**Wichtig:** Ein erfolgreiches `--audit` beweist die Konfiguration,
nicht die tatsächliche Zustellung. Eine reale Testmail muss danach über
Keycloaks `Realm settings → Email → Test connection` (an ein freigegebenes
Testpostfach) gesendet und im Mailpit-Postfach beziehungsweise beim
Provider und im Empfängerpostfach geprüft werden. Erst dann die echten
Registrierungs-/Verifizierungs-/Reset-Workflows abnehmen.

## Abnahmematrix

| Gate | DEV | STAGING | PROD |
| --- | --- | --- | --- |
| Realm-SMTP-Konfiguration | Mailpit | Provider | Provider |
| Login-Regression | Testkonto | Testkonto | Geplanter Smoke |
| Registrierung & Verifizierungslink | Mailpit-Postfach | Reale Testmail | Freigegebener Smoke |
| Passwort-Reset & Einmal-Link | Mailpit-Postfach | Reale Testmail | Freigegebener Smoke |
| DNS SPF/DKIM/DMARC | nicht erforderlich | verifiziert | verifiziert |
| Bounce/Suppression/Rate-Limits | intern | Provider | Provider |
| SMTP Credential-Rotation / Recovery | dokumentiert | getestet | getestet |

### Rollback

Falls nach einer SMTP-Änderung ein Versandtest nicht erfolgreich ist:
Neuversand/Verifizierungszwang nicht vorschnell einschalten;
vorherige SMTP-Einstellungen über die Keycloak-Adminoberfläche wiederherstellen
und am Provider prüfen, ob der Key gesperrt ist. Bei fehlerhafter
Registrierungszustellung keine Weiterleitung nach PROD. Die SMTP-Änderung
benötigt keinen Neustart des Keycloak-Containers.

## Erweiterung

Die spätere NestJS-Benachrichtigungsfunktion sollte dieselbe verifizierte
Absenderdomain und denselben Provider verwenden, aber einen **separaten**
API-Key mit eigenem Versandlimit erhalten. Kein SMTP-Secret an den Browser
oder an die API weiterreichen, nur weil Keycloak bereits senden kann.
