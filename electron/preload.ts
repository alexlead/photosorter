import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => process.env.npm_package_version || '1.0.0',
  getDefaultPath: () => ipcRenderer.invoke('app:get-default-path'),
  selectFolder: (currentPath?: string) => ipcRenderer.invoke('dialog:open-directory', currentPath),
  processFiles: (filter: any, settings: any) => ipcRenderer.invoke('app:process-files', { filter, settings }),
  onLogUpdate: (callback: (log: any) => void) => {
    ipcRenderer.on('log-update', (_event, log) => callback(log));
  }
})
