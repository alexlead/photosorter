import { contextBridge, ipcRenderer } from 'electron'

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('api', {
            selectFolder: () => ipcRenderer.invoke('dialog:open-directory'),
        })
    } catch (error) {
        console.error(error)
    }
}