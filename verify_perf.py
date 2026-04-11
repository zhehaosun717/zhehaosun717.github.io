import asyncio
from playwright.async_api import async_playwright
import sys

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(err.message))

        print("Navigating to http://localhost:4000...")
        await page.goto("http://localhost:4000")

        # Wait for loader to finish or hide it
        print("Waiting for page load...")
        try:
            await page.wait_for_selector("#loader", state="hidden", timeout=10000)
        except Exception:
            # Force hide if it's stuck
            await page.evaluate("document.querySelector('#loader').style.display = 'none'")

        print("Simulating mouse moves over Three.js canvas...")
        canvas = await page.wait_for_selector("canvas#three-canvas")
        if canvas:
            box = await canvas.bounding_box()
            if box:
                # Move mouse around to trigger Three.js raycasting and interaction
                await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                await page.mouse.move(box["x"] + box["width"] / 4, box["y"] + box["height"] / 4)
                await asyncio.sleep(0.5)

        print("Navigating to sub-page to test background.js canvas...")
        await page.goto("http://localhost:4000/projects/game-project.html")

        try:
            await page.wait_for_selector("#loader", state="hidden", timeout=10000)
        except Exception:
            pass

        canvas_bg = await page.wait_for_selector("canvas#three-bg", timeout=5000)
        if canvas_bg:
            box = await canvas_bg.bounding_box()
            if box:
                # Move mouse around to trigger Three.js raycasting and interaction
                await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                await page.mouse.move(box["x"] + box["width"] / 4, box["y"] + box["height"] / 4)
                await asyncio.sleep(0.5)


        print("Simulating scroll to .works section on main page...")
        await page.goto("http://localhost:4000")
        try:
            await page.wait_for_selector("#loader", state="hidden", timeout=10000)
        except Exception:
            await page.evaluate("document.querySelector('#loader').style.display = 'none'")

        await page.evaluate("document.querySelector('.works').scrollIntoView()")
        await asyncio.sleep(1)

        print("Simulating mouse moves over project cards...")
        cards = await page.query_selector_all(".project-card")
        for card in cards:
            box = await card.bounding_box()
            if box:
                # Move mouse over card to trigger fluid distortion
                await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                await asyncio.sleep(0.2)

                # Move mouse away to trigger decay
                await page.mouse.move(box["x"] + box["width"] + 500, box["y"] + box["height"] + 500)
                await asyncio.sleep(0.1)

        await browser.close()

        if errors:
            print("Errors detected during verification:")
            for err in errors:
                print(f"  - {err}")
            sys.exit(1)
        else:
            print("Verification passed successfully! No errors detected.")

if __name__ == "__main__":
    asyncio.run(main())
