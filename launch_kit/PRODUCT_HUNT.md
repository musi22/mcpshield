# Product Hunt Launch Guide & Copy

---

### **Product Name:**
MCPShield

### **Tagline (Under 60 chars):**
Security gateway, policy engine & scanner for MCP AI agents

### **Pricing:**
Free / Open Source

### **Topics:**
Developer Tools, Artificial Intelligence, Open Source, Cybersecurity, API

### **Website Link:**
https://mcpshield.onrender.com/
(GitHub: https://github.com/musi22/mcpshield)

---

### **Description:**
MCPShield is an open-source security gateway, deterministic policy engine, vulnerability scanner, and observability platform for Model Context Protocol (MCP) infrastructure.

As autonomous AI agents in Claude Desktop, Cursor, and LangChain connect to tools (Stripe, GitHub, Postgres, AWS), MCPShield ensures they can't drop tables, leak credentials, or issue unapproved financial transactions.

**Key Features:**
🛡️ **Deterministic Policy Engine:** Granular argument limits (e.g. refunds > $500 require approval).
🛑 **Human-in-the-Loop Interceptor:** Review and approve sensitive agent tool calls from a web console.
🔒 **Zero-Latency DLP:** Detects and redacts OpenAI, AWS, GitHub tokens and PII.
🔍 **CLI Scanner:** Audits MCP endpoints for 25+ vulnerabilities with SARIF 2.1.0 output for CI/CD gates.
📊 **Tamper-Evident Audit:** Cryptographically chained SHA-256 event log.

---

### **Maker's First Comment (Post immediately upon launch):**
Hey Product Hunt! 👋

I'm Rashmi, maker of **MCPShield**. 

Over the past few months, the Model Context Protocol (MCP) has exploded. But while it's easy to connect an AI agent to your production database, Stripe, or filesystem, what happens when an agent gets prompt-injected or hallucinates a parameter?

We built **MCPShield** to act as the missing security boundary:
- Evaluates policy rules on tool calls in <20ms
- Pauses high-risk operations for human approval
- Redacts secrets and PII automatically
- Scans MCP servers for security vulnerabilities

It's 100% open-source under Apache 2.0. We'd love your feedback, feature requests, and support! 🚀
