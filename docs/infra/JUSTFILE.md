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

Any `docker compose` subcommand can be passed as an argument:
- `just dev up -d` → `docker compose -f compose.dev.yml up -d`
- `just prod logs --tail=50` → `docker compose -f compose.prod.yml logs --tail=50`
