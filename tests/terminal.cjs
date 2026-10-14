const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const folder = path.resolve(__dirname, "../.local/terminal-check");
  fs.mkdirSync(folder, { recursive: true });
  try {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 2560, height: 1440 },
      { width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(pathToFileURL(path.resolve(__dirname, "../index.html")).href + "#terminal");
      await page.locator("#term-in").waitFor({ state: "visible" });
      const input = page.locator("#term-in");
      const last = () => page.locator("#term-out .term-response").last();
      const ask = async (text, expected) => {
        await input.fill(text);
        await input.press("Enter");
        assert.match(await last().innerText(), expected, text);
      };
      await ask("hi", /Hi! What would you like to know/);
      await ask("Hello!", /Hi! What would you like to know/);
      await ask("hey Leo", /Hi! What would you like to know/);
      await ask("Why computer science?", /electrical and computer engineering/);
      await ask("What are you building?", /Cashew/);
      await ask("Do you play drums?", /Grade 8/);
      await ask("Tell me about From Scratch", /crafting game/);
      await ask("Which languages do you use?", /Python/);
      await ask("Tell me about Vestigo and your projects", /142 km/);
      await ask("Why is the sky blue?", /haven't written an answer/);
      await ask("this is a shipping question", /haven't written an answer/);
      await ask("<img src=x onerror=alert(1)>", /haven't written an answer/);
      await ask("__proto__", /haven't written an answer/);
      await ask("constructor", /haven't written an answer/);
      assert.equal(await page.locator("#term-out img").count(), 0);
      await ask("thanks", /Thanks for stopping by/);
      const count = await page.locator("#term-out .term-response").count();
      await input.fill("  ");
      await input.press("Enter");
      assert.equal(await page.locator("#term-out .term-response").count(), count);
      await input.press("ArrowUp");
      assert.equal(await input.inputValue(), "thanks");
      await page.locator("#term-clear").click();
      assert.equal(await page.locator("#term-out .term-response").count(), 1);
      await page.getByRole("button", { name: "What are you building?", exact: true }).click();
      assert.match(await last().innerText(), /Cashew/);
      await input.fill("How can I contact you?");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      assert.match(await last().innerText(), /zhouleo2007@gmail.com/);
      const overflow = await page.locator("#term").evaluate(el => el.scrollWidth > el.clientWidth);
      assert.equal(overflow, false);
      const bounds = await input.boundingBox();
      assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= viewport.width);
      assert.equal(errors.length, 0, errors.join("\n"));
      await page.locator("#term-clear").click();
      await ask("hi", /Hi! What would you like to know/);
      await page.screenshot({ path: path.join(folder, viewport.width + ".png") });
      await page.close();
      console.log("PASS terminal " + viewport.width + "x" + viewport.height);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
