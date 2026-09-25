let newsData = { items: [], sources: [], statuses: [], updated: null },
  newsLoading = false,
  newsFilter = "all";
function newsTime(value) {
  if (!value) return "来源未提供时间";
  const d = new Date(value);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function newsView() {
  const items = newsData.items.filter(
    (item) =>
      newsFilter === "all" ||
      (newsFilter === "today"
        ? item.published && dateKey(new Date(item.published)) === today()
        : item.source === newsFilter || item.category === newsFilter),
  );
  return `<div class="page-head"><div><h1>学习资讯</h1><div class="muted">${newsData.updated ? "上次检查 " + newsTime(newsData.updated) : "AI、数学与金融 · 公开订阅"} · 运行期间每小时检查</div></div><button class="button primary" data-news-action="refresh" ${newsLoading ? "disabled" : ""}>${icon("refresh", 16)} ${newsLoading ? "更新中…" : "刷新资讯"}</button></div><div class="news-sources">${newsData.sources
    .map((s) => {
      const status = newsData.statuses.find((x) => x.id === s.id);
      return `<div class="source-chip"><span class="source-dot ${status && !status.ok ? "failed" : ""}"></span><span>${s.name}</span><small>${status ? (status.ok ? "已连接" : "更新失败") : "待更新"}</small></div>`;
    })
    .join(
      "",
    )}</div><div class="toolbar"><div class="view-switch wrap">${[["all", "最新"], ["today", "今天"], ["AI", "AI"], ["数学", "数学"], ["金融", "金融"], ...newsData.sources.map((s) => [s.id, s.name])].map(([id, title]) => `<button data-news-filter="${id}" class="${newsFilter === id ? "active" : ""}">${title}</button>`).join("")}</div><span class="muted small">${items.length} 条</span></div>${
    newsData.statuses.some((s) => !s.ok)
      ? `<div class="notice" style="margin-bottom:18px">${newsData.statuses
          .filter((s) => !s.ok)
          .map(
            (s) =>
              `${esc(newsData.sources.find((x) => x.id === s.id)?.name)}：${esc(s.message)}`,
          )
          .join("；")}。已保留之前的缓存，请按发布时间判断时效。</div>`
      : ""
  }<div class="news-grid">${items.length ? items.map((item) => `<article class="card news-card"><div class="row between"><span class="tag neutral">${esc(item.sourceName)}</span><time class="muted small">${newsTime(item.published)}</time></div><button class="news-title" data-news-open="${item.id}">${esc(item.title)}</button>${item.summary ? `<p class="news-summary">${esc(item.summary)}</p>` : ""}<div class="row between news-actions"><button class="text-button" data-news-open="${item.id}">阅读原文 ↗</button><button class="text-button" data-news-note="${item.id}">${icon("note", 13)} 保存到笔记</button></div></article>`).join("") : `<div class="card empty" style="grid-column:1/-1"><h2>${newsLoading ? "正在读取最新资讯…" : "暂无符合条件的资讯"}</h2><p>${newsFilter === "today" ? "来源今天可能尚未更新，可以切换到“最新”。" : "连接网络后点击刷新。"}</p></div>`}</div>`;
}
async function refreshNews(force = false) {
  if (newsLoading) return;
  newsLoading = true;
  if (ui.page === "news") render();
  try {
    newsData = await native.news(force);
  } catch (e) {
    toast("资讯更新失败：" + e.message);
  } finally {
    newsLoading = false;
    if (ui.page === "news") render();
  }
}
async function initializeNews() {
  await refreshNews(false);
  if (!newsData.updated || Date.now() - Date.parse(newsData.updated) > 3600000)
    refreshNews(true);
}
setInterval(() => {
  if (model) refreshNews(true);
}, 3600000);
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  try {
    if (b.dataset.newsAction === "refresh") await refreshNews(true);
    if (b.dataset.newsFilter) {
      newsFilter = b.dataset.newsFilter;
      render();
    }
    if (b.dataset.newsOpen) {
      const item = newsData.items.find((x) => x.id === b.dataset.newsOpen);
      if (item) await native.openArticle(item.url);
    }
    if (b.dataset.newsNote) {
      const item = newsData.items.find((x) => x.id === b.dataset.newsNote);
      if (!item) return;
      const n = {
        id: uid(),
        title: item.title,
        folder: "资讯收藏",
        html: `<p>${esc(item.sourceName)} · ${esc(newsTime(item.published))}</p><p>${esc(item.summary)}</p><p>原文：${esc(item.url)}</p>`,
        attachments: [],
        drawings: [],
        updated: new Date().toISOString(),
      };
      model.notes.unshift(n);
      await persist();
      toast("已保存到「资讯收藏」笔记");
    }
  } catch (err) {
    toast("操作失败：" + err.message);
  }
});
