# Graphify Service – Phased Build Plan

A central code-graph service for the team. Repos are graphed automatically on every merge to `main`/`develop`, results land in a graph database, and Claude Code (and any other consumer) reaches them through a stable REST API. The MCP layer is the **generic API MCP** with a preloaded operations manifest — no purpose-built tools, no per-endpoint Python wrappers.

---

## 1. Architecture Summary

```
Bitbucket ──webhook──▶ Ingestion API ──▶ Job Queue ──▶ Workers
                            │                            │
                            │                            ▼
                            │                       Run Graphify
                            │                            │
                            │                            ▼
                            │                       Graph DB
                            │                            ▲
                            │                            │
                            ▼                            │
                       Postgres (job state) ◀────────────┘
                            
Graph DB ──▶ REST API ──▶ generic API MCP (per dev, stdio) ──▶ Claude Code
                  ▲
                  └────────── status dashboard, CI checks, scripts
```

**Key design choices**
- **AWS service** hosts ingestion, workers, REST API, graph DB, job state DB.
- **Response shaping happens server-side** in the REST API (truncation, `truncated: true` flags, field pruning). This is what keeps Claude's context clean and lets the MCP stay a pure pass-through.
- **Per-developer MCP** is the existing **generic API MCP** (stdio), pointed at a curated operations manifest. No new MCP code needed.
- **Distribution** via shared `.claude/` git repo — devs `git pull` and pick up new operations automatically.

---

## 2. Technology Choices (always pin latest stable as of build date)

| Layer | Choice | Notes |
|---|---|---|
| Language | Python 3.12+ | Pin exact patch in `pyproject.toml`. |
| Web framework | FastAPI (latest) | Pydantic v2 for request/response validation — eliminates a whole class of injection risk. |
| ASGI server | Uvicorn behind Gunicorn (latest) | Production-grade. |
| Job queue | Postgres + `SELECT FOR UPDATE SKIP LOCKED` | One less moving part than Redis/Celery. Switch to Redis + RQ only if throughput demands it. |
| Job state DB | PostgreSQL 16+ | Holds `parse_runs`, `repos`, audit log. |
| Graph DB | **Neo4j 5.x Community** (or Kùzu if embedded preferred) | Cypher is well-understood; Neo4j has good ops tooling. |
| Container | Docker, Python `slim-bookworm` base | Small attack surface. |
| Secret management | AWS Secrets Manager | Never in env files committed to git. |
| Dependency management | `uv` (latest) or Poetry | Lockfile committed; reproducible builds. |
| Static analysis | `ruff`, `mypy --strict`, `bandit` | All three in CI; build fails on warnings. |
| Dependency scanning | `pip-audit` + GitHub/Bitbucket native scanning | Run on every PR and nightly. |
| Test framework | `pytest` + `pytest-asyncio` | Coverage gate at 80%+. |

**Version policy:** every phase begins with `uv pip compile` (or equivalent) against latest stable. Don't carry old pins forward without a reason. Renovate/Dependabot configured to auto-PR minor/patch bumps weekly.

---

## 3. Cross-Cutting Security Requirements

These apply to every phase. Don't defer them — adding them later is much more painful.

**SQL / Cypher injection**
- All Postgres queries use parameterised queries via SQLAlchemy 2.x (or `psycopg` with `%s` params). Never f-string SQL.
- All Cypher queries use Neo4j driver parameter binding (`$repo`, `$symbol`). Never concatenate user input into Cypher.
- Validate every user-supplied identifier (repo name, symbol, branch) against a strict regex *before* it reaches the query layer. Reject anything outside `[A-Za-z0-9_./:-]`.

**Input validation**
- Every API endpoint has a Pydantic request model with explicit field constraints (`min_length`, `max_length`, regex pattern).
- Path parameters validated by FastAPI dependency functions before the handler runs.

**Authentication & authorization**
- Webhook endpoint verifies Bitbucket HMAC signature using `hmac.compare_digest`. Reject any request without a valid signature.
- REST API requires bearer token (service token for MCP, per-user tokens for humans). Tokens stored hashed (Argon2id) in Postgres, never in plaintext.
- Read-only Neo4j user for the REST API. Write user only used by workers. Never share credentials.

