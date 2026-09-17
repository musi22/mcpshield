# MCPShield production readiness audit

Reviewed 13 September 2026. Scope: the supplied local project, its browser build, backend, gateway, policy engine, scanner, CLI, SDKs, deployment files, and public claims.

**Release decision: NO-GO for customer production use.** MCPShield is a working prototype with a coherent security-console design and useful policy/scanning components. It is not yet a dependable security boundary. Authentication, tenant isolation, policy enforcement, response confidentiality, audit durability, and deployment need correction before real customer data or upstream tools are connected.

This review produced guidelines and reproducible evidence. It did **not** fix application code, deploy the service, change the existing `mcpshield.db`, or execute tools against real external systems. Tests used fresh disposable databases and mocked upstreams. The frontend build output was regenerated; an isolated Python environment was created in `.audit-runtime`.

Companion documents: [Reusable production checklist](PRODUCTION_CHECKLIST.md) and [Content and policy guidelines](CONTENT_AND_POLICY_GUIDELINES.md).

## 1. What actually works

| Check | Result | What this establishes |
|---|---|---|
| `npm.cmd run build` | PASS | TypeScript compilation and Vite production bundling succeed. Existing frontend dependencies used. Output JavaScript: 215.81 kB, 61.23 kB gzip. This is not a latency or field-performance measurement. |
| Existing tests, fresh empty SQLite database | FAIL: 8 passed, 5 failed | Integration/security tests assume tables and seeded fixtures already exist; the test fixture does not initialize them. |
| Same existing tests, explicitly initialized and seeded disposable database | PASS: 13 passed | Current assertions pass on demo fixtures; this is not proof of tenant isolation or complete gateway security. |
| Allowed $400 refund through gateway to supplied mock server | HTTP 200 with result | Basic policy-allowed forwarding works with the reference mock. No actual payment occurs. |
| $2,900 mock refund | HTTP 202; approval can execute | Approval creation and simple execution work. Execution also succeeds without authentication, which is a blocker. |
| Forbidden filesystem operation, normal request | HTTP 403 | A seeded deny rule works when request metadata is consistent. |
| Existing DLP/scanner/policy tests | PASS with seeded suite | Some pattern detections and policy cases work. Coverage misses the bypasses below. |
| Production build opened in browser with API unavailable | Renders; FAIL for truthful state | Still shows score 85/100, Gateway Active, and Approval Queue Clear. |
| Mobile approval screen, 390 px viewport | FAIL for usable layout | Fixed sidebar squeezes content; heading measured about 101 px wide. Visual inspection showed severely compressed content. Full device/accessibility testing remains outstanding. |
| API `GET /health` | HTTP 404 | The deployment guide's health probe does not exist on the API. |
| CLI threshold with one synthetic critical finding | Text exits 1; JSON/SARIF exit 0 | Machine-readable formats bypass the advertised CI security gate. |
| Dependency vulnerability audit | NOT VERIFIED | `npm audit` failed certificate verification, including outside the sandbox. TLS verification remained enabled. No clean dependency-security result is claimed. Python CVE audit was not run. |

Evidence: [clean test output](audit/tests-clean.txt), [seeded output](audit/tests-seeded.txt), [backend probes](audit/backend-probes.json), [CLI probes](audit/cli-probes.json), [browser/build notes](audit/verification-notes.md), [installed Python versions](audit/python-environment.txt).

## 2. Launch blockers and how to fix them

Priority meanings: **P0** = prevents any real-customer launch; **P1** = required before a production pilot/release; **P2** = product/discoverability improvement, unless required by the chosen market. “Reproduced” means observed in isolated execution. “Code-confirmed” means the executable path was inspected, without claiming a live exploitation test.

