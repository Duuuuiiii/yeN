const { _electron: electron } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const results = path.join(root, "test-results");
const profile = path.join(results, "desktop-" + Date.now());
let app,
  win,
  errors = [];
async function launch() {
  app = await electron.launch({
    args: [root, "--force-device-scale-factor=1"],
    env: { ...process.env, SHIYE_TEST_DATA: profile },
    timeout: 60000,
  });
  win = await app.firstWindow();
  await win.emulateMedia({ reducedMotion: "reduce" });
  win.on("pageerror", (e) => errors.push(e.message));
  await win.waitForSelector(
    ".today-grid,.notes-layout,.music-library,.settings-grid",
    { timeout: 30000 },
  );
}
async function nav(name) {
  await win.getByRole("button", { name, exact: true }).first().click();
}
(async () => {
  await fs.mkdir(profile, { recursive: true });
  await launch();
  assert.equal(await win.evaluate(() => typeof require), "undefined");
  await nav("笔记");
  await win.locator("#note-title").fill("桌面持久保存测试");
  await win.locator("#note-body").fill("立即关闭也应保存此内容。");
  await app.close();
  await launch();
  await win.waitForSelector("#note-title");
  assert.equal(
    await win.locator("#note-title").inputValue(),
    "桌面持久保存测试",
  );
  assert.ok((await win.locator("#note-body").innerText()).includes("立即关闭"));
  await nav("音乐");
  const fixtures = ["test-tone.mp3", "test-tone.flac"].map((n) =>
    path.join(root, "tests/fixtures", n),
  );
  await app.evaluate(({ dialog }, files) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: files });
  }, fixtures);
  await win.getByRole("button", { name: "导入音乐", exact: false }).click();
  await win.waitForSelector(".music-row", { timeout: 30000 });
  assert.equal(await win.locator(".music-row").count(), 2);
  await win.locator("[data-track-play]").nth(0).click();
  await win.waitForFunction(
    () => document.querySelector("#music-elapsed")?.textContent !== "0:00",
    { timeout: 15000 },
  );
  await win.getByRole("button", { name: "暂停音乐", exact: true }).click();
  assert.equal(await win.locator("#music-duration").textContent(), "0:04");
  await win.locator("#music-seek").fill("2");
  await win.locator("#music-seek").dispatchEvent("input");
  await win.locator("#music-seek").dispatchEvent("change");
  assert.equal(await win.locator("#music-elapsed").textContent(), "0:02");
  await win.locator("[data-track-play]").nth(1).click();
  await win.waitForFunction(
    () => document.querySelector("#music-elapsed")?.textContent !== "0:00",
    { timeout: 15000 },
  );
  await nav("笔记");
  assert.equal(
    await win.getByRole("button", { name: "暂停音乐", exact: true }).count(),
    1,
  );
  await win.getByRole("button", { name: "暂停音乐", exact: true }).click();
  await nav("音乐");
  await win.screenshot({ path: path.join(results, "music-playing.png") });
  await win.getByRole("button", { name: "学习资讯", exact: true }).click();
  await win.waitForSelector(".news-card", { timeout: 60000 });
  const realTitle = await win.locator(".news-title").first().innerText();
  assert.ok(realTitle.length > 4);
  await win.locator("[data-news-note]").first().click();
  await nav("笔记");
  await win.locator('[data-folder="资讯收藏"]').click();
  assert.ok(
    (await win.locator("#note-list-items").innerText()).includes(realTitle),
  );
  await nav("设置");
  await win.getByRole("button", { name: "立即备份" }).click();
  await win.waitForTimeout(500);
  const info = await win.evaluate(() => window.shiyeDesktop.info());
  assert.ok(info.backups.length >= 1);
  const before = await win.evaluate(() => window.shiyeDesktop.getState());
  assert.equal(before.music.length, 2);
  const backup = path.join(results, "desktop-export.json");
  await app.evaluate(({ dialog }, file) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: file });
  }, backup);
  await win.getByRole("button", { name: "导出完整备份" }).click();
  await win.waitForFunction(() =>
    document.querySelector("#toast")?.textContent.includes("完整备份已导出"),
  );
  const exported = JSON.parse(await fs.readFile(backup, "utf8"));
  assert.equal(exported.model.music.length, 2);
  assert.equal(exported.assets.length, 2);
  await win.locator("#import-picker").setInputFiles(backup);
  await win.getByRole("button", { name: "替换并恢复" }).click();
  await win.waitForFunction(() =>
    document.querySelector("#toast")?.textContent.includes("备份已恢复"),
  );
  await nav("音乐");
  assert.equal(await win.locator(".music-row").count(), 2);
  await win.locator("[data-track-play]").nth(1).click();
  await win.waitForFunction(
    () => document.querySelector("#music-elapsed")?.textContent !== "0:00",
  );
  await win.getByRole("button", { name: "暂停音乐", exact: true }).click();
  await app.close();
  await launch();
  await nav("音乐");
  assert.equal(await win.locator(".music-row").count(), 2);
  for (const width of [1440, 1024, 768]) {
    await app.evaluate(
      ({ BrowserWindow }, w) =>
        BrowserWindow.getAllWindows()[0].setSize(w, 960),
      width,
    );
    for (const name of [
      "今日",
      "笔记",
      "日程",
      "任务",
      "学习目标",
      "音乐",
      "学习资讯",
      "设置",
    ]) {
      await nav(name);
      assert.equal(
        await win.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
        `overflow ${width} ${name}`,
      );
    }
  }
  assert.deepEqual(errors, []);
  await app.close();
  console.log(
    "PASS: native close/reopen persistence, sandbox, MP3 + FLAC playback/seeking, navigation playback continuity, live RSS + save-to-note, snapshot, full music backup/import, restart library, eight pages at three widths.",
  );
})().catch(async (e) => {
  console.error(e);
  if (win)
    await win
      .screenshot({ path: path.join(results, "failure.png") })
      .catch(() => {});
  if (app) await app.close().catch(() => {});
  process.exit(1);
});
