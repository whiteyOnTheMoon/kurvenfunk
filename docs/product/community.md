# KURVENFUNK – Community und Moderationskonzept

> **Arbeitsentwurf vom 04.11.2026 – Moderationsregeln und rechtliche Prüfung
> sind nicht endgültig freigegeben.**

## Community-Bereiche

Artikel können öffentliche Diskussionen mit Antworten und Reaktionen haben.
Vereins- und allgemeine Foren sind im Masterplan vorgesehen, aber nicht
allein aufgrund vorhandener Datenmodelle als produktbereit anzusehen.
Nutzerprofile tragen Vereinspräferenzen und Community-Aktivitäten.

## Beteiligung

- Lesen öffentlicher Inhalte bleibt auch ohne Anmeldung möglich.
- Schreibaktionen setzen eine gültige Identität und abgeschlossenes
  Onboarding voraus.
- Kommentare und Antworten müssen den konfigurierten Spam- und
  Berechtigungsregeln genügen.
- **Verbindlicher Produktentscheid vom 04.11.2026:** Kommentare verwenden
  UPVOTE und DOWNVOTE (statt des ursprünglichen LIKE-only-MVP).
  Ein Nutzer kann pro Kommentar maximal eine Stimme abgeben, diese wechseln
  oder zurücknehmen. Eigenes Voting ist nicht erlaubt.
- Meldungen werden vertraulich behandelt. Eine Meldung allein löst nicht
  automatisch eine Strafe aus.

## Vorgeschlagene Verhaltensregeln

Kein Spam, keine gezielte Belästigung, keine Bedrohungen, keine Veröffentlichung
privater Daten ohne entsprechende Berechtigung und keine missbräuchliche
Manipulation von Reaktionen. Kritik an Vereinen, Spielern und redaktionellen
Inhalten ist grundsätzlich zulässig. Der genaue Wortlaut der Communityregeln,
Beschwerdeverfahren und die Eskalationspraxis sind gesondert freizugeben.

## Moderation und Accountstatus

- **ACTIVE:** Erlaubte Communityaktionen entsprechend Rollen und Onboarding.
- **LIMITED:** Lesen und entsprechend der aktuellen Matrix Voten;
  schreibende Community- und Adminaktionen sind eingeschränkt.
- **BANNED:** Geschützte Aktionen gesperrt; laufende Keycloak-Sitzungen
  werden über einen widerrufbaren, wiederholbaren Prozess behandelt.
- Gelbe und rote Karten müssen Grund, Akteur, Ziel, Zeit und gegebenenfalls
  interne Notizen nachvollziehbar dokumentieren.
- Einsprüche dürfen nur mit geeigneter Identitäts- und Berechtigungsprüfung
  verarbeitet werden; offene Implementierungen stehen in Phase 20.

**Leitprinzipien:** geringstmögliche Rechte, dokumentierte Entscheidungen,
Trennung öffentlicher Gründe von internen Notizen, Schutz persönlicher Daten,
kontrollierte Sanktionsfristen und nachvollziehbare Korrekturmöglichkeiten.

## Rollen und Berechtigungen

Die API muss die wirksame Berechtigung serverseitig überprüfen; eine verborgene
Schaltfläche im Frontend genügt nicht. Moderatorenrechte sind von
Redaktions- und Superadminrechten zu trennen. Der konkrete Rechtekatalog
liegt im Berechtigungssystem und seinen Tests; dieses Dokument ersetzt ihn
nicht.

## Noch offene Abnahmepunkte

- Report-Bearbeitung im Dashboard, Einsprüche, IP-Schutz und optionales
  Vier-Augen-Prinzip gemäß Phase 20 fertigstellen.
- Reale Tests für LIMITED, BANNED, Wiederherstellung und Sperrablauf.
- Aufbewahrungsfristen und Datenzugriff für Moderationsdaten festlegen.
- Browser- und Mobileprüfungen einschließlich Fehlermeldungen durchführen.
- Verbindliche Richtlinien sowie zuständige Prüfer benennen.

**Status:** Konzeptentwurf, nicht final genehmigte Community Policy.
