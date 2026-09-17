# Hacker News "Show HN" Submission

### URL to Submit:
https://news.ycombinator.com/submit

---

### **Title:**
> Show HN: MCPShield – Open-source security gateway, policy engine & scanner for MCP

### **URL Field:**
https://github.com/musi22/mcpshield

### **Text / First Comment (Post this immediately in the comment section):**

Hey HN,

I built **MCPShield** (https://github.com/musi22/mcpshield) because as I started connecting Claude Desktop, Cursor, and autonomous agents to real backend systems using Model Context Protocol (MCP), I realized there was no safety boundary between the model and sensitive infrastructure.

If you give an AI agent database, Stripe, filesystem, or AWS tools, a single prompt injection or hallucinated instruction could drop production tables or issue unauthorized $10,000 refunds.

MCPShield acts as an intermediary reverse proxy, policy engine, and passive scanner between MCP clients and servers:

1. **Deterministic Policy Rules**: Evaluates fine-grained argument constraints in <20ms (e.g. `amount_gt: 500` or blocking `path_contains: '.ssh'`).
2. **Human-in-the-Loop (HITL) Interceptor**: When an agent attempts an action that exceeds autonomous boundaries, the call is placed in a queue. A human approves it via the web dashboard before execution.
3. **Passive Vulnerability Scanner**: Audits MCP server endpoints against 25+ vulnerability classes and outputs SARIF 2.1.0 reports for CI/CD gates.
4. **DLP & Secret Redaction**: Scans arguments and return payloads to prevent API keys (OpenAI, AWS, GitHub) or PII (SSNs, cards) from leaking to LLMs.
5. **Cryptographic Audit Log**: Every tool invocation generates a tamper-evident SHA-256 chained event record.

**Try it locally:**
```bash
git clone https://github.com/musi22/mcpshield.git
cd mcpshield
python -m uvicorn apps.api.main:app --port 8000
```
Open http://localhost:8000 (default login: admin@acme.ai / admin12345!).

Scan an endpoint right from your terminal:
```bash
node cli/bin/mcpshield.js scan http://127.0.0.1:8001/
```

The repo is open-source (Apache 2.0). I'd love your thoughts, feedback on threat models, and suggestions on what MCP tools or protocols you'd like to see supported next!
