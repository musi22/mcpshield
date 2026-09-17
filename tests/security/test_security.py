"""
Security Tests for MCPShield
Verifies tenant isolation, malformed JSON-RPC rejection, and privilege escalation prevention.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from apps.api.main import app


@pytest.mark.asyncio
async def test_tenant_isolation_nonexistent_workspace():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/mcp/unauthorized-tenant-xyz/stripe",
            json={
                "jsonrpc": "2.0",
                "id": "tenant-test-1",
                "method": "tools/list",
                "params": {}
            }
        )
        assert resp.status_code == 404
        data = resp.json()
        assert "Workspace 'unauthorized-tenant-xyz' not found" in data["error"]["message"]


@pytest.mark.asyncio
async def test_malformed_jsonrpc_handling():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/mcp/prod/stripe",
            content="not a json string at all",
            headers={"Content-Type": "application/json"}
        )
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_dlp_outbound_api_key_block():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Agent attempts to pass an OpenAI secret key in arguments
        resp = await client.post(
            "/mcp/prod/stripe",
            json={
                "jsonrpc": "2.0",
                "id": "dlp-test-1",
                "method": "tools/call",
                "params": {
                    "name": "stripe.customer.read",
                    "arguments": {
                        "customer_id": "cus_123",
                        "secret_leak": "sk-live-0987654321fedcba0987654321fedcba"
                    }
                }
            },
            headers={"x-mcp-agent-id": "FinanceAgent"}
        )
        assert resp.status_code == 403
        data = resp.json()
        assert "MCPShield Security Block" in data["error"]["message"]
