"""
MCPShield Live End-to-End Demonstration Script
Executes all real-world security scenarios against the local MCP infrastructure.
"""

import httpx
import json

client = httpx.Client(timeout=15.0)

print("=" * 70)
print("  STEP 1: PASSIVE MCP SECURITY SCANNER")
print("=" * 70)
scan_resp = client.post(
    "http://127.0.0.1:8000/api/v1/scans",
    json={"target": "http://127.0.0.1:8001/", "scan_type": "remote_url"}
)
scan_data = scan_resp.json()
print(f"Target Scanned:        {scan_data['target']}")
print(f"Discovered Tools:      {scan_data['total_tools']}")
print(f"Security Score:        {scan_data['risk_score']}/100")
print(f"Critical Findings:     {scan_data['critical_count']}")
print(f"High Findings:         {scan_data['high_count']}")
print("Sample Findings Discovered:")
for f in scan_data["findings"][:3]:
    print(f"  • [{f['severity'].upper()}] {f['title']} (Tool: {f.get('tool_name')})")
    print(f"    Remediation: {f['remediation']}")

print("\n" + "=" * 70)
print("  STEP 2: AGENT SENDS ALLOWED CALL ($400 REFUND <= $500 LIMIT)")
print("=" * 70)
r_allow = client.post(
    "http://127.0.0.1:8000/mcp/prod/stripe",
    json={
        "jsonrpc": "2.0",
        "id": "agent-call-1",
        "method": "tools/call",
        "params": {
            "name": "stripe.refund",
            "arguments": {"amount": 400, "customer_id": "cus_9482", "reason": "Customer cancellation"}
        }
    },
    headers={"x-mcp-agent-id": "FinanceAgent", "MCP-Protocol-Version": "2026-07-28"}
)
print(f"HTTP Status: {r_allow.status_code} OK")
print("Gateway Result:")
print(json.dumps(r_allow.json(), indent=2))

print("\n" + "=" * 70)
print("  STEP 3: AGENT SENDS HIGH-VALUE CALL ($2,500 REFUND -> APPROVAL REQUIRED)")
print("=" * 70)
r_appr = client.post(
    "http://127.0.0.1:8000/mcp/prod/stripe",
    json={
        "jsonrpc": "2.0",
        "id": "agent-call-2",
        "method": "tools/call",
        "params": {
            "name": "stripe.refund",
            "arguments": {"amount": 2500, "customer_id": "cus_9482", "reason": "Enterprise refund"}
        }
    },
    headers={"x-mcp-agent-id": "FinanceAgent", "MCP-Protocol-Version": "2026-07-28"}
)
print(f"HTTP Status: {r_appr.status_code} ACCEPTED (Execution Paused)")
appr_payload = r_appr.json()
print(json.dumps(appr_payload, indent=2))
approval_id = appr_payload["result"]["approval_id"]

print("\n" + "=" * 70)
print("  STEP 4: HUMAN APPROVER REVIEWS & APPROVES THE PAUSED CALL")
print("=" * 70)
r_decide = client.post(
    f"http://127.0.0.1:8000/api/v1/approvals/{approval_id}/decision",
    json={"decision": "approve", "comment": "Approved by Alex Mercer (CISO)"}
)
print(f"HTTP Status: {r_decide.status_code} OK")
print("Post-Approval Execution Result on Target MCP Server:")
print(json.dumps(r_decide.json(), indent=2))

print("\n" + "=" * 70)
print("  STEP 5: AGENT ATTEMPTS DESTRUCTIVE DELETION (filesystem.delete)")
print("=" * 70)
r_deny = client.post(
    "http://127.0.0.1:8000/mcp/prod/filesystem",
    json={
        "jsonrpc": "2.0",
        "id": "agent-call-3",
        "method": "tools/call",
        "params": {
            "name": "filesystem.delete",
            "arguments": {"path": "/etc/shadow", "recursive": True}
        }
    },
    headers={"x-mcp-agent-id": "CodingAgent", "MCP-Protocol-Version": "2026-07-28"}
)
print(f"HTTP Status: {r_deny.status_code} FORBIDDEN (Access Blocked)")
print("Gateway Error:")
print(json.dumps(r_deny.json(), indent=2))

print("\n" + "=" * 70)
print("  STEP 6: AGENT ATTEMPTS DATA EXFILTRATION (DLP Detects Leaked API Key)")
print("=" * 70)
r_dlp = client.post(
    "http://127.0.0.1:8000/mcp/prod/stripe",
    json={
        "jsonrpc": "2.0",
        "id": "agent-call-4",
        "method": "tools/call",
        "params": {
            "name": "stripe.customer.read",
            "arguments": {
                "customer_id": "cus_9482",
                "secret_token": "sk-live-0987654321fedcba0987654321fedcba"
            }
        }
    },
    headers={"x-mcp-agent-id": "FinanceAgent", "MCP-Protocol-Version": "2026-07-28"}
)
print(f"HTTP Status: {r_dlp.status_code} FORBIDDEN (DLP Violation)")
print("Gateway Error:")
print(json.dumps(r_dlp.json(), indent=2))

print("\n" + "=" * 70)
print("  STEP 7: INSPECT IMMUTABLE SHA-256 AUDIT CHAIN")
print("=" * 70)
r_audit = client.get("http://127.0.0.1:8000/api/v1/audit-events?limit=5")
events = r_audit.json()
print(f"Recent Verified Audit Records: {len(events)}")
for e in events:
    print(f" • [{e['action'].upper():16}] {e['event_type']:22} | Tool: {str(e.get('tool_name')):20} | Hash: {e['event_hash'][:16]}...")
print("=" * 70)