| ID / priority | Finding and evidence | Required change | Acceptance test / proposed owner |
|---|---|---|---|
| S01 / P0 | **Authentication bypass**, reproduced: missing and invalid bearer tokens return the demo administrator. Policy listing is public; many administrative mutations have no auth dependency. `apps/api/main.py:93–121`, `:589–643`, `:1071`. | Remove demo fallbacks; require authentication by default; enforce roles for every action. Keep demo mode isolated and explicitly enabled. | Missing, malformed, expired, revoked, and wrong-audience credentials receive 401/403 with no mutation; each role tested. Backend/security. |
| S02 / P0 | **Tenant isolation absent**, code-confirmed: lists query all tenants; updates select solely by ID; creation uses the first workspace/organization. Approval execution chooses a server by slug alone. `main.py:623`, `:684`, `:711`. | Resolve organization/workspace from verified membership or scoped key; authorize every object and action; tenant-scope queries and server lookup. | Two real test tenants, including duplicate slugs: A cannot read/update/delete/approve/export B's objects, even with known IDs. Backend/security. |
| S03 / P0 | **Policy bypass through conflicting header**, reproduced: forbidden `tools/call` body with `mcp-method: tools/list` reaches mocked upstream and returns 200. `apps/api/gateway_service.py:281`, `:330`, `:452`. | Validate a canonical JSON-RPC request, reject conflicting headers/body, and authorize the same operation that is forwarded. | All conflicting method/tool/version combinations fail before upstream dispatch; normal allowed/denied calls retain behavior. Gateway/security. |
| S04 / P0 | **Agent impersonation and unenforced kill switch/budgets**, code-confirmed: identity comes from arbitrary headers; dispatch does not validate agent credentials, active status, scope, or daily budget. Fixed limit 120 uses an in-process cache. `gateway_service.py:99`, `:280–288`. | Resolve immutable authenticated agent identity; enforce active status, scopes, budget, configured limits and atomic distributed counters before execution. | Fake identity, revoked key, killed agent, exceeded budget and multi-worker bursts cannot execute; limits cannot be evaded by changing headers. Gateway. |
| S05 / P0 | **Inbound secret leakage**, reproduced: an upstream fake API-key sentinel survives unchanged because BLOCK yields `None`, then gateway falls back to raw response. `packages/scanner_rules/dlp.py:104–112`, `:144–147`; `gateway_service.py:460–461`. PEM matching also removes only the header. | Handle BLOCK/REDACT/ALLOW explicitly; never use raw fallback after inspection failure; redact complete secrets and sanitize logs/results on all paths. | Every detected secret class tested inbound/outbound, nested and mixed with PII; secret sentinel absent from client response, stored result and logs. Gateway/security. |
| S06 / P0 | **Approval execution bypasses shared safeguards**, reproduced unauthenticated mock execution; code-confirmed direct HTTP call bypasses normal SSRF/DLP/status/budget pipeline. Check-then-execute is not atomic. `main.py:677–748`. | Enforce reviewer role and tenant; bind approval to operation/arguments; atomically claim it; execute through one pipeline with idempotency and reconciliation. | Wrong reviewer, expired/replayed approval, changed payload, changed policy, concurrent clicks and failure after upstream success tested. Concurrent duplicate execution was not reproduced in this audit. Backend/gateway. |
| S07 / P1 | **Weak/default credentials**, code-confirmed: known fallback JWT secret, unconditional demo seeding, known admin password, single unsalted SHA-256 password hash. `main.py:52`, `:71–77`; `apps/api/database.py:48–67`. | Fail production startup without configured secrets; remove automatic demo seeding; use an adaptive password hash; add rotation/revocation and secure bootstrap. | Clean production instance contains no demo identity/key; missing secrets prevent startup; password migration verified. Rotate defaults if ever exposed. Backend/platform. |
| S08 / P1 | **Incomplete SSRF boundary**, code-confirmed: localhost allowed explicitly in dispatch/scanning; DNS is checked once then resolved again by HTTP client; refresh and approval paths omit the guard. `gateway_service.py:72–94`, `:269`; `main.py:407`, `:708`. | One outbound transport with authorized destinations; validate/pin all resolved addresses and every redirect; enforce egress network rules. Private customer integrations require explicit scoped allowlists. | Loopback, metadata, private/IPv6 addresses, alternate encodings, DNS changes and redirects tested locally with controlled resolvers. DNS rebinding not live-tested here. Platform/security. |
| S09 / P0 | **Accepted policy conditions silently discarded**, reproduced: explicit `conditions: amount <= 500` parses into zero conditions and allows 9,000. Other modeled subject fields are ignored; arguments can override trusted context fields. `packages/policy_engine/__init__.py:114–132`, `:172–175`, `:208–225`. | Strict versioned schema; implement or reject fields; separate trusted context from arguments; exact identity matching; validate defaults; reject invalid active policies instead of skipping them. | Boundary, missing/type-invalid values, unknown fields, precedence and context-spoofing cases; conditional allow never becomes unconditional. Policy/security. |
| S10 / P1 | **Audit records lost and integrity overstated**, reproduced deny count remains 1 before/after block. Block paths flush without commit. Hash omits payload/identity and uses an unstored timestamp; approval path restarts chain; no verifier/automatic SIEM alert found. `gateway_service.py:214–230`, `:298–316`, `:367–390`; `main.py:741`. | Durable audit write for every outcome; canonical persisted envelope; ordered sequencing; verifier; external append-only/integrity controls appropriate to threat model. | Denial survives session close/restart; payload edits/deletion/reordering detected; concurrent event chains valid; failures alert. Backend/security. |
| S11 / P1 | **Malformed JSON-RPC becomes server error**, reproduced array body and null params return 500. `gateway_service.py:241`, `:282–284`. | Validate envelope/params/tool input, required fields, supported methods/versions, sizes and content types; return safe protocol errors. | Valid JSON with invalid structure returns controlled 4xx/protocol error, never 500; fuzz/case matrix included. Gateway. |

