const { _electron: electron } = require("playwright");
const assert = require("node:assert/strict"),
  path = require("node:path"),
  fs = require("node:fs/promises");
(async () => {
  const root = path.resolve(__dirname, ".."),
    data = path.join(root, "test-results", "learning-" + Date.now());
  await fs.mkdir(data, { recursive: true });
  const app = await electron.launch({
    ...(process.env.YEN_PACKAGED
      ? {
          executablePath: path.join(root, "release/win-unpacked/yeN.exe"),
          args: ["--data-dir=" + data],
        }
      : { args: [root], env: { ...process.env, SHIYE_TEST_DATA: data } }),
    timeout: 60000,
  });
  try {
    const win = await app.firstWindow(),
      errors = [];
    win.on("pageerror", (e) => errors.push(e.message));
    await win.emulateMedia({ reducedMotion: "reduce" });
    await win.waitForSelector(".today-grid");
    await win.locator('[data-page="assistant"]').click();
    await win.locator("#ai-prompt").fill("安排明天线性代数学习");
    await win.locator('[data-ai="plan"]').click();
    await win.waitForFunction(() =>
      document.querySelector("#toast").textContent.includes("API Key"),
    );
    await app.evaluate(() => {
      const original = globalThis.fetch;
      globalThis.yenCalls = [];
      globalThis.fetch = async (url, options) => {
        if (url !== "https://api.deepseek.com/chat/completions")
          return original(url, options);
        const request = JSON.parse(options.body);
        globalThis.yenCalls.push(request);
        const plan = {
          summary: "每天练习 30 分钟",
          sessions: [
            {
              title: "线性代数练习",
              date: "2026-09-26",
              time: "20:00",
              minutes: 30,
            },
          ],
        };
        const content = request.response_format
          ? JSON.stringify(plan)
          : request.messages.some((message) => message.role === "assistant")
            ? "这是结合上一轮内容的继续回答"
            : "这是第一轮学习回答";
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: { content },
                finish_reason: "stop",
              },
            ],
          }),
        );
      };
    });
    await win.locator("#ai-key").fill("unit-test-secret-no-network");
    await win.locator('#ai-key-form button[type="submit"]').click();
    await win.waitForFunction(() =>
      document.querySelector("#main").textContent.includes("已配置密钥"),
    );
    const before = await win.evaluate(() => window.shiyeDesktop.getState());
    await win.locator('[data-ai="plan"]').click();
    await win.waitForSelector('[data-ai="apply"]');
    assert.equal(
      (await win.evaluate(() => window.shiyeDesktop.getState())).tasks.length,
      before.tasks.length,
    );
    await win.screenshot({
      path: path.join(root, "test-results/ai-plan-preview.png"),
    });
    await win.locator('[data-ai="apply"]').click();
    await win.waitForFunction(() =>
      document.querySelector("#main").textContent.includes("已加入任务与日程"),
    );
    const after = await win.evaluate(() => window.shiyeDesktop.getState());
    assert.equal(after.tasks.length, before.tasks.length + 1);
    assert.equal(after.events.length, before.events.length + 1);
    assert.equal(after.tasks.at(-1).type, "time");
    const calls = await app.evaluate(() => globalThis.yenCalls);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].model, "deepseek-v4-pro");
    assert.ok(!calls[0].messages[1].content.includes("goals"));
    assert.ok(!JSON.stringify(after).includes("unit-test-secret"));
    await win.locator("#ai-prompt").fill("什么是特征值？");
    await win.locator('[data-ai="chat"]').click();
    await win.waitForFunction(
      () => document.querySelectorAll(".ai-message.assistant").length === 1,
    );
    await win.locator("#ai-prompt").fill("继续用几何直觉解释");
    await win.locator('[data-ai="chat"]').click();
    await win.waitForFunction(
      () => document.querySelectorAll(".ai-message.assistant").length === 2,
    );
    const conversationCalls = await app.evaluate(() => globalThis.yenCalls);
    assert.equal(conversationCalls.length, 3);
    assert.ok(
      conversationCalls[2].messages.some(
        (message) =>
          message.role === "assistant" &&
          message.content === "这是第一轮学习回答",
      ),
    );
    assert.equal(
      (await win.evaluate(() => window.shiyeDesktop.getState())).aiChat.length,
      4,
    );
    await win.screenshot({
      path: path.join(root, "test-results/ai-preview.png"),
    });
    await win.locator(".ai-key-settings summary").click();
    await win.locator('[data-ai="remove-key"]').click();
    await win.waitForFunction(() =>
      document.querySelector("#main").textContent.includes("尚未配置"),
    );
    await app.evaluate(({ shell }) => {
      shell.openExternal = async (url) => {
        globalThis.videoSearchURL = url;
      };
    });
    await win.locator('[data-page="videos"]').click();
    await win.locator("[data-video-query]").first().click();
    assert.ok(
      (await app.evaluate(() => globalThis.videoSearchURL)).startsWith(
        "https://search.bilibili.com/all?keyword=",
      ),
    );
    const file = path.join(root, "tests/fixtures/test-tone.webm");
    await win.locator("#local-video").setInputFiles(file);
    await win.waitForFunction(
      () => document.querySelector("#learning-video")?.readyState >= 2,
    );
    await win.locator("#video-speed").selectOption("1.5");
    assert.equal(
      await win.locator("#learning-video").evaluate((v) => v.playbackRate),
      1.5,
    );
    const subtitle = path.join(data, "test.srt");
    await fs.writeFile(
      subtitle,
      "1\n00:00:00,000 --> 00:00:01,000\n学习字幕测试\n",
    );
    await win.locator("#local-subtitle").setInputFiles(subtitle);
    await win.waitForSelector(".subtitle-loaded");
    assert.ok(
      (await win.locator(".subtitle-loaded").innerText()).includes("test.srt"),
    );
    assert.equal(await win.locator("#learning-video track").count(), 1);
    await win.locator("#learning-video").evaluate(async (v) => {
      await v.play();
    });
    await win.waitForFunction(
      () => document.querySelector("#learning-video").currentTime > 0.2,
    );
    await win.screenshot({
      path: path.join(root, "test-results/videos-preview.png"),
    });
    await win.locator('[data-page="news"]').click();
    await win.waitForSelector(".news-card", { timeout: 60000 });
    const news = await win.evaluate(() => window.shiyeDesktop.news(false));
    assert.ok(news.items.length > 0);
    assert.ok(
      news.items.every((i) => ["AI", "数学", "金融"].includes(i.category)),
    );
    await win.locator('[data-news-filter="数学"]').click();
    assert.ok(await win.locator(".news-card").count());
    for (const width of [1440, 1024, 768]) {
      await win.setViewportSize({ width, height: 950 });
      for (const page of ["assistant", "videos", "news"]) {
        await win.locator(`[data-page="${page}"]`).click();
        assert.ok(
          await win.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${page} overflow at ${width}`,
        );
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: secure AI configuration, mocked planning + explicit apply, local video playback, Bilibili search, live subject RSS, responsive pages",
    );
  } finally {
    await app.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
