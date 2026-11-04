# KURVENFUNK – Personalisierung

> **Arbeitsentwurf vom 04.11.2026 – Rankingregeln bleiben fachlich zu
> validieren.**

## Ausgangsdaten

Das aktuelle Onboarding kennt die Präferenzen `CLUB`, `NEUTRAL` und
`UNSET`. Die Wahl `CLUB` setzt die Auswahl eines Vereins voraus.
`NEUTRAL` bedeutet keine Vereinsbevorzugung. Präferenzen müssen über
das Benutzerprofil später geändert werden können.

## Zielverhalten

1. Nutzern mit Lieblingsverein werden in der persönlichen Startansicht
   relevante News und passende Vereinsinformationen priorisiert angeboten.
2. Neutrale Nutzer erhalten eine ausgewogene, einheitlich gestaltete Ansicht.
3. Das Vereinsbranding darf die Lesbarkeit, Kontraste und Bedienbarkeit
   nicht beeinträchtigen.
4. Andere wichtige Fußballmeldungen müssen trotz Vereinspräferenz
   auffindbar bleiben.
5. Fehlende oder veraltete Sportdaten sollen als Empty/Error-State und
   nicht stillschweigend mit scheinbar echten Mockdaten erscheinen.

## Datenfluss und Datenschutz

Keycloak authentifiziert. Die Kurvenfunk-Datenbank verwaltet die fachliche
Präferenz. Die API liefert nur die für Darstellung und autorisierte
Verarbeitung notwendigen Daten. Keine zusätzlichen Trackingprofile
oder automatisierte Werbeentscheidungen werden durch diesen Entwurf
genehmigt.

## Prüffälle

- Erstes Onboarding: Lieblingsverein auswählen oder neutral bleiben.
- Präferenzwechsel und Sitzungsneustart: aktualisierte Auswahl sichtbar.
- Standardbranding für neutrale Nutzer; Vereinsdesign bei `CLUB`.
- News verschiedener Vereine: Priorisierung fachlich sinnvoll,
  keine unerwartete Ausblendung.
- Fehlende Zuordnungen: kontrollierter Empty-State statt Mockanzeige.
- Mobilansicht, Tastatursteuerung, Farbkontrast und Seitenladezeit.

**Status:** Konzeptentwurf. Die endgültige Rankingstrategie und die
Browserabnahme sind offen.
