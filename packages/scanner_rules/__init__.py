"""
MCPShield Scanner Rules & Security Analyzer
Audits MCP servers, configurations, tool definitions, and repositories for security risks.
Generates 0-100 risk score and SARIF 2.1.0 reports.
"""

from typing import Any, Dict, List, Optional
from enum import Enum
from pydantic import BaseModel, Field
import re
import json


class FindingSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


class SecurityFinding(BaseModel):
    id: str
    rule_id: str
    title: str
    description: str
    severity: FindingSeverity
    category: str
    tool_name: Optional[str] = None
    resource_uri: Optional[str] = None
    remediation: str
    cwe_id: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None


class ScanReport(BaseModel):
    target: str
    scan_type: str  # "remote_url", "local_config", "repository"
    risk_score: int  # 0-100 (0 = safe, 100 = critical risk)
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    info_count: int = 0
    total_tools: int = 0
    total_resources: int = 0
    findings: List[SecurityFinding] = Field(default_factory=list)
    timestamp: str = ""


# Rules Catalog
SCANNER_RULES = [
    # Critical Rules
    {
        "id": "MCP-SEC-001",
        "title": "Unrestricted Shell or Command Execution",
        "severity": FindingSeverity.CRITICAL,
        "category": "Arbitrary Code Execution",
        "cwe": "CWE-78",
        "patterns": [r"bash", r"sh\b", r"shell", r"exec(ute)?_command", r"terminal", r"run_script", r"powershell"],
        "remediation": "Restrict commands to an immutable allowlist of binary paths with no subshell evaluation, or require human approval.",
    },
    {
        "id": "MCP-SEC-002",
        "title": "Destructive Filesystem Deletion Capability",
        "severity": FindingSeverity.CRITICAL,
        "category": "Destructive File Operations",
        "cwe": "CWE-73",
        "patterns": [r"delete_file", r"delete_directory", r"rmdir", r"unlink", r"remove_tree", r"filesystem\.delete"],
        "remediation": "Impose strict path containment (chroot / sandbox), disallow recursive deletions, and enforce explicit human approval policies.",
    },
    {
        "id": "MCP-SEC-003",
        "title": "Arbitrary SQL Execution / Injection Risk",
        "severity": FindingSeverity.CRITICAL,
        "category": "Database Mutation",
        "cwe": "CWE-89",
        "patterns": [r"execute_sql", r"raw_query", r"run_sql", r"db_query", r"database\.execute"],
        "remediation": "Limit agent access to read-only views with parameterized queries; forbid raw DDL/DML execution without human verification.",
    },
    {
        "id": "MCP-SEC-004",
        "title": "Unrestricted Financial Mutation / Payment Transfer",
        "severity": FindingSeverity.CRITICAL,
        "category": "Financial Operations",
        "cwe": "CWE-284",
        "patterns": [r"refund", r"payout", r"transfer_funds", r"charge_card", r"create_payment"],
        "remediation": "Establish a hard autonomous limit (e.g. <= $100) and mandate cryptographic human approval for all higher thresholds.",
    },
    {
        "id": "MCP-SEC-005",
        "title": "Cloud Infrastructure Modification / Termination",
        "severity": FindingSeverity.CRITICAL,
        "category": "Cloud Security",
        "cwe": "CWE-269",
        "patterns": [r"terminate_instance", r"delete_cluster", r"drop_database", r"modify_iam", r"delete_bucket"],
        "remediation": "Require separate multi-party authorization and restrict agent cloud IAM roles to least-privilege read scopes.",
    },
    # High Rules
    {
        "id": "MCP-SEC-006",
        "title": "Unrestricted Filesystem Write",
        "severity": FindingSeverity.HIGH,
        "category": "File Access",
        "cwe": "CWE-22",
        "patterns": [r"write_file", r"create_file", r"overwrite_file", r"filesystem\.write"],
        "remediation": "Enforce strict directory sandboxing, forbid overwriting existing sensitive system files, and validate path traversal characters.",
    },
    {
        "id": "MCP-SEC-007",
        "title": "SSRF / Unrestricted Network Outbound Fetch",
        "severity": FindingSeverity.HIGH,
        "category": "Server-Side Request Forgery",
        "cwe": "CWE-918",
        "patterns": [r"fetch_url", r"http_get", r"curl", r"request_url", r"download_url", r"web_request"],
        "remediation": "Implement an outbound HTTP egress proxy blocking localhost, link-local (169.254.169.254), and private RFC1918 subnets.",
    },
    {
        "id": "MCP-SEC-008",
        "title": "Hardcoded Credentials or Secrets in Configuration",
        "severity": FindingSeverity.HIGH,
        "category": "Credential Exposure",
        "cwe": "CWE-798",
        "patterns": [r"(?i)(api[_-]?key|secret|password|bearer|token)\s*[:=]\s*['\"][a-zA-Z0-9_\-\.]{8,}['\"]"],
        "remediation": "Remove hardcoded credentials from tool metadata and configurations; leverage environment variables and secret stores.",
    },
    {
        "id": "MCP-SEC-009",
        "title": "Email or Communication Broadcast",
        "severity": FindingSeverity.HIGH,
        "category": "External Communication",
        "cwe": "CWE-284",
        "patterns": [r"send_email", r"post_slack_broadcast", r"send_sms", r"send_message_all"],
        "remediation": "Limit recipient domains, restrict bulk recipient lists, and monitor for unauthorized exfiltration.",
    },
    {
        "id": "MCP-SEC-010",
        "title": "Wildcard Permissions / Scope Proliferation",
        "severity": FindingSeverity.HIGH,
        "category": "Authorization",
        "cwe": "CWE-272",
        "patterns": [r"\*", r"all_tools", r"super_admin", r"unrestricted"],
        "remediation": "Replace wildcard tool permissions with granular tool-by-tool whitelisting.",
    },
    # Medium Rules
    {
        "id": "MCP-SEC-011",
        "title": "Missing Schema Parameter Constraints",
        "severity": FindingSeverity.MEDIUM,
        "category": "Input Validation",
        "cwe": "CWE-20",
        "patterns": [],
        "remediation": "Define strict JSON Schema types, minimum/maximum lengths, regex patterns, and disallowed properties.",
    },
    {
        "id": "MCP-SEC-012",
        "title": "Prompt Injection / Hidden Instruction Indicator",
        "severity": FindingSeverity.MEDIUM,
        "category": "Prompt Security",
        "cwe": "CWE-200",
        "patterns": [r"ignore\s+(all\s+)?(previous\s+)?instructions", r"system\s*prompt", r"confidential\s+token"],
        "remediation": "Sanitize tool descriptions and outputs to prevent indirect prompt injection and agent hijacking.",
    },
    {
        "id": "MCP-SEC-013",
        "title": "Unbounded Data Ingestion / Resource Leaks",
        "severity": FindingSeverity.MEDIUM,
        "category": "Resource Management",
        "cwe": "CWE-400",
        "patterns": [r"dump_database", r"list_all_users", r"download_all_files", r"export_all"],
        "remediation": "Implement strict server-side pagination, limit maximum returned items, and enforce rate limits.",
    },
    # Low & Informational Rules
    {
        "id": "MCP-SEC-014",
        "title": "Missing Tool Description",
        "severity": FindingSeverity.LOW,
        "category": "Auditability",
        "cwe": "CWE-1078",
        "patterns": [],
        "remediation": "Add descriptive metadata so agents and policies can accurately infer tool capabilities and side effects.",
    },
    {
        "id": "MCP-SEC-015",
        "title": "Unversioned MCP Server Specification",
        "severity": FindingSeverity.INFORMATIONAL,
        "category": "Specification Compliance",
        "cwe": "CWE-1078",
        "patterns": [],
        "remediation": "Explicitly declare MCP-Protocol-Version 2026-07-28 in server headers and capabilities.",
    },
]


