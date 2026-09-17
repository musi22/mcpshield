"""
Market & Competitor Research Script for MCP Security Tools
"""

import httpx
import json

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

queries = [
    "model-context-protocol security",
    "mcp gateway",
    "mcp proxy",
    "mcp firewall",
    "mcp policy engine"
]

print("=" * 60)
print("  COMPETITIVE MARKET RESEARCH: MODEL CONTEXT PROTOCOL")
print("=" * 60)

for q in queries:
    url = f"https://api.github.com/search/repositories?q={q.replace(' ', '+')}&sort=stars&order=desc"
    try:
        r = httpx.get(url, headers=headers, timeout=10.0)
        if r.status_code == 200:
            data = r.json()
            total = data.get("total_count", 0)
            print(f"\nQuery: '{q}' -> Total Repos: {total}")
            for item in data.get("items", [])[:5]:
                print(f"  • {item['full_name']} (Stars: {item['stargazers_count']})")
                print(f"    Desc: {item.get('description', 'No description')}")
                print(f"    URL:  {item['html_url']}")
        else:
            print(f"Query '{q}' returned status {r.status_code}")
    except Exception as e:
        print(f"Error querying {q}: {e}")

print("=" * 60)
