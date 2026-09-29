const audio = new Audio();
audio.preload = "metadata";
let musicState = {
  selected: null,
  playlist: "all",
  mode: "list",
  seeking: false,
  busy: false,
};
const musicTime = (seconds) =>
  Number.isFinite(seconds)
    ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
    : "0:00";
function selectedTrack() {
  return (model?.music || []).find((t) => t.id === musicState.selected);
}
function playlistTracks() {
  const tracks = model.music || [];
  if (musicState.playlist === "all") return tracks;
  const list = (model.playlists || []).find(
    (p) => p.id === musicState.playlist,
  );
  return list
    ? list.trackIds
        .map((id) => tracks.find((track) => track.id === id))
        .filter(Boolean)
    : tracks;
}
function musicView() {
  const allTracks = model.music || [],
    tracks = playlistTracks(),
    playlists = model.playlists || [],
    active = playlists.find((p) => p.id === musicState.playlist),
    title = active?.name || "全部音乐";
  return `<div class="page-head"><div><h1>音乐</h1><div class="muted">${allTracks.length} 首 · ${playlists.length} 个歌单 · 本地 MP3 / FLAC</div></div><button class="button primary" data-music-action="import" ${musicState.busy ? "disabled" : ""}>${icon("plus", 16)} ${musicState.busy ? "正在导入…" : "导入音乐"}</button></div>
 <div class="music-hero card"><div class="record-art"><div class="record-center">y</div></div><div class="grow"><span class="caps muted">${esc(title)}</span><h2>${esc(selectedTrack()?.title || title)}</h2><p class="muted">${esc(selectedTrack()?.artist || "建立自己的学习、专注和休息歌单。")}</p><div class="row wrap"><button class="button primary" data-music-action="play-all" ${tracks.length ? "" : "disabled"}>${icon("play", 15)} 播放当前歌单</button><span class="tag neutral">无需网络</span></div></div></div>
 <div class="music-layout"><aside class="card playlist-panel"><div class="row between"><h2>歌单</h2><button class="icon-button" data-music-action="new-playlist" aria-label="新建歌单">${icon("plus", 16)}</button></div><button class="playlist-item ${musicState.playlist === "all" ? "active" : ""}" data-playlist-select="all">${icon("music", 16)}<span>全部音乐</span><small>${allTracks.length}</small></button>${playlists.map((p) => `<button class="playlist-item ${musicState.playlist === p.id ? "active" : ""}" data-playlist-select="${p.id}">${icon("folder", 16)}<span>${esc(p.name)}</span><small>${p.trackIds.length}</small></button>`).join("")}${active ? `<button class="text-button playlist-delete" data-music-action="delete-playlist">删除当前歌单</button>` : ""}</aside>
 <section class="card music-library"><div class="music-library-title"><div><h2>${esc(title)}</h2><span class="muted small">${tracks.length} 首</span></div>${active ? '<span class="muted small">点击 ＋ 添加到其他歌单</span>' : ""}</div><div class="music-table-head"><span>歌曲</span><span>专辑</span><span>格式</span><span>时长</span><span></span><span></span></div>${tracks.length ? tracks.map((t, i) => `<div class="music-row ${musicState.selected === t.id ? "active" : ""}"><button class="track-name" data-track-play="${t.id}" aria-label="播放 ${esc(t.title)}"><span class="track-number">${musicState.selected === t.id && !audio.paused ? icon("music", 16) : pad(i + 1)}</span><span class="grow"><strong>${esc(t.title)}</strong><small>${esc(t.artist)}</small></span></button><span class="music-album muted">${esc(t.album || "—")}</span><span class="music-format tag neutral">${t.format}</span><span class="muted small">${musicTime(t.duration)}</span><button class="icon-button" data-track-add="${t.id}" aria-label="添加 ${esc(t.title)} 到歌单">${icon("plus", 15)}</button><button class="icon-button" data-track-remove="${t.id}" aria-label="${active ? "从歌单移除" : "从音乐库移除"} ${esc(t.title)}">${icon("x", 15)}</button></div>`).join("") : '<div class="empty music-empty">' + icon("music", 36) + `<h2>${active ? "歌单还是空的" : "还没有音乐"}</h2><p>${active ? "从全部音乐中点击 ＋ 添加歌曲。" : "点击「导入音乐」，选择电脑中的 MP3 或 FLAC。<br>支持一次导入多首，单曲上限 200 MB。"}</p></div>`}</section></div>`;
}
function renderPlayer() {
  let player = $("#music-player");
  if (!player) {
    player = document.createElement("section");
    player.id = "music-player";
    player.setAttribute("aria-label", "音乐播放控制");
    document.body.append(player);
  }
  const t = selectedTrack();
  const duration = Number.isFinite(audio.duration)
    ? audio.duration
    : t?.duration || 0;
  player.innerHTML = `<button class="player-track" data-page="music"><span class="player-cover">${icon("music", 20)}</span><span><strong>${esc(t?.title || "本地音乐")}</strong><small>${esc(t?.artist || "导入 MP3 / FLAC")}</small></span></button><div class="player-center"><div class="player-buttons"><button class="icon-button" data-music-action="previous" aria-label="上一首">${icon("previous", 16)}</button><button class="player-play" data-music-action="toggle" aria-label="${audio.paused ? "播放" : "暂停"}音乐">${icon(audio.paused ? "play" : "pause", 18)}</button><button class="icon-button" data-music-action="next" aria-label="下一首">${icon("next", 16)}</button></div><div class="player-progress"><span id="music-elapsed">${musicTime(audio.currentTime)}</span><input type="range" id="music-seek" min="0" max="${duration || 1}" step="0.1" value="${audio.currentTime || 0}" aria-label="播放进度" ${t ? "" : "disabled"}><span id="music-duration">${musicTime(duration)}</span></div></div><div class="player-right"><button class="icon-button ${musicState.mode !== "list" ? "active" : ""}" data-music-action="mode" aria-label="播放模式：${{ list: "列表循环", one: "单曲循环", shuffle: "随机播放" }[musicState.mode]}" title="${{ list: "列表循环", one: "单曲循环", shuffle: "随机播放" }[musicState.mode]}">${icon(musicState.mode === "shuffle" ? "shuffle" : "repeat", 17)}${musicState.mode === "one" ? "<small>1</small>" : ""}</button><span class="volume-icon">${icon("volume", 17)}</span><input type="range" id="music-volume" min="0" max="1" step="0.01" value="${audio.volume}" aria-label="音量"></div>`;
}
async function playTrack(id) {
  const track = model.music.find((t) => t.id === id);
  if (!track) return;
  const changed = musicState.selected !== id;
  if (changed || !audio.src) {
    musicState.selected = id;
    audio.src = `yen-media://asset/${track.assetId}`;
  }
  try {
    await audio.play();
    if (ui.page === "music") render();
    renderPlayer();
  } catch (e) {
    toast("无法播放这首音乐：" + e.message);
    renderPlayer();
  }
}
async function nextTrack(direction = 1) {
  const tracks = playlistTracks();
  if (!tracks.length) return;
  if (musicState.mode === "one" && direction === 1) {
    audio.currentTime = 0;
    return playTrack(musicState.selected || tracks[0].id);
  }
  const index = tracks.findIndex((t) => t.id === musicState.selected);
  let next = (index + direction + tracks.length) % tracks.length;
  if (musicState.mode === "shuffle" && tracks.length > 1) {
    do {
      next = Math.floor(Math.random() * tracks.length);
    } while (next === index);
  }
  return playTrack(tracks[next].id);
}
async function importMusicUI() {
  if (musicState.busy) return;
  musicState.busy = true;
  if (ui.page === "music") render();
  try {
    const result = await native.importMusic();
    model.music.push(...result.imported);
    if (result.imported.length) await persist();
    if (result.errors.length) {
      showDialog(
        "部分音乐未导入",
        `<div>${result.errors.map((e) => `<p class="notice">${esc(e.name)}：${esc(e.message)}</p>`).join("")}</div><div class="dialog-actions"><button class="button primary" data-action="close-modal">知道了</button></div>`,
      );
    } else if (result.imported.length)
      toast(`已导入 ${result.imported.length} 首音乐`);
  } finally {
    musicState.busy = false;
    if (ui.page === "music") render();
    renderPlayer();
  }
}
document.addEventListener("click", async (e) => {
  const button = e.target.closest("button");
  if (!button || !model) return;
  try {
    if (button.dataset.playlistSelect) {
      musicState.playlist = button.dataset.playlistSelect;
      render();
      return;
    }
    if (button.dataset.trackAdd) {
      if (!(model.playlists || []).length) {
        showDialog(
          "还没有歌单",
          '<p>先创建一个歌单，再把喜欢的歌曲放进去。</p><div class="dialog-actions"><button class="button primary" data-music-action="new-playlist">新建歌单</button></div>',
        );
      } else {
        showDialog(
          "添加到歌单",
          `<div class="playlist-picker">${model.playlists
            .map(
              (list) =>
                `<button class="button" data-add-to-playlist="${list.id}" data-track-id="${button.dataset.trackAdd}">${esc(list.name)}${list.trackIds.includes(button.dataset.trackAdd) ? " · 已添加" : ""}</button>`,
            )
            .join("")}</div>`,
        );
      }
      return;
    }
    if (button.dataset.addToPlaylist) {
      const list = model.playlists.find(
        (item) => item.id === button.dataset.addToPlaylist,
      );
      if (list && !list.trackIds.includes(button.dataset.trackId)) {
        list.trackIds.push(button.dataset.trackId);
        await persist();
        toast(`已添加到「${list.name}」`);
      } else toast("这首歌已经在歌单中");
      closeModal();
      if (ui.page === "music") render();
      return;
    }
    if (button.dataset.trackPlay) {
      await playTrack(button.dataset.trackPlay);
      return;
    }
    if (button.dataset.trackRemove) {
      if (musicState.playlist !== "all") {
        const list = model.playlists.find(
          (item) => item.id === musicState.playlist,
        );
        const index = list.trackIds.indexOf(button.dataset.trackRemove);
        if (index < 0) return;
        const [trackId] = list.trackIds.splice(index, 1);
        persist();
        render();
        toast("已从当前歌单移除", () => {
          list.trackIds.splice(index, 0, trackId);
          persist();
          render();
        });
        return;
      }
      const index = model.music.findIndex(
        (t) => t.id === button.dataset.trackRemove,
      );
      const track = model.music.splice(index, 1)[0];
      const previousLists = model.playlists.map((list) => [...list.trackIds]);
      model.playlists.forEach(
        (list) =>
          (list.trackIds = list.trackIds.filter((id) => id !== track.id)),
      );
      if (musicState.selected === track.id) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        musicState.selected = null;
      }
      persist();
      render();
      renderPlayer();
      toast("已从播放列表移除", () => {
        model.music.splice(index, 0, track);
        model.playlists.forEach(
          (list, listIndex) => (list.trackIds = previousLists[listIndex]),
        );
        persist();
        render();
        renderPlayer();
      });
      return;
    }
    switch (button.dataset.musicAction) {
      case "import":
        await importMusicUI();
        break;
      case "play-all":
        if (playlistTracks().length) await playTrack(playlistTracks()[0].id);
        break;
      case "new-playlist":
        showDialog(
          "新建歌单",
          '<form id="playlist-form"><label class="field">歌单名称<input name="name" maxlength="60" required autofocus placeholder="例如：专注学习"></label><div class="dialog-actions"><button class="button" type="button" data-action="close-modal">取消</button><button class="button primary" type="submit">创建歌单</button></div></form>',
        );
        break;
      case "delete-playlist": {
        const index = model.playlists.findIndex(
          (list) => list.id === musicState.playlist,
        );
        if (index < 0) break;
        const [list] = model.playlists.splice(index, 1);
        musicState.playlist = "all";
        await persist();
        render();
        toast(`已删除歌单「${list.name}」`, () => {
          model.playlists.splice(index, 0, list);
          persist();
          render();
        });
        break;
      }
      case "toggle":
        if (!audio.paused) audio.pause();
        else if (model.music.length)
          await playTrack(musicState.selected || model.music[0].id);
        else navigate("music");
        break;
      case "next":
        await nextTrack();
        break;
      case "previous":
        await nextTrack(-1);
        break;
      case "mode":
        musicState.mode = { list: "one", one: "shuffle", shuffle: "list" }[
          musicState.mode
        ];
        model.settings.musicMode = musicState.mode;
        persist();
        renderPlayer();
        toast(
          { list: "列表循环", one: "单曲循环", shuffle: "随机播放" }[
            musicState.mode
          ],
        );
        break;
    }
  } catch (err) {
    toast("音乐操作失败：" + err.message);
    musicState.busy = false;
  }
});
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "playlist-form") return;
  e.preventDefault();
  const name = String(new FormData(e.target).get("name") || "").trim();
  if (!name) return;
  const list = { id: uid(), name, trackIds: [] };
  model.playlists.push(list);
  musicState.playlist = list.id;
  await persist();
  closeModal();
  render();
  toast(`已创建歌单「${name}」`);
});
document.addEventListener("input", (e) => {
  if (e.target.id === "music-volume") {
    audio.volume = Number(e.target.value);
    model.settings.musicVolume = audio.volume;
    scheduleSave();
  }
  if (e.target.id === "music-seek") {
    musicState.seeking = true;
    $("#music-elapsed").textContent = musicTime(Number(e.target.value));
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "music-seek") {
    audio.currentTime = Number(e.target.value);
    musicState.seeking = false;
  }
});
audio.addEventListener("timeupdate", () => {
  if (!musicState.seeking) {
    if ($("#music-seek")) $("#music-seek").value = audio.currentTime;
    if ($("#music-elapsed"))
      $("#music-elapsed").textContent = musicTime(audio.currentTime);
  }
});
audio.addEventListener("loadedmetadata", () => {
  const track = selectedTrack();
  if (track && Number.isFinite(audio.duration)) {
    track.duration = audio.duration;
    scheduleSave();
  }
  renderPlayer();
});
audio.addEventListener("play", renderPlayer);
audio.addEventListener("pause", renderPlayer);
audio.addEventListener("ended", () => nextTrack());
audio.addEventListener("error", () => {
  if (audio.getAttribute("src"))
    toast("音频无法读取，请检查文件是否损坏或重新导入。");
});
function initializeMusic() {
  model.music = model.music || [];
  model.playlists = Array.isArray(model.playlists) ? model.playlists : [];
  const trackIds = new Set(model.music.map((track) => track.id));
  model.playlists = model.playlists
    .filter(
      (list) =>
        list &&
        typeof list.id === "string" &&
        typeof list.name === "string" &&
        Array.isArray(list.trackIds),
    )
    .map((list) => ({
      ...list,
      trackIds: [...new Set(list.trackIds.filter((id) => trackIds.has(id)))],
    }));
  audio.volume = Math.min(1, Math.max(0, model.settings.musicVolume ?? 0.7));
  musicState.mode = ["list", "one", "shuffle"].includes(
    model.settings.musicMode,
  )
    ? model.settings.musicMode
    : "list";
  renderPlayer();
}
