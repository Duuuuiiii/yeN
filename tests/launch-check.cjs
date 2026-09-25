const { _electron: electron } = require("playwright");
const path = require("path"),
  fs = require("fs");
(async () => {
  const root = path.resolve(__dirname, "..");
  const data = path.join(root, "test-results", "launch-" + Date.now());
  fs.mkdirSync(data, { recursive: true });
  const app = await electron.launch({
    args: [root],
    env: { ...process.env, SHIYE_TEST_DATA: data },
    timeout: 60000,
  });
  const win = await app.firstWindow();
  win.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  win.on("console", (m) => {
    if (m.type() === "error") console.log("CONSOLE", m.text());
  });
  await win.waitForSelector(".today-grid", { timeout: 30000 });
  await win.screenshot({ path: path.join(root, "test-results/launch.png") });
  console.log(await win.title());
  console.log(await win.locator("#save-state").innerText());
  console.log(await win.evaluate(() => window.shiyeDesktop.info()));
  await win.getByRole("button", { name: "音乐", exact: true }).click();
  await win.screenshot({ path: path.join(root, "test-results/music.png") });
  await win.getByRole("button", { name: "学习资讯", exact: true }).click();
  await win.waitForSelector(".news-card", { timeout: 60000 });
  console.log("News cards:", await win.locator(".news-card").count());
  await win.screenshot({ path: path.join(root, "test-results/news.png") });
  await app.close();
  console.log("Launch, music and live news screens passed.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