class MCPScanner:
    """
    Security analyzer for MCP servers, tools, and configurations.
    """

    def scan_tools(self, tools: List[Dict[str, Any]], server_metadata: Optional[Dict[str, Any]] = None, target_name: str = "mcp-server") -> ScanReport:
        findings: List[SecurityFinding] = []
        finding_id_seq = 1

        for tool in tools:
            name = tool.get("name", "")
            desc = tool.get("description", "")
            schema = tool.get("inputSchema", {})
            schema_str = json.dumps(schema)
            combined_text = f"{name} {desc} {schema_str}"

            # Check for missing description
            if not desc or len(desc.strip()) < 5:
                findings.append(
                    SecurityFinding(
                        id=f"FIND-{finding_id_seq:04d}",
                        rule_id="MCP-SEC-014",
                        title="Missing Tool Description",
                        description=f"Tool '{name}' lacks a comprehensive description of its capabilities.",
                        severity=FindingSeverity.LOW,
                        category="Auditability",
                        tool_name=name,
                        remediation="Add a thorough description explaining the tool's behavior and potential side effects.",
                    )
                )
                finding_id_seq += 1

            # Check for missing schema constraints
            properties = schema.get("properties", {})
            if properties and not schema.get("required"):
                findings.append(
                    SecurityFinding(
                        id=f"FIND-{finding_id_seq:04d}",
                        rule_id="MCP-SEC-011",
                        title="Missing Schema Parameter Constraints",
                        description=f"Tool '{name}' accepts properties without required schema enforcement.",
                        severity=FindingSeverity.MEDIUM,
                        category="Input Validation",
                        tool_name=name,
                        remediation="Specify 'required' fields and input boundaries in inputSchema.",
                    )
                )
                finding_id_seq += 1

            # Check rule patterns
            for rule in SCANNER_RULES:
                if not rule.get("patterns"):
                    continue
                matched = False
                matched_snippet = ""
                for pat in rule["patterns"]:
                    m = re.search(pat, combined_text, re.IGNORECASE)
                    if m:
                        matched = True
                        matched_snippet = m.group(0)
                        break

                if matched:
                    findings.append(
                        SecurityFinding(
                            id=f"FIND-{finding_id_seq:04d}",
                            rule_id=rule["id"],
                            title=rule["title"],
                            description=f"Tool '{name}' exhibits capability matching '{matched_snippet}'.",
                            severity=rule["severity"],
                            category=rule["category"],
                            tool_name=name,
                            remediation=rule["remediation"],
                            cwe_id=rule.get("cwe"),
                            evidence={"matched_pattern": matched_snippet, "context": name},
                        )
                    )
                    finding_id_seq += 1

        # Check server metadata / configs for secret leaks
        if server_metadata:
            meta_str = json.dumps(server_metadata)
            sec_pat = re.compile(r"(?i)(api[_-]?key|secret|password|bearer|token)\s*[:=]\s*['\"][a-zA-Z0-9_\-\.]{8,}['\"]")
            if sec_pat.search(meta_str):
                findings.append(
                    SecurityFinding(
                        id=f"FIND-{finding_id_seq:04d}",
                        rule_id="MCP-SEC-008",
                        title="Hardcoded Credentials or Secrets in Configuration",
                        description="Sensitive credential or token detected in server metadata / configuration.",
                        severity=FindingSeverity.HIGH,
                        category="Credential Exposure",
                        remediation="Extract credentials to environment variables or an enterprise secret store.",
                    )
                )
                finding_id_seq += 1

        # Calculate counts
        crit = sum(1 for f in findings if f.severity == FindingSeverity.CRITICAL)
        high = sum(1 for f in findings if f.severity == FindingSeverity.HIGH)
        med = sum(1 for f in findings if f.severity == FindingSeverity.MEDIUM)
        low = sum(1 for f in findings if f.severity == FindingSeverity.LOW)
        info = sum(1 for f in findings if f.severity == FindingSeverity.INFORMATIONAL)

        # Risk Score Calculation (0-100, where 100 is most secure, or 0-100 penalty)
        # Based on user spec: "Produce a risk score: 0-100. Example: 47/100, Critical: 3, High: 6..."
        # Higher penalty = lower security score
        risk_penalty = (crit * 25) + (high * 12) + (med * 5) + (low * 2)
        security_score = max(0, min(100, 100 - risk_penalty))

        import datetime
        return ScanReport(
            target=target_name,
            scan_type="remote_url" if target_name.startswith("http") else "local_config",
            risk_score=security_score,
            critical_count=crit,
            high_count=high,
            medium_count=med,
            low_count=low,
            info_count=info,
            total_tools=len(tools),
            total_resources=0,
            findings=findings,
            timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        )

    def to_sarif(self, report: ScanReport) -> Dict[str, Any]:
        """Generate official SARIF 2.1.0 output for CI/CD and GitHub Security integration."""
        rules = []
        rule_map = {r["id"]: r for r in SCANNER_RULES}
        results = []

        for f in report.findings:
            rule_info = rule_map.get(f.rule_id, {})
            level_map = {
                FindingSeverity.CRITICAL: "error",
                FindingSeverity.HIGH: "error",
                FindingSeverity.MEDIUM: "warning",
                FindingSeverity.LOW: "note",
                FindingSeverity.INFORMATIONAL: "none",
            }
            results.append({
                "ruleId": f.rule_id,
                "level": level_map.get(f.severity, "warning"),
                "message": {"text": f"{f.title}: {f.description}"},
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": {"uri": report.target},
                        "region": {"startLine": 1}
                    }
                }],
                "properties": {
                    "tool": f.tool_name,
                    "remediation": f.remediation,
                    "cwe": f.cwe_id,
                }
            })

        for r in SCANNER_RULES:
            rules.append({
                "id": r["id"],
                "name": r["title"],
                "shortDescription": {"text": r["title"]},
                "help": {"text": r["remediation"]},
                "properties": {"category": r["category"], "cwe": r.get("cwe")}
            })

        return {
            "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
            "version": "2.1.0",
            "runs": [{
                "tool": {
                    "driver": {
                        "name": "MCPShield Security Scanner",
                        "version": "1.0.0",
                        "informationUri": "https://github.com/mcpshield/mcpshield",
                        "rules": rules,
                    }
                },
                "results": results
            }]
        }
