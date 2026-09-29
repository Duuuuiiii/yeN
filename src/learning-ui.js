let aiStatus = { configured: false, model: "deepseek-v4-pro" },
  aiBusy = false,
  aiPrompt = "",
  aiContext = false,
  aiAnswer = "",
  aiPlan = null,
  aiError = "";
let localVideoURL = "",
  localVideoName = "",
  localSubtitleURL = "",
  localSubtitleName = "";
const aiSkillPrompts = {
  explain: "请像耐心的老师一样，用直观例子解释这个知识点：",
  quiz: "请根据我正在学习的内容出 5 道由浅入深的练习题，先不要给答案：",
  review:
    "请带我复盘今天的学习：先问我完成了什么，再帮我找问题并给出明天的改进建议。",
  english:
    "请做我的英语陪练。用自然英语和我对话，并在每轮末尾简短纠正我的表达：",
};
async function initializeAssistant() {
  try {
    aiStatus = await native.aiStatus();
    if (ui.page === "assistant") render();
  } catch {}
}
function assistantView() {
  const history = model.aiChat || [];
  const messages = history.length
    ? history
        .map(
          (message) =>
            `<div class="ai-message ${message.role}"><span>${message.role === "user" ? "我" : "AI"}</span><div>${esc(message.content)}</div></div>`,
        )
        .join("")
    : aiAnswer
      ? `<div class="ai-message assistant"><span>AI</span><div>${esc(aiAnswer)}</div></div>`
      : '<div class="empty ai-chat-empty">开始一段学习对话。AI 会记住当前对话中的上下文。</div>';
  return `<div class="page-head"><div><h1>AI 助手</h1><div class="muted">DeepSeek V4 Pro · 连续对话、学习技能与计划</div></div><span class="tag neutral">${aiStatus.configured ? "已配置密钥" : "尚未配置"}</span></div>
  <div class="learning-grid"><section class="card settings-card"><h2>学习技能</h2>
  <div class="ai-skills"><button data-ai-skill="explain">讲懂概念</button><button data-ai-skill="quiz">出题练习</button><button data-ai-skill="review">学习复盘</button><button data-ai-skill="english">英语陪练</button></div>
  <label class="field">输入消息<textarea id="ai-prompt" rows="5" maxlength="12000" placeholder="继续提问，AI 会结合上面的对话回答。Ctrl + Enter 发送。">${esc(aiPrompt)}</textarea></label>
  <label class="settings-line">附带目标、任务进度和日程<input id="ai-context" type="checkbox" ${aiContext ? "checked" : ""}></label>
  <p class="muted small">连续对话会发送本对话最近 24 条消息；勾选后额外附带学习进度，不含笔记、附件和音乐。</p>
  <div class="row wrap"><button class="button primary" data-ai="chat" ${aiBusy ? "disabled" : ""}>${aiBusy ? "正在思考…" : "发送消息"}</button><button class="button" data-ai="plan" ${aiBusy ? "disabled" : ""}>生成计划</button></div>
  <details class="ai-key-settings" ${aiStatus.configured ? "" : "open"}><summary>API Key 设置</summary><form id="ai-key-form"><label class="field">DeepSeek API Key<input id="ai-key" type="password" autocomplete="off" placeholder="仅在此输入，不会显示已保存密钥" required></label><p class="muted small">使用 Windows 加密后保存在本机，不进入笔记备份。换电脑后需重新填写。</p><div class="row wrap"><button class="button" type="submit">保存密钥</button><button class="text-button" type="button" data-ai="remove-key">删除密钥</button></div></form></details></section>
  <section class="card settings-card ai-chat-card"><div class="row between"><h2>${aiPlan ? "计划预览" : "当前对话"}</h2><button class="text-button" data-ai="clear" ${aiBusy ? "disabled" : ""}>新建对话</button></div>
  ${aiError ? `<p class="notice" role="alert">${esc(aiError)}</p>` : ""}
  ${aiPlan ? `<p class="ai-answer">${esc(aiPlan.summary)}</p><div class="plan-sessions">${aiPlan.sessions.map((s) => `<div class="plan-session"><strong>${esc(s.title)}</strong><span>${esc(s.date)} · ${esc(s.time)} · ${s.minutes} 分钟</span></div>`).join("")}</div><p class="muted small">确认后新增 ${aiPlan.sessions.length} 项计时任务和 ${aiPlan.sessions.length} 项日程。已有安排保留，请检查日期和时间冲突。</p><div class="row wrap"><button class="button primary" data-ai="apply">加入任务与日程</button><button class="button" data-ai="discard">返回对话</button></div>` : `<div class="ai-messages">${messages}${aiBusy ? '<div class="ai-message assistant waiting"><span>AI</span><div><i class="ai-pulse"></i>正在思考…</div></div>' : ""}</div>${history.length ? '<button class="button small" data-ai="save-note">整段保存到笔记</button>' : ""}`}</section></div>`;
}
function videosView() {
  const topics = [
    ["老友记 · 英语", "老友记 英语 精听 跟读", "短片段精听、跟读和表达积累"],
    [
      "3Blue1Brown · 数学",
      "3Blue1Brown 官方 线性代数",
      "线性代数、微积分和数学直觉",
    ],
    ["AI · 入门", "人工智能 机器学习 入门 课程", "模型原理与动手实践"],
    ["金融 · 基础", "金融学 入门 公开课", "经济、金融与财务知识"],
  ];
  return `<div class="page-head"><div><h1>学习视频</h1><div class="muted">本地播放 · SRT / VTT 字幕 · B 站课程发现</div></div><label class="button primary" for="local-video">打开本地视频</label><input id="local-video" type="file" accept="video/mp4,video/webm,.mp4,.webm" hidden></div>
  <section class="card video-stage">${localVideoURL ? `<video id="learning-video" controls playsinline preload="metadata" src="${esc(localVideoURL)}">${localSubtitleURL ? `<track kind="subtitles" src="${esc(localSubtitleURL)}" srclang="zh" label="${esc(localSubtitleName)}" default>` : ""}</video><div class="row between video-caption"><span class="grow">${esc(localVideoName)}${localSubtitleName ? `<small class="subtitle-loaded">字幕：${esc(localSubtitleName)}</small>` : ""}</span><label>速度 <select id="video-speed" aria-label="播放速度"><option value="0.75">0.75×</option><option selected value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><label class="button small" for="local-subtitle">${localSubtitleURL ? "更换字幕" : "加载字幕"}</label><input id="local-subtitle" type="file" accept=".srt,.vtt,text/vtt,application/x-subrip" hidden>${localSubtitleURL ? '<button class="text-button" data-subtitle-close>移除字幕</button>' : ""}<button class="text-button" data-video-close>关闭视频</button></div>` : '<div class="empty"><h2>打开视频开始学习</h2><p>支持 MP4 / WebM，可调速、全屏并加载 SRT / VTT 字幕。<br>文件仅在本机读取，不会上传。</p></div>'}</section>
  <form id="video-search-form" class="video-search"><label class="field">在 B 站找课程<input name="query" maxlength="160" required placeholder="输入课程、主题或 UP 主"></label><button class="button" type="submit">搜索 B 站 ↗</button></form>
  <div class="news-grid">${topics.map(([title, query, description]) => `<article class="card settings-card"><span class="tag neutral">学习方向</span><h2>${title}</h2><p>${description}</p><button class="text-button" data-video-query="${query}">到 B 站搜索 ↗</button></article>`).join("")}</div><p class="muted small">以上是预设搜索方向，结果由 B 站实时提供，在系统浏览器播放；部分内容需要登录或会员。</p>`;
}
document.addEventListener("input", (e) => {
  if (e.target.id === "ai-prompt") aiPrompt = e.target.value;
});
document.addEventListener("keydown", (e) => {
  if (
    e.target.id === "ai-prompt" &&
    e.key === "Enter" &&
    (e.ctrlKey || e.metaKey)
  ) {
    e.preventDefault();
    document.querySelector('[data-ai="chat"]')?.click();
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.id === "ai-context") aiContext = e.target.checked;
  if (e.target.id === "local-video") {
    const file = e.target.files[0];
    if (!file) return;
    if (localVideoURL) URL.revokeObjectURL(localVideoURL);
    localVideoURL = URL.createObjectURL(file);
    localVideoName = file.name;
    render();
  }
  if (e.target.id === "local-subtitle") {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("字幕文件不能超过 5 MB");
      return;
    }
    try {
      let text = await file.text();
      if (!/^\s*WEBVTT/i.test(text)) {
        text =
          "WEBVTT\n\n" +
          text
            .replace(/^\uFEFF/, "")
            .replace(/\r/g, "")
            .replace(
              /(\d{2}:\d{2}:\d{2}),(\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}),(\d{3})/g,
              "$1.$2 --> $3.$4",
            );
      }
      if (localSubtitleURL) URL.revokeObjectURL(localSubtitleURL);
      localSubtitleURL = URL.createObjectURL(
        new Blob([text], { type: "text/vtt" }),
      );
      localSubtitleName = file.name;
      render();
      toast("字幕已加载");
    } catch {
      toast("字幕读取失败，请选择 UTF-8 编码的 SRT 或 VTT 文件");
    }
  }
  if (e.target.id === "video-speed" && $("#learning-video"))
    $("#learning-video").playbackRate = Number(e.target.value);
});
document.addEventListener(
  "error",
  (e) => {
    if (e.target.id === "learning-video")
      toast("无法解码此视频，请尝试 H.264 MP4 或 VP9 WebM");
  },
  true,
);
document.addEventListener("submit", async (e) => {
  if (!["ai-key-form", "video-search-form"].includes(e.target.id)) return;
  e.preventDefault();
  try {
    if (e.target.id === "ai-key-form") {
      const input = $("#ai-key");
      const key = input.value.trim();
      input.value = "";
      aiStatus = await native.aiKey(key);
      render();
      toast("密钥已加密保存");
    } else await native.videoSearch(new FormData(e.target).get("query"));
  } catch (err) {
    toast(err.message);
  }
});
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  try {
    if (b.dataset.aiSkill) {
      aiPrompt = aiSkillPrompts[b.dataset.aiSkill] || "";
      render();
      $("#ai-prompt")?.focus();
      return;
    }
    if (b.dataset.videoQuery) await native.videoSearch(b.dataset.videoQuery);
    if (b.hasAttribute("data-video-close")) {
      URL.revokeObjectURL(localVideoURL);
      if (localSubtitleURL) URL.revokeObjectURL(localSubtitleURL);
      localVideoURL = "";
      localVideoName = "";
      localSubtitleURL = "";
      localSubtitleName = "";
      render();
    }
    if (b.hasAttribute("data-subtitle-close")) {
      URL.revokeObjectURL(localSubtitleURL);
      localSubtitleURL = "";
      localSubtitleName = "";
      render();
    }
    const action = b.dataset.ai;
    if (!action) return;
    if (action === "remove-key") {
      aiStatus = await native.aiKey("");
      render();
      toast("密钥已删除");
    }
    if (action === "clear" || action === "discard") {
      aiAnswer = "";
      aiPlan = null;
      aiError = "";
      if (action === "clear") {
        model.aiChat = [];
        await persist();
      }
      render();
    }
    if (action === "save-note") {
      const history = model.aiChat || [];
      model.notes.unshift({
        id: uid(),
        title:
          history
            .find((message) => message.role === "user")
            ?.content.slice(0, 80) || "AI 学习对话",
        folder: "AI 学习",
        html: history
          .map(
            (message) =>
              `<h2>${message.role === "user" ? "我" : "AI"}</h2><p>${esc(message.content).replace(/\n/g, "<br>")}</p>`,
          )
          .join(""),
        attachments: [],
        drawings: [],
        updated: new Date().toISOString(),
      });
      await persist();
      toast("已保存到笔记");
    }
    if (action === "apply" && aiPlan) {
      // Save first so a failed write never reports success or duplicates a proposal.
      b.disabled = true;
      const proposal = aiPlan,
        tasks = [],
        events = [];
      for (const s of proposal.sessions) {
        tasks.push({
          id: uid(),
          title: s.title,
          type: "time",
          target: s.minutes,
          current: 0,
          status: "todo",
          date: s.date,
          goalId: "",
          noteId: "",
        });
        events.push({
          id: uid(),
          title: s.title,
          date: s.date,
          time: s.time,
          duration: s.minutes,
          repeat: "none",
          noteId: "",
        });
      }
      model.tasks.push(...tasks);
      model.events.push(...events);
      aiPlan = null;
      try {
        await persist();
        if (saveFailed) {
          aiAnswer =
            "计划已加入当前窗口，但尚未写入磁盘。请按 Ctrl + S 重试保存，或导出备份。";
          render();
          return;
        }
        aiAnswer =
          "已加入任务与日程。可以在任务页记录学习分钟，在日程页调整安排。";
        render();
        toast("计划已加入");
      } catch (err) {
        model.tasks = model.tasks.filter(
          (t) => !tasks.some((x) => x.id === t.id),
        );
        model.events = model.events.filter(
          (t) => !events.some((x) => x.id === t.id),
        );
        aiPlan = proposal;
        throw err;
      }
    }
    if (["chat", "plan"].includes(action)) {
      if (aiBusy) return;
      if (!aiStatus.configured) {
        toast("请先填写 DeepSeek API Key");
        return;
      }
      if (!aiPrompt.trim()) {
        toast("先输入学习需求");
        return;
      }
      aiBusy = true;
      aiError = "";
      aiPlan = null;
      render();
      const context = { today: today() };
      if (aiContext) {
        context.goals = model.goals
          .slice(0, 40)
          .map((g) => ({ title: g.title }));
        context.tasks = model.tasks.slice(0, 40).map((t) => ({
          title: t.title,
          date: t.date,
          current: t.current,
          target: t.target,
          type: t.type,
          status: t.status,
        }));
        context.events = model.events.slice(0, 40).map((v) => ({
          title: v.title,
          date: v.date,
          time: v.time,
          duration: v.duration,
          repeat: v.repeat,
        }));
      }
      try {
        const prompt = aiPrompt.trim();
        const history = (model.aiChat || []).slice(-24);
        const result = await native.aiAsk({
          prompt,
          mode: action,
          context: JSON.stringify(context),
          history: action === "chat" ? history : [],
        });
        aiAnswer = result.answer || "";
        aiPlan = result.plan || null;
        if (action === "chat" && result.answer) {
          model.aiChat = [
            ...history,
            { role: "user", content: prompt },
            { role: "assistant", content: result.answer },
          ].slice(-24);
          aiPrompt = "";
          await persist();
        }
      } catch (err) {
        aiError = err.message;
      } finally {
        aiBusy = false;
        if (ui.page === "assistant") render();
      }
    }
  } catch (err) {
    toast(err.message);
    if (ui.page === "assistant") render();
  }
});
