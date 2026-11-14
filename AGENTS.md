<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Branches and releases (read before changing anything)

- `aws/prod` is production and the source of truth. `aws/dev` is staging.
- Every change starts from prod: `git fetch origin && git switch -c feat/<name> origin/aws/prod`.
- Test on staging: open a PR from that branch into `aws/dev`, merge with "Create a merge commit".
- Release: open a PR from the **same branch** into `aws/prod` (needs a code-owner approval), merge with a merge commit.
- Prod moved on and the release PR conflicts? `git merge origin/aws/prod` into the branch. Do not rebase a branch that has already been merged into `aws/dev`.
- Hotfix: branch from `aws/prod` → PR into `aws/prod` → same branch PR into `aws/dev` the same day.
- Never: push directly to `aws/dev` / `aws/prod`, merge `aws/dev` into anything, or force-push a shared branch.
- `amplify.yml` exists only on `aws/dev`. Never add it to prod and never change Amplify settings.
- Features hidden on prod use `IS_PRODUCTION` (src/configs/env.config.ts) or feature flags (`useFeatures`), not deleted code.
- Never commit `.env` files, keys, or data exports.

PRs run `.github/workflows/pr-checks.yml`: typecheck, lint (errors only), build.
