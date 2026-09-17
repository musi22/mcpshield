# Production review checklist and reusable audit prompt

Prepared 13 September 2026. Apply this to a specific release, environment, audience, and business model. It is a reusable review baseline, not a claim that every item is missing from MCPShield. Record evidence before assigning a result. Proposed thresholds below require product and engineering agreement; they are not promises already achieved.

## 1. Establish whether it functions

- [ ] Record repository revision, runtime versions, configuration, deployment URL, supported browsers, and test-account permissions. Separate local, staging, and production evidence.
- [ ] Follow the documented installation from a clean environment. Build the actual production artifact, start its dependencies, and test its routing. A development server working does not prove the shipped container works.
- [ ] Execute the customer's critical journey: discover product, sign in, configure it, perform the primary action, verify the result in persistent storage, reload, and repeat as another permitted role.
- [ ] Test disconnected backend, invalid input, unavailable upstream, timeout, expired session, duplicate submission, and recovery. Confirm rollback or compensation after partial failure.
- [ ] Exercise relevant CLI/SDK commands from an external consumer project. Validate exit codes, output formats, installation instructions, deadlines, and compatibility.

**Proposed gate:** all agreed critical journeys pass in the release environment; no silent failure, unintended duplicate side effect, or false success indication. Save commands, exit codes, requests, screenshots, and sanitized logs.

## 2. Product completeness and truthful behavior

- [ ] Define target users, the problem solved, success measures, and supported boundaries. Test onboarding with an empty account and provide useful examples, documentation, and support contact.
- [ ] Finish applicable create/read/update/delete, search, pagination, export, configuration, and permission flows. Every visible control performs its stated action or clearly explains unavailability.
- [ ] Distinguish loading, empty, unavailable, stale, and failed states. Display saved settings and actual connection/health state. Preserve valid zero values; make retries understandable.
- [ ] Cancellation makes no mutation. Destructive actions identify the target and consequences. Simulation uses an isolated sandbox or genuinely avoids side effects.
- [ ] Label demo fixtures. Verify marketing, integrations, performance, security, customer logos, certifications, and pricing against evidence. Replace unsupported absolute claims with precise supported behavior.

For each copy issue record: current wording, evidence gap, replacement wording, implementation needed, and verification. A rewritten claim does not repair a defective control.

## 3. Public pages, search, and sharing

