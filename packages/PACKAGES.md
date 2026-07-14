# packages/

Shared crates used by apps.

## Structure

Each package follows this convention:

```
packages/<name>/
├── Cargo.toml
├── src/
│   ├── lib.rs              # crate root, re-exports public API
│   └── routers/
│       ├── <router>/       # e.g. rpc/, admin/
│       │   ├── mod.rs      # binds all routes for this router
│       │   └── <action>.rs # individual route handlers
│       └── ...
└── .gitignore
```

- `lib.rs` — crate root, may re-export or delegate to routers
- `routers/<router>/mod.rs` — creates the `web::Scope`, registers routes via `web::scope("/<name>")`
- `routers/<router>/<action>.rs` — individual handler functions

## Packages

| Package | Description |
|---------|-------------|
| `rpc`   | RPC endpoint handlers under `/rpc/*` |
