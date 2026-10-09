let updateStatus = { phase: "idle" };
function updateContent() {
  const s = updateStatus;
  const labels = {
    idle: "启动后自动检查更新",
    checking: "正在检查更新…",
    current: "已是最新版本",
    available: `发现新版本 v${s.nextVersion}`,
    downloading: `正在下载 v${s.nextVersion} · ${Math.round(s.progress || 0)}%`,
    downloaded: `v${s.nextVersion} 已就绪`,
    installing: "正在保存、备份并启动安装…",
    error: "暂时无法更新",
    unsupported: "开发版或便携版请使用安装包更新",
  };
  const busy = ["checking", "available", "downloading", "installing"].includes(
    s.phase,
  );
  return `<p role="status" aria-live="polite">${esc(labels[s.phase] || "检查更新")}</p>${s.message ? `<p class="muted small">${esc(s.message)}</p>` : ""}${s.phase === "downloading" ? `<progress max="100" value="${s.progress || 0}" aria-label="更新下载进度" style="width:100%"></progress>` : ""}<div class="row wrap"><button class="button ${s.phase === "downloaded" ? "primary" : ""}" data-update="${s.phase === "downloaded" ? "install" : "check"}" ${busy || s.phase === "unsupported" ? "disabled" : ""}>${s.phase === "downloaded" ? "重启更新" : "检查更新"}</button></div>`;
}
function updateSettingsView() {
  return `<section class="card settings-card"><h2>软件更新</h2><p>自动检查并下载新版。点击重启更新后先保存、备份，再安装；笔记和歌单保留。</p><div id="update-status">${updateContent()}</div><p class="muted small" style="overflow-wrap:anywhere;margin-top:15px">更新缓存：${esc(updateStatus.cachePath || "读取中…")}</p></section>`;
}
function showUpdateStatus(status) {
  const previous = updateStatus.phase;
  updateStatus = status;
  const element = $("#update-status");
  if (element) element.innerHTML = updateContent();
  if (status.phase === "downloaded" && previous !== "downloaded")
    toast(`v${status.nextVersion} 已下载，请到设置中重启更新`);
}
function initializeUpdates() {
  native.onUpdateStatus(showUpdateStatus);
  native
    .updateStatus()
    .then(showUpdateStatus)
    .catch(() => {});
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-update]");
    if (!button || button.disabled) return;
    button.disabled = true;
    try {
      if (button.dataset.update === "install") await native.updateInstall();
      else showUpdateStatus(await native.updateCheck());
    } catch (error) {
      toast(error.message);
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  });
}
