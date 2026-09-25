const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { createReadStream } = require("node:fs");

const MAX_ASSET = 200 * 1024 * 1024;
function checkId(id) {
  if (typeof id !== "string" || !/^[\w-]{1,128}$/.test(id))
    throw new Error("无效的文件标识");
  return id;
}
function validateState(value) {
  if (!value || value.version !== 2 || !value.settings)
    throw new Error("不支持的数据版本");
  for (const key of ["notes", "tasks", "goals", "events"]) {
    if (!Array.isArray(value[key]) || value[key].length > 10000)
      throw new Error("数据结构无效");
    const ids = new Set();
    for (const item of value[key]) {
      checkId(item.id);
      if (ids.has(item.id) || typeof item.title !== "string")
        throw new Error("记录无效");
      ids.add(item.id);
    }
  }
  for (const note of value.notes) {
    if (
      typeof note.html !== "string" ||
      !Array.isArray(note.attachments) ||
      !Array.isArray(note.drawings)
    )
      throw new Error("笔记无效");
    note.attachments.forEach((a) => checkId(a.id));
    note.drawings.forEach((d) => {
      checkId(d.id);
      checkId(d.assetId);
    });
  }
  const text = JSON.stringify(value);
  if (Buffer.byteLength(text) > 30 * 1024 * 1024)
    throw new Error("文字数据过大");
  return text;
}

