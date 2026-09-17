# 🛡️ MCPShield

> **Production Security Gateway, Policy Engine, Vulnerability Scanner, and Observability Platform for Model Context Protocol (MCP) Infrastructure.**

[![MCP Spec: 2026-07-28](https://img.shields.io/badge/MCP_Spec-2026--07--28-blue.svg)](https://modelcontextprotocol.io)
[![Python: 3.11+](https://img.shields.io/badge/python-3.11+-brightgreen.svg)](https://www.python.org/)
[![Node: 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@rashmi2206/mcpshield.svg)](https://www.npmjs.com/package/@rashmi2206/mcpshield)
[![Live Demo](https://img.shields.io/badge/Live_Demo-mcpshield.onrender.com-brightgreen.svg)](https://mcpshield.onrender.com/)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/musi22/mcpshield)

<p align="center">
  <img src="docs/mcpshield_console_overview.png" alt="MCPShield Security Management Console" width="850">
  <br>
  <a href="docs/mcpshield_demo.webm">🎥 <b>Watch Live Platform Demo Video (WebM)</b></a>
</p>

---

## 📌 Table of Contents
1. [Overview](#1-overview)
2. [⚡ 3-Minute Quickstart (Start Here!)](#2--3-minute-quickstart)
3. [📖 Step-by-Step Hands-on Tutorial](#3--step-by-step-hands-on-tutorial)
   - [Step 1: Access the Dashboard](#step-1-access-the-dashboard)
   - [Step 2: Start the Mock MCP Server](#step-2-start-the-mock-mcp-server)
   - [Step 3: Run Your First Security Scan](#step-3-run-your-first-security-scan)
   - [Step 4: Connect Claude Desktop or Cursor](#step-4-connect-claude-desktop-or-cursor)
   - [Step 5: Test a Human-in-the-Loop Approval](#step-5-test-a-human-in-the-loop-approval)
4. [💻 CLI Reference](#4--cli-reference)
5. [⚙️ Configuration & Environment](#5-configuration--environment)
6. [🧪 Running Tests](#6-running-tests)
7. [❓ Troubleshooting & FAQ](#7-troubleshooting--faq)

---

## 1. Overview

Autonomous AI agents (in **Claude Desktop**, **Cursor**, **LangChain**, etc.) use MCP to interact with sensitive corporate services (Stripe, GitHub, SQL databases, filesystems, and AWS). Without an intermediary security boundary, agents are vulnerable to **prompt injection**, **destructive actions** (like dropping database tables), **data exfiltration**, and **accidental transactions**.

**MCPShield** sits as a reverse proxy between your AI agents and MCP servers:

```
AI Agent (Claude Desktop / Cursor / LangChain)
       │
       ▼ POST http://127.0.0.1:8000/mcp/{workspace}/{server}
┌─────────────────────────────────────────────────────────────┐
│                    MCPShield Gateway                        │
│  ├── [1] Scoped Identity & Auth Verification                │
│  ├── [2] SSRF Guard (Blocks 127.0.0.1, 169.254.169.254)     │
│  ├── [3] Rate Limiter & Token Budget Enforcer               │
│  ├── [4] Deterministic Policy Engine (YAML/JSON Rules)      │
│  ├── [5] Zero-Latency DLP & Secret Redaction (API keys, PII)│
│  ├── [6] Prompt Injection & Tool Redirection Guard          │
│  └── [7] Human-in-the-Loop Interceptor (if risk > threshold)│
└─────────────────────────────────────────────────────────────┘
       │
       ▼ Authorized & Inspected Request
Upstream MCP Server (Stripe, Filesystem, Database, Custom)
       │
       ▼ Tamper-Evident SHA-256 Chained Audit Record
Verified Protocol Response to AI Agent
```

---

## 2. ⚡ 3-Minute Quickstart

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** installed

### Step 1: Install Dependencies
```bash
# Install Python dependencies
pip install -r requirements.txt

# (Optional) Install Web Frontend dependencies for development
cd apps/web && npm install && cd ../..
```

### Step 2: Launch MCPShield
Choose whichever method you prefer:

**Option A — Windows One-Click Launcher (PowerShell):**
```powershell
.\run.ps1
```

**Option B — Windows Batch File:**
```bat
run.bat
```

**Option C — Standard Terminal Command (macOS / Linux / Windows):**
```bash
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
```

### Step 3: Open the Platform
Open your browser and navigate to:
- 🚀 **Live Cloud Web Console:** [https://mcpshield.onrender.com/](https://mcpshield.onrender.com/) *(Hosted 24/7 on Render)*
- 🌐 **Local Web Console:** [http://127.0.0.1:8000](http://127.0.0.1:8000) *(or [http://localhost:3050](http://localhost:3050) for Vite)*
- 📚 **Swagger API Docs:** [https://mcpshield.onrender.com/docs](https://mcpshield.onrender.com/docs) *(or [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs))*

### 🔑 Default Login Credentials
The system automatically seeds an enterprise demo tenant on first run:
- **Email:** `admin@acme.ai`
- **Password:** `admin12345!`

---

## 3. 📖 Step-by-Step Hands-on Tutorial

### Step 1: Access the Dashboard
1. Go to [http://127.0.0.1:8000](http://127.0.0.1:8000).
2. Log in using `admin@acme.ai` / `admin12345!`.
3. You will see:
   - **Security Score & Telemetry:** Total protected calls, blocked invocations, and latency overhead (<20ms).
   - **Servers & Tools Catalog:** Registered MCP servers (Stripe, Filesystem, Postgres DB).
   - **Policy Editor:** Active deterministic rules.
   - **Pending Approvals Queue:** Requests flagged for human review.
   - **Immutable Audit Trail:** SHA-256 cryptographically chained event log.

<p align="center">
  <img src="docs/mcpshield_dashboard.png" alt="MCPShield Interactive Dashboard" width="850">
</p>

---

### Step 2: Start the Mock MCP Server
MCPShield includes a built-in mock server simulating real Stripe, Database, and Filesystem tools:

Open a new terminal window and run:
```bash
python apps/mock_server/server.py
```
*The mock server will start on `http://127.0.0.1:8001`.*

---

### Step 3: Run Your First Security Scan
Scan the mock MCP server to identify vulnerabilities:

```bash
# Run a passive scan against the endpoint
node cli/bin/mcpshield.js scan http://127.0.0.1:8001/
```

**Example Output:**
```text
  [PASS] Authentication required: Bearer / Agent token enforced
  [WARN] Excessive tool permissions detected: 'filesystem.write_file'
  [INFO] Sensitive financial tool discovered: 'stripe.refund'
  Overall Risk Score: 32/100 (LOW RISK)
```

To export results for GitHub Advanced Security or CI/CD pipelines:
```bash
# Output SARIF 2.1.0 format
node cli/bin/mcpshield.js scan http://127.0.0.1:8001/ --sarif

# Fail CI pipeline if high or critical risks are discovered
node cli/bin/mcpshield.js scan http://127.0.0.1:8001/ --fail-on high
```

---

### Step 4: Connect Claude Desktop or Cursor

To secure an AI agent, configure its client to route MCP traffic through **MCPShield's Gateway URL**:

#### **Claude Desktop Configuration**
Edit your `claude_desktop_config.json` (located at `%APPDATA%\Claude\claude_desktop_config.json` on Windows or `~/Library/Application Support/Claude/` on macOS):

```json
{
  "mcpServers": {
    "mcpshield-gateway": {
      "url": "http://127.0.0.1:8000/mcp/prod/stripe",
      "transport": "http_post",
      "headers": {
        "x-mcp-agent-id": "FinanceAgent",
        "Authorization": "Bearer ak_live_finance_agent_key_123",
        "MCP-Protocol-Version": "2026-07-28"
      }
    }
  }
}
```

#### **Cursor IDE Configuration**
In Cursor Settings ➔ **MCP Servers**, add:
- **Name:** `mcpshield`
- **Type:** `command` or `http`
- **URL:** `http://127.0.0.1:8000/mcp/prod/database`

---

### Step 5: Test a Human-in-the-Loop Approval

MCPShield prevents agents from executing dangerous operations autonomously:

1. Send a high-value transaction through the gateway:
   ```bash
   python -c "
   import requests
   payload = {
       'jsonrpc': '2.0',
       'id': 'test-1',
       'method': 'tools/call',
       'params': {
           'name': 'stripe.refund',
           'arguments': {'customer_id': 'cus_123', 'amount': 1200}
       }
   }
   res = requests.post('http://127.0.0.1:8000/mcp/prod/stripe', json=payload, headers={'x-mcp-agent-id': 'FinanceAgent'})
   print(res.json())
   "
   ```
2. **What happens:**
   - Because `amount > $500`, the deterministic policy intercepts the call.
   - The gateway returns an `APPROVAL_REQUIRED` status with a ticket ID.
3. **Approve the Action:**
   - Open the **Web Console** at [http://127.0.0.1:8000](http://127.0.0.1:8000).
   - Go to **Pending Approvals**.
   - Click **Approve**.
   - The operation executes and is recorded in the **Immutable Audit Trail**.

<p align="center">
  <img src="docs/mcpshield_live_simulator.png" alt="MCPShield Live Simulator & Approvals" width="850">
</p>

---

## 4. 💻 CLI Reference

The CLI can be run instantly via `npx` (zero install) or locally:

```bash
# Instant zero-install
npx @rashmi2206/mcpshield scan <url>

# Global install
npm install -g @rashmi2206/mcpshield
mcpshield scan <url>
```

| Command | Purpose |
| :--- | :--- |
| `npx @rashmi2206/mcpshield scan <url>` | Passively inspect any remote MCP server endpoint for vulnerabilities. |
| `npx @rashmi2206/mcpshield scan <url> --sarif` | Generate a SARIF 2.1.0 security report for GitHub Advanced Security. |
| `npx @rashmi2206/mcpshield scan <url> --fail-on high` | Exit with error code 1 in CI/CD if high-severity issues exist. |
| `npx @rashmi2206/mcpshield gateway status` | Check health, total calls, blocked requests, and latency. |
| `npx @rashmi2206/mcpshield audit tail` | Stream the 10 most recent SHA-256 hashed audit events. |
| `npx @rashmi2206/mcpshield servers list` | List all registered MCP server endpoints and risk scores. |
| `npx @rashmi2206/mcpshield tools list` | View discovered tools, schemas, and risk tiers. |
| `npx @rashmi2206/mcpshield agents list` | Inspect autonomous agent credentials and assigned teams. |

---

## 5. ⚙️ Configuration & Environment

Configuration is controlled via environment variables or a `.env` file in the workspace root:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite+aiosqlite:///./mcpshield.db` | Storage connection (SQLite or Cloud PostgreSQL). |
| `JWT_SECRET` | `mcpshield-enterprise-super-secret-key-2026` | Key used for signing session JWT tokens. |
| `ENV` | `development` | Environment mode (`development` or `production`). |
| `PORT` | `8000` | Backend port. |
| `CLERK_PUBLISHABLE_KEY` | *(Optional)* | Optional Clerk Auth integration. |

---

## 6. 🧪 Running Tests

Run the full suite of automated unit, integration, and security tests:

```bash
pytest -v
```

**Test Suite Coverage:**
- `tests/unit/test_policy_engine.py`: Policy precedence and argument comparison filters.
- `tests/unit/test_scanner.py`: Vulnerability detection and SARIF generation.
- `tests/unit/test_dlp.py`: API key, credential, and PII redaction engine.
- `tests/security/test_security.py`: SSRF loopback blocking and prompt injection isolation.
- `tests/integration/test_gateway.py`: Full end-to-end gateway proxy validation.

---

## 7. ❓ Troubleshooting & FAQ

#### **Q: I see `Port 8000 already in use` error.**
Another instance of the backend is already running. In PowerShell:
```powershell
Get-Process python | Stop-Process
```
Then start the server again using `.\run.ps1`.

#### **Q: How do I reset the database to a clean state?**
Simply delete the local SQLite database file:
```powershell
Remove-Item mcpshield.db
```
When you restart the server, it will automatically recreate the database and re-seed the default tenant (`admin@acme.ai`).

#### **Q: What MCP specification revision is supported?**
MCPShield is built to adhere to the **MCP Specification (2026-07-28)**, supporting stateless JSON-RPC over HTTP POST with header-based protocol verification (`MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name`).
