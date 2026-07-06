# Incremental PR plan (manager + Rishabh)

**Goal:** 3 small PRs instead of one 102-file PR.  
**Base branch for review:** `master` (empty scaffold — only `.gitignore` today).  
**Do not** add more large commits directly to `main`.

---

## Current situation (read this first)

| Branch | State |
|--------|--------|
| `master` | Scaffold only (`.gitignore`) — **PR target** |
| `main` | Full app already merged via PR #1 (~102 files) |
| Your stash | Follow-up work (search, virtualization, Claude-only) — `git stash list` |

**You are not “late”.** Re-submit the same work as **3 reviewable PRs into `master`**.  
`main` can stay as-is until your manager says otherwise.

---

## The 3 PRs (exactly what Sujay + Rishabh asked for)

```text
master
  └── PR1  chore/01-repo-setup     → linting, scaffold, health check, no features
        └── PR2  feat/02-backend-api   → Zendesk + AI + all backend tests
              └── PR3  feat/03-frontend-ui → React UI + frontend tests
```

| PR | Branch | Contains | ~Files |
|----|--------|----------|--------|
| **1** | `chore/01-repo-setup` | `.gitignore`, README, package.json, tsconfig, jest, oxlint, vite, `/health` only | ~25 |
| **2** | `feat/02-backend-api` | routes, services, types, backend tests | ~25 |
| **3** | `feat/03-frontend-ui` | components, hooks, App.css, frontend tests | ~50 |

**Rule:** Open PR2 only after PR1 is approved (or mark as stacked). Open PR3 after PR2.

---

## Step-by-step (do in order)

### Step 0 — Save your work (already done if you stashed)

```bash
cd zendesk_ticket_summarizer
git stash list   # should show: follow-up-search-virtualization-claude
```

### Step 1 — Create PR1 branch from `master`

```bash
git checkout master
git pull origin master
git checkout -b chore/01-repo-setup
```

Copy **setup-only** files from `main` (see file list in repo script `scripts/split-pr-01-setup.sh` or manual list below).

PR1 backend `index.ts` = **health + 404 + 500 only** (no `/api/tickets` yet).

PR1 frontend `App.tsx` = **placeholder shell** (“Ticket Summarizer — setup complete”).

```bash
cd backend && npm install && npm test
cd ../frontend && npm install && npm run lint && npm test && npm run build
git add <only PR1 files>
git commit -m "chore: initial repo setup with backend and frontend scaffold"
git push -u origin chore/01-repo-setup
```

Open PR on GitHub: **base `master`** ← **compare `chore/01-repo-setup`**

### Step 2 — Create PR2 (backend) stacked on PR1

```bash
git checkout chore/01-repo-setup
git checkout -b feat/02-backend-api
git checkout main -- backend/src/routes backend/src/services backend/src/types
git checkout main -- backend/src/__tests__
# Restore full backend/src/index.ts from main
git checkout main -- backend/src/index.ts
cd backend && npm test
git add backend/
git commit -m "feat(backend): Zendesk API, AI summaries, and work insights"
git push -u origin feat/02-backend-api
```

Open PR: **base `master`** ← **compare `feat/02-backend-api`**  
In description: “Stacked on PR1 #___ — merge PR1 first.”

### Step 3 — Create PR3 (frontend) stacked on PR2

```bash
git checkout feat/02-backend-api
git checkout -b feat/03-frontend-ui
git checkout main -- frontend/src frontend/package.json frontend/package-lock.json
cd frontend && npm test && npm run build
git add frontend/
git commit -m "feat(frontend): ticket workspace UI with summaries and work insights"
git push -u origin feat/03-frontend-ui
```

Open PR: **base `master`** ← **compare `feat/03-frontend-ui`**

### Step 4 — Follow-up work (after PR3 plan is approved)

```bash
git checkout feat/03-frontend-ui   # or main after merges
git stash pop
# Split stash into small PRs — see bottom of this doc
```

---

## PR description template (copy for each PR)

```markdown
## Summary
<one sentence>

## Scope
- [ ] Repo setup only / Backend only / Frontend only

## Depends on
- PR #___ (if stacked)

## Test plan
- [ ] `cd backend && npm test`
- [ ] `cd frontend && npm test && npm run build`
- [ ] Manual smoke test: ...
```

---

## Follow-up PRs (after the big 3) — optional 4th & 5th

| PR | Branch | Content |
|----|--------|---------|
| 4 | `chore/claude-only-ai` | Bedrock-only AI (backend + README) |
| 5a | `feat/backend-search-insights` | Assignee insights + search API |
| 5b | `feat/frontend-search-virtualization` | Search UI + comment virtualization |

---

## Mistakes to avoid

1. ❌ `git add .` — stage only files for **one** PR  
2. ❌ Mix backend + frontend in one PR  
3. ❌ Commit `.env` (secrets)  
4. ❌ Push to `main` directly  
5. ❌ Open PR3 before PR1 is at least approved  
6. ❌ Force-push `main` or `master` without manager approval  

---

## Reply to post in Slack (Rishabh + Sujay)

> Thanks Sujay and Rishabh — aligned on 3 PRs: (1) repo setup/linting/scaffold, (2) backend API, (3) UI.  
> PR #1 on `main` was the full delivery; I’m now splitting the same work into **3 smaller PRs targeting `master`** so review is incremental.  
> **PR1** `chore/01-repo-setup` — scaffold, tooling, `/health` only.  
> **PR2** `feat/02-backend-api` — Zendesk + AI routes (stacked on PR1).  
> **PR3** `feat/03-frontend-ui` — React workspace (stacked on PR2).  
> I’ll wait for PR1 review before asking for PR2 merge. Follow-up fixes (search, virtualization, Claude-only) will be separate small PRs after these.
