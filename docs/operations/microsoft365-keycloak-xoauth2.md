# KURVENFUNK – Microsoft 365 Exchange Online Versand (Keycloak XOAUTH2)

**Status:** Konfiguration vorbereitet, nicht produktiv aktiviert. Ziel ist ein
freigegebenes Exchange-Postfach `noreply@kurvenfunk.at`, nicht ein separater
SMTP-Benutzer und kein zweiter SMTP-/Graph-Adapter.

## Voraussetzungen

- Microsoft-365-Tenant mit verifizierter Domäne `kurvenfunk.at` und
  freigegebenem Exchange-Postfach `noreply@kurvenfunk.at`.
- Die direkte Anmeldung am Shared Mailbox Account bleibt **gesperrt**.
- Keycloak 26.6.3 unterstützt SMTP-XOAUTH2 seit Keycloak 26.2.
- DEV bleibt auf Mailpit; zuerst STAGING testen, dann separater PROD-Change.
- Microsoft Exchange Online hat Versandlimits, ist für
  transaktionale Kontomails gedacht, **nicht für Massenversand**.

## DNS bei Cloudflare – prüfen, nicht blind überschreiben

1. Microsoft 365 Admin Center → Einstellungen → Domänen →
   `kurvenfunk.at` → Status/DNS. Domain muss verifiziert sein.
2. Bestehende MX-Records **nur nach Prüfung** auf den von Microsoft für den
   eigenen Tenant angegebenen Exchange-Online-MX-Wert umstellen. Eine
   MX-Änderung betrifft alle bestehenden Empfänger der Domain!
3. Genau **einen** SPF-TXT-Eintrag an der Root-Domain pflegen; wenn
   Exchange Online der alleinige Absender ist, enthält der SPF-Eintrag
   `include:spf.protection.outlook.com`. Bestehende legitime Sender nicht
   versehentlich entfernen.
4. Microsoft Defender → E-Mail-Authentifizierung → DKIM →
   `kurvenfunk.at` → die **zwei individuell angezeigten** DKIM-CNAME-Ziele
   `selector1._domainkey` und `selector2._domainkey` kopieren. In
   Cloudflare als **DNS only** anlegen; anschließend Microsoft DKIM aktivieren.
   Microsofts CNAME-Ziele nicht erraten.
5. DMARC-TXT unter `_dmarc` mit vorerst prüfender Policy einrichten; nach
   Auswertung der Zustellung schrittweise härten. Bestehende Records prüfen.

## Microsoft Entra – separate Applikation

1. `entra.microsoft.com` → Identity / Applications →
   **App registrations** → **New registration**.
2. Name: `KURVENFUNK Keycloak Mailer`, nur Accounts dieses Tenants;
   **kein Redirect-URI** erforderlich.
3. Aus der App-Übersicht **Directory (tenant) ID** und
   **Application (client) ID** notieren.
4. Unter Certificates & secrets einen Client Secret mit definiertem
   Ablauf/Rotation anlegen. **Nur Secret Value** unmittelbar privat speichern;
   niemals an Chat, Ticket, Git, PowerShell-History oder CI-Logs weitergeben.
5. **Keine** tenantweite Graph `Mail.Send`- oder Exchange
   `SMTP.SendAsApp`-Berechtigung im Entra-API-Permissions-Tab vergeben.
   Wir wählen den von Microsoft dokumentierten **RBAC-only**-Weg, sonst
   können zusätzliche Rechte die Postfach-Eingrenzung umgehen.

## Exchange Online – Versandrecht ausschließlich für noreply

In Exchange Online PowerShell als entsprechend berechtigter Administrator:

- Unter **Enterprise applications** den **Service principal Object ID**
  der eben angelegten App feststellen (nicht die Object ID aus
  `App registrations` mit der Enterprise-App-Instanz verwechseln).
- `New-ServicePrincipal -AppId <ApplicationId> -ObjectId <ServicePrincipalObjectId> -DisplayName "KURVENFUNK Keycloak Mailer"`.
- Echtes Exchange-Postfach verifiziert: `PrimarySmtpAddress=noreply@kurvenfunk.at`,
  `RecipientTypeDetails=SharedMailbox`, **Alias=`KurvenfunkNoreply`**.
  Der Alias ist **nicht** `noreply`.
