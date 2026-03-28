import path from 'node:path'
import fs from 'fs'
import { photoExts, videoExts, getFileDate } from './fileUtils'
import { logScanReport } from './devLogger'

export interface FilterOptions {
  sourcePath: string
  includeSubfolders: boolean
  typeMode: 'all' | 'photo' | 'video' | 'selected' | 'custom'
  selectedExtensions: string[]
  customExtensions: string
  fileNameContains: string
  dateStart: string
  dateEnd: string
  minSize: number
  maxSize: number
}

// ── Directory structure ───────────────────────────────────────────────────────

export interface DirEntry {
  /** Absolute path of this directory */
  dir: string
  /** Direct children that are also directories */
  subDirs: string[]
  /** Direct file children (not recursive) */
  files: string[]
}

/**
 * Scans the source directory tree and returns one DirEntry per folder visited.
 * Also prints a dev-mode scan report to the console.
 */
export function scanDirectory(rootDir: string, includeSubfolders: boolean): DirEntry[] {
  const recurse = includeSubfolders === true || (includeSubfolders as unknown) === 'true'
  const entries: DirEntry[] = []

  function visit(dir: string) {
    if (!fs.existsSync(dir)) return

    const subDirs: string[] = []
    const files: string[] = []

    for (const name of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, name)

      let stat: fs.Stats
      try {
        stat = fs.statSync(fullPath)
      } catch {
        continue // skip inaccessible entries
      }

      if (stat.isDirectory()) {
        subDirs.push(name)
        if (recurse) visit(fullPath)
      } else if (stat.isFile()) {
        files.push(fullPath)
      }
    }

    entries.push({ dir, subDirs, files })
  }

  visit(rootDir)

  // Dev-mode: print scan summary for root folder
  const allSubDirs = entries
    .filter(e => e.dir !== rootDir)
    .map(e => path.relative(rootDir, e.dir))

  const totalFiles = entries.reduce((acc, e) => acc + e.files.length, 0)

  logScanReport({ rootDir, subDirs: allSubDirs, totalFiles })

  return entries
}

/**
 * Flattens a DirEntry array into a plain list of all file paths.
 * This replaces the old getFiles() function.
 */
export function flattenFiles(entries: DirEntry[]): string[] {
  return entries.flatMap(e => e.files)
}

/**
 * @deprecated Use scanDirectory() + flattenFiles() instead.
 * Kept for backwards-compatibility.
 */
export function getFiles(dir: string, includeSubfolders: boolean): string[] {
  const entries = scanDirectory(dir, includeSubfolders)
  return flattenFiles(entries)
}

// ── File filter ───────────────────────────────────────────────────────────────

export interface FilteredFile {
  filePath: string
  ext: string
  stats: fs.Stats
  fileDate: Date
}

/**
 * Applies all filter criteria to a single file.
 * Returns a populated FilteredFile if the file passes, or null if it should be skipped.
 */
export async function applyFilter(
  filePath: string,
  filter: FilterOptions
): Promise<FilteredFile | null> {
  const {
    typeMode,
    selectedExtensions,
    customExtensions,
    fileNameContains,
    dateStart,
    dateEnd,
    minSize,
    maxSize,
  } = filter

  const stats = fs.statSync(filePath)

  // Skip anything that is not a regular file (directories, symlinks, etc.)
  if (!stats.isFile()) return null

  const ext = path.extname(filePath).toLowerCase().replace('.', '')

  // Type filter
  let matchesType = false
  if (typeMode === 'all') matchesType = [...photoExts, ...videoExts].includes(ext)
  else if (typeMode === 'photo') matchesType = photoExts.includes(ext)
  else if (typeMode === 'video') matchesType = videoExts.includes(ext)
  else if (typeMode === 'selected') matchesType = selectedExtensions.includes(ext)
  else if (typeMode === 'custom') {
    const custom = customExtensions.split(',').map((e: string) => e.trim().toLowerCase())
    matchesType = custom.includes(ext)
  }
  if (!matchesType) return null

  // Name filter
  if (
    fileNameContains &&
    !path.basename(filePath).toLowerCase().includes(fileNameContains.toLowerCase())
  )
    return null

  // Size filter (minSize / maxSize are in KB)
  if (stats.size < minSize * 1024) return null
  if (stats.size > maxSize * 1024) return null

  // Date filter
  const fileDate = await getFileDate(filePath, ext, stats)
  if (dateStart && fileDate < new Date(dateStart)) return null
  if (dateEnd && fileDate > new Date(dateEnd)) return null

  return { filePath, ext, stats, fileDate }
}