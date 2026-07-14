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

Run with `just dev up` (or manually: `docker compose -f infra/docker/compose/docker-compose.dev.yml up`).

### Services

| Service | Image Base | Container Name | Host Port | Source |
|---------|-----------|----------------|-----------|--------|
| **web** | `oven/bun:latest` | `lms-web-dev` | `3000` | `apps/web` |
| **api** | `rust:latest` | `lms-api-dev` | `3001` | `apps/api` |

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

The prod Dockerfiles and compose file are in place but currently empty — the prod configuration is pending implementation. Once set up, run with:

```sh
just prod up
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
