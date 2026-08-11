set shell := ["powershell", "-c"]

COMPOSE_DEV  := "infra/podman/compose/compose.dev.yml"
COMPOSE_PROD := "infra/podman/compose/compose.prod.yml"

# Development — run infrastructure, API and Web concurrently
[parallel]
dev: dev-infra dev-api dev-web

dev-infra:
	podman compose -f {{COMPOSE_DEV}} up

dev-down:
	podman compose -f {{COMPOSE_DEV}} down -v

dev-build:
	podman compose -f {{COMPOSE_DEV}} build

dev-api:
	cd apps/api; cargo watch -x run

dev-web:
	cd apps/web; bun run dev

# Production — run infrastructure (Podman) and API server in parallel
[parallel]
prod: prod-infra prod-api

prod-infra:
	podman compose -f {{COMPOSE_PROD}} up -d

prod-api:
	cd apps/api; cargo run

prod-build:
	podman compose -f {{COMPOSE_PROD}} build

prod-down:
	podman compose -f {{COMPOSE_PROD}} down -v

# Stop all and prune Podman system
clean:
	podman compose -f {{COMPOSE_PROD}} down -v
	podman system prune -f

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
