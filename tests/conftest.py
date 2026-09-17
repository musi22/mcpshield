import os
import sys
import pytest
import pytest_asyncio

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Ensure disposable test database tables and default tenant seed exist."""
    from apps.api.database import init_db, seed_initial_data, AsyncSessionLocal

    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)