**Secrets**
- All secrets pulled from AWS Secrets Manager at startup. No `.env` files in production images.
- Secrets rotated quarterly; rotation tested in staging.

**Output safety**
- Every response runs through Pydantic response models. No raw dict returns — prevents accidental field leakage.
- Error responses never include stack traces or internal paths in production. Use generic codes; log details server-side with a correlation ID returned to the caller.

**Network**
- REST API behind internal load balancer only. No public internet exposure.
- Webhook ingestion endpoint is the only externally reachable surface — and it's IP-allowlisted to Bitbucket Cloud / your Bitbucket DC egress range.
- TLS 1.3 only. HSTS enabled.

**Operational**
- Structured JSON logs with correlation IDs. Sensitive fields (tokens, secrets) redacted at the logger level.
- Audit log table: every REST call logged with `{user, endpoint, args_hash, duration_ms, status, correlation_id}`.
- Rate limiting per token: e.g. 60 req/min default, configurable per token.
- Container runs as non-root user, read-only root filesystem, no `--privileged`.

---

## 4. Phased Plan

Each phase has a **goal**, **deliverables**, **test gate** (you stop and test before moving on), and **security checklist**. Don't skip the test gate — that's the whole point of phasing.

---

### Phase 0 — Prerequisites & Local Dev Environment

**Goal:** every team member who'll touch this can build and run it locally with one command.

**Deliverables**
- Repo skeleton with `pyproject.toml`, lockfile, `.editorconfig`, pre-commit config (`ruff`, `mypy`, `bandit`).
- `docker-compose.yml` for local: Postgres + Neo4j + the service.
- `Makefile` (or `justfile`) with `make up`, `make test`, `make lint`, `make security`.
- CI pipeline running lint + type-check + tests + `pip-audit` on every PR.
- README with one-command bootstrap.

**Test gate**
- Fresh laptop clone → `make up` → curl `/health` returns 200.
- `make security` reports clean.

**Security checklist**
- Pre-commit blocks commits containing obvious secrets (use `detect-secrets` or `gitleaks`).
- CI fails on any high/critical CVE in dependencies.

---

### Phase 1 — Prove Graphify End-to-End on One Repo (Manual)

**Goal:** validate the entire pipeline manually before automating anything. If this doesn't work, nothing else matters.

**Deliverables**
- A script `scripts/manual_parse.py` that takes a repo URL + commit, shallow-clones, runs Graphify, prints summary stats (node count, edge count, languages detected).
- Decide and document the **graph schema**:
  - Nodes: `File`, `Function`, `Class`, `Module`
  - Common properties: `repo`, `branch`, `commit_sha`, `path`, `name`, `signature`, `docstring`, `language`
  - Edges: `CALLS`, `IMPORTS`, `DEFINED_IN`, `EXTENDS`
- A second script `scripts/load_to_neo4j.py` that takes the Graphify JSON and inserts it.
- A handful of Cypher queries you can run by hand:
  - `find_callers` for a known symbol
  - `find_dependencies` 2 levels deep
  - `find_symbol` by fuzzy name

**Test gate**
- Pick one real repo. Run end-to-end. Compare results against grep + manual reading. Results match for at least 5 hand-picked queries.
- Re-run the same commit → graph is identical (idempotency check).

**Security checklist**
- Clone happens in an isolated tmp dir with restricted perms (`0700`).
- Tmp dir cleaned up even on failure (use `try/finally` or `tempfile.TemporaryDirectory`).
- Cypher queries use parameter binding even in these scripts — set the habit early.

---

### Phase 2 — Worker That Parses One Repo on Demand

**Goal:** wrap Phase 1 logic in a proper worker process backed by a job queue.

**Deliverables**
- Postgres schema:
  ```
  repos          (id, slug, clone_url, default_branch, active, created_at)
  parse_runs     (id, repo_id, branch, commit_sha, status, started_at,
                  finished_at, error, node_count, edge_count, graphify_version)
  audit_log      (id, ts, user, endpoint, args_hash, status, correlation_id)
  ```
- All schema migrations via Alembic (latest). Migrations reviewed in PR.
- A `worker.py` that:
  1. Pulls the next pending job using `SELECT … FOR UPDATE SKIP LOCKED`.
  2. Shallow-clones into a per-job tmp dir.
  3. Runs Graphify, captures JSON.
  4. Opens a Neo4j transaction. Deletes existing nodes/edges where `repo=X AND branch=Y`. Inserts new ones tagged with `commit_sha`.
  5. Records result in `parse_runs`.
  6. Cleans up tmp dir.
