"""
Unit tests for Scanner and Security Analyzer.
"""

from packages.scanner_rules import MCPScanner, FindingSeverity


def test_scanner_detects_dangerous_tools():
    scanner = MCPScanner()
    tools = [
        {
            "name": "filesystem.delete",
            "description": "Unrestricted recursive deletion of filesystem directory",
            "inputSchema": {"type": "object", "properties": {"path": {"type": "string"}}}
        },
        {
            "name": "database.execute_sql",
            "description": "Execute raw SQL query against database",
            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}}
        },
        {
            "name": "safe_tool",
            "description": "A completely safe read only tool",
            "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}
        }
    ]

    report = scanner.scan_tools(tools, target_name="test-server")
    assert report.total_tools == 3
    assert report.critical_count >= 2
    assert report.risk_score < 70  # Risk score penalized due to critical vulnerabilities

    rule_ids = [f.rule_id for f in report.findings]
    assert "MCP-SEC-002" in rule_ids  # Destructive Filesystem
    assert "MCP-SEC-003" in rule_ids  # SQL execution

    sarif = scanner.to_sarif(report)
    assert sarif["version"] == "2.1.0"
    assert len(sarif["runs"][0]["results"]) >= 2
