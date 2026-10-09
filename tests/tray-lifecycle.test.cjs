const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { AppTray, TRAY_GUID } = require("../desktop/tray.cjs");
function fixture(isolated = false) {
  const created = [];
  class Tray extends EventEmitter {
    constructor(icon, guid) {
      super();
      this.guid = guid;
      this.destroyed = false;
      this.destroyCount = 0;
      created.push(this);
    }
    isDestroyed() {
      return this.destroyed;
    }
    destroy() {
      this.destroyed = true;
      this.destroyCount++;
    }
    setToolTip(text) {
      this.tip = text;
    }
    setContextMenu(menu) {
      this.menu = menu;
    }
  }
  let shows = 0,
    quits = 0;
  const manager = new AppTray({
    Tray,
    Menu: { buildFromTemplate: (list) => list },
    icon: "icon.ico",
    version: "0.8.3",
    isolated,
    showWindow: () => shows++,
    requestQuit: () => quits++,
  });
  return { manager, created, shows: () => shows, quits: () => quits };
}
test("test/preview profiles never create tray icons", () => {
  const f = fixture(true);
  assert.equal(f.manager.create(), null);
  f.manager.create();
  f.manager.destroy();
  assert.equal(f.created.length, 0);
});
test("repeated initialization reuses one stable icon; menu and quit cleanup work", () => {
  const f = fixture();
  const icon = f.manager.create();
  assert.equal(f.manager.create(), icon);
  assert.equal(f.created.length, 1);
  assert.equal(icon.guid, TRAY_GUID);
  icon.emit("click");
  icon.menu[2].click();
  icon.menu[4].click();
  assert.equal(f.shows(), 2);
  assert.equal(f.quits(), 1);
  f.manager.destroy();
  f.manager.destroy();
  assert.equal(icon.destroyCount, 1);
  const restored = f.manager.create();
  assert.notEqual(restored, icon);
  assert.equal(restored.guid, icon.guid);
  f.manager.destroy();
});
