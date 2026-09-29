(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const paths = {
    sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    note: "M5 3h11l3 3v15H5zM8 9h8M8 13h8M8 17h5",
    calendar: "M4 5h16v16H4zM4 10h16M8 3v4m8-4v4M8 14h2m4 0h2m-8 3h2",
    flag: "M5 21V3m0 1c4-3 8 3 14 0v10c-6 3-10-3-14 0",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
    search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4v5l4 2",
    check: "m5 12 4 4L19 6",
    chevron: "m9 5 7 7-7 7",
    plus: "M12 5v14M5 12h14",
    image: "M3 4h18v16H3zM3 16l6-6 5 5 3-3 4 4M16 7h.01",
    pen: "m4 16 12-12 4 4L8 20H4zM14 6l4 4",
    clip: "m8 12 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9",
    file: "M5 3h9l5 5v13H5zM14 3v5h5M8 13h8m-8 4h5",
    trash: "M4 6h16M9 3h6M6 6l1 15h10l1-15M10 10v7m4-7v7",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
    x: "m6 6 12 12M6 18 18 6",
    play: "m8 4 12 8-12 8z",
    pause: "M8 4v16M16 4v16",
    undo: "M4 9h10a6 6 0 0 1 0 12M4 9l5-5M4 9l5 5",
    folder: "M3 6h7l2 3h9v12H3z",
    target:
      "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  };
  Object.assign(paths, {
    music:
      "M9 18V5l11-2v13M9 15c-6-2-8 5-3 5 2 0 3-1 3-3m11-4c-6-2-8 5-3 5 2 0 3-1 3-3",
    previous: "M5 5v14M19 5 8 12l11 7z",
    next: "M19 5v14M5 5l11 7-11 7z",
    volume: "M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
    repeat: "M4 8h14l-3-3m3 3-3 3M20 16H6l3 3m-3-3 3-3",
    shuffle: "M4 6h3l10 12h3m-4-3 4 3-4 3M4 18h3l10-12h3m-4-3 4 3-4 3",
    news: "M4 4h16v17H4zM7 8h5v5H7zM15 8h2m-2 4h2M7 17h10",
    refresh:
      "M20 7V3m0 4h-4M4 17v4m0-4h4M5 8a8 8 0 0 1 14-2M19 16A8 8 0 0 1 5 18",
  });
  const icon = (name, size = 18) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.note}"/></svg>`;
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const uid = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  const pad = (n) => String(n).padStart(2, "0");
  const dateKey = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDate = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const today = () => dateKey(new Date());
  const addDays = (s, n) => {
    const d = parseDate(s);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  };
  const weekStart = (s) => {
    const d = parseDate(s);
    return addDays(s, -((d.getDay() + 6) % 7));
  };
  const prettyDate = (s) =>
    parseDate(s).toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  const shortDate = (s) => (s ? s.slice(5).replace("-", "/") : "");
  const plain = (html) => {
    const d = document.createElement("div");
    d.innerHTML = html;
    return d.textContent || "";
  };
  const bytes = (n) =>
    n > 1048576
      ? (n / 1048576).toFixed(1) + " MB"
      : Math.max(1, Math.round(n / 1024)) + " KB";
  const main = $("#main"),
    modal = $("#modal");
  let db,
    model,
    saveChain = Promise.resolve(),
    saveTimer,
    saveVersion = 0,
    saveFailed = false,
    toastTimer,
    undoAction = null;
  let ui = {
    page: "today",
    selected: null,
    folder: "全部",
    query: "",
    calendar: "week",
    date: today(),
    focus: false,
    noteFullscreen: false,
    taskFilter: "all",
  };
  let focus = { task: "", remaining: 1500, running: false, end: 0 };
  let drawing = null,
    editorRange = null,
    assetURLs = [];
  const themes = {
    blue: {
      name: "雾蓝灰",
      colors: ["#f4f6fa", "#eef2f8", "#587eb8"],
      accent: "#587eb8",
      dark: "#42669f",
      tint: "#eaf0fa",
    },
    cream: {
      name: "奶油黄",
      colors: ["#faf8f2", "#f1ecdf", "#ae842f"],
      accent: "#ae842f",
      dark: "#8b6926",
      tint: "#f5eedc",
    },
    sage: {
      name: "鼠尾草绿",
      colors: ["#f5f7f3", "#eaf0e6", "#61805c"],
      accent: "#61805c",
      dark: "#4d6949",
      tint: "#eaf2e7",
    },
    lavender: {
      name: "雾紫灰",
      colors: ["#f8f6fa", "#eeeaf4", "#8874af"],
      accent: "#8874af",
      dark: "#705c95",
      tint: "#f0eaf8",
    },
    graphite: {
      name: "石墨灰",
      colors: ["#f6f7f8", "#ebedf0", "#586473"],
      accent: "#586473",
      dark: "#414d5c",
      tint: "#e9edf2",
    },
  };
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (model?.settings?.appearance === "system") applyTheme();
    });
  function seed() {
    const d = today();
    return {
      version: 2,
      notes: [
        {
          id: "n1",
          title: "JavaScript · 闭包",
          folder: "前端学习",
          html: "<h2>闭包是什么</h2><p>函数可以记住并访问它创建时的作用域，即使外层函数已经执行完毕。</p><blockquote>把它理解成：函数随身带着自己的环境。</blockquote><h2>练习</h2><ul><li>写一个计数器，每次调用返回递增数字。</li><li>解释为什么计数变量没有被重置。</li><li>对比使用全局变量的区别。</li></ul><h2>我的理解</h2><p>在这里写下自己的解释，也可以插入图片或画一张示意图。</p>",
          attachments: [],
          drawings: [],
          updated: new Date().toISOString(),
        },
        {
          id: "n2",
          title: "英语听力 · 课堂表达",
          folder: "英语学习",
          html: "<h2>今日表达</h2><p><b>Let me put it another way.</b></p><p>让我换一种方式解释。</p><h2>练习记录</h2><p>听一段课程，选取三个表达，再用自己的话复述。</p>",
          attachments: [],
          drawings: [],
          updated: new Date().toISOString(),
        },
        {
          id: "n3",
          title: "每周复盘",
          folder: "个人笔记",
          html: "<h2>本周完成</h2><p>理解了一个新概念，并做了练习。</p><h2>遇到的问题</h2><p>记录卡住的地方和下次要尝试的办法。</p><h2>下周安排</h2><p>把需要继续学习的内容拆成小任务。</p>",
          attachments: [],
          drawings: [],
          updated: new Date().toISOString(),
        },
      ],
      goals: [
        {
          id: "g1",
          title: "前端基础",
          description: "JavaScript 核心概念与练习",
          deadline: addDays(d, 30),
          noteId: "n1",
        },
        {
          id: "g2",
          title: "英语听力",
          description: "听课程、记表达、练习复述",
          deadline: addDays(d, 21),
          noteId: "n2",
        },
      ],
      tasks: [
        {
          id: "t1",
          title: "理解闭包，完成计数器练习",
          type: "once",
          target: 1,
          current: 0,
          status: "running",
          goalId: "g1",
          date: d,
          noteId: "n1",
        },
        {
          id: "t2",
          title: "数组与对象练习",
          type: "count",
          target: 10,
          current: 3,
          status: "running",
          goalId: "g1",
          date: d,
          noteId: "",
        },
        {
          id: "t3",
          title: "英语课程听力",
          type: "time",
          target: 30,
          current: 0,
          status: "todo",
          goalId: "g2",
          date: d,
          noteId: "n2",
        },
        {
          id: "t4",
          title: "整理学习目录",
          type: "once",
          target: 1,
          current: 1,
          status: "done",
          goalId: "g1",
          date: d,
          noteId: "",
        },
      ],
      events: [
        {
          id: "e1",
          title: "JavaScript 学习",
          date: d,
          time: "09:00",
          duration: 60,
          repeat: "none",
          noteId: "n1",
        },
        {
          id: "e2",
          title: "英语听力",
          date: d,
          time: "14:30",
          duration: 30,
          repeat: "none",
          noteId: "n2",
        },
        {
          id: "e3",
          title: "学习复盘",
          date: addDays(d, 2),
          time: "19:00",
          duration: 30,
          repeat: "weekly",
          noteId: "n3",
        },
      ],
      settings: {
        theme: "blue",
        appearance: "system",
        motion: true,
        compact: false,
        reminders: false,
        background: true,
      },
      focusMinutes: 0,
    };
  }
  const native = window.shiyeDesktop;
  let desktopInfo = null;
  async function openDB() {
    if (!native) throw new Error("请使用 yeN 桌面程序打开");
    desktopInfo = await native.info();
    return native;
  }
  async function read(store, key) {
    if (store === "state") return native.getState();
    const a = await native.getAsset(key);
    return a ? { ...a, blob: new Blob([a.bytes], { type: a.type }) } : null;
  }
  async function allAssets() {
    return (await native.listAssets()).map((a) => ({
      ...a,
      blob: new Blob([a.bytes], { type: a.type }),
    }));
  }
  async function write(store, value, key) {
    if (store === "state") return native.saveState(value);
    return native.saveAsset({
      id: value.id,
      name: value.name,
      type: value.type,
      bytes: new Uint8Array(await value.blob.arrayBuffer()),
    });
  }
  function persist() {
    const revision = ++saveVersion;
    model.session = {
      page: ui.page,
      selected: ui.selected,
      calendar: ui.calendar,
      date: ui.date,
    };
    const snapshot = structuredClone(model);
    $("#save-state").textContent = "保存中…";
    saveChain = saveChain
      .catch(() => {})
      .then(() => write("state", snapshot, "model"))
      .then(() => {
        saveFailed = false;
        if (revision === saveVersion)
          $("#save-state").textContent = "已保存到电脑";
      })
      .catch((e) => {
        saveFailed = true;
        $("#save-state").textContent = "保存失败，请导出备份";
        toast("保存失败：" + (e?.message || "存储空间不足"));
      });
    return saveChain;
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    $("#save-state").textContent = "保存中…";
    saveTimer = setTimeout(persist, 300);
  }
  function flush() {
    clearTimeout(saveTimer);
    return persist();
  }
  function toast(message, undo) {
    clearTimeout(toastTimer);
    undoAction = undo || null;
    $("#toast").innerHTML =
      `<span>${esc(message)}</span>${undo ? '<button data-action="undo-toast">撤销</button>' : ""}`;
    $("#toast").classList.add("visible");
    toastTimer = setTimeout(() => {
      $("#toast").classList.remove("visible");
      undoAction = null;
    }, 7000);
  }
  function applyTheme() {
    const t = themes[model.settings.theme] || themes.blue;
    const preference = model.settings.appearance || "system";
    const dark =
      preference === "dark" ||
      (preference === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const style = document.documentElement.style;
    const colors = dark
      ? {
          "--bg": "#121720",
          "--surface": "#1b222d",
          "--sidebar": "#171e28",
          "--ink": "#e7ecf4",
          "--muted": "#9aa6b6",
          "--border": "#2b3543",
          "--accent": t.accent,
          "--accent-dark": t.dark,
          "--tint": `color-mix(in srgb, ${t.accent} 20%, #1b222d)`,
          "--success": "#73a997",
          "--shadow": "0 10px 32px #00000030",
        }
      : {
          "--bg": t.colors[0],
          "--surface": "#fff",
          "--sidebar": t.colors[1],
          "--ink": "#273448",
          "--muted": "#7b8798",
          "--border": "#e6ebf2",
          "--accent": t.accent,
          "--accent-dark": t.dark,
          "--tint": t.tint,
          "--success": "#587e70",
          "--shadow": "0 6px 26px #233e6310",
        };
    Object.entries(colors).forEach(([k, v]) => style.setProperty(k, v));
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    document.body.dataset.appearance = dark ? "dark" : "light";
    document.body.classList.toggle("compact", model.settings.compact);
    document.body.classList.toggle("no-motion", !model.settings.motion);
  }
  const progress = (t) =>
    t.type === "once"
      ? t.status === "done"
        ? 1
        : 0
      : Math.min(1, t.current / t.target);
  const goalProgress = (g) => {
    const ts = model.tasks.filter((t) => t.goalId === g);
    return ts.length
      ? Math.round((ts.reduce((a, t) => a + progress(t), 0) / ts.length) * 100)
      : 0;
  };
  function bar(percent, label = "完成进度") {
    return `<div class="progress-track" role="progressbar" aria-label="${esc(label)}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${percent}%"></div></div>`;
  }
  function taskHTML(t) {
    const g = model.goals.find((g) => g.id === t.goalId);
    const unit = t.type === "time" ? "分钟" : t.type === "count" ? "项" : "";
    return `<div class="task-item"><div class="task-top"><span class="task-indicator ${t.status}"></span><div class="grow"><div class="task-title ${t.status === "done" ? "done" : ""}">${esc(t.title)}</div><div class="task-meta">${g ? `<span>${esc(g.title)}</span><span>·</span>` : ""}<span>${shortDate(t.date) || "未安排"}</span>${t.noteId ? `<button class="text-button" data-open-note="${esc(t.noteId)}">关联笔记</button>` : ""}</div></div><button class="icon-button" data-edit-task="${t.id}" aria-label="编辑任务 ${esc(t.title)}">${icon("pen", 14)}</button></div>${t.type !== "once" ? `<div class="task-progress">${bar(Math.round(progress(t) * 100))}</div>` : ""}<div class="task-bottom"><span class="task-status">${t.status === "done" ? "已完成" : t.type === "once" ? (t.status === "running" ? "进行中" : "未开始") : `${t.current} / ${t.target} ${unit}`}</span><div class="row" style="gap:6px">${t.status === "done" ? `<button class="text-button" data-reopen-task="${t.id}">重新打开</button>` : t.type === "once" ? `<button class="button small ${t.status === "running" ? "primary" : ""}" data-step-task="${t.id}">${t.status === "running" ? "完成任务" : "开始"}</button>` : `<button class="button small" data-increment-task="${t.id}">＋${t.type === "time" ? "5 分钟" : "1"}</button><button class="button small" data-record-task="${t.id}">记录</button>`}</div></div></div>`;
  }
  function occurs(e, d) {
    if (d < e.date) return false;
    if (e.repeat === "daily") return true;
    if (e.repeat === "weekly")
      return parseDate(d).getDay() === parseDate(e.date).getDay();
    return e.date === d;
  }
  function eventsOn(d) {
    return model.events
      .filter((e) => occurs(e, d))
      .sort((a, b) => a.time.localeCompare(b.time));
  }
  function eventHTML(e, d) {
    return `<div class="agenda-row"><div class="agenda-time">${esc(e.time)}</div><button class="agenda-content" data-edit-event="${e.id}" data-occurrence="${d}"><strong>${esc(e.title)}</strong><small>${e.duration} 分钟${e.repeat === "weekly" ? " · 每周" : e.repeat === "daily" ? " · 每天" : ""}</small></button></div>`;
  }
  function miniWeek(d) {
    const start = weekStart(d);
    return `<div class="mini-week">${Array.from({ length: 7 }, (_, i) => {
      const s = addDays(start, i);
      return `<button class="mini-day ${s === d ? "active" : ""}" data-calendar-date="${s}" aria-label="查看 ${s} 日程"><span>${["一", "二", "三", "四", "五", "六", "日"][i]}</span><strong>${parseDate(s).getDate()}</strong><span class="dot" style="opacity:${eventsOn(s).length ? 1 : 0}"></span></button>`;
    }).join("")}</div>`;
  }
  function todayView() {
    const ts = model.tasks.filter((t) => t.date === today());
    const done = ts.filter((t) => t.status === "done").length;
    const events = eventsOn(today());
    const pending = model.tasks.filter(
      (t) => t.date && t.date < today() && t.status !== "done",
    );
    return `<div class="page-head"><div><h1>今日</h1><div class="muted">${prettyDate(today())}</div></div><button class="button" data-action="new-event">${icon("calendar", 15)} 添加日程</button></div><div class="summary-strip"><div class="summary"><span class="summary-icon">${icon("list")}</span><div><div class="summary-number">${done}<span class="muted" style="font-size:13px"> / ${ts.length}</span></div><small>今日任务</small></div></div><div class="summary-separator"></div><div class="summary"><span class="summary-icon">${icon("clock")}</span><div><div class="summary-number" id="focus-total">${model.focusMinutes}<span class="muted" style="font-size:13px"> 分钟</span></div><small>累计专注</small></div></div><div class="summary-separator"></div><div class="summary"><span class="summary-icon">${icon("calendar")}</span><div><div class="summary-number">${events.length}</div><small>今日安排</small></div></div></div>${pending.length ? `<div class="notice row between" style="margin-bottom:18px"><span>${pending.length} 项之前的任务尚未完成</span><button class="text-button" data-action="rollover">移到今天</button></div>` : ""}<div class="today-grid"><div class="stack"><section class="card"><div class="card-head"><h2>日程</h2><button class="text-button" data-page="calendar">查看全部 →</button></div><div class="card-body">${miniWeek(today())}${events.length ? events.map((e) => eventHTML(e, today())).join("") : '<div class="empty">今天暂无日程<br><button class="text-button" data-action="new-event">添加安排</button></div>'}</div></section></div><div class="stack"><section class="card"><div class="card-head"><h2>学习任务 <span class="muted small">${ts.length}</span></h2><button class="icon-button" data-action="new-task" aria-label="添加任务">${icon("plus")}</button></div><div class="card-body">${ts.length ? ts.map(taskHTML).join("") : '<div class="empty">暂无任务<br><button class="text-button" data-action="new-task">添加学习任务</button></div>'}</div></section></div><div class="stack"><section class="card focus-card"><div class="row between"><h2>专注</h2>${icon("clock", 16)}</div><div class="timer" id="focus-timer">${timerText()}</div><span class="muted small" id="focus-label">${focus.running ? "计时中" : "25 分钟"}</span><select id="focus-task" aria-label="关联专注任务" ${focus.running ? "disabled" : ""}><option value="">不关联任务</option>${model.tasks
      .filter((t) => t.type === "time" && t.status !== "done")
      .map(
        (t) =>
          `<option value="${t.id}" ${focus.task === t.id ? "selected" : ""}>${esc(t.title)}</option>`,
      )
      .join(
        "",
      )}</select><div class="timer-actions"><button class="button primary" data-action="focus-toggle" id="focus-toggle">${icon(focus.running ? "pause" : "play", 14)}${focus.running ? "暂停" : "开始专注"}</button><button class="icon-button" data-action="focus-reset" aria-label="重置专注计时">${icon("undo", 16)}</button></div></section><section class="card"><div class="card-head"><h2>目标进度</h2><button class="text-button" data-page="goals">全部 →</button></div><div class="card-body">${
      model.goals.length
        ? model.goals
            .slice(0, 3)
            .map(
              (g) =>
                `<div class="goal-mini"><div class="row between"><span>${esc(g.title)}</span><small>${goalProgress(g.id)}%</small></div>${bar(goalProgress(g.id))}</div>`,
            )
            .join("")
        : '<div class="empty">还没有目标</div>'
    }</div></section></div></div><div class="row between section-label"><h2>最近笔记</h2><button class="text-button" data-page="notes">全部笔记 →</button></div><div class="recent-notes">${[
      ...model.notes,
    ]
      .sort((a, b) => b.updated.localeCompare(a.updated))
      .slice(0, 4)
      .map(
        (n) =>
          `<button class="card note-preview" data-open-note="${n.id}"><div class="note-icon">${icon("note", 21)}</div><h3>${esc(n.title || "未命名笔记")}</h3><p>${esc(plain(n.html) || "空白笔记")}</p><div class="row between"><span>${esc(n.folder)}</span><span>${shortDate(n.updated.slice(0, 10))}</span></div></button>`,
      )
      .join("")}</div>`;
  }
  function notesView() {
    const n = model.notes.find((n) => n.id === ui.selected) || model.notes[0];
    ui.selected = n?.id || null;
    return `<div class="page-head"><div><h1>笔记</h1><div class="muted">${model.notes.length} 篇笔记</div></div><button class="button primary" data-action="new-note">${icon("plus", 16)} 新建笔记</button></div><div class="card notes-layout ${ui.focus ? "focus" : ""} ${ui.noteFullscreen ? "fullscreen-note" : ""}"><section class="notes-list"><input type="search" id="note-search" aria-label="搜索笔记" placeholder="搜索标题和正文" value="${esc(ui.query)}"><div class="folder-filter">${["全部", ...new Set(model.notes.map((n) => n.folder))].map((f) => `<button data-folder="${esc(f)}" class="${ui.folder === f ? "active" : ""}">${esc(f)}</button>`).join("")}</div><div class="note-list-items" id="note-list-items">${noteListHTML()}</div></section>${n ? `<section class="editor-panel"><div class="editor-top"><input id="note-folder" aria-label="笔记分类" value="${esc(n.folder)}" maxlength="30" style="font-size:11px;padding:5px 8px;width:130px"><div class="row" style="gap:4px"><button class="icon-button" data-action="export-note" aria-label="导出当前笔记文本">${icon("download", 16)}</button><button class="icon-button" data-action="focus-editor" aria-label="${ui.focus ? "显示" : "隐藏"}笔记列表">${icon("list", 16)}</button><button class="icon-button" data-action="fullscreen-note" aria-label="${ui.noteFullscreen ? "退出" : "进入"}笔记全屏">${icon(ui.noteFullscreen ? "x" : "expand", 16)}</button><button class="icon-button" data-action="delete-note" aria-label="删除当前笔记">${icon("trash", 16)}</button></div></div><div class="editor-toolbar" role="toolbar" aria-label="文字和插入工具"><button data-format="bold" aria-label="加粗"><b>B</b></button><button data-format="italic" aria-label="斜体"><i>I</i></button><button data-format="underline" aria-label="下划线"><u>U</u></button><button data-format="formatBlock" data-value="h2" aria-label="二级标题">H2</button><button data-format="formatBlock" data-value="p" aria-label="正文">正文</button><button data-format="insertUnorderedList" aria-label="项目列表">${icon("list", 15)}</button><span class="toolbar-divider"></span><button data-action="insert-image">${icon("image", 15)} 图片</button><button data-action="draw">${icon("pen", 15)} 画板</button><button data-action="attach">${icon("clip", 15)} 附件</button></div><div class="editor-sheet"><input class="note-title-input" id="note-title" value="${esc(n.title)}" placeholder="未命名笔记" aria-label="笔记标题" maxlength="180"><div class="note-info"><span id="note-charcount">${plain(n.html).length}</span> 字 · 自动保存</div><div class="note-body" id="note-body" role="textbox" aria-label="笔记正文" aria-multiline="true" contenteditable="true" spellcheck="false">${cleanHTML(n.html)}</div><div id="note-drawings">${(n.drawings || []).map((d) => `<div class="drawing-wrap"><img class="drawing-preview" data-asset-id="${d.assetId}" alt="手绘画板"><div class="row between"><button class="text-button" data-edit-drawing="${d.id}">${icon("pen", 13)} 继续绘画</button><button class="icon-button" data-remove-drawing="${d.id}" aria-label="移除画板">${icon("trash", 14)}</button></div></div>`).join("")}</div><div class="attachment-list">${(n.attachments || []).map((a) => `<div class="attachment-item">${icon("file", 21)}<div class="grow"><div class="filename">${esc(a.name)}</div><div class="muted small">${bytes(a.size)}</div></div><button class="icon-button" data-download-asset="${a.id}" aria-label="下载 ${esc(a.name)}">${icon("download", 16)}</button><button class="icon-button" data-remove-attachment="${a.id}" aria-label="移除 ${esc(a.name)}">${icon("x", 15)}</button></div>`).join("")}</div></div></section>` : '<div class="empty">新建一篇笔记，开始记录。</div>'}</div>`;
  }
  function noteListHTML() {
    const ns = model.notes.filter(
      (n) =>
        (ui.folder === "全部" || ui.folder === n.folder) &&
        `${n.title} ${plain(n.html)}`
          .toLowerCase()
          .includes(ui.query.toLowerCase()),
    );
    return ns.length
      ? ns
          .map(
            (n) =>
              `<button class="note-list-item ${ui.selected === n.id ? "active" : ""}" data-open-note="${n.id}"><h3>${esc(n.title || "未命名笔记")}</h3><p>${esc(plain(n.html) || "空白笔记")}</p><small>${esc(n.folder)} · ${shortDate(n.updated.slice(0, 10))}</small></button>`,
          )
          .join("")
      : '<div class="empty">没有匹配的笔记</div>';
  }
  function calendarTitle() {
    const d = parseDate(ui.date);
    if (ui.calendar === "year") return `${d.getFullYear()} 年`;
    if (ui.calendar === "month")
      return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
    if (ui.calendar === "week") {
      const s = weekStart(ui.date);
      return `${shortDate(s)} — ${shortDate(addDays(s, 6))} · ${d.getFullYear()}`;
    }
    return prettyDate(ui.date);
  }
  function calendarView() {
    let content = "";
    const d = parseDate(ui.date);
    if (ui.calendar === "month") {
      const first = dateKey(new Date(d.getFullYear(), d.getMonth(), 1));
      const start = weekStart(first);
      content = `<div class="card calendar-card"><div class="calendar-weekdays">${["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((x) => `<span>${x}</span>`).join("")}</div><div class="month-grid">${Array.from(
        { length: 42 },
        (_, i) => {
          const s = addDays(start, i);
          const es = eventsOn(s);
          return `<div class="month-cell ${parseDate(s).getMonth() !== d.getMonth() ? "other" : ""}" data-drop-date="${s}"><button class="date-button ${s === today() ? "today" : ""}" data-calendar-date="${s}" aria-label="查看 ${s}">${parseDate(s).getDate()}</button>${es
            .slice(0, 3)
            .map(
              (e) =>
                `<button class="calendar-event" draggable="${e.repeat === "none"}" data-drag-event="${e.id}" data-edit-event="${e.id}" aria-label="${s} ${esc(e.time)} ${esc(e.title)}">${esc(e.time)} ${esc(e.title)}</button>`,
            )
            .join(
              "",
            )}${es.length > 3 ? `<button class="text-button" data-calendar-date="${s}">＋${es.length - 3} 项</button>` : ""}</div>`;
        },
      ).join("")}</div></div>`;
    } else if (ui.calendar === "year") {
      content = `<div class="year-grid">${Array.from(
        { length: 12 },
        (_, month) => {
          const first = new Date(d.getFullYear(), month, 1),
            offset = (first.getDay() + 6) % 7,
            days = new Date(d.getFullYear(), month + 1, 0).getDate();
          return `<button class="card year-month" data-calendar-month="${dateKey(first)}"><h3>${month + 1} 月</h3><div class="mini-month-grid">${["一", "二", "三", "四", "五", "六", "日"].map((w) => `<span class="muted">${w}</span>`).join("")}${"<span></span>".repeat(offset)}${Array.from(
            { length: days },
            (_, i) => {
              const s = dateKey(new Date(d.getFullYear(), month, i + 1));
              return `<span class="${eventsOn(s).length ? "has-event" : ""} ${s === today() ? "today" : ""}">${i + 1}</span>`;
            },
          ).join("")}</div></button>`;
        },
      ).join("")}</div>`;
    } else if (ui.calendar === "week") {
      const start = weekStart(ui.date);
      content = `<div class="card week-grid">${Array.from(
        { length: 7 },
        (_, i) => {
          const s = addDays(start, i);
          const es = eventsOn(s);
          return `<section class="week-column" data-drop-date="${s}"><button class="week-heading ${s === today() ? "today" : ""}" data-calendar-date="${s}">${["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i]}<strong>${parseDate(s).getDate()}</strong></button><div>${es.map((e) => `<button class="week-event" data-edit-event="${e.id}" draggable="${e.repeat === "none"}" data-drag-event="${e.id}"><small>${e.time} · ${e.duration} 分钟</small>${esc(e.title)}</button>`).join("")}<button class="icon-button" data-new-event-date="${s}" aria-label="在 ${s} 添加日程">${icon("plus", 14)}</button></div></section>`;
        },
      ).join("")}</div>`;
    } else {
      const es = eventsOn(ui.date);
      const ts = model.tasks.filter((t) => t.date === ui.date);
      content = `<div class="day-layout"><section class="card day-agenda"><div class="row between" style="margin-bottom:15px"><h2>时间安排</h2><span class="muted small">${es.length} 项</span></div>${es.length ? es.map((e) => eventHTML(e, ui.date)).join("") : '<div class="empty">这一天还没有安排</div>'}<button class="button" data-new-event-date="${ui.date}" style="margin-top:15px">＋ 添加日程</button></section><section class="card schedule-side"><h2>当天任务</h2>${ts.length ? ts.map(taskHTML).join("") : '<div class="empty">暂无任务</div>'}<button class="text-button" data-new-task-date="${ui.date}">＋ 添加任务</button></section></div>`;
    }
    return `<div class="page-head"><div><h1>日程</h1><div class="muted">${model.events.length} 项安排${ui.calendar === "week" || ui.calendar === "month" ? " · 单次日程可拖到其他日期" : ""}</div></div><button class="button primary" data-new-event-date="${ui.date}">＋ 添加日程</button></div><div class="toolbar"><div class="view-switch" aria-label="日历视图">${[
      ["day", "日"],
      ["week", "周"],
      ["month", "月"],
      ["year", "年"],
    ]
      .map(
        ([k, v]) =>
          `<button class="${ui.calendar === k ? "active" : ""}" data-calendar-view="${k}">${v}</button>`,
      )
      .join(
        "",
      )}</div><button class="icon-button" data-calendar-move="-1" aria-label="上一段时间"><span style="transform:rotate(180deg);display:flex">${icon("chevron", 16)}</span></button><h2>${calendarTitle()}</h2><button class="icon-button" data-calendar-move="1" aria-label="下一段时间">${icon("chevron", 16)}</button><button class="button small" data-action="calendar-today">今天</button></div>${content}`;
  }
  function goalsView() {
    return `<div class="page-head"><div><h1>学习目标</h1><div class="muted">按任务实际进度累计 · 无任务的目标显示 0%</div></div><button class="button primary" data-action="new-goal">＋ 新建目标</button></div><div class="goal-grid">${
      model.goals
        .map((g) => {
          const ts = model.tasks.filter((t) => t.goalId === g.id);
          return `<section class="card goal-card"><div class="row between"><span class="tag">${g.deadline ? "截止 " + g.deadline : "无截止日期"}</span><button class="icon-button" data-edit-goal="${g.id}" aria-label="编辑目标 ${esc(g.title)}">${icon("pen", 15)}</button></div><div class="row between" style="margin-top:16px"><h2>${esc(g.title)}</h2><span class="goal-number">${goalProgress(g.id)}<span class="small">%</span></span></div><div class="goal-description">${esc(g.description)}</div>${bar(goalProgress(g.id))}<div class="row between"><span class="muted small">${ts.filter((t) => t.status === "done").length} / ${ts.length} 项完成</span>${g.noteId ? `<button class="text-button" data-open-note="${g.noteId}">关联笔记 →</button>` : ""}</div>${ts.map(taskHTML).join("")}<button class="text-button" data-new-task-goal="${g.id}" style="margin-top:14px">＋ 添加阶段任务</button></section>`;
        })
        .join("") || '<div class="empty">还没有目标，点击右上角新建。</div>'
    }</div>`;
  }
  function settingsView() {
    return `<div class="page-head"><div><h1>设置</h1><div class="muted">外观、提醒与本地资料</div></div><span class="tag neutral">yeN ${desktopInfo?.version || "0.3.0"}</span></div><div class="settings-grid"><section class="card settings-card"><h2>外观</h2><p>选择界面明暗与主配色，修改后立即应用。</p><div class="appearance-switch view-switch" role="group" aria-label="界面明暗">${[
      ["system", "跟随系统"],
      ["light", "浅色"],
      ["dark", "深色"],
    ]
      .map(
        ([id, label]) =>
          `<button class="${(model.settings.appearance || "system") === id ? "active" : ""}" data-appearance="${id}">${label}</button>`,
      )
      .join("")}</div><div class="theme-grid">${Object.entries(themes)
      .map(
        ([id, t]) =>
          `<button class="theme-option ${model.settings.theme === id ? "active" : ""}" data-theme="${id}"><span class="swatches">${t.colors.map((c) => `<span style="background:${c}"></span>`).join("")}</span>${t.name}</button>`,
      )
      .join(
        "",
      )}</div><label class="settings-line">轻量过渡动画<input type="checkbox" data-setting="motion" ${model.settings.motion ? "checked" : ""}></label><label class="settings-line">紧凑布局<input type="checkbox" data-setting="compact" ${model.settings.compact ? "checked" : ""}></label></section><section class="card settings-card"><h2>本地保存与备份</h2><p>笔记、附件和音乐保存在独立的数据目录，更新软件不会覆盖个人内容。</p><div class="row wrap"><button class="button primary" data-action="export-all">导出完整备份</button><button class="button" data-action="import-all">导入备份</button></div><div class="notice">自动保留最近 7 份快照，与本地文件库一起恢复。完整导出包含音乐，文件可能较大。</div><div class="row wrap" style="margin-top:15px"><button class="button small" data-action="open-data">打开数据目录</button><button class="button small" data-action="open-backups">自动备份目录</button><button class="button small" data-action="backup-now">立即备份</button><button class="button small" data-action="restore-snapshot">恢复自动快照</button></div><p style="overflow-wrap:anywhere;margin-top:15px">${esc(desktopInfo?.dataPath || "")}</p></section><section class="card settings-card"><h2>后台运行</h2><p>关闭主窗口后继续运行音乐和日程提醒，并在 Windows 右下角保留 yeN 图标。</p><label class="settings-line">关闭窗口时留在后台<input type="checkbox" data-setting="background" ${model.settings.background !== false ? "checked" : ""}></label><p class="muted small">点击托盘图标重新打开；右键图标选择“彻底退出”。</p></section><section class="card settings-card"><h2>日程提醒</h2><p>软件运行时显示 Windows 通知，最小化或留在后台时也可提醒。彻底退出后停止提醒。</p><label class="settings-line">到点提醒<input type="checkbox" data-setting="reminders" ${model.settings.reminders ? "checked" : ""}></label></section><section class="card settings-card"><h2>快捷操作</h2><p>Ctrl + K 搜索笔记 · Ctrl + S 保存<br>选中文字可排版，图片和文件可直接拖入。<br>MP3 / FLAC 本地播放，资讯需要联网更新。</p><button class="button small" data-page="music">打开音乐播放器</button></section><section class="card settings-card"><h2>关于 yeN</h2><div class="about-version">v${esc(desktopInfo?.version || "未知")}</div><p>当前安装版本。版本号也会一直显示在左下角、窗口底部和托盘菜单中。</p></section></div>`;
  }
  function tasksView() {
    const filtered = model.tasks.filter(
      (t) =>
        ui.taskFilter === "all" ||
        (ui.taskFilter === "unscheduled"
          ? !t.date
          : t.status === ui.taskFilter),
    );
    return `<div class="page-head"><div><h1>任务</h1><div class="muted">${model.tasks.length} 项任务 · 可编辑进度与安排日期</div></div><button class="button primary" data-action="new-task">＋ 添加任务</button></div><div class="toolbar"><div class="view-switch wrap">${[
      ["all", "全部"],
      ["todo", "未开始"],
      ["running", "进行中"],
      ["done", "已完成"],
      ["unscheduled", "未安排"],
    ]
      .map(
        ([k, v]) =>
          `<button class="${ui.taskFilter === k ? "active" : ""}" data-task-filter="${k}">${v}</button>`,
      )
      .join(
        "",
      )}</div></div><div class="tasks-grid">${filtered.length ? filtered.map((t) => `<section class="card" style="padding:4px 22px">${taskHTML(t)}</section>`).join("") : '<div class="empty">没有符合条件的任务</div>'}</div>`;
  }
  function render() {
    applyTheme();
    const nav = [
      ["today", "sun", "今日"],
      ["notes", "note", "笔记"],
      ["calendar", "calendar", "日程"],
      ["tasks", "list", "任务"],
      ["goals", "flag", "学习目标"],
      ["music", "music", "音乐"],
      ["news", "news", "学习资讯"],
      ["assistant", "target", "AI 助手"],
      ["videos", "play", "学习视频"],
    ];
    $(".sidebar nav").innerHTML = nav
      .map(
        ([id, ic, label]) =>
          `<button class="nav-item ${ui.page === id ? "active" : ""}" data-page="${id}" aria-label="${label}" ${ui.page === id ? 'aria-current="page"' : ""}>${icon(ic)}<span class="nav-label">${label}</span>${id === "notes" ? `<span class="nav-count">${model.notes.length}</span>` : ""}</button>`,
      )
      .join("");
    $("#settings-nav").innerHTML =
      icon("settings") + '<span class="nav-label">设置</span>';
    $("#settings-nav").setAttribute("aria-label", "设置");
    $("#settings-nav").classList.toggle("active", ui.page === "settings");
    $("#page-name").textContent = {
      today: "今日",
      notes: "笔记",
      calendar: "日程",
      tasks: "任务",
      goals: "学习目标",
      music: "音乐",
      news: "学习资讯",
      assistant: "AI 助手",
      videos: "学习视频",
      settings: "设置",
    }[ui.page];
    main.innerHTML = {
      today: todayView,
      notes: notesView,
      calendar: calendarView,
      tasks: tasksView,
      goals: goalsView,
      music: musicView,
      news: newsView,
      assistant: assistantView,
      videos: videosView,
      settings: settingsView,
    }[ui.page]();
    document.body.classList.toggle(
      "note-fullscreen",
      ui.page === "notes" && ui.noteFullscreen,
    );
    main.classList.remove("page-enter");
    void main.offsetWidth;
    main.classList.add("page-enter");
    if (ui.page === "notes") hydrateAssets();
    renderPlayer();
  }
  function navigate(page) {
    if (
      ![
        "today",
        "notes",
        "calendar",
        "tasks",
        "goals",
        "music",
        "news",
        "assistant",
        "videos",
        "settings",
      ].includes(page)
    )
      return;
    flush();
    if (page !== "notes") ui.noteFullscreen = false;
    ui.page = page;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function showDialog(title, body, wide = false) {
    modal.className = wide ? "draw-dialog" : "";
    modal.innerHTML = `<div class="dialog-head"><h2>${esc(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="关闭">${icon("x")}</button></div><div class="dialog-body">${body}</div>`;
    if (!modal.open) modal.showModal();
  }
  function closeModal() {
    drawing = null;
    modal.close();
  }
  const noteOptions = (selected) =>
    '<option value="">不关联</option>' +
    model.notes
      .map(
        (n) =>
          `<option value="${n.id}" ${selected === n.id ? "selected" : ""}>${esc(n.title || "未命名笔记")}</option>`,
      )
      .join("");
  function taskDialog(id = "", preset = {}) {
    const t = model.tasks.find((t) => t.id === id) || {
      title: "",
      type: "once",
      target: 1,
      current: 0,
      status: "todo",
      date: preset.date || today(),
      goalId: preset.goalId || "",
      noteId: "",
    };
    showDialog(
      id ? "编辑任务" : "添加任务",
      `<form id="task-form" data-id="${id}"><label class="field">任务名称<input name="title" value="${esc(t.title)}" maxlength="160" required autofocus placeholder="例如：完成数组练习"></label><div class="form-grid"><label class="field">完成方式<select name="type" id="task-type"><option value="once" ${t.type === "once" ? "selected" : ""}>一次性任务</option><option value="count" ${t.type === "count" ? "selected" : ""}>按数量累计</option><option value="time" ${t.type === "time" ? "selected" : ""}>按学习分钟累计</option></select></label><label class="field">安排日期<input type="date" name="date" value="${t.date || ""}"></label><label class="field">目标数量 / 分钟<input type="number" name="target" min="1" max="100000" value="${t.target}" required ${t.type === "once" ? "disabled" : ""}></label><label class="field">已完成数量 / 分钟<input type="number" name="current" min="0" max="100000" value="${t.current}" required ${t.type === "once" ? "disabled" : ""}></label><label class="field">所属目标<select name="goalId"><option value="">独立任务</option>${model.goals.map((g) => `<option value="${g.id}" ${g.id === t.goalId ? "selected" : ""}>${esc(g.title)}</option>`).join("")}</select></label><label class="field">关联笔记<select name="noteId">${noteOptions(t.noteId)}</select></label></div><div class="dialog-actions">${id ? `<button type="button" class="button danger left" data-delete-task="${id}">删除</button>` : ""}<button class="button" type="button" data-action="close-modal">取消</button><button class="button primary" type="submit">保存任务</button></div></form>`,
    );
  }
  function eventDialog(
    id = "",
    d = ui.page === "calendar" ? ui.date : today(),
  ) {
    const e = model.events.find((e) => e.id === id) || {
      title: "",
      date: d,
      time: "09:00",
      duration: 30,
      repeat: "none",
      noteId: "",
    };
    showDialog(
      id ? "编辑日程" : "添加日程",
      `<form id="event-form" data-id="${id}"><label class="field">日程名称<input name="title" value="${esc(e.title)}" maxlength="160" required autofocus placeholder="例如：阅读与笔记"></label><div class="form-grid"><label class="field">${e.repeat === "none" ? "日期" : "开始日期"}<input type="date" name="date" value="${e.date}" required></label><label class="field">开始时间<input type="time" name="time" value="${e.time}" required></label><label class="field">时长（分钟）<input type="number" name="duration" min="5" max="1440" step="5" value="${e.duration}" required></label><label class="field">重复<select name="repeat"><option value="none" ${e.repeat === "none" ? "selected" : ""}>不重复</option><option value="daily" ${e.repeat === "daily" ? "selected" : ""}>每天</option><option value="weekly" ${e.repeat === "weekly" ? "selected" : ""}>每周同一天</option></select></label></div><label class="field" style="margin-top:15px">关联笔记<select name="noteId">${noteOptions(e.noteId)}</select></label>${e.repeat !== "none" ? '<p class="muted small">修改或删除将作用于整个重复系列。</p>' : ""}<div class="dialog-actions">${id ? `<button type="button" class="button danger left" data-delete-event="${id}">删除${e.repeat !== "none" ? "系列" : ""}</button>` : ""}${e.noteId ? `<button class="button" type="button" data-open-note="${e.noteId}">打开笔记</button>` : ""}<button class="button primary" type="submit">保存日程</button></div></form>`,
    );
  }
  function goalDialog(id = "") {
    const g = model.goals.find((g) => g.id === id) || {
      title: "",
      description: "",
      deadline: "",
      noteId: "",
    };
    showDialog(
      id ? "编辑目标" : "新建目标",
      `<form id="goal-form" data-id="${id}"><label class="field">目标名称<input name="title" value="${esc(g.title)}" maxlength="100" required autofocus></label><label class="field">简短说明<input name="description" value="${esc(g.description)}" maxlength="200"></label><div class="form-grid"><label class="field">截止日期<input type="date" name="deadline" value="${g.deadline}"></label><label class="field">关联笔记<select name="noteId">${noteOptions(g.noteId)}</select></label></div><div class="dialog-actions">${id ? `<button class="button danger left" type="button" data-delete-goal="${id}">删除目标</button>` : ""}<button class="button primary" type="submit">保存目标</button></div></form>`,
    );
  }
  function recordDialog(id) {
    const t = model.tasks.find((t) => t.id === id);
    showDialog(
      "记录进度",
      `<form id="record-form" data-id="${id}"><p style="margin-bottom:18px">${esc(t.title)}</p><label class="field">累计已完成${t.type === "time" ? "分钟" : "数量"}<input type="number" name="current" min="0" max="${t.target}" value="${t.current}" required autofocus></label><div class="muted small">目标 ${t.target} ${t.type === "time" ? "分钟" : "项"}</div><div class="dialog-actions"><button class="button primary" type="submit">保存进度</button></div></form>`,
    );
  }
  function newNote() {
    const n = {
      id: uid(),
      title: "",
      folder: "个人笔记",
      html: "",
      attachments: [],
      drawings: [],
      updated: new Date().toISOString(),
    };
    model.notes.unshift(n);
    ui.selected = n.id;
    ui.page = "notes";
    ui.folder = "全部";
    ui.query = "";
    render();
    persist();
    $("#note-title").focus();
  }
  function updateTask(t, fn, msg) {
    const before = structuredClone(t);
    fn();
    persist();
    render();
    toast(msg, () => {
      Object.assign(t, before);
      persist();
      render();
    });
  }
  function removeItem(kind, id) {
    const list = model[kind],
      i = list.findIndex((x) => x.id === id);
    if (i < 0) return;
    const value = list[i];
    const linkedBefore =
      kind === "goals"
        ? model.tasks.filter((t) => t.goalId === id).map((t) => t.id)
        : [];
    const noteLinks =
      kind === "notes"
        ? [...model.tasks, ...model.goals, ...model.events]
            .filter((x) => x.noteId === id)
            .map((x) => x.id)
        : [];
    list.splice(i, 1);
    if (kind === "goals")
      model.tasks.forEach((t) => {
        if (t.goalId === id) t.goalId = "";
      });
    if (kind === "notes")
      [...model.tasks, ...model.goals, ...model.events].forEach((x) => {
        if (x.noteId === id) x.noteId = "";
      });
    closeModal();
    persist();
    render();
    toast("已删除" + (kind === "goals" ? "目标，关联任务已保留" : ""), () => {
      list.splice(i, 0, value);
      if (kind === "goals")
        model.tasks.forEach((t) => {
          if (linkedBefore.includes(t.id)) t.goalId = id;
        });
      if (kind === "notes")
        [...model.tasks, ...model.goals, ...model.events].forEach((x) => {
          if (noteLinks.includes(x.id)) x.noteId = id;
        });
      persist();
      render();
    });
  }
  function cleanHTML(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html);
    const allowed = new Set([
      "P",
      "BR",
      "DIV",
      "SPAN",
      "B",
      "STRONG",
      "I",
      "EM",
      "U",
      "S",
      "H1",
      "H2",
      "H3",
      "UL",
      "OL",
      "LI",
      "BLOCKQUOTE",
      "PRE",
      "CODE",
      "IMG",
    ]);
    for (const el of [...template.content.querySelectorAll("*")]) {
      if (
        [
          "SCRIPT",
          "STYLE",
          "IFRAME",
          "OBJECT",
          "EMBED",
          "LINK",
          "META",
          "SVG",
          "MATH",
        ].includes(el.tagName)
      ) {
        el.remove();
        continue;
      }
      if (!allowed.has(el.tagName)) {
        el.replaceWith(...el.childNodes);
        continue;
      }
      const asset = el.getAttribute("data-asset-id");
      for (const attr of [...el.attributes]) el.removeAttribute(attr.name);
      if (el.tagName === "IMG") {
        if (asset && /^[\w-]+$/.test(asset)) {
          el.setAttribute("data-asset-id", asset);
          el.setAttribute("alt", "笔记图片");
        } else el.remove();
      }
    }
    return template.innerHTML;
  }
  function captureEditor() {
    const body = $("#note-body");
    if (!body) return;
    const n = model.notes.find((n) => n.id === ui.selected);
    n.html = cleanHTML(body.innerHTML);
    n.updated = new Date().toISOString();
    $("#note-charcount").textContent = plain(n.html).length;
    scheduleSave();
  }
  function rememberRange() {
    const sel = window.getSelection();
    if (sel.rangeCount && $("#note-body")?.contains(sel.anchorNode))
      editorRange = sel.getRangeAt(0).cloneRange();
  }
  function restoreRange() {
    const body = $("#note-body");
    if (!body) return;
    body.focus();
    const s = getSelection();
    s.removeAllRanges();
    if (editorRange && body.contains(editorRange.commonAncestorContainer)) {
      s.addRange(editorRange);
    } else {
      const r = document.createRange();
      r.selectNodeContents(body);
      r.collapse(false);
      s.addRange(r);
    }
  }
  async function hydrateAssets() {
    assetURLs.forEach((u) => URL.revokeObjectURL(u));
    assetURLs = [];
    const imgs = $$("img[data-asset-id]", main);
    for (const img of imgs) {
      try {
        const a = await read("assets", img.dataset.assetId);
        if (a && img.isConnected) {
          const url = URL.createObjectURL(a.blob);
          assetURLs.push(url);
          img.src = url;
        }
      } catch (e) {
        toast("图片读取失败");
      }
    }
  }
  async function addFiles(files, forceAttachment = false) {
    const note = model.notes.find((n) => n.id === ui.selected);
    if (!note) return;
    const noteId = note.id;
    let added = 0;
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        toast("单个文件上限为 25 MB：" + file.name);
        continue;
      }
      const image =
        !forceAttachment && /^image\/(png|jpeg|gif|webp|bmp)$/i.test(file.type);
      const id = uid();
      await write("assets", {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        blob: file,
      });
      if (image) {
        if (ui.page === "notes" && ui.selected === noteId) {
          restoreRange();
          document.execCommand(
            "insertHTML",
            false,
            `<p><img data-asset-id="${id}" alt="笔记图片"></p><p><br></p>`,
          );
          captureEditor();
          rememberRange();
        } else note.html += `<p><img data-asset-id="${id}"></p>`;
      } else note.attachments.push({ id, name: file.name, size: file.size });
      added++;
    }
    note.updated = new Date().toISOString();
    await persist();
    if (ui.page === "notes" && ui.selected === noteId) render();
    if (added) toast(`已插入 ${added} 个文件`);
  }
  async function download(blob, name) {
    return native.exportFile(name, new Uint8Array(await blob.arrayBuffer()));
  }
  async function downloadAsset(id) {
    const a = await read("assets", id);
    if (a) await download(a.blob, a.name);
    else toast("文件不存在，请检查备份");
  }
  function removeNoteAsset(type, id) {
    const n = model.notes.find((n) => n.id === ui.selected);
    const arr = n[type],
      i = arr.findIndex((x) => x.id === id);
    const item = arr.splice(i, 1)[0];
    persist();
    render();
    toast("已移除，原始文件仍保留在备份中", () => {
      arr.splice(i, 0, item);
      persist();
      render();
    });
  }
  async function drawDialog(id = "") {
    const note = model.notes.find((n) => n.id === ui.selected);
    if (!note) return;
    const existing = note.drawings.find((d) => d.id === id);
    drawing = {
      id,
      noteId: note.id,
      base: null,
      strokes: [],
      current: null,
      tool: "pen",
      color: "#344f78",
      width: 3,
    };
    showDialog(
      "画板",
      `<div class="draw-tools"><button class="button small active" data-draw-tool="pen">${icon("pen", 14)} 画笔</button><button class="button small" data-draw-tool="eraser">橡皮</button><input type="color" id="draw-color" value="#344f78" aria-label="画笔颜色"><label class="row small" style="gap:5px">粗细<input type="range" id="draw-width" min="1" max="20" value="3"></label><button class="icon-button" data-action="draw-undo" aria-label="撤销上一步">${icon("undo", 16)}</button><button class="button small" data-action="draw-clear">清空</button></div><canvas id="drawing-canvas" width="1200" height="600" aria-label="自由绘画画布"></canvas><div class="dialog-actions"><span class="muted small left">鼠标 / 触控笔 / 触摸</span><button class="button" data-action="close-modal">取消</button><button class="button primary" data-action="draw-save">保存到笔记</button></div>`,
      true,
    );
    const canvas = $("#drawing-canvas");
    if (existing) {
      const a = await read("assets", existing.assetId);
      if (a && drawing) {
        const image = new Image();
        const url = URL.createObjectURL(a.blob);
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = url;
        });
        URL.revokeObjectURL(url);
        if (drawing) {
          drawing.base = image;
          paint();
        }
      }
    } else paint();
    canvas.addEventListener("pointerdown", (e) => {
      if (!drawing) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const point = drawPoint(e);
      drawing.current = {
        tool: drawing.tool,
        color: drawing.color,
        width: drawing.width,
        points: [point],
      };
      paint();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drawing?.current) return;
      drawing.current.points.push(drawPoint(e));
      paint();
    });
    const end = () => {
      if (drawing?.current) {
        drawing.strokes.push(drawing.current);
        drawing.current = null;
        paint();
      }
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }
  function drawPoint(e) {
    const rect = $("#drawing-canvas").getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 1200,
      y: ((e.clientY - rect.top) / rect.height) * 600,
    };
  }
  function paint() {
    if (!drawing) return;
    const c = $("#drawing-canvas").getContext("2d");
    c.clearRect(0, 0, 1200, 600);
    c.fillStyle = "#fff";
    c.fillRect(0, 0, 1200, 600);
    if (drawing.base) c.drawImage(drawing.base, 0, 0, 1200, 600);
    for (const s of [
      ...drawing.strokes,
      ...(drawing.current ? [drawing.current] : []),
    ]) {
      c.strokeStyle = s.tool === "eraser" ? "#fff" : s.color;
      c.fillStyle = c.strokeStyle;
      c.lineWidth = s.tool === "eraser" ? s.width * 6 : s.width;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      s.points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
      if (s.points.length === 1) {
        c.arc(s.points[0].x, s.points[0].y, c.lineWidth / 2, 0, Math.PI * 2);
        c.fill();
      } else c.stroke();
    }
  }
  async function saveDrawing() {
    const d = drawing;
    if (!d) return;
    const blob = await new Promise((r) =>
      $("#drawing-canvas").toBlob(r, "image/png"),
    );
    if (!blob) throw new Error("画板导出失败");
    const id = uid();
    await write("assets", {
      id,
      name: "画板.png",
      type: "image/png",
      size: blob.size,
      blob,
    });
    const n = model.notes.find((n) => n.id === d.noteId);
    const old = n.drawings.find((x) => x.id === d.id);
    if (old) old.assetId = id;
    else n.drawings.push({ id: uid(), assetId: id });
    n.updated = new Date().toISOString();
    await persist();
    closeModal();
    render();
    toast("画板已保存，可继续编辑");
  }
  function blobData(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  async function exportAll() {
    await flush();
    const button = $('[data-action="export-all"]');
    if (button) button.disabled = true;
    try {
      const saved = await native.exportBackup(structuredClone(model));
      if (saved) toast("完整备份已导出");
    } finally {
      if (button) button.disabled = false;
    }
  }
  function validateBackup(data) {
    if (
      data?.format !== "shiye-backup" ||
      data.version !== 2 ||
      !data.model ||
      !Array.isArray(data.assets)
    )
      throw new Error("不是有效的yeN v2 备份");
    const m = data.model;
    for (const k of ["notes", "tasks", "events", "goals"]) {
      if (!Array.isArray(m[k]) || m[k].length > 10000)
        throw new Error("备份数据格式错误");
      const ids = new Set();
      for (const x of m[k]) {
        if (
          typeof x.id !== "string" ||
          !/^[\w-]+$/.test(x.id) ||
          ids.has(x.id) ||
          typeof x.title !== "string"
        )
          throw new Error("备份记录无效");
        ids.add(x.id);
      }
    }
    if (!m.settings || !themes[m.settings.theme])
      throw new Error("设置格式错误");
    if (!["system", "light", "dark"].includes(m.settings.appearance))
      m.settings.appearance = "system";
    const validDate = (s) =>
      typeof s === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(s) &&
      dateKey(parseDate(s)) === s;
    for (const n of m.notes) {
      if (
        typeof n.html !== "string" ||
        typeof n.folder !== "string" ||
        typeof n.updated !== "string" ||
        !Array.isArray(n.attachments) ||
        !Array.isArray(n.drawings)
      )
        throw new Error("笔记格式错误");
      n.html = cleanHTML(n.html);
      for (const a of n.attachments) {
        if (
          typeof a.id !== "string" ||
          typeof a.name !== "string" ||
          !Number.isFinite(a.size)
        )
          throw new Error("附件格式错误");
      }
      for (const d of n.drawings) {
        if (typeof d.id !== "string" || typeof d.assetId !== "string")
          throw new Error("画板格式错误");
      }
    }
    for (const t of m.tasks) {
      if (
        !["once", "count", "time"].includes(t.type) ||
        !["todo", "running", "done"].includes(t.status) ||
        !Number.isFinite(t.target) ||
        t.target < 1 ||
        !Number.isFinite(t.current) ||
        t.current < 0 ||
        t.current > t.target ||
        (t.date && !validDate(t.date))
      )
        throw new Error("任务格式错误");
    }
    for (const e of m.events) {
      if (
        !validDate(e.date) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time) ||
        !Number.isFinite(e.duration) ||
        e.duration < 1 ||
        !["none", "daily", "weekly"].includes(e.repeat)
      )
        throw new Error("日程格式错误");
    }
    const assetIds = new Set();
    const assets = data.assets.map((a) => {
      if (
        typeof a.id !== "string" ||
        !/^[\w-]+$/.test(a.id) ||
        assetIds.has(a.id) ||
        typeof a.name !== "string" ||
        typeof a.data !== "string" ||
        !/^data:[^,]*;base64,/.test(a.data)
      )
        throw new Error("文件格式错误");
      assetIds.add(a.id);
      const binary = atob(a.data.slice(a.data.indexOf(",") + 1));
      const array = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const type =
        typeof a.type === "string" ? a.type : "application/octet-stream";
      return {
        id: a.id,
        name: a.name,
        type,
        size: array.length,
        blob: new Blob([array], { type }),
      };
    });
    for (const n of m.notes) {
      const refs = [
        ...n.attachments.map((a) => a.id),
        ...n.drawings.map((a) => a.assetId),
      ];
      const doc = document.createElement("template");
      doc.innerHTML = n.html;
      refs.push(
        ...[...doc.content.querySelectorAll("[data-asset-id]")].map(
          (x) => x.dataset.assetId,
        ),
      );
      if (refs.some((id) => !assetIds.has(id)))
        throw new Error("备份中缺少图片或附件");
    }
    m.focusMinutes = Number.isFinite(m.focusMinutes) ? m.focusMinutes : 0;
    return { model: m, assets };
  }
  function validateRelations(m) {
    const safeId = (x) => typeof x === "string" && /^[\w-]+$/.test(x);
    const noteIds = new Set(m.notes.map((n) => n.id)),
      goalIds = new Set(m.goals.map((g) => g.id));
    for (const n of m.notes) {
      for (const a of n.attachments)
        if (!safeId(a.id)) throw new Error("附件标识无效");
      for (const d of n.drawings)
        if (!safeId(d.id) || !safeId(d.assetId))
          throw new Error("画板标识无效");
    }
    for (const x of [...m.tasks, ...m.goals, ...m.events])
      if (typeof x.noteId !== "string" || (x.noteId && !noteIds.has(x.noteId)))
        throw new Error("笔记关联无效");
    for (const t of m.tasks)
      if (typeof t.goalId !== "string" || (t.goalId && !goalIds.has(t.goalId)))
        throw new Error("目标关联无效");
    m.music = m.music || [];
    if (!Array.isArray(m.music)) throw new Error("音乐列表无效");
    for (const t of m.music)
      if (
        !safeId(t.id) ||
        !safeId(t.assetId) ||
        typeof t.title !== "string" ||
        typeof t.artist !== "string" ||
        !["MP3", "FLAC"].includes(t.format)
      )
        throw new Error("音乐记录无效");
    m.playlists = m.playlists || [];
    if (!Array.isArray(m.playlists) || m.playlists.length > 200)
      throw new Error("歌单记录无效");
    const musicIds = new Set(m.music.map((track) => track.id)),
      playlistIds = new Set();
    for (const list of m.playlists) {
      if (
        !safeId(list.id) ||
        playlistIds.has(list.id) ||
        typeof list.name !== "string" ||
        !list.name.trim() ||
        list.name.length > 60 ||
        !Array.isArray(list.trackIds) ||
        list.trackIds.length > 10000 ||
        list.trackIds.some((id) => !musicIds.has(id))
      )
        throw new Error("歌单记录无效");
      playlistIds.add(list.id);
      list.trackIds = [...new Set(list.trackIds)];
    }
    m.aiChat = m.aiChat || [];
    if (!Array.isArray(m.aiChat) || m.aiChat.length > 24)
      throw new Error("AI 对话记录无效");
    for (const message of m.aiChat)
      if (
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" ||
        !message.content.trim() ||
        message.content.length > 12000
      )
        throw new Error("AI 对话记录无效");
    for (const g of m.goals)
      if (typeof g.description !== "string" || typeof g.deadline !== "string")
        throw new Error("目标格式错误");
  }
  async function importFile(file) {
    if (file.size > 1024 * 1024 * 1024)
      throw new Error("此备份超过 1 GB，请从数据目录恢复或拆分音乐资料库");
    const data = validateBackup(JSON.parse(await file.text()));
    validateRelations(data.model);
    if (
      (data.model.music || []).some(
        (t) => !data.assets.some((a) => a.id === t.assetId),
      )
    )
      throw new Error("备份缺少音乐文件");
    showDialog(
      "恢复备份",
      `<p>此备份包含 ${data.model.notes.length} 篇笔记、${data.model.tasks.length} 项任务和 ${data.assets.length} 个文件。</p><div class="notice">恢复将替换当前内容。建议先导出当前备份。</div><div class="dialog-actions"><button class="button" data-action="export-all">先导出当前备份</button><button class="button primary" id="confirm-import">替换并恢复</button></div>`,
    );
    $("#confirm-import").onclick = async () => {
      try {
        await flush();
        await native.replaceData({
          model: data.model,
          assets: await Promise.all(
            data.assets.map(async (a) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              bytes: new Uint8Array(await a.blob.arrayBuffer()),
            })),
          ),
        });
        audio.pause();
        audio.removeAttribute("src");
        musicState.selected = null;
        musicState.playlist = "all";
        model = data.model;
        model.music = model.music || [];
        model.playlists = Array.isArray(model.playlists) ? model.playlists : [];
        model.aiChat = Array.isArray(model.aiChat)
          ? model.aiChat.slice(-24)
          : [];
        focus = { task: "", remaining: 1500, running: false, end: 0 };
        ui.selected = model.notes[0]?.id;
        closeModal();
        render();
        toast("备份已恢复");
      } catch (e) {
        toast("恢复失败：" + e.message);
      }
    };
  }
  function timerText() {
    const seconds = Math.max(
      0,
      focus.running
        ? Math.ceil((focus.end - Date.now()) / 1000)
        : focus.remaining,
    );
    return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
  }
  function toggleFocus() {
    if (focus.running) {
      focus.remaining = Math.max(0, Math.ceil((focus.end - Date.now()) / 1000));
      focus.running = false;
    } else {
      focus.end = Date.now() + focus.remaining * 1000;
      focus.running = true;
    }
    render();
  }
  const reminded = new Set();
  setInterval(() => {
    if (!model) return;
    if (focus.running && Date.now() >= focus.end) {
      focus.running = false;
      focus.remaining = 1500;
      model.focusMinutes += 25;
      const t = model.tasks.find((t) => t.id === focus.task);
      if (t && t.type === "time") {
        t.current = Math.min(t.target, t.current + 25);
        t.status = t.current >= t.target ? "done" : "running";
      }
      persist();
      if (ui.page === "today") render();
      toast("本次专注完成，已记录 25 分钟");
      native.notify("专注完成", "已记录 25 分钟学习时长");
    }
    if ($("#focus-timer")) $("#focus-timer").textContent = timerText();
    if (model.settings.reminders) {
      const now = new Date();
      for (const e of eventsOn(today())) {
        const key = e.id + today() + e.time;
        const scheduled = new Date(`${today()}T${e.time}:00`).getTime();
        if (
          Date.now() >= scheduled &&
          Date.now() - scheduled < 60000 &&
          !reminded.has(key)
        ) {
          reminded.add(key);
          toast("日程提醒：" + e.title);
          native.notify("日程提醒", e.title);
        }
      }
    }
  }, 1000);
  function searchDialog() {
    showDialog(
      "搜索笔记",
      `<input id="global-search" type="search" autofocus placeholder="搜索标题或正文" aria-label="搜索所有笔记" style="width:100%;margin-bottom:12px"><div class="search-results" id="search-results"></div>`,
    );
    renderSearch("");
  }
  function renderSearch(q) {
    $("#search-results").innerHTML =
      model.notes
        .filter((n) =>
          (n.title + " " + plain(n.html))
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
        .map(
          (n) =>
            `<button data-open-note="${n.id}">${esc(n.title || "未命名笔记")}<small>${esc(n.folder)} · ${esc(plain(n.html).slice(0, 60))}</small></button>`,
        )
        .join("") || '<div class="empty">没有匹配的笔记</div>';
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    try {
      const d = b.dataset;
      if (d.page) {
        navigate(d.page);
        return;
      }
      if (d.openNote) {
        closeModal();
        ui.selected = d.openNote;
        ui.folder = "全部";
        ui.query = "";
        navigate("notes");
        return;
      }
      if (d.folder) {
        ui.folder = d.folder;
        render();
        return;
      }
      if (d.theme) {
        model.settings.theme = d.theme;
        persist();
        render();
        return;
      }
      if (d.appearance) {
        model.settings.appearance = d.appearance;
        persist();
        render();
        return;
      }
      if (d.taskFilter) {
        ui.taskFilter = d.taskFilter;
        render();
        return;
      }
      if (d.editTask) {
        taskDialog(d.editTask);
        return;
      }
      if (d.newTaskGoal) {
        taskDialog("", { goalId: d.newTaskGoal });
        return;
      }
      if (d.newTaskDate) {
        taskDialog("", { date: d.newTaskDate });
        return;
      }
      if (d.stepTask) {
        const t = model.tasks.find((t) => t.id === d.stepTask);
        updateTask(
          t,
          () => {
            t.status = t.status === "running" ? "done" : "running";
            t.current = t.status === "done" ? 1 : 0;
          },
          t.status === "running" ? "任务已完成" : "任务已开始",
        );
        return;
      }
      if (d.reopenTask) {
        const t = model.tasks.find((t) => t.id === d.reopenTask);
        updateTask(
          t,
          () => {
            t.status = "todo";
            t.current = 0;
          },
          "任务已重新打开",
        );
        return;
      }
      if (d.incrementTask) {
        const t = model.tasks.find((t) => t.id === d.incrementTask);
        updateTask(
          t,
          () => {
            t.current = Math.min(
              t.target,
              t.current + (t.type === "time" ? 5 : 1),
            );
            t.status = t.current >= t.target ? "done" : "running";
          },
          "进度已更新",
        );
        return;
      }
      if (d.recordTask) {
        recordDialog(d.recordTask);
        return;
      }
      if (d.deleteTask) {
        removeItem("tasks", d.deleteTask);
        return;
      }
      if (d.editGoal) {
        goalDialog(d.editGoal);
        return;
      }
      if (d.deleteGoal) {
        removeItem("goals", d.deleteGoal);
        return;
      }
      if (d.editEvent) {
        eventDialog(d.editEvent);
        return;
      }
      if (d.newEventDate) {
        eventDialog("", d.newEventDate);
        return;
      }
      if (d.deleteEvent) {
        removeItem("events", d.deleteEvent);
        return;
      }
      if (d.calendarView) {
        ui.calendar = d.calendarView;
        render();
        return;
      }
      if (d.calendarDate) {
        ui.date = d.calendarDate;
        ui.calendar = "day";
        navigate("calendar");
        return;
      }
      if (d.calendarMonth) {
        ui.date = d.calendarMonth;
        ui.calendar = "month";
        render();
        return;
      }
      if (d.calendarMove) {
        const n = Number(d.calendarMove),
          dt = parseDate(ui.date);
        if (ui.calendar === "day") ui.date = addDays(ui.date, n);
        if (ui.calendar === "week") ui.date = addDays(ui.date, n * 7);
        if (ui.calendar === "month")
          ui.date = dateKey(new Date(dt.getFullYear(), dt.getMonth() + n, 1));
        if (ui.calendar === "year")
          ui.date = dateKey(new Date(dt.getFullYear() + n, dt.getMonth(), 1));
        render();
        return;
      }
      if (d.format) {
        restoreRange();
        document.execCommand(d.format, false, d.value || null);
        captureEditor();
        rememberRange();
        return;
      }
      if (d.downloadAsset) {
        await downloadAsset(d.downloadAsset);
        return;
      }
      if (d.removeAttachment) {
        removeNoteAsset("attachments", d.removeAttachment);
        return;
      }
      if (d.removeDrawing) {
        removeNoteAsset("drawings", d.removeDrawing);
        return;
      }
      if (d.editDrawing) {
        await drawDialog(d.editDrawing);
        return;
      }
      if (d.drawTool) {
        drawing.tool = d.drawTool;
        $$("[data-draw-tool]").forEach((x) =>
          x.classList.toggle("active", x.dataset.drawTool === d.drawTool),
        );
        return;
      }
      switch (d.action) {
        case "open-data":
          await native.openData();
          break;
        case "open-backups":
          await native.openBackups();
          break;
        case "backup-now":
          desktopInfo = await native.backupNow();
          toast("已创建自动快照");
          break;
        case "restore-snapshot":
          await snapshotDialog();
          break;
        case "quick":
          showDialog(
            "新建",
            `<div class="quick-grid">${[
              ["new-note", "note", "笔记", "文字、图片、画板、附件"],
              ["new-task", "list", "任务", "一次性、数量或时长"],
              ["new-event", "calendar", "日程", "日期、时间和重复安排"],
              ["new-goal", "flag", "目标", "阶段任务与学习进度"],
            ]
              .map(
                ([a, ic, t, s]) =>
                  `<button class="quick-option" data-action="${a}">${icon(ic, 24)}${t}<small>${s}</small></button>`,
              )
              .join("")}</div>`,
          );
          break;
        case "close-modal":
          closeModal();
          break;
        case "new-note":
          closeModal();
          newNote();
          break;
        case "new-task":
          taskDialog();
          break;
        case "new-event":
          eventDialog();
          break;
        case "new-goal":
          goalDialog();
          break;
        case "search":
          searchDialog();
          break;
        case "calendar-today":
          ui.date = today();
          render();
          break;
        case "focus-editor":
          ui.focus = !ui.focus;
          render();
          break;
        case "fullscreen-note":
          ui.noteFullscreen = !ui.noteFullscreen;
          render();
          break;
        case "delete-note":
          removeItem("notes", ui.selected);
          break;
        case "export-note": {
          const n = model.notes.find((n) => n.id === ui.selected);
          const saved = await download(
            new Blob([n.title + "\n\n" + plain(n.html)], {
              type: "text/plain;charset=utf-8",
            }),
            (n.title || "笔记").replace(/[<>:"/\\|?*]/g, "_") + ".txt",
          );
          if (saved) toast("已导出文字；图片和附件请使用完整备份");
          break;
        }
        case "insert-image":
        case "attach":
          rememberRange();
          $("#file-picker").accept =
            d.action === "insert-image"
              ? "image/png,image/jpeg,image/webp,image/gif,image/bmp"
              : "";
          $("#file-picker").dataset.attach = d.action === "attach" ? "1" : "0";
          $("#file-picker").click();
          break;
        case "draw":
          await drawDialog();
          break;
        case "draw-save":
          b.disabled = true;
          await saveDrawing();
          break;
        case "draw-undo":
          drawing.strokes.pop();
          paint();
          break;
        case "draw-clear":
          drawing.strokes.push({
            tool: "eraser",
            width: 300,
            color: "#fff",
            points: [
              { x: 0, y: 300 },
              { x: 1200, y: 300 },
            ],
          });
          paint();
          break;
        case "export-all":
          await exportAll();
          break;
        case "import-all":
          $("#import-picker").click();
          break;
        case "focus-toggle":
          toggleFocus();
          break;
        case "focus-reset":
          focus.running = false;
          focus.remaining = 1500;
          render();
          break;
        case "undo-toast":
          if (undoAction) {
            undoAction();
            undoAction = null;
            $("#toast").classList.remove("visible");
          }
          break;
        case "rollover": {
          const old = model.tasks
            .filter((t) => t.date && t.date < today() && t.status !== "done")
            .map((t) => ({ id: t.id, date: t.date }));
          old.forEach(
            (o) => (model.tasks.find((t) => t.id === o.id).date = today()),
          );
          persist();
          render();
          toast("未完成任务已移到今天", () => {
            old.forEach((o) => {
              const t = model.tasks.find((t) => t.id === o.id);
              if (t) t.date = o.date;
            });
            persist();
            render();
          });
          break;
        }
      }
    } catch (err) {
      toast("操作失败：" + err.message);
      console.error(err);
      b.disabled = false;
    }
  });
  document.addEventListener("submit", (e) => {
    const form = e.target;
    const id = form.dataset.id;
    if (
      !["task-form", "event-form", "goal-form", "record-form"].includes(form.id)
    )
      return;
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    if ("title" in f && !f.title.trim()) {
      toast("名称不能为空");
      return;
    }
    if (form.id === "task-form") {
      const old = model.tasks.find((t) => t.id === id);
      const target = f.type === "once" ? 1 : Number(f.target),
        current =
          f.type === "once"
            ? old?.status === "done"
              ? 1
              : 0
            : Math.min(target, Number(f.current));
      const t = {
        id: id || uid(),
        title: f.title.trim(),
        type: f.type,
        target,
        current,
        status:
          f.type === "once"
            ? old?.status || "todo"
            : current >= target
              ? "done"
              : current > 0
                ? "running"
                : "todo",
        date: f.date,
        goalId: f.goalId,
        noteId: f.noteId,
      };
      if (old) Object.assign(old, t);
      else model.tasks.push(t);
    }
    if (form.id === "event-form") {
      const value = {
        id: id || uid(),
        ...f,
        title: f.title.trim(),
        duration: Number(f.duration),
      };
      const old = model.events.find((e) => e.id === id);
      if (old) Object.assign(old, value);
      else model.events.push(value);
    }
    if (form.id === "goal-form") {
      const value = { id: id || uid(), ...f, title: f.title.trim() };
      const old = model.goals.find((g) => g.id === id);
      if (old) Object.assign(old, value);
      else model.goals.push(value);
    }
    if (form.id === "record-form") {
      const t = model.tasks.find((t) => t.id === id);
      t.current = Number(f.current);
      t.status =
        t.current >= t.target ? "done" : t.current > 0 ? "running" : "todo";
    }
    closeModal();
    persist();
    render();
    toast("已保存");
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.id === "note-title") {
      const n = model.notes.find((n) => n.id === ui.selected);
      n.title = el.value;
      n.updated = new Date().toISOString();
      scheduleSave();
      $("#note-list-items").innerHTML = noteListHTML();
    }
    if (el.id === "note-body") {
      captureEditor();
      $("#note-list-items").innerHTML = noteListHTML();
    }
    if (el.id === "note-search") {
      ui.query = el.value;
      $("#note-list-items").innerHTML = noteListHTML();
    }
    if (el.id === "global-search") renderSearch(el.value);
    if (el.id === "draw-color" && drawing) drawing.color = el.value;
    if (el.id === "draw-width" && drawing) drawing.width = Number(el.value);
  });
  document.addEventListener("change", async (e) => {
    const el = e.target;
    try {
      if (el.dataset.setting) {
        model.settings[el.dataset.setting] = el.checked;
        if (el.dataset.setting === "background")
          await native.setBackgroundMode(el.checked);
        applyTheme();
        await persist();
      }
      if (el.id === "note-folder") {
        const n = model.notes.find((n) => n.id === ui.selected);
        n.folder = el.value.trim() || "个人笔记";
        el.value = n.folder;
        persist();
      }
      if (el.id === "task-type") {
        for (const name of ["target", "current"])
          $(`[name="${name}"]`, modal).disabled = el.value === "once";
        if (
          el.value === "time" &&
          Number($('[name="target"]', modal).value) === 1
        )
          $('[name="target"]', modal).value = 30;
      }
      if (el.id === "focus-task") focus.task = el.value;
      if (el.id === "file-picker") {
        await addFiles([...el.files], el.dataset.attach === "1");
        el.value = "";
      }
      if (el.id === "import-picker") {
        if (el.files[0]) await importFile(el.files[0]);
        el.value = "";
      }
    } catch (err) {
      toast("操作失败：" + err.message);
      console.error(err);
    }
  });
  document.addEventListener("selectionchange", rememberRange);
  document.addEventListener("mousedown", (e) => {
    if (e.target.closest("[data-format]")) e.preventDefault();
  });
  document.addEventListener("paste", async (e) => {
    if (!e.target.closest("#note-body")) return;
    const files = [...e.clipboardData.files];
    e.preventDefault();
    if (files.length) {
      try {
        await addFiles(files);
      } catch (err) {
        toast("插入失败：" + err.message);
      }
    } else {
      document.execCommand(
        "insertText",
        false,
        e.clipboardData.getData("text/plain"),
      );
      captureEditor();
    }
  });
  document.addEventListener("dragstart", (e) => {
    const el = e.target.closest("[data-drag-event]");
    if (el && el.draggable)
      e.dataTransfer.setData("application/x-shiye-event", el.dataset.dragEvent);
  });
  document.addEventListener("dragover", (e) => {
    const cell = e.target.closest("[data-drop-date]"),
      body = e.target.closest("#note-body");
    if (cell || body) {
      e.preventDefault();
      (cell || body).classList.add("dragover");
    }
  });
  document.addEventListener("dragleave", (e) => {
    const el = e.target.closest(".dragover");
    if (el && !el.contains(e.relatedTarget)) el.classList.remove("dragover");
  });
  document.addEventListener("drop", async (e) => {
    $$(".dragover").forEach((x) => x.classList.remove("dragover"));
    const cell = e.target.closest("[data-drop-date]"),
      body = e.target.closest("#note-body");
    if (cell) {
      e.preventDefault();
      const id = e.dataTransfer.getData("application/x-shiye-event"),
        ev = model.events.find((x) => x.id === id);
      if (ev && ev.repeat === "none") {
        const old = ev.date;
        ev.date = cell.dataset.dropDate;
        persist();
        render();
        toast("日程已调整", () => {
          ev.date = old;
          persist();
          render();
        });
      }
    }
    if (body) {
      e.preventDefault();
      try {
        await addFiles([...e.dataTransfer.files]);
      } catch (err) {
        toast("插入失败：" + err.message);
      }
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ui.noteFullscreen && !modal.open) {
      ui.noteFullscreen = false;
      render();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      searchDialog();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      flush().then(() => {
        if (!saveFailed) toast("已保存到电脑");
      });
    }
  });
  modal.addEventListener("cancel", () => {
    drawing = null;
  });
  native.onSave(async () => {
    await flush();
    if (!saveFailed) toast("已保存到电脑");
  });
  native.onClosing(async () => {
    try {
      captureEditor();
      await flush();
      native.readyToClose(saveFailed ? "保存失败，请导出备份" : null);
    } catch (e) {
      native.readyToClose(e.message);
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && model) flush();
  });
  async function start() {
    try {
      db = await openDB();
      const version = desktopInfo?.version || "未知";
      $("#sidebar-version").textContent = "v" + version;
      $("#footer-version").textContent = `yeN v${version} · 桌面版`;
      document.title = `yeN v${version} · 学习工作台`;
      model = await read("state", "model");
      if (!model) {
        model = seed();
        await persist();
      }
      ui.selected = model.session?.selected || model.notes[0]?.id;
      ui.page = [
        "today",
        "notes",
        "calendar",
        "tasks",
        "goals",
        "music",
        "news",
        "assistant",
        "videos",
        "settings",
      ].includes(model.session?.page)
        ? model.session.page
        : "today";
      ui.calendar = model.session?.calendar || "week";
      ui.date = model.session?.date || today();
      model.music = model.music || [];
      model.playlists = Array.isArray(model.playlists) ? model.playlists : [];
      model.aiChat = Array.isArray(model.aiChat) ? model.aiChat.slice(-24) : [];
      const backgroundSettingMissing =
        typeof model.settings.background !== "boolean";
      const appearanceSettingMissing = !["system", "light", "dark"].includes(
        model.settings.appearance,
      );
      if (appearanceSettingMissing) model.settings.appearance = "system";
      model.settings.background = model.settings.background !== false;
      await native.setBackgroundMode(model.settings.background);
      if (backgroundSettingMissing || appearanceSettingMissing) await persist();
      initializeAssistant();
      initializeMusic();
      initializeNews();
      $('.top-actions [data-action="search"]').innerHTML = icon("search", 17);
      render();
      $("#save-state").textContent = "已保存到电脑";
    } catch (err) {
      main.innerHTML = `<div class="card settings-card"><h1>数据暂时无法打开</h1><p>原有文件已保留，请检查数据目录或从备份恢复。</p><p>${esc(err.message)}</p><button class="button" id="recovery-data">打开数据目录</button></div>`;
      $("#recovery-data").onclick = () => native.openData();
      $("#save-state").textContent = "存储不可用";
    }
  }
  /*__EXTENSIONS__*/
  start();
})();
