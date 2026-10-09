const { _electron: electron } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

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
  const appProcess = application.process();
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
      "v0.8.3",
    );
    assert.ok(
      (await window.locator("#footer-version").innerText()).includes("v0.8.3"),
    );
    assert.ok((await window.title()).includes("v0.8.3"));

    await window.locator('[data-page="settings"]').click();
    assert.equal(await window.locator(".about-version").innerText(), "v0.8.3");
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

    await application.evaluate(({ Tray, Notification }) => {
      globalThis.backgroundNotifications = 0;
      Tray.prototype.displayBalloon = () =>
        globalThis.backgroundNotifications++;
      Notification.prototype.show = () => globalThis.backgroundNotifications++;
    });

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

    assert.equal(
      await application.evaluate(() => globalThis.backgroundNotifications),
      0,
      "进入后台不应发送通知",
    );
    const second = spawn(
      process.env.YEN_PACKAGED
        ? path.join(root, "release/win-unpacked/yeN.exe")
        : require("electron"),
      process.env.YEN_PACKAGED ? ["--data-dir=" + data] : [root],
      { env: { ...process.env, SHIYE_TEST_DATA: data }, stdio: "ignore" },
    );
    try {
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("第二个进程没有退出")),
          10000,
        );
        second.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        second.once("exit", (code) => {
          clearTimeout(timer);
          resolve(code);
        });
      });
      assert.equal(result, 0, "重复启动应正常退出第二个进程");
    } finally {
      if (second.exitCode === null) second.kill();
    }
    await window.waitForFunction(() => document.visibilityState === "visible");
    assert.equal(
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].isVisible(),
      ),
      true,
    );

    await window.evaluate(() => window.shiyeDesktop.setBackgroundMode(false));
    const exit = new Promise((resolve) =>
      appProcess.once("exit", () => {
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
      if (appProcess.exitCode === null) appProcess.kill();
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
