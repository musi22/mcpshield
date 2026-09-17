# MCPShield System Architecture

## 1. Architectural Philosophy

MCPShield is engineered around four core tenets:
1. **Zero Trust for Autonomous Agents**: Agents discover and chain tools dynamically. Every call must be re-authenticated, authorized, and inspected against deterministic policies.
2. **Stateless MCP 2026-07-28 Alignment**: Complies with the modern stateless JSON-RPC over HTTP POST protocol. All routing and inspection leverage `MCP-Protocol-Version`, `Mcp-Method`, and `Mcp-Name` headers.
3. **Deterministic First, AI Second**: Critical security decisions (allowing a database drop, blocking an unapproved $10,000 refund, or detecting a secret key) execute using deterministic AST/regex engines (< 20ms p50 overhead).
4. **Tamper-Evident Observability**: Security-relevant events are chained cryptographically using SHA-256 hashes, preventing malicious users or rogue agents from modifying audit histories.

---

## 2. Component Diagram

```
+-------------------------------------------------------------+
|                     MCP Client / Agent                      |
|          (Claude Desktop, Cursor, Custom Agent SDK)         |
+-------------------------------------------------------------+
                              |
                              | HTTP POST /mcp/{workspace}/{server}
                              v
+-------------------------------------------------------------+
|                      MCPShield Gateway                      |
|                                                             |
|  [Authentication & Tenant Isolation]                        |
|  - Bearer Token / API Key / Agent Identity Header           |
|                                                             |
|  [SSRF Guard]                                               |
|  - Validates destination IP before egress                   |
|  - Blocks 127.0.0.1, 169.254.169.254, RFC1918               |
|                                                             |
|  [Rate & Budget Limiter]                                    |
|  - Sliding window RPM and daily spend tracking              |
|                                                             |
|  [DLP & Prompt Injection Guard]                             |
|  - Outbound argument scanning (Secrets, PII, Overrides)     |
|                                                             |
|  [Deterministic Policy Engine]                              |
|  - Evaluates Subject, Resource, Environment, Arguments      |
|  - Deny Overrides Allow; Priorities 1..100                  |
|                                                             |
|  [Human Approval Interceptor]                               |
|  - Halts execution for review if policy requires approval   |
+-------------------------------------------------------------+
                 |                           |
        [ALLOW / APPROVED]            [DENY / BLOCKED]
                 |                           |
                 v                           v
+-----------------------------+     +-------------------------+
| Upstream Target MCP Server  |     | Immediate JSON-RPC Err  |
| (Stripe, GitHub, DB, FS)    |     | (Code -32003)           |
+-----------------------------+     +-------------------------+
                 |
                 v
+-------------------------------------------------------------+
|                     Inbound Inspection                      |
|  - Redacts sensitive tokens or PII before agent egress      |
+-------------------------------------------------------------+
                 |
                 v
+-------------------------------------------------------------+
|             Cryptographic Audit Trail Engine                |
|  - SHA-256 Hash Chain: prev_hash + event_data -> event_hash |
|  - Asynchronous SIEM / Webhook Dispatcher                   |
+-------------------------------------------------------------+
```

---

## 3. Policy Engine Resolution Logic

Policies define:
- `subject`: `agent`, `user`, `environment`
- `resource`: `server`, `tool`
- `rules`: list of conditions (`amount_gt`, `path_contains`, `in_list`)
- `action`: `allow`, `deny`, `require_approval`, `redact`
- `priority`: 1..100 (lower number takes precedence)

### Decision Tree:
1. Identify all active workspace policies matching Subject and Resource.
2. Filter rules whose conditions match invocation arguments.
3. Sort matching rules by `priority` ascending.
4. If any rule yields `deny`, the decision is immediately `DENY`.
5. If any rule yields `require_approval`, execution halts, an `approval_request` record is generated, and a 202 status code is returned.
6. If the top-priority rule yields `allow`, the request proceeds to target forwarding.
7. If no rules match, the workspace `default_policy_mode` applies (Enterprise Default: `DENY`).
