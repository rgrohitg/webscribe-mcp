# Graphify Index Service — Phased Build Plan

A central **symbol locator** for the team. Replaces grep in Claude Code analyst sessions. Returns pointers (`repo`, `file`, `line_start`, `line_end`) — never code. Webhook-driven, always fresh, no per-dev clones.

Includes a **read-only web dashboard** so devs can browse the indexed graph visually — pick a repo, see its structure, drill into files and symbols, follow callers. Same data Claude queries, rendered for human eyes.

This plan is structured so Claude Code can pick up one phase at a time, complete it fully (build + test + audit), and only move on after the phase gate passes.

---

## 1. Locked Design Decisions

These are settled. Don't relitigate them while building.

| Decision | Choice | Why |
|---|---|---|
| What it does | **Locate only** — returns file/line pointers | Replaces grep. Claude reads actual code from Bitbucket. |
| What it doesn't do | Store code, store metadata, answer questions | Out of scope. Keeps the service tiny. |
| Storage | **SQLite on local EBS, WAL mode** | Right-sized for the workload. Zero ops. Never on EFS. |
| Index store schema | 2 tables: `symbols`, `edges` | Pointers + edges, that's it. |
| Freshness | **Bitbucket webhook on merge to `main`/`develop`** | Index updated within minutes of merge. |
| Code distribution | **None to devs** — service is the only thing with clones | Devs' laptops stay clean. |
| Code reads | Bitbucket fetch endpoint with cache, called by Claude | On-demand, current commit. |
| MCP layer | **Generic API MCP** + manifest. No purpose-built tools. | Pass-through HTTP. Already settled in earlier discussion. |
| Auth | Service token + `X-User` header for attribution | Simple at 100-dev scale. |
| Language / framework | Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.x | Latest stable, pinned in lockfile. |
| Distribution | Single instance, EBS volume, EBS snapshot nightly to S3 | Migrate to multi-instance only if needed. |
| Dashboard | **Read-only web UI**, server-side, behind same bearer-token auth | One deployment, all 100 devs hit one URL. No per-dev clones, no LLM dependency. |
| Dashboard frontend | React 18 + Vite + React Flow + ELK layout | Component layer lifted from Understand-Anything (MIT). No tours, no summaries, no personas — structural view only. |

---

## 2. Cross-Cutting Requirements (apply to every phase)

**Always pin latest stable versions.** Each phase begins with `uv pip compile` against latest. Renovate/Dependabot auto-PRs minor/patch bumps weekly.

**Code quality gates (all must pass in CI before merge):**
- `ruff check` — linting, zero warnings allowed
- `ruff format --check` — formatting
- `mypy --strict` — type checking, zero errors
- `bandit -r src/` — security static analysis, zero high/medium findings
- `pip-audit` — dependency CVE scan, zero high/critical
- `pytest` with coverage gate ≥ 80%
- `gitleaks` / `detect-secrets` — pre-commit hook to block secret commits

**Security must-haves on every endpoint, every query:**
- All SQL via SQLAlchemy parameter binding. **Never f-string SQL.** Grep CI check: `if grep -rE 'execute\(.*f["\']' src/; then exit 1; fi`
- Every user-supplied identifier (repo, symbol, branch, path) validated by Pydantic regex *before* reaching the query layer.
- Every endpoint has Pydantic request + response models. No raw dict returns.
- Webhook HMAC verified with `hmac.compare_digest`.
- Tokens stored Argon2id-hashed in SQLite. Never plaintext.
- Errors return correlation IDs only — no stack traces, no internal paths.
- Container runs as non-root, read-only root FS.

**Audit log on every privileged action**, written to a dedicated table and shipped to central log store:
```
audit_log(id, ts, actor, action, target, args_hash, status, correlation_id, ip)
```
Write entries for: every webhook receipt (accepted or rejected), every reparse trigger, every API call (success or failure), every token issuance/revocation.

**Testing layered at every phase:**
- **Unit tests** — pure logic, parsers, validators
- **Integration tests** — full HTTP request through to SQLite and back, using a temp DB
- **Contract tests** — every endpoint exercised against its OpenAPI schema
- **Security tests** — at minimum: SQL-injection fuzz on every input, oversized-body, malformed-UTF-8, bad-HMAC, missing-token. These run in CI.

**Definition of done for any phase:** all tests pass, all CI gates pass, audit log entries observed, a written runbook updated for the new behaviour, and the phase gate test (described per-phase below) is passed manually.

---

## 3. Architecture

### 3.1 The problem this solves

Today, when a junior analyst session in Claude Code is asked something like *"why does the order-batch job retry only 3 times?"* or *"what calls `submitOrder`?"*, Claude has no map of the codebase. It either greps blindly across files (slow, noisy, often misses) or reads files speculatively (burns context, low signal). Either way, by the time it has located the right code, it has consumed half its context on navigation and the answer quality suffers.

This service replaces that navigation step. **Graphify maintains a fresh symbol index for every repo**, and Claude asks the index for pointers (`repo`, `file`, `line_start`, `line_end`) before reading the actual code from Bitbucket. The "what to read" question is answered in one HTTP call instead of 5-15 grep/read turns.

The service is intentionally narrow:

- It **does not** store code bodies, docstrings, commit history, ownership, or any other semantic data
- It **does not** answer questions
- It **does** return pointers, fast, fresh, with a small `signature_hash` so Claude can detect drift

### 3.2 Component breakdown

```
                     ┌──────────────────────────────────────────────────┐
                     │                  AWS deployment                  │
                     │                                                  │
  Bitbucket          │  ┌──────────────┐    ┌──────────────────────┐    │
  ──webhook─────────▶│  │   Webhook    │    │    Job queue         │    │
  (push events)      │  │   receiver   │───▶│   (SQLite table      │    │
                     │  │   (FastAPI)  │    │    parse_runs)       │    │
                     │  └──────────────┘    └──────────┬───────────┘    │
                     │                                 │                │
                     │                                 ▼                │
                     │                      ┌──────────────────────┐    │
                     │  Bitbucket◀─clone────│      Worker          │    │
                     │  (shallow)           │  (Graphify runner)   │    │
                     │                      └──────────┬───────────┘    │
                     │                                 │                │
                     │                                 ▼                │
                     │                      ┌──────────────────────┐    │
                     │                      │   Index store        │    │
                     │                      │   (SQLite, WAL,      │    │
                     │                      │    on EBS)           │    │
                     │                      │   - symbols          │    │
                     │                      │   - edges            │    │
                     │                      │   - parse_runs       │    │
                     │                      │   - tokens           │    │
                     │                      │   - audit_log        │    │
                     │                      └──────────┬───────────┘    │
                     │                                 │                │
                     │                                 ▼                │
                     │                      ┌──────────────────────┐    │
  Bitbucket◀────file─┤                      │     REST API         │    │
  (current code)     │                      │     (FastAPI)        │    │
                     │                      │  ┌────────────────┐  │    │
                     │                      │  │ /locate/*      │  │    │
                     │                      │  │ /code/*        │  │    │
                     │                      │  │ /graph/*       │  │    │
                     │                      │  │ /repos         │  │    │
                     │                      │  │ /status/repos  │  │    │
                     │                      │  │ /ui/* (static) │  │    │
                     │                      │  └────────────────┘  │    │
                     │                      └────┬───────────┬─────┘    │
                     │                           │           │          │
                     └───────────────────────────┼───────────┼──────────┘
                                                 │           │
                       HTTPS (bearer token)──────┘           └──────HTTPS (cookie session)
                                                 │           │
       ┌─────────────────────────────────────────▼┐         ┌▼──────────────────────────┐
       │           Developer laptop               │         │   Web Dashboard           │
       │                                          │         │   (React + Vite + ELK)    │
       │  ┌────────────────────────────────────┐  │         │   - Repo picker           │
       │  │  Generic API MCP (stdio process)   │  │         │   - Graph view per repo   │
       │  │  - reads operations manifest       │  │         │   - Layer/cluster view    │
       │  │  - calls REST API over HTTPS       │  │         │   - Drill-down to symbol  │
       │  └────────────────┬───────────────────┘  │         │   - Open in Bitbucket     │
       │                   │ stdio (JSON-RPC)     │         │     (link out, no code    │
       │                   ▼                      │         │      embedded in UI)      │
       │           ┌──────────────┐               │         └───────────────────────────┘
       │           │ Claude Code  │               │              ▲
       │           └──────────────┘               │              │ browser
       └──────────────────────────────────────────┘         (any dev, internal network)
```

