"""
MCPShield Production Database Architecture
SQLAlchemy 2.0 Async declarative models for multi-tenant MCP security platform.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index,
    Enum as SQLEnum
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def gen_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.utcnow()


# 1. Users
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    memberships = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")


# 2. Organizations
class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    plan_tier = Column(String(50), default="free")  # free, pro, team, enterprise
    security_score = Column(Integer, default=85)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    workspaces = relationship("Workspace", back_populates="organization", cascade="all, delete-orphan")
    subscriptions = relationship("BillingSubscription", back_populates="organization", cascade="all, delete-orphan")


# 3. Organization Members (RBAC)
class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    role = Column(String(50), default="developer")  # owner, admin, security_admin, developer, auditor, approver, viewer
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="memberships")


# 4. Workspaces
class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False, index=True)
    default_policy_mode = Column(String(20), default="deny")  # deny, allow
    fail_behavior = Column(String(20), default="fail_closed")  # fail_closed, fail_open
    kill_switch_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="workspaces")
    agents = relationship("Agent", back_populates="workspace", cascade="all, delete-orphan")
    servers = relationship("MCPServer", back_populates="workspace", cascade="all, delete-orphan")
    policies = relationship("Policy", back_populates="workspace", cascade="all, delete-orphan")


# 5. Teams
class Team(Base):
    __tablename__ = "teams"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


# 6. Agents (AI Agent Registry)
class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    agent_identifier = Column(String(100), unique=True, index=True, nullable=False)  # e.g. agt_89403 or FinanceAgent
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    owner_team = Column(String(100), default="Engineering")
    environment = Column(String(50), default="production")
    status = Column(String(50), default="active")  # active, suspended, disabled, killed
    daily_budget = Column(Float, default=500.0)
    current_daily_spend = Column(Float, default=0.0)
    rate_limit_rpm = Column(Integer, default=120)
    risk_level = Column(String(50), default="medium")  # low, medium, high, critical
    last_active_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    workspace = relationship("Workspace", back_populates="agents")
    credentials = relationship("AgentCredential", back_populates="agent", cascade="all, delete-orphan")


# 7. Agent Credentials
class AgentCredential(Base):
    __tablename__ = "agent_credentials"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), index=True, nullable=False)
    key_hash = Column(String(255), nullable=False, index=True)
    key_prefix = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    agent = relationship("Agent", back_populates="credentials")


# 8. MCP Servers (Inventory)
class MCPServer(Base):
    __tablename__ = "mcp_servers"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False, index=True)
    endpoint_url = Column(String(1024), nullable=False)
    transport = Column(String(50), default="http_post")  # http_post, sse_legacy, stdio
    protocol_version = Column(String(50), default="2026-07-28")
    auth_type = Column(String(50), default="none")  # none, bearer, api_key, oauth
    risk_score = Column(Integer, default=25)  # 0-100
    status = Column(String(50), default="healthy")  # healthy, degraded, offline, critical
    last_scanned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    workspace = relationship("Workspace", back_populates="servers")
    tools = relationship("MCPTool", back_populates="server", cascade="all, delete-orphan")
    resources = relationship("MCPResource", back_populates="server", cascade="all, delete-orphan")
    credentials = relationship("MCPServerCredential", back_populates="server", cascade="all, delete-orphan")


# 9. MCP Server Credentials
class MCPServerCredential(Base):
    __tablename__ = "mcp_server_credentials"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    server_id = Column(String(36), ForeignKey("mcp_servers.id", ondelete="CASCADE"), index=True, nullable=False)
    auth_header_name = Column(String(100), default="Authorization")
    encrypted_secret = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    server = relationship("MCPServer", back_populates="credentials")


# 10. MCP Tools
class MCPTool(Base):
    __tablename__ = "mcp_tools"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    server_id = Column(String(36), ForeignKey("mcp_servers.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, default="")
    input_schema = Column(JSON, default=dict)
    category = Column(String(100), default="general")
    is_mutation = Column(Boolean, default=False)
    is_destructive = Column(Boolean, default=False)
    is_sensitive = Column(Boolean, default=False)
    risk_score = Column(Integer, default=10)
    call_count_24h = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    server = relationship("MCPServer", back_populates="tools")


# 11. MCP Resources
class MCPResource(Base):
    __tablename__ = "mcp_resources"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    server_id = Column(String(36), ForeignKey("mcp_servers.id", ondelete="CASCADE"), index=True, nullable=False)
    uri = Column(String(1024), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    mime_type = Column(String(100), default="application/json")
    is_sensitive = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    server = relationship("MCPServer", back_populates="resources")


# 12. Scan Jobs
class ScanJob(Base):
    __tablename__ = "scan_jobs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    target = Column(String(1024), nullable=False)
    scan_type = Column(String(50), default="remote_url")
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    risk_score = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    results = relationship("ScanResult", back_populates="scan_job", cascade="all, delete-orphan")


# 13. Scan Results
class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    scan_job_id = Column(String(36), ForeignKey("scan_jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    summary = Column(JSON, default=dict)
    sarif_output = Column(JSON, default=dict)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    scan_job = relationship("ScanJob", back_populates="results")
    findings = relationship("SecurityFindingModel", back_populates="scan_result", cascade="all, delete-orphan")


# 14. Security Findings
class SecurityFindingModel(Base):
    __tablename__ = "security_findings"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    scan_result_id = Column(String(36), ForeignKey("scan_results.id", ondelete="CASCADE"), index=True, nullable=False)
    rule_id = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    tool_name = Column(String(255), nullable=True)
    resource_uri = Column(String(1024), nullable=True)
    remediation = Column(Text, nullable=False)
    cwe_id = Column(String(50), nullable=True)
    status = Column(String(50), default="open")  # open, remediated, ignored
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    scan_result = relationship("ScanResult", back_populates="findings")


# 15. Policies
class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    enabled = Column(Boolean, default=True)
    definition_yaml = Column(Text, nullable=False)
    definition_json = Column(JSON, nullable=False)
    priority = Column(Integer, default=100)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    workspace = relationship("Workspace", back_populates="policies")
    versions = relationship("PolicyVersion", back_populates="policy", cascade="all, delete-orphan")


# 16. Policy Versions
class PolicyVersion(Base):
    __tablename__ = "policy_versions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    policy_id = Column(String(36), ForeignKey("policies.id", ondelete="CASCADE"), index=True, nullable=False)
    version_number = Column(Integer, nullable=False)
    definition_yaml = Column(Text, nullable=False)
    created_by_user_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    policy = relationship("Policy", back_populates="versions")


# 17. Approval Requests
class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    token = Column(String(100), unique=True, index=True, nullable=False)
    agent_id = Column(String(100), nullable=False)
    server_slug = Column(String(100), nullable=False)
    tool_name = Column(String(255), nullable=False)
    arguments = Column(JSON, default=dict)
    risk_score = Column(Integer, default=50)
    risk_reason = Column(Text, default="")
    status = Column(String(50), default="pending")  # pending, approved, rejected, expired, executed
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    decisions = relationship("ApprovalDecision", back_populates="request", cascade="all, delete-orphan")


# 18. Approval Decisions
class ApprovalDecision(Base):
    __tablename__ = "approval_decisions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    approval_request_id = Column(String(36), ForeignKey("approval_requests.id", ondelete="CASCADE"), index=True, nullable=False)
    approver_user_id = Column(String(36), nullable=False)
    approver_email = Column(String(255), nullable=False)
    decision = Column(String(50), nullable=False)  # approve, reject
    comment = Column(Text, default="")
    executed_result = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    request = relationship("ApprovalRequest", back_populates="decisions")


# 19. Gateway Requests
class GatewayRequest(Base):
    __tablename__ = "gateway_requests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    request_id = Column(String(100), index=True, nullable=False)
    server_slug = Column(String(100), nullable=False)
    method = Column(String(100), nullable=False)
    tool_name = Column(String(255), nullable=True)
    agent_id = Column(String(100), nullable=True)
    action_taken = Column(String(50), nullable=False)  # allow, deny, require_approval, redact
    risk_score = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    status_code = Column(Integer, default=200)
    client_ip = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


# 20. Audit Events (Cryptographically Chained Immutable Log)
class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    event_type = Column(String(100), nullable=False, index=True)
    agent_id = Column(String(100), nullable=True)
    user_id = Column(String(100), nullable=True)
    server_slug = Column(String(100), nullable=True)
    tool_name = Column(String(255), nullable=True)
    action = Column(String(50), nullable=False)
    decision_reason = Column(Text, default="")
    risk_score = Column(Integer, default=0)
    sanitized_payload = Column(JSON, default=dict)
    event_metadata = Column(JSON, default=dict)
    prev_hash = Column(String(64), nullable=False)
    event_hash = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


# 21. API Keys
class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    key_prefix = Column(String(20), nullable=False)
    key_hash = Column(String(255), nullable=False, index=True)
    scopes = Column(JSON, default=lambda: ["*"])
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


# 22. Webhooks
class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    target_url = Column(String(1024), nullable=False)
    secret_key = Column(String(255), nullable=False)
    events = Column(JSON, default=lambda: ["approval_requested", "request_blocked", "critical_finding"])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


# 23. Integrations (Slack, GitHub, Teams, PagerDuty)
class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    provider = Column(String(50), nullable=False)  # slack, github, teams, pagerduty
    config = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


# 24. Usage Events
class UsageEvent(Base):
    __tablename__ = "usage_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    event_name = Column(String(100), nullable=False)
    quantity = Column(Integer, default=1)
    cost_usd = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


# 25. Billing Subscriptions
class BillingSubscription(Base):
    __tablename__ = "billing_subscriptions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    stripe_customer_id = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    plan_tier = Column(String(50), default="free")
    status = Column(String(50), default="active")  # active, past_due, canceled
    monthly_gateway_call_limit = Column(Integer, default=10000)
    current_cycle_calls = Column(Integer, default=0)
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="subscriptions")


# 26. Billing Usage
class BillingUsage(Base):
    __tablename__ = "billing_usage"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    metric_name = Column(String(100), nullable=False)
    count = Column(Integer, default=0)
    period_start = Column(DateTime, default=utc_now)
    period_end = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


# 27. Notifications
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    level = Column(String(50), default="info")  # info, warning, danger, critical
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


# 28. Leads (Enterprise Contact & Demo Requests)
class LeadModel(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    source = Column(String(100), default="web_contact")
    created_at = Column(DateTime, default=utc_now)

