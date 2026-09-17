import asyncio
import os
import shutil
from pathlib import Path
from playwright.async_api import async_playwright

async def record_demo():
    output_dir = Path("videos")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    docs_dir = Path("docs")
    docs_dir.mkdir(parents=True, exist_ok=True)

    print("Launching browser with video recording enabled...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            record_video_dir=str(output_dir),
            record_video_size={"width": 1280, "height": 800}
        )
        
        page = await context.new_page()
        
        print("Navigating to MCPShield Web Console...")
        try:
            await page.goto("http://127.0.0.1:8000", wait_until="networkidle", timeout=15000)
        except Exception:
            await page.goto("http://127.0.0.1:8000", timeout=15000)
            
        await page.wait_for_timeout(2000)

        # Check if login is needed
        email_input = page.locator('input[type="email"], input[placeholder*="email" i]')
        if await email_input.count() > 0 and await email_input.is_visible():
            print("Logging in as admin...")
            await email_input.fill("admin@acme.ai")
            pwd_input = page.locator('input[type="password"]')
            await pwd_input.fill("admin12345!")
            submit_btn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')
            await submit_btn.click()
            await page.wait_for_timeout(3000)

        print("Recording Dashboard overview...")
        await page.mouse.wheel(0, 300)
        await page.wait_for_timeout(2000)
        await page.mouse.wheel(0, -300)
        await page.wait_for_timeout(1500)

        # Click through tabs
        tabs = ["Servers", "Tools", "Policies", "Simulator", "Audit", "Settings"]
        for tab_name in tabs:
            tab = page.locator(f'button:has-text("{tab_name}"), a:has-text("{tab_name}")').first
            if await tab.count() > 0:
                try:
                    print(f"Showing tab: {tab_name}...")
                    await tab.click()
                    await page.wait_for_timeout(2500)
                    await page.mouse.wheel(0, 200)
                    await page.wait_for_timeout(1500)
                    await page.mouse.wheel(0, -200)
                    await page.wait_for_timeout(1000)
                except Exception as e:
                    print(f"Skipping {tab_name}: {e}")

        # Return to Dashboard
        dashboard_tab = page.locator('button:has-text("Dashboard"), button:has-text("Overview")').first
        if await dashboard_tab.count() > 0:
            await dashboard_tab.click()
            await page.wait_for_timeout(2000)

        print("Finalizing video recording...")
        video_path = await page.video.path()
        await page.close()
        await context.close()
        await browser.close()
        
        final_dest = docs_dir / "mcpshield_demo.webm"
        if os.path.exists(video_path):
            shutil.copy(video_path, str(final_dest))
            print(f"Video saved successfully to: {final_dest.resolve()}")
            print(f"File size: {os.path.getsize(final_dest)} bytes")

if __name__ == "__main__":
    asyncio.run(record_demo())
