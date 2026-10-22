# Meilensteine – Bezug zum Audit 001–174

Kein Meilenstein ist durch die vorliegenden Nachweise vollständig abgenommen. Für M1–M10 liegen relevante Aufgaben überwiegend im Prüfumfang. M11 ist durch 174 direkt berührt; weitere Kriterien verlangen spätere Aufgaben. M12–M16 reichen wesentlich über 174 hinaus und werden hier **nicht als erneut vollständig auditiert** ausgegeben. UNKNOWN bedeutet dort fehlende Gesamtprüfung, nicht zwingend völlige Nichtimplementierung.

| Meilenstein laut v1.1 | Bewertung | Technischer Stand / offenes Abnahmekriterium |
|---|---|---|
| M1 Architecture Ready | PARTIAL | Struktur und Umgebungen vorbereitet; 001–005 verbindliche Produkt-/Architekturdokumente fehlen, VPS-Strukturzustand unbekannt. |
| M2 Infrastructure Ready | PARTIAL | DB/Redis real lokal genutzt, Compose gültig. Keycloak/Meili/MinIO und alle Persistence-/Restart-/Netz-/Isolationskriterien nicht praktisch vollständig geprüft. |
| M3 Application Foundation Ready | PARTIAL | Web/API/Worker bauen, echte API/Queue/Workerpfade funktionieren. Web→API→Worker-Trace nicht vollständig, Loggingredaction/Health-/Containerabnahme offen. |
| M4 Deployment Ready | PARTIAL | CI-/Deployment-/Backup-/Restoreskripte vorhanden. API-E2E kaputt, Webauswahl/App-Typechecks unvollständig, kein aktueller unabhängiger Restore-/Release-/Rollbackdrill. |
| M5 Core Backend Ready | PARTIAL | Schema/11 Migrationen/Seeds/Permissionkern real nachgewiesen. APIvalidation/Paging/Auditverhalten und Stagingabnahme offen. |
| M6 Authentication & Onboarding Ready | PARTIAL | Echter JWT-/User-/Onboarding-/Preference-APIpfad lokal bestätigt. Reale Registrierung/Verify/Google/Linking/Reset/Sessions nicht geprüft; Tokenrefresh und Servergate fehlen. |
| M7 Personalization Ready | PARTIAL | Theme-/Rankingcode und Helpertests vorhanden; Preferencepersistenz bestätigt. Mockblöcke in Start-/Vereinsseite und Browser/Mobile/Staging offen. |
| M8 Editorial Ready | PARTIAL | Echter CRUD-/Relations-/Review-/Publish-/Revision-/Archive-/Restore-Slice; fälliger Artikel wird publiziert. Bildvalidierung/Storage/Editorbrowser/Gesamtscheduling/Auditspur offen. |
| M9 News Automation Ready | PARTIAL | Echte Fakepipeline, Rawpayload/Matching/Dedupe/AutoPublishteil bestätigt. Review→Artikel fehlt, Liveproviderrechte und reale Retry/DLQ-/Race-/Browserabnahme offen. |
| M10 Community Ready | PARTIAL | Echte Comments/Replies/Edit/Delete/Votes/Reports/SQLcursor und Redisgrenzen bestätigt. Servergate, LIKE-Abweichung, Moderationsaudit und Browser/Mobile/Staging offen. |
| M11 Moderation Ready | Nicht erreicht; Gesamtumfang jenseits 174 nicht neu abgenommen | 174 Kartenvergabefunktion fehlt. Status-/Permissionkern funktioniert; Drei-Gelb→Rot, Direktrot, Revoke, Sanktionen und vollständige Notifications/Audit sind keine Modellfolge. |
| M12 Football Data Ready | UNKNOWN für Gesamtmeilenstein | Club-/Match-/Standingmodelle und Readseiten vorhanden; Import-/Resultat-/Berechnungsaufgaben nach 174 nicht vollständig neu geprüft. Kein Gesamt-DONE ableitbar. |
| M13 Forum Ready | UNKNOWN für Gesamtmeilenstein | Modell 073 vorhanden, Clubforum/Moderationsoberflächen im relevanten Slice Platzhalter. Spätere Forenaufgaben nicht erneut einzeln auditiert. |
| M14 Platform Ready | UNKNOWN für Gesamtmeilenstein | Notificationmodell/Queuenamen ersetzen keinen Zustellpfad; vollständige Suche/Admin/Cache/Monitoring außerhalb des 174er-Auftrags. |
| M15 Launch Ready | Nicht nachgewiesen | Im aktuellen Scope bereits offene kritische Dependency-Advisories und E2E-/Typecheck-/Funktionslücken; spätere Datenschutz/A11y/Load/Beta-Gates nicht neu geprüft. |
| M16 KURVENFUNK LIVE | UNKNOWN | Keine öffentliche/produktive Domain kontaktiert; Stabilität/Livebetrieb nicht Gegenstand zulässiger Prüfung. |

Die Untermenge von 42 DONE-Aufgaben ist kein abgeschlossener Meilenstein. Jede künftige Meilensteinfreigabe benötigt den jeweiligen fachlichen Abnahmefluss und die noch fehlenden DoDnachweise.
