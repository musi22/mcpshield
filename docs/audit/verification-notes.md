# Supplemental verification notes — 2026-09-13

## Frontend build

`npm.cmd run build` in `apps/web` completed with TypeScript and Vite 5.4.21. First attempt was blocked by sandbox path access; approved rerun succeeded. Output: 1,471 modules transformed; HTML 1.16 kB (gzip 0.67), CSS 26.89 kB (gzip 5.48), JS 215.81 kB (gzip 61.23).

## Browser outage check

Served only `apps/web/dist` using a loopback static HTTP server on port 3050, with no API proxy/server, and opened it through the browser tool. Initial UI showed `Acme AI / prod`, `Security Score: 85 /100`, `Gateway Status Active`, and an empty Executive Overview. Clicking Approvals showed `Approval Queue Clear — No tool invocations are currently pending human approval.` These are false healthy/empty states in a deliberately unavailable-API scenario. No live application data or state was changed.

At 390×844 viewport, the approval screen remained constrained by a fixed sidebar. DOM measurements: viewport 390, document client width 385, document scroll width 394, heading width about 101.44 px. Screenshot inspection showed compressed content. This was a single responsive smoke test, not a complete accessibility or browser matrix.

## Dependency audit

`npm.cmd audit --json` failed: `unable to verify the first certificate`. Retrying outside the sandbox produced the same registry TLS verification error. The saved `npm-audit.json` is an error response, not a vulnerability report. TLS verification was never disabled. No application package versions were upgraded.

## Test isolation

Backend test runs and probes used unique disposable SQLite paths under `.audit-runtime`; the existing `mcpshield.db` was not used. External calls were intercepted by HTTPX MockTransport or routed to the included mock ASGI app. All refund/delete payloads were synthetic and did not execute against real systems. Baseline suite: 13 tests total; clean DB 5 failures/8 passes, seeded DB 13 passes. See raw artifacts alongside this file.