- Idempotent: re-running the same commit produces the same final graph state.
- A CLI: `python -m graphify_service.worker.run --repo X --branch Y --commit Z`.

**Test gate**
- Manually enqueue a job for 3 different repos. All complete. `parse_runs` shows accurate counts. Cypher queries return correct results for each.
- Kill the worker mid-parse → next worker picks up the job cleanly (no duplicate inserts).
- Re-parse same commit twice → graph state identical.

**Security checklist**
- Worker uses a Neo4j user with **only** write access to the graph DB, no admin.
- Clone URL validated against an allowlist of trusted Bitbucket hosts.
- Repo path/branch/commit validated via regex before being inserted into any query.
- Resource limits: worker process has memory + wall-clock limits per job (kill at 30 min / 4 GB).

---

### Phase 3 — Webhook Receiver & Job Enqueueing

**Goal:** Bitbucket merges trigger graph updates automatically.

**Deliverables**
- `POST /webhook/bitbucket` endpoint:
  - Verifies HMAC signature.
  - Parses event, extracts `{repo, branch, commit}`.
  - Filters: only `main` and `develop` enqueue jobs.
  - Debounces: if a job for `{repo, branch}` is already pending or started <10 min ago, skip.
  - Returns 202 immediately; processing is async.
- `POST /reparse` endpoint (auth required, admin token): manual re-trigger for a repo+branch.
- `GET /status/repos` endpoint: list of repos with last successful parse per branch and any recent failures.
- A simple HTML status page rendered from `/status/repos` for at-a-glance ops view.
- Bitbucket webhook configured for one pilot repo.

**Test gate**
- Push a commit to the pilot repo's `develop` → within ~1 min, a new `parse_runs` row appears and completes.
- Push 5 commits in 30 seconds → exactly one parse runs (debouncing works).
- Send a webhook with a bad signature → 401 + audit log entry.
- Send a webhook for a feature branch → no job enqueued.

**Security checklist**
- HMAC verified using `hmac.compare_digest` (not `==`).
- IP allowlist on the webhook endpoint at the load-balancer layer.
- Webhook payload size capped (e.g. 1 MB) to prevent oversize-body DoS.
- Every webhook receipt logged with full correlation ID, even rejected ones.

---

### Phase 4 — Read-Side REST API

**Goal:** stable, well-shaped HTTP surface that the generic API MCP will sit on top of.

**Deliverables — endpoints**
All responses are JSON, all support `?limit=N` (default sensible per endpoint, hard cap), all return `truncated: true` when results exceeded the cap.

```
GET  /repos                                  — list active repos
GET  /repos/{repo}/status                    — branches, last parse, freshness
GET  /symbols/find?repo=&pattern=&kind=      — fuzzy lookup, capped at 100
GET  /symbols/{repo}/{symbol}/callers?depth= — direct + transitive callers
GET  /symbols/{repo}/{symbol}/dependencies?depth=
GET  /files/{repo}/{path:path}/neighborhood  — symbols + imports/exports
GET  /symbols/cross-repo-callers?symbol=     — cross-repo edges
POST /graph/branch                           — { repo, branch } on-demand parse, cached 24h
```

**Response shaping rules (server-side, this is where they live)**
- Hard cap per endpoint: `callers`/`dependencies` capped at 200 nodes; `find` at 100.
- Always include `truncated: bool` and `total_available: int` so the caller can decide whether to narrow.
- Drop fields Claude doesn't need: internal Neo4j IDs, raw timestamps unless requested.
- Include short hint strings in truncated responses: `"hint": "847 results, returned top 200 by relevance — narrow with depth=1 or a more specific repo"`.

**Other deliverables**
- OpenAPI 3.1 spec auto-generated by FastAPI, served at `/openapi.json`.
- Per-token rate limiting (slowapi or equivalent).
- Audit log entry for every request.

**Test gate**
- Postman/curl through every endpoint against real data — responses are <50 KB on hot symbols.
- Truncation flag fires correctly when limits hit.
- Pen-test pass with bad inputs: SQL/Cypher injection attempts, oversized payloads, malformed UTF-8 — all rejected with 4xx, none reach the DB.

