set shell := ["powershell", "-c"]

COMPOSE_DEV := "infra/docker/compose/docker-compose.dev.yml"
COMPOSE_PROD := "infra/docker/compose/docker-compose.prod.yml"

# Development — run API and Web concurrently in the same terminal
[parallel]
dev: dev-api dev-web

dev-api:
	cd apps/api; cargo watch -x run

dev-web:
	cd apps/web; bun run dev

# Production — pass any docker compose subcommand (default: up)
prod *args="up":
	docker compose -f {{COMPOSE_PROD}} {{args}}

# Stop all and prune Docker system
clean:
	docker compose -f {{COMPOSE_DEV}} down -v
	docker compose -f {{COMPOSE_PROD}} down -v
	docker system prune -f

# ── API (Rust) ──────────────────────────────────────────
check-api:
	cd apps/api; cargo fmt --check --all

lint-api:
	cd apps/api; cargo clippy --all -- -D warnings

test-api:
	cd apps/api; cargo test --workspace

# ── Web (Bun) ───────────────────────────────────────────
lint-web:
	cd apps/web; bun run lint

typecheck-web:
	cd apps/web; bun run typecheck

check-web:
	cd apps/web; bun run check

test-web:
	cd apps/web; bun run test

# ── Combined ────────────────────────────────────────────
lint: lint-api lint-web
typecheck: typecheck-web
check: check-api check-web
test: test-api test-web

ci-api: check-api lint-api test-api
ci-web: check-web lint-web typecheck-web
ci: ci-api ci-web

default:
	@just --list
