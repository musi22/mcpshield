"""Reproduce the 2026-09-13 audit using disposable SQLite and mocked upstreams.

Run with the project dependencies installed:
  python docs/audit/verify_backend.py clean
  python docs/audit/verify_backend.py seeded
  python docs/audit/verify_backend.py probes

No existing database, real MCP server, or external service is used.
"""
import asyncio
import json
import os
from pathlib import Path
import sys
import uuid
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
DB_PATH = ROOT / ".audit-runtime" / f"audit-{uuid.uuid4().hex}.sqlite"
DB_PATH.parent.mkdir(exist_ok=True)
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///" + DB_PATH.as_posix()

from apps.api.database import AsyncSessionLocal, engine, init_db, seed_initial_data
from apps.api.main import app
from apps.api.models import AuditEvent
from packages.policy_engine import PolicyEngine, PolicyEvaluationContext
from httpx import AsyncClient, ASGITransport, MockTransport, Response
from sqlalchemy import select, func


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)


async def probes():
    await seed()
    results = {}
    upstream_calls = []
    upstream_payload = {"jsonrpc": "2.0", "id": "audit", "result": {"ok": True}}

    def upstream(request):
        upstream_calls.append(json.loads(request.content))
        return Response(200, json=upstream_payload)

    original_client = AsyncClient

    def mocked_client(*args, **kwargs):
        kwargs["transport"] = MockTransport(upstream)
        return original_client(*args, **kwargs)

    async def count_audit():
        async with AsyncSessionLocal() as db:
            return (await db.execute(select(func.count(AuditEvent.id)))).scalar_one()

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://audit.local") as client:
        for name, headers in [("missing_auth", {}), ("invalid_auth", {"Authorization": "Bearer invalid-audit-token"})]:
            response = await client.get("/api/v1/auth/me", headers=headers)
            data = response.json()
            results[name] = {"status": response.status_code, "demo_admin_returned": data.get("user", {}).get("email") == "admin@acme.ai"}
        results["health_endpoint"] = {"status": (await client.get("/health")).status_code}
        results["public_policy_list"] = {"status": (await client.get("/api/v1/policies")).status_code}
        denied_body = {"jsonrpc": "2.0", "id": "audit", "method": "tools/call", "params": {"name": "filesystem.delete", "arguments": {"path": "/synthetic-audit-target"}}}
        before = await count_audit()
        response = await client.post("/mcp/prod/filesystem", json=denied_body, headers={"x-mcp-agent-id": "AnyAgent"})
        results["normal_deny"] = {"status": response.status_code}
        results["denied_event_persistence"] = {"events_before": before, "events_after": await count_audit()}
        with patch("httpx.AsyncClient", side_effect=mocked_client):
            response = await client.post("/mcp/prod/filesystem", json=denied_body, headers={"x-mcp-agent-id": "AnyAgent", "mcp-method": "tools/list"})
            results["conflicting_method_header"] = {"status": response.status_code, "upstream_body_method": upstream_calls[-1]["method"] if upstream_calls else None, "upstream_tool": upstream_calls[-1]["params"]["name"] if upstream_calls else None}
            # Deliberately fake sentinel, never a real credential.
            sentinel = "sk-" + "AUDITFAKE" * 4
            upstream_payload["result"] = {"text": sentinel}
            response = await client.post("/mcp/prod/stripe", json={"jsonrpc": "2.0", "id": "audit", "method": "tools/list", "params": {}})
            results["inbound_dlp"] = {"status": response.status_code, "fake_secret_returned_unredacted": sentinel in response.text}

        from apps.mock_server.server import app as reference_app
        def reference_client(*args, **kwargs):
            kwargs["transport"] = ASGITransport(app=reference_app)
            return original_client(*args, **kwargs)
        with patch("httpx.AsyncClient", side_effect=reference_client):
            small = {"jsonrpc": "2.0", "id": "smoke", "method": "tools/call", "params": {"name": "stripe.refund", "arguments": {"amount": 400, "customer_id": "cus_audit"}}}
            response = await client.post("/mcp/prod/stripe", json=small, headers={"x-mcp-agent-id": "FinanceAgent"})
            results["mock_small_refund"] = {"status": response.status_code, "has_result": "result" in response.json()}
            small["params"]["arguments"]["amount"] = 2900
            response = await client.post("/mcp/prod/stripe", json=small, headers={"x-mcp-agent-id": "FinanceAgent"})
            results["approval_creation"] = {"status": response.status_code}
            if response.status_code == 202:
                approval_id = response.json()["result"]["approval_id"]
                decision = await client.post(f"/api/v1/approvals/{approval_id}/decision", json={"decision": "approve", "comment": "Disposable audit fixture only"})
                results["unauthenticated_mock_approval_execution"] = {"status": decision.status_code, "state": decision.json().get("status")}

        for name, body in [("array_jsonrpc", []), ("null_params", {"jsonrpc": "2.0", "id": "audit", "method": "tools/call", "params": None})]:
            response = await client.post("/mcp/prod/stripe", json=body)
            results[name] = {"status": response.status_code}

    policy_engine = PolicyEngine(default_mode="deny")
    policy = policy_engine.parse_yaml_policy("""name: audit-conditional-allow
subject: {agent: FinanceAgent}
resource: {server: stripe, tool: stripe.refund}
rules:
  - action: allow
    conditions:
      - {field: amount, operator: lte, value: 500}
""")
    decision = policy_engine.evaluate([policy], PolicyEvaluationContext(organization_id="audit", workspace_id="audit", agent_name="FinanceAgent", server_slug="stripe", tool_name="stripe.refund", arguments={"amount": 9000}))
    results["explicit_policy_conditions"] = {"parsed_conditions": len(policy.rules[0].conditions), "action_for_amount_9000": decision.action.value}
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "probes"
    exit_code = 0
    try:
        if mode in {"clean", "seeded"}:
            if mode == "seeded":
                asyncio.run(seed())
                asyncio.run(engine.dispose())
            import pytest
            exit_code = pytest.main([str(ROOT / "tests"), "-q", "--tb=line", "-p", "no:cacheprovider"])
        elif mode == "probes":
            asyncio.run(probes())
        else:
            raise ValueError("Expected clean, seeded, or probes")
    finally:
        asyncio.run(engine.dispose())
        DB_PATH.unlink(missing_ok=True)
    sys.exit(exit_code)
