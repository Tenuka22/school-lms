# Infrastructure Overview

This directory contains the infrastructure configuration and documentation for the project.

## What's Here

| Path | Description |
|------|-------------|
| `INFRA.md` | This file — high-level overview |
| `PODMAN.md` | *(moved to `docs/infra/PODMAN.md`)* |
| `JUSTFILE.md` | *(moved to `docs/infra/JUSTFILE.md`)* |
| `podman/` | Containerfiles, compose files, and related config |

## Podman

All Podman configuration lives under `infra/podman/`:

```
podman/
├── api/           # Rust/Actix Containerfiles (dev + prod)
├── web/           # React/Bun Containerfiles (dev + prod)
└── compose/       # compose.dev.yml and .prod.yml
```

See [docs/infra/PODMAN.md](../docs/infra/PODMAN.md) for the full Podman reference.

## Justfile

The project uses [`just`](https://github.com/casey/just) as a command runner. Key commands:

| Command | Action |
|---------|--------|
| `just dev` | Start dev environment |
| `just dev down` | Stop dev environment |
| `just dev logs -f` | Follow dev logs |
| `just prod` | Start prod environment |
| `just clean` | Stop all and prune Podman system |

See [docs/infra/JUSTFILE.md](../docs/infra/JUSTFILE.md) for the full command reference and usage examples.

## Environments

| Environment | How to Run | Status |
|-------------|-----------|--------|
| Development | `just dev` | Active |
| Production | `just prod` | Pending (compose file in place, Dockerfiles need content) |
