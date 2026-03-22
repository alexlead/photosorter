import { ipcMain as P, dialog as K, app as w, BrowserWindow as L, Menu as z, shell as X } from "electron";
import { fileURLToPath as Z } from "node:url";
import e from "node:path";
import ee from "os";
import o from "fs";
const F = e.dirname(Z(import.meta.url)), te = () => ee.platform() === "win32" ? process.env.SystemDrive || "C:\\" : "/", O = () => e.dirname(process.execPath);
process.env.APP_ROOT = e.join(F, "..");
const j = process.env.VITE_DEV_SERVER_URL, ce = e.join(process.env.APP_ROOT, "dist-electron"), U = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = j ? e.join(process.env.APP_ROOT, "public") : U;
let p;
function oe() {
  const d = new L({
    width: 450,
    height: 380,
    resizable: !1,
    title: "About PhotoSorter",
    autoHideMenuBar: !0,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0
    }
  }), m = `
    <!DOCTYPE html>
    <html style="background: #f8fafc; color: #1e293b; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
      <body style="padding: 2rem; line-height: 1.5;">
        <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #2563eb;">PhotoSorter</h1>
        <p style="margin-bottom: 1rem;">A high-performance desktop automation tool built to organize messy photo and video archives into a clean, chronological folder structure.</p>
        <p style="margin-bottom: 1rem;"><strong>Technologies:</strong> Electron, React, Vite, TypeScript, Tailwind CSS.</p>
        <p style="margin-bottom: 0.5rem; font-weight: 600;">Author: Aleksandr Razavodovskii</p>
        <p><a href="https://github.com/alexlead/photosorter" style="color: #2563eb; text-decoration: none;">https://github.com/alexlead/photosorter</a></p>
        <div style="margin-top: 2rem; font-size: 0.8rem; color: #64748b;">Version: ${w.getVersion()}</div>
      </body>
    </html>
  `;
  d.webContents.on("will-navigate", (n, f) => {
    f.startsWith("http") && (n.preventDefault(), X.openExternal(f));
  }), d.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(m)}`);
}
function ne() {
  const d = [
    {
      label: "PhotoSorter",
      submenu: [
        {
          label: "About PhotoSorter",
          click: () => oe()
        },
        { type: "separator" },
        { role: "quit" }
      ]
    }
  ], m = z.buildFromTemplate(d);
  z.setApplicationMenu(m);
}
function N() {
  ne(), p = new L({
    icon: e.join(process.env.VITE_PUBLIC, "icon.png"),
    webPreferences: {
      preload: e.join(F, "preload.mjs")
    }
  }), p.webContents.on("did-finish-load", () => {
    p == null || p.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), j ? p.loadURL(j) : p.loadFile(e.join(U, "index.html"));
}
P.handle("dialog:open-directory", async (d, m) => {
  let n = m || O();
  for (; n && !o.existsSync(n); ) {
    const l = e.dirname(n);
    if (l === n) {
      n = O();
      break;
    }
    n = l;
  }
  const { canceled: f, filePaths: E } = await K.showOpenDialog({
    properties: ["openDirectory"],
    defaultPath: n
  });
  return f ? null : E[0];
});
P.handle("app:get-version", () => w.getVersion());
P.handle("app:get-default-path", () => te());
P.handle("app:process-files", async (d, { filter: m, settings: n }) => {
  const { sourcePath: f, includeSubfolders: E, typeMode: l, selectedExtensions: $, customExtensions: W, fileNameContains: M, dateStart: A, dateEnd: C, minSize: q, maxSize: B } = m, { targetPath: Y, isMoveMode: k, groupMode: _, monthFormat: H, folderMask: R, conflictStrategy: x } = n, u = (s, i, b) => {
    const t = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      source: i,
      destination: b,
      status: s
    };
    d.sender.send("log-update", t);
  }, I = (s) => {
    let i = [];
    return o.existsSync(s) && o.readdirSync(s).forEach((t) => {
      const c = e.join(s, t), a = o.statSync(c);
      a && a.isDirectory() ? E && (i = i.concat(I(c))) : i.push(c);
    }), i;
  };
  try {
    const s = I(f), i = ["jpg", "jpeg", "png", "gif", "webp", "heic", "raw"], b = ["mp4", "mov", "avi", "mkv", "wmv"];
    for (const t of s) {
      const c = o.statSync(t), a = e.extname(t).toLowerCase().replace(".", "");
      let h = !1;
      if (l === "all" ? h = [...i, ...b].includes(a) : l === "photo" ? h = i.includes(a) : l === "video" ? h = b.includes(a) : l === "selected" ? h = $.includes(a) : l === "custom" && (h = W.split(",").map((T) => T.trim().toLowerCase()).includes(a)), !h || M && !e.basename(t).toLowerCase().includes(M.toLowerCase()) || c.size < q * 1024 || c.size > B * 1024) continue;
      const g = c.mtime;
      if (A && g < new Date(A) || C && g > new Date(C)) continue;
      const D = g.getFullYear().toString(), Q = (g.getMonth() + 1).toString().padStart(2, "0"), G = g.toLocaleString("en-US", { month: "long" }), J = Math.floor(g.getMonth() / 3 + 1).toString();
      let y = "";
      if (_ === "years") y = D;
      else if (_ === "quarters") y = e.join(D, `Q${J}`);
      else if (_ === "months") {
        const S = H === "name" ? G : Q;
        y = e.join(D, S);
      }
      R && R !== "N" && (y = R.replace("N", y));
      const v = e.join(Y, y);
      o.existsSync(v) || o.mkdirSync(v, { recursive: !0 });
      const V = e.basename(t);
      let r = e.join(v, V);
      if (o.existsSync(r)) {
        if (x === "skip") {
          u("skipped", t, r);
          continue;
        } else if (x !== "replace") {
          if (x === "compare_and_delete") {
            const S = o.statSync(r);
            if (c.size === S.size) {
              k ? (o.unlinkSync(t), u("deleted_duplicate", t, r)) : u("skipped_duplicate", t, r);
              continue;
            } else {
              const T = e.parse(V).name;
              r = e.join(v, `${T}_${Date.now()}.${a}`);
            }
          }
        }
      }
      try {
        k ? (o.renameSync(t, r), u("moved", t, r)) : (o.copyFileSync(t, r), u("copied", t, r));
      } catch (S) {
        u("error", t, S.message);
      }
    }
  } catch (s) {
    throw console.error("Processing error:", s), s;
  }
});
w.on("window-all-closed", () => {
  process.platform !== "darwin" && (w.quit(), p = null);
});
w.on("activate", () => {
  L.getAllWindows().length === 0 && N();
});
w.whenReady().then(N);
export {
  ce as MAIN_DIST,
  U as RENDERER_DIST,
  j as VITE_DEV_SERVER_URL
};
