set shell := ["powershell", "-c"]

COMPOSE_PROD := "infra/docker/compose/docker-compose.prod.yml"

# Development — run API and Web concurrently in the same terminal
[parallel]
dev: dev-api dev-web

dev-api:
	cd apps/api; cargo watch -x run

dev-web:
	cd apps/web; bun run dev

# Production — build and run with Docker
prod-build:
	docker compose -f {{COMPOSE_PROD}} build

prod-up:
	docker compose -f {{COMPOSE_PROD}} up -d

# Stop all and prune Docker system
clean:
	docker compose -f {{COMPOSE_PROD}} down -v
	docker system prune -f

# ── API (Rust) ──────────────────────────────────────────
fmt-api:
	cd apps/api; cargo fmt --all

check-api:
	cd apps/api; cargo fmt --check --all

lint-api:
	cd apps/api; cargo clippy --all -- -D warnings

test-api:
	cd apps/api; cargo test --workspace

# ── Web (Bun) ───────────────────────────────────────────
fmt-web:
	cd apps/web; bun run format

lint-web:
	cd apps/web; bun run lint

typecheck-web:
	cd apps/web; bun run typecheck

check-web:
	cd apps/web; bun run check

test-web:
	cd apps/web; bun run test

# ── Combined ────────────────────────────────────────────
fmt: fmt-api fmt-web
lint: lint-api lint-web
typecheck: typecheck-web
check: check-api check-web
test: test-api test-web

ci: check lint test

default:
	@just --list
