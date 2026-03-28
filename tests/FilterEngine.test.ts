import { describe, it, expect } from 'vitest'
import { Stats } from 'fs'
import {
  matchesType,
  matchesFileName,
  matchesSize,
  matchesDateRange,
  matchesFilter,
} from '../electron/core/FilterEngine'

// Minimal Stats stub
function makeStats(sizeBytes: number): Stats {
  return { size: sizeBytes } as unknown as Stats
}

describe('matchesType', () => {
  it('typeMode=all matches photo extensions', () => {
    expect(matchesType('jpg', 'all', [], '')).toBe(true)
    expect(matchesType('mp4', 'all', [], '')).toBe(true)
  })

  it('typeMode=all rejects unknown extensions', () => {
    expect(matchesType('pdf', 'all', [], '')).toBe(false)
  })

  it('typeMode=photo matches only photos', () => {
    expect(matchesType('jpeg', 'photo', [], '')).toBe(true)
    expect(matchesType('mp4',  'photo', [], '')).toBe(false)
  })

  it('typeMode=video matches only videos', () => {
    expect(matchesType('mov',  'video', [], '')).toBe(true)
    expect(matchesType('png',  'video', [], '')).toBe(false)
  })

  it('typeMode=selected matches listed extensions only', () => {
    expect(matchesType('raw', 'selected', ['raw', 'heic'], '')).toBe(true)
    expect(matchesType('gif', 'selected', ['raw', 'heic'], '')).toBe(false)
  })

  it('typeMode=custom parses comma-separated list', () => {
    expect(matchesType('tiff', 'custom', [], 'tiff, bmp')).toBe(true)
    expect(matchesType('png',  'custom', [], 'tiff, bmp')).toBe(false)
  })
})

describe('matchesFileName', () => {
  it('returns true when no filter is set', () => {
    expect(matchesFileName('/photos/IMG_001.jpg', '')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(matchesFileName('/photos/IMG_001.jpg', 'img')).toBe(true)
    expect(matchesFileName('/photos/IMG_001.jpg', 'IMG')).toBe(true)
  })

  it('returns false when filename does not contain the filter', () => {
    expect(matchesFileName('/photos/IMG_001.jpg', 'vacation')).toBe(false)
  })
})

describe('matchesSize', () => {
  it('passes when file size is within range', () => {
    // 500 KB file, min=100KB, max=1000KB
    expect(matchesSize(makeStats(500 * 1024), 100, 1000)).toBe(true)
  })

  it('fails when file size is below minimum', () => {
    expect(matchesSize(makeStats(50 * 1024), 100, 1000)).toBe(false)
  })

  it('fails when file size exceeds maximum', () => {
    expect(matchesSize(makeStats(2000 * 1024), 100, 1000)).toBe(false)
  })
})

describe('matchesDateRange', () => {
  const date = new Date('2023-06-15')

  it('passes when date is within range', () => {
    expect(matchesDateRange(date, '2023-01-01', '2023-12-31')).toBe(true)
  })

  it('fails when date is before dateStart', () => {
    expect(matchesDateRange(date, '2024-01-01', '2024-12-31')).toBe(false)
  })

  it('fails when date is after dateEnd', () => {
    expect(matchesDateRange(date, '2022-01-01', '2023-01-01')).toBe(false)
  })

  it('passes when no range is set', () => {
    expect(matchesDateRange(date, '', '')).toBe(true)
  })
})

describe('matchesFilter (composite)', () => {
  const stats = makeStats(500 * 1024)
  const fileDate = new Date('2023-06-15')
  const baseFilter = {
    typeMode: 'photo' as const,
    selectedExtensions: [],
    customExtensions: '',
    fileNameContains: '',
    minSize: 0,
    maxSize: 999999,
    dateStart: '',
    dateEnd: '',
  }

  it('passes when all criteria match', () => {
    expect(matchesFilter('/photos/IMG.jpg', 'jpg', stats, fileDate, baseFilter)).toBe(true)
  })

  it('fails when type does not match', () => {
    expect(matchesFilter('/photos/video.mp4', 'mp4', stats, fileDate, baseFilter)).toBe(false)
  })

  it('fails when filename filter does not match', () => {
    const filter = { ...baseFilter, fileNameContains: 'vacation' }
    expect(matchesFilter('/photos/IMG.jpg', 'jpg', stats, fileDate, filter)).toBe(false)
  })

  it('fails when size is too small', () => {
    const filter = { ...baseFilter, minSize: 1000 }
    expect(matchesFilter('/photos/IMG.jpg', 'jpg', stats, fileDate, filter)).toBe(false)
  })

  it('fails when date is out of range', () => {
    const filter = { ...baseFilter, dateEnd: '2022-12-31' }
    expect(matchesFilter('/photos/IMG.jpg', 'jpg', stats, fileDate, filter)).toBe(false)
  })
})