async function atomicWrite(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = file + "." + crypto.randomUUID() + ".tmp";
  try {
    const handle = await fs.open(temp, "wx");
    try {
      await handle.writeFile(content);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fs.rename(temp, file);
  } catch (e) {
    await fs.rm(temp, { force: true }).catch(() => {});
    throw e;
  }
}

class Storage {
  constructor(root) {
    this.root = path.resolve(root);
    this.queue = Promise.resolve();
    this.lastBackup = 0;
    this.recovered = false;
  }
  async init() {
    await fs.mkdir(this.root, { recursive: true });
    this.backupRoot = path.join(this.root, "backups");
    await fs.mkdir(this.backupRoot, { recursive: true });
    try {
      const pointer = JSON.parse(
        await fs.readFile(path.join(this.root, "current.json"), "utf8"),
      );
      if (!/^generation-[\w-]+$/.test(pointer.generation))
        throw new Error("目录索引无效");
      this.generation = pointer.generation;
    } catch (e) {
      if (e.code !== "ENOENT")
        throw new Error("数据目录索引损坏，请从备份恢复。");
      this.generation = "generation-" + crypto.randomUUID();
      await fs.mkdir(path.join(this.root, this.generation, "assets"), {
        recursive: true,
      });
      await atomicWrite(
        path.join(this.root, "current.json"),
        JSON.stringify({ generation: this.generation }),
      );
    }
    await fs.mkdir(this.assetsDir, { recursive: true });
    return this;
  }
  get dir() {
    return path.join(this.root, this.generation);
  }
  get assetsDir() {
    return path.join(this.dir, "assets");
  }
  enqueue(fn) {
    const pending = this.queue.then(fn);
    this.queue = pending.catch(() => {});
    return pending;
  }
  async readState() {
    await this.queue;
    try {
      const value = JSON.parse(
        await fs.readFile(path.join(this.dir, "state.json"), "utf8"),
      );
      validateState(value);
      return value;
    } catch (e) {
      if (e.code === "ENOENT") return null;
      try {
        const value = JSON.parse(
          await fs.readFile(path.join(this.dir, "state.previous.json"), "utf8"),
        );
        validateState(value);
        await atomicWrite(
          path.join(this.dir, "state.json"),
          JSON.stringify(value),
        );
        this.recovered = true;
        return value;
      } catch {
        throw new Error("笔记数据读取失败；原文件已保留，请从自动备份恢复。");
      }
    }
  }
  saveState(state) {
    const text = validateState(state);
    return this.enqueue(async () => {
      const file = path.join(this.dir, "state.json");
      try {
        await atomicWrite(
          path.join(this.dir, "state.previous.json"),
          await fs.readFile(file),
        );
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      await atomicWrite(file, text);
    });
  }
  putAsset(asset) {
    checkId(asset?.id);
    if (typeof asset.name !== "string" || typeof asset.type !== "string")
      throw new Error("文件信息无效");
    const data = Buffer.from(asset.bytes || []);
    if (data.length > MAX_ASSET) throw new Error("单个文件不能超过 200 MB");
    return this.enqueue(async () => {
      const file = path.join(this.assetsDir, asset.id);
      // Asset IDs are immutable; older automatic backups keep referring to the same bytes.
      try {
        await fs.access(file + ".json");
        throw new Error("文件标识已存在");
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      await atomicWrite(file + ".bin", data);
      await atomicWrite(
        file + ".json",
        JSON.stringify({
          id: asset.id,
          name: asset.name,
          type: asset.type,
          size: data.length,
        }),
      );
    });
  }
  async readAsset(id) {
    checkId(id);
    await this.queue;
    try {
      const meta = JSON.parse(
        await fs.readFile(path.join(this.assetsDir, id + ".json"), "utf8"),
      );
      return {
        ...meta,
        bytes: await fs.readFile(path.join(this.assetsDir, id + ".bin")),
      };
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }
  async listAssets() {
    await this.queue;
    const names = (await fs.readdir(this.assetsDir)).filter((n) =>
      n.endsWith(".json"),
    );
    const assets = [];
    for (const name of names) {
      const asset = await this.readAsset(name.slice(0, -5));
      if (asset) assets.push(asset);
    }
    return assets;
  }
  async backup(force = false) {
    return this.enqueue(async () => {
      if (!force && Date.now() - this.lastBackup < 15 * 60 * 1000) return null;
      let model;
      try {
        model = JSON.parse(
          await fs.readFile(path.join(this.dir, "state.json"), "utf8"),
        );
      } catch (e) {
        if (e.code === "ENOENT") return null;
        throw e;
      }
      validateState(model);
      const name =
        "yeN自动快照-" +
        new Date().toISOString().replace(/[:.]/g, "-") +
        ".json";
      await atomicWrite(
        path.join(this.backupRoot, name),
        JSON.stringify({
          format: "yen-local-snapshot",
          version: 1,
          exported: new Date().toISOString(),
          generation: this.generation,
          model,
        }),
      );
      this.lastBackup = Date.now();
      const backups = (await fs.readdir(this.backupRoot))
        .filter((n) => /^yeN自动快照-.*\.json$/.test(n))
        .sort()
        .reverse();
      for (const old of backups.slice(7))
        await fs.unlink(path.join(this.backupRoot, old));
      return name;
    });
  }
  async listBackups() {
    await this.queue;
    return Promise.all(
      (await fs.readdir(this.backupRoot))
        .filter((n) => /^yeN自动快照-.*\.json$/.test(n))
        .sort()
        .reverse()
        .map(async (name) => ({
          name,
          size: (await fs.stat(path.join(this.backupRoot, name))).size,
        })),
    );
  }
  exportFull(destination, currentModel) {
    if (currentModel) validateState(currentModel);
    return this.enqueue(async () => {
      const model =
        currentModel ||
        JSON.parse(
          await fs.readFile(path.join(this.dir, "state.json"), "utf8"),
        );
      validateState(model);
      const temp = destination + "." + crypto.randomUUID() + ".tmp";
      await fs.mkdir(path.dirname(destination), { recursive: true });
      const handle = await fs.open(temp, "wx");
      try {
        const header = JSON.stringify({
          format: "shiye-backup",
          version: 2,
          exported: new Date().toISOString(),
          model,
        });
        await handle.writeFile(header.slice(0, -1) + ',"assets":[');
        let first = true;
        for (const file of (await fs.readdir(this.assetsDir)).filter((x) =>
          x.endsWith(".json"),
        )) {
          const meta = JSON.parse(
            await fs.readFile(path.join(this.assetsDir, file), "utf8"),
          );
          checkId(meta.id);
          const prefix =
            JSON.stringify(meta).slice(0, -1) +
            ',"data":"data:' +
            meta.type.replace(/[^\w/+.-]/g, "") +
            ";base64,";
          await handle.writeFile((first ? "" : ",") + prefix);
          first = false;
          let carry = Buffer.alloc(0);
          for await (const chunk of createReadStream(
            path.join(this.assetsDir, meta.id + ".bin"),
          )) {
            const joined = Buffer.concat([carry, chunk]);
            const full = joined.length - (joined.length % 3);
            await handle.writeFile(joined.subarray(0, full).toString("base64"));
            carry = joined.subarray(full);
          }
          if (carry.length) await handle.writeFile(carry.toString("base64"));
          await handle.writeFile('"}');
        }
        await handle.writeFile("]}");
        await handle.sync();
        await handle.close();
        await fs.rename(temp, destination);
      } catch (e) {
        await handle.close().catch(() => {});
        await fs.rm(temp, { force: true }).catch(() => {});
        throw e;
      }
    });
  }
  async restoreSnapshot(name) {
    if (typeof name !== "string" || !/^yeN自动快照-[\dTZ.-]+\.json$/.test(name))
      throw new Error("快照名称无效");
    const snapshot = JSON.parse(
      await fs.readFile(path.join(this.backupRoot, name), "utf8"),
    );
    if (
      snapshot.format !== "yen-local-snapshot" ||
      !/^generation-[\w-]+$/.test(snapshot.generation)
    )
      throw new Error("快照格式无效");
    const text = validateState(snapshot.model);
    await fs.access(path.join(this.root, snapshot.generation, "assets"));
    await this.backup(true);
    return this.enqueue(async () => {
      await atomicWrite(
        path.join(this.root, snapshot.generation, "state.json"),
        text,
      );
      await atomicWrite(
        path.join(this.root, "current.json"),
        JSON.stringify({ generation: snapshot.generation }),
      );
      this.generation = snapshot.generation;
      return snapshot.model;
    });
  }
  async replace(state, assets) {
    const text = validateState(state);
    if (!Array.isArray(assets) || assets.length > 50000)
      throw new Error("文件列表无效");
    const ids = new Set();
    for (const a of assets) {
      checkId(a.id);
      if (
        ids.has(a.id) ||
        typeof a.name !== "string" ||
        typeof a.type !== "string" ||
        Buffer.from(a.bytes).length > MAX_ASSET
      )
        throw new Error("备份文件无效");
      ids.add(a.id);
    }
    await this.backup(true);
    return this.enqueue(async () => {
      const generation = "generation-" + crypto.randomUUID();
      const next = path.join(this.root, generation);
      await fs.mkdir(path.join(next, "assets"), { recursive: true });
      for (const a of assets) {
        const bytes = Buffer.from(a.bytes);
        await atomicWrite(path.join(next, "assets", a.id + ".bin"), bytes);
        await atomicWrite(
          path.join(next, "assets", a.id + ".json"),
          JSON.stringify({
            id: a.id,
            name: a.name,
            type: a.type,
            size: bytes.length,
          }),
        );
      }
      await atomicWrite(path.join(next, "state.json"), text);
      // Only swap the pointer after all imported state and assets have been written.
      await atomicWrite(
        path.join(this.root, "current.json"),
        JSON.stringify({ generation }),
      );
      this.generation = generation;
      // Previous generations are deliberately retained as another recovery path.
    });
  }
}
module.exports = { Storage, atomicWrite, validateState, checkId };
