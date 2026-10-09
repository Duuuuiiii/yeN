// A stable icon identity plus explicit destruction prevents stale tray entries.
const TRAY_GUID = "8c0f0839-951f-4b46-bca6-0e098e58c5ae";
class AppTray {
  constructor({
    Tray,
    Menu,
    icon,
    version,
    showWindow,
    requestQuit,
    isolated,
  }) {
    Object.assign(this, {
      Tray,
      Menu,
      icon,
      version,
      showWindow,
      requestQuit,
      isolated,
    });
    this.tray = null;
  }
  create() {
    if (this.isolated) return null;
    if (this.tray && !this.tray.isDestroyed()) return this.tray;
    const tray = new this.Tray(this.icon, TRAY_GUID);
    tray.setToolTip(`yeN v${this.version} · 学习工作台`);
    tray.setContextMenu(
      this.Menu.buildFromTemplate([
        { label: `yeN v${this.version}`, enabled: false },
        { type: "separator" },
        { label: "打开 yeN", click: this.showWindow },
        { type: "separator" },
        { label: "彻底退出", click: this.requestQuit },
      ]),
    );
    tray.on("click", this.showWindow);
    this.tray = tray;
    return tray;
  }
  destroy() {
    if (this.tray && !this.tray.isDestroyed()) this.tray.destroy();
    this.tray = null;
  }
}
module.exports = { AppTray, TRAY_GUID };
