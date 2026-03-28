import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Stats } from 'fs'

// Mock exifr before importing FileProcessor
vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(),
  },
}))

import exifr from 'exifr'
import { getFileDate } from '../electron/core/FileProcessor'

function makeStats(birthtimeMs: number, mtimeMs: number): Stats {
  return { birthtimeMs, mtimeMs } as unknown as Stats
}

const mockParse = vi.mocked(exifr.parse)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getFileDate — photos', () => {
  it('returns EXIF DateTimeOriginal when valid and after 1980', async () => {
    const exifDate = new Date('2022-07-15T10:30:00')
    mockParse.mockResolvedValueOnce({ DateTimeOriginal: exifDate })

    const stats = makeStats(
      new Date('2024-01-01').getTime(),
      new Date('2024-01-02').getTime()
    )
    const result = await getFileDate('/photos/img.jpg', 'jpg', stats)
    expect(result.getFullYear()).toBe(2022)
    expect(result.getMonth()).toBe(6) // July
  })

  it('falls back to min(birthtime, mtime) when EXIF date is before 1980', async () => {
    mockParse.mockResolvedValueOnce({ DateTimeOriginal: new Date('1970-01-01') })

    const birthtime = new Date('2023-03-01').getTime()
    const mtime     = new Date('2023-05-10').getTime()
    const stats = makeStats(birthtime, mtime)

    const result = await getFileDate('/photos/old.jpg', 'jpg', stats)
    expect(result.getTime()).toBe(birthtime) // birthtime < mtime
  })

  it('falls back to min(birthtime, mtime) when no EXIF data', async () => {
    mockParse.mockResolvedValueOnce(null)

    const birthtime = new Date('2021-06-01').getTime()
    const mtime     = new Date('2020-01-01').getTime()
    const stats = makeStats(birthtime, mtime)

    const result = await getFileDate('/photos/img.png', 'png', stats)
    expect(result.getTime()).toBe(mtime) // mtime < birthtime
  })

  it('falls back when EXIF throws an error', async () => {
    mockParse.mockRejectedValueOnce(new Error('EXIF read error'))

    const birthtime = new Date('2023-01-01').getTime()
    const mtime     = new Date('2023-02-01').getTime()
    const stats = makeStats(birthtime, mtime)

    const result = await getFileDate('/photos/bad.jpg', 'jpg', stats)
    expect(result.getTime()).toBe(birthtime)
  })
})

describe('getFileDate — videos', () => {
  it('returns CreateDate from metadata when valid', async () => {
    const videoDate = new Date('2021-12-25T08:00:00')
    mockParse.mockResolvedValueOnce({ CreateDate: videoDate })

    const stats = makeStats(
      new Date('2024-01-01').getTime(),
      new Date('2024-01-02').getTime()
    )
    const result = await getFileDate('/videos/clip.mp4', 'mp4', stats)
    expect(result.getFullYear()).toBe(2021)
  })

  it('returns CreationDate if CreateDate is absent', async () => {
    const videoDate = new Date('2019-08-10T12:00:00')
    mockParse.mockResolvedValueOnce({ CreationDate: videoDate })

    const stats = makeStats(
      new Date('2024-01-01').getTime(),
      new Date('2024-01-02').getTime()
    )
    const result = await getFileDate('/videos/clip.mov', 'mov', stats)
    expect(result.getFullYear()).toBe(2019)
  })

  it('falls back when video has no metadata', async () => {
    mockParse.mockResolvedValueOnce(null)

    const birthtime = new Date('2022-05-01').getTime()
    const mtime     = new Date('2022-06-01').getTime()
    const stats = makeStats(birthtime, mtime)

    const result = await getFileDate('/videos/clip.avi', 'avi', stats)
    expect(result.getTime()).toBe(birthtime)
  })
})

describe('getFileDate — unknown extension', () => {
  it('falls back immediately for non-photo/video extensions', async () => {
    const birthtime = new Date('2020-01-01').getTime()
    const mtime     = new Date('2019-01-01').getTime()
    const stats = makeStats(birthtime, mtime)

    const result = await getFileDate('/docs/file.pdf', 'pdf', stats)
    expect(result.getTime()).toBe(mtime) // mtime < birthtime
    expect(mockParse).not.toHaveBeenCalled()
  })
})
