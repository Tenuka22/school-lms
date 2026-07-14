# Justfile — Docker Compose commands

## Usage

### Development
| Command           | Description              |
|-------------------|--------------------------|
| `just dev`        | Start dev environment    |
| `just dev up`     | Start dev environment    |
| `just dev down`   | Stop dev environment     |
| `just dev logs`   | Follow dev logs          |
| `just dev build`  | Build dev images         |
| `just dev ps`     | List dev containers      |
| `just dev restart`| Restart dev containers   |

### Production
| Command            | Description               |
|--------------------|---------------------------|
| `just prod`        | Start prod environment    |
| `just prod up`     | Start prod environment    |
| `just prod down`   | Stop prod environment     |
| `just prod logs`   | Follow prod logs          |
| `just prod build`  | Build prod images         |
| `just prod ps`     | List prod containers      |
| `just prod restart`| Restart prod containers   |

### Utility
| Command        | Description                       |
|----------------|-----------------------------------|
| `just clean`   | Stop all and prune Docker system  |
| `just`         | List all available commands       |
