const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("shiyeDesktop", {
  setWindowTheme: (appearance) =>
    ipcRenderer.invoke("shiye:window-theme", appearance),
  updateStatus: () => ipcRenderer.invoke("shiye:update-status"),
  updateCheck: () => ipcRenderer.invoke("shiye:update-check"),
  updateInstall: () => ipcRenderer.invoke("shiye:update-install"),
  onUpdateStatus: (callback) =>
    ipcRenderer.on("shiye:update-status", (_event, status) => callback(status)),
  setBackgroundMode: (enabled) =>
    ipcRenderer.invoke("shiye:background-mode", enabled),
  aiStatus: () => ipcRenderer.invoke("shiye:ai-status"),
  aiKey: (key) => ipcRenderer.invoke("shiye:ai-key", key),
  aiAsk: (value) => ipcRenderer.invoke("shiye:ai-ask", value),
  videoSearch: (query) => ipcRenderer.invoke("shiye:video-search", query),
  getState: () => ipcRenderer.invoke("shiye:get-state"),
  saveState: (value) => ipcRenderer.invoke("shiye:save-state", value),
  getAsset: (id) => ipcRenderer.invoke("shiye:get-asset", id),
  saveAsset: (value) => ipcRenderer.invoke("shiye:save-asset", value),
  listAssets: () => ipcRenderer.invoke("shiye:list-assets"),
  replaceData: (value) => ipcRenderer.invoke("shiye:replace", value),
  info: () => ipcRenderer.invoke("shiye:info"),
  openData: () => ipcRenderer.invoke("shiye:open-data"),
  openBackups: () => ipcRenderer.invoke("shiye:open-backups"),
  backupNow: () => ipcRenderer.invoke("shiye:backup-now"),
  exportBackup: (model) => ipcRenderer.invoke("shiye:export-backup", model),
  restoreSnapshot: (name) => ipcRenderer.invoke("shiye:restore-snapshot", name),
  importMusic: () => ipcRenderer.invoke("shiye:import-music"),
  news: (refresh) => ipcRenderer.invoke("shiye:news", Boolean(refresh)),
  openArticle: (url) => ipcRenderer.invoke("shiye:open-article", url),
  notify: (title, body) => ipcRenderer.invoke("shiye:notify", { title, body }),
  exportFile: (name, bytes) =>
    ipcRenderer.invoke("shiye:export-file", { name, bytes }),
  onClosing: (callback) => {
    ipcRenderer.on("shiye:closing", () => callback());
  },
  onSave: (callback) =>
    ipcRenderer.on("shiye:save-requested", () => callback()),
  readyToClose: (error) =>
    ipcRenderer.send("shiye:ready-to-close", error || null),
});
