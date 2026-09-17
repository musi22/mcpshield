"""
MCPShield Official Python SDK
Security gateway, policy authorization, and scanner client for MCP infrastructure.
"""

import os
from typing import Any, Dict, Optional
import httpx


class MCPShieldError(Exception):
    pass


class MCPShieldDecision:
    def __init__(self, action: str, allowed: bool, risk_score: int, reason: str, approval_id: Optional[str] = None):
        self.action = action
        self.allowed = allowed
        self.risk_score = risk_score
        self.reason = reason
        self.approval_id = approval_id

    def __repr__(self):
        return f"<MCPShieldDecision action={self.action} allowed={self.allowed} risk_score={self.risk_score}>"


class MCPShield:
    def __init__(self, api_key: Optional[str] = None, base_url: str = "http://localhost:8000"):
        self.api_key = api_key or os.environ.get("MCPSHIELD_API_KEY", "")
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "MCP-Protocol-Version": "2026-07-28",
        }

    def authorize(
        self,
        agent: str,
        server: str,
        tool: str,
        arguments: Optional[Dict[str, Any]] = None,
        workspace: str = "default",
        environment: str = "production"
    ) -> MCPShieldDecision:
        """
        Directly check authorization, risk, and DLP policies for an agent's intended tool call.
        """
        payload = {
            "agent": agent,
            "server": server,
            "tool": tool,
            "arguments": arguments or {},
            "workspace": workspace,
            "environment": environment,
        }
        with httpx.Client(base_url=self.base_url, timeout=5.0) as client:
            resp = client.post("/api/v1/gateway/authorize-check", json=payload, headers=self.headers)
            if resp.status_code >= 400:
                raise MCPShieldError(f"Gateway authorization error {resp.status_code}: {resp.text}")
            data = resp.json()
            return MCPShieldDecision(
                action=data.get("action", "deny"),
                allowed=data.get("action") == "allow",
                risk_score=data.get("risk_score", 0),
                reason=data.get("reason", ""),
                approval_id=data.get("approval_id"),
            )

    def scan(self, target: str, scan_type: str = "remote_url") -> Dict[str, Any]:
        """
        Scan an MCP server endpoint, config file, or repository for security vulnerabilities.
        """
        with httpx.Client(base_url=self.base_url, timeout=30.0) as client:
            resp = client.post("/api/v1/scans", json={"target": target, "scan_type": scan_type}, headers=self.headers)
            if resp.status_code >= 400:
                raise MCPShieldError(f"Scan failed {resp.status_code}: {resp.text}")
            return resp.json()

    def get_gateway_url(self, workspace: str, server: str) -> str:
        """Returns the transparent reverse-proxy URL for this server."""
        return f"{self.base_url}/mcp/{workspace}/{server}"


__all__ = ["MCPShield", "MCPShieldDecision", "MCPShieldError"]
