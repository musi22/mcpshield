"""
Reference Mock MCP Server (MCP Specification 2026-07-28 Compliant)
Stateless JSON-RPC 2.0 over HTTP POST.
Exposes Stripe, Filesystem, and Database tools for security testing.
"""

from typing import Any, Dict, List
from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import uuid

app = FastAPI(
    title="Reference Mock MCP Server",
    version="2026-07-28",
    description="Stateless reference MCP Server for testing MCPShield runtime gateway & scanner."
)

SERVER_METADATA = {
    "name": "acme-reference-mcp",
    "version": "1.0.0",
    "protocolVersion": "2026-07-28",
    "capabilities": {
        "tools": {"listChanged": False},
        "resources": {"subscribe": False},
        "prompts": {"listChanged": False}
    }
}

AVAILABLE_TOOLS = [
    {
        "name": "stripe.customer.read",
        "description": "Read customer details, payment methods, and current balance from Stripe.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Stripe customer ID e.g. cus_9482"}
            },
            "required": ["customer_id"]
        }
    },
    {
        "name": "stripe.refund",
        "description": "Issue a payment refund to a customer. Financial mutation tool.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Stripe customer ID"},
                "amount": {"type": "number", "description": "Refund amount in USD"},
                "reason": {"type": "string", "description": "Reason for refund"}
            },
            "required": ["customer_id", "amount"]
        }
    },
    {
        "name": "stripe.payout",
        "description": "Transfer corporate funds directly to external bank account.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "amount": {"type": "number", "description": "Payout amount in USD"},
                "destination": {"type": "string", "description": "Bank account ID"}
            },
            "required": ["amount", "destination"]
        }
    },
    {
        "name": "filesystem.read_file",
        "description": "Read content of a file on the local host filesystem.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute or relative file path"}
            },
            "required": ["path"]
        }
    },
    {
        "name": "filesystem.write_file",
        "description": "Write or overwrite content to a file on the host filesystem.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "File path to write to"},
                "content": {"type": "string", "description": "Text content"}
            },
            "required": ["path", "content"]
        }
    },
    {
        "name": "filesystem.delete",
        "description": "Unrestricted recursive deletion of files or directories from the filesystem.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Path to delete"},
                "recursive": {"type": "boolean", "default": False}
            },
            "required": ["path"]
        }
    },
    {
        "name": "database.execute_sql",
        "description": "Execute raw SQL statements against production customer database.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Raw SQL query"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "database.describe_tables",
        "description": "Inspect PostgreSQL relational schema, column definitions, and primary keys.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "table_name": {"type": "string", "description": "Optional table name filter"}
            }
        }
    },
    {
        "name": "database.query_table",
        "description": "Perform read-only parameterized query on cloud PostgreSQL table with row limit.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "table_name": {"type": "string", "description": "Target table name"},
                "limit": {"type": "integer", "description": "Max rows to return", "default": 20}
            },
            "required": ["table_name"]
        }
    },
    {
        "name": "cloud_storage.upload_artifact",
        "description": "Persist audit archives and vulnerability scans to Cloudflare R2 / S3 object storage.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "Cloud object path / key"},
                "content_type": {"type": "string", "description": "MIME type", "default": "application/json"}
            },
            "required": ["key"]
        }
    },
    {
        "name": "cloud_storage.list_objects",
        "description": "List objects stored in cloud archive bucket.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prefix": {"type": "string", "description": "Path prefix filter", "default": "audits/"}
            }
        }
    },
    {
        "name": "cloud_cache.get_quota",
        "description": "Query Upstash Redis distributed sliding-window rate limit quota for an agent.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent identifier"}
            },
            "required": ["agent_id"]
        }
    }
]

RESOURCES = [
    {
        "uri": "postgres://prod-db/customers",
        "name": "Production Customer Table",
        "description": "Sensitive customer profile dataset containing PII and email addresses.",
        "mimeType": "application/json"
    }
]


@app.get("/health")
async def health():
    return {"status": "healthy", "server": "acme-reference-mcp", "protocol": "2026-07-28"}


@app.post("/")
async def handle_mcp_stateless(
    request: Request,
    mcp_protocol_version: str = Header(default="2026-07-28", alias="MCP-Protocol-Version"),
    mcp_method: str = Header(default=None, alias="Mcp-Method"),
):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON-RPC body")

    method = mcp_method or body.get("method")
    req_id = body.get("id", str(uuid.uuid4()))
    params = body.get("params", {})

    # Method Dispatch
    if method == "server/discover" or method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": SERVER_METADATA
        }

    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": AVAILABLE_TOOLS
            }
        }

    elif method == "resources/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "resources": RESOURCES
            }
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        # Tool execution implementations
        if tool_name == "stripe.customer.read":
            cid = arguments.get("customer_id", "cus_default")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Customer Record: ID={cid}, Name=Sarah Chen, Email=sarah.chen@example.com, Balance=$420.50, ActiveSubscriptions=1"
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "stripe.refund":
            amount = arguments.get("amount", 0)
            cid = arguments.get("customer_id", "unknown")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Successfully processed refund of ${amount:.2f} for customer {cid}. Refund ID: ref_{uuid.uuid4().hex[:12]}"
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "stripe.payout":
            amount = arguments.get("amount", 0)
            dest = arguments.get("destination", "acct_default")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Payout initiated: ${amount:.2f} transferred to {dest}. Transfer ID: po_{uuid.uuid4().hex[:12]}"
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "filesystem.read_file":
            path = arguments.get("path", "")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"File content for {path}:\n[CONFIG]\nENVIRONMENT=production\nDEBUG=false\nAPI_HOST=api.internal.net"
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "filesystem.write_file":
            path = arguments.get("path", "")
            content = arguments.get("content", "")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"File successfully written to {path} ({len(content)} bytes)."
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "filesystem.delete":
            path = arguments.get("path", "")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Path deleted permanently: {path}"
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "database.execute_sql":
            query = arguments.get("query", "")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Executed SQL: '{query}'. Rows affected: 4."
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "database.describe_tables":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": "PostgreSQL Relational Schema: 12 Tables (users, organizations, workspaces, agents, servers, tools, policies, approvals, audit_events, gateway_requests, security_findings, api_keys). ACID Enforced."
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "database.query_table":
            tbl = arguments.get("table_name", "agents")
            limit = arguments.get("limit", 10)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Query result from '{tbl}' (limit={limit}): returned 3 active records. Cryptographic hash verified."
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "cloud_storage.upload_artifact":
            key = arguments.get("key", "audits/archive.json.gz")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Successfully uploaded artifact to Cloudflare R2 / S3 at '{key}' with SHA-256 integrity checksum."
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "cloud_storage.list_objects":
            prefix = arguments.get("prefix", "audits/")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Cloud Storage Objects under '{prefix}': [audits/audit_chain_2026_09.json.gz, reports/sarif_latest.json]"
                        }
                    ],
                    "isError": False
                }
            }

        elif tool_name == "cloud_cache.get_quota":
            aid = arguments.get("agent_id", "FinanceAgent")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Upstash Redis Rate Limit Quota for '{aid}': 48 requests remaining in current 60s window (Limit: 60 RPM)."
                        }
                    ],
                    "isError": False
                }
            }

        else:
            return JSONResponse(
                status_code=404,
                content={
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Method or tool '{tool_name}' not found."
                    }
                }
            )

    return JSONResponse(
        status_code=400,
        content={
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32600,
                "message": f"Unsupported method: {method}"
            }
        }
    )


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
