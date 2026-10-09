const { _electron: electron } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "..");
  const data = path.join(root, "test-results", "window-" + Date.now());
  await fs.mkdir(data, { recursive: true });
  const app = await electron.launch({
    ...(process.env.YEN_PACKAGED
      ? {
          executablePath: path.join(root, "release/win-unpacked/yeN.exe"),
          args: ["--data-dir=" + data],
        }
      : { args: [root], env: { ...process.env, SHIYE_TEST_DATA: data } }),
    timeout: 60000,
  });
  try {
    const win = await app.firstWindow();
    await win.emulateMedia({ reducedMotion: "reduce" });
    await win.waitForSelector(".today-grid");
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].setSize(720, 550),
    );
    await win.locator('[data-page="settings"]').click();
    for (const mode of ["dark", "light", "system"]) {
      await win.locator(`[data-appearance="${mode}"]`).click();
      await win.waitForTimeout(100);
      assert.equal(
        await app.evaluate(({ nativeTheme }) => nativeTheme.themeSource),
        mode,
      );
      const geometry = await win.evaluate(() => {
        const bar = document.querySelector(".window-bar");
        const settings = document
          .querySelector("#settings-nav")
          .getBoundingClientRect();
        const nav = document
          .querySelector(".sidebar nav")
          .getBoundingClientRect();
        const main = document.querySelector("main").getBoundingClientRect();
        return {
          barColor: getComputedStyle(bar).backgroundColor,
          drag: getComputedStyle(bar).getPropertyValue("-webkit-app-region"),
          settingsBottom: settings.bottom,
          navBottom: nav.bottom,
          settingsTop: settings.top,
          height: innerHeight,
          mainBottom: main.bottom,
          playerTop: document
            .querySelector("#music-player")
            .getBoundingClientRect().top,
          overflow: document.documentElement.scrollHeight > innerHeight,
        };
      });
      if (mode === "dark") assert.equal(geometry.barColor, "rgb(27, 34, 45)");
      if (mode === "light")
        assert.equal(geometry.barColor, "rgb(255, 255, 255)");
      assert.equal(geometry.drag, "drag");
      assert.ok(geometry.settingsBottom <= geometry.height);
      assert.ok(geometry.navBottom <= geometry.settingsTop);
      assert.ok(geometry.mainBottom <= geometry.playerTop + 1);
      assert.equal(geometry.overflow, false);
    }
    await win.locator('[data-appearance="dark"]').click();
    await win.screenshot({ path: path.join(data, "dark-window.png") });
    await win.locator('[data-page="notes"]').click();
    await win.locator('[data-action="fullscreen-note"]').click();
    await win.waitForFunction(
      () =>
        Math.abs(
          document
            .querySelector(".notes-layout.fullscreen-note")
            .getBoundingClientRect().top - 38,
        ) < 1,
    );
    await win.keyboard.press("Escape");
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].maximize(),
    );
    assert.equal(
      await app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].isMaximized(),
      ),
      true,
    );
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].unmaximize(),
    );
    console.log(
      "PASS: theme follows native controls; drag region; 720x550 navigation and settings reachable; content avoids player; note fullscreen retains title bar; maximize/restore.",
    );
  } finally {
    await app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
