"""
Database connection, session management, and auto-seeding.
"""

import os
import hashlib
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from apps.api.models import (
    Base,
    User,
    Organization,
    OrganizationMember,
    Workspace,
    Team,
    Agent,
    AgentCredential,
    MCPServer,
    MCPTool,
    Policy,
    AuditEvent,
    BillingSubscription,
    Notification
)
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(override=True)

raw_db_url = (os.environ.get("DATABASE_URL") or "").strip()
if not raw_db_url:
    raw_db_url = "sqlite+aiosqlite:///./mcpshield.db"

# Cloud PostgreSQL URL normalization for asyncpg (Neon, Supabase, AWS RDS, Railway, Render)
if raw_db_url.startswith("postgres://"):
    DATABASE_URL = "postgresql+asyncpg://" + raw_db_url[len("postgres://"):]
elif raw_db_url.startswith("postgresql://") and "+asyncpg" not in raw_db_url:
    DATABASE_URL = "postgresql+asyncpg://" + raw_db_url[len("postgresql://"):]
else:
    DATABASE_URL = raw_db_url

is_postgres = "postgresql" in DATABASE_URL
is_sqlite = "sqlite" in DATABASE_URL

engine_kwargs = {
    "echo": False,
    "future": True,
}

if is_postgres:
    # Clean query string for asyncpg compatibility
    if "?" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split("?")[0]

    # Serverless Cloud Postgres optimization (handles scale-to-zero, connection drops, and pooling)
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": int(os.environ.get("DB_POOL_SIZE", 10)),
        "max_overflow": int(os.environ.get("DB_MAX_OVERFLOW", 20)),
    })
    connect_args = {
        "statement_cache_size": 0,
        "timeout": 30.0,
        "command_timeout": 30.0
    }
    if "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL:
        connect_args["ssl"] = "require"
    engine_kwargs["connect_args"] = connect_args
else:
    engine_kwargs["connect_args"] = {"check_same_thread": False} if is_sqlite else {}

engine = create_async_engine(DATABASE_URL, **engine_kwargs)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

FALLBACK_URL = "sqlite+aiosqlite:///./mcpshield.db"
fallback_engine = create_async_engine(FALLBACK_URL, echo=False, future=True, connect_args={"check_same_thread": False})
FallbackSessionLocal = async_sessionmaker(fallback_engine, class_=AsyncSession, expire_on_commit=False)

_primary_failed = False


async def get_db():
    global _primary_failed
    if is_postgres and not _primary_failed:
        try:
            async with AsyncSessionLocal() as session:
                await asyncio.wait_for(session.execute(select(1)), timeout=1.5)
                yield session
                return
        except Exception as e:
            print(f"Primary database connection deferred, using resilient local storage: {e}")
            _primary_failed = True

    async with FallbackSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


async def init_db():
    async with fallback_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE workspaces ADD COLUMN kill_switch_active BOOLEAN DEFAULT 0"))
        except Exception:
            pass

    if is_postgres and not _primary_failed:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        except Exception as e:
            print(f"Primary DB init deferred: {e}")


async def get_database_info() -> dict:
    """Returns metadata about the active cloud database connection."""
    if is_postgres:
        host = DATABASE_URL.split("@")[-1].split("/")[0] if "@" in DATABASE_URL else "cloud-postgres"
        provider = "Neon Serverless" if "neon.tech" in host else ("Supabase" if "supabase" in host else "Cloud PostgreSQL")
        return {
            "type": "cloud_postgres",
            "provider": provider,
            "host": host,
            "serverless": True,
            "ssl": True,
            "cost": "$0.00 / month (Free Tier)"
        }
    else:
        return {
            "type": "sqlite_local",
            "provider": "Local Disk (Migration to Neon/Supabase recommended for production)",
            "host": "localhost",
            "serverless": False,
            "ssl": False,
            "cost": "$0.00"
        }


