const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { Storage } = require("../desktop/storage.cjs");
test("streaming export preserves bytes across non-aligned chunks and protects destination on failure", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "yen-export-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = await new Storage(path.join(root, "data")).init();
  await store.saveState({
    version: 2,
    notes: [],
    tasks: [],
    events: [],
    goals: [],
    settings: {},
    music: [],
  });
  const binary = crypto.randomBytes(512 * 1024 + 13);
  await store.putAsset({
    id: "a1",
    name: "a.bin",
    type: "application/octet-stream",
    bytes: binary,
  });
  const dest = path.join(root, "backup.json");
  const latest = {
    version: 2,
    notes: [
      {
        id: "latest",
        title: "尚未落盘的最新内容",
        html: "<p>最新内容</p>",
        attachments: [],
        drawings: [],
      },
    ],
    tasks: [],
    events: [],
    goals: [],
    settings: {},
    music: [],
  };
  await store.exportFull(dest, latest);
  const parsed = JSON.parse(await fs.readFile(dest, "utf8"));
  assert.equal(parsed.model.notes[0].title, "尚未落盘的最新内容");
  assert.deepEqual(
    Buffer.from(parsed.assets[0].data.split(",")[1], "base64"),
    binary,
  );
  await fs.unlink(path.join(store.assetsDir, "a1.bin"));
  await assert.rejects(store.exportFull(dest));
  assert.equal(
    JSON.parse(await fs.readFile(dest, "utf8")).format,
    "shiye-backup",
  );
});
