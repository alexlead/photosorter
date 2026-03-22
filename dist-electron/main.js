import { ipcMain as P, dialog as J, app as b, BrowserWindow as k, Menu as V, shell as X } from "electron";
import { fileURLToPath as Z } from "node:url";
import e from "node:path";
import ee from "os";
import o from "fs";
const F = e.dirname(Z(import.meta.url)), te = () => ee.platform() === "win32" ? process.env.SystemDrive || "C:\\" : "/", O = () => e.dirname(process.execPath);
process.env.APP_ROOT = e.join(F, "..");
const L = process.env.VITE_DEV_SERVER_URL, ce = e.join(process.env.APP_ROOT, "dist-electron"), N = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = L ? e.join(process.env.APP_ROOT, "public") : N;
let p;
function oe() {
  const d = new k({
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
        <p><a href="https://github.com/alexlead/photosorter/LICENSE" style="color: #2563eb; text-decoration: none;">License: MIT</a></p>
        <p><a href="https://github.com/alexlead/photosorter/CHANGELOG.md" style="color: #2563eb; text-decoration: none;">Changelog</a></p>
        <div style="margin-top: 2rem; font-size: 0.8rem; color: #64748b;">Version: ${b.getVersion()}</div>
        <div style="margin-top: 2rem; font-size: 1.2rem;">If you like the app, you can <a href="https://ko-fi.com/aleksandrrazvodovskii">support me</a> on Ko-fi.</div>
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
  ], m = V.buildFromTemplate(d);
  V.setApplicationMenu(m);
}
function U() {
  ne(), p = new k({
    icon: e.join(process.env.VITE_PUBLIC, "icon.png"),
    webPreferences: {
      preload: e.join(F, "preload.mjs")
    }
  }), p.webContents.on("did-finish-load", () => {
    p == null || p.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), L ? p.loadURL(L) : p.loadFile(e.join(N, "index.html"));
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
  const { canceled: f, filePaths: E } = await J.showOpenDialog({
    properties: ["openDirectory"],
    defaultPath: n
  });
  return f ? null : E[0];
});
P.handle("app:get-version", () => b.getVersion());
P.handle("app:get-default-path", () => te());
P.handle("app:process-files", async (d, { filter: m, settings: n }) => {
  const { sourcePath: f, includeSubfolders: E, typeMode: l, selectedExtensions: $, customExtensions: W, fileNameContains: C, dateStart: j, dateEnd: M, minSize: q, maxSize: B } = m, { targetPath: G, isMoveMode: A, groupMode: x, monthFormat: H, folderMask: _, conflictStrategy: R } = n, h = (s, i, w) => {
    const t = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      source: i,
      destination: w,
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
    const s = I(f), i = ["jpg", "jpeg", "png", "gif", "webp", "heic", "raw"], w = ["mp4", "mov", "avi", "mkv", "wmv"];
    for (const t of s) {
      const c = o.statSync(t), a = e.extname(t).toLowerCase().replace(".", "");
      let u = !1;
      if (l === "all" ? u = [...i, ...w].includes(a) : l === "photo" ? u = i.includes(a) : l === "video" ? u = w.includes(a) : l === "selected" ? u = $.includes(a) : l === "custom" && (u = W.split(",").map((T) => T.trim().toLowerCase()).includes(a)), !u || C && !e.basename(t).toLowerCase().includes(C.toLowerCase()) || c.size < q * 1024 || c.size > B * 1024) continue;
      const g = c.mtime;
      if (j && g < new Date(j) || M && g > new Date(M)) continue;
      const D = g.getFullYear().toString(), Y = (g.getMonth() + 1).toString().padStart(2, "0"), K = g.toLocaleString("en-US", { month: "long" }), Q = Math.floor(g.getMonth() / 3 + 1).toString();
      let y = "";
      if (x === "years") y = D;
      else if (x === "quarters") y = e.join(D, `Q${Q}`);
      else if (x === "months") {
        const S = H === "name" ? K : Y;
        y = e.join(D, S);
      }
      _ && _ !== "N" && (y = _.replace("N", y));
      const v = e.join(G, y);
      o.existsSync(v) || o.mkdirSync(v, { recursive: !0 });
      const z = e.basename(t);
      let r = e.join(v, z);
      if (o.existsSync(r)) {
        if (R === "skip") {
          h("skipped", t, r);
          continue;
        } else if (R !== "replace") {
          if (R === "compare_and_delete") {
            const S = o.statSync(r);
            if (c.size === S.size) {
              A ? (o.unlinkSync(t), h("deleted_duplicate", t, r)) : h("skipped_duplicate", t, r);
              continue;
            } else {
              const T = e.parse(z).name;
              r = e.join(v, `${T}_${Date.now()}.${a}`);
            }
          }
        }
      }
      try {
        A ? (o.renameSync(t, r), h("moved", t, r)) : (o.copyFileSync(t, r), h("copied", t, r));
      } catch (S) {
        h("error", t, S.message);
      }
    }
  } catch (s) {
    throw console.error("Processing error:", s), s;
  }
});
b.on("window-all-closed", () => {
  process.platform !== "darwin" && (b.quit(), p = null);
});
b.on("activate", () => {
  k.getAllWindows().length === 0 && U();
});
b.whenReady().then(U);
export {
  ce as MAIN_DIST,
  N as RENDERER_DIST,
  L as VITE_DEV_SERVER_URL
};
