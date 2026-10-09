const { _electron: electron } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
(async () => {
  const root = path.resolve(__dirname, "..");
  const data = path.join(root, "test-results", "updates-" + Date.now());
  const bytes = Buffer.alloc(256 * 1024, 91);
  const hash = crypto.createHash("sha512").update(bytes).digest("base64");
  let badHash = false;
  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/latest.yml")) {
      res.end(
        `version: 99.0.0\nfiles:\n  - url: test-setup.exe\n    sha512: ${badHash ? Buffer.alloc(64).toString("base64") : hash}\n    size: ${bytes.length}\npath: test-setup.exe\nsha512: ${hash}\nreleaseDate: '2026-10-09T00:00:00Z'\n`,
      );
    } else if (req.url.startsWith("/test-setup.exe")) {
      res.setHeader("Content-Length", bytes.length);
      res.end(bytes);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let application;
  try {
    application = await electron.launch({
      args: [path.join(root, "tests/update-fixture.cjs")],
      env: { ...process.env, SHIYE_TEST_DATA: data },
      timeout: 60000,
    });
    await application.firstWindow();
    const url = `http://127.0.0.1:${server.address().port}/`;
    const run = () =>
      application.evaluate(
        (_electron, feed) => globalThis.runUpdateFixture(feed),
        url,
      );
    const result = await run();
    assert.equal(result.status.phase, "downloaded");
    assert.ok(result.file.startsWith(path.join(data, "UpdateCache")));
    assert.deepEqual(await fs.readFile(result.file), bytes);
    await fs.rm(path.join(data, "UpdateCache"), {
      recursive: true,
      force: true,
    });
    badHash = true;
    const corrupt = await run();
    assert.equal(corrupt.status.phase, "error");
    console.log(
      "PASS: real updater downloads to E, verifies SHA-512, rejects corrupt packages.",
    );
  } finally {
    if (application) await application.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
