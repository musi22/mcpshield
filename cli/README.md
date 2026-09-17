# mcpshield

> CLI tool for **MCPShield**: Production Security Gateway, Policy Engine, Scanner, and Observability Platform for Model Context Protocol (MCP) infrastructure.

[![npm version](https://img.shields.io/npm/v/mcpshield.svg)](https://www.npmjs.com/package/mcpshield)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache_2.0-blue.svg)](https://github.com/musi22/mcpshield)

---

## ⚡ Instant Usage (No Install Required)

Run the passive vulnerability scanner against any MCP endpoint with `npx`:

```bash
# Scan a remote MCP server endpoint
npx mcpshield scan http://127.0.0.1:8001/

# Output SARIF 2.1.0 for GitHub Security & CI/CD
npx mcpshield scan http://127.0.0.1:8001/ --sarif

# Fail CI pipeline if high or critical risks are detected
npx mcpshield scan http://127.0.0.1:8001/ --fail-on high
```

---

## 📦 Global Installation

```bash
npm install -g mcpshield
```

---

## 🛠️ Commands

| Command | Purpose |
| :--- | :--- |
| `mcpshield gateway status` | Check status, protected requests, and latency. |
| `mcpshield audit tail` | Stream recent cryptographically chained audit events. |
| `mcpshield servers list` | List all registered MCP server endpoints. |
| `mcpshield tools list` | View discovered tools, schemas, and risk tiers. |
| `mcpshield agents list` | Inspect autonomous agent credentials. |
| `mcpshield scan <url>` | Passively inspect any remote MCP server endpoint. |
| `mcpshield scan <url> --sarif` | Generate a SARIF 2.1.0 security report. |
| `mcpshield scan <url> --fail-on high` | Break build on high/critical security issues. |

---

## 🔗 Links

- **Main Repository & Documentation:** [https://github.com/musi22/mcpshield](https://github.com/musi22/mcpshield)
- **Issues & Support:** [https://github.com/musi22/mcpshield/issues](https://github.com/musi22/mcpshield/issues)
- **Specification:** Targeting MCP Revision 2026-07-28
