async function snapshotDialog() {
  await flush();
  desktopInfo = await native.info();
  showDialog(
    "恢复自动快照",
    `<p class="muted small">恢复前会自动备份当前状态。快照需要与此电脑的数据目录一起使用。</p><div class="snapshot-list">${desktopInfo.backups.map((b) => `<div class="attachment-item"><div class="grow"><div class="filename">${esc(b.name.replace("yeN自动快照-", "").replace(".json", ""))}</div><small class="muted">${bytes(b.size)}</small></div><button class="button small" data-snapshot="${esc(b.name)}">恢复</button></div>`).join("") || '<div class="empty">还没有快照，可先点击「立即备份」。</div>'}</div>`,
  );
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-snapshot]");
  if (!b) return;
  const name = b.dataset.snapshot;
  showDialog(
    "恢复此快照？",
    `<p>将用此快照替换当前笔记、任务、日程和音乐列表。当前内容会先保存为一份快照。</p><div class="dialog-actions"><button class="button" data-action="close-modal">取消</button><button class="button primary" id="confirm-snapshot">恢复</button></div>`,
  );
  $("#confirm-snapshot").onclick = async () => {
    try {
      await flush();
      model = await native.restoreSnapshot(name);
      model.music = model.music || [];
      model.playlists = Array.isArray(model.playlists) ? model.playlists : [];
      model.aiChat = Array.isArray(model.aiChat) ? model.aiChat.slice(-24) : [];
      audio.pause();
      audio.removeAttribute("src");
      musicState.selected = null;
      musicState.playlist = "all";
      ui.selected = model.notes[0]?.id;
      closeModal();
      render();
      toast("快照已恢复");
    } catch (e) {
      toast("恢复失败：" + e.message);
    }
  };
});
