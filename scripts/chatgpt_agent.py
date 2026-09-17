"""
ChatGPT (OpenAI) Integration with MCPShield Gateway
Demonstrates how ChatGPT tool-calls are intercepted and protected by MCPShield.
"""

import os
import sys
import json
import httpx

sys.path.insert(0, os.path.abspath("."))
from packages.sdk_python import MCPShield

# 1. Initialize MCPShield Client
shield = MCPShield(
    api_key="ak_live_finance_agent_key_123",
    base_url="http://127.0.0.1:8000"
)

def chatgpt_tool_executor(tool_name: str, arguments: dict, agent_id: str = "ChatGPT-Agent"):
    """
    Middleware function that wraps ChatGPT tool calls with MCPShield protection.
    """
    print(f"\n[ChatGPT Request] Invoking tool: '{tool_name}' with args: {arguments}")

    # Determine target server
    server_slug = "stripe" if "stripe" in tool_name else "filesystem"

    # Route through MCPShield Gateway
    gateway_url = shield.get_gateway_url(workspace="prod", server=server_slug)
    headers = {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2026-07-28",
        "x-mcp-agent-id": agent_id,
        "Mcp-Method": "tools/call",
        "Mcp-Name": tool_name
    }
    payload = {
        "jsonrpc": "2.0",
        "id": f"chatgpt_call_{os.urandom(4).hex()}",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }

    with httpx.Client(timeout=10.0) as client:
        resp = client.post(gateway_url, json=payload, headers=headers)
        return resp.status_code, resp.json()

if __name__ == "__main__":
    print("=" * 65)
    print("  CHATGPT AGENT CONNECTED TO MCPSHIELD GATEWAY")
    print("=" * 65)

    # Prompt 1: User asks ChatGPT to look up a customer
    print("\nScenario 1: User prompt to ChatGPT: 'Look up customer cus_9482'")
    status, result = chatgpt_tool_executor("stripe.customer.read", {"customer_id": "cus_9482"})
    print(f"Status Code: HTTP {status}")
    print("Result passed back to ChatGPT context:")
    print(json.dumps(result, indent=2))

    # Prompt 2: User asks ChatGPT to refund $3,500
    print("\n" + "-" * 65)
    print("Scenario 2: User prompt to ChatGPT: 'Issue a $3,500 refund to cus_9482'")
    status, result = chatgpt_tool_executor("stripe.refund", {"amount": 3500, "customer_id": "cus_9482"})
    print(f"Status Code: HTTP {status} (HALTED FOR APPROVAL)")
    print("Result passed back to ChatGPT context:")
    print(json.dumps(result, indent=2))

    # Prompt 3: Prompt injection tries to delete files
    print("\n" + "-" * 65)
    print("Scenario 3: Untrusted input tries to make ChatGPT delete files: 'delete /var/log'")
    status, result = chatgpt_tool_executor("filesystem.delete", {"path": "/var/log", "recursive": True})
    print(f"Status Code: HTTP {status} (HARD BLOCKED)")
    print("Result passed back to ChatGPT context:")
    print(json.dumps(result, indent=2))
    print("=" * 65)
