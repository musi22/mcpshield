"""
Integration tests for MCPShield Gateway, SSRF, and Audit Chaining.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from apps.api.main import app
from apps.api.gateway_service import SSRFGuard, SSRFException


@pytest.mark.asyncio
async def test_ssrf_guard_blocks_cloud_metadata():
    with pytest.raises(SSRFException) as exc_info:
        SSRFGuard.validate_url("http://169.254.169.254/latest/meta-data/", allow_local=False)
    assert "blocked network" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_gateway_blocks_destructive_filesystem_call():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request to filesystem server for destructive delete
        resp = await client.post(
            "/mcp/prod/filesystem",
            json={
                "jsonrpc": "2.0",
                "id": "test-call-1",
                "method": "tools/call",
                "params": {
                    "name": "filesystem.delete",
                    "arguments": {"path": "/etc/secrets", "recursive": True}
                }
            },
            headers={"x-mcp-agent-id": "AnyAgent", "mcp-name": "AnyAgent"}
        )

        # Policy should DENY
        assert resp.status_code == 403
        data = resp.json()
        assert "error" in data
        assert "Access Denied" in data["error"]["message"]


@pytest.mark.asyncio
async def test_gateway_triggers_approval_for_high_refund():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request to refund $2,900
        resp = await client.post(
            "/mcp/prod/stripe",
            json={
                "jsonrpc": "2.0",
                "id": "test-refund-1",
                "method": "tools/call",
                "params": {
                    "name": "stripe.refund",
                    "arguments": {"amount": 2900, "customer_id": "cus_9482"}
                }
            },
            headers={"x-mcp-agent-id": "FinanceAgent", "mcp-name": "FinanceAgent"}
        )

        assert resp.status_code == 202
        data = resp.json()
        assert data["result"]["status"] == "APPROVAL_REQUIRED"
        assert "approval_id" in data["result"]
        appr_id = data["result"]["approval_id"]

        # Verify it shows up in approvals list
        list_resp = await client.get("/api/v1/approvals")
        assert list_resp.status_code == 200
        apprs = list_resp.json()
        matching = [a for a in apprs if a["id"] == appr_id]
        assert len(matching) == 1
        assert matching[0]["arguments"]["amount"] == 2900


@pytest.mark.asyncio
async def test_gateway_allows_small_refund():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # SDK check for $400 refund
        resp = await client.post(
            "/api/v1/gateway/authorize-check",
            json={
                "agent": "FinanceAgent",
                "server": "stripe",
                "tool": "stripe.refund",
                "arguments": {"amount": 400, "customer_id": "cus_123"},
                "workspace": "prod"
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["allowed"] is True
        assert data["action"] == "allow"
