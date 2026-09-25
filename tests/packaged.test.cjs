const { _electron: electron } = require("playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs/promises"),
  path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "..");
  const data = path.join(root, "test-results", "packaged-" + Date.now());
  await fs.mkdir(data, { recursive: true });
  const app = await electron.launch({
    executablePath: path.join(root, "release/win-unpacked/yeN.exe"),
    args: ["--data-dir=" + data, "--force-device-scale-factor=1"],
    timeout: 60000,
  });
  const win = await app.firstWindow();
  const errors = [];
  win.on("pageerror", (e) => errors.push(e.message));
  await win.emulateMedia({ reducedMotion: "reduce" });
  await win.waitForSelector(".today-grid");
  assert.equal(await app.evaluate(({ app }) => app.isPackaged), true);
  assert.ok(
    (await win.evaluate(() => window.shiyeDesktop.info())).dataPath.startsWith(
      data,
    ),
  );
  await win.getByRole("button", { name: "笔记", exact: true }).click();
  await win.locator("#note-title").fill("打包程序保存验证");
  await win.keyboard.press("Control+s");
  await win.waitForFunction(() =>
    document.querySelector("#toast")?.textContent.includes("已保存到电脑"),
  );
  await win.getByRole("button", { name: "音乐", exact: true }).click();
  await app.evaluate(
    ({ dialog }, files) => {
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: files,
      });
    },
    ["test-tone.mp3", "test-tone.flac"].map((n) =>
      path.join(root, "tests/fixtures", n),
    ),
  );
  await win.getByRole("button", { name: "导入音乐", exact: false }).click();
  await win.waitForSelector(".music-row");
  assert.equal(await win.locator(".music-row").count(), 2);
  await win.locator("[data-track-play]").last().click();
  await win.waitForFunction(
    () => document.querySelector("#music-elapsed")?.textContent !== "0:00",
  );
  await win.getByRole("button", { name: "暂停音乐", exact: true }).click();
  await win.getByRole("button", { name: "学习资讯", exact: true }).click();
  await win.waitForSelector(".news-card", { timeout: 60000 });
  assert.ok(await win.locator(".news-card").count());
  assert.deepEqual(errors, []);
  await app.close();
  console.log(
    "PASS: packaged executable, isolated data, keyboard save, native music import, FLAC decoding and live RSS.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
