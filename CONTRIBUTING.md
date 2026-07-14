# Contributing Guide

## Prerequisites

- [just](https://github.com/casey/just#installation)
- [Rust & Cargo](https://rustup.rs/) (for API)
- [Bun](https://bun.sh/) (for Web)

## Development Environment

The project now runs services locally on your machine for the best developer experience.

```sh
just dev          # start both API and Web locally (runs in parallel)
just dev-api      # start API only
just dev-web      # start Web only
```

To run the dev environment from scratch:

```sh
just dev
```

The web app is available at `http://localhost:3000` and the API at `http://localhost:3001`.

## Production Environment

Production uses Docker Compose.

```sh
just prod-build   # build images
just prod-up      # run containers in detached mode
```

## Contribution Workflow

1. **Create a feature branch** off `dev`.
2. **Make your changes** and commit locally.
3. **Run CI checks** before pushing:
   ```sh
   just ci
   ```
4. **Push the branch** and open a Pull Request targeting **`dev`**.

See `justfile` for all available commands.
