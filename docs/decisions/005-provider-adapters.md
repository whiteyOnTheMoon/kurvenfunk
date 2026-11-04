# ADR 005 – Externe Daten durch Provideradapter

- **Status:** Proposed (bestehende technische Wahl, Freigabe ausstehend)
- **Stand:** 04.11.2026

## Kontext

Externe News- und Sportdaten unterscheiden sich in Formaten,
Verfügbarkeit, Qualität und Nutzungsrechten.

## Vorgeschlagene Entscheidung

Separate Adapter für Abruf, Normalisierung und Quellenmetadaten.
Der Importkern führt Validierung, Zuordnung, Review und bewusste
Freigabe durch. Ein Adapter aktiviert nicht automatisch einen
vertrauenswürdigen Publishweg.

## Folgen und Alternativen

Provider lassen sich austauschen, aber Fehler-, Retry- und
Lizenzverträge müssen je Provider dokumentiert werden.
Quellen-/Bildrechte werden vor Livebetrieb geprüft.

## Abnahme

OTS-Livevertrag und weitere externe Anbieter nicht freigegeben.
