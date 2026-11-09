# Phase 20.191 – Sanction Expiration Worker: Runbook und Sicherheitsabnahme

## Geltungsbereich

Automatischer Ablauf durch den vorhandenen NestJS-Worker (bei Initialisierung sofort und danach alle 60 Sekunden) für **LIMITED**, **COMMENT_BLOCK**, **FORUM_BLOCK** und **IP_BLOCK**. Weitere Sanktionstypen wie `ACCOUNT_BAN` oder unbefristete rote Karten werden nicht pauschal freigeschaltet: dies ist keine generelle Account-Unban-Funktion. Bestehende IP-Schutzflags bleiben OFF, ebenso `APPEAL_FOUR_EYES_ENABLED`. Keine STAGING- oder PROD-Aktivierung.

## Ablauf, Persistenz und Sicherheitsregeln

- Der Worker selektiert höchstens 50 abgelaufene Datensätze je Kategorie pro Durchlauf (älteste zuerst). Nicht überlappende Scans vermeiden unnötige gleichzeitige Prüfungen innerhalb einer Instanz. Bei Neustart wird der erste Scan unmittelbar wiederholt, danach alle 60 Sekunden. Einmalige Scanfehler werden protokolliert und beim nächsten Tick erneut bearbeitet.
- Ablauf erfolgt in PostgreSQL-Transaktionen unter dem **User `FOR UPDATE`**-Lock, wie bei direkter RED-/LIMITED-Vergabe und Einspruchsentscheidungen, und mit bedingten `updateMany(status=ACTIVE, expiresAt<=at)`-Updates. Bei parallelen Instanzen wird nur ein Ablauf dokumentiert.
- Nach LIMITED-Ablauf darf die automatische Rückkehr zu `ACTIVE` nur bei zuvor `LIMITED` gesetztem Konto und **ohne** andere aktive LIMITED-Sanktion, aktiven ACCOUNT_BAN oder aktive, nicht widerrufene RED-Karte erfolgen. Ein `BANNED`-Konto wird dadurch niemals entsperrt. COMMENT_BLOCK und FORUM_BLOCK ändern den Konto-Status nie.
- IP-Sperren werden ausschließlich nach Ablauf und solange aktiv deaktiviert. Eine verknüpfte IP-Sanktion wird nur bei bisherigem Status ACTIVE auf EXPIRED gesetzt; `SANCTION_EXPIRED`-Audit wird **nur bei tatsächlich erfolgtem Statusübergang** erzeugt. Bereits widerrufene oder deaktivierte Datensätze erzeugen keine falschen Doppel-Audits. Das `IP_BLOCK_EXPIRED`-Audit dokumentiert die tatsächliche Blockdeaktivierung; keine Klartext-IP oder Netzwerkschlüssel in Logs.
- Die Prüfungen ersetzen keine Administrator-Revoke-Aktion und legen weder neue IP-Sperren noch reale Sanktionen an.

## Abnahme

1. Vollständige PR-CI: Format, Lint, Typecheck, Unit, API-/Worker-/Web-Build; isoliertes echtes PostgreSQL/Redis/JWT-HTTP-E2E; Docker-Build der Prisma-Worker-Images; Gateway/Redis-Störung und Recovery.
2. Unit-Tests: Ablauf, weitere aktive LIMITED/ACCOUNT_BAN/RED, BANNED-Schutz, Kommentar/Forum, IP-Sanktion bereits widerrufen, keine Audits bei Duplikat, Überschneidungsschutz, Wiederanlauf/60s-Timer, Timer-Cleanup.
3. Isolierter PostgreSQL-E2E-Scan: Parallelaufrufe zweier Worker-Serviceinstanzen, Duplikat-Audit-Vermeidung, vorher widerrufene IP-Sanktion, Status `ACTIVE` ausschließlich für geeignete Konten, BANNED/LIMITED-Bestandsfälle, Wiederanlauf mit frisch erzeugtem Service. Alle synthetischen Daten werden entfernt, die Wegwerfcontainer vom CI-Runner gestoppt.
4. **Echter DEV-Worker-Interval-Smoketest (kein manueller Serviceaufruf):** nur nach erfolgreicher DEV-Deploy auf **exaktem Commit** und Marker `[phase20-191-dev-worker]`. Job `phase20-191-dev-worker` prüft Branch `develop`, unveränderten Checkout, Dateirechte, wirksame Flags OFF. Er legt transaktional nur neue synthetische Testkonten und abgelaufene LIMIT/COMMENT/FORUM/IP-Datensätze an; HMAC erhält ausschließlich eine RFC-5737-Dokumentationsadresse mit ephemerem Schlüssel. Ohne Worker-Sonderaufruf beobachtet er die normale 60s-Verarbeitung (bis max. 165s), prüft Audit genau einmal, sichere Kontostatus-Rückgabe und vollumfängliche Bereinigung. Keine echten Benutzer-/IP-Daten werden im Skript gelesen oder verändert.
5. Ein fehlgeschlagener Smoke oder unvollständiger Cleanup darf nicht als DEV DONE markiert werden. Ein technischer `COMMENT`-PR-Review bedeutet **keine unabhängige Freigabe**.

## Grenzen

Die 50er-Batch-Grenze bedeutet bei sehr großer abgelaufener Warteschlange eventuell mehrere Minuten bis zur vollständigen Abarbeitung; der Worker ist **eventual-consistent**, kein synchroner Echtzeit-Scheduler. Es wird kein Anspruch auf Interaktiv-Browser-Tests erhoben (dieser Task betrifft primär Worker und Transaktionen). Bei produktivem Cluster-Betrieb sind weitere Telemetrie/Alerting- und Lasttests separat zu planen.
