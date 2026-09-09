# Release process

This document describes how changes to the Flamingock docs site get built, reviewed, and published.

## Overview

Two workflows split CI (automatic) from publish (manual):

| Workflow | File | Trigger | What it does |
|---|---|---|---|
| Build | `.github/workflows/build.yml` | Push to `master` or `release/**`; PRs targeting `master` | Installs deps, runs `yarn build`. Verifies the site compiles. Never publishes anything. |
| Publish | `.github/workflows/deploy.yml` | Manual (`workflow_dispatch`) only | Builds and deploys the site to the `gh-pages` branch via `yarn deploy`. |

Pushing to `master` (or a `release/*` branch) **only** runs the build check — it never triggers a deployment. Publishing to production (`docs.flamingock.io`) is always a deliberate, manual action.

## Day-to-day workflow

1. Branch off `master`, make changes, open a PR.
2. `build.yml` runs automatically on the PR — must pass before merge.
3. Merge to `master`. `build.yml` runs again on `master`, confirming it still builds. Nothing is deployed.
4. When ready to publish, a maintainer triggers the **Publish** workflow manually (see below).

## Publishing a release

1. Go to the repo's **Actions** tab on GitHub.
2. Select the **Publish Flamingock Docs site** workflow.
3. Click **Run workflow**.
4. In the branch/tag dropdown, pick the ref to publish from:
   - `master` — publish the latest mainline docs.
   - `release/1.4`, `release/1.5`, etc. — publish from a maintained release branch (e.g. to hotfix docs for an older, still-supported version without pulling in unreleased changes from `master`).
5. Run it. The workflow checks out the selected ref, builds the site, and pushes the result to `gh-pages`.

No separate input field is needed — GitHub's manual-run dropdown natively lists every branch and tag in the repo, so any `release/*` branch becomes selectable as soon as it exists.

## Release branches (`release/x.y`)

Release branches are created ad hoc, only when needed — there's no branch pre-created per version. Typical case: a docs fix is needed for an older, already-released version whose content has since diverged from `master`.

To cut one:

```bash
git checkout -b release/1.4 <commit-or-tag-for-1.4>
git push origin release/1.4
```

Apply the fix on the branch, open a PR against it (or push directly if the team agrees), then publish from that branch using the manual workflow above. `build.yml` also runs automatically on pushes to `release/**`, so these branches get the same build verification as `master`.

## Why this model

Mirrors the release setup used across the rest of the Flamingock projects (see `flamingock-java`): CI runs automatically and cheaply on every push/PR, but anything that touches production is a deliberate, auditable, manually-triggered action — never a side effect of `git push`.
