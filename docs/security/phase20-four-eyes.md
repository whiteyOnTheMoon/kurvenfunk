# Phase 20.190 – optionales Vier-Augen-Prinzip (Einsprüche)

Status: **Feature-Branch; nicht als DEV DONE markieren ohne grüne CI, exakten Merge, DEV Deploy und Read-only-Abnahme.**

## Sichere fachliche Festlegung / Grenzen

Die Roadmap definiert eine *optional verpflichtende* Zweitprüfung für besonders kritische Entscheidungen, lässt die Auswahl der kritischen Aktionen offen. Diese erste, klar begrenzte Implementierung schützt **beide finalen Einspruchsentscheidungen** (ACCEPTED und REJECTED) aus Task 189, **nur nach ausdrücklicher Aktivierung** von `APPEAL_FOUR_EYES_ENABLED=true` an der API. Die Vorgabe ist **false**; weder DEV noch STAGING oder PROD wird automatisch umkonfiguriert. Direktes RED-Ausstellen, manuelle IP-Sperren, automatische Sanktionen und andere Statusänderungen bleiben **außerhalb dieser Policy** und werden nicht heimlich verzögert. Die Erweiterung auf diese Pfade erfordert eine separate fachliche Freigabe und deren eigene Tests.

## Zwei getrennte Rollen, keine Selbstfreigabe

1. Ein aktiver ADMIN/SUPERADMIN mit `user.ban` ruft unverändert `PATCH /api/v1/moderation/appeals/:id/decision` auf. Bei deaktivierter Policy bleibt Task-189-Verhalten unverändert. Bei aktivierter Policy wird *ausschließlich* ein persistierter Vorschlag `PENDING_APPROVAL` mit beabsichtigter Entscheidung und vertraulicher Erstnotiz abgelegt, mit Audit `APPEAL_DECISION_PROPOSED`. **Noch keine** Karten-/Sanktions-/Accountmutation und **keine** abschließende Nutzerbenachrichtigung.
2. `GET /api/v1/moderation/appeals/pending` ist ausschließlich mit `user.ban` erreichbar, begrenzt auf 50 Fälle und `private, no-store`. `GET /api/v1/moderation/appeals/policy` ist für `user.warn` lesbar; liefert nur den Policy-Schalter.
3. Ein **anderer** aktiver ADMIN/SUPERADMIN verwendet `PATCH /api/v1/moderation/appeals/:id/approval` mit `outcome=APPROVE|RETURN` und einer eigenen Notiz (10–2000 Zeichen). Es gilt die bereits bestehende Sperre gegen Überprüfung des eigenen Einspruchs **plus** die Sperre gegen Selbstfreigabe des Vorschlags. Der Server prüft dies anhand der internen Nutzer-IDs, nie anhand von Clientangaben. `APPROVE` führt die ursprünglich vorgeschlagene Entscheidung aus (nicht eine vom Zweitprüfer überschreibbare Entscheidung). `RETURN` setzt den Fall auf `OPEN` zurück und erfordert einen neuen Vorschlag.
4. Sowohl Vorschlag als auch Freigabe/Rückgabe laufen unter PostgreSQL-`User FOR UPDATE`-Lock und Transaktion; konkurrierende Entscheidungen bzw. doppelte Freigaben liefern `409`. Die bestehende Task-189-Logik für Widerruf, Neuberechnung, Audit und Notifications bleibt bei endgültiger Annahme maßgeblich. Weitere aktive RED/ACCOUNT_BAN verhindern weiterhin ein Entsperren. `IP_BLOCK` bleibt nicht anfechtbar und wird nicht verändert.
5. `Appeal` hat neue nullable Proposal-Spalten und `PENDING_APPROVAL`-Status. Additive Prisma-Migration `20261109030000_phase20_190_four_eyes`, ohne rückwirkende Umschreibung früherer Einsprüche. Audit: `APPEAL_DECISION_PROPOSED`, `APPEAL_DECISION_APPROVED`, `APPEAL_DECISION_RETURNED`. An Antragsteller dürfen weder Proposer-/Approver-IDs noch private Entscheidungsnotizen, Auditmetadata, IP-Hashes oder Netzwerksperren gelangen.
6. Falls die Policy später abgeschaltet wird, dürfen bereits wartende Vorschläge **nicht** durch den alten Einzelentscheidungs-Endpunkt umgangen werden. Ein offener `PENDING_APPROVAL`-Fall muss weiter von einer anderen Person bestätigt oder zurückgegeben werden.

## Abnahme

- Grüne PR-Gates: Format, Lint, Typecheck, Unit, Web/API Build, isoliertes PostgreSQL/Redis/JWKS-signiertes HTTP-E2E, Worker/Prisma-Docker und Gateway-/Redis-Recovery.
- Isoliertes E2E aktiviert Schalter im Wegwerfprozess, prüft Vorschlag ohne Kontomutation, Ablehnung der Selbstfreigabe, RBAC, 400/403/409, Rückgabe, Bestätigung, doppelte Ausführung, Audit und unveränderte private Daten. Bestehende Task-189-Tests müssen bei OFF weiterhin unverändert bestehen.
- DEV: nach exaktem `develop` Merge `[phase20-190-dev-four-eyes]` der einmalige read-only Smoke auf aktuellem Commit. Prüft kompilierte Permission-Anmerkungen, Default-OFF-Policy, anonyme 401, HTTP-/DB ohne echten Nutzerdatenzugriff und **keine** Mutation. DEV-Policy bleibt OFF. Kein realer Nutzer oder Einspruch wird verändert.
- Technischer PR-Review ist ggf. `COMMENT`, keine unabhängige Reviewerfreigabe. Erst bei dokumentierter CI, DEV deploy, Smoke SUCCESS und bestätigtem Scope Roadmap #27 aktualisieren.
- **Keine STAGING-/PROD-Änderung**, keine Aktivierung der Zweitfreigabe auf einem gemeinsamen Environment ohne explizite Policyentscheidung.
