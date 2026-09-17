"""
MCPShield Real Production Cloud Database Connect & Provisioning Tool
Switches MCPShield from local SQLite to real, live Serverless PostgreSQL (Neon / Supabase).
No mock data: provisions real production schema and validates live cloud connectivity.
"""

import sys
import os
import asyncio
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text


async def connect_and_migrate(raw_url: str):
    raw_url = raw_url.strip().strip("'").strip('"')

    # Normalize for asyncpg
    if raw_url.startswith("postgres://"):
        norm_url = "postgresql+asyncpg://" + raw_url[len("postgres://"):]
    elif raw_url.startswith("postgresql://") and "+asyncpg" not in raw_url:
        norm_url = "postgresql+asyncpg://" + raw_url[len("postgresql://"):]
    else:
        norm_url = raw_url

    # asyncpg expects ssl directly in connect_args, not in query string
    if "?" in norm_url:
        clean_url = norm_url.split("?")[0]
    else:
        clean_url = norm_url

    print("\n" + "=" * 65)
    print("TESTING LIVE CONNECTION TO REAL PRODUCTION CLOUD DATABASE")
    print("=" * 65)
    
    host_display = clean_url.split("@")[-1].split("/")[0] if "@" in clean_url else "cloud-host"
    print(f"Target Host: {host_display}")
    print("Connecting via asyncpg with SSL encryption...")

    engine = create_async_engine(
        clean_url,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"ssl": "require"}
    )

    try:
        # 1. Test raw query
        async with engine.begin() as conn:
            res = await conn.execute(text("SELECT version(), current_database(), current_user;"))
            row = res.fetchone()
            print(f"\n[OK] Connection Established Successfully!")
            print(f"     Database Engine: {row[0].split()[0]} {row[0].split()[1]}")
            print(f"     Database Name:   {row[1]}")
            print(f"     Connected User:  {row[2]}")

        # 2. Provision real production schema
        print("\n[STEP 2] Creating all production tables (ACID relational schema)...")
        from apps.api.models import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[OK] All 12 production tables created successfully in cloud!")

        # 3. Provision initial production workspace
        print("\n[STEP 3] Initializing production workspace & security policies...")
        SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        from apps.api.database import seed_initial_data
        async with SessionLocal() as db:
            await seed_initial_data(db)
        print("[OK] Production workspace 'prod', policies, and admin user seeded!")

        # 4. Write to .env
        env_file = ROOT_DIR / ".env"
        env_lines = []
        if env_file.exists():
            with open(env_file, "r", encoding="utf-8") as f:
                env_lines = [l for l in f.readlines() if not l.startswith("DATABASE_URL=")]
        
        env_lines.insert(0, f"DATABASE_URL={clean_url}\n")
        with open(env_file, "w", encoding="utf-8") as f:
            f.writelines(env_lines)

        print("\n" + "=" * 65)
        print(">>> SUCCESS: MCPSHIELD IS NOW 100% CONNECTED TO REAL CLOUD DATABASE! <<<")
        print("=" * 65)
        print(f"Saved to .env: DATABASE_URL={clean_url[:40]}••••\n")
        print("Next step: Restart the API server or container to use live cloud Postgres!")

    except Exception as e:
        print(f"\n[ERROR] Connection failed: {e}")
        print("\nTroubleshooting tips:")
        print("1. Ensure your Neon / Supabase database password is correct.")
        print("2. Ensure sslmode=require is enabled.")
        print("3. Check that your cloud database allows connections from all IPs (0.0.0.0/0).")
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help", "help"):
        print("\nMCPShield Cloud PostgreSQL Provisioning Tool")
        print("Usage:")
        print("  python scripts/connect_production_db.py \"postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require\"")
        print("\nDirect Signup:")
        print("  1. Sign up free at: https://console.neon.tech/signup")
        print("  2. Create a project and copy your connection string.")
        print("  3. Run this script to instantly migrate and connect.")
        sys.exit(0)

    if len(sys.argv) > 1:
        target_url = sys.argv[1]
    else:
        print("Paste your real Neon or Supabase PostgreSQL connection string:")
        target_url = input("> ")

    if not target_url.strip():
        print("No connection string provided. Exiting.")
        sys.exit(1)

    asyncio.run(connect_and_migrate(target_url))
