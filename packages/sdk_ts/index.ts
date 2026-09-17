/**
 * MCPShield Official TypeScript SDK
 * Security gateway, policy authorization, and scanner client for MCP infrastructure.
 */

export interface MCPShieldConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface AuthorizeParams {
  agent: string;
  server: string;
  tool: string;
  arguments?: Record<string, any>;
  workspace?: string;
  environment?: string;
}

export interface DecisionResult {
  action: 'allow' | 'deny' | 'require_approval' | 'redact';
  allowed: boolean;
  risk_score: number;
  reason: string;
  approval_id?: string;
}

export class MCPShield {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: MCPShieldConfig = {}) {
    this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env.MCPSHIELD_API_KEY || '' : '');
    this.baseUrl = (config.baseUrl || 'http://localhost:8000').replace(/\/$/, '');
  }

  async authorize(params: AuthorizeParams): Promise<DecisionResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/gateway/authorize-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'MCP-Protocol-Version': '2026-07-28',
      },
      body: JSON.stringify({
        agent: params.agent,
        server: params.server,
        tool: params.tool,
        arguments: params.arguments || {},
        workspace: params.workspace || 'default',
        environment: params.environment || 'production',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`MCPShield authorize error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return {
      action: data.action,
      allowed: data.action === 'allow',
      risk_score: data.risk_score || 0,
      reason: data.reason || '',
      approval_id: data.approval_id,
    };
  }

  getGatewayUrl(workspace: string, server: string): string {
    return `${this.baseUrl}/mcp/${workspace}/${server}`;
  }
}
