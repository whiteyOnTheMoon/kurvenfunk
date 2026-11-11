# DEV-Keycloak: freigegebener Apply nach Paritätsvorschau

Stand: 11. November 2026. Nur `kurvenfunk-dev` auf `develop`; STAGING und PROD werden nicht angesprochen.

## Ausgangslage

- Zwei historische DEV-Resetläufe [#42958281430](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42958281430) und [#42962564502](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42962564502) waren bei sechs verifizierten privaten Backups und Anwendungstabellen erfolgreich, entfernten aber aus Keycloak jeweils nur **eines** der vorhandenen regulären Konten.
- Die separate Keycloak-SQL-/Admin-API-Diagnose [#42961404005](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42961404005) hatte ursprünglich acht API-sichtbare reguläre Konten plus ein verborgenes Servicekonto gemeldet.
- PR #152 verhindert diesen unvollständigen Enumerationsfall vor jeder Mutation: SQL-Zähler, API-`users/count`, zwei Listen und Identitätsmengen müssen übereinstimmen. Spätere SQL-/API-Nachzahlen müssen den geschützten Restbestand bestätigen.

## Verbindliche Freigabebedingungen

Ein Apply wird **erst nach** erfolgreicher CI dieser Dokumentation, erfolgreichem DEV-Deployment des Sicherheitspatches und einem **grünen read-only Kandidatenplan** (`[dev-keycloak-cleanup-plan]`) gestartet. Der Plan muss vollständige Parität melden und alle privilegierten Accounts identifizieren, ohne Daten zu löschen.

Falls die Vorschau scheitert, die API abweichende Zahlen liefert, ein echter Admin vorliegt oder die Schemaprüfung fehlschlägt, **kein Apply**.

Für den Apply wird ausschließlich der bereits vorhandene DEV-only Workflow `dev-residual-reset-apply` mit Commitmarker `[dev-residual-reset]` genutzt. Er erzwingt exakt gepinnten `develop`-Commit, isolierte DEV-Volumes und ausgeschaltete Scheduler und erstellt **erneut sechs private und verifizierte Backups**.

Erfolg darf erst nach bestätigtem `DEV_KEYCLOAK_CLEAR_RESULT=PASS_VERIFIED`, der bewahrten Master-Identität, leeren Anwendungstabellen und einer unabhängigen DEV-Nachinventur gemeldet werden. Die Serviceidentität und technische Realms/Konfiguration bleiben erhalten.

Das ist die bereits erteilte Vollbereinigungs-Freigabe für DEV, nicht für STAGING oder PROD.
