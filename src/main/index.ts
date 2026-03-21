import { ipcMain, dialog } from 'electron'

ipcMain.handle('dialog:open-directory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    })
    if (canceled) return null
    return filePaths[0]
})