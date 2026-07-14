set shell := ["powershell", "-c"]

COMPOSE_DEV := "infra/docker/compose/docker-compose.dev.yml"
COMPOSE_PROD := "infra/docker/compose/docker-compose.prod.yml"

# Development — pass any docker compose subcommand (default: up)
dev *args="up":
	docker compose -f {{COMPOSE_DEV}} {{args}}

# Production — pass any docker compose subcommand (default: up)
prod *args="up":
	docker compose -f {{COMPOSE_PROD}} {{args}}

# Stop all and prune Docker system
clean:
	docker compose -f {{COMPOSE_DEV}} down -v
	docker compose -f {{COMPOSE_PROD}} down -v
	docker system prune -f

# List all available commands
default:
	@just --list