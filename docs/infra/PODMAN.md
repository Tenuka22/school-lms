# Podman Infrastructure

## Directory Structure

```
infra/podman/
├── api/                # API (Rust/Actix) Containerfiles
│   ├── Containerfile.dev
│   └── Containerfile.prod
├── web/                # Web (React/Bun) Containerfiles
│   ├── Containerfile.dev
│   └── Containerfile.prod
└── compose/            # Podman Compose environment files
    ├── compose.dev.yml
    └── compose.prod.yml
```

## Development

Run with `just dev`.

### Services

| Service  | Image Base            | Container Name                 | Host Port | Source |
|----------|-----------------------|--------------------------------|-----------|--------|
| postgres | `postgres:17`         | `school-lms-postgres-dev`      | `5432`    | —      |

### Web (`Dockerfile.dev`)

- Installs dependencies with `bun install` during build
- Runs `bun dev --host 0.0.0.0` via hot-reload
- Bind-mounts `apps/web` to `/app` for live editing
- `/app/node_modules` is an anonymous volume so the build-time install isn't overwritten
- Uses `bun-cache` named volume (`/root/.bun`)

### API (`Dockerfile.dev`)

- Installs `cargo-watch` for hot-reload
- Runs via `cargo watch -x run`
- Bind-mounts `apps/api` to `/app` for live editing
- Uses `cargo-cache` named volume (`/usr/local/cargo/registry`)

### Volumes

| Volume | Purpose |
|--------|---------|
| `cargo-cache` | Persists Rust crate registry between restarts |
| `bun-cache` | Persists Bun package cache between restarts |
| `/app/node_modules` (anonymous) | Prevents the host bind mount from shadowing installed deps |

### Network

All services share the `lms-network` bridge network.

## Production

### Running with `just prod`

```sh
just prod
```

This starts two tasks in parallel:
1. **`prod-infra`** — `podman-compose -f .../compose.prod.yml up -d` (postgres)
2. **`prod-api`** — `cargo run` (API server directly on the host)

### Services

| Service  | Image               | Container Name                  | Host Port | Purpose             |
|----------|---------------------|---------------------------------|-----------|---------------------|
| postgres | `postgres:17`       | `school-lms-postgres-prod`      | `5432`    | Database            |
| api      | Custom build        | —                               | `8001`    | API server (Docker) |
| web      | Custom build        | —                               | `8000`    | Web app (Docker)    |

### Environment

The API server loads `apps/api/.env.production` at startup. The same file is referenced by `compose.prod.yml` for the postgres service.

### Podman-only Deployment

To run everything (including the API) in Podman:

```sh
just prod-build
podman-compose -f infra/podman/compose/compose.prod.yml up -d
```

## Containerfiles Reference

### `Containerfile.dev` (Web)

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
CMD ["bun", "dev", "--host", "0.0.0.0"]
```

### `Containerfile.dev` (API)

```dockerfile
FROM rust:latest
WORKDIR /app
COPY . .
RUN cargo install cargo-watch
CMD ["cargo", "watch", "-x", "run"]
```

## .containerignore

| File | Ignores |
|------|---------|
| `apps/web/.containerignore` | `node_modules/`, `.tanstack/`, `.git/` |
| `apps/api/.containerignore` | `target/`, `.git/` |
