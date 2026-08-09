# Kurvenfunk

Kurvenfunk ist ein modernes österreichisches Fußballportal mit News, Sportdaten, Community und Forum.

Der initiale Fokus liegt auf der österreichischen Bundesliga.

## Projektstatus

🚧 In Entwicklung

Kurvenfunk befindet sich aktuell im Aufbau und ist noch nicht für den produktiven Einsatz vorgesehen.

## Technologie

- Next.js
- React
- TypeScript
- NestJS
- PostgreSQL
- Prisma
- Redis
- BullMQ
- Keycloak
- Meilisearch
- MinIO / Cloudflare R2
- Docker Compose
- pnpm
- Turborepo

## Projektstruktur

```text
kurvenfunk/
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
├── packages/
│   ├── database/
│   ├── ui/
│   ├── config/
│   ├── types/
│   ├── validation/
│   └── logger/
├── infrastructure/
├── docs/
├── tests/
└── .github/
```

## Umgebungen

Kurvenfunk verwendet drei getrennte Umgebungen:

- Development
- Staging
- Production

Produktionsdaten und Secrets werden nicht mit Development oder Staging geteilt.

## Repository

Branch-Struktur:

- `main` – stabiler Hauptbranch
- `develop` – laufende Entwicklung
- `feature/*` – neue Features
- `fix/*` – Fehlerbehebungen
- `chore/*` – Wartung und technische Arbeiten

## Dokumentation

Die Projektdokumentation befindet sich unter:

```text
docs/
├── product/
├── architecture/
├── api/
├── database/
├── deployment/
├── security/
└── decisions/
```

## Domain

kurvenfunk.at

## Lizenz

Proprietär. Alle Rechte vorbehalten.
