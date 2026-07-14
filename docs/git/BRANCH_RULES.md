# Branch Protection Rules

## Branch Structure
- **`main`** – Production branch. Deployed after manual approval.
- **`dev`** – Staging branch. All feature merges integrate here before release.
- **Feature branches** – Created off `dev` (e.g., `feature/course-progress-tracking`).

## Protection Rules

| Branch | Required Reviews | Approvals | Status Checks | Linear History | Direct Push |
|--------|------------------|-----------|---------------|----------------|-------------|
| `main` | 2 code‑owner approvals | ✅ | Strict `ci` | ✅ | ❌ |
| `dev`  | 1 approval | ✅ | Strict `ci` | ✅ | ❌ |

*All branches block force‑pushes and deletions.*

## Hotfix Exception
- Cut `hotfix/*` from `main`.
- PR directly into `main` (single‑approval merge allowed).
- After merge, also merge `hotfix/*` back into `dev`.

## Releases
- Tag releases on `main` after deployment (`v1.4.0`).