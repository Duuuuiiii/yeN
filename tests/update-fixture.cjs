const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { NsisUpdater } = require("electron-updater");
const { Updates } = require("../desktop/updates.cjs");
app.setPath("userData", process.env.SHIYE_TEST_DATA);
globalThis.runUpdateFixture = async (url) => {
  const data = app.getPath("userData");
  const config = path.join(data, "update-test.yml");
  fs.writeFileSync(config, "updaterCacheDirName: payload\n");
  const updater = new NsisUpdater();
  updater.forceDevUpdateConfig = true;
  updater.updateConfigPath = config;
  Object.defineProperty(updater.app, "baseCachePath", {
    get: () => path.join(data, "UpdateCache"),
  });
  updater.setFeedURL({ provider: "generic", url });
  updater.disableDifferentialDownload = true;
  updater.logger = null;
  const controller = new Updates(updater, {
    version: app.getVersion(),
    cachePath: path.join(data, "UpdateCache"),
  });
  const status = await controller.check();
  return { status, file: updater.installerPath };
};
app.whenReady().then(() => {
  const window = new BrowserWindow({ show: false });
  window.loadURL("about:blank");
});
