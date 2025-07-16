import asyncio
from playwright.async_api import async_playwright
import job_construction_ai
async def play_wright(url):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="domcontentloaded")
        await page.screenshot(path=f"life.png")
        text = await page.inner_text("body")
        html = await page.content()
        with open(f"life.html", "w") as f:
            f.write(html)
        print(html)
        return html

url = "https://www.careers-page.com/10folders/job/QW7V99WW"
html = asyncio.run(play_wright(url))
print(job_construction_ai.construct_job(html))
