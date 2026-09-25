const { _electron: electron } = require("playwright");
const fs = require("node:fs/promises"),
  path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "..");
  const output = path.resolve(root, "../../outputs");
  const profile = path.join(root, "test-results", "preview-" + Date.now());
  await fs.mkdir(profile, { recursive: true });
  const app = await electron.launch({
    args: [root, "--force-device-scale-factor=1"],
    env: { ...process.env, SHIYE_TEST_DATA: profile },
  });
  const win = await app.firstWindow();
  await win.emulateMedia({ reducedMotion: "reduce" });
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setSize(1440, 1000),
  );
  await win.waitForSelector(".today-grid");
  await win.screenshot({ path: path.join(output, "yeN-界面预览.png") });
  await win.getByRole("button", { name: "学习资讯", exact: true }).click();
  await win.waitForSelector(".news-card", { timeout: 60000 });
  await win.screenshot({ path: path.join(output, "yeN-资讯预览.png") });
  await app.close();
  console.log("Preview images saved.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
