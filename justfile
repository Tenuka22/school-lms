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

# ── API (Rust) ──────────────────────────────────────────

# Check Rust formatting
check-api:
	cd apps/api; cargo fmt --check

# Lint Rust code
lint-api:
	cd apps/api; cargo clippy -- -D warnings

# Run Rust tests
test-api:
	cd apps/api; cargo test

# ── Web (Bun) ───────────────────────────────────────────

# Lint web code
lint-web:
	cd apps/web; bun run lint

# Typecheck web code
typecheck-web:
	cd apps/web; bun run typecheck

# Check web formatting
check-web:
	cd apps/web; bun run check

# Run web tests
test-web:
	cd apps/web; bun run test

# ── Combined ────────────────────────────────────────────

# Run all linters (API + Web)
lint: lint-api lint-web

# Run all typechecks
typecheck: typecheck-web

# Run all format checks (API + Web)
check: check-api check-web

# Run all tests (API + Web)
test: test-api test-web

# CI pipeline for API (matches .github/workflows/ci.yml)
ci-api: check-api lint-api test-api

# CI pipeline for Web (matches .github/workflows/ci.yml)
ci-web: check-web lint-web typecheck-web

# Run full CI pipeline
ci: ci-api ci-web

# List all available commands
default:
	@just --list