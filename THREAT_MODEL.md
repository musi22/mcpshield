# MCPShield Threat Model

## 1. System Scope & Assets

Assets protected by MCPShield:
- Corporate credentials (Stripe API keys, AWS credentials, DB connection strings)
- Production state (financial ledgers, customer databases, cloud clusters, host filesystems)
- Agent autonomy boundaries (refund limits, execution scopes)
- Audit log integrity

---

## 2. STRIDE Threat Analysis

| Threat Category | Attack Vector | Mitigation in MCPShield |
| :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates an authorized AI agent or tenant. | Scoped SHA-256 API key hashing, JWT validation, strict workspace isolation. |
| **Tampering** | Rogue actor alters audit trails to hide illicit tool calls. | Immutable cryptographic SHA-256 hash chaining (`prev_hash` validation). |
| **Repudiation** | An approver claims they never approved a dangerous $5,000 refund. | Single-use approval tokens recorded with user identity, timestamp, and signed decision. |
| **Information Disclosure** | Agent inadvertently leaks customer SSN, credit cards, or internal API keys in tool arguments. | Real-time DLP Inspector scanning for 10+ secret/PII categories with automated redaction. |
| **Denial of Service** | Agent enters recursive loop making thousands of tool calls per minute. | Token bucket and sliding-window rate limiting per agent, workspace, and tool. |
| **Elevation of Privilege** | Indirect prompt injection in web content hijacks agent to execute `filesystem.delete`. | Passive scanner flags dangerous tools; Policy Engine mandates human approval or hard blocks. |

---

## 3. Residual Risks & Future Mitigations

- **Emergent Multi-Tool Chaining**: Future versions of MCPShield will track session-wide semantic intent across multiple tool calls to prevent semantic evasion.
