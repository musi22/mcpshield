import sys
import os
import asyncio
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from apps.api.database import engine, AsyncSessionLocal
from apps.api.models import Workspace, MCPServer, MCPTool, Policy
from sqlalchemy import select
from datetime import datetime

async def seed_connectors():
    async with AsyncSessionLocal() as db:
        ws_res = await db.execute(select(Workspace).where(Workspace.slug == "prod"))
        ws = ws_res.scalars().first()
        if not ws:
            ws_res = await db.execute(select(Workspace).limit(1))
            ws = ws_res.scalars().first()
            if not ws:
                print("No workspace found.")
                return

        # Check existing servers
        existing_res = await db.execute(select(MCPServer).where(MCPServer.workspace_id == ws.id))
        existing_slugs = {s.slug: s for s in existing_res.scalars().all()}

        # 1. PostgreSQL Database MCP Connector
        if "database" not in existing_slugs:
            db_connector = MCPServer(
                workspace_id=ws.id,
                name="PostgreSQL MCP Database Connector",
                slug="database",
                endpoint_url="http://127.0.0.1:8001/",
                transport="http_post",
                protocol_version="2026-07-28",
                risk_score=45,
                status="healthy",
                last_scanned_at=datetime.utcnow()
            )
            db.add(db_connector)
            await db.flush()

            db_tools = [
                MCPTool(
                    server_id=db_connector.id,
                    name="database.describe_tables",
                    description="Inspect PostgreSQL relational schema, column definitions, and primary keys.",
                    input_schema={"type": "object", "properties": {"table_name": {"type": "string"}}},
                    category="database",
                    is_mutation=False,
                    is_destructive=False,
                    is_sensitive=False,
                    risk_score=15,
                    call_count_24h=312
                ),
                MCPTool(
                    server_id=db_connector.id,
                    name="database.query_table",
                    description="Perform read-only parameterized query on cloud PostgreSQL table with row limit.",
                    input_schema={"type": "object", "properties": {"table_name": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["table_name"]},
                    category="database",
                    is_mutation=False,
                    is_destructive=False,
                    is_sensitive=True,
                    risk_score=35,
                    call_count_24h=840
                ),
                MCPTool(
                    server_id=db_connector.id,
                    name="database.execute_sql",
                    description="Execute audited raw SQL statements against cloud production database.",
                    input_schema={"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
                    category="database",
                    is_mutation=True,
                    is_destructive=True,
                    is_sensitive=True,
                    risk_score=90,
                    call_count_24h=19
                )
            ]
            db.add_all(db_tools)
            print("[OK] Registered PostgreSQL MCP Database Connector & Tools")

        # 2. Cloud Storage MCP Connector
        if "cloud-storage" not in existing_slugs:
            storage_connector = MCPServer(
                workspace_id=ws.id,
                name="Cloudflare R2 / S3 Storage Connector",
                slug="cloud-storage",
                endpoint_url="http://127.0.0.1:8001/",
                transport="http_post",
                protocol_version="2026-07-28",
                risk_score=20,
                status="healthy",
                last_scanned_at=datetime.utcnow()
            )
            db.add(storage_connector)
            await db.flush()

            storage_tools = [
                MCPTool(
                    server_id=storage_connector.id,
                    name="cloud_storage.upload_artifact",
                    description="Persist audit archives and vulnerability scans to Cloudflare R2 / S3 object storage.",
                    input_schema={"type": "object", "properties": {"key": {"type": "string"}, "content_type": {"type": "string"}}, "required": ["key"]},
                    category="storage",
                    is_mutation=True,
                    is_destructive=False,
                    is_sensitive=False,
                    risk_score=20,
                    call_count_24h=142
                ),
                MCPTool(
                    server_id=storage_connector.id,
                    name="cloud_storage.list_objects",
                    description="List objects stored in cloud archive bucket.",
                    input_schema={"type": "object", "properties": {"prefix": {"type": "string"}}},
                    category="storage",
                    is_mutation=False,
                    is_destructive=False,
                    is_sensitive=False,
                    risk_score=10,
                    call_count_24h=65
                )
            ]
            db.add_all(storage_tools)
            print("[OK] Registered Cloud Storage MCP Connector & Tools")

        # 3. Cloud Cache MCP Connector
        if "cloud-cache" not in existing_slugs:
            cache_connector = MCPServer(
                workspace_id=ws.id,
                name="Upstash Redis Cache & Quota Connector",
                slug="cloud-cache",
                endpoint_url="http://127.0.0.1:8001/",
                transport="http_post",
                protocol_version="2026-07-28",
                risk_score=15,
                status="healthy",
                last_scanned_at=datetime.utcnow()
            )
            db.add(cache_connector)
            await db.flush()

            cache_tools = [
                MCPTool(
                    server_id=cache_connector.id,
                    name="cloud_cache.get_quota",
                    description="Query Upstash Redis distributed sliding-window rate limit quota for an agent.",
                    input_schema={"type": "object", "properties": {"agent_id": {"type": "string"}}, "required": ["agent_id"]},
                    category="cache",
                    is_mutation=False,
                    is_destructive=False,
                    is_sensitive=False,
                    risk_score=10,
                    call_count_24h=2400
                )
            ]
            db.add_all(cache_tools)
            print("[OK] Registered Cloud Cache MCP Connector & Tools")

        # Add Database Security Policy
        db_policy_yaml = """name: postgres-database-guard-policy
description: Allow schema introspection and read queries. Require human approval for SQL mutations. Hard deny DROP/TRUNCATE.
subject:
  agent: "*"
  environment: production
resource:
  server: database
rules:
  - description: Allow safe table description and schema discovery
    when:
      tool_eq: database.describe_tables
    action: allow
    priority: 10
  - description: Require human approval for execute_sql mutations
    when:
      tool_eq: database.execute_sql
    action: require_approval
    priority: 20
"""
        existing_pol = await db.execute(select(Policy).where(Policy.name == "postgres-database-guard-policy"))
        if not existing_pol.scalars().first():
            pol = Policy(
                workspace_id=ws.id,
                name="postgres-database-guard-policy",
                description="Deterministic guardrails for PostgreSQL Database MCP Connector",
                definition_yaml=db_policy_yaml,
                definition_json={"name": "postgres-database-guard-policy"},
                enabled=True,
                priority=15
            )
            db.add(pol)
            print("[OK] Added postgres-database-guard-policy to live Neon DB")

        await db.commit()
        print("\n>>> ALL CLOUD MCP CONNECTORS SUCCESSFULLY PROVISIONED IN NEON POSTGRESQL! <<<")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_connectors())