**Security checklist**
- Every handler has a Pydantic request model + Pydantic response model.
- Path params validated by regex before they reach the query layer.
- All Cypher uses parameter binding. Confirmed by grep: zero string-interpolated Cypher anywhere.
- Read-only Neo4j credentials for this service.
- 4xx errors generic, 5xx errors return a correlation ID only.
- ZAP or Burp baseline scan run against staging deployment.

---

### Phase 5 — Operations Manifest & Generic API MCP Wiring

**Goal:** make the REST API usable from Claude Code via the existing generic API MCP, with no new MCP code.

**Deliverables**
- A curated operations manifest (`graphify_operations.json`) shipped with the team's `.claude/` repo. Each entry:
  ```json
  {
    "id": "find_callers",
    "method": "GET",
    "path": "/symbols/{repo}/{symbol}/callers",
    "when_to_use": "Investigating change impact, tracing how a function is used, or before refactoring a symbol. Returns direct + transitive callers up to N levels.",
    "params": {
      "repo":   { "in": "path",  "type": "string", "required": true,  "pattern": "^[A-Za-z0-9_-]+$" },
      "symbol": { "in": "path",  "type": "string", "required": true },
      "depth":  { "in": "query", "type": "integer", "default": 2, "min": 1, "max": 5 }
    },
    "response_shape": "{ callers: [...], truncated: bool, total_available: int, hint?: string }",
    "example": "find_callers repo=payments-api symbol=submitOrder depth=2"
  }
  ```
- One entry per REST endpoint from Phase 4. Curated `when_to_use` text — this is the single biggest determinant of how well Claude picks operations, write it carefully.
- Top-of-manifest preamble: `"These are the available code-graph operations. Do not attempt to discover others. Use the operation that matches the question."`
- Generic API MCP configured in `.claude/mcp.json` with the manifest path and the service base URL:
  ```json
  {
    "mcpServers": {
      "graphify": {
        "command": "python",
        "args": ["-m", "generic_api_mcp"],
        "env": {
          "API_BASE_URL":   "https://graphify.internal/api",
          "API_MANIFEST":   "${CLAUDE_DIR}/manifests/graphify_operations.json",
          "API_AUTH_TOKEN": "${GRAPHIFY_TOKEN}"
        }
      }
    }
  }
  ```
- Onboarding doc for devs: how to set `GRAPHIFY_TOKEN`, what to do if a call fails.

**Test gate**
- 5 trusted devs install the config and run a representative analyst session each.
- Measure: average turns to confident answer drops vs grep-and-read baseline.
- Sample 20 sessions; confirm no operation misuse (Claude picking the wrong tool) — if misuse appears, the fix is in the `when_to_use` text, not new code.

**Security checklist**
- `GRAPHIFY_TOKEN` per-developer (or per-team service token with `X-User` header for attribution — pick one and document).
- Token stored in OS keychain or env var, never committed.
- Generic API MCP rejects any operation not present in the manifest — confirm with a test that a hand-crafted `execute_rest` call to an unlisted endpoint fails closed.
- Manifest is read-only at runtime; no live fetching from a Swagger URL.

---

### Phase 6 — Operational Hardening Before Wide Rollout

**Goal:** survive 100 devs hitting it daily without you babysitting it.

**Deliverables**
- Structured JSON logging shipped to your central log store (CloudWatch / Splunk / wherever your org standardises).
- Metrics endpoint (`/metrics`, Prometheus format): request counts, latencies, error rates per endpoint, queue depth, parse durations, graph-write rates.
- Dashboard with: queue depth, parse success/failure rate, REST p50/p95/p99 latency, top endpoints, top repos.
- Alerts:
  - Queue depth > 50 for >10 min
  - Parse failure rate > 10% over 1h
  - REST p95 > 2s over 15 min
  - Any 5xx burst
- **Cron fallback worker** running nightly: re-parses any active repo whose last successful parse on `main` or `develop` is >24h old. Catches missed webhooks silently.
- **Graphify version bump procedure**: documented runbook for re-parsing all repos after a Graphify upgrade. Test it.
- **Backup**: nightly Neo4j dump + Postgres dump to S3 with versioning + lifecycle policy. Test a restore.
- Runbook for common incidents: webhook outage, Neo4j down, runaway parse.

