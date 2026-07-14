# Justfile — Docker Compose commands

## Usage

| Command                | Description                                  |
|------------------------|----------------------------------------------|
| `just dev`             | Start dev environment (`docker compose up`)  |
| `just dev down`        | Stop dev environment                         |
| `just dev logs -f`     | Follow dev logs                              |
| `just dev build`       | Build dev images                             |
| `just dev ps`          | List dev containers                          |
| `just dev restart`     | Restart dev containers                       |
| `just prod`            | Start prod environment                       |
| `just prod down`       | Stop prod environment                        |
| `just clean`           | Stop all and prune Docker system             |
| `just`                 | List all available commands                  |

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
| `just ci-api`                | Full API CI pipeline                      |
| `just ci-web`                | Full Web CI pipeline                      |
| `just ci`                    | Full CI pipeline (API + Web)              |

Any `docker compose` subcommand can be passed as an argument:
- `just dev up -d` → `docker compose -f compose.dev.yml up -d`
- `just prod logs --tail=50` → `docker compose -f compose.prod.yml logs --tail=50`
