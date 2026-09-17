# Securing Model Context Protocol: How to Add Guardrails and Approvals to AI Agents

*Suggested tags: #ai #security #python #webdev #opensource*

---

The Model Context Protocol (MCP) is rapidly becoming the open standard for how AI models (like Anthropic’s Claude Desktop, Cursor IDE, and custom autonomous agents) connect to tools. 

Instead of building custom integrations for every API, developers expose MCP servers for GitHub, PostgreSQL, Stripe, and AWS.

However, as we grant autonomous models read/write access to production systems, **a new security frontier emerges**. 

What happens when an agent gets prompt-injected or hallucinates a parameter? What prevents an agent from running `DROP TABLE customers` or issuing an unauthorized $5,000 refund?

In this post, we’ll look at how to secure MCP tool calls with **[MCPShield](https://github.com/musi22/mcpshield)**, an open-source security gateway, policy engine, and vulnerability scanner.

---

## The Risk Surface of MCP

When an agent interacts with an MCP server, three major risks occur:

1. **Prompt Injection & Tool Redirection:** An adversary injects malicious instructions via an email or customer ticket, instructing the model to invoke high-privilege tools.
2. **Unchecked Financial / Destructive Mutations:** High-consequence tools (like database modifications or refund processing) execute without explicit human confirmation.
3. **Sensitive Data Leaks (DLP):** Tool inputs or outputs inadvertently reveal API keys, passwords, or customer PII to the model's context window.

---

## The Architecture: An Intermediary Security Gateway

Instead of having your AI client call upstream MCP servers directly, you route requests through a transparent reverse proxy:

```
Claude Desktop / Cursor
       │
       ▼ POST /mcp/prod/stripe
┌─────────────────────────────────────────────────────────────┐
│                    MCPShield Gateway                        │
│  ├── 1. Authentication & Token Bucket Rate Limiting         │
│  ├── 2. SSRF Protection (Block 127.0.0.1, 169.254.169.254)  │
│  ├── 3. Deterministic Policy Evaluation (<20ms latency)     │
│  ├── 4. Zero-Latency Secret / DLP Redaction                 │
│  └── 5. Human-in-the-Loop Approval Interceptor              │
└─────────────────────────────────────────────────────────────┘
       │
       ▼ Approved Forwarding
Upstream MCP Server (Stripe / Database)
```

---

## 1. Setting Up the Gateway Locally

Clone the open-source repository and launch the backend:

```bash
git clone https://github.com/musi22/mcpshield.git
cd mcpshield
pip install -r requirements.txt
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000` in your browser. The platform auto-seeds a demonstration tenant:
- **Email:** `admin@acme.ai`
- **Password:** `admin12345!`

---

## 2. Defining Deterministic Policy Rules

In MCPShield, you define policy rules in YAML. For instance, to require human approval whenever an agent issues a refund greater than $500:

```yaml
name: stripe-refund-safety
rules:
  - tool: stripe.refund
    condition:
      arguments.amount:
        gt: 500
    action: require_approval
```

When an agent invokes `stripe.refund` with `{"amount": 1200}`, the gateway halts execution and creates a pending ticket. The operator reviews and approves the request from the web console before the tool actually executes.

---

## 3. Auditing MCP Servers for Vulnerabilities

MCPShield includes a standalone CLI to passively scan any MCP server for over 25 vulnerability classes:

```bash
# Scan a remote MCP server endpoint
node cli/bin/mcpshield.js scan http://127.0.0.1:8001/

# Export SARIF for GitHub Security in CI/CD pipelines
node cli/bin/mcpshield.js scan http://127.0.0.1:8001/ --sarif
```

---

## Summary

As autonomous agents transition from experimental chat interfaces into production automation, security cannot be an afterthought. 

By placing an intermediary policy gateway like **MCPShield** between agents and infrastructure, teams can safely adopt MCP while maintaining strict compliance, secret redaction, and human oversight.

- **GitHub Repository:** [https://github.com/musi22/mcpshield](https://github.com/musi22/mcpshield)
- **License:** Apache 2.0
