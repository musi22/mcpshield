import {
  OverviewMetrics,
  MCPServer,
  MCPTool,
  Agent,
  Policy,
  ApprovalRequest,
  SecurityFinding,
  AuditEvent,
  BillingInfo,
  APIKeyItem,
  TeamMember,
  UserProfile,
  DatabaseOverview,
  TableDataResponse
} from './types';

const API_BASE = '';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mcpshield_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error ${res.status}: ${err}`);
  }
  return res.json();
}

export const api = {
  getOverview: () => fetchJSON<OverviewMetrics>('/api/v1/analytics/overview'),
  getServers: () => fetchJSON<MCPServer[]>('/api/v1/servers'),
  registerServer: (data: { name: string; slug: string; endpoint_url: string; transport?: string }) =>
    fetchJSON<{ id: string; name: string; slug: string }>('/api/v1/servers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  refreshServerTools: (serverId: string) =>
    fetchJSON<{ status: string; tools_discovered: number }>(`/api/v1/servers/${serverId}/refresh-tools`, {
      method: 'POST'
    }),
  getTools: (search?: string, server?: string, destructiveOnly?: boolean) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (server) params.append('server', server);
    if (destructiveOnly) params.append('destructive_only', 'true');
    return fetchJSON<MCPTool[]>(`/api/v1/tools?${params.toString()}`);
  },
  getAgents: () => fetchJSON<Agent[]>('/api/v1/agents'),
  toggleAgentStatus: (agentId: string, status: string) =>
    fetchJSON<{ id: string; status: string }>(`/api/v1/agents/${agentId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    }),
  registerAgent: (data: any) =>
    fetchJSON<{ agent: string; id: string; api_key: string }>('/api/v1/agents', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getPolicies: () => fetchJSON<Policy[]>('/api/v1/policies'),
  createPolicy: (data: { name: string; description: string; definition_yaml: string; priority: number; enabled: boolean }) =>
    fetchJSON<{ id: string; name: string }>('/api/v1/policies', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePolicy: (id: string, data: any) =>
    fetchJSON<{ id: string; name: string }>(`/api/v1/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deletePolicy: (id: string) =>
    fetchJSON<{ status: string }>(`/api/v1/policies/${id}`, {
      method: 'DELETE'
    }),
  getApprovals: (statusFilter?: string) => {
    const q = statusFilter ? `?status_filter=${statusFilter}` : '';
    return fetchJSON<ApprovalRequest[]>(`/api/v1/approvals${q}`);
  },
  submitApprovalDecision: (approvalId: string, decision: 'approve' | 'reject', comment: string = '') =>
    fetchJSON<{ status: string; decision: string; executed_result: any }>(`/api/v1/approvals/${approvalId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, comment })
    }),
  getFindings: (severity?: string) => {
    const q = severity ? `?severity=${severity}` : '';
    return fetchJSON<SecurityFinding[]>(`/api/v1/findings${q}`);
  },
  triggerScan: (target: string, scan_type: string = 'remote_url') =>
    fetchJSON<any>('/api/v1/scans', {
      method: 'POST',
      body: JSON.stringify({ target, scan_type })
    }),
  getAuditEvents: (limit: number = 100) =>
    fetchJSON<AuditEvent[]>(`/api/v1/audit-events?limit=${limit}`),
  getBilling: () => fetchJSON<BillingInfo>('/api/v1/billing/subscription'),
  upgradeBilling: (plan_tier: string) =>
    fetchJSON<{ status: string; plan_tier: string }>('/api/v1/billing/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan_tier })
    }),
  getAPIKeys: () => fetchJSON<APIKeyItem[]>('/api/v1/api-keys'),
  createAPIKey: (name: string, scopes: string[] = ['*']) =>
    fetchJSON<{ id: string; name: string; api_key: string }>('/api/v1/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, scopes })
    }),
  getTeam: () => fetchJSON<TeamMember[]>('/api/v1/team'),
  getSettings: () => fetchJSON<any>('/api/v1/settings'),
  updateSettings: (data: any) =>
    fetchJSON<{ status: string }>('/api/v1/settings', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  sendMCPToolCall: async (workspace: string, server: string, tool: string, args: Record<string, any>, agentId: string) => {
    const res = await fetch(`/mcp/${workspace}/${server}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': '2026-07-28',
        'x-mcp-agent-id': agentId,
        'Mcp-Method': 'tools/call',
        'Mcp-Name': tool,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `ui_call_${Date.now()}`,
        method: 'tools/call',
        params: {
          name: tool,
          arguments: args
        }
      })
    });
    const data = await res.json();
    return { status: res.status, data };
  },
  login: (payload: { email: string; password: string }) =>
    fetchJSON<{ access_token: string; token_type: string; user: UserProfile }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  register: (payload: { email: string; password: string; full_name: string; org_name: string }) =>
    fetchJSON<{ access_token: string; token_type: string; user: UserProfile }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getMe: () => fetchJSON<{ user: UserProfile; organizations: any[] }>('/api/v1/auth/me'),
  getDatabaseOverview: () => fetchJSON<DatabaseOverview>('/api/v1/database/overview'),
  submitLead: (payload: { name: string; email: string; company?: string; message?: string; honeypot?: string; source?: string }) =>
    fetchJSON<{ status: string; lead_id: string; message: string }>('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getKillSwitch: () => fetchJSON<{ kill_switch_active: boolean; mode: string }>('/api/v1/security/kill-switch'),
  toggleKillSwitch: (action: 'activate' | 'deactivate') =>
    fetchJSON<{ status: string; message: string }>('/api/v1/security/kill-switch', {
      method: 'POST',
      body: JSON.stringify({ action })
    }),
  deleteAccount: () =>
    fetchJSON<{ status: string; message: string }>('/api/v1/auth/account', {
      method: 'DELETE'
    }),
  getHealth: () => fetchJSON<any>('/healthz'),
  oauthLogin: (provider: string) =>
    fetchJSON<{ access_token: string; token_type: string; user: UserProfile; message: string }>(`/api/v1/auth/oauth/${provider}`, {
      method: 'POST'
    }),
  getTableData: (tableName: string, limit = 50, offset = 0) =>
    fetchJSON<TableDataResponse>(`/api/v1/database/tables/${tableName}?limit=${limit}&offset=${offset}`),
  getCloudOverview: () => fetchJSON<any>('/api/v1/cloud/overview'),
  connectCloudDatabase: (database_url: string) =>
    fetchJSON<{ status: string; message: string }>('/api/v1/cloud/connect-database', {
      method: 'POST',
      body: JSON.stringify({ database_url })
    })
};

