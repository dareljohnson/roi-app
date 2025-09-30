# Contributing Guide

Thanks for your interest in contributing! This project now uses `main` as the default branch (migrated from `master` on Sept 30, 2025).

## Branch Strategy
- `main`: Production-ready, always green (29/29 test suites must pass)
- Feature branches: `feature/<short-description>`
- Fix branches: `fix/<issue-or-summary>`

## Working With the New Default Branch
If you previously cloned when `master` existed:
```bash
git fetch origin
git branch -m master main
git branch -u origin/main main
git remote set-head origin -a
```

## Development Workflow
1. Fork or branch from `main`
2. Create a focused branch
3. Write tests first (or alongside code)
4. Run locally:
```bash
npm install
npm test
```
5. Keep commits small and meaningful
6. Open a Pull Request using the template

## Testing Standards
- All 29 test suites must pass: `npm test`
- Deployment-specific tests: `npm run test:deployment`
- Coverage goal: 95%+ maintained (no large regressions)

## Database & Prisma
- Migrations must be created with: `npx prisma migrate dev --name <meaningful-name>`
- Never manually edit a migration already applied to production
- Seed script changes must remain idempotent and safe (no duplicate inserts)

## Commit Message Conventions
Use clear, conventional prefixes:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation change
- `chore:` Build/tooling change
- `refactor:` Internal code restructure
- `test:` Add or improve tests
- `perf:` Performance improvement

Examples:
```
feat(admin): add bulk export tracking
fix(api): correct vacancy rate default logic
```

## Pull Requests
A PR must:
- Be based on `main`
- Pass CI (tests + type checks)
- Update relevant docs (README/DEPLOYMENT/CHANGELOG) if behavior changes
- Include migration rationale if schema changes

## Deployment Notes
Fly.io deployment uses a release command to run migrations/seed. If you add migrations:
- Ensure `scripts/deploy-db.sh` still succeeds with a fresh volume
- Add any new checks to deployment test suite if appropriate

## Reporting Issues
Include:
- Environment (OS, Node version)
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs or stack traces

## Code Style
- TypeScript strictness maintained
- Consistent naming and file organization
- Avoid large PRs when possible

## After Branch Rename
If you had automation referencing `master`, update it to `main`:
- CI workflows
- Badges
- Deployment scripts

## Questions?
Open an issue or start a discussion. Thanks for helping improve the Real Estate Investment ROI App!
