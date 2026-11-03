# Phase 20 – LIMITED-Sanktionen und Ablaufverarbeitung

## Task 178: LIMITED

`POST /api/v1/moderation/limited-sanctions`

Nur Konten mit `user.limit` können eine befristete Einschränkung vergeben.
Das Konto darf nicht gesperrt sein, der Moderator darf sich nicht selbst
einschränken und eine noch aktive LIMITED-Sanktion kann nicht dupliziert werden.

Eingabe: `userId`, `duration` (`24H`, `3D`, `7D`, `30D`),
`reasonCode`, verpflichtende private `moderatorNote` und optionale
`userMessage`. Der Server berechnet die Ablaufzeit.

In einer Datenbanktransaktion werden die Sanktion, `User.status=LIMITED`,
Audit-Ereignisse und die Benachrichtigung gespeichert. Die private Notiz
wird niemals in Benachrichtigungen oder API-Antworten ausgegeben.

## Tasks 179/180: Status-Permission-Matrix

- `ACTIVE`: Berechtigungen entsprechend der Rolle.
- `LIMITED`: Lesen, Suchen, Spiele ansehen und Voten/Reagieren weiter möglich;
  neue Kommentare, Antworten, Threads, Forumbeiträge sowie Moderations-
  und Schreibfunktionen gesperrt. Eigene bestehende Kommentare können
  weiterhin gelöscht werden.
- `BANNED`: sämtliche authentifizierten Aktionen verboten; Keycloak-Sessions
  werden bei roter Karte widerrufen. Der Login zeigt den gesperrten Status.
  Gesperrte authentifizierte Zugriffsversuche werden serverseitig ohne
  Klartext-IP, Token oder Query-String protokolliert.
- Öffentliche Lesefunktionen bleiben für nicht angemeldete Besucher verfügbar.

## Task 191: Ablauf-Worker

Der `SanctionExpirationService` läuft im Worker alle 60 Sekunden und
beim Start einmalig. Er verarbeitet in begrenzten Batches:

- abgelaufene `LIMITED`-, `COMMENT_BLOCK`- und `FORUM_BLOCK`-Sanktionen;
- abgelaufene `IPBlock`-Sperren samt verknüpfter `IP_BLOCK`-Sanktion.

Wiederholte Durchläufe sind idempotent. Beim Ablaufen einer LIMITED-Sanktion
wird das Benutzerkonto unter einem Row-Lock nur dann auf `ACTIVE` gesetzt,
wenn keine weitere aktive LIMITED-Sanktion vorliegt. **Ein `BANNED`-Konto
wird niemals aufgrund eines Ablaufjobs automatisch entsperrt.**

Alle relevanten Ablauf- und Statuswechsel erhalten Audit-Ereignisse.
Fehlerhafte Jobs werden im Worker protokolliert und beim nächsten Durchlauf
erneut geprüft.

## Rollout

Änderungen ausschließlich auf `develop` und DEV testen, kein STAGING/PROD
ohne gesonderte Zustimmung. DEV-E2E muss die Status-Permission-Matrix,
den Ablauf und das Verhindern einer versehentlichen Entsperrung belegen.
