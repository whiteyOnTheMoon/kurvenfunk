# ADR 003 – PostgreSQL als Source of Truth

- **Status:** Proposed (bestehende technische Wahl, Freigabe ausstehend)
- **Stand:** 04.11.2026

## Kontext

Artikel, Profile, Sanktionen und Importrecords verlangen dauerhafte
fachliche Konsistenz.

## Vorgeschlagene Entscheidung

PostgreSQL/Prisma führt transaktionale Fachzustände. Redis/BullMQ
unterstützt Queue-, Cache- und Rate-Limit-Funktionen, ist aber nicht
alleiniger Beleg für eine durchgeführte Fachaktion.

## Folgen und Alternativen

Idempotente Jobs, eindeutige Constraints, Auditspuren und
Wiederanlauf müssen bewusst entworfen und gegen echte Datenbank
unter Parallelität getestet werden.

## Abnahme

Transaktions- und Restorestrategie gesondert bestätigen.
