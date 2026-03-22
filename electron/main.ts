import { app, BrowserWindow, dialog, ipcMain, Menu, shell, MenuItemConstructorOptions } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'os'
import fs from 'fs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const getRootPath = () => {
  return os.platform() === 'win32' ? process.env.SystemDrive || 'C:\\' : '/'
}

const getAppDir = () => {
  return path.dirname(process.execPath);
}

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

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
        <div style="margin-top: 2rem; font-size: 0.8rem; color: #64748b;">Version: ${app.getVersion()}</div>
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
          click: () => createAboutWindow()
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  setupMenu()
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

ipcMain.handle('dialog:open-directory', async (_, currentPath?: string) => {

  let validPath = currentPath || getAppDir();

  while (validPath && !fs.existsSync(validPath)) {
    const parent = path.dirname(validPath);
    if (parent === validPath) {
      validPath = getAppDir();
      break;
    }
    validPath = parent;
  }

  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    defaultPath: validPath
  });

  return canceled ? null : filePaths[0];
});

ipcMain.handle('app:get-version', () => {
  return app.getVersion()
})

ipcMain.handle('app:get-default-path', () => {
  return getRootPath()
})

ipcMain.handle('app:process-files', async (event, { filter, settings }) => {
  const { sourcePath, includeSubfolders, typeMode, selectedExtensions, customExtensions, fileNameContains, dateStart, dateEnd, minSize, maxSize } = filter;
  const { targetPath, isMoveMode, groupMode, monthFormat, folderMask, conflictStrategy } = settings;

  const sendLog = (status: string, source: string, destination: string) => {
    const log = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      source,
      destination,
      status
    };
    event.sender.send('log-update', log);
  };

  const getFiles = (dir: string): string[] => {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        if (includeSubfolders) {
          results = results.concat(getFiles(fullPath));
        }
      } else {
        results.push(fullPath);
      }
    });
    return results;
  };

  try {
    const allFiles = getFiles(sourcePath);
    const photoExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'raw'];
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv'];

    for (const file of allFiles) {
      const stats = fs.statSync(file);
      const ext = path.extname(file).toLowerCase().replace('.', '');

      // Filter by type
      let matchesType = false;
      if (typeMode === 'all') matchesType = [...photoExts, ...videoExts].includes(ext);
      else if (typeMode === 'photo') matchesType = photoExts.includes(ext);
      else if (typeMode === 'video') matchesType = videoExts.includes(ext);
      else if (typeMode === 'selected') matchesType = selectedExtensions.includes(ext);
      else if (typeMode === 'custom') {
        const custom = customExtensions.split(',').map((e: string) => e.trim().toLowerCase());
        matchesType = custom.includes(ext);
      }
      if (!matchesType) continue;

      // Filter by name
      if (fileNameContains && !path.basename(file).toLowerCase().includes(fileNameContains.toLowerCase())) continue;

      // Filter by size
      if (stats.size < minSize * 1024) continue;
      if (stats.size > maxSize * 1024) continue;

      // Filter by date
      const fileDate = stats.mtime;
      if (dateStart && fileDate < new Date(dateStart)) continue;
      if (dateEnd && fileDate > new Date(dateEnd)) continue;

      // Generate destination path
      const year = fileDate.getFullYear().toString();
      const month = (fileDate.getMonth() + 1).toString().padStart(2, '0');
      const monthName = fileDate.toLocaleString('en-US', { month: 'long' });
      const quarter = Math.floor(fileDate.getMonth() / 3 + 1).toString();

      let subFolder = "";
      if (groupMode === 'years') subFolder = year;
      else if (groupMode === 'quarters') subFolder = path.join(year, `Q${quarter}`);
      else if (groupMode === 'months') {
        const m = monthFormat === 'name' ? monthName : month;
        subFolder = path.join(year, m);
      }

      // Apply mask
      if (folderMask && folderMask !== 'N') {
        subFolder = folderMask.replace('N', subFolder);
      }

      const destDir = path.join(targetPath, subFolder);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const fileName = path.basename(file);
      let destFile = path.join(destDir, fileName);

      // Conflict Resolution
      if (fs.existsSync(destFile)) {
        if (conflictStrategy === 'skip') {
          sendLog('skipped', file, destFile);
          continue;
        } else if (conflictStrategy === 'replace') {
          // Will replace
        } else if (conflictStrategy === 'compare_and_delete') {
          const destStats = fs.statSync(destFile);
          if (stats.size === destStats.size) {
            if (isMoveMode) {
              fs.unlinkSync(file);
              sendLog('deleted_duplicate', file, destFile);
            } else {
              sendLog('skipped_duplicate', file, destFile);
            }
            continue;
          } else {
            const name = path.parse(fileName).name;
            destFile = path.join(destDir, `${name}_${Date.now()}.${ext}`);
          }
        }
      }

      try {
        if (isMoveMode) {
          fs.renameSync(file, destFile);
          sendLog('moved', file, destFile);
        } else {
          fs.copyFileSync(file, destFile);
          sendLog('copied', file, destFile);
        }
      } catch (err: any) {
        sendLog('error', file, err.message);
      }
    }
  } catch (error: any) {
    console.error("Processing error:", error);
    throw error;
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
