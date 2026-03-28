import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'node:path'
import { Stats } from 'fs'

// Mock the fs module for conflict resolution tests
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    existsSync: vi.fn(),
    statSync: vi.fn(),
    unlinkSync: vi.fn(),
    renameSync: vi.fn(),
    copyFileSync: vi.fn(),
  }
})

import fs from 'fs'
import { buildDestPath, resolveConflict, moveOrCopyFile, PathSettings } from '../electron/core/PathBuilder'

const mockExistsSync  = vi.mocked(fs.existsSync)
const mockStatSync    = vi.mocked(fs.statSync)
const mockUnlinkSync  = vi.mocked(fs.unlinkSync)
const mockRenameSync  = vi.mocked(fs.renameSync)
const mockCopySync    = vi.mocked(fs.copyFileSync)

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// buildDestPath
// ---------------------------------------------------------------------------
describe('buildDestPath', () => {
  const base: PathSettings = {
    targetPath: '/target',
    groupMode: 'years',
    monthFormat: 'number',
    folderMask: 'N',
    conflictStrategy: 'skip',
    isMoveMode: false,
  }

  const date = new Date('2023-06-15')

  it('groupMode=years → /<targetPath>/2023', () => {
    const result = buildDestPath(date, { ...base, groupMode: 'years' })
    expect(result).toBe(path.join('/target', '2023'))
  })

  it('groupMode=quarters → /<targetPath>/2023/Q2', () => {
    const result = buildDestPath(date, { ...base, groupMode: 'quarters' })
    expect(result).toBe(path.join('/target', '2023', 'Q2'))
  })

  it('groupMode=months, monthFormat=number → /<targetPath>/2023/06', () => {
    const result = buildDestPath(date, { ...base, groupMode: 'months', monthFormat: 'number' })
    expect(result).toBe(path.join('/target', '2023', '06'))
  })

  it('groupMode=months, monthFormat=name → /<targetPath>/2023/June', () => {
    const result = buildDestPath(date, { ...base, groupMode: 'months', monthFormat: 'name' })
    expect(result).toBe(path.join('/target', '2023', 'June'))
  })

  it('folderMask replaces N placeholder', () => {
    const result = buildDestPath(date, { ...base, groupMode: 'years', folderMask: 'Photos_N' })
    expect(result).toBe(path.join('/target', 'Photos_2023'))
  })

  it('folderMask=N (default) does not modify subFolder', () => {
    const result = buildDestPath(date, { ...base, groupMode: 'years', folderMask: 'N' })
    expect(result).toBe(path.join('/target', '2023'))
  })
})

// ---------------------------------------------------------------------------
// resolveConflict
// ---------------------------------------------------------------------------
describe('resolveConflict', () => {
  const src = '/source/img.jpg'
  const dest = '/target/2023/img.jpg'
  const srcStats = { size: 1024 } as unknown as Stats

  it('returns proceed when destination does not exist', () => {
    mockExistsSync.mockReturnValue(false)
    const result = resolveConflict(dest, src, srcStats, 'skip', 'jpg', false)
    expect(result).toEqual({ action: 'proceed', destFile: dest })
  })

  it('strategy=skip → returns skip when dest exists', () => {
    mockExistsSync.mockReturnValue(true)
    const result = resolveConflict(dest, src, srcStats, 'skip', 'jpg', false)
    expect(result).toEqual({ action: 'skip' })
  })

  it('strategy=replace → returns proceed (same dest path)', () => {
    mockExistsSync.mockReturnValue(true)
    const result = resolveConflict(dest, src, srcStats, 'replace', 'jpg', false)
    expect(result).toEqual({ action: 'proceed', destFile: dest })
  })

  it('strategy=compare_and_delete, same size, copy mode → skip', () => {
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue({ size: 1024 } as unknown as Stats)
    const result = resolveConflict(dest, src, srcStats, 'compare_and_delete', 'jpg', false)
    expect(result).toEqual({ action: 'skip' })
  })

  it('strategy=compare_and_delete, same size, move mode → delete_source', () => {
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue({ size: 1024 } as unknown as Stats)
    const result = resolveConflict(dest, src, srcStats, 'compare_and_delete', 'jpg', true)
    expect(mockUnlinkSync).toHaveBeenCalledWith(src)
    expect(result).toEqual({ action: 'delete_source' })
  })

  it('strategy=compare_and_delete, different size → new timestamped name', () => {
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue({ size: 2048 } as unknown as Stats)
    const result = resolveConflict(dest, src, srcStats, 'compare_and_delete', 'jpg', false)
    expect(result.action).toBe('proceed')
    if (result.action === 'proceed') {
      expect(result.destFile).toMatch(/img_\d+\.jpg$/)
    }
  })
})

// ---------------------------------------------------------------------------
// moveOrCopyFile
// ---------------------------------------------------------------------------
describe('moveOrCopyFile', () => {
  it('calls renameSync in move mode', () => {
    moveOrCopyFile('/src/img.jpg', '/dest/img.jpg', true)
    expect(mockRenameSync).toHaveBeenCalledWith('/src/img.jpg', '/dest/img.jpg')
    expect(mockCopySync).not.toHaveBeenCalled()
  })

  it('calls copyFileSync in copy mode', () => {
    moveOrCopyFile('/src/img.jpg', '/dest/img.jpg', false)
    expect(mockCopySync).toHaveBeenCalledWith('/src/img.jpg', '/dest/img.jpg')
    expect(mockRenameSync).not.toHaveBeenCalled()
  })
})
