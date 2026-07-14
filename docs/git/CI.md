# CI Pipeline

Defined in `.github/workflows/ci.yml`. Runs on every PR targeting `main` or `dev`.

## Jobs

### `api` (apps/api)

| Step | Command |
|------|---------|
| Format check | `cargo fmt --check` |
| Lint | `cargo clippy -- -D warnings` |
| Test | `cargo test` |

### `web` (apps/web)

| Step | Command |
|------|---------|
| Install | `bun install` |
| Lint | `bun run lint` |
| Type check | `bun run typecheck` |
| Format check | `bun run check` |

Both jobs must pass before a PR can be merged. See `BRANCH_RULES.md` for status check requirements.
