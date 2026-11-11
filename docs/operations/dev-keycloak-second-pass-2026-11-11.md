# DEV-Keycloak: zweite autorisierte, abgesicherte Bereinigung

Stand: 11. November 2026. Nur **DEV**. Keine Änderungen an STAGING oder PROD.

## Nachgewiesener Status

- [DEV-Reset 42958281430](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42958281430): sechs private und verifizierte Backups; 41 Anwendungstabellen, Medien und Mailpit bereinigt, Redis geleert. Keycloak-API löschte **1** Konto, aber neun Einträge blieben im DEV-Realm.
- [Nachinventur 42959403793](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42959403793): Anwendungstabellen null; Keycloak-SQL neun Benutzer.
- [Admin-API-Abgleich 42961404005](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42961404005): **8** normale Keycloak-DEV-Benutzer sind sowohl über `users/count` als auch über beide Admin-API-Auflistungen sichtbar; SQL zählt zusätzlich **1** Servicekonto. Kein Admin-Namensmarker unter den acht regulären Konten. Dies belegt **nicht** von selbst das Fehlen privilegierter Rollen, daher darf nichts durch SQL-Direktlöschung entfernt werden.

## Autorisierter zweiter Durchlauf

Die Freigabe des Betreibers umfasst vollständige Löschung der DEV-Anwendungs-, Test- und Medieninhalte. Für die acht verbliebenen regulären DEV-Realm-Konten soll **nur** der bestehende abgesicherte Workflow `dev-residual-reset-apply` mit Commitmarker `[dev-residual-reset]` verwendet werden, **nicht** ein direkter Datenbank-Drop oder Keycloak-Tabellentruncate.

Der Workflow muss erneut alle sechs DEV-Speicherbereiche privat sichern und die Backups prüfen, vor jeder Löschung eine konkrete, gepinnte `develop`-Revision und alle DEV-Volume-/Umgebungsgrenzen validieren und in der Keycloak-API die vorhandenen Administrator- und Servicekonten sowie privilegierte Realm-Management-Rollen schonen.

**Erfolg ist nur durch Laufprotokoll plus separate nachgelagerte, schreibgeschützte Inventur bestätigt.** Sollte `DEV_KEYCLOAK_DELETE_CANDIDATES` keine acht Konten anzeigen, die Anwendung unerwartete neue Inhalte enthalten oder ein Sicherheitscheck fehlschlagen, ist dies zu untersuchen; kein erneuter ungeprüfter Blind-Reset.

## Erwarteter Zielzustand

- Anwendung: leere Inhaltstabellen, technische Prisma-Historie bleibt.
- Keycloak: reguläre, nicht privilegierte DEV-Benutzer vollständig bereinigt; Servicekonto, Master-Admin und Realm-/Clientkonfiguration erhalten.
- Meili, MinIO-Anwendungs-Bucket und Mailpit: leer; Redis nach Neustart technisch erneuerte Schlüssel separat klassifizieren.
- Echte News-/Sportimporte weiter abgeschaltet bis Quellrechte und Anbieter kontrolliert aktiviert sind.
