# Twitter / X Launch Thread

### Tweet 1 (The Hook):
AI agents with Model Context Protocol (MCP) are getting access to sensitive databases, Stripe, GitHub, and cloud filesystems.

What happens when an agent gets prompt-injected or executes a destructive command? 🚨

Introducing **MCPShield**: The open-source security gateway & scanner for MCP. 🛡️🧵👇
[Attach image: docs/mcpshield_console_overview.png]

---

### Tweet 2 (The Problem):
Without an intermediary boundary:
- Autonomous agents can drop tables (`DROP TABLE users;`)
- Issue unapproved $1,000+ refunds
- Exfiltrate AWS & OpenAI API keys through tool arguments

You need deterministic guardrails, not just "system prompt" wishes.

---

### Tweet 3 (The Solution):
MCPShield acts as a reverse proxy between your AI client (Claude Desktop, Cursor, LangChain) and upstream MCP servers:
⚡ Sub-20ms policy engine
🛑 Human-in-the-loop approvals for high-risk actions
🔒 Automatic DLP secret redaction
🛡️ SSRF protection (blocks 169.254.169.254)
[Attach image: docs/mcpshield_dashboard.png]

---

### Tweet 4 (The CLI Scanner):
Want to audit your MCP servers for security vulnerabilities right now?

Just run:
`node cli/bin/mcpshield.js scan <mcp_server_url>`

It discovers 25+ vulnerability classes and outputs SARIF 2.1.0 reports for GitHub Security & CI/CD gates!

---

### Tweet 5 (Call to Action):
100% open-source under Apache 2.0.

⭐ Star the repo on GitHub: https://github.com/musi22/mcpshield
🚀 Quickstart guide in the README

Feedback, PRs, and threat model ideas are welcome! 💬
