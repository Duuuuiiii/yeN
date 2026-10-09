const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { Updates } = require("../desktop/updates.cjs");
function fixture() {
  const updater = new EventEmitter();
  let downloads = 0,
    installs = 0;
  updater.checkForUpdates = async () => {
    updater.emit("update-available", { version: "0.9.0" });
    return { isUpdateAvailable: true };
  };
  updater.downloadUpdate = async () => {
    downloads++;
    updater.emit("download-progress", { percent: 42 });
    updater.emit("update-downloaded", { version: "0.9.0" });
  };
  updater.quitAndInstall = () => {
    installs++;
    updater.quitAndInstallCalled = true;
  };
  const updates = new Updates(updater, {
    version: "0.8.0",
    cachePath: "E:/test-cache",
  });
  return {
    updater,
    updates,
    downloads: () => downloads,
    installs: () => installs,
  };
}
test("duplicate checks download once; ordinary quit cannot install", async () => {
  const f = fixture();
  const first = f.updates.check();
  assert.equal(f.updates.check(), first);
  await first;
  await f.updates.check();
  assert.equal(f.downloads(), 1);
  assert.equal(f.updater.autoInstallOnAppQuit, false);
  assert.equal(f.updater.allowDowngrade, false);
  assert.equal(f.installs(), 0);
  assert.equal(f.updates.status().phase, "downloaded");
});
test("save/backup failure blocks installation and permits retry", async () => {
  const f = fixture();
  await f.updates.check();
  let allowed = false;
  await assert.rejects(
    f.updates.installAfterSave(
      async () => {
        throw new Error("disk full");
      },
      (value) => {
        allowed = value;
      },
    ),
    /更新已暂停/,
  );
  assert.equal(f.installs(), 0);
  assert.equal(allowed, false);
  assert.equal(f.updates.status().phase, "downloaded");
  const order = [];
  await f.updates.installAfterSave(
    async () => {
      order.push("saved and backed up");
    },
    (value) => {
      allowed = value;
      order.push("permit quit");
    },
  );
  assert.deepEqual(order, ["saved and backed up", "permit quit"]);
  assert.equal(f.installs(), 1);
  assert.equal(allowed, true);
});
test("network error is recoverable and details never expose paths or tokens", async () => {
  const f = fixture();
  f.updater.checkForUpdates = async () => {
    throw new Error("secret path or token");
  };
  const status = await f.updates.check();
  assert.equal(status.phase, "error");
  assert.ok(!JSON.stringify(status).includes("secret"));
  await assert.rejects(
    f.updates.installAfterSave(
      async () => {},
      () => {},
    ),
    /没有下载完成/,
  );
});
test("installer failure restores window close protection", async () => {
  const f = fixture();
  await f.updates.check();
  f.updater.quitAndInstall = () => {
    throw new Error("spawn failed");
  };
  const flags = [];
  await assert.rejects(
    f.updates.installAfterSave(
      async () => {},
      (flag) => flags.push(flag),
    ),
    /未能启动/,
  );
  assert.deepEqual(flags, [true, false]);
  assert.equal(f.updates.status().phase, "downloaded");
});
