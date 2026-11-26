import { describe, expect, it } from 'vitest'
import { ChunkType } from '../../api'
import { OBJECT_DETAIL_TIERS } from '../../constants'
import { capitalReach, capitalSpawnReach, chunkReach, chunkSpawnRadius, meshStandReach } from './gdeReach'

const high = OBJECT_DETAIL_TIERS.high
const low = OBJECT_DETAIL_TIERS.low

describe('gdeReach', () => {
  describe('chunkSpawnRadius', () => {
    it('has no smallest margin for mesh chunks under 128 m', () => {
      expect(chunkSpawnRadius({ size: 32, chunkType: ChunkType.Mesh, spawnRadius: 32 })).toBe(0)
    })
    it('holds mesh chunks of 128 m to 25', () => {
      expect(chunkSpawnRadius({ size: 128, chunkType: ChunkType.Mesh, spawnRadius: 128 })).toBe(25)
    })
    it('holds static chunks to 25', () => {
      expect(chunkSpawnRadius({ size: 32, chunkType: ChunkType.Static, spawnRadius: 0 })).toBe(25)
    })
    it('keeps a margin above 25', () => {
      expect(chunkSpawnRadius({ size: 64, chunkType: ChunkType.Collision, spawnRadius: 200 })).toBe(136)
    })
  })

  describe('capitalSpawnReach', () => {
    it('holds slices that are not long distance to the near reach', () => {
      expect(capitalSpawnReach(1000, 0, false, high)).toBe(235)
    })
    it('holds long distance slices to the impostor range', () => {
      expect(capitalSpawnReach(2000, 0, true, high)).toBe(1200)
      expect(capitalSpawnReach(2000, 0, true, low)).toBe(600 * 0.8)
    })
    it('scales by the AOI scale and adds the physical radius', () => {
      expect(capitalSpawnReach(100, 10, false, low)).toBe(100 * 0.8 + 10)
    })
  })

  describe('meshStandReach', () => {
    it('stands within the near sweep plus the physical radius', () => {
      expect(meshStandReach(25, 30, false)).toBe(255)
    })
    it('keeps the spawn reach for slices that opt out', () => {
      expect(meshStandReach(25, 30, true)).toBe(25)
    })
  })

  describe('chunkReach', () => {
    it('lets small mesh chunks stand within 225 m plus their size', () => {
      expect(chunkReach({ size: 32, chunkType: ChunkType.Mesh, spawnRadius: 32 }, high)).toBe(257)
    })
    it('lets large chunks stand within 225 m plus their size', () => {
      expect(chunkReach({ size: 1024, chunkType: ChunkType.Static, spawnRadius: 0 }, high)).toBe(1249)
    })
    it('is the same on low spec, the near sweep does not scale', () => {
      expect(chunkReach({ size: 64, chunkType: ChunkType.Static, spawnRadius: 0 }, low)).toBe(289)
    })
  })

  describe('capitalReach', () => {
    it('uses the near sweep for ordinary slices', () => {
      expect(capitalReach({ spawnRadius: 25, physicalRadius: 0 }, 1, high)).toBe(225)
    })
    it('uses the spawn reach for long distance slices', () => {
      expect(capitalReach({ spawnRadius: 1000, physicalRadius: 0, longDistance: true }, 1, high)).toBe(1001)
    })
    it('adds the physical radius of the slice when the capital record has none', () => {
      // 4_3_snow: a 1000 m snow volume, the capital record radius is 0
      expect(capitalReach({ spawnRadius: 25, physicalRadius: 1000, longDistance: true }, 0, high)).toBe(1025)
    })
  })
})
