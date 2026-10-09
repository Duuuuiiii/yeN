const path = require("node:path");
const fs = require("node:fs");

class Updates {
  constructor(
    updater,
    { version, cachePath, supported = true, onStatus = () => {} },
  ) {
    this.updater = updater;
    this.onStatus = onStatus;
    this.state = {
      phase: supported ? "idle" : "unsupported",
      version,
      cachePath,
      progress: 0,
    };
    this.pending = null;
    if (!updater) return;
    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;
    updater.allowDowngrade = false;
    updater.allowPrerelease = false;
    updater.on("checking-for-update", () =>
      this.set({ phase: "checking", message: "" }),
    );
    updater.on("update-not-available", () =>
      this.set({ phase: "current", checkedAt: Date.now() }),
    );
    updater.on("update-available", (info) =>
      this.set({ phase: "available", nextVersion: info.version, progress: 0 }),
    );
    updater.on("download-progress", (info) =>
      this.set({
        phase: "downloading",
        progress: Math.max(0, Math.min(100, info.percent)),
      }),
    );
    updater.on("update-downloaded", (info) =>
      this.set({
        phase: "downloaded",
        nextVersion: info.version,
        progress: 100,
      }),
    );
    updater.on("error", () => this.fail());
  }
  status() {
    return { ...this.state };
  }
  set(value) {
    Object.assign(this.state, value);
    this.onStatus(this.status());
  }
  fail(message = "更新暂时失败，请检查网络后重试。现有内容不受影响。") {
    this.set({ phase: "error", message });
  }
  check() {
    if (
      !this.updater ||
      ["downloaded", "installing"].includes(this.state.phase)
    )
      return Promise.resolve(this.status());
    if (this.pending) return this.pending;
    this.pending = (async () => {
      try {
        const result = await this.updater.checkForUpdates();
        if (result?.isUpdateAvailable) {
          this.set({ phase: "downloading", progress: 0 });
          await this.updater.downloadUpdate();
        }
      } catch {
        this.fail();
      } finally {
        this.pending = null;
      }
      return this.status();
    })();
    return this.pending;
  }
  async installAfterSave(saveAndBackup, permitQuit) {
    if (this.state.phase !== "downloaded")
      throw new Error("更新还没有下载完成");
    this.set({ phase: "installing" });
    try {
      await saveAndBackup();
    } catch {
      this.set({
        phase: "downloaded",
        message: "保存或备份失败，更新已暂停，请先检查本地数据。",
      });
      throw new Error(this.state.message);
    }
    permitQuit(true);
    try {
      this.updater.quitAndInstall(true, true);
      if (!this.updater.quitAndInstallCalled)
        throw new Error("安装程序未能启动");
    } catch {
      permitQuit(false);
      this.set({ phase: "downloaded", message: "安装程序未能启动，请重试。" });
      throw new Error(this.state.message);
    }
  }
  start() {
    if (!this.updater) return;
    this.initialTimer = setTimeout(() => this.check(), 10000);
    this.interval = setInterval(() => this.check(), 6 * 60 * 60 * 1000);
    this.initialTimer.unref?.();
    this.interval.unref?.();
  }
  stop() {
    clearTimeout(this.initialTimer);
    clearInterval(this.interval);
  }
}

function createUpdates(app, { isolated = false, onStatus } = {}) {
  const cachePath = path.join(app.getPath("userData"), "UpdateCache");
  const supported =
    app.isPackaged &&
    process.platform === "win32" &&
    !process.env.PORTABLE_EXECUTABLE_FILE &&
    !isolated;
  let updater = null;
  if (supported) {
    const tempPath = path.join(cachePath, "temp");
    fs.mkdirSync(tempPath, { recursive: true });
    process.env.TEMP = tempPath;
    process.env.TMP = tempPath;
    app.setPath("temp", tempPath);
    const { NsisUpdater } = require("electron-updater");
    updater = new NsisUpdater();
    // Keep the standard Electron HTTP executor while relocating its cache.
    Object.defineProperty(updater.app, "baseCachePath", {
      get: () => cachePath,
    });
    updater.logger = null;
    updater.installDirectory = path.dirname(app.getPath("exe"));
  }
  return new Updates(updater, {
    version: app.getVersion(),
    cachePath,
    supported,
    onStatus,
  });
}
module.exports = { Updates, createUpdates };
