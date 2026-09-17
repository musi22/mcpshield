# MCPShield content and policy guidelines

Prepared 13 September 2026. These are proposed local edits and publication criteria, not changes already applied to the website or customer agreements.

Read alongside [the audit](PRODUCTION_AUDIT.md) and [the reusable checklist](PRODUCTION_CHECKLIST.md). The current release should be described as a prototype for evaluation with synthetic data until the launch blockers are fixed.

## 1. Replace unsupported statements with evidence-based copy

Use a claim register: exact statement → location → implementation → verification evidence/date → owner → approved wording. A feature appearing in a database model, screenshot, roadmap or README is not implementation evidence.

| Existing claim or impression | Why it needs changing | Proposed wording for the current project | Evidence required for a stronger claim |
|---|---|---|---|
| “Production security gateway” / enterprise protection implied | Authentication, tenant, policy and DLP blockers are open. | “MCPShield is an experimental gateway and console for evaluating MCP policy, scanning and approval workflows with synthetic data.” | All P0/P1 security gates closed and independently reviewed; supported deployment tested. |
| “All database queries enforce strict tenant scoping” in SECURITY.md | Many routes are unscoped. | “Tenant isolation and role-based authorization are under development and are not ready for customer production use.” | Two-tenant role/action tests for every resource and export route. |
| “SSRF & DNS Rebinding Protection” | Basic hostname/IP screening is incomplete and localhost is allowed. | “Includes initial endpoint screening with development exceptions. Comprehensive outbound access controls are pending.” | Unified validated transport; DNS, redirects, IPv6 and internal-destination test suite. |
| “Zero-Latency DLP” | Inspection cannot be represented as cost-free; no benchmark provided. | “Includes experimental pattern-based inspection for selected secret and sensitive-data formats.” | Fixed inbound enforcement; detection corpus; false positive/negative analysis; measured overhead. |
| “100% threat mitigation” / “zero bypasses” | Reproduced bypasses contradict the statement; no tool guarantees complete threat prevention. | Remove the percentage. Show observed blocked/allowed counts with measurement period, source and limitations. | Verified telemetry and clearly scoped evaluations; never generalize tested coverage to all threats. |
| “Immutable audit trail” / automatic tamper SIEM alert | Blocks may not persist; integrity verification and SIEM automation are absent. | “Audit logging is a prototype. Durable recording, integrity verification and external alerting require additional implementation.” | Durable writes, canonical hashes, concurrency correctness, verifier and external integrity controls. |
| “Single-use cryptographic approvals” | Current approval execution is not atomically consumed through a common safety pipeline. | “Demonstrates approval request and reviewer decision workflows using the reference mock server.” | Authenticated reviewer, exact operation binding, expiry, replay/concurrency protection and idempotency. |
| “Rate limiting and token-bucket budgets” | Current limiter is process-local and ignores configured budgets/agent limits. | “Includes an initial in-memory request limiter. Authenticated distributed quotas and spending enforcement are pending.” | Shared atomic counters, budget accounting, identity verification, multi-worker tests. |
| “MCP 2026-07-28 compliant” | A valid version string and local mock tests do not prove interoperability. | “Targets MCP revision 2026-07-28; supported transports and compatibility testing are being defined.” | Published client/server/version matrix and conformance tests. |
| “Microsecond proxy overhead” | No reproducible benchmark supports it. | “Proxy performance has not yet been characterized under production workloads.” | Hardware/load/payload/concurrency/percentile details, baseline comparison and date. |
| Slack “Connected” / GitHub “Active” | Static UI states do not establish an integration. | “Integration preview — connection not configured.” | Actual config and health checks, verified delivery, retries and visible failures. |
| “Scan endpoints, local configs and repositories” | Non-HTTP targets currently scan stored inventory instead of the selected path. | “Experimental tool-metadata scanning. Local configuration and repository ingestion are not implemented.” | Correct input ingestion and target-specific evidence; unsupported types fail clearly. |
| “Live simulator” | UI sends real gateway requests to `prod`. | For present behavior: “Live gateway request — may execute the selected upstream tool.” | Prefer implementing an actual dry-run and isolated demo; then label each mode accurately. |
| CLI “Authenticated successfully” | Login command only prints a message. | “Interactive CLI login is not implemented.” | Real token acquisition/validation/storage/expiry/revocation workflow. |

