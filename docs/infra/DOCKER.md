# Docker Infrastructure

## Directory Structure

```
infra/docker/
├── api/                # API (Rust/Actix) Dockerfiles
│   ├── Dockerfile.dev
│   └── Dockerfile.prod
├── web/                # Web (React/Bun) Dockerfiles
│   ├── Dockerfile.dev
│   └── Dockerfile.prod
└── compose/            # Docker Compose environment files
    ├── docker-compose.dev.yml
    └── docker-compose.prod.yml
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
1. **`prod-infra`** — `docker compose -f .../docker-compose.prod.yml up -d` (postgres)
2. **`prod-api`** — `cargo run` (API server directly on the host)

### Services

| Service  | Image               | Container Name                  | Host Port | Purpose             |
|----------|---------------------|---------------------------------|-----------|---------------------|
| postgres | `postgres:17`       | `school-lms-postgres-prod`      | `5432`    | Database            |
| api      | Custom build        | —                               | `3001`    | API server (Docker) |
| web      | Custom build        | —                               | `3000`    | Web app (Docker)    |

### Environment

The API server loads `apps/api/.env.production` at startup. The same file is referenced by `docker-compose.prod.yml` for the postgres service.

### Docker-only Deployment

To run everything (including the API) in Docker:

```sh
just prod-build
docker compose -f infra/docker/compose/docker-compose.prod.yml up -d
```

## Dockerfiles Reference

### `Dockerfile.dev` (Web)

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
CMD ["bun", "dev", "--host", "0.0.0.0"]
```

### `Dockerfile.dev` (API)

```dockerfile
FROM rust:latest
WORKDIR /app
COPY . .
RUN cargo install cargo-watch
CMD ["cargo", "watch", "-x", "run"]
```

## .dockerignore

| File | Ignores |
|------|---------|
| `apps/web/.dockerignore` | `node_modules/`, `.tanstack/`, `.git/` |
| `apps/api/.dockerignore` | `target/`, `.git/` |