**Test gate**
- Chaos test: kill the worker pod mid-parse, kill Neo4j for 5 min, send 100 webhooks in 10 seconds. Service recovers without manual intervention; no data corruption.
- Restore from backup into a staging instance. Queries return correct results.

**Security checklist**
- Logs scrubbed of secrets at the logger level (allowlist of fields, not denylist).
- S3 bucket for backups: SSE-KMS encrypted, versioned, public access blocked, lifecycle policy enabled.
- IAM roles follow least privilege — workers can't read Postgres credentials they don't need; REST API can't write to Neo4j.
- Pen-test scope expanded: full ZAP active scan against staging.

---

### Phase 7 — Team Rollout

**Goal:** all 100 devs using it, with feedback loop in place.

**Deliverables**
- Shared `.claude/` repo updated with manifest + MCP config.
- Internal launch comms: 1-page doc + 15-min demo recording.
- Office hours: 30 min twice a week for the first two weeks, then on-demand.
- Feedback form (lightweight — Slack channel + Google Form).
- Weekly review of audit logs:
  - Most-used operations → keep them sharp, possibly add server-side composition
  - Failed operations → fix manifest text or REST behaviour
  - Long-tail operations → consider deprecating

**Test gate**
- Week 1: pilot 10 devs. Collect feedback. Fix obvious gaps.
- Week 2: 30 devs. Watch the metrics.
- Week 3: full rollout if metrics stable.

**Security checklist**
- All 100 dev tokens issued, hashed-and-stored in Postgres, recorded in an internal token registry with owner.
- Token revocation procedure documented and tested.
- Quarterly access review: any token unused for 90+ days is auto-revoked.

---

## 5. Future Enhancements (post-launch, not in initial plan)

- **Semantic node enrichment**: add `last_commit_sha`, `last_commit_msg`, `last_jira_ticket`, `code_owners` to symbol nodes. Big quality bump for analyst sessions.
- **Cross-repo edge linker**: heuristics to connect calls across repos (matching service names, OpenAPI specs, etc.). Genuinely valuable but non-trivial.
- **`/investigate` composed endpoint**: server-side composition — graph + Cortex + recent Jira tickets fused into one response. Lives in REST, exposed via one manifest entry.
- **PR-diff graph**: given a PR, return the graph delta (added/removed/changed nodes + edges). Useful for review automation.
- **Feature-branch on-demand graphs with TTL**: already in Phase 4, but not heavily used until there's demand.

---

## 6. Quick Phase Summary

| Phase | Focus | Approx. duration | Test gate |
|---|---|---|---|
| 0 | Bootstrap + CI + dev env | 2-3 days | One-command local up |
| 1 | Manual end-to-end | 2 days | Hand queries match reality |
| 2 | Worker + job state | 4-5 days | Idempotent, recoverable |
| 3 | Webhook + debounce | 3 days | Real merge → fresh graph in <10 min |
| 4 | REST API + shaping | 4-5 days | All endpoints, pen-test clean |
| 5 | Manifest + generic MCP | 2-3 days | 5 devs running real sessions |
| 6 | Ops hardening | 4-5 days | Chaos test passed, restore tested |
| 7 | Rollout | 2-3 weeks calendar | Full team active |

Total build effort: ~4 weeks of focused engineering time before rollout, plus 2-3 weeks calendar for staged rollout. Realistic full-team-active milestone: 6-7 weeks.

---

## 7. Things to Decide Up Front

These are decisions worth nailing in Phase 0 so they don't bite you in Phase 4:

1. **Single-tenant vs multi-tenant**: are all 100 devs reading the same graph DB? (Probably yes. Confirm.)
2. **Auth model**: shared service token + `X-User` header vs per-dev tokens? (Recommend service token + header for simplicity at this scale.)
3. **Repo allowlist**: which repos get graphed automatically? Probably an `active` flag in the `repos` table, set explicitly. Don't graph everything in Bitbucket — costs and noise.
4. **Graphify version pinning**: which exact version is "blessed"? How do upgrades roll out? Document the procedure before the first upgrade.
5. **PII scrubbing**: do any of your repos contain real customer data in test fixtures? If yes, ensure Graphify output doesn't surface it in symbol names or docstrings. Audit on a sample before going wide.
