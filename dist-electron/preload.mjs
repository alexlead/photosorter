"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => process.env.npm_package_version || "1.0.0",
  getDefaultPath: () => electron.ipcRenderer.invoke("app:get-default-path"),
  selectFolder: (currentPath) => electron.ipcRenderer.invoke("dialog:open-directory", currentPath),
  processFiles: (filter, settings) => electron.ipcRenderer.invoke("app:process-files", { filter, settings }),
  onLogUpdate: (callback) => {
    electron.ipcRenderer.on("log-update", (_event, log) => callback(log));
  }
});
