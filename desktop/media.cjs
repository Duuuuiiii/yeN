const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { Readable } = require("node:stream");
const { checkId } = require("./storage.cjs");

async function importMusic(paths, store) {
  const imported = [],
    errors = [];
  const { parseFile } = await import("music-metadata");
  for (const file of paths) {
    try {
      const ext = path.extname(file).toLowerCase();
      if (![".mp3", ".flac"].includes(ext))
        throw new Error("仅支持 MP3 和 FLAC");
      const stat = await fsp.stat(file);
      if (stat.size > 200 * 1024 * 1024) throw new Error("单曲超过 200 MB");
      let tags = {};
      try {
        tags = await parseFile(file, { skipCovers: true });
      } catch {
        throw new Error("无法识别音频格式");
      }
      const id = crypto.randomUUID();
      const type = ext === ".flac" ? "audio/flac" : "audio/mpeg";
      await store.putAsset({
        id,
        name: path.basename(file),
        type,
        bytes: await fsp.readFile(file),
      });
      imported.push({
        id: crypto.randomUUID(),
        assetId: id,
        title: tags.common?.title || path.basename(file, ext),
        artist: tags.common?.artist || "本地音乐",
        album: tags.common?.album || "",
        duration: tags.format?.duration || 0,
        format: ext.slice(1).toUpperCase(),
        name: path.basename(file),
        size: stat.size,
      });
    } catch (e) {
      errors.push({ name: path.basename(file), message: e.message });
    }
  }
  return { imported, errors };
}

function registerMedia(protocol, getStore) {
  protocol.handle("yen-media", async (request) => {
    try {
      const url = new URL(request.url);
      if (url.hostname !== "asset") return new Response(null, { status: 404 });
      const id = checkId(decodeURIComponent(url.pathname.slice(1)));
      const store = getStore();
      await store.queue;
      const meta = JSON.parse(
        await fsp.readFile(path.join(store.assetsDir, id + ".json"), "utf8"),
      );
      const file = path.join(store.assetsDir, id + ".bin");
      const size = (await fsp.stat(file)).size;
      const headers = {
        "Content-Type": meta.type || "application/octet-stream",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      };
      let start = 0,
        end = size - 1,
        status = 200;
      const range = request.headers.get("range");
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) return new Response(null, { status: 416 });
        if (match[1]) {
          start = Number(match[1]);
          if (match[2]) end = Math.min(Number(match[2]), size - 1);
        } else if (match[2]) start = Math.max(0, size - Number(match[2]));
        if (start > end || start >= size || start < 0)
          return new Response(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${size}` },
          });
        status = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
      }
      headers["Content-Length"] = String(Math.max(0, end - start + 1));
      if (request.method === "HEAD" || size === 0)
        return new Response(null, { status, headers });
      return new Response(
        Readable.toWeb(fs.createReadStream(file, { start, end })),
        { status, headers },
      );
    } catch {
      return new Response(null, { status: 404 });
    }
  });
}
module.exports = { importMusic, registerMedia };
