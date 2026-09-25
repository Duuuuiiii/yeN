const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { Assistant, validatePlan } = require("../desktop/ai.cjs");
test("AI plan validation rejects bad dates, excessive duration and unbounded plans", () => {
  const session = {
    title: "线性代数",
    date: "2026-09-26",
    time: "20:00",
    minutes: 45,
  };
  assert.equal(validatePlan({ sessions: [session] }).sessions[0].minutes, 45);
  for (const change of [
    { date: "2026-02-30" },
    { time: "24:30" },
    { minutes: 0 },
    { minutes: 900 },
    { title: "" },
  ])
    assert.throws(() =>
      validatePlan({ sessions: [{ ...session, ...change }] }),
    );
  assert.throws(() => validatePlan({ sessions: Array(31).fill(session) }));
});
test("AI uses encrypted key store, fixed official endpoint and rejects auth/invalid output", async (t) => {
  const root = path.resolve("test-results/ai-unit-" + Date.now());
  await fs.mkdir(root, { recursive: true });
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const safe = {
    isEncryptionAvailable: () => true,
    encryptString: (s) => Buffer.from(s.split("").reverse().join("")),
    decryptString: (b) => b.toString().split("").reverse().join(""),
  };
  let seen;
  let code = 200;
  let answer = "回答";
  const ai = new Assistant(root, safe, async (url, options) => {
    seen = { url, options };
    return new Response(
      JSON.stringify({ choices: [{ message: { content: answer } }] }),
      { status: code },
    );
  });
  await assert.rejects(ai.ask({ mode: "chat", prompt: "你好" }), /API Key/);
  await ai.setKey("unit-test-secret-never-sent");
  assert.equal((await ai.status()).configured, true);
  assert.ok(!(await fs.readFile(ai.file, "utf8")).includes("unit-test-secret"));
  assert.equal((await ai.ask({ mode: "chat", prompt: "你好" })).answer, "回答");
  assert.equal(seen.url, "https://api.deepseek.com/chat/completions");
  assert.equal(JSON.parse(seen.options.body).model, "deepseek-v4-pro");
  assert.equal(
    seen.options.headers.Authorization,
    "Bearer unit-test-secret-never-sent",
  );
  code = 401;
  await assert.rejects(ai.ask({ mode: "chat", prompt: "x" }), /API Key 无效/);
  code = 200;
  answer = "not json";
  await assert.rejects(ai.ask({ mode: "plan", prompt: "x" }), /格式/);
  await ai.setKey("");
  assert.equal((await ai.status()).configured, false);
});