- [ ] Give public landing, product, documentation, and relevant pricing pages descriptive URLs and crawlable links. Prefer static rendering or server rendering for important public content; verify what a crawler receives instead of assuming JavaScript prevents indexing.
- [ ] Provide unique descriptive titles and summaries, appropriate headings, useful original content, canonical URLs, redirect handling, and genuine 404 responses.
- [ ] Configure robots.txt deliberately; submit a sitemap containing public canonical URLs and inspect representative pages in Search Console. These assist discovery and diagnosis, not guaranteed ranking. Google does not use the meta keywords tag. [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [ ] Keep private dashboards authenticated. Use appropriate noindex directives for pages that must stay out of search, and remember a crawler must access a page to see its noindex. Robots exclusions are not access control. [Google indexing controls](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [ ] Check favicon presence separately from search suitability. MCPShield already has an inline SVG favicon in `apps/web/index.html`; a stable crawlable favicon asset is a separate gap. Publish a square, representative asset at a stable URL and test homepage/icon access. [Google favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search)
- [ ] Set and preview Open Graph and Twitter/X card metadata with accessible image URLs. Add structured data only for supported types and truthful visible content; validate eligibility without promising rich results. [Google structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

## 4. Accessibility, mobile, and performance

- [ ] Set WCAG 2.2 AA as the proposed accessibility target. Test keyboard navigation, visible/unobscured focus, semantic controls, accessible names, form errors, and screen-reader announcements.
- [ ] Dialogs receive focus, keep navigation inside while open, close appropriately, and restore focus. Label inputs; provide meaningful alternative text and accessible status messages.
- [ ] Verify reflow at 320 CSS pixels, 200% text enlargement, and zoom. Allow exceptions for inherently two-dimensional content such as data tables without losing surrounding controls. Check text contrast: normally 4.5:1, or 3:1 for large text. Automated checks supplement manual testing. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [ ] Measure real-user Core Web Vitals by mobile and desktop: **LCP <= 2.5 seconds, INP <= 200 milliseconds, CLS <= 0.1**, at the 75th percentile. Treat lab results as diagnostic evidence, not proof of field performance. [web.dev Web Vitals](https://web.dev/articles/vitals)
- [ ] Inspect payload size, images, caching, font loading, layout shifts, unnecessary polling, and slow-network behavior. Record device, network, sample size, and measurement window.

## 5. Backend and security boundaries

Select applicable requirements and a verification level from [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/); record the version used.

- [ ] Authenticate protected requests; test missing, expired, revoked, and forged credentials. Verify session lifecycle, secure credential storage, and appropriate administrative MFA.
- [ ] Enforce tenant isolation and role/object permissions on the server, including exports, background jobs, and alternate endpoints. Test cross-tenant identifiers and privilege escalation.
- [ ] Remove default secrets; use managed configuration, scoped credentials, rotation, and revocation. Prevent secrets and sensitive payloads entering logs or client bundles.
- [ ] Validate input schemas and limits. Check injection, unsafe rendering, file/path handling, CSRF where applicable, and restrictive CORS.
- [ ] Test SSRF defenses, redirects, DNS resolution/rebinding, cloud metadata, and intended internal exceptions using controlled test endpoints.
- [ ] Enforce request/time/body/concurrency/cost limits. Verify replay protection, atomic approvals, idempotency, upstream error handling, and explicitly documented failure behavior.

**Proposed gate:** no demonstrated unauthorized access or unresolved critical/high exploitable issue in the release scope. A clean scanner report alone is insufficient.

## 6. Data, privacy, and customer commitments

- [ ] Inventory collected data, purposes, recipients, subprocessors, storage locations, retention, and deletion behavior, including logs and backups.
- [ ] Verify encryption, access restrictions, export/deletion requests, retention jobs, and notification/contact procedures against implementation.
- [ ] Publish accurate privacy, terms, acceptable-use, support, and security-reporting information. Assess cookie consent, processor agreements, jurisdiction, and age restrictions for the actual audience with qualified review where needed.
- [ ] Map every promise to an owner and evidence. Never infer compliance, certification, breach deadlines, or contractual guarantees from this checklist.

## 7. Testing, delivery, and operations

- [ ] CI runs meaningful unit, integration, authorization, migration, and critical browser tests plus build/type checks. Security regression tests reproduce the original failure.
- [ ] Pin reproducible dependencies; review lockfiles, vulnerabilities, licenses, container contents, and build permissions. Track updates and software inventory.
- [ ] Separate environments; verify HTTPS, DNS, secrets, API routing, database migrations, health/readiness checks, and resource limits in the shipped deployment.
- [ ] Collect useful metrics, sanitized logs, and traces. Test alert delivery, incident ownership, runbooks, and external dependency failure.
- [ ] Agree service-level objectives, load assumptions, recovery time and acceptable data loss before launch. Restore a backup and rehearse rollback; record observed times rather than inventing targets.
- [ ] If payments apply, verify checkout, signed/replayed webhooks, entitlement reconciliation, refunds, renewal/cancellation, invoices, taxes, and failed-payment behavior in test mode.

## 8. Release decision and evidence record

Use **Pass** (verified), **Fail** (contradicted), **Partial** (some scope verified), **NotTested** (no sufficient execution/evidence), or **NA** (reason documented). Severity and result are separate.

| Priority | Meaning | Release treatment |
| --- | --- | --- |
| P0 | Immediate severe exposure, destructive behavior, or release-wide outage | Stop affected release; contain |
| P1 | Important security or core customer journey fails | Fix before intended production launch |
| P2 | Material completeness, usability, or maintainability gap | Assign owner/date; assess launch impact |

```text
Check ID / requirement:
Release / environment / date / reviewer:
Status / priority / affected scope:
Evidence: command, response, screenshot, or file:line
Observed behavior / expected behavior / user impact:
Recommended change / configuration or architecture:
Owner / target date / dependency:
Verification / residual risk / release decision:
```

Release ownership belongs to named product, engineering, security, and operations owners. Unknown critical controls remain unknown; an average checklist score cannot cancel a blocker.

## Copyable audit prompt

```text
Act as a product lead, QA engineer, security reviewer, and production engineer.
Audit [PROJECT/PATH/URL] for [AUDIENCE] in [ENVIRONMENT]. Scope: [AUDIT ONLY
OR AUTHORIZED FIXES]. First establish whether it works: inspect instructions,
build the shipped artifact, run appropriate tests, and execute critical user
journeys safely with controlled accounts/data. Preserve existing work.

Apply this checklist to product UX, errors/loading/empty states, accessibility,
mobile/performance, public SEO/social metadata, backend security and tenant
isolation, privacy/content claims, integrations, payments if applicable,
dependency/CI controls, deployment, monitoring, recovery, and rollback.

Do not invent implemented controls or pass checks from code appearance alone.
Distinguish observed execution, static evidence, inference, and NotTested.
For every flaw provide priority, reproducible evidence, user impact, exact
recommended change, owner/dependencies, and a verification procedure. Separate
configuration fixes from architectural work and optional features from launch
requirements. Identify existing features as well as gaps.

Replace unsupported content claims with accurate suggested wording; distinguish
copy corrections from missing implementation. Use current primary sources for
external requirements. Do not promise search ranking or legal compliance.
Stay within authorized scope; do not deploy, change external accounts, expose
secrets, or exercise destructive production actions merely to prove a finding.
Deliver a functioning verdict, prioritized findings, evidence table, scoped
remediation plan, proposed measurable release gates, and explicit limitations.
```
