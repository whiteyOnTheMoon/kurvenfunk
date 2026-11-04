# KURVENFUNK – MVP und Produktumfang

> **Arbeitsentwurf vom 04.11.2026 – fachliche Freigabe ausstehend.**
> Dieses Dokument beschreibt den geplanten Umfang und den beobachteten
> Implementierungsstand; es ist keine Launchfreigabe.

## Produktziel und Zielgruppe

KURVENFUNK richtet sich zunächst an Fans des österreichischen Fußballs,
insbesondere der österreichischen Bundesliga. Nutzer sollen aktuelle
redaktionelle Meldungen, Vereinsbezüge und Sportdaten an einer Stelle finden,
kommentieren und an einer moderierten Community teilnehmen können.

## Vorgeschlagene Kernfunktionen für die erste öffentliche Version

- Öffentliche News, Artikeldetailseiten, Vereins- und Wettbewerbszuordnung.
- Spielplan, Ergebnisse und Tabellen auf Basis nachweislich korrekter Daten.
- Registrierung und Login über Keycloak, E-Mail-Verifikation und Onboarding.
- Wahl von Lieblingsverein oder neutraler Ansicht; nachträgliche Änderung.
- Artikelkommentare, Antworten, Reaktionen, Meldungen und Spamprävention.
- Redaktioneller Artikelworkflow einschließlich Import-Review und Entwürfen.
- Moderation mit Karten, Sperren, Berechtigungen und Einspruchsprozess.
- Barrierearme Darstellung auf Mobilgeräten und Desktop sowie SEO-Basics.

**Abnahmeregel:** Ein bestehendes Datenmodell, Mockdaten oder eine grüne
Unit-Suite gelten nicht als vollständiger Produktnachweis. Vor einem Launch
sind echte Benutzer-, Browser-, Provider-, Datenschutz- und Betriebsabläufe
zu prüfen.

## Bewusst nicht ohne weitere Entscheidung als MVP zugesagt

- Voll ausgebautes Vereinsforum und allgemeines Forum; derzeit sind Teile der
  Backendmodule nur Platzhalter.
- Kommerzielle Premium-Abonnements, Merchandising und Zahlungsabwicklung.
- Internationale Ligen und aufwendige statistische Zusatzfunktionen.
- Vollautomatische Veröffentlichung ungeprüfter externer Nachrichten.

Diese Abgrenzung ist ein **Vorschlag**, keine bestätigte Streichung von
Aufgaben aus dem Masterplan. Die Phasen des Gesamtplans bleiben bestehen.

## Erlösmodelle zur Produktentscheidung

Mögliche Modelle sind Sponsoring, klar gekennzeichnete Werbung und später
optionale Zusatzangebote. Weder ein konkretes Modell noch Preise,
Werbepartner oder personenbezogene Werbeprofile sind beschlossen.
Rechts-, Datenschutz- und Kennzeichnungspflichten sind vor einer Umsetzung
gesondert zu prüfen.

## Offene Entscheidungen und Freigaben

1. Sind Forum und alle vorgesehenen Communityfunktionen Launchvoraussetzung?
2. Soll das MVP ausschließlich die österreichische Bundesliga abdecken?
3. Soll das geplante LIKE durch UPVOTE/DOWNVOTE ersetzt werden? Der Code
   verwendet aktuell das zweite Modell.
4. Welcher Newsprovider ist unter welchen Nutzungs- und Bildrechten zugelassen?
5. Welche Kriterien, Tests und Verantwortlichen geben eine Closed Beta und
   später einen öffentlichen Launch frei?

**Status:** Inhalt als Entwurf vorhanden; Aufgabe 001 erst nach
Produktentscheidung und dokumentierter Freigabe als DONE einstufen.