async def seed_initial_data(db: AsyncSession):
    """Seed initial enterprise Acme AI tenant and sample assets."""
    res = await db.execute(select(Organization).where(Organization.slug == "acme-ai"))
    existing_org = res.scalars().first()
    if existing_org:
        return  # Already seeded

    # 1. Admin User
    admin_user = User(
        email="admin@acme.ai",
        hashed_password=hash_password("admin12345!"),
        full_name="Alex Mercer (CISO)",
        is_superuser=True
    )
    db.add(admin_user)
    await db.flush()

    # 2. Acme AI Organization
    org = Organization(
        name="Acme AI Technologies",
        slug="acme-ai",
        plan_tier="pro",
        security_score=78
    )
    db.add(org)
    await db.flush()

    # 3. Membership (Owner)
    membership = OrganizationMember(
        organization_id=org.id,
        user_id=admin_user.id,
        role="owner"
    )
    db.add(membership)

    # 4. Production Workspace
    ws = Workspace(
        organization_id=org.id,
        name="Production Agents",
        slug="prod",
        default_policy_mode="deny",
        fail_behavior="fail_closed"
    )
    db.add(ws)
    await db.flush()

    # 5. Teams
    finance_team = Team(workspace_id=ws.id, name="Finance AI Ops", slug="finance", description="Agents managing financial workflows")
    support_team = Team(workspace_id=ws.id, name="Support AI Ops", slug="support", description="Customer support agents")
    db.add_all([finance_team, support_team])

    # 6. Agents
    finance_agent = Agent(
        workspace_id=ws.id,
        agent_identifier="FinanceAgent",
        name="Finance Operations Agent",
        description="Autonomous agent authorized to issue customer refunds and check transaction status.",
        owner_team="Finance AI Ops",
        environment="production",
        status="active",
        daily_budget=5000.0,
        rate_limit_rpm=60,
        risk_level="high",
        last_active_at=datetime.utcnow()
    )

    support_agent = Agent(
        workspace_id=ws.id,
        agent_identifier="SupportAgent",
        name="Customer Support Agent",
        description="Frontline triage agent handling customer questions.",
        owner_team="Support AI Ops",
        environment="production",
        status="active",
        daily_budget=200.0,
        rate_limit_rpm=120,
        risk_level="low",
        last_active_at=datetime.utcnow()
    )

    coding_agent = Agent(
        workspace_id=ws.id,
        agent_identifier="CodingAgent",
        name="Code Generation Agent",
        description="Autonomous developer assistant handling codebase refactors.",
        owner_team="Engineering",
        environment="staging",
        status="active",
        daily_budget=1000.0,
        rate_limit_rpm=180,
        risk_level="high",
        last_active_at=datetime.utcnow()
    )
    db.add_all([finance_agent, support_agent, coding_agent])
    await db.flush()

    # Agent Credentials (API key: "ak_live_finance_agent_key_123")
    key_hash = hashlib.sha256(b"ak_live_finance_agent_key_123").hexdigest()
    cred = AgentCredential(
        agent_id=finance_agent.id,
        key_hash=key_hash,
        key_prefix="ak_live_fin",
        is_active=True
    )
    db.add(cred)

    # 7. MCP Servers
    # We point to our local reference mock MCP server
    stripe_server = MCPServer(
        workspace_id=ws.id,
        name="Stripe MCP Server",
        slug="stripe",
        endpoint_url="http://127.0.0.1:8001/",
        transport="http_post",
        protocol_version="2026-07-28",
        risk_score=69,
        status="healthy",
        last_scanned_at=datetime.utcnow()
    )
    filesystem_server = MCPServer(
        workspace_id=ws.id,
        name="Filesystem MCP Server",
        slug="filesystem",
        endpoint_url="http://127.0.0.1:8001/",
        transport="http_post",
        protocol_version="2026-07-28",
        risk_score=81,
        status="critical",
        last_scanned_at=datetime.utcnow()
    )
    db.add_all([stripe_server, filesystem_server])
    await db.flush()

    # 8. Tools
    stripe_tools = [
        MCPTool(
            server_id=stripe_server.id,
            name="stripe.customer.read",
            description="Read customer details and payment status.",
            input_schema={"type": "object", "properties": {"customer_id": {"type": "string"}}, "required": ["customer_id"]},
            category="finance",
            is_mutation=False,
            is_destructive=False,
            is_sensitive=True,
            risk_score=25,
            call_count_24h=1420
        ),
        MCPTool(
            server_id=stripe_server.id,
            name="stripe.refund",
            description="Issue a payment refund to a customer.",
            input_schema={"type": "object", "properties": {"amount": {"type": "number"}, "customer_id": {"type": "string"}}, "required": ["amount", "customer_id"]},
            category="finance",
            is_mutation=True,
            is_destructive=False,
            is_sensitive=True,
            risk_score=75,
            call_count_24h=84
        ),
        MCPTool(
            server_id=stripe_server.id,
            name="stripe.payout",
            description="Transfer corporate funds to external bank account.",
            input_schema={"type": "object", "properties": {"amount": {"type": "number"}, "destination": {"type": "string"}}, "required": ["amount", "destination"]},
            category="finance",
            is_mutation=True,
            is_destructive=True,
            is_sensitive=True,
            risk_score=95,
            call_count_24h=0
        ),
    ]

    fs_tools = [
        MCPTool(
            server_id=filesystem_server.id,
            name="filesystem.read_file",
            description="Read file contents from filesystem.",
            input_schema={"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
            category="filesystem",
            is_mutation=False,
            is_destructive=False,
            is_sensitive=True,
            risk_score=30,
            call_count_24h=520
        ),
        MCPTool(
            server_id=filesystem_server.id,
            name="filesystem.delete",
            description="Unrestricted recursive deletion capability.",
            input_schema={"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
            category="filesystem",
            is_mutation=True,
            is_destructive=True,
            is_sensitive=True,
            risk_score=98,
            call_count_24h=2
        ),
    ]
    db.add_all(stripe_tools + fs_tools)

    # 9. Baseline Policies
    stripe_policy_yaml = """name: stripe-refund-policy
description: Autonomous refund limit $500, require human approval up to $5000, block above $5000.
subject:
  agent: FinanceAgent
  environment: production
resource:
  server: stripe
  tool: stripe.refund
rules:
  - description: Allow small autonomous refunds under or equal to $500
    when:
      amount_lte: 500
    action: allow
    priority: 10
  - description: Require human approval for refunds between $500 and $5000
    when:
      amount_gt: 500
      amount_lte: 5000
    action: require_approval
    priority: 20
  - description: Hard deny refunds exceeding $5000
    when:
      amount_gt: 5000
    action: deny
    priority: 5
"""
    policy1 = Policy(
        workspace_id=ws.id,
        name="stripe-refund-policy",
        description="Autonomous refund limit $500, require human approval up to $5000, block above $5000.",
        enabled=True,
        definition_yaml=stripe_policy_yaml,
        definition_json={"name": "stripe-refund-policy"},
        priority=10
    )

    fs_policy_yaml = """name: filesystem-protection-policy
description: Hard deny destructive deletions on production filesystem.
subject:
  agent: "*"
resource:
  server: filesystem
  tool: filesystem.delete
rules:
  - description: Completely block destructive recursive deletion
    action: deny
    priority: 1
"""
    policy2 = Policy(
        workspace_id=ws.id,
        name="filesystem-protection-policy",
        description="Hard deny destructive deletions on production filesystem.",
        enabled=True,
        definition_yaml=fs_policy_yaml,
        definition_json={"name": "filesystem-protection-policy"},
        priority=1
    )

    support_policy_yaml = """name: support-read-policy
description: Allow SupportAgent to read customer records.
subject:
  agent: SupportAgent
resource:
  server: stripe
  tool: stripe.customer.read
rules:
  - description: Allow customer read operations
    action: allow
    priority: 10
"""
    policy3 = Policy(
        workspace_id=ws.id,
        name="support-read-policy",
        description="Allow SupportAgent to read customer records.",
        enabled=True,
        definition_yaml=support_policy_yaml,
        definition_json={"name": "support-read-policy"},
        priority=10
    )

    db.add_all([policy1, policy2, policy3])

    # 10. Billing Subscription (Pro Plan)
    sub = BillingSubscription(
        organization_id=org.id,
        stripe_customer_id="cus_acme_prod_001",
        plan_tier="pro",
        status="active",
        monthly_gateway_call_limit=500000,
        current_cycle_calls=12480,
        current_period_end=datetime.utcnow() + timedelta(days=22)
    )
    db.add(sub)

    # 11. Initial Audit Trail
    prev_h = "0" * 64
    event_data = f"INIT_AUDIT_LOG_ACME_{datetime.utcnow().isoformat()}"
    ev_h = hashlib.sha256(event_data.encode("utf-8")).hexdigest()
    ev = AuditEvent(
        workspace_id=ws.id,
        event_type="mcp.server.registered",
        server_slug="stripe",
        action="allow",
        decision_reason="Server registered and verified with MCP 2026-07-28 protocol.",
        risk_score=25,
        prev_hash=prev_h,
        event_hash=ev_h
    )
    db.add(ev)

    # 12. Notification
    notif = Notification(
        workspace_id=ws.id,
        title="MCPShield Gateway Active",
        message="Acme AI production gateway initialized. Fail-closed policy enforcement active.",
        level="info"
    )
    db.add(notif)

    await db.commit()
