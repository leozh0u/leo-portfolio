const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  const output = path.resolve(__dirname, "../.local/content-check");
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 2560, height: 1440 },
      { width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      for (const room of ["hero", "work", "projects"]) {
        await page.goto(pathToFileURL(path.resolve(__dirname, "../index.html")).href + "#" + room);
        await page.evaluate(() => document.fonts.ready);
        const section = page.locator("#" + room);
        const overflow = await section.locator(".gate, .lego-card, .wip, .hero-copy").evaluateAll(elements =>
          elements.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.innerText));
        assert.deepEqual(overflow, [], "Text overflow at " + viewport.width + " in " + room);
        if (room === "work") {
          const text = await section.innerText();
          assert.match(text, /invitation-only AWS beta/);
          assert.match(text, /Hudl IQ.*merged/);
          assert.match(text, /pull request is still in review/);
          assert.match(text, /early integration work/);
          assert.match(text, /experimenting with Postgres\/pgvector/);
          assert.match(text, /LangGraph\/FFmpeg/);
          assert.doesNotMatch(text, /32 editable templates|under two minutes/);
          assert.doesNotMatch(text, /Founding Engineer|200,000/);
        }
        if (room === "projects") {
          for (const filename of ["perch.webp", "notch-apple.webp"]) {
            const img = section.locator('img[src$="' + filename + '"]');
            await img.scrollIntoViewIfNeeded();
            await img.evaluate(el => el.decode());
            assert(await img.evaluate(el => el.naturalWidth > 0));
          }
          assert.match(await section.innerText(), /extension of Boring Notch/);
          assert.equal(await section.locator('a[href*="edgeML-audio"]').count(), 0);
          await section.locator('a[href="https://github.com/leozh0u/perch"]').scrollIntoViewIfNeeded();
        }
        await page.screenshot({ path: path.join(output, viewport.width + "-" + room + ".png") });
      }
      assert.deepEqual(errors, []);
      await page.close();
      console.log("PASS content " + viewport.width + "x" + viewport.height);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