- Filter vor dem Anlegen der Management Scope prüfen:
  `Get-Recipient -Filter "Alias -eq 'KurvenfunkNoreply'" -ResultSize Unlimited`.
  **Exakt ein Ergebnis** muss zurückkommen, dessen primäre Adresse
  `noreply@kurvenfunk.at` lautet. Bei jeder Abweichung **abbrechen**.
- Erst danach die Management Scope anlegen:
  `New-ManagementScope -Name "KURVENFUNK-Mailer-noreply-only" -RecipientRestrictionFilter "Alias -eq 'KurvenfunkNoreply'"`.
  Den konfigurierten Scope mit
  `Get-ManagementScope -Identity "KURVENFUNK-Mailer-noreply-only" | Format-List Name,RecipientRestrictionFilter`
  gegen die verifizierte Filterung prüfen.
- `New-ManagementRoleAssignment -Name "KURVENFUNK-Keycloak-SMTP" -Role "Application SMTP.SendAsApp" -App <ApplicationId> -CustomResourceScope "KURVENFUNK-Mailer-noreply-only"`.
- `Test-ServicePrincipalAuthorization -Identity <ApplicationId> -Resource noreply@kurvenfunk.at`
  muss für `Application SMTP.SendAsApp` `InScope=True` zeigen. Nach
  Möglichkeit auch ein zweites fremdes Testpostfach prüfen:
  `InScope=False`.
- SMTP AUTH muss für den betroffenen Exchange-Zugang zugelassen sein.
  Bei Exchange Online SMTP AUTH ausschließlich OAuth verwenden,
  niemals Basic-Authentifizierung oder Shared-Mailbox-Passwort.

Referenz: Microsoft **Configure SMTP onboarding to App RBAC** und
**Role Based Access Control for Applications**. Der RBAC-only-Ansatz
verlangt **keine** tenantweiten API-Berechtigungen im App-Token;
zusätzliche Entra-Zustimmungen können additiv wirken.

## KURVENFUNK Keycloak STAGING/PROD-Env (nur privat, chmod 600)

```dotenv
MAIL_TRANSPORT=microsoft365
MAIL_FROM=noreply@kurvenfunk.at
MAIL_FROM_NAME=KURVENFUNK
MAIL_REPLY_TO=noreply@kurvenfunk.at
MAIL_M365_TENANT_ID=<Tenant-GUID>
MAIL_M365_CLIENT_ID=<Application-Client-GUID>
MAIL_M365_CLIENT_SECRET=<Client-Secret-Value>
```

- Keine `MAIL_SMTP_USERNAME` oder `MAIL_SMTP_PASSWORD` im Microsoft-Modus
  verwenden; sie werden aus Sicherheitsgründen abgelehnt.
- Der Code setzt automatisch `smtp.office365.com:587` mit STARTTLS,
  `authType=token`, als Token URL
  `https://login.microsoftonline.com/<Tenant-GUID>/oauth2/v2.0/token` und
  Scope `https://outlook.office365.com/.default`.
- `--check` validiert nur; `--apply` muss ausdrücklich und zunächst auf
  STAGING gestartet werden:
  `bash infrastructure/scripts/keycloak/configure-transactional-email.sh staging --check`
  und nach durchgeführtem RBAC/DNS-Test
  `bash infrastructure/scripts/keycloak/configure-transactional-email.sh staging --apply`.
- Credentials können in der Keycloak-Administrationsoberfläche beim
  SMTP-Readback maskiert sein; Prüfung vergleicht nur Nicht-Secret-Felder.
  Den Client Secret **nicht** an den Browser oder das API-Frontend geben.
- Vor PROD: Keycloak → Realm settings → Email → Test connection;
  reale Zustellung und SPF/DKIM/DMARC/Spam prüfen; Registrierung,
  E-Mail-Bestätigung, Reset und Login mit Testkonten abnehmen.
- Nach der Abnahme getrennten PROD-Change durchführen, Versandlimits,
  Audit-Logs, Fehlerversuche und Secret-Rotation überwachen.

**Nicht** automatisch auf DEV, STAGING oder PROD aktivieren:
Code-Merge ist keine Freigabe für das produktive Versenden.
