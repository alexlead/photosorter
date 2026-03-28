import path from 'node:path'
import fs from 'fs'
import exifr from 'exifr'

export const photoExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'raw']
export const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'wmv']

const MIN_YEAR = 1980

// ---------------------------------------------------------------------------
// Filename date patterns
// ---------------------------------------------------------------------------
//
// Each entry is { regex, toDate(match) → Date }.
// Patterns are tried in order — put more specific ones first.
//
// Supported examples:
//   WhatsApp Image 2026-03-13 at 21.24.02.jpeg   → YYYY-MM-DD
//   Screen Recording (20.05.2024 10-58-58).wmv   → DD.MM.YYYY
//   20250328_111923.jpg                           → YYYYMMDD
//   VID-20250414-WA0000.mp4                       → YYYYMMDD (after prefix)
//   IMG-20250413-WA0053.jpg                       → YYYYMMDD (after prefix)
//   2024_05_20_some_file.mp4                      → YYYY_MM_DD
//   file_2024-05-20T10-58-58_end.jpg              → YYYY-MM-DD (ISO-like)
//   photo 13-03-2026.jpg                          → DD-MM-YYYY
//   snapshot_2024.05.20.png                       → YYYY.MM.DD
//   recording 2024 05 20.mkv                      → YYYY MM DD (space-sep)
// ---------------------------------------------------------------------------

interface DatePattern {
  regex: RegExp
  toDate: (m: RegExpMatchArray) => Date | null
}

const DATE_PATTERNS: DatePattern[] = [
  // YYYY-MM-DD  (ISO, WhatsApp style)
  {
    regex: /(?<![0-9])(\d{4})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])(?![0-9])/,
    toDate: (m) => makeDate(+m[1], +m[2], +m[3]),
  },
  // YYYYMMDD  (compact, VID-/IMG- prefixes, plain)
  {
    regex: /(?<![0-9])(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?![0-9])/,
    toDate: (m) => makeDate(+m[1], +m[2], +m[3]),
  },
  // DD.MM.YYYY  (European dot-separated)
  {
    regex: /(?<![0-9])(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.(\d{4})(?![0-9])/,
    toDate: (m) => makeDate(+m[3], +m[2], +m[1]),
  },
  // DD-MM-YYYY  (European dash-separated)
  {
    regex: /(?<![0-9])(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-(\d{4})(?![0-9])/,
    toDate: (m) => makeDate(+m[3], +m[2], +m[1]),
  },
  // YYYY MM DD  (space-separated)
  {
    regex: /(?<![0-9])(\d{4})\s(0[1-9]|1[0-2])\s(0[1-9]|[12]\d|3[01])(?![0-9])/,
    toDate: (m) => makeDate(+m[1], +m[2], +m[3]),
  },
]

/** Constructs a Date and validates it. Returns null when out of realistic range. */
function makeDate(year: number, month: number, day: number): Date | null {
  if (year < MIN_YEAR || year > new Date().getFullYear() + 1) return null
  const d = new Date(year, month - 1, day)
  // Verify no date overflow (e.g. Feb 30)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return d
}

function isRealistic(d: Date): boolean {
  return !isNaN(d.getTime()) && d.getFullYear() >= MIN_YEAR
}

/**
 * Step 1 — try to extract a date from the filename itself.
 */
function dateFromFilename(filePath: string): Date | null {
  const name = path.basename(filePath)

  for (const { regex, toDate } of DATE_PATTERNS) {
    const m = name.match(regex)
    if (m) {
      const d = toDate(m)
      if (d && isRealistic(d)) return d
    }
  }

  return null
}

// EXIF tags that carry the actual shutter-press moment for photos.
// Priority: DateTimeOriginal (shutter) → DateTimeDigitized (scan) → DateTime (file-level).
const PHOTO_DATE_TAGS = [
  'DateTimeOriginal',   // Exif: moment of capture (shutter press)  ← "дата съемки"
  'DateTimeDigitized',  // Exif: moment of digitization (scanned film etc.)
  'DateTime',           // Exif: file change timestamp, last resort
  'GPSDateStamp',       // GPS date embedded by camera
] as const

// Tags that carry the multimedia creation moment for video files.
// Priority: most-specific first.
const VIDEO_DATE_TAGS = [
  'DateTimeOriginal',                 // some cameras embed this in MP4 as well
  'MediaCreateDate',                  // QuickTime/MP4: when media track was created ← "дата создания мультимедиа"
  'TrackCreateDate',                  // QuickTime/MP4: track creation timestamp
  'CreateDate',                       // QuickTime/MP4: container creation date
  'CreationDate',                     // alternative spelling used by some encoders
  'com.apple.quicktime.creationdate', // Apple proprietary tag (iOS recordings)
] as const

/** Try each tag in order; return the first realistic Date found, or null. */
function pickFirstRealistic(meta: Record<string, unknown>, tags: readonly string[]): Date | null {
  for (const tag of tags) {
    const raw = meta[tag]
    if (!raw) continue
    const d = new Date(raw as string | number)
    if (isRealistic(d)) return d
  }
  return null
}

/**
 * Step 2 — try to extract a date from EXIF / media metadata.
 *
 * Photos: looks for "дата съемки" (shutter-press) tags in priority order.
 * Videos: looks for "дата создания мультимедиа" tags in priority order.
 */
async function dateFromMetadata(
  filePath: string,
  ext: string
): Promise<Date | null> {
  try {
    if (photoExts.includes(ext)) {
      const meta = await exifr.parse(filePath, { pick: [...PHOTO_DATE_TAGS] })
      if (meta) {
        const d = pickFirstRealistic(meta, PHOTO_DATE_TAGS)
        if (d) return d
      }
    } else if (videoExts.includes(ext)) {
      const meta = await exifr.parse(filePath, { pick: [...VIDEO_DATE_TAGS] })
      if (meta) {
        const d = pickFirstRealistic(meta, VIDEO_DATE_TAGS)
        if (d) return d
      }
    }
  } catch (e) {
    console.error(`Error reading metadata for ${filePath}:`, e)
  }

  return null
}

/**
 * Step 3 — fall back to filesystem timestamps (earlier of birthtime and mtime).
 */
function dateFromFilesystem(stats: fs.Stats): Date {
  return new Date(Math.min(stats.birthtimeMs, stats.mtimeMs))
}

// ---------------------------------------------------------------------------

/**
 * Returns the best available date for a media file using a three-step strategy:
 *   1. Date pattern detected in the filename
 *   2. Date from EXIF / media metadata (must be realistic: year ≥ 1980)
 *   3. Earlier of filesystem birthtime and mtime
 */
export async function getFileDate(
  filePath: string,
  ext: string,
  stats: fs.Stats
): Promise<Date> {
  // 1. Filename pattern
  const fromName = dateFromFilename(filePath)
  if (fromName) return fromName

  // 2. Metadata
  const fromMeta = await dateFromMetadata(filePath, ext)
  if (fromMeta) return fromMeta

  // 3. Filesystem timestamps
  return dateFromFilesystem(stats)
}