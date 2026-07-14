# Infrastructure Overview

This directory contains the infrastructure configuration and documentation for the project.

## What's Here

| Path | Description |
|------|-------------|
| `INFRA.md` | This file — high-level overview |
| `DOCKER.md` | *(moved to `docs/infra/DOCKER.md`)* |
| `JUSTFILE.md` | *(moved to `docs/infra/JUSTFILE.md`)* |
| `docker/` | Dockerfiles, compose files, and related config |

## Docker

All Docker configuration lives under `infra/docker/`:

```
docker/
├── api/           # Rust/Actix Dockerfiles (dev + prod)
├── web/           # React/Bun Dockerfiles (dev + prod)
└── compose/       # docker-compose.dev.yml and .prod.yml
```

See [docs/infra/DOCKER.md](../docs/infra/DOCKER.md) for the full Docker reference.

## Justfile

The project uses [`just`](https://github.com/casey/just) as a command runner. Key commands:

| Command | Action |
|---------|--------|
| `just dev` | Start dev environment |
| `just dev down` | Stop dev environment |
| `just dev logs -f` | Follow dev logs |
| `just prod` | Start prod environment |
| `just clean` | Stop all and prune Docker |

See [docs/infra/JUSTFILE.md](../docs/infra/JUSTFILE.md) for the full command reference and usage examples.

## Environments

| Environment | How to Run | Status |
|-------------|-----------|--------|
| Development | `just dev` | Active |
| Production | `just prod` | Pending (compose file in place, Dockerfiles need content) |
