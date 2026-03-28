import path from 'node:path'
import fs from 'fs'
import { IpcMainInvokeEvent } from 'electron'
import { FilterOptions, FilteredFile, applyFilter, scanDirectory, flattenFiles } from './fileFilter'
import { logProcessingReport, FolderStat } from './devLogger'

export interface ProcessSettings {
  targetPath: string
  isMoveMode: boolean
  groupMode: 'years' | 'quarters' | 'months'
  monthFormat: 'name' | 'number'
  folderMask: string
  conflictStrategy: 'skip' | 'replace' | 'compare_and_delete'
}

export interface LogEntry {
  id: string
  timestamp: string
  source: string
  destination: string
  status: string
}

function buildLogEntry(status: string, source: string, destination: string): LogEntry {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    source,
    destination,
    status,
  }
}

/**
 * Resolves the destination sub-folder path based on groupMode, monthFormat, and folderMask.
 */
function buildSubFolder(
  fileDate: Date,
  groupMode: ProcessSettings['groupMode'],
  monthFormat: ProcessSettings['monthFormat'],
  folderMask: string
): string {
  const year = fileDate.getFullYear().toString()
  const month = (fileDate.getMonth() + 1).toString().padStart(2, '0')
  const monthName = fileDate.toLocaleString('en-US', { month: 'long' })
  const quarter = Math.floor(fileDate.getMonth() / 3 + 1).toString()

  let subFolder = ''
  if (groupMode === 'years') subFolder = year
  else if (groupMode === 'quarters') subFolder = path.join(year, `Q${quarter}`)
  else if (groupMode === 'months') {
    const m = monthFormat === 'name' ? monthName : month
    subFolder = path.join(year, m)
  }

  if (folderMask && folderMask !== 'N') {
    subFolder = folderMask.replace('N', subFolder)
  }

  return subFolder
}

/**
 * Resolves the final destination file path, handling conflicts according to conflictStrategy.
 * Returns:
 *  - { destFile, action: 'proceed' }    — continue with copy/move
 *  - { destFile, action: 'skip' }       — skip this file entirely
 *  - { destFile, action: 'delete_src' } — delete source (move mode duplicate)
 */
function resolveConflict(
  destDir: string,
  fileName: string,
  ext: string,
  stats: fs.Stats,
  conflictStrategy: ProcessSettings['conflictStrategy'],
  isMoveMode: boolean
): { destFile: string; action: 'proceed' | 'skip' | 'delete_src' } {
  const destFile = path.join(destDir, fileName)

  if (!fs.existsSync(destFile)) {
    return { destFile, action: 'proceed' }
  }

  if (conflictStrategy === 'skip') {
    return { destFile, action: 'skip' }
  }

  if (conflictStrategy === 'replace') {
    return { destFile, action: 'proceed' }
  }

  if (conflictStrategy === 'compare_and_delete') {
    const destStats = fs.statSync(destFile)
    if (stats.size === destStats.size) {
      return { destFile, action: isMoveMode ? 'delete_src' : 'skip' }
    }
    // Different size — rename to avoid collision
    const name = path.parse(fileName).name
    const renamedDest = path.join(destDir, `${name}_${Date.now()}.${ext}`)
    return { destFile: renamedDest, action: 'proceed' }
  }

  return { destFile, action: 'proceed' }
}

/**
 * Main processing entry-point.
 * Iterates all files in the source directory, applies filters, then copies or moves each file
 * to the computed destination. Progress is streamed via IPC log-update events.
 * In dev mode, prints a scan report and a per-folder processing summary to the console.
 */
export async function processFiles(
  event: IpcMainInvokeEvent,
  filter: FilterOptions,
  settings: ProcessSettings
): Promise<void> {
  // Normalize filter values — IPC JSON serialization can turn booleans into
  // strings and numbers into strings depending on how the renderer builds the object.
  const normalizedFilter: FilterOptions = {
    ...filter,
    includeSubfolders: filter.includeSubfolders === true || (filter.includeSubfolders as unknown) === 'true',
    minSize: Number(filter.minSize) || 0,
    maxSize: Number(filter.maxSize) || Infinity,
    selectedExtensions: Array.isArray(filter.selectedExtensions) ? filter.selectedExtensions : [],
  }

  const { sourcePath, includeSubfolders } = normalizedFilter
  const { targetPath, isMoveMode, groupMode, monthFormat, folderMask, conflictStrategy } = settings

  const sendLog = (status: string, source: string, destination: string) => {
    event.sender.send('log-update', buildLogEntry(status, source, destination))
  }

  // ── 1. Scan directory tree (also prints dev scan report) ──────────────────
  const dirEntries = scanDirectory(sourcePath, includeSubfolders)
  const allFiles = flattenFiles(dirEntries)

  // Build a map: folder path → { totalFiles, processedFiles } for the report
  const folderStats = new Map<string, { total: number; processed: number }>()
  for (const entry of dirEntries) {
    folderStats.set(entry.dir, { total: entry.files.length, processed: 0 })
  }

  // ── 2. Process each file ──────────────────────────────────────────────────
  for (const filePath of allFiles) {
    try {
      const filtered: FilteredFile | null = await applyFilter(filePath, normalizedFilter)

      const folderKey = path.dirname(filePath)

      if (!filtered) continue

      const { ext, stats, fileDate } = filtered
      const subFolder = buildSubFolder(fileDate, groupMode, monthFormat, folderMask)
      const destDir = path.join(targetPath, subFolder)

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      const fileName = path.basename(filePath)
      const { destFile, action } = resolveConflict(
        destDir,
        fileName,
        ext,
        stats,
        conflictStrategy,
        isMoveMode
      )

      if (action === 'skip') {
        sendLog('skipped', filePath, destFile)
        continue
      }

      if (action === 'delete_src') {
        fs.unlinkSync(filePath)
        sendLog('deleted_duplicate', filePath, destFile)
        // Counts as "processed" — intentional outcome
        const s = folderStats.get(folderKey)
        if (s) s.processed++
        continue
      }

      // action === 'proceed'
      if (isMoveMode) {
        fs.renameSync(filePath, destFile)
        sendLog('moved', filePath, destFile)
      } else {
        fs.copyFileSync(filePath, destFile)
        sendLog('copied', filePath, destFile)
      }

      const s = folderStats.get(folderKey)
      if (s) s.processed++

    } catch (err: any) {
      sendLog('error', filePath, err.message)
    }
  }

  // ── 3. Dev-mode processing report ─────────────────────────────────────────
  const report: FolderStat[] = Array.from(folderStats.entries()).map(([folder, s]) => ({
    folder,
    totalFiles: s.total,
    processedFiles: s.processed,
  }))

  logProcessingReport(report)
}