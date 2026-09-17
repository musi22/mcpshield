# MCPShield

> **Security gateway, policy engine, scanner, and observability platform for Model Context Protocol (MCP) infrastructure.**

Targeting MCP Specification Revision: **2026-07-28**

---

## 1. Overview

AI agents increasingly leverage Model Context Protocol (MCP) servers to interact with sensitive corporate systems (Stripe, GitHub, production databases, cloud infrastructure, and filesystems). Without an intermediary security boundary, autonomous agents are susceptible to prompt injection, destructive commands, over-privileged tool invocation, and data exfiltration.

**MCPShield** acts as a reverse proxy, policy engine, and passive scanner between MCP clients/agents and MCP servers:

```
AI Agent / MCP Client (Claude Desktop, Cursor, LangChain)
  ↓ POST https://gateway.mcpshield.com/mcp/{workspace}/{server}
MCPShield Runtime Gateway
  ├── [1] Authentication & Scoped Identity Resolution
  ├── [2] MCP 2026-07-28 Protocol Validation (stateless JSON-RPC, Mcp-* headers)
  ├── [3] SSRF Guard & DNS Rebinding Protection
  ├── [4] Rate Limiting & Token Bucket Budget Enforcer
  ├── [5] Deterministic Policy Engine Evaluation (YAML/JSON)
  ├── [6] Explainable 0–100 Risk Scoring Engine
  ├── [7] Outbound Arguments & Inbound Payload DLP / Secret Detection
  ├── [8] Prompt-Injection & Tool Redirection Guard
  └── [9] Human-in-the-Loop Approval Interceptor (if threshold exceeded)
  ↓ Authorized Forwarding
Upstream MCP Server (Stripe, Filesystem, Database, Custom)
  ↓ Response Inspection & Redaction
Cryptographic Immutable Audit Chain (SHA-256)
  ↓ Verified Protocol Response
AI Agent / MCP Client
```

---

## 2. Key Features

- **MCP 2026-07-28 Compliant**: Stateless request/response model inspecting `MCP-Protocol-Version`, `Mcp-Method`, and `Mcp-Name` headers.
- **Passive Security Scanner**: Scans endpoints, local configs, or repositories; discovers 25+ vulnerability classes; produces 0-100 risk score and SARIF 2.1.0 output for CI/CD gates.
- **Deterministic Policy Engine**: Granular argument matching (`amount_gt`, `path_contains`, `in_list`) with strict priority weights and enterprise deny-by-default mode.
- **Human-in-the-Loop Approvals**: Generates single-use cryptographic approval tokens for actions exceeding autonomous boundaries (e.g. refunds > $500), supporting web dashboard approval and webhook notifications.
- **Zero-Latency DLP & Secrets Guard**: Scans tool arguments and return values for AWS credentials, GitHub tokens, OpenAI keys, PII (SSN, credit cards, emails, phones) with redaction or blocking.
- **Cryptographic Audit Trail**: Every tool call produces a tamper-evident audit record linked via SHA-256 event chaining.
- **Developer First**: CLI (`mcpshield`), Python SDK (`mcpshield`), TypeScript SDK (`@mcpshield/sdk`), and REST API (`/api/v1`).

---

## 3. Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+ (for Web Console & CLI)
- Docker (optional for containerized deployment)

### 1. Launch Services
```bash
# Terminal 1: Launch Backend API & Gateway (defaults to local SQLite and auto-seeds Acme AI tenant)
python -m uvicorn apps.api.main:app --port 8000 --reload

# Terminal 2: Launch Reference Mock MCP Server (Stripe, Filesystem, Database tools)
python apps/mock_server/server.py

# Terminal 3: Launch Web Console
cd apps/web && npm install && npm run dev
```

Visit the Web Management Console at: `http://localhost:3000`

---

## 4. CLI Usage

Install the standalone CLI:
```bash
npm link ./cli
# or run directly: node cli/bin/mcpshield.js
```

### Scan an MCP Server
```bash
# Scan a remote MCP server endpoint
mcpshield scan http://127.0.0.1:8001/

# Output SARIF 2.1.0 report for GitHub Security
mcpshield scan http://127.0.0.1:8001/ --sarif

# CI Gate: Fail build if high or critical risks are detected
mcpshield scan http://127.0.0.1:8001/ --fail-on high
```

### Inspect Inventory & Stream Audit Logs
```bash
mcpshield servers list
mcpshield tools list
mcpshield agents list
mcpshield audit tail
```

---

## 5. Developer SDKs

### Python SDK
```python
from packages.sdk_python import MCPShield

shield = MCPShield(api_key="ak_live_finance_agent_key_123")

# Check authorization before executing a financial refund
decision = shield.authorize(
    agent="FinanceAgent",
    server="stripe",
    tool="stripe.refund",
    arguments={"amount": 400, "customer_id": "cus_9482"}
)

if decision.allowed:
    print(f"Tool invocation granted! Risk score: {decision.risk_score}/100")
```

### Transparent MCP Gateway Proxy
Agents can seamlessly point their MCP client connection to:
```text
http://localhost:8000/mcp/prod/stripe
```
All headers, methods (`tools/call`, `tools/list`), and payloads are automatically verified, audited, and protected.

---

## 6. Testing

Run the comprehensive unit, integration, and security test suite:
```bash
pytest -v
```

Tests include:
- Policy precedence & argument comparison operators
- Scanner vulnerability detection & SARIF generation
- DLP API key leakage and prompt injection blocking
- SSRF loopback & cloud metadata (169.254.169.254) isolation
- Human approval lifecycle (Pending → Approved → Executed)
