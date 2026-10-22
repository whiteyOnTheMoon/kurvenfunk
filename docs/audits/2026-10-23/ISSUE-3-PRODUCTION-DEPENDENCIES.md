# Issue #3 – Produktionsabhängigkeiten

Stand: 23.10.2026, Europe/Vienna. Basis `develop` @ `17693e9ca3e51d8b13161be90a47a7d3491ad164`. Referenz: [Issue #3](https://github.com/whiteyOnTheMoon/kurvenfunk/issues/3), Audit F01/A01 vom 22.10.2026. Keine Produktionszugriffe, Deployments oder Exploitversuche.

## Reproduktion und Ergebnis

`pnpm audit --prod --json` vor Updates: 38 Einträge (6 Critical, 18 High, 12 Moderate, 2 Low). Nach Updates: 11 Einträge; Verteilung: `{"info": 0, "low": 0, "moderate": 3, "high": 8, "critical": 0}`. Kein Critical verbleibt. Exitcode bleibt wegen ausdrücklich triagierter Restbefunde 1; ein grüner Gesamtaudit wird nicht behauptet.

Alle 38 ursprünglichen Einträge einschließlich Versionen, **vollständiger** Dependency-Pfade, Plattform, Laufzeitpfad/Erreichbarkeit und Entscheidung stehen in [issue-3-advisory-triage.csv](issue-3-advisory-triage.csv). Auditmeldungen sind keine bestätigten Exploits. „Nicht erreichbar“ bezieht sich auf den geprüften Produktstart/-code, nicht auf mögliche zukünftige Features oder untrusted Buildinputs.

## Gewählte Updates und Grenzen

Next 16.4.1 und passend eslint-config-next; Nest Common/Core/Platform-Express 11.2.7 in API/Worker; Swagger 11.4.7; kohärente Tiptap-Familie 3.32.0. Keine Majorupdates, keine blind angewandten audit-fix-/Override-Regeln. Nest und Tiptap werden jeweils zusammengehalten, um Peerinkompatibilitäten zu vermeiden. Das Lockfile ist ausschließlich in diesem Paket bearbeitet worden; A02 startet nach Integration.

Der neue Multer-Patch macht den Arrayindexschutz **nicht automatisch aktiv** (`fieldArrayIndexLimit=Infinity`). Deshalb erhält die existierende flache Media-Metadaten-Schnittstelle eng begrenzte Multipartlimits: vier Metadatenfelder, ein File, fünf Parts, keine Feldverschachtelung und kein numerischer Index >0. Dies ist eine notwendige Nutzung des Securitypatches, keine allgemeine Upload-/MIME-Überarbeitung (A08 bleibt offen). [Upstreamhinweis](https://github.com/advisories/GHSA-535w-7cp7-47q4).

## Einzelfallübersicht

| Advisory | Severity | Paket | Ergebnis |
|---|---|---|---|
| [GHSA-pm4m-ph32-ghv5](https://github.com/advisories/GHSA-pm4m-ph32-ghv5) | high | js-yaml 5.2.1 | BEHOBEN |
| [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) | high | deepmerge-ts 7.1.5 | VERBLEIBEND_TRIAGIERT |
| [GHSA-3f6p-5ww8-9rcr](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr) | high | mysql2 3.15.3 | VERBLEIBEND_TRIAGIERT |
| [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) | moderate | qs 6.15.3 | BEHOBEN |
| [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) | moderate | qs 6.15.3 | BEHOBEN |
| [GHSA-cp6q-959q-f8rh](https://github.com/advisories/GHSA-cp6q-959q-f8rh) | moderate | @tiptap/core 3.30.1 | BEHOBEN |
| [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8) | high | fast-uri 3.1.5 | VERBLEIBEND_TRIAGIERT |
| [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) | high | fast-uri 3.1.5 | VERBLEIBEND_TRIAGIERT |
| [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) | high | fast-uri 3.1.5 | VERBLEIBEND_TRIAGIERT |
| [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) | high | fast-uri 3.1.5 | VERBLEIBEND_TRIAGIERT |
| [GHSA-rgwj-5xj2-c3m3](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3) | moderate | mysql2 3.15.3 | VERBLEIBEND_TRIAGIERT |
| [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) | critical | next 16.3.0 | BEHOBEN |
| [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | high | sharp 0.35.3 | BEHOBEN |
| [GHSA-j95f-988m-3j2f](https://github.com/advisories/GHSA-j95f-988m-3j2f) | high | @tiptap/core 3.30.1 | BEHOBEN |
| [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) | critical | next 16.3.0 | BEHOBEN |
| [GHSA-wc9g-mqfw-jrwm](https://github.com/advisories/GHSA-wc9g-mqfw-jrwm) | high | multer 2.2.0 | BEHOBEN |
| [GHSA-qfvm-cv95-jqjf](https://github.com/advisories/GHSA-qfvm-cv95-jqjf) | high | multer 2.2.0 | BEHOBEN |
| [GHSA-qvfw-j98x-7q72](https://github.com/advisories/GHSA-qvfw-j98x-7q72) | low | multer 2.2.0 | BEHOBEN |
| [GHSA-535w-7cp7-47q4](https://github.com/advisories/GHSA-535w-7cp7-47q4) | high | multer 2.2.0 | BEHOBEN |
| [GHSA-3pph-fpjx-jg34](https://github.com/advisories/GHSA-3pph-fpjx-jg34) | moderate | multer 2.2.0 | BEHOBEN |
| [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) | high | fast-uri 3.1.5 | VERBLEIBEND_TRIAGIERT |
| [GHSA-r3ph-w7gj-g6xm](https://github.com/advisories/GHSA-r3ph-w7gj-g6xm) | moderate | js-yaml 5.2.1 | VERBLEIBEND_TRIAGIERT |
| [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj) | moderate | fast-uri 3.1.5 | VERBLEIBEND_TRIAGIERT |
| [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) | critical | next 16.3.0 | BEHOBEN |
| [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | high | source-map-js 1.2.1 | VERBLEIBEND_TRIAGIERT |
| [GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) | critical | proxy-addr 2.0.7 | BEHOBEN |
| [GHSA-c8x8-7fp4-3x9w](https://github.com/advisories/GHSA-c8x8-7fp4-3x9w) | high | prosemirror-view 1.42.2 | BEHOBEN |
| [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | high | sharp 0.35.3 | BEHOBEN |
| [GHSA-3w37-wq28-93x7](https://github.com/advisories/GHSA-3w37-wq28-93x7) | moderate | next 16.3.0 | BEHOBEN |
| [GHSA-4jqv-mc3x-m676](https://github.com/advisories/GHSA-4jqv-mc3x-m676) | moderate | next 16.3.0 | BEHOBEN |
| [GHSA-39w2-rjm5-chcv](https://github.com/advisories/GHSA-39w2-rjm5-chcv) | low | next 16.3.0 | BEHOBEN |
| [GHSA-f87g-xv8r-7p7x](https://github.com/advisories/GHSA-f87g-xv8r-7p7x) | moderate | next 16.3.0 | BEHOBEN |
| [GHSA-mcj8-r9mp-w47p](https://github.com/advisories/GHSA-mcj8-r9mp-w47p) | moderate | next 16.3.0 | BEHOBEN |
| [GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4) | high | next 16.3.0 | BEHOBEN |
| [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) | critical | next 16.3.0 | BEHOBEN |
| [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r) | high | next 16.3.0 | BEHOBEN |
| [GHSA-h694-7cp9-m8p3](https://github.com/advisories/GHSA-h694-7cp9-m8p3) | moderate | next 16.3.0 | BEHOBEN |
| [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr) | critical | next 16.3.0 | BEHOBEN |

## Erreichbarkeit und Risikobegründung je Paket

### next

**Plattform:** Web/Linux; Windows-Advisory nur Windows.

**Pfad:** App Router/SSR und öffentlicher Image-Optimizer; kein ImageResponse/next/og, kein use cache, keine Server Actions im geprüften Code. Remoteimages standardmäßig gesperrt, SVG-Optimierung nicht aktiviert. Vorbedingungen pro Advisory unterschiedlich, keine Exploitbestätigung.

**Entscheidung:** 16.3.0 → 16.4.1; alle Next-Meldungen durch kompatibles Minorupdate beseitigt.

### proxy-addr

**Plattform:** API/Linux; Worker ohne HTTP-Listener.

**Pfad:** Express req.ip/req.ips nur mit entsprechendem trust proxy relevant; main.ts aktiviert kein trust proxy. A03 nutzt socket.remoteAddress. Falsche IPv4-mapped-IPv6-Vertrauensnetze werden dennoch regressionsgetestet.

**Entscheidung:** Express 5.2.1/Proxy-addr 2.0.8 über Nest 11.2.7; Critical beseitigt.

### multer

**Plattform:** API/Linux; Worker ohne Upload-HTTP.

**Pfad:** Authentifizierter MediaController FileInterceptor verarbeitet Multipart. Bösartige Formfeldnamen erreichen Parser vor Zod. Memory-Storage; kein Disk-Storage konfiguriert.

**Entscheidung:** Multer 2.4.0 über Nest 11.2.7; zusätzlich flache Felder, fieldNestingDepth=0 und fieldArrayIndexLimit=0. Upgrade allein genügt für GHSA-535w-7cp7-47q4 nicht.

### @tiptap/core

**Plattform:** Browser, redaktionelle Adminoberfläche.

**Pfad:** Tiptap-Richtexteditor aktiv; importierte JSON-/HTML-/Clipboardattribute sind relevante Grenzen. Markdownextension nicht eingebunden, daher Markdown-ReDoS derzeit kein belegter Eingabepfad.

**Entscheidung:** Tiptap-Familie 3.32.0 kohärent; Sicherheitsfixes ab 3.30.4/3.30.5 und Peerkompatibilität berücksichtigt.

### prosemirror-view

**Plattform:** Browser, redaktionelle Adminoberfläche.

**Pfad:** Pastebehandlung im Tiptap-Editor ist ein tatsächlich benutzter Funktionspfad; kein Exploit gegen Benutzer ausgeführt.

**Entscheidung:** Patched prosemirror-view im neu aufgelösten Tiptap-Graph; Meldung entfernt.

### sharp

**Plattform:** Web/Linux; native optionale Plattformpakete.

**Pfad:** Next Image Optimization kann native Decoder verwenden. Lokale SVG-Logos überwiegend unoptimiert; keine frei konfigurierten Remoteimagequellen. Nicht alle CVE-Payloadpfade nachgewiesen.

**Entscheidung:** Sharp ^0.35.5 über Next 16.4.1; beide Meldungen entfernt.

### qs

**Plattform:** API/Linux; Worker ohne HTTP-Listener.

**Pfad:** Express Query-/URLencoded-Parsing kann untrusted HTTP-Eingaben verarbeiten. Keine Behauptung, dass alle spezifischen Parseroptionen aktiv sind.

**Entscheidung:** Express 5.2.1 löst gepatchtes qs auf; beide Meldungen entfernt.

### js-yaml

**Plattform:** API/Linux, optionale Swaggerausgabe.

**Pfad:** @nestjs/swagger benutzt jsyaml.dump für das intern generierte Schema; kein load von benutzerkontrolliertem YAML. Swagger ist standardmäßig deaktiviert.

**Entscheidung:** 5.2.1 → 5.3.0 über Swagger 11.4.7: High behoben. Moderate GHSA-r3ph-w7gj-g6xm bleibt, aber gefährdeter YAML-Parsepfad nicht benutzt. Upstream pinnt 5.3.0.

### deepmerge-ts

**Plattform:** Optionaler Prisma-CLI/Config-Graph; kein HTTP-Pfad.

**Pfad:** @prisma/client optionaler Prisma-Peer zieht CLI/config heran. API/Worker verwenden generierten Client und PrismaPg, kein öffentliches Merge fremder zyklischer JS-Objekte. Vertrauenswürdige lokale CLI-Konfiguration bleibt getrennte Grenze.

**Entscheidung:** High verbleibt in 7.1.5. Upstreamfix benötigt Major 8; kein ungeprüfter Override/Majorwechsel. Explizit triagiert: im aktuellen Produktpfad nicht erreichbar.

### mysql2

**Plattform:** Optionaler Prisma-CLI-Graph; Produkt nutzt PostgreSQL.

**Pfad:** Prisma-CLI enthält mysql2, Anwendung nutzt PrismaPg/pg und PostgreSQL. Kein MySQL-Connector, keine MySQL-URLs/Serververbindung im Produktpfad.

**Entscheidung:** High/Moderate bleiben in upstream exakt gepinntem mysql2 3.15.3. Kein MySQL-Laufzeitpfad; Upstream-/CLI-Update separat prüfen, wenn MySQL eingeführt wird.

### fast-uri

**Plattform:** Optionaler Prisma-dev/AJV-Graph.

**Pfad:** Nur prisma → @prisma/dev → @prisma/streams-local → ajv → fast-uri. Kein Prisma-Devserver im Produktstart und keine entsprechende HTTP-Funktion. Kein untrusted URL-Validierungsservice auf diesem Pfad.

**Entscheidung:** Fünf High und eine Moderate bleiben in 3.1.5; explizit nicht im aktuellen Produktpfad erreichbar. Keine pauschale Overridekonfiguration eingeführt.

### source-map-js

**Plattform:** Web-Buildtoolgraph unter Next/PostCSS.

**Pfad:** CSS-Source-Map-Verarbeitung beim Build mit vertrauenswürdigem Repositoryinhalt. Produktendpunkte nehmen keine benutzerdefinierten CSS-Source-Maps an. Kein Runtime-Source-Map-Upload/-Parser gefunden.

**Entscheidung:** High verbleibt in 1.2.1. Build-/Supply-Chain-Grenze dokumentiert; keine Produkt-HTTP-Erreichbarkeit. Gehört bei fremden Buildinputs erneut geprüft und in A02 behandelt.

## Verifikation

Reproduzierbare Kommandos (Node 24, pnpm 11.20.0; lokale Entwicklungsvariablen):

- `pnpm install --frozen-lockfile` — bestanden; `pnpm peers check` ohne Peerprobleme.
- `pnpm --filter api test --runInBand` — 43 Suites / 439 Tests bestanden.
- `pnpm --filter worker test --runInBand` — 18 Suites / 120 Tests bestanden.
- `pnpm --filter @kurvenfunk/validation test` — 90 Tests bestanden.
- Alle bestehenden Webhelpertests explizit ausgeführt — 50 Tests bestanden (reguläre automatische Auswahl ist separat Issue #6).
- `pnpm --filter api test:security` — baut die API und führt 9 native Node-Tests inklusive tatsächlichem MediaController/FileInterceptor aus; Storage und Auth als ausdrücklich isolierte Testgrenzen.
- `pnpm --filter web test:security` — 2 Tests: normale Tiptap-Attributzusammenführung sowie kein über `__proto__` geerbtes ausführbares Attribut.
- `pnpm turbo lint typecheck --force --concurrency=2` — alle 8 Tasks bestanden; 3 bestehende Bildwarnungen.
- `pnpm --filter api exec tsc --noEmit` prüft zusätzlich API-Testdateien.
- `NODE_ENV=production NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm turbo build --force --concurrency=2` — alle 7 Tasks bestanden.
- `pnpm format:check` und `git diff --check` — bestanden.

Der initiale Turbopack-Webbuild konnte Google Fonts wegen der Proxy-CA nicht laden. Die erneute Ausführung nutzt den vorhandenen System-CA-Store mit aktivierter TLS-Prüfung. Keine Checksummen-/TLS-Prüfung deaktiviert, keine Fontmocks oder Anwendungsänderung zur Umgehung. API-/Workerbuilds verwenden ebenfalls nur lokale Entwicklungsressourcen; Buildmodus ist kein Deployment.

Regressionen prüfen tatsächliche installierte Bibliotheken: korrekte/falsche IPv4-mapped-IPv6-Trustnetze, HTTP-Forwarded-IP-Verhalten, normaler Mediaupload, abgewiesene verschachtelte Multipartfelder ohne Serviceaufruf, Übergröße (413), fehlerhafte Multipartgrenze (400), sichere Tiptap-Attribute. Es werden keine DoS-Lasten oder Exploits gegen fremde Systeme erzeugt.

Die zusätzlichen Securitytests sind explizit mit `test:security` aufzurufen und werden nicht als Teil der bisherigen `turbo test`-Auswahl ausgegeben. Nach einer frischen Installation zuerst Shared Packages bauen (wie in CI); der API-Securitytest baut danach seine eigenen Controller. Die getrennten CI-/Testdiscovery-Arbeiten werden nicht vorweggenommen.

## Verbleibende Risiken

Keine ungeklärten erreichbaren Criticals. Verbleibende Highs sind **bewertet**, aber nicht durch Versionsupdates beseitigt: optionale Prisma-CLI-/MySQL-/AJV-Abhängigkeiten und Build-Source-Map-Verarbeitung. Diese Pakete können trotzdem im installierten Artefakt liegen. Bei aktiviertem Prisma-dev, MySQL, fremden Buildinputs oder neuen URL-/Source-Map-Eingabepfaden neu prüfen. Moderate YAML-Meldung betrifft nicht genutztes untrusted Parsing, während Swagger nur dump verwendet. Kein neues Feature darf diese Risikobewertung ungeprüft übernehmen.

Der bestehende Jest-ESM-Fehler der vollständigen API-E2E-Suite ist das getrennte Issue #5. Die neuen Dependencyregressionen verwenden native Node-Tests mit tatsächlich installierten Workspacepaketen. Das historische Audit und seine Statusmatrix bleiben unverändert; dieses Issue ist keine vollständige Launch-/Securityfreigabe.
