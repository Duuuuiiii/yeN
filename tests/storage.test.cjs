const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path");
const { Storage } = require("../desktop/storage.cjs");
const { parseFeed, safeArticleURL, sources } = require("../desktop/news.cjs");
const state = (title) => ({
  version: 2,
  notes: [
    { id: "n1", title, html: "<p>内容</p>", attachments: [], drawings: [] },
  ],
  tasks: [],
  goals: [],
  events: [],
  settings: { theme: "blue" },
  music: [],
});
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "yen-storage-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return new Storage(root).init();
}
test("serial writes, restart and previous-state recovery", async (t) => {
  const store = await fixture(t);
  await Promise.all([
    store.saveState(state("1")),
    store.saveState(state("2")),
    store.saveState(state("3")),
  ]);
  const second = await new Storage(store.root).init();
  assert.equal((await second.readState()).notes[0].title, "3");
  await fs.writeFile(path.join(second.dir, "state.json"), "invalid");
  assert.equal((await second.readState()).notes[0].title, "2");
  assert.equal(second.recovered, true);
});
test("asset roundtrip, immutable IDs and path traversal rejected", async (t) => {
  const store = await fixture(t);
  await store.putAsset({
    id: "test-asset",
    name: "音频.flac",
    type: "audio/flac",
    bytes: Buffer.from("test"),
  });
  assert.equal((await store.readAsset("test-asset")).bytes.toString(), "test");
  await assert.rejects(
    store.putAsset({
      id: "test-asset",
      name: "override",
      type: "audio/flac",
      bytes: Buffer.from("x"),
    }),
  );
  await assert.rejects(store.readAsset("../secret"));
  assert.throws(() =>
    store.putAsset({ id: "../secret", name: "x", type: "x", bytes: [] }),
  );
});
test("snapshots share asset library, restore across imports atomically", async (t) => {
  const store = await fixture(t);
  await store.putAsset({
    id: "asset-1",
    name: "文件.txt",
    type: "text/plain",
    bytes: Buffer.from("original"),
  });
  const a = state("original");
  a.notes[0].attachments = [{ id: "asset-1", name: "文件.txt", size: 8 }];
  await store.saveState(a);
  const name = await store.backup(true);
  const oldGeneration = store.generation;
  const b = state("imported");
  await store.replace(b, []);
  assert.notEqual(store.generation, oldGeneration);
  assert.equal((await store.readState()).notes[0].title, "imported");
  await store.restoreSnapshot(name);
  assert.equal((await store.readState()).notes[0].title, "original");
  assert.equal((await store.readAsset("asset-1")).bytes.toString(), "original");
  const snapshot = JSON.parse(
    await fs.readFile(path.join(store.backupRoot, name)),
  );
  assert.equal(snapshot.format, "yen-local-snapshot");
  assert.equal(snapshot.assets, undefined);
  await assert.rejects(store.restoreSnapshot("../state.json"));
});
test("bad import preserves existing state", async (t) => {
  const store = await fixture(t);
  await store.saveState(state("safe"));
  await assert.rejects(store.replace({ version: 9 }, []));
  assert.equal((await store.readState()).notes[0].title, "safe");
});
test("RSS parsing keeps source and real publication dates; rejects dangerous links and entities", () => {
  const xml =
    "<rss><channel><item><title>News &amp; facts</title><link>https://example.org/article</link><pubDate>Fri, 25 Sep 2026 08:00:00 GMT</pubDate><description><![CDATA[<p>Summary</p>]]></description></item><item><title>Bad</title><link>javascript:alert(1)</link></item></channel></rss>";
  const parsed = parseFeed(xml, sources[0]);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].published, "2026-09-25T08:00:00.000Z");
  assert.equal(parsed[0].title, "News & facts");
  assert.equal(parsed[0].summary, "Summary");
  assert.equal(safeArticleURL("http://127.0.0.1/a"), null);
  assert.equal(safeArticleURL("file:///secret"), null);
  assert.throws(() => parseFeed("<!DOCTYPE x><rss/>", sources[0]));
});
