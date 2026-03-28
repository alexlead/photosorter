/**
 * devLogger.ts
 * Console output helpers that are active only in development mode.
 * In production builds all calls are no-ops.
 */

const isDev = process.env.NODE_ENV !== 'production' && !!process.env.VITE_DEV_SERVER_URL

// ── ANSI color helpers (work in Electron's Node.js main-process terminal) ───

const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
}

function header(text: string) {
    console.log(`\n${c.bold}${c.cyan}${'─'.repeat(60)}${c.reset}`)
    console.log(`${c.bold}${c.cyan}  ${text}${c.reset}`)
    console.log(`${c.bold}${c.cyan}${'─'.repeat(60)}${c.reset}`)
}

// ── Scan report ──────────────────────────────────────────────────────────────

export interface ScanReport {
    rootDir: string
    subDirs: string[]
    /** total files found (before any filtering) */
    totalFiles: number
}

/**
 * Prints a scan summary:
 *
 *   ────────────────────────────────────────────────────────────
 *     [SCAN] Source directory: /home/user/Photos
 *   ────────────────────────────────────────────────────────────
 *     Total files found : 128
 *     Subfolders        : 3
 *       • 2024
 *       • 2025
 *       • 2026
 */
export function logScanReport(report: ScanReport): void {
    if (!isDev) return

    header(`[SCAN] Source directory: ${report.rootDir}`)
    console.log(`  ${c.green}Total files found${c.reset} : ${c.bold}${report.totalFiles}${c.reset}`)
    console.log(`  ${c.green}Subfolders        ${c.reset} : ${c.bold}${report.subDirs.length}${c.reset}`)
    if (report.subDirs.length > 0) {
        for (const dir of report.subDirs) {
            console.log(`    ${c.gray}•${c.reset} ${dir}`)
        }
    } else {
        console.log(`    ${c.dim}(none — root only)${c.reset}`)
    }
}

// ── Per-folder processing stats ──────────────────────────────────────────────

export interface FolderStat {
    /** Absolute path of the folder */
    folder: string
    /** Number of files found in this folder (not counting subfolders) */
    totalFiles: number
    /** Number of files that passed the filter and were processed */
    processedFiles: number
}

/**
 * Prints the per-folder processing report:
 *
 *   ────────────────────────────────────────────────────────────
 *     [REPORT] Processing summary
 *   ────────────────────────────────────────────────────────────
 *     Folder                          Total   Processed
 *     /home/user/Photos               10      5
 *     /home/user/Photos/2024          32      20
 *     /home/user/Photos/2025          86      80
 */
export function logProcessingReport(stats: FolderStat[]): void {
    if (!isDev) return

    header('[REPORT] Processing summary')

    const COL_FOLDER = 44
    const COL_NUM = 10

    const pad = (s: string, n: number) => s.padEnd(n)
    const num = (n: number, width: number) => String(n).padStart(width)

    // Table header
    console.log(
        `  ${c.bold}${pad('Folder', COL_FOLDER)}${pad('Total', COL_NUM)}Processed${c.reset}`
    )
    console.log(`  ${c.dim}${'─'.repeat(COL_FOLDER + COL_NUM + 9)}${c.reset}`)

    for (const s of stats) {
        const ratio = s.totalFiles > 0 ? s.processedFiles / s.totalFiles : 0
        const color = ratio === 0 ? c.gray : ratio < 1 ? c.yellow : c.green

        console.log(
            `  ${color}${pad(s.folder, COL_FOLDER)}` +
            `${num(s.totalFiles, COL_NUM - 2)}  ` +
            `${num(s.processedFiles, 9)}${c.reset}`
        )
    }

    // Totals row
    const totalFiles = stats.reduce((acc, s) => acc + s.totalFiles, 0)
    const totalProcessed = stats.reduce((acc, s) => acc + s.processedFiles, 0)

    console.log(`  ${c.dim}${'─'.repeat(COL_FOLDER + COL_NUM + 9)}${c.reset}`)
    console.log(
        `  ${c.bold}${pad('TOTAL', COL_FOLDER)}` +
        `${num(totalFiles, COL_NUM - 2)}  ` +
        `${num(totalProcessed, 9)}${c.reset}\n`
    )
}