Authentication alone will not repair S02–S11. Fix the shared execution architecture and independently verify each control. Security criteria should use versioned requirements from [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), including per-object/action checks from [OWASP API1](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/) and appropriate [password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## 3. Product, deployment and growth gaps

| ID / priority | Current gap | Required result / owner |
|---|---|---|
| D01 / P1 | Web container serves static files, while UI calls same-origin `/api` and `/mcp`; only Vite dev server defines a proxy. `infra/docker/Dockerfile.web:20`, `apps/web/src/api.ts:15`, `apps/web/vite.config.ts:9`. | Production reverse proxy/API origin configured and verified on the built artifact, including auth, CORS, TLS, errors and deep links. Platform. |
| D02 / P1 | Documented API `/health` is absent; README says web port 3000 but Vite uses 3050; seeded upstream is container-local `127.0.0.1:8001` while mock runs in a separate container. | Correct startup guide, real liveness/readiness, service DNS/configuration and fresh-deploy smoke test. Platform. |
| D03 / P1 | Compose embeds secrets, exposes DB/Redis ports and mounts source; Dockerfiles install unpinned packages; no migration/restore proof supplied. `.env` guidance does not override literal Compose secrets automatically. | Managed secret injection, internal-only data services, immutable builds, dependency locking, migration process, tested backup/restore, rollback and resource limits. Platform. |
| Q01 / P1 | Tests require a pre-existing seeded DB; nominal security tests do not test two authenticated tenants. | Isolated repeatable CI fixtures; P0 negative tests; staged integration tests against supported real MCP clients/servers. QA/backend. |
| U01 / P1 | API errors silently become empty data; hardcoded Active/Healthy; score zero becomes fallback 85; approval failure looks clear. Browser-reproduced. `App.tsx:123–150`, `:280`, `:466`, `:704`, `:950`. | Distinct loading/empty/error/stale/healthy states with timestamps; preserve score zero; show errors and recovery. Frontend. |
| U02 / P1 | Settings display hardcoded deny/fail-closed without loading saved values. `App.tsx:1647`, `:1662`. | Show effective persisted configuration after reload, with explicit save and failures. Frontend/backend. |
| U03 / P1 | “Simulator” sends real requests to `prod`, including refund/delete examples. `App.tsx:190–203`. | True dry-run or isolated demo target; clearly identified live execution only when deliberately selected. Product/gateway. |
| U04 / P1 | Canceling API-key prompt still creates wildcard key; rows always show ACTIVE. `App.tsx:1509`, `:1540`; `api.ts:104`. | Cancel has no effect; scope/expiry selection, safe one-time reveal, revoke/rotate, truthful key state. Frontend/backend. |
| U05 / P2 | Registration/edit/remove flows for servers and agents, policy editing, team invitations/roles, and full billing lifecycle missing or incomplete. | Define one supported customer journey and finish its full lifecycle with permissions, persistence, errors and audit evidence. Label or remove unfinished features. Product. |
| U06 / P2 | Fixed sidebar/mobile squeeze; unlabeled icon controls and div-based dialogs lack focus semantics. | Responsive navigation/tables, labeled controls, keyboard/focus/error handling; test against WCAG 2.2 AA. Frontend/design. |
| C01 / P1 | CLI JSON/SARIF returns before threshold check; login only prints success; YAML validation checks substrings; HTTP requests lack timeout. `cli/bin/mcpshield.js:129–168`, `:236`, `:295`. | Output-independent exit codes, real login/schema validation/status checks, timeout and failure behavior. SDK/CLI. |
| C02 / P1 | Non-HTTP scan targets scan stored tool inventory rather than the supplied file/repository. `main.py:785–789`. SDK folders lack distribution metadata. | Implement actual safe ingestion or reject unsupported target types; install SDKs in clean external projects. SDK/scanner. |
| M01 / P2 | Marketing page is only a React state toggle; root starts on console; no crawlable marketing routes/history. | Public landing/docs/pricing/use-case URLs with meaningful rendered HTML, internal links and private authenticated console. Product/web. |
| M02 / P2 | Title/lang/viewport and inline SVG favicon exist. Description, canonical, social metadata, sitemap, robots file and public policy pages absent. | Add relevant metadata and stable crawlable favicon; sitemap/Search Console; correct indexing exclusions; useful original content. Growth/web. |
| M03 / P1 | “100% mitigation,” “zero bypasses,” immutable logs, microsecond overhead and active integrations lack evidence. | Replace unsupported copy using the companion guidelines; publish benchmarks/integration status only when measured. Product/security. |

The desktop interface has a consistent visual hierarchy and recognizable navigation. Its main product weakness is that it presents a broad enterprise feature set before completing the workflows and state integrity behind those features. A smaller, fully reliable gateway + policy + approval + audit journey should precede adding more dashboard sections.

## 4. Protocol and SEO conclusions

The claimed **MCP 2026-07-28** revision is real in the official documentation. That does not establish implementation compliance. Build a compatibility matrix for transports, request metadata, discovery, capability negotiation, authentication, streaming, errors, cancellations and approvals, then test actual supported clients. The local mock implements `server/discover` and an `initialize` alias; testing only that mock cannot establish interoperability. See the [official revision changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) and [security guidance](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices).

SEO requires a useful public website with crawlable URLs, accurate content and accessible resources. Adding meta tags to the private console will not accomplish that. Google does not guarantee indexing or rankings. No public domain or Search Console access was provided, so live index status, DNS/TLS, actual response headers, backlinks, search demand and field Core Web Vitals remain unverified. Follow [Google's SEO guidance](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) and [favicon requirements](https://developers.google.com/search/docs/appearance/favicon-in-search).

## 5. Ordered remediation plan

1. **Establish a real security boundary.** Implement authentication, tenant/action authorization and canonical request validation. Remove demo privileges and secure secrets/passwords. Owner: backend/security.
2. **Unify execution safeguards.** Gateway and approvals share policy/status/budget/SSRF/DLP/audit handling. Repair policy parsing and audit persistence, then add replay/concurrency/failure tests. Owner: gateway/security.
3. **Make deployment reproducible.** Fix production routing, health/readiness, container upstream addresses, configuration, migrations, CI fixtures and dependency audit access. Prove clean deploy, restore and rollback. Owner: platform/QA.
4. **Complete the supported customer journey.** Auth → tenant/workspace → register upstream → issue scoped key → apply policy → safe call → blocked/approved call → reliable audit. Resolve misleading UI/CLI behavior. Owner: product/frontend/QA.
5. **Prepare public launch.** Honest feature matrix, public routes, SEO, accessible responsive UI, measured performance, support contacts and applicable privacy/contract content. Owner: product/growth/legal as applicable.

Do not invent dates from this audit; estimate after choosing the first production deployment model and supported customer scope. Require a named owner, acceptance evidence and reviewer for each finding. All findings remain open until a fix and verification are recorded.

## 6. Limits and reproducibility

Not performed: external penetration test, live customer integration, two-tenant exploit demonstration, concurrency/load/chaos test, full WCAG assessment, actual Docker/Kubernetes deployment, restore drill, public SEO crawl or legal compliance assessment. Docker was not available in the inspected command environment. Dependency advisory checks are unresolved because of the registry certificate error.

Reproduce from the repository root using a Python environment with `requirements.txt` installed:

```text
python docs/audit/verify_backend.py clean
python docs/audit/verify_backend.py seeded
python docs/audit/verify_backend.py probes
node docs/audit/verify_cli.cjs
```

The clean test command intentionally exits nonzero on the current defect. The probe programs report observed behavior; their successful process exit means the probe ran, not that the product is secure. CLI checks execute the actual CLI code with a synthetic transport. Backend checks use ASGI and mocked responses, with unique temporary SQLite files removed after each run.

Python packages were resolved from the project's unpinned requirements into a local environment; future resolution may differ. Record a lockfile before depending on repeatability. External checklist references were verified on the review date using primary sources; Firecrawl was unavailable due to insufficient account credits, so web retrieval was used.
