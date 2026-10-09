const { _electron: electron } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "..");
  const data = path.join(root, "test-results", "window-" + Date.now());
  await fs.mkdir(data, { recursive: true });
  const launchOptions = {
    ...(process.env.YEN_PACKAGED
      ? {
          executablePath: path.join(root, "release/win-unpacked/yeN.exe"),
          args: ["--data-dir=" + data],
        }
      : { args: [root], env: { ...process.env, SHIYE_TEST_DATA: data } }),
    timeout: 60000,
  };
  let app = await electron.launch(launchOptions);
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
            .getBoundingClientRect().top - 48,
        ) < 1,
    );
    await win.keyboard.press("Escape");
    await win.locator("#note-title").fill("Layout persistence");
    await win
      .locator("#note-body")
      .fill("Unsaved typing survives sidebar changes.");
    await win.evaluate(() => {
      window.testNoteNode = document.querySelector("#note-body");
    });
    for (const [width, height] of [
      [2560, 1438],
      [1440, 960],
      [768, 650],
      [720, 550],
    ]) {
      await app.evaluate(
        ({ BrowserWindow }, size) =>
          BrowserWindow.getAllWindows()[0].setSize(...size),
        [width, height],
      );
      for (const collapsed of [false, true]) {
        const current = await win.evaluate(() =>
          document.body.classList.contains("sidebar-collapsed"),
        );
        if (current !== collapsed) await win.locator("#sidebar-toggle").click();
        const geometry = await win.evaluate(() => {
          const rect = (selector) =>
            document.querySelector(selector).getBoundingClientRect();
          const card = rect(".notes-layout"),
            editor = rect(".editor-sheet"),
            panel = rect(".editor-panel"),
            sidebar = rect(".sidebar"),
            player = rect("#music-player"),
            bar = rect(".window-bar"),
            main = rect("main");
          return {
            width: innerWidth,
            cardRight: card.right,
            cardLeft: card.left,
            cardBottom: card.bottom,
            sidebarRight: sidebar.right,
            sidebarWidth: sidebar.width,
            playerTop: player.top,
            playerLeft: player.left,
            mainTop: main.top,
            barBottom: bar.bottom,
            editorWidth: editor.width,
            panelWidth: panel.width,
            sameEditor:
              document.querySelector("#note-body") === window.testNoteNode,
            actionsDrag: getComputedStyle(
              document.querySelector(".top-actions"),
            ).getPropertyValue("-webkit-app-region"),
          };
        });
        assert.ok(
          geometry.width - geometry.cardRight <= 21,
          `Right gap at ${width}`,
        );
        assert.ok(
          geometry.cardLeft - geometry.sidebarRight <= 21,
          `Left gap at ${width}`,
        );
        assert.ok(
          geometry.playerTop - geometry.cardBottom <= 21,
          `Bottom gap at ${width}`,
        );
        assert.ok(
          geometry.mainTop - geometry.barBottom <= 1,
          "Duplicate top bar",
        );
        assert.ok(
          Math.abs(geometry.editorWidth - geometry.panelWidth) <= 1,
          "Editor width capped",
        );
        assert.ok(
          Math.abs(geometry.playerLeft - geometry.sidebarRight) <= 1,
          "Player does not follow sidebar",
        );
        if (collapsed) assert.equal(geometry.sidebarWidth, 60);
        assert.equal(geometry.sameEditor, true);
        assert.equal(geometry.actionsDrag, "no-drag");
      }
    }
    await win.keyboard.press("Control+s");
    await win.waitForFunction(
      () =>
        document.querySelector("#save-state").textContent === "已保存到电脑",
    );
    const state = await win.evaluate(() => window.shiyeDesktop.getState());
    assert.equal(state.settings.sidebarCollapsed, true);
    assert.ok(
      state.notes.some(
        (note) =>
          note.title === "Layout persistence" &&
          note.html.includes("Unsaved typing"),
      ),
    );
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].setSize(1440, 960),
    );
    await win.screenshot({ path: path.join(data, "fluid-notes.png") });
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
    await app.close();
    app = await electron.launch(launchOptions);
    const restored = await app.firstWindow();
    await restored.waitForSelector("#note-title");
    assert.equal(
      await restored.evaluate(() =>
        document.body.classList.contains("sidebar-collapsed"),
      ),
      true,
    );
    assert.equal(
      await restored.locator("#note-title").inputValue(),
      "Layout persistence",
    );
    console.log(
      "PASS: native themes and controls; fluid notes at 2560/1440/768/720; one top bar; sidebar and player alignment; sidebar changes preserve editor and saved text; fullscreen, maximize and restore.",
    );
  } finally {
    await app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
