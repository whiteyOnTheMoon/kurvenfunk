# Secrets Management

Status: Implemented
Roadmap: 038 – Secrets Management

## Grundregeln

- DEV, STAGING und PROD besitzen getrennte Secrets.
- Echte Secrets dürfen niemals in Git committed werden.
- Nur `.env.example` wird von Git getrackt.
- `.env.dev`, `.env.staging` und `.env.prod` haben Dateimodus `600`.
- Secret-Werte dürfen nicht im Sourcecode, Dockerfiles, Compose-Dateien oder Logs stehen.

## Environment-Dateien

- `.env.dev` – Development
- `.env.staging` – Staging
- `.env.prod` – Production
- `.env.example` – Vorlage ohne echte Secrets

Gitignore:

```text
.env
.env.*
!.env.example
```

## Getrennte Secrets

Folgende Werte müssen pro Environment unterschiedlich sein:

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `KEYCLOAK_ADMIN_PASSWORD`
- `KEYCLOAK_DB_PASSWORD`
- `MEILI_MASTER_KEY`
- `MINIO_ROOT_PASSWORD`

## Docker und Persistenz

Compose-Projekte:

- `kurvenfunk-dev`
- `kurvenfunk-staging`
- `kurvenfunk-prod`

Persistente Daten:

- `/srv/kurvenfunk/dev/`
- `/srv/kurvenfunk/staging/`
- `/srv/kurvenfunk/prod/`

## Secret Rotation

Das Ändern einer `.env`-Datei allein ist nicht immer ausreichend.

- PostgreSQL-Rollen müssen bei Passwortänderungen auch in PostgreSQL aktualisiert werden.
- Keycloak muss nach Änderung seines DB-Passworts mit dem neuen Secret neu erstellt werden.
- MinIO muss nach Änderung seiner Root-Credentials mit den neuen Environment-Werten neu erstellt werden.
- Nach jeder Rotation müssen Login bzw. Healthchecks geprüft werden.

Bereits exportierte Shell-Variablen können Werte aus `--env-file` überschreiben. Vor Environment-spezifischen Arbeiten müssen deshalb alte Kurvenfunk-Variablen aus der Shell entfernt werden.

## Production

Die derzeitigen Production-Secrets dienen der vorbereiteten Production-Umgebung.
Die endgültige Rotation aller Production-Secrets erfolgt gemäß Roadmap unter `288 – Production Secrets erzeugen` vor dem Launch.

## Verifikation 038

- [x] DEV/STAGING/PROD getrennt
- [x] Secrets pro Environment unterschiedlich
- [x] nur `.env.example` in Git
- [x] keine echten `.env`-Dateien in der Git-Historie gefunden
- [x] echte `.env`-Dateien mit Modus 600
- [x] keine direkten Secret-Werte in Compose gefunden
- [x] PostgreSQL-Credentials geprüft
- [x] PROD-Keycloak nach DB-Secret-Rotation healthy
- [x] STAGING-MinIO nach Secret-Rotation healthy
- [x] persistente Daten erhalten

## Status

**038 – Secrets Management: DONE**
