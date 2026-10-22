# Vergleich mit dem archivierten Audit

Vorher: `cabf1477136e0a4c8951655a11cf122cd834617e`. Jetzt: `17693e9ca3e51d8b13161be90a47a7d3491ad164`. Vergleich ausschließlich der ersten 174 Zeilen, nicht der damaligen 334er-Gesamtsumme.

Vorher {'TODO': 5, 'DONE': 37, 'PARTIAL': 130, 'UNKNOWN': 2}, jetzt {'TODO': 6, 'DONE': 42, 'PARTIAL': 124, 'UNKNOWN': 2}.

| Aufgabe | Vorher | Jetzt | Begründung |
|---|---|---|---|
| 042 Queue Infrastruktur | PARTIAL | DONE | Aufgabe verlangt Queue-Definition, keine Consumer aller zukünftigen Features; registrierte Namen erfüllen diesen Scope. |
| 055 Object Storage Backup Strategie | PARTIAL | DONE | Aufgabe verlangt Backupstrategie, nicht deren späteren Restore. Das vorhandene Strategiedokument deckt den Scope ab. |
| 060 User Status Model | PARTIAL | DONE | Enum plus zentrale Statusberücksichtigung jetzt real HTTP-verifiziert; Vergabe/Revoke gehören zu anderen Aufgaben. |
| 078 Audit Log Model | DONE | PARTIAL | Der Wortlaut verlangt nachvollziehbares Speichern kritischer Aktionen; vorhandenes Modell allein erfüllt diesen Verhaltensanteil nicht. |
| 083 Seed System | PARTIAL | DONE | Frische Seed-Ausführung belegt alle geforderten Testdaten; produktive Testdatenbereinigung ist kein Kriterium von 083. |
| 172 Permission System | PARTIAL | DONE | Zentraler Permissionkern tatsächlich implementiert; auch ArticleEditorialGuard delegiert an ihn. Fehlende Forum-/Kartenfeatures nicht als fehlender Kern doppelt zählen. |
| 173 Account Status Guard | PARTIAL | DONE | Zentraler Guard real geprüft. Sessionrevoke/Onboarding sind andere Anforderungen, nicht zusätzliche Guard-Kriterien. |
| 174 Yellow Card erstellen | PARTIAL | TODO | Kein ausführbarer Featureanteil vorhanden: Vorbereitendes Modell/Permission rechtfertigen kein PARTIAL der Kartenvergabe. |

Unveränderte Statuswerte bedeuten keine ungeprüfte Übernahme: Bewertungen wurden separat aus Originalanforderungen, aktuellem Quellstand und frischen Läufen formuliert. Das alte Dateiinventar wurde als Suchindex genutzt, reale Dateipfade wurden erneut geprüft und gehasht; nicht existierende Inventareinträge wurden verworfen. Die alten Klassifikationen wurden erst danach verglichen.

Die wesentlichen zusätzlichen Nachweise: echter JWT/JWKS-Pfad einschließlich Ablauf/Issuer/Audience/Signatur, realer User-Sync, Completion/Preferencewechsel, SQL-Cursor, Redis-Duplikat/Cooldown, Communitystatus, CRUD/Revisionen, echte BullMQ-Fakepipeline, realer Scheduled-Publishübergang. Diese verkleinern Nachweislücken, ersetzen aber keine Mobile-/Staging-/IdP-/Browserabnahme.

Bisherige F02 ist im Code durch gemergten PR #7 behoben: opt-in nur development und nur lokaler Peer ohne Proxyheader; 22 zusätzliche APItests ergeben 439 statt 417. Der deaktivierte Pfad liefert in neuer HTTP-Probe 404.

Bisherige F04/F08 sind nun zusätzlich lokal reproduziert: Vor-Onboarding-Kommentar 201 sowie Reviewentscheidung ohne Artikelerzeugung. F03 bleibt reproduziert: API-E2E scheitert am ESM-Export, 0 Tests. Webtestlücke bleibt 28 statt 50. Produktionsdependency-Audit weiterhin 6 critical/18 high/12 moderate/2 low. Registry-Advisories sind keine bestätigten Exploits.

Offene Fix-PRs #10 (Dependencies), #11 (API-E2E) und #12 (Webtestauswahl) werden nicht als develop-Implementierung angerechnet.

Präzisierungen gegenüber bisherigen pauschalen Lücken: 123/124 verlangen Darstellung/Highlight, nicht bereits den späteren Sportsimport oder die Tabellenberechnung. 170 verlangt Reportgründe, nicht das vollständige spätere Moderationsdashboard. 118 verlangt ausdrücklich Mockdaten; die gleichen Mocks sind erst bei der echten Start-/Vereinsseite (114/121) eine Integrationslücke. 100 delegiert Reset an Keycloak; fehlender Livebeweis ist kein Beleg einer nicht vorhandenen Resetfunktion. 172 besitzt bereits einen zentral delegierenden Editorialguard; eine pauschale Behauptung manueller Rollenchecks wäre falsch.
