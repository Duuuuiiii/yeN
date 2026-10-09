const { _electron: electron } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

(async () => {
  const root = path.resolve(__dirname, "..");
  const data = path.join(root, "test-results", "tray-" + Date.now());
  await fs.mkdir(data, { recursive: true });
  const application = await electron.launch({
    ...(process.env.YEN_PACKAGED
      ? {
          executablePath: path.join(root, "release/win-unpacked/yeN.exe"),
          args: ["--data-dir=" + data],
        }
      : {
          args: [root],
          env: { ...process.env, SHIYE_TEST_DATA: data },
        }),
    timeout: 60000,
  });
  let exited = false;
  try {
    let window;
    for (let tries = 0; tries < 100 && !window; tries += 1) {
      [window] = application.windows();
      if (!window) await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(window, "主窗口没有创建");
    await window.waitForSelector(".today-grid");

    assert.equal(
      await window.locator("#sidebar-version").innerText(),
      "v0.8.1",
    );
    assert.ok(
      (await window.locator("#footer-version").innerText()).includes("v0.8.1"),
    );
    assert.ok((await window.title()).includes("v0.8.1"));

    await window.locator('[data-page="settings"]').click();
    assert.equal(await window.locator(".about-version").innerText(), "v0.8.1");
    assert.equal(
      await window.locator("#update-status button").isDisabled(),
      true,
    );
    await window.locator('[data-appearance="dark"]').click();
    assert.equal(
      await window.evaluate(() => document.body.dataset.appearance),
      "dark",
    );
    assert.equal(
      await window.evaluate(
        () => getComputedStyle(document.documentElement).colorScheme,
      ),
      "dark",
    );
    await window.locator('[data-appearance="light"]').click();
    assert.equal(
      await window.evaluate(() => document.body.dataset.appearance),
      "light",
    );

    const state = await window.evaluate(() => window.shiyeDesktop.getState());
    assert.equal(state.settings.background, true);

    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].close(),
    );
    await new Promise((resolve) => setTimeout(resolve, 700));
    assert.equal(
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].isVisible(),
      ),
      false,
    );

    await application.evaluate(({ app }) => app.emit("second-instance"));
    await window.waitForFunction(() => document.visibilityState === "visible");
    assert.equal(
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].isVisible(),
      ),
      true,
    );

    await window.evaluate(() => window.shiyeDesktop.setBackgroundMode(false));
    const exit = new Promise((resolve) =>
      application.process().once("exit", () => {
        exited = true;
        resolve();
      }),
    );
    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].close(),
    );
    await Promise.race([
      exit,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("关闭后台运行后，程序没有退出")),
          10000,
        ),
      ),
    ]);
    console.log(
      "PASS: close hides to tray, second launch restores window, disabling background exits",
    );
  } finally {
    if (!exited) {
      await Promise.race([
        application.close().catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      if (application.process().exitCode === null) application.process().kill();
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
