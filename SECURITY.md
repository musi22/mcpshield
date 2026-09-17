# MCPShield Security Policy & OWASP Mitigations

## 1. Security Posture

MCPShield sits in the critical path of AI agent infrastructure. The codebase enforces strict defensive controls:

### OWASP Top 10 Protections
1. **Broken Object Level Authorization (BOLA / IDOR)**: All database queries enforce strict tenant scoping (`workspace_id` and `organization_id`). Client-supplied tenant IDs are cross-validated against authenticated session JWTs or scoped API keys.
2. **SSRF & DNS Rebinding**: User-supplied MCP endpoints undergo socket resolution prior to connection. Loopback (`127.0.0.1`), link-local metadata (`169.254.169.254`), and private RFC1918 subnets are forbidden by default.
3. **Injection (SQL, Command, Path Traversal)**: Database access is strictly parameterized via SQLAlchemy 2.0 ORM. The passive scanner flags raw SQL execution tools (`db.execute_sql`) and filesystem deletion (`filesystem.delete`).
4. **Data Loss Prevention (DLP)**: Outbound tool arguments and inbound results are continuously scanned for private keys, AWS access credentials, GitHub tokens, and PII. Secrets can be either redacted or blocked.
5. **Fail-Closed Default**: In enterprise mode, if an upstream policy evaluation times out or encounters an unexpected exception, the gateway fails closed (`403 Forbidden`).

---

## 2. Cryptographic Audit Log Integrity

Each audit event incorporates:
- The SHA-256 hash of the immediately preceding event (`prev_hash`)
- Canonical event metadata (tenant, agent, timestamp, tool, arguments, risk score)
- The resulting event hash:
  $$\text{event\_hash} = \text{SHA-256}(\text{prev\_hash} \parallel \text{workspace} \parallel \text{event} \parallel \text{timestamp})$$

Any manual alteration or tampering with historical logs invalidates downstream hashes, triggering an automated SIEM alert.

---

## 3. Vulnerability Disclosure

To report security vulnerabilities, contact the MCPShield Security Team at `security@mcpshield.com`. We adhere to responsible 90-day disclosure windows.
