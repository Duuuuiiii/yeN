const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Menu,
  Notification,
  Tray,
  protocol,
  safeStorage,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");
const { Storage, atomicWrite } = require("./storage.cjs");
const { importMusic, registerMedia } = require("./media.cjs");
const { Assistant } = require("./ai.cjs");
const { News } = require("./news.cjs");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "yen-media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

app.setName("yeN");
app.setAppUserModelId("app.yen.study");
const testing = !app.isPackaged && process.env.SHIYE_TEST_DATA;
const customData = app.commandLine.getSwitchValue("data-dir");
if (customData) app.setPath("userData", path.resolve(customData));
else if (testing)
  app.setPath("userData", path.resolve(process.env.SHIYE_TEST_DATA));
else if (require("node:fs").existsSync("E:/yeN/UserData/data/current.json"))
  app.setPath("userData", "E:/yeN/UserData");
else app.setPath("userData", path.join(app.getPath("appData"), "yeN"));
app.setPath("sessionData", app.getPath("userData"));
let win,
  tray,
  store,
  news,
  assistant,
  backupTimer,
  backgroundMode = true,
  quitting = false,
  closeAction = "hide",
  trayHintShown = false,
  closing = false,
  permittedClose = false,
  closeTimeout,
  startupError;
const index = path.join(__dirname, "..", "dist", "index.html");
const indexURL = pathToFileURL(index).href;
function trusted(event) {
  if (
    !win ||
    event.sender !== win.webContents ||
    event.senderFrame !== win.webContents.mainFrame ||
    event.senderFrame.url !== indexURL
  )
    throw new Error("请求来源无效");
}
function handle(name, fn) {
  ipcMain.handle("shiye:" + name, async (event, ...args) => {
    trusted(event);
    if (startupError) throw startupError;
    return fn(...args);
  });
}
function requestBackup() {
  clearTimeout(backupTimer);
  backupTimer = setTimeout(
    () =>
      store.backup().catch((e) => console.error("Automatic backup failed:", e)),
    5000,
  );
}
async function dataInfo() {
  return {
    version: app.getVersion(),
    dataPath: store.root,
    backupPath: store.backupRoot,
    backups: await store.listBackups(),
    recovered: store.recovered,
  };
}
function registerIPC() {
  handle("background-mode", (enabled) => {
    backgroundMode = enabled !== false;
    return backgroundMode;
  });
  handle("ai-status", () => assistant.status());
  handle("ai-key", (key) => assistant.setKey(key));
  handle("ai-ask", (value) => assistant.ask(value));
  handle("video-search", (query) => {
    if (typeof query !== "string" || !query.trim() || query.length > 160)
      throw new Error("搜索词无效");
    return shell.openExternal(
      "https://search.bilibili.com/all?keyword=" + encodeURIComponent(query),
    );
  });
  handle("get-state", () => store.readState());
  handle("save-state", async (state) => {
    await store.saveState(state);
    requestBackup();
  });
  handle("get-asset", (id) => store.readAsset(id));
  handle("save-asset", (asset) => store.putAsset(asset));
  handle("list-assets", () => store.listAssets());
  handle("replace", async (data) => {
    await store.replace(data.model, data.assets);
    requestBackup();
  });
  handle("info", dataInfo);
  handle("open-data", () => shell.openPath(store.root));
  handle("open-backups", () => shell.openPath(store.backupRoot));
  handle("backup-now", async () => {
    await store.backup(true);
    return dataInfo();
  });
  handle("export-backup", async (model) => {
    const result = await dialog.showSaveDialog(win, {
      title: "导出 yeN 完整备份",
      defaultPath: path.join(
        app.getPath("documents"),
        "yeN备份-" + new Date().toISOString().slice(0, 10) + ".json",
      ),
      filters: [{ name: "yeN 备份", extensions: ["json"] }],
      properties: ["showOverwriteConfirmation", "createDirectory"],
    });
    if (result.canceled) return false;
    await store.exportFull(result.filePath, model);
    return true;
  });
  handle("restore-snapshot", (name) => store.restoreSnapshot(name));
  handle("import-music", async () => {
    const result = await dialog.showOpenDialog(win, {
      title: "导入本地音乐",
      filters: [{ name: "MP3 / FLAC 音乐", extensions: ["mp3", "flac"] }],
      properties: ["openFile", "multiSelections"],
    });
    if (result.canceled) return { imported: [], errors: [] };
    return importMusic(result.filePaths, store);
  });
  handle("news", (refresh) => (refresh ? news.refresh() : news.get()));
  handle("open-article", async (url) => {
    if (!news.hasURL(url)) throw new Error("原文链接无效");
    return shell.openExternal(url);
  });
  handle("notify", ({ title, body }) => {
    if (typeof title !== "string" || typeof body !== "string") return;
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title.slice(0, 100),
        body: body.slice(0, 500),
        icon: path.join(__dirname, "../build/icon.png"),
        silent: true,
      });
      notification.on("click", () => {
        win?.show();
        win?.focus();
      });
      notification.show();
    }
  });
  handle("export-file", async ({ name, bytes }) => {
    if (typeof name !== "string" || /[\\/]/.test(name))
      throw new Error("文件名无效");
    const result = await dialog.showSaveDialog(win, {
      title: "保存文件",
      defaultPath: path.join(app.getPath("documents"), name),
      properties: ["showOverwriteConfirmation", "createDirectory"],
    });
    if (result.canceled) return false;
    await atomicWrite(result.filePath, Buffer.from(bytes));
    return true;
  });
  ipcMain.on("shiye:ready-to-close", async (event, error) => {
    try {
      trusted(event);
    } catch {
      return;
    }
    if (!closing) return;
    clearTimeout(closeTimeout);
    if (error) {
      closing = false;
      dialog.showMessageBox(win, {
        type: "error",
        message: "内容尚未保存",
        detail: String(error) + "\n请先导出备份，再关闭软件。",
      });
      return;
    }
    await store.queue;
    try {
      await store.backup();
    } catch (e) {
      console.error("Backup on close failed:", e);
    }
    await saveWindow();
    if (closeAction === "hide") {
      closing = false;
      win.hide();
      if (!trayHintShown && tray) {
        trayHintShown = true;
        tray.displayBalloon({
          title: "yeN 正在后台运行",
          content: "点击右下角 yeN 图标可以重新打开，右键可彻底退出。",
          iconType: "info",
          noSound: true,
        });
      }
    } else {
      permittedClose = true;
      win.close();
    }
  });
}
function showWindow() {
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
function requestQuit() {
  quitting = true;
  if (win && !win.isDestroyed()) win.close();
  else app.quit();
}
function createTray() {
  tray = new Tray(path.join(__dirname, "../build/icon.ico"));
  const version = app.getVersion();
  tray.setToolTip(`yeN v${version} · 学习工作台`);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: `yeN v${version}`, enabled: false },
      { type: "separator" },
      { label: "打开 yeN", click: showWindow },
      { type: "separator" },
      { label: "彻底退出", click: requestQuit },
    ]),
  );
  tray.on("click", showWindow);
}
async function saveWindow() {
  if (win && !win.isDestroyed())
    await atomicWrite(
      path.join(app.getPath("userData"), "window.json"),
      JSON.stringify({
        bounds: win.getNormalBounds(),
        maximized: win.isMaximized(),
      }),
    ).catch(() => {});
}
async function createWindow() {
  let settings = {};
  try {
    settings = JSON.parse(
      await fs.readFile(
        path.join(app.getPath("userData"), "window.json"),
        "utf8",
      ),
    );
  } catch {}
  win = new BrowserWindow({
    width: settings.bounds?.width || 1440,
    height: settings.bounds?.height || 980,
    minWidth: 720,
    minHeight: 550,
    title: "yeN",
    backgroundColor: "#f4f6fa",
    icon: path.join(__dirname, "../build/icon.ico"),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false,
    },
  });
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "yeN",
        submenu: [
          {
            label: "保存",
            accelerator: "CmdOrCtrl+S",
            click: () => win.webContents.send("shiye:save-requested"),
          },
          { type: "separator" },
          { label: "彻底退出", click: requestQuit },
        ],
      },
      {
        label: "编辑",
        submenu: [
          { role: "undo", label: "撤销" },
          { role: "redo", label: "重做" },
          { type: "separator" },
          { role: "cut", label: "剪切" },
          { role: "copy", label: "复制" },
          { role: "paste", label: "粘贴" },
          { role: "selectAll", label: "全选" },
        ],
      },
      {
        label: "视图",
        submenu: [
          { role: "resetZoom", label: "实际大小" },
          { role: "zoomIn", label: "放大" },
          { role: "zoomOut", label: "缩小" },
          { role: "togglefullscreen", label: "全屏" },
        ],
      },
    ]),
  );
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (url !== indexURL) event.preventDefault();
  });
  win.webContents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
  win.webContents.session.setPermissionCheckHandler(() => false);
  win.webContents.on("will-attach-webview", (event) => event.preventDefault());
  win.on("ready-to-show", () => {
    if (settings.maximized) win.maximize();
    win.show();
  });
  win.on("close", (event) => {
    if (permittedClose) return;
    event.preventDefault();
    if (closing) return;
    closing = true;
    closeAction = quitting || !backgroundMode ? "quit" : "hide";
    win.webContents.send("shiye:closing");
    closeTimeout = setTimeout(async () => {
      const result = await dialog.showMessageBox(win, {
        type: "warning",
        message: "保存还没有完成",
        detail: "可以继续等待，或保持窗口打开以检查数据。",
        buttons: ["保持打开", "继续等待"],
        defaultId: 0,
        cancelId: 0,
      });
      closing = false;
      quitting = false;
      if (result.response === 1) win.close();
    }, 12000);
  });
  await win.loadFile(index);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    showWindow();
  });
  app
    .whenReady()
    .then(async () => {
      try {
        store = await new Storage(
          path.join(app.getPath("userData"), "data"),
        ).init();
      } catch (e) {
        startupError = e;
        dialog.showErrorBox("yeN无法读取数据", e.message);
        app.exit(1);
        return;
      }
      news = await new News(app.getPath("userData")).init();
      assistant = new Assistant(app.getPath("userData"), safeStorage);
      registerMedia(protocol, () => store);
      registerIPC();
      await createWindow();
      createTray();
    })
    .catch((e) => {
      console.error("yeN startup failed:", e);
      dialog.showErrorBox("yeN启动失败", e.message);
      app.exit(1);
    });
  app.on("window-all-closed", () => {
    if (quitting || permittedClose || !backgroundMode) app.quit();
  });
  app.on("before-quit", () => {
    quitting = true;
    clearTimeout(backupTimer);
  });
}
