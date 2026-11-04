# ADR 001 – Modularer Monolith

- **Status:** Proposed (bestehende technische Wahl, Freigabe ausstehend)
- **Stand:** 04.11.2026

## Kontext

News, Redaktion, Community und Sportdaten teilen fachliche Beziehungen
und Berechtigungen. Das Repository nutzt NestJS-Module und einen
gemeinsamen Prisma-Vertrag.

## Vorgeschlagene Entscheidung

Ein modularer Monolith mit getrennten Web-, API- und Workerprozessen.
Fachgrenzen durch Module, Schnittstellen und getrennte Tests erzwingen.

## Folgen und Alternativen

Weniger verteilter Betriebsaufwand, dafür sorgfältige Modulgrenzen,
gemeinsame Schema-Migrationen und DB-Poolkontrolle. Microservices
bleiben eine spätere, nur bei messbarem Bedarf zu prüfende Alternative.

## Abnahme

Verantwortliche Architekturfreigabe und Nachweis der Modulgrenzen offen.
