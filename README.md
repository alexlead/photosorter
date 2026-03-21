## Secure Electron + Vite + React boilerplate

**Key properties**

- **Security-first**: `contextIsolation` enabled, `nodeIntegration` disabled, sandboxed renderer, restricted preload surface.
- **IPC boundary**: Renderer calls a small `window.electronAPI` interface which forwards to validated IPC handlers in the main process.
- **Vite + React**: Modern React frontend, hot reloading in development, single build output for Electron in production.

### Scripts

- **`npm install`**: Install dependencies.
- **`npm run dev`**: Start Vite dev server and Electron in parallel.
- **`npm run build`**: Build renderer assets and package the Electron app.

### IPC & filesystem operations

- Renderer has **no direct Node.js access**.
- Preload exposes:
  - `window.electronAPI.pickDirectory(): Promise<string | null>`
  - `window.electronAPI.listDirectory(dirPath: string): Promise<{ name; isFile; isDirectory }[]>`
- Main process:
  - Implements `ipcMain.handle('fs:pick-directory')` and `ipcMain.handle('fs:list-directory', ...)`.
  - Validates basic argument types and uses `fs.promises` for filesystem access.

To add new operations:

1. **Main process** (`electron/main.js`): Add a new `ipcMain.handle('channel', handler)` with input validation and any required path restrictions (e.g. confining to a workspace).
2. **Preload** (`electron/preload.js`): Add a corresponding wrapper on `contextBridge.exposeInMainWorld('electronAPI', { ... })`.
3. **Renderer** (`src/renderer/*.tsx`): Call `window.electronAPI.yourMethod(...)` instead of using `ipcRenderer` directly.

# photosorter
A high-performance desktop automation tool built to organize messy photo and video archives into a clean, chronological folder structure.
