# Contributing Guide

## Contribution Workflow

1. **Create a feature branch** off `dev` (e.g., `feature/course-progress-tracking`).
2. **Make your changes** and commit locally.
3. **Push the branch** and open a Pull Request targeting `dev`.
4. **CI runs** automatically (lint, test, build).  
   - Required checks must pass.  
   - At least one reviewer (code‑owner) must approve.
5. **Merge** the PR into `dev` using a squash merge to keep history clean.
6. **CI automatically deploys** `dev` to the staging environment.  
   - Test your changes on the staging URL.
7. **When ready for release**, open a PR from `dev` → `main`.  
   - This PR only needs light review (sanity check, changelog).  
   - Merge triggers the production deploy, which is manually approved.
8. **Hotfixes**: create `hotfix/xyz` off `main`, PR directly into `main`, then merge back into `dev`.

## Branch Protection
All merges respect the branch protection rules defined in `BRANCH_RULES.md`:
- `main` requires two code‑owner approvals and strict CI.
- `dev` requires one approval and strict CI.
- Force pushes and deletions are blocked on both branches.

## Reporting Issues
If you encounter problems or have suggestions, please:
- Open an issue in the repository.
- Reference the relevant pull request or branch name.

Thank you for contributing! Please follow the workflow above to keep the project consistent and deployments reliable.