Do not claim SOC 2, ISO certification, GDPR/CCPA/DPDP compliance, independent penetration testing, guaranteed availability or encryption properties without applicable evidence. A framework checklist is not certification. The current official [MCP revision](https://modelcontextprotocol.io/specification/2026-07-28/changelog) is a compatibility reference, not proof that this implementation conforms.

## 2. Proposed public page content

**Page title:** `MCPShield — MCP Policy Gateway Prototype`

**Meta description:** `Explore MCP tool policies, mock approval workflows and security scanning in MCPShield, an experimental gateway and console for evaluation with synthetic data.`

**Main heading:** `Explore security controls for MCP tool calls`

**Intro:** “MCPShield brings policy evaluation, tool-metadata scanning, approval workflows and audit views into one development console. This prototype is intended for evaluation using synthetic data and the supplied mock server.”

**Primary action:** `Try the local demo` — link to verified setup instructions.

**Secondary action:** `Read capabilities and limitations` — show what is implemented, experimental, planned and unsupported. Label example metrics explicitly as demo data.

**Status notice:** “Production use is not supported in this version. Security and reliability work is still in progress.”

When the blockers are fixed, rewrite these statements around the tested supported release. Avoid permanent “prototype” wording if it no longer reflects the product.

Create real public URLs for home, documentation, use cases, pricing when relevant, security, support, privacy and terms. Put the authenticated console behind a separate protected route or subdomain. Public navigation must use links with destinations; state-only buttons do not provide shareable landing pages. Add a stable favicon asset, unique description/canonical per public page, accurate Open Graph and social-card metadata, sitemap and an indexing plan. Use only structured data matching visible, real content; never invent ratings, customers or certifications. Follow [Google Search Central](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

## 3. User-facing states are also claims

| Situation | Required wording/behavior |
|---|---|
| API unavailable | “Unable to load gateway status. Last successful check: [time]. Retry.” Do not show Active. |
| No measurement yet | “Not measured” or “Unknown.” Do not invent score 85 or latency 0. |
| Valid score is zero | Render 0. Never replace it with a fallback. Explain score direction and limits. |
| Approval fetch fails | “Could not load approvals.” Do not show Queue Clear. |
| Scan fails after a previous success | Clear or label the old report with its target/time; show new failure. |
| Key disabled/expired | Show persisted status; disable unavailable actions and explain why. |
| Integration not configured | “Not connected” with a working setup action or a clearly marked planned feature. |
| Saving settings | Show pending state, verify saved effective values, and surface failures. |
| Dangerous live operation | Name tenant/environment/tool/arguments, distinguish dry-run from execution, and require deliberate action appropriate to the effect. |

## 4. Security, privacy and commercial content to prepare

Some missing “clauses” are product controls; wording cannot replace them. For website policies or contracts, complete the facts below before drafting final language. The business jurisdiction, legal entity, customer market and actual data practices were not provided, so no legal-compliance conclusion is made here. Have relevant final terms reviewed for the chosen market.

| Document/content | Facts to establish | Publication rule |
|---|---|---|
| Security page | Supported controls, shared responsibilities, verified limitations, security contact, release/support policy. | Describe implemented controls precisely. Keep vulnerability reports separate from marketing claims. |
| Vulnerability disclosure | Verified monitored address, scope, reporting channel, triage owner, response targets, coordinated-disclosure process. | Existing `security@mcpshield.com` and “90-day” wording are not evidence of ownership or an operating process. Confirm before publishing. |
| Privacy notice | Operating entity/contact, account data, tool arguments/results, logs, purposes, applicable basis, recipients/subprocessors, transfers, retention, deletion and rights channel. | Match actual flows and deployment mode; distinguish hosted service from customer-operated installations. Do not promise no collection or perfect redaction. |
| Data-processing terms, if applicable | Parties/roles, instructions, categories, security schedule, subprocessors, assistance, incident handling, return/deletion, transfers. | Reflect the real contract and jurisdiction; fill all placeholders. |
| Cookie/tracking notice, if applicable | Essential storage, analytics/advertising SDKs, third-party requests, preference controls and retention. | Add controls where required by actual use/market; do not add a decorative consent banner without functional choices. External Google Fonts requests should be inventoried. |
| Terms / acceptable use | Entity, service scope, account duties, authorized scanning, suspension, support, IP/licensing, termination, disputes and applicable commercial terms. | Do not imply customers may scan third-party systems without authorization. Avoid invented contractual commitments. |
| Pricing/billing/refunds, if charging | Currency/taxes, limits/overages, renewal, cancellation, refund process, checkout, invoices, payment failure and downgrade behavior. | Current plan-changing endpoint is not a completed payment service. Publish charges only alongside real billing behavior. |
| SLA/support | Measurable availability/latency target, measurement window, exclusions, support hours, escalation, incident updates and remedies if offered. | Do not promise a response/uptime commitment without the staffing and telemetry to deliver it. |
| Retention/deletion/export | Per-data-category retention, backups, restore implications, tenant deletion/export workflow and verification. | Implementation must support the stated retention and deletion process. |
| Licenses and attribution | Code/dependency licenses, fonts/icons/images, ownership and third-party notices. | Review distribution rights before release; no top-level license was supplied in the reviewed file inventory. |

Use this operational security-note draft only after completing the brackets:

> “[Legal entity] maintains security information for MCPShield at [verified security URL]. The supported capabilities and limitations for release [version] are documented at [release documentation]. To report a potential vulnerability, use [verified monitored channel]. Reports are triaged by [owner/process], and updates are provided according to [operationally supported response policy].”

Use this privacy drafting worksheet, not a finished notice:

> “When you use [hosted service/deployment mode], [entity] processes [actual categories] for [actual purposes]. Data is retained for [defined period or criteria] and shared with [actual recipients and purpose]. For [applicable requests], contact [verified channel]. The complete notice explains [applicable rights, transfer arrangements, retention and deletion details].”

Never publish unresolved brackets, unmonitored email addresses, copied third-party policies, or a “we never store secrets” statement that the current result/audit code contradicts.

## 5. Reusable review rule for any project

For each flaw or missing clause, record **current behavior → user/business impact → evidence → proposed technical change → proposed copy change → acceptance test → owner**. Separate present capability from future intent. Remove claims when the underlying feature is unavailable; do not hide missing implementation behind legal wording.
