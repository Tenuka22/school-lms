# Contributing Guide

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Compose v2)
- [just](https://github.com/casey/just#installation)

## Development Environment

The project uses Docker Compose for both dev and prod. All commands are wrapped via `just`:

```sh
just dev          # start dev environment (docker compose up)
just dev up       # same as above
just dev down     # stop dev containers
just dev logs -f  # follow container logs
just dev build    # rebuild dev images
just dev restart  # restart dev containers
just dev ps       # list containers
```

To run the dev environment from scratch:

```sh
just dev
```

The web app is available at `http://localhost:3000` and the API at `http://localhost:3001`.

See `JUSTFILE.md` or run `just` for all available commands.

## Contribution Workflow

1. **Create a feature branch** off `dev` (e.g., `feature/course-progress-tracking` or `fix/login-error`).

   ```sh
   git checkout dev
   git pull origin dev
   git checkout -b feature/my-feature
   ```

2. **Make your changes** and commit locally.

   ```sh
   git add .
   git commit -m "feat: description of your change"
   ```

3. **Push the branch** and open a Pull Request targeting **`dev`**.

   ```sh
   git push origin feature/my-feature
   # then create a PR via GitHub UI or gh CLI:
   gh pr create --base dev --head feature/my-feature --title "..." --body "..."
   ```

4. **CI runs** automatically — see `docs/git/CI.md` for the full pipeline.  
   - **api**: `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test`
   - **web**: `bun run lint`, `bun run typecheck`, `bun run check`
   - Required checks must pass (`ci` status check).  
   - At least one approval is required (code‑owner for `main`‑bound PRs).

5. **Merge** the PR into `dev` — squash merge is preferred to keep history clean.

6. **When ready for release**, open a PR from `dev` → `main`.  
   - This PR needs one code‑owner approval.  
   - After merge, tag the release on `main` (e.g., `v1.4.0`).

7. **Hotfixes**:  
   - Branch off `main`: `git checkout -b hotfix/xyz main`  
   - PR directly into `main`, then merge `hotfix/xyz` back into `dev`.

## Branch Protection Rules

| Branch | Required Reviews | CI Check | Linear History | Direct Push |
|--------|------------------|----------|----------------|-------------|
| `main` | 1 code‑owner approval | Strict `ci` | ✅ | ❌ |
| `dev`  | 1 approval | Strict `ci` | ✅ | ❌ |

Force pushes and deletions are blocked on both branches.

## Reporting Issues

If you encounter problems or have suggestions, please open an issue in the repository referencing the relevant pull request or branch name.

Thank you for contributing!