import sys
import os
import asyncio
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from apps.api.database import engine, AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        u_count = await db.execute(text("SELECT count(*) FROM users;"))
        print("Live Neon PostgreSQL Users:", u_count.scalar())
        t_count = await db.execute(text("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"))
        print("Live Neon PostgreSQL Tables in 'public':", t_count.scalar())
        srv = await db.execute(text("SELECT name, slug, endpoint_url FROM mcp_servers;"))
        print("Live MCP Servers in Neon:")
        for row in srv.fetchall():
            print(f" - {row[0]} ({row[1]}): {row[2]}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
