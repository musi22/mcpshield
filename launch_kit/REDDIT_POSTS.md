# Reddit Launch Posts

---

## 1. r/ClaudeAI & r/LocalLLaMA

**Post Title:**
> Built an open-source security gateway for Claude Desktop & MCP tools (Policy engine + Human-in-the-Loop approvals)

**Body:**
Hey everyone,

With everyone connecting Claude Desktop, Cursor, and local agents to MCP servers (Filesystem, Postgres, Stripe, GitHub, etc.), one major concern is safety. What happens if Claude gets prompt-injected or misinterprets an instruction and executes a destructive command like deleting a directory or issuing an unapproved refund?

I built **MCPShield**, an open-source security gateway and policy engine for MCP infrastructure.

### What it does:
- **Proxy Gateway**: Intercepts MCP JSON-RPC calls between Claude Desktop and upstream MCP servers.
- **Human-in-the-loop approvals**: High-risk tool calls (e.g. `refund > $500` or `rm -rf`) are paused until an operator approves them in a web console.
- **DLP / Secret Masking**: Automatically catches and redacts OpenAI/AWS keys or credit card numbers before they reach the model.
- **Passive Scanner**: Run `node cli/bin/mcpshield.js scan <mcp_url>` to check any MCP endpoint for 25+ vulnerability classes.
- **Tamper-Evident Audit Log**: Every tool execution is cryptographically linked with SHA-256 hashes.

### How to use with Claude Desktop:
Just point your `claude_desktop_config.json` to the gateway:
```json
{
  "mcpServers": {
    "mcpshield-gateway": {
      "url": "http://127.0.0.1:8000/mcp/prod/stripe",
      "transport": "http_post"
    }
  }
}
```

GitHub repo (Apache 2.0): https://github.com/musi22/mcpshield

Would love feedback from anyone experimenting with MCP security or custom agent guardrails!

---

## 2. r/netsec & r/cybersecurity

**Post Title:**
> MCPShield: Open-source reverse proxy, policy engine & SARIF vulnerability scanner for Model Context Protocol (MCP)

**Body:**
As enterprise adoption of Model Context Protocol (MCP) accelerates, autonomous LLM agents are gaining read/write access to internal enterprise assets. However, existing MCP specifications lack centralized access control, secret redaction, and granular auditability.

**MCPShield** (https://github.com/musi22/mcpshield) provides a zero-trust intermediary layer:
- **SSRF Guard**: Validates egress IP destinations, explicitly blocking loopbacks (`127.0.0.1`), RFC1918 internal subnets, and cloud metadata (`169.254.169.254`).
- **Deterministic Policy Engine**: Sub-20ms evaluation of argument limits, allow/deny priority trees, and token budgets.
- **SARIF 2.1.0 CI/CD Scanner**: Passively audits MCP tool schemas, permission scopes, and prompt injection resilience.
- **Cryptographic Audit Chain**: SHA-256 tamper-evident event log.

Full codebase, threat model, and setup instructions: https://github.com/musi22/mcpshield
