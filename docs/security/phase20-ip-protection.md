# Phase 20 – IP-Schutz (Tasks 181–185)

## Datenschutz und Vertrauensgrenze

- IP-Adressen werden nur kurzzeitig zur Verarbeitung im Speicher verwendet und mit einem
  **keyed HMAC-SHA-256** pseudonymisiert; in `IPBlock`, `Sanction` und `AuditLog` wird
  **keine Klartext-IP** gespeichert.
- `IP_HASH_HMAC_SECRET` muss ein zufälliges Geheimnis mit mindestens 32 Zeichen sein.
  Niemals in Git, Logs, Screenshots oder Chat ausgeben. Pro Umgebung getrennte Secrets verwenden.
- `IP_HASH_KEY_VERSION` (z. B. `v1`) markiert die aktive Schlüsselgeneration. Bei
  Secret-Rotation müssen noch aktive alte Sperren bewusst migriert oder beendet werden:
  neue Schlüssel können bestehende HMACs nicht rückwärts auflösen.
- `IP_TRUST_CLOUDFLARE=false` ist der sichere Auslieferungsstandard. Erst auf `true`
  setzen, wenn auf DEV überprüft ist, dass **ausschließlich Cloudflare Tunnel**
  externe Anfragen an die API weiterreichen kann und `CF-Connecting-IP` am Edge gesetzt
  beziehungsweise überschrieben wird. `X-Forwarded-For` wird bewusst ignoriert.
- Fehlt der vertrauenswürdige Client-IP-Header, wird keine IP-basierte Schutzentscheidung
  getroffen. Account-/Status-/Permission-Checks bleiben weiterhin verpflichtend.

## Temporäre und manuelle IP-Sperren

- `POST /api/v1/moderation/ip-blocks` nur mit `user.ipban` (SUPERADMIN).
- `POST /api/v1/moderation/red-cards/:cardId/ip-protection` nur mit `user.ipban`.
  Eine rote Karte führt **nicht automatisch** zu einer IP-Sperre. Zielkonto und
  aktive rote Karte werden überprüft, die IP-Entscheidung bleibt separat und auditpflichtig.
- Zugelassene Dauer: 24 h, 3 d, 7 d, 30 d. Keine unbefristeten automatischen Sperren.
- Vor der Erstellung erfolgt die Kollisionserkennung in einer serialisierbaren Transaktion,
  zusammen mit IPBlock, Sanction und Audit.
- Der Worker aus Task 191 deaktiviert abgelaufene IP-Sperren und setzt zugehörige
  IP-Sanktionen auf EXPIRED.
- Benutzer können sich öffentliche IPs teilen (Mobilfunk, Universität, öffentliche WLANs,
  Carrier-NAT, VPN). IP-Sperren sind ein Zusatz und dürfen nicht als alleiniger
  Identitätsnachweis verwendet werden.

## IP-basiertes Rate Limiting

- Im API-Gateway gelten zusätzliche limits pro HMAC-IP für Schreibanforderungen:
  30 Kommentar-Anfragen/min, 30 Forums-Anfragen/min und 10 Reports/min.
- Redis führt atomare Zähler; bei Redis-Ausfall werden betroffene Schreiboperationen
  mit 503 abgewiesen statt die zusätzliche Bremse stillschweigend zu umgehen.
- Das bestehende nutzerbezogene Comment-Spam-Protection-System bleibt aktiv.

### Extern gehostete Keycloak-Abläufe

Login, Registrierung und Passwort-Reset laufen im **separaten Keycloak-Dienst** und
werden nicht durch den NestJS-API-Guard verarbeitet. Für diese drei Flows braucht es
zusätzliche Kontrollen am Identity-Provider bzw. am Cloudflare-Edge.
Keycloak-Brute-Force-Protection schützt insbesondere fehlgeschlagene Logins;
per-IP-Quotas für Registrierungs- und Reset-Anfragen erfordern eigene, überprüfbare
Edge-/Identity-Provider-Regeln. Diese Grenzen sind **nicht** durch einen NestJS-API-Guard
abgedeckt. Phase 20 Task 182 darf nicht vollständig als DONE bewertet werden,
bevor sie in DEV nachgewiesen sind.

## Rollout

1. CI auf Feature-Branch prüfen.
2. Ausschließlich auf DEV einen individuellen HMAC-Schlüssel als Secret hinterlegen.
3. DEV-Tunnel-Topologie und die Herkunft von `CF-Connecting-IP` read-only verifizieren.
4. Die Guards in DEV mit echten und simulierten IPs testen; insbesondere, dass
   öffentliche Anfragen nicht versehentlich aufgrund geteilter Proxy-IP gesperrt werden.
5. Erst danach `IP_TRUST_CLOUDFLARE=true` auf DEV setzen und API neu starten.
6. STAGING und PROD **nicht** verändern, solange keine ausdrückliche Freigabe besteht.
