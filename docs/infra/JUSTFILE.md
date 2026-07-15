# Justfile — Commands Reference

## Usage

| Command                | Description                                              |
|------------------------|----------------------------------------------------------|
| `just dev`             | Start infra (Docker) + API + Web in parallel             |
| `just dev-infra`       | Start dev infrastructure (`docker compose up -d`)        |
| `just dev-down`        | Stop and remove dev containers                           |
| `just dev-build`       | Build dev Docker images                                  |
| `just dev-api`         | Run the API server with hot-reload (`cargo watch`)       |
| `just dev-web`         | Run the Web dev server (`bun run dev`)                   |
| `just prod`            | Start infra (Docker) + API server in parallel            |
| `just prod-infra`      | Start production infrastructure (postgres)               |
| `just prod-api`        | Run the API server directly (`cargo run`)                |
| `just prod-build`      | Build Docker images for production                       |
| `just prod-down`       | Stop and remove production containers                    |
| `just clean`           | Stop all containers and prune Docker system              |
| `just`                 | List all available commands                              |

## CI / Code Quality Commands

| Command                      | Description                               |
|------------------------------|-------------------------------------------|
| `just check-api`             | Check Rust formatting (`cargo fmt`)       |
| `just lint-api`              | Lint Rust code (`cargo clippy`)           |
| `just test-api`              | Run Rust tests                            |
| `just lint-web`              | Lint web code (`eslint`)                  |
| `just typecheck-web`         | Typecheck web code (`tsc --noEmit`)       |
| `just check-web`             | Check web formatting (`prettier`)         |
| `just test-web`              | Run web tests (`vitest`)                  |
| `just lint`                  | Run all linters (API + Web)               |
| `just typecheck`             | Run all typechecks                        |
| `just check`                 | Run all format checks (API + Web)         |
| `just test`                  | Run all tests (API + Web)                 |
| `just ci`                    | Full CI pipeline (API + Web)              |

## Pre-push Hook

A `pre-push` hook at `.githooks/pre-push` runs `just ci` (fmt check, lint, test) before every `git push`.
The hook is version-controlled, so it's shared with everyone who clones the repo.

### Setup on a fresh clone

```sh
git config core.hooksPath .githooks
```

### Run manually

```sh
prek run --hook-type pre-push
```

## Environment Files

| Environment | File                     | Loaded By             |
|-------------|--------------------------|-----------------------|
| Development | `apps/api/.env.local`    | Docker Compose (dev)  |
| Production  | `apps/api/.env.production` | API server + Docker Compose (prod) |

