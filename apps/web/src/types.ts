export interface OverviewMetrics {
  total_servers: number;
  total_agents: number;
  total_tools: number;
  total_requests: number;
  blocked_actions: number;
  pending_approvals: number;
  security_score: number;
  active_threats: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  timeline: Array<{
    hour: string;
    requests: number;
    blocked: number;
    approvals: number;
    latency: number;
  }>;
}

export interface MCPServer {
  id: string;
  name: string;
  slug: string;
  endpoint_url: string;
  transport: string;
  protocol_version: string;
  risk_score: number;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  tools_count: number;
  last_scanned_at: string | null;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  category: string;
  server_name: string;
  server_slug: string;
  is_mutation: boolean;
  is_destructive: boolean;
  is_sensitive: boolean;
  risk_score: number;
  call_count_24h: number;
  input_schema: Record<string, any>;
}

export interface Agent {
  id: string;
  agent_identifier: string;
  name: string;
  description: string;
  owner_team: string;
  environment: string;
  status: 'active' | 'suspended' | 'disabled' | 'killed';
  daily_budget: number;
  current_daily_spend: number;
  rate_limit_rpm: number;
  risk_level: string;
  last_active_at: string | null;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  definition_yaml: string;
  priority: number;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  token: string;
  agent_id: string;
  server_slug: string;
  tool_name: string;
  arguments: Record<string, any>;
  risk_score: number;
  risk_reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'executed';
  expires_at: string;
  created_at: string;
}

export interface SecurityFinding {
  id: string;
  rule_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  category: string;
  tool_name?: string;
  remediation: string;
  cwe_id?: string;
  status: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  agent_id?: string;
  server_slug?: string;
  tool_name?: string;
  action: 'allow' | 'deny' | 'require_approval' | 'redact';
  decision_reason: string;
  risk_score: number;
  sanitized_payload: Record<string, any>;
  prev_hash: string;
  event_hash: string;
  created_at: string;
}

export interface BillingInfo {
  id?: string;
  plan_tier: string;
  status: string;
  monthly_limit: number;
  current_calls: number;
  usage_pct: number;
  current_period_end: string | null;
}

export interface APIKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_superuser?: boolean;
}

export interface DatabaseOverview {
  engine: string;
  database_url_masked: string;
  status: string;
  tables_count: number;
  counts: Record<string, number>;
}

export interface TableDataResponse {
  table: string;
  total_rows: number;
  columns: string[];
  rows: Record<string, any>[];
}