**1. Bitbucket** *(external — already exists)*
The team's source-of-truth git host. Two integration points:
- *Outbound*: sends webhook events to the service on every push to `main`/`develop`.
- *Inbound*: the service reads from it (shallow clones during indexing, file fetches on Claude's behalf via `/code/*`).

**2. Webhook receiver** *(FastAPI endpoint)*
First service component to touch every code change. Verifies HMAC signature, parses the Bitbucket payload, filters branches (`main`/`develop` only), debounces (one job per 10 minutes per `(repo, branch)`), and enqueues a parse job by inserting a row into `parse_runs`. Returns 202 immediately — never blocks the upstream Bitbucket webhook delivery.

**3. Job queue** *(a SQLite table, not a separate system)*
The `parse_runs` table is the queue. `status` column transitions `pending → running → success | failed`. Workers pull jobs using `BEGIN IMMEDIATE` + atomic update with `RETURNING`. No Redis, no Celery, no Kafka — at this scale (50-200 jobs/day) it's wasted complexity. SQLite handles it natively.

**4. Worker** *(Python process, possibly multiple)*
The only component that actually reads source code. For each job:
1. Shallow-clones the repo at the target commit into a `tempfile.TemporaryDirectory`
2. Runs Graphify, captures the JSON output
3. Inside one transaction: deletes existing `(repo, branch)` symbols+edges, inserts new ones tagged with the new `commit_sha`
4. Updates `parse_runs.status`, cleans up the tmp directory
5. Emits audit log entries

Wall-clock and memory limits per job (30 min, 4 GB) prevent runaway parses. On worker startup, any job stuck in `running` for >1 hour gets reset to `pending` for recovery.

**5. Index store** *(SQLite, WAL mode, on EBS)*
A single `index.db` file. Five tables: `symbols`, `edges`, `parse_runs`, `tokens`, `audit_log`. Lives on a gp3 EBS volume mounted to the service instance. Backed up to S3 nightly via SQLite's online backup API. Never on EFS — that combination is documented as unsafe by SQLite's own docs.

**6. REST API** *(FastAPI)*
The only surface Claude (or anything else) talks to. Two families of endpoints:
- `/locate/*` — queries the SQLite index, returns pointers. The "replace grep" operations.
- `/code/*` — proxies to Bitbucket with aggressive caching (commit-SHA-keyed, infinite TTL). The "fetch the actual code" operations.

Plus `/repos`, `/status/repos`, `/admin/reparse`, `/health`, `/metrics`, `/openapi.json`. Bearer token auth, per-token rate limiting, full Pydantic validation in and out, audit log on every call.

**7. Generic API MCP** *(stdio process on each developer's laptop)*
The team's existing extended Agoda-style MCP. Runs as a stdio process spawned by Claude Code. Reads the operations manifest at startup, exposes 4 tools (`list_apis`, `search_schema`, `execute_rest`, `sql_query`) — but `execute_rest` is the one that matters here. Translates Claude's tool calls into HTTPS requests against the REST API. **No new MCP code** — just a new manifest entry.

**8. Operations manifest** *(JSON file in the team's `.claude/` repo)*
The contract between Claude and the service. Lists every operation with method, path, parameters (with regex constraints), `when_to_use` text, and an example. The preamble tells Claude the locate-then-read workflow explicitly. This file is the highest-leverage artefact in the whole system — it's what makes Claude pick the right operation without trial-and-error.

**9. Claude Code** *(per-developer, already deployed)*
The runtime. Picks up the MCP from the team's shared `.claude/` config. Used by ~100 developers daily for analyst-style work — investigating tickets, tracing batch failures, reviewing PRs, understanding unfamiliar code.

**10. Dashboard backend** *(FastAPI routes on the same service)*
A small set of `/graph/*` endpoints designed for visualization. Returns subgraph JSON shaped for React Flow + ELK layout — nodes with kind/layer hints, edges with type+weight. Distinct from `/locate/*` which is optimized for Claude's pointer needs. Never returns code (the dashboard links out to Bitbucket for that). Static UI bundle served from `/ui/*`. Uses the same bearer-token auth as the rest of the API, but the browser flow exchanges the bearer for a short-lived signed cookie at first visit.

**11. Web Dashboard** *(React 18 + Vite + React Flow + ELK, served from the service)*
A read-only, server-rendered visualization layer. Devs hit `https://graphify.internal/ui`, sign in (SSO or token), pick a repo from a dropdown, see its structural graph rendered with layer clustering. Click a symbol → sidebar shows its callers, dependencies, and a "Open in Bitbucket" link. **No code is rendered in the dashboard** — every drill-down to actual code happens by linking out to Bitbucket. This keeps the dashboard's security surface tiny and avoids duplicating Bitbucket's view-source experience.

The graph viewer components are lifted from Understand-Anything (MIT-licensed): `KnowledgeGraphView`, `FlowNode`, `LayerClusterNode`, `utils/elk-layout.ts`, `utils/containers.ts`, `utils/edgeAggregation.ts`. Removed: tours, persona system, code viewer, summaries, language-lesson panels, theme picker (single dark theme only). Net result: roughly 1,500-2,000 lines of well-tested visualization code reused, ~500-1,000 lines of new code to wire it to our REST API and add repo-picker / drill-down.

### 3.3 End-to-end flow: a real analyst question

Concretely, here's what happens when a developer asks Claude *"What calls `submitOrder` in the payments-api repo, and is there retry logic in any of them?"*

```
1. Developer types question in Claude Code
                    │
                    ▼
2. Claude reads the manifest preamble: "use locate_* first,
   then read_code_range. Don't grep."
                    │
                    ▼
3. Claude calls execute_rest("locate_callers",
                              { repo: "payments-api",
                                symbol: "submitOrder",
                                depth: 2 })
                    │
                    ▼ (stdio → MCP → HTTPS)
4. REST API hits SQLite:
   recursive CTE on `edges` table where edge_type='CALLS'
   joins `symbols` table to get file_path + line_start/end
                    │
                    ▼
5. Returns ~12 pointers in <100ms:
   [{ caller_symbol: "checkoutHandler",
      file_path: "src/checkout.py",
      line_start: 45, line_end: 78, depth: 1, signature_hash: "a3f9..." },
    ... 11 more ]
                    │
                    ▼
6. Claude calls execute_rest("read_code_ranges",
                              { requests: [
                                  { repo: "payments-api", path: "src/checkout.py",
                                    ref: "develop", start: 45, end: 78 },
                                  ... 11 more ] })
                    │
                    ▼
7. REST API serves from cache (commit-SHA-keyed) for any files
   already fetched today; falls back to Bitbucket for the rest
                    │
                    ▼
8. Returns 12 code blocks, ~30-60 lines each
                    │
                    ▼
9. Claude reads the actual current code, finds the 3 callers
   that have retry logic and the 9 that don't, answers the
   developer with file:line references they can click on.
```

Total: 2 tool calls, ~500ms wall-clock, a few thousand tokens of context used. Without the service: 8-15 grep/read turns, 30+ seconds, tens of thousands of tokens, often missing the cross-file callers entirely.

### 3.4 What runs where

| Component | Where it runs | Why |
|---|---|---|
| Webhook receiver, REST API, Worker | Single EC2 / ECS task / k8s pod on AWS | One process, one SQLite file, simplest ops. Scale only when needed. |
| SQLite index file | Local EBS gp3 volume | Fast, durable, snapshot-able. Never EFS. |
| Code cache | Local EBS, separate directory | Same volume is fine; cap at 5GB with LRU. |
| Backups | S3 with versioning + SSE-KMS | Nightly snapshots, 30-day lifecycle. |
| Secrets (Bitbucket token, HMAC secret, dashboard cookie key) | AWS Secrets Manager | Pulled at startup, never in env files. |
| Generic API MCP | Each developer's laptop, stdio | Inherits dev's network identity, no inbound MCP transport needed. |
| Operations manifest | Team's `.claude/` git repo | Versioned, reviewed, distributed via `git pull`. |
| Dashboard frontend bundle | Built by CI, served as static assets from `/ui/*` on the same service | Single deployment unit. No separate frontend host. |
| Dashboard auth | Bearer token exchange → short-lived signed cookie | Cookie scoped to `/ui` and `/graph/*`, HttpOnly, Secure, SameSite=Strict. |

### 3.5 Where this fits in the team's broader Claude Code setup

The team already runs Claude Code with a shared `.claude/` directory in git. The Graphify service slots into that pattern with **two artefacts**:

1. A single new entry in `.claude/mcp.json` configuring the generic API MCP with a `GRAPHIFY_*` env block.
2. A new `manifests/graphify_operations.json` file describing the locate + code-read operations.

Developers `git pull` and restart Claude Code. No new tools to install, no new accounts to create, no codebase to clone. The service exists at `https://graphify.internal/api` and is reachable from any dev laptop on the corporate network.

For human (non-Claude) use, the same service exposes a **read-only dashboard at `https://graphify.internal/ui`** — bookmarkable, browseable, drillable. Devs use it for onboarding to unfamiliar repos, visualizing service architecture before code review, and ad-hoc exploration. They use Claude Code for everything else.

For the junior analyst use case specifically:
- **Today's pain** is Claude grepping or trying to remember unfamiliar repos. The service eliminates that.
- **Today's ceiling** on analyst quality is partly context-burn from navigation. The service raises that ceiling because navigation now costs ~2 tool calls instead of ~10.
- **Today's risk** is stale or wrong information when Claude guesses at code structure. Webhook-driven freshness means the index is rarely more than 10 minutes behind reality.
- **Today's onboarding bottleneck** is "I've never seen this repo, where do I start?" The dashboard answers that visually in 30 seconds without needing a teammate.

Single SQLite file holds: symbols, edges, parse_runs (job state), tokens, audit_log. Single EBS volume. Backed up nightly to S3.

---

## 4. Phased Plan

Each phase is **self-contained**. Claude Code completes phase N entirely (including tests, audit, runbook) before phase N+1 starts. Phase gates are non-negotiable — if a gate fails, the phase isn't done.

---

### Phase 0 — Repo & CI Bootstrap

**Goal:** every CI gate listed in §2 is wired and enforced before any business logic exists.

**Build**
- Create repo skeleton: `pyproject.toml`, `uv.lock`, `src/graphify_index/`, `tests/`, `Makefile`.
- Pre-commit config: `ruff`, `ruff-format`, `mypy`, `bandit`, `gitleaks`.
- CI pipeline (GitHub Actions / Bitbucket Pipelines — match team standard):
  - lint → typecheck → bandit → pip-audit → pytest with coverage → secret scan
  - All gates blocking on PRs to `main`.
- `docker-compose.yml` for local dev: just the service (SQLite is in-process, no DB container needed).
- `Makefile` targets: `make up`, `make test`, `make lint`, `make security`, `make audit`.
- **`README.md` at the repo root** using the template in §8 below — Claude Code should generate this as the first file in the repo. It's the entry point every new contributor reads.

**Test**
- Add a deliberate `bandit`-flagged snippet, a deliberate `mypy` error, a deliberate `ruff` violation, a deliberate hardcoded secret. Confirm CI fails on each. Remove them.
- Coverage gate test: write a function with no test, confirm CI fails. Add the test, confirm it passes.

**Audit**
- Document the CI gate list in `docs/ci-gates.md`.
- First runbook: `docs/runbooks/local-dev.md`.

**Phase gate**
- Fresh clone on a clean machine: `make up` succeeds, `make test` passes, `/health` returns 200.
- All four deliberate failures in the test step were caught by CI.

---

### Phase 1 — Manual End-to-End Proof on One Repo

**Goal:** validate the entire locate-then-read concept on real code before automating anything.

**Build**
- Define final SQLite schema (this is the contract for everything downstream):
  ```sql
  CREATE TABLE symbols (
    id          INTEGER PRIMARY KEY,
    repo        TEXT NOT NULL,
    branch      TEXT NOT NULL,
    commit_sha  TEXT NOT NULL,
    name        TEXT NOT NULL,
    kind        TEXT NOT NULL,    -- function|class|method|module
    file_path   TEXT NOT NULL,
    line_start  INTEGER NOT NULL,
    line_end    INTEGER NOT NULL,
    signature_hash TEXT,           -- short hash of first non-blank line, used for drift detection
    language    TEXT,
    UNIQUE(repo, branch, name, file_path, line_start)
  );
  CREATE INDEX idx_symbols_lookup ON symbols(repo, name);
  CREATE INDEX idx_symbols_kind   ON symbols(repo, kind, name);

  CREATE TABLE edges (
    id          INTEGER PRIMARY KEY,
    repo        TEXT NOT NULL,
    branch      TEXT NOT NULL,
    from_symbol TEXT NOT NULL,
    to_symbol   TEXT NOT NULL,
    edge_type   TEXT NOT NULL      -- CALLS|IMPORTS|EXTENDS
  );
  CREATE INDEX idx_edges_from ON edges(repo, from_symbol, edge_type);
  CREATE INDEX idx_edges_to   ON edges(repo, to_symbol, edge_type);

  CREATE TABLE parse_runs (
    id           INTEGER PRIMARY KEY,
    repo         TEXT NOT NULL,
    branch       TEXT NOT NULL,
    commit_sha   TEXT NOT NULL,
    status       TEXT NOT NULL,    -- pending|running|success|failed
    started_at   TEXT,
    finished_at  TEXT,
    error        TEXT,
    symbol_count INTEGER,
    edge_count   INTEGER,
    graphify_version TEXT
  );

  CREATE TABLE audit_log (
    id             INTEGER PRIMARY KEY,
    ts             TEXT NOT NULL,
    actor          TEXT,
    action         TEXT NOT NULL,
    target         TEXT,
    args_hash      TEXT,
    status         TEXT NOT NULL,
    correlation_id TEXT,
    ip             TEXT
  );
  ```
- Schema migration tooling: Alembic configured against SQLite.
- Manual scripts (CLI, no API yet):
  - `scripts/parse_repo.py --repo-url X --branch Y --commit Z` — clones to tmp, runs Graphify, prints summary.
  - `scripts/load_index.py <graphify.json>` — loads into SQLite.
  - `scripts/query_locate.py --repo X --symbol Y` — manual lookup.

**Test**
- Unit tests for the Graphify-output parser (use a small fixture JSON).
- Unit tests for SQLAlchemy models — every column constraint, every index.
- Integration test: parse → load → query, end-to-end against a tiny fixture repo committed to `tests/fixtures/`.
- Idempotency test: load same data twice → row count is identical, no duplicates.

**Audit**
- Pick **one real team repo**. Parse it. Manually verify 5 hand-picked queries against grep + reading the file. Document results in `docs/phase1-validation.md`:
  - Query: `find symbol X` → expected pointer matches reality? (yes/no)
  - Query: `find callers of Y` → list matches grep? (yes/no, with diffs explained)
- All Cypher/SQL in scripts uses parameter binding — verified by running the secret scan on the scripts dir.
- Tmp clone dir uses `tempfile.TemporaryDirectory` and is cleaned on success and failure (test this with a forced exception).

**Phase gate**
- All 5 hand-picked queries return correct results.
- Re-running the same commit produces identical SQLite state (idempotent).
- Validation doc committed.

---

### Phase 2 — Worker + Job Queue

**Goal:** parsing runs as a proper background worker, job state persisted, recoverable on crash.

**Build**
- Job queue using SQLite + `BEGIN IMMEDIATE` + `parse_runs.status` field. No Redis.
  - Enqueue: insert row with `status='pending'`.
  - Dequeue: `UPDATE … SET status='running' WHERE id = (SELECT id FROM parse_runs WHERE status='pending' ORDER BY id LIMIT 1) RETURNING *`.
- Worker process (`src/graphify_index/worker.py`):
  - Picks next pending job
  - Shallow-clones into a per-job tmp dir
  - Runs Graphify with timeout (30 min wall-clock, 4 GB RSS limit)
  - Inside one SQLite transaction: deletes existing symbols+edges where `(repo, branch)` matches, inserts new ones tagged with `commit_sha`
  - Updates `parse_runs` row
  - Cleans tmp dir
- CLI: `python -m graphify_index.worker.run-once` and `python -m graphify_index.worker.daemon`.
- Stuck-job recovery: on worker startup, reset any `status='running'` row older than 1h to `status='pending'`.

**Test**
- Unit test: dequeue picks oldest pending job; concurrent dequeue picks distinct jobs (or one fails cleanly).
- Integration test: enqueue 3 jobs, run worker, all three complete with correct counts.
- Crash test: enqueue a job, kill the worker mid-parse (use a fixture that sleeps), restart worker, confirm job is reset and re-runs cleanly without duplicates.
- Idempotency test: enqueue same `(repo, branch, commit)` twice in a row, run worker, final state identical to running once.
- Resource limit test: feed worker an artificial repo that exceeds memory; confirm the worker kills the job and marks `status='failed'` with a clear error, doesn't corrupt the index.

**Audit**
- Walk through the worker code with this checklist:
  - Tmp dir always cleaned (test the failure path)
  - Clone URL validated against allowlist
  - All inserts use parameter binding
  - Worker uses a SQLite connection with `PRAGMA foreign_keys=ON, journal_mode=WAL`
- Audit log entries emitted on: job dequeue, parse start, parse success, parse failure, stuck-job reset.

**Phase gate**
- 5 different real repos parsed cleanly via the worker (manually enqueued).
- Crash test passes — kill mid-parse, restart, recover.
- Audit log shows all 5 jobs with full lifecycle.

---

### Phase 3 — Webhook Receiver

**Goal:** Bitbucket merges automatically trigger fresh parses.

**Build**
- `POST /webhook/bitbucket` endpoint:
  - HMAC verification with `hmac.compare_digest`
  - Pydantic model parses the Bitbucket payload
  - Filters: only `main` and `develop` (configurable per repo)
  - Debounce: skip if a job for `(repo, branch)` is `pending` or started <10 min ago
  - Returns 202 + correlation ID
- `POST /admin/reparse` (admin token): force re-enqueue.
- `GET /status/repos`: list of repos, last successful parse per branch, current freshness in seconds.
- Simple status HTML page rendered from `/status/repos`.
- Configure Bitbucket webhook for one pilot repo.

**Test**
- Unit test: HMAC verification accepts good signature, rejects bad, rejects missing — all paths use `compare_digest`.
- Integration test: POST a valid webhook payload → row enqueued → worker picks up → parse completes.
- Debounce test: POST 5 webhooks in 5 seconds → exactly 1 job enqueued.
- Branch filter test: webhook for `feature/foo` → no job enqueued, audit log records the skip with reason.
- Security test: oversized body (>1 MB) rejected with 413.
- Security test: malformed JSON rejected with 400, no stack trace leaked.

**Audit**
- Every webhook receipt — accepted, debounced, rejected — produces an audit_log entry with the correlation ID.
- Verify allowlist of Bitbucket source IPs at the load-balancer / WAF layer (document this even if it's external infra).
- Document the HMAC secret rotation procedure in `docs/runbooks/secret-rotation.md`.

**Phase gate**
- Push a commit to the pilot repo's `develop` branch → within 10 minutes, `/status/repos` shows the new commit's parse completed.
- Send a webhook with a bad HMAC → 401, audit log entry recorded, no job enqueued.
- Push 5 commits in 30 seconds → exactly 1 parse runs (debounce confirmed).

---

### Phase 4 — Locate API

**Goal:** Claude (and anything else) can query the index over HTTPS.

**Build — endpoints**

All return small JSON, all support `?limit=N` (default 50, hard cap 200), all return `truncated: bool` and `total_available: int`.

```
GET  /locate/symbol?repo=&pattern=&kind=
       → [{ name, kind, file_path, line_start, line_end, signature_hash, commit_sha }]

GET  /locate/definition?repo=&symbol=
       → { name, kind, file_path, line_start, line_end, signature_hash, commit_sha } | 404

GET  /locate/callers?repo=&symbol=&depth=  (depth 1-5, default 2)
       → [{ caller_symbol, file_path, line_start, line_end, depth }]

GET  /locate/dependencies?repo=&symbol=&depth=
       → [{ dependency_symbol, file_path, line_start, line_end, depth }]

GET  /locate/file-symbols?repo=&path=
       → [{ name, kind, line_start, line_end }]

GET  /repos
       → [{ repo, branches: [{ branch, last_parsed_commit, last_parsed_at, freshness_seconds }] }]
```

**Build — supporting**
- Bearer token auth on every endpoint (except `/health`). Token validation via Argon2id hash lookup in SQLite.
- Per-token rate limit: 60 req/min default.
- All path/query params validated by Pydantic models with strict regex (`^[A-Za-z0-9_./:-]+$` for identifiers).
- Response models force exact field shapes.
- OpenAPI 3.1 spec auto-generated at `/openapi.json`.
- Recursive callers/dependencies via SQLite recursive CTE — this is the only "graph-shaped" query and SQLite handles it well at this scale.

**Test**
- Unit tests for each endpoint's request validation: empty inputs, oversized inputs, regex-violating inputs all rejected.
- Integration tests against a fixture index: every endpoint returns expected shape and content.
- Truncation test: query against a hot symbol with >200 callers → response is capped, `truncated=true`, `total_available` accurate.
- **Security tests (must run in CI):**
  - SQL injection fuzz on every parameter (`'; DROP TABLE symbols; --`, `' OR '1'='1`, unicode tricks). All return 400 or empty results, never an error trace, never a successful injection. Add an explicit assertion that the `symbols` table still exists after fuzz suite runs.
  - Bearer token missing/invalid → 401, no body leak.
  - Rate limit exceeded → 429.
  - Path traversal in `path=` parameter (`../../etc/passwd`) → 400.
- Contract test: every endpoint's response validated against its OpenAPI schema in CI.

**Audit**
- Run a full SAST scan (`bandit -r src/ --severity-level low` plus `semgrep` with the `python.lang.security` ruleset).
- Manually grep the codebase: `grep -rE "execute\(f|execute\(.*\+|execute\(.*%" src/` should return zero hits.
- Run `pip-audit` and document any deferred CVEs with mitigations.
- Audit log entry on every API call (success and failure), including args hash (not args themselves — those may contain sensitive symbol names).

**Phase gate**
- All endpoints return correct results against real index data from Phase 1's repo.
- Full security test suite passes in CI.
- An external pen-test (or at minimum a ZAP baseline scan) against staging produces zero high/critical findings.

---

### Phase 4.5 — Code Read Endpoint (Bitbucket Proxy)

**Goal:** Claude doesn't need a clone — fetches the actual code through the service.

**Build**
- `GET /code/file?repo=&path=&ref=` → returns file content, `Content-Type: text/plain`.
- `GET /code/range?repo=&path=&ref=&start=&end=` → returns just those lines.
- `POST /code/ranges` body `{ requests: [{ repo, path, ref, start, end }, ...] }` → batch fetch, parallel internal calls, single response. (This is the speed lever for the locate-then-read workflow.)
- Cache layer (in-memory LRU + on-disk under `/var/lib/graphify-index/code-cache/`):
  - Keyed by `(repo, path, commit_sha)` — immutable, infinite TTL
  - Keyed by `(repo, path, branch)` — short TTL (5 min)
  - Cache size cap (e.g. 5 GB) with LRU eviction
- Bitbucket auth: service-level token with read-only scope, stored in AWS Secrets Manager.

**Test**
- Unit test: cache hit/miss logic, eviction.
- Integration test: fetch a known file → matches Bitbucket directly.
- Range test: fetch lines 10-20 of a known file → exact match.
- Batch test: 10 ranges in one POST → all returned, ordering preserved.
- Security test: `path=../../etc/passwd` → 400.
- Security test: arbitrary `repo` not in `repos` table → 403.
- Security test: oversized response (e.g. 100 MB binary) → cap and refuse with 413.
- Rate limit test on Bitbucket calls — confirm we don't blow the upstream quota under load.

**Audit**
- Confirm Bitbucket token has read-only scope and is in Secrets Manager, not env files.
- Cache directory permissions are `0700`, owned by service user.
- No code is logged; only paths and SHAs.

**Phase gate**
- Claude Code can: call `/locate/definition` → call `/code/range` with the returned pointer → get correct code. End-to-end works.
- Bitbucket call rate observed and within quota.
- Cache hit rate after 1 hour of synthetic traffic ≥ 70%.

---

### Phase 4.7 — Read-Only Dashboard

**Goal:** devs can browse any indexed repo visually at `https://graphify.internal/ui`. Same data Claude queries, rendered for human eyes. Read-only, server-side, no per-dev clones, no LLM dependency.

**Scope discipline (this matters — keep the dashboard small):**
- ✅ Repo picker, structural graph view, layer clustering, drill-down to symbol info, "Open in Bitbucket" links
- ❌ No code rendering in the UI (always link out to Bitbucket)
- ❌ No tours, no personas, no LLM-generated summaries, no editing, no annotations
- ❌ No multi-repo cross-graph views in v1
- ❌ No theme picker — single dark theme

**Build — backend (FastAPI routes on the same service)**

```
GET  /graph/repos                                  — list of indexed repos (already returned by /repos, alias OK)
GET  /graph/repo/{repo}/overview?branch=           — high-level: layers, file counts per layer, total nodes/edges
GET  /graph/repo/{repo}/structure?branch=&limit=   — full structural graph for a repo, capped, ELK-friendly shape:
                                                       { nodes: [{id, name, kind, layer, file_path, line_start, line_end}],
                                                         edges: [{source, target, type}] }
GET  /graph/repo/{repo}/symbol/{symbol}            — symbol detail: definition, callers (paginated), dependencies, file path,
                                                       link to Bitbucket at current commit_sha
GET  /graph/repo/{repo}/file?path=                 — symbols in a file (delegates to existing /locate/file-symbols logic)
```

All endpoints:
- Bearer token OR cookie session accepted
- Rate-limited per token/session (60 req/min, same as locate API)
- Same Pydantic validation, same audit logging
- Hard caps: structure endpoint capped at 5,000 nodes (warn UI to ask user to filter by layer if exceeded)

**Build — auth flow for browser**
- `GET /ui/login` accepts a bearer token (query param or POST), validates against `tokens` table, issues a short-lived (8 hours) signed cookie
- Cookie: `HttpOnly`, `Secure`, `SameSite=Strict`, scoped to `/ui` and `/graph/*` paths only
- Cookie signing key in AWS Secrets Manager, rotated quarterly
- Logout clears cookie, recorded in audit log
- Cookie revocation: `revoked_sessions` table — every request checks against it, sub-millisecond lookup

**Build — frontend**

Lift these components from Understand-Anything (MIT, copy with attribution preserved in `THIRD_PARTY_LICENSES.md`):

```
packages/dashboard/src/components/
  KnowledgeGraphView.tsx      → main graph canvas
  FlowNode.tsx                → individual node rendering
  LayerClusterNode.tsx        → layer grouping
  ContainerNode.tsx           → directory containers
  Breadcrumb.tsx              → navigation
  SearchBar.tsx               → fuzzy symbol search

packages/dashboard/src/utils/
  elk-layout.ts               → ELK auto-layout
  containers.ts               → directory clustering
  edgeAggregation.ts          → reduce visual noise on hot symbols
  louvain.ts                  → community detection (optional, defer if not needed)
  filters.ts                  → node/edge filtering
```

Drop these (don't lift):
- LearnPanel, PersonaSelector, ThemePicker, KeyboardShortcutsHelp (out of scope)
- CodeViewer (we link out to Bitbucket instead)
- DiffToggle, PathFinderModal (v2 features)
- Any component referencing tours, personas, or summaries

**New code to write (~500-1000 lines):**
- `RepoPicker.tsx` — dropdown of indexed repos with freshness indicator
- `SymbolDetail.tsx` — sidebar showing definition, callers, dependencies, "Open in Bitbucket" button
- `ApiClient.ts` — typed wrapper around `/graph/*` endpoints, includes auth handling
- `App.tsx` — routing (repo list → repo overview → graph view → symbol detail)
- `main.tsx` + minimal Vite config — single entry, single bundle

Build the bundle in CI, copy to `src/graphify_index/static/ui/` in the service container, served by FastAPI as static files.

**Test**
- Unit: every new component renders given mock data; `ApiClient.ts` handles 401/403/429/5xx correctly
- Unit: cookie issuance and validation, expiration enforcement, revocation lookup
- Integration: full flow — bearer token → cookie issuance → graph fetch → render — against real index data
- Browser tests (Playwright): pick repo → see graph → click node → see detail → click "Open in Bitbucket" → URL is correct
- Performance: render 5,000-node graph without locking up the browser tab (use ELK web worker, virtualization)
- Security:
  - CSRF: cookie endpoints reject requests without `Sec-Fetch-Site: same-origin` *and* the right `Origin` header (defense in depth on top of `SameSite=Strict`)
  - XSS: every string rendered from API is escaped; symbol names never rendered as HTML; CSP header set to `default-src 'self'; script-src 'self'` no inline scripts/styles in the bundle
  - Path traversal: backend re-validates repo + path inputs even though they came from the dashboard
  - Token theft simulation: revoked cookie cannot make graph calls (test the revocation table lookup)
- Accessibility: keyboard navigation works for graph traversal (Tab through nodes), screen reader can read symbol names, color contrast ≥ AA

**Audit**
- Every dashboard page load and every `/graph/*` call logged with the cookie's owner, the repo, the symbol (if any) — same audit table as the rest of the API
- Run ZAP active scan against staging dashboard URL; zero high/critical findings
- Run a frontend-specific dependency audit (`npm audit --production`); zero high/critical
- Verify the `THIRD_PARTY_LICENSES.md` correctly attributes Understand-Anything (MIT) and lists every transitive dep with its license. Auto-generated via `license-checker --production --json`
- Confirm CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: same-origin headers on all dashboard responses
- Manual review: confirm no code content is ever embedded in dashboard HTML responses (only pointers + Bitbucket links)

**Phase gate**
- 5 trusted devs use the dashboard for a real task (onboarding to an unfamiliar repo, exploring before a code review). Collect feedback.
- Pen-test (ZAP active scan + manual review of cookie/CSRF/XSS surface) returns clean
- Render time for the largest team repo's structure < 3 seconds on a typical dev laptop
- Lighthouse accessibility score ≥ 90
- Audit log shows every browser action attributed correctly to a user

**Why this phase is worth doing (for reference, not for relitigating)**
- Onboarding gain: "Show me the payments-api architecture" goes from a 30-min teammate walkthrough to a URL share
- Index visibility: without this, the index is invisible to humans — only Claude can see what's in it. The dashboard makes the same data browseable
- Trust: when an analyst sees Claude reference a symbol, they can verify it exists by clicking through the same UI
- It costs ~1-2 weeks of engineering. Most of the visualization work is lifted from Understand-Anything's MIT components

---

### Phase 5 — Operations Manifest + Generic API MCP Wiring

**Goal:** Claude Code uses the service via the existing generic API MCP, with no new MCP code.

**Build**
- `manifests/graphify_operations.json` shipped in the team's `.claude/` repo.
- **Manifest preamble** (this is the highest-leverage text in the whole system):
  > "These operations replace grep for code questions. The workflow is two-phase: (1) call a `locate_*` operation to find which file and lines contain the symbol you care about, then (2) call `read_code_range` with the returned pointer to get the actual current code. Always read the actual code before answering — locate operations only return pointers, never code. If a symbol isn't found, broaden the pattern before giving up. Do not attempt to discover other operations beyond the ones listed here."
- One manifest entry per endpoint from Phases 4 and 4.5. Each includes `id`, `method`, `path`, `when_to_use` (written carefully, in opposition to neighbouring operations), `params` with regex constraints, `response_shape`, and an `example`.
- `.claude/mcp.json` snippet for the generic API MCP, pointing at the manifest path and the service URL.
- Onboarding doc: how to set the auth token, what to do if a call fails, how to file feedback.

**Test (manifest evaluation harness — this is critical)**
- Build a fixture set of **30 representative analyst questions**, each labelled with the expected first operation Claude should call. Examples:
  - "Where is `submitOrder` defined?" → `locate_definition`
  - "What calls `processBatch`?" → `locate_callers`
  - "Show me the imports in `payments.py`" → `locate_file-symbols`
- Run each question through Claude Code with the manifest loaded. Record the first tool call.
- Score: % of questions where Claude picked the correct first operation.
- **Phase gate threshold: ≥ 90%.** If lower, iterate the `when_to_use` text and rerun. Do not move to rollout below this bar.
- Also test the workflow: for 10 of the 30 questions, confirm Claude does locate-then-read (not locate-only or grep-fallback).

**Audit**
- Manifest is read-only at runtime. Generic API MCP refuses any operation not present in the manifest — verify with a hand-crafted attempt.
- Token storage on dev machines: documented (OS keychain or env var), never in `.claude/` repo.
- Tokens are per-team-service-account with `X-User` header for attribution. Token rotation procedure documented.

**Phase gate**
- 5 trusted devs run real analyst sessions for 1 week. Collect:
  - Sessions that completed successfully
  - Sessions where Claude grepped instead of locating (should be near zero)
  - Average tool calls per question (baseline: measure pre-rollout grep flow)
- Manifest eval ≥ 90% correct-operation selection.

---

### Phase 6 — Operational Hardening

**Goal:** survive 100 devs hitting it daily without you babysitting it.

**Build**
- Structured JSON logs to central log store (CloudWatch / Splunk per org standard).
- Prometheus `/metrics` endpoint: request counts, latencies (p50/p95/p99), errors, queue depth, parse durations, cache hit rates, Bitbucket quota usage. **Dashboard-specific metrics**: page loads, graph render times, repo selection distribution, cookie issuance/revocation rate.
- Ops dashboard (Grafana) with the above plus per-repo freshness.
- Alerts (PagerDuty / equivalent):
  - Queue depth > 50 for >10 min
  - Parse failure rate > 10% over 1h
  - REST p95 > 2s over 15 min
  - Bitbucket quota usage > 80%
  - Any 5xx burst (>5 in 5 min)
  - **Dashboard `/graph/structure` p95 > 5s over 15 min** (graph render is heavier than locate; separate SLO)
  - **Cookie issuance failures > 5 in 5 min** (signals auth pipeline issue)
- **Cron fallback worker**: every night, re-enqueue any active repo whose `main`/`develop` parse is >24h old. Catches missed webhooks silently.
- **Cookie cleanup cron**: nightly purge of expired entries from `revoked_sessions` table.
- **Backup**: nightly `sqlite3 .backup` + ship to S3 with versioning + 30-day lifecycle. Automated restore test weekly into a staging instance.
- **Graphify version bump runbook**: documented procedure for re-parsing all repos after upgrade. Test it once.
- **Frontend dependency rotation runbook**: how to bump React Flow / ELK / Vite, rebuild the bundle, redeploy. Test it once.
- Incident runbooks in `docs/runbooks/`: webhook outage, worker stuck, SQLite locked, Bitbucket quota exhausted, runaway parse, **dashboard slow render, dashboard auth outage, suspected token theft**.

**Test**
- Chaos test: kill worker mid-parse, kill REST API for 5 min, send 100 webhooks in 10 seconds, send 50 concurrent dashboard graph requests. Service recovers without manual intervention. No corruption. Dashboard page loads return to <3s once recovered.
- Backup/restore test: snapshot, wipe staging, restore, run query suite + dashboard smoke test, all passes.
- Cron fallback test: pause webhook for a repo, advance time mock, run cron, confirm reparse triggered.
- Token revocation test: revoke a session, confirm the next graph request from that cookie returns 401 within one request.

**Audit**
- Logs scrubbed of secrets — explicit allowlist of fields in the logger config. Cookie values never logged (only hashed session IDs).
- S3 backup bucket: SSE-KMS encrypted, versioned, public access blocked, lifecycle policy active.
- IAM: workers can't read tokens, REST API can't write to graph (separate SQLite users via separate connection strings with read-only PRAGMA).
- Quarterly secret rotation tested in staging — includes Bitbucket token, HMAC secret, dashboard cookie signing key.
- CSP report-uri configured to log violations; review CSP reports weekly during the first month.

**Phase gate**
- Chaos test passes end-to-end (REST API + dashboard).
- Restore from backup completes in <15 min and produces working service including dashboard.
- All runbooks reviewed by a second engineer.

---

### Phase 7 — Team Rollout

**Goal:** all 100 devs using it, with feedback loop in place.

**Build**
- `.claude/` repo PR adds the manifest and MCP config.
- 1-page launch doc + 15-min demo recording with 3 real-world example questions **plus a dashboard walkthrough on a real repo**.
- Slack channel for feedback.
- Per-team "code-graph buddy" identified — someone who's used it for a week and can help in-team.
- Office hours: 30 min twice a week for first 2 weeks.
- Weekly audit log review for first month:
  - Top operations used (Claude Code) → keep their manifest text sharp
  - Failed operations → fix manifest or REST behaviour
  - Long-tail operations → consider deprecating
  - **Top dashboard pages and repos viewed** → understand which repos drive onboarding traffic
  - **Dashboard sessions per dev** → adoption signal alongside Claude Code usage

**Test**
- Week 1: pilot 10 devs. Collect feedback, fix obvious gaps. Pilot covers both Claude Code use and dashboard use.
- Week 2: 30 devs.
- Week 3: full rollout, only if metrics stable.
- Adoption metric: ≥ 60% of the 100 devs have called the service via Claude Code ≥ 5 times within 4 weeks of launch. **Secondary metric**: ≥ 30% of devs have opened the dashboard ≥ once within 4 weeks (lower bar — dashboard is supplementary). If primary is lower, investigate why before declaring success.

**Audit**
- Token registry: every issued token has a known owner, tracked in an internal sheet or table.
- Token revocation procedure documented and tested at least once (revocation works for both API bearer and dashboard cookie).
- Quarterly access review: tokens unused for 90+ days auto-revoked.

**Phase gate**
- Primary adoption metric met (Claude Code usage).
- Zero critical incidents in the first 4 weeks (API or dashboard).
- Feedback loop established and being acted on weekly.

---

## 5. Phase Summary

| Phase | Focus | Effort | Phase gate (must pass before next phase) |
|---|---|---|---|
| 0 | CI + bootstrap | 2-3 days | All CI gates catch deliberate failures |
| 1 | Manual end-to-end | 2 days | 5 hand-picked queries validated correct |
| 2 | Worker + queue | 4-5 days | Crash + idempotency tests pass |
| 3 | Webhook | 3 days | Real merge → fresh index in <10 min |
| 4 | Locate API | 4-5 days | All endpoints + security suite pass, ZAP clean |
| 4.5 | Code read API | 2-3 days | End-to-end locate→read works, cache ≥70% hit |
| 4.7 | Read-only dashboard | 6-8 days | 5 devs use it for real tasks, ZAP + Lighthouse clean |
| 5 | Manifest + MCP | 3-4 days | Eval harness ≥ 90% correct operation |
| 6 | Ops hardening | 4-5 days | Chaos + restore tests pass |
| 7 | Rollout | 2-3 weeks calendar | Adoption ≥ 60% in 4 weeks |

**Total build effort: ~5-7 weeks engineering (was 4-5 before adding the dashboard). Full team active: ~8-9 weeks calendar.**

---

## 6. Decisions to Lock in Phase 0

Don't carry these as open questions into Phase 1:

1. **Repo allowlist source**: hardcoded list, env var, or `repos` table seeded from a config file? (Recommend: config file checked into the service repo, applied at startup.)
2. **Auth token issuance**: manual via admin endpoint, or a small CLI? (Recommend: admin endpoint, documented in onboarding.)
3. **Graphify version pin**: which exact version is "blessed"? Document in `docs/graphify-version.md`.
4. **PII in code**: any repos contain real customer data in fixtures? If yes, audit Graphify output on a sample and add scrubbing if symbol names or paths leak it.
5. **Single instance vs HA**: starting single-instance with EBS snapshots. If HA becomes a requirement later, that's the trigger to revisit storage (likely move to Postgres at that point — but explicitly out of scope now).
6. **Dashboard auth model**: bearer-token-exchange-for-cookie (recommended) vs SSO integration. Document in `docs/dashboard-auth.md`. If SSO is mandated by the org, lock in the SAML/OIDC provider in Phase 0 since it influences cookie shape and revocation flow.
7. **Dashboard hostname**: same domain as API (`graphify.internal/ui`) or subdomain (`graphify-ui.internal`)? Same-domain simplifies cookie scoping and CORS; recommended unless the org has a separate frontend host policy.

---

## 7. Explicitly Out of Scope (don't build these now)

To keep the service tight and shippable, the following are deferred:

- Cross-repo edge linking
- Composed `/investigate` endpoints (graph + Cortex + Jira fusion)
- Semantic enrichment of nodes (last commit, ownership, JIRA refs)
- Multi-instance HA / Postgres migration
- Per-user OAuth proxying to Bitbucket
- Feature-branch on-demand parsing
- LLM-generated summaries / tours / personas in the dashboard
- Code rendering inside the dashboard (always link to Bitbucket instead)
- Diff overlay / PR impact view in the dashboard (v2 feature)
- Multi-repo cross-graph view in the dashboard

Each of these has merit. None of them block the core value of "Claude stops grepping" or "devs can browse the index visually." Revisit after rollout, based on observed usage patterns from the audit logs.

---

## 8. README.md Template (Claude Code generates this in Phase 0)

When Claude Code starts Phase 0, the very first file it should create at the repo root is `README.md` using the template below. Edit dates, owners, and links as appropriate. Keep it short — this is the new-contributor entry point, not the full design doc.

````markdown
# Graphify Index Service

A central **symbol locator** for the team. Replaces grep in Claude Code analyst sessions.
Returns pointers (`repo`, `file`, `line_start`, `line_end`) — never code.

> **Status:** under active development. See [`docs/PLAN.md`](./docs/PLAN.md) for the
> phased build plan and current phase.

---

## What this is

When a developer asks Claude Code something like *"what calls `submitOrder`?"* or
*"where is the retry logic in the batch job?"*, Claude needs to find the right code
before it can answer. Today it greps blindly — slow, noisy, often wrong.

This service maintains a fresh symbol index for every team repo. Claude asks the index
where things live, gets pointers back, then fetches just the relevant code from Bitbucket.
Navigation drops from ~10 tool calls to ~2.

**A read-only web dashboard** rendering the same indexed data is also included for human
exploration — pick a repo, see its layered architecture, drill into symbols and callers,
link out to Bitbucket for the actual code. Useful for onboarding and pre-review reading
without needing to clone anything.

**It does:** return pointers to symbols, callers, dependencies, and file contents to
Claude. Render those same relationships visually for humans.
**It does not:** store code bodies in the index, generate LLM summaries, replace Claude,
or replicate Bitbucket's source-viewing UI.

## How it fits in

```
Bitbucket ──webhook──▶ Service (parses on every merge)
                          │
                          ▼
                       SQLite index
                          │
                  ┌───────┴────────┐
                  │                │
                  ▼                ▼
              REST API         Dashboard
                  │            (read-only,
                  ▼             browseable)
        Generic API MCP             ▲
                  │                 │ browser
                  ▼                 │
            Claude Code      Any dev on
            (your laptop)    internal network
```

You don't need to clone any code locally. Claude reaches the service through the team's
existing generic API MCP, configured in shared `.claude/`. Humans can also browse the same
indexed data visually at `https://graphify.internal/ui` — same data Claude sees, rendered
for human eyes. See [`docs/USAGE.md`](./docs/USAGE.md) for both flows.

## Quick start (for service contributors)

```bash
# Prerequisites: Python 3.12+, uv, Docker
git clone <this repo>
cd graphify-index
make up        # starts the service locally with a fresh SQLite db
make test      # runs the full test suite
make lint      # ruff + mypy + bandit
make security  # bandit + pip-audit + gitleaks
make audit     # writes a fresh audit summary to ./audit-report.md
```

`/health` should return 200 once `make up` finishes. OpenAPI docs at
`http://localhost:8080/docs`.

## Architecture

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md). Short version:

| Component | Where it runs | Notes |
|---|---|---|
| Webhook receiver, REST API, Worker | Single EC2 / ECS task | One process, FastAPI |
| Index store | SQLite on local EBS, WAL mode | Never EFS |
| Code cache | Local EBS, LRU, 5 GB cap | Commit-SHA-keyed, infinite TTL |
| Backups | S3, nightly, KMS-encrypted | 30-day lifecycle |
| Secrets | AWS Secrets Manager | Bitbucket token, HMAC secret, dashboard cookie key |
| Dashboard | Read-only, served from `/ui/*` | React + Vite + ELK, components from Understand-Anything (MIT) |

## Project layout

```
src/graphify_index/
  api/          # FastAPI routes (locate, code, graph, status, admin, ui)
  worker/       # Background parser + job queue
  webhook/      # Bitbucket webhook receiver
  storage/      # SQLAlchemy models, migrations, query helpers
  graphify/     # Graphify subprocess wrapper, output parser
  bitbucket/    # Bitbucket API client + cache
  audit/        # Audit log writer
  security/     # Auth, HMAC, validators, cookie signing
  static/ui/    # Dashboard frontend bundle (built by CI, copied here)
ui/             # Dashboard frontend source (separate sub-project, built independently)
  src/
    components/   # Lifted from Understand-Anything (KnowledgeGraphView, FlowNode, etc.)
    utils/        # ELK layout, container clustering, edge aggregation
    pages/        # RepoPicker, RepoOverview, GraphView, SymbolDetail
    api/          # Typed client for /graph/* endpoints
  package.json
  vite.config.ts
tests/
  unit/
  integration/
  security/
  ui/             # Playwright browser tests for the dashboard
  fixtures/
docs/
  PLAN.md           # phased build plan (the source of truth)
  ARCHITECTURE.md   # component diagrams + flows
  USAGE.md          # how Claude Code users + dashboard users consume the service
  DASHBOARD.md      # dashboard architecture, lifted-component attribution
  THIRD_PARTY_LICENSES.md  # MIT attribution for Understand-Anything etc.
  runbooks/         # incident playbooks
scripts/
  parse_repo.py     # manual parse for one repo
  load_index.py     # manual load
  query_locate.py   # manual lookup
```

## Security & quality gates

Every PR must pass, with zero overrides:

- `ruff check` — lint
- `ruff format --check` — format
- `mypy --strict` — types
- `bandit -r src/` — SAST
- `pip-audit` — dependency CVEs
- `pytest` with coverage ≥ 80%
- `gitleaks` / `detect-secrets` — secret scan

All SQL goes through SQLAlchemy parameter binding. F-string SQL is forbidden and grep-checked
in CI. All user input is validated by Pydantic regex before reaching the query layer. Webhook
HMAC uses `hmac.compare_digest`. Tokens are Argon2id-hashed at rest.

See [`docs/SECURITY.md`](./docs/SECURITY.md) for the full threat model and controls.

## Operations

- **Audit log:** every webhook receipt, every API call, every parse, every token change
  goes to the `audit_log` table and is shipped to the central log store.
- **Metrics:** Prometheus endpoint at `/metrics`.
- **Status:** human-readable repo freshness at `/status/repos` (HTML page) or `GET /repos`
  (JSON).
- **Runbooks:** `docs/runbooks/` — webhook outage, worker stuck, SQLite locked, Bitbucket
  quota exhausted, runaway parse.

## How to use it from Claude Code

You don't install anything. Once it's deployed and your team's `.claude/` repo has the
manifest entry, just `git pull` your `.claude/` and restart Claude Code.

To verify it's wired up, ask Claude:

> *"Use the Graphify index to find where `<some symbol you know>` is defined in `<some repo>`."*

If it returns a file and line range, you're set. See [`docs/USAGE.md`](./docs/USAGE.md) for
example questions and tips.

## How to use the dashboard

For visual exploration, open `https://graphify.internal/ui` in your browser. First visit
asks for a token (paste your bearer token, get a session cookie). After that:

- Pick a repo from the dropdown
- See its structure laid out by architectural layer
- Click any symbol to see its callers, dependencies, and where it's defined
- "Open in Bitbucket" link on every symbol jumps you to the actual code

The dashboard is **read-only and contains no code** — it's a map, not an editor. To read
or edit code, follow the Bitbucket links. To ask questions, use Claude Code. The dashboard
is for "where does this live?" and "what does this repo look like?"

## Contributing

1. Pick the current phase from [`docs/PLAN.md`](./docs/PLAN.md).
2. Read the phase's Build / Test / Audit / Phase Gate sections in full.
3. Open a PR against `main`. CI must be green; phase gate manually verified.
4. Update the runbook for any operational behaviour you change.

Don't skip phases. Don't merge past a failing phase gate. The plan is sequenced for a reason.

## License

Internal use only. See `LICENSE` if present.

## Owners

- Service owner: <fill in>
- Escalation: <fill in>
- Slack: `#graphify-index`
````

**Notes for Claude Code when generating this file:**
- Replace `<fill in>` placeholders with whatever the user provides; if not provided, leave them as `TBD` and flag in the PR description.
- Create the referenced `docs/PLAN.md`, `docs/ARCHITECTURE.md`, `docs/USAGE.md`, `docs/SECURITY.md` as stubs in Phase 0. Real content fills in across phases.
- Don't add badges (CI status, coverage) until the CI is actually wired and producing them in Phase 0's test step. Empty/broken badges look worse than no badges.
