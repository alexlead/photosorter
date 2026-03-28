import { app, BrowserWindow, dialog, ipcMain, Menu, shell, MenuItemConstructorOptions } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'os'
import fs from 'fs'

import { processFiles } from './core/fileProcessor'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const getRootPath = () => {
  return os.platform() === 'win32' ? process.env.SystemDrive || 'C:\\' : '/'
}

const getAppDir = () => {
  return path.dirname(process.execPath)
}

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

function createAboutWindow() {
  const aboutWin = new BrowserWindow({
    width: 450,
    height: 380,
    resizable: false,
    title: 'About PhotoSorter',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const html = `
    <!DOCTYPE html>
    <html style="background: #f8fafc; color: #1e293b; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
      <body style="padding: 2rem; line-height: 1.5;">
        <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #2563eb;">PhotoSorter</h1>
        <p style="margin-bottom: 1rem;">A high-performance desktop automation tool built to organize messy photo and video archives into a clean, chronological folder structure.</p>
        <p style="margin-bottom: 1rem;"><strong>Technologies:</strong> Electron, React, Vite, TypeScript, Tailwind CSS.</p>
        <p style="margin-bottom: 0.5rem; font-weight: 600;">Author: Aleksandr Razavodovskii</p>
        <p><a href="https://github.com/alexlead/photosorter" style="color: #2563eb; text-decoration: none;">https://github.com/alexlead/photosorter</a></p>
        <p><a href="https://github.com/alexlead/photosorter/blob/main/LICENSE" style="color: #2563eb; text-decoration: none;">License: MIT</a></p>
        <p><a href="https://github.com/alexlead/photosorter/blob/main/CHANGELOG.md" style="color: #2563eb; text-decoration: none;">Changelog</a></p>
        <div style="margin-top: 2rem; font-size: 0.8rem; color: #64748b;">Version: ${app.getVersion()}</div>
        <div style="margin-top: 2rem; font-size: 1.2rem;">If you like the app, you can <a href="https://ko-fi.com/aleksandrrazvodovskii">support me</a> on Ko-fi.</div>
      </body>
    </html>
  `

  aboutWin.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  aboutWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
}

function setupMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'PhotoSorter',
      submenu: [
        {
          label: 'About PhotoSorter',
          click: () => createAboutWindow(),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  setupMenu()
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('dialog:open-directory', async (_, currentPath?: string) => {
  let validPath = currentPath || getAppDir()

  while (validPath && !fs.existsSync(validPath)) {
    const parent = path.dirname(validPath)
    if (parent === validPath) {
      validPath = getAppDir()
      break
    }
    validPath = parent
  }

  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    defaultPath: validPath,
  })

  return canceled ? null : filePaths[0]
})

ipcMain.handle('app:get-version', () => {
  return app.getVersion()
})

ipcMain.handle('app:get-default-path', () => {
  return getRootPath()
})

ipcMain.handle('app:process-files', async (event, { filter, settings }) => {
  try {
    await processFiles(event, filter, settings)
  } catch (error: any) {
    console.error('Processing error:', error)
    throw error
  }
})

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
