import type { GameEntity } from '@gglib/ecs'
import { describe, expect, it } from 'vitest'
import { RangeGrid } from './RangeGrid'

function fakeEntity() {
  const entity = {
    isActive: false,
    canInitialize: false,
    canActivate: true,
    canDeactivate: false,
    initialize() {},
    activate() {
      entity.isActive = true
      entity.canActivate = false
      entity.canDeactivate = true
    },
    deactivate() {
      entity.isActive = false
      entity.canActivate = true
      entity.canDeactivate = false
    },
  }
  return entity as typeof entity & GameEntity
}

function createGrid() {
  return new RangeGrid({ cellSize: 64, hysteresis: 1.1, updateDistanceFactor: 0 })
}

function step(grid: RangeGrid, x: number, y: number, z = 0) {
  grid.update(x, y, z, false)
  grid.drain(x, y, z, Infinity)
}

describe('RangeGrid', () => {
  it('activates in range and deactivates beyond the hysteresis', () => {
    const grid = createGrid()
    const entity = fakeEntity()
    grid.add(entity, 0, 0, 0, 50)
    step(grid, 40, 0)
    expect(entity.isActive).toBe(true)
    step(grid, 54, 0)
    expect(entity.isActive).toBe(true)
    step(grid, 56, 0)
    expect(entity.isActive).toBe(false)
  })

  describe('move', () => {
    it('measures from the new position and range', () => {
      const grid = createGrid()
      const entity = fakeEntity()
      grid.add(entity, 0, 0, 0, 20)
      step(grid, 30, 0)
      expect(entity.isActive).toBe(false)
      expect(grid.move(entity, 20, 0, 0, 20)).toBe(true)
      step(grid, 30, 0)
      expect(entity.isActive).toBe(true)
      expect(grid.inspect(entity)).toMatchObject({ x: 20, y: 0, z: 0, range: 20 })
    })

    it('moves the entry into another cell', () => {
      const grid = createGrid()
      const entity = fakeEntity()
      grid.add(entity, 10, 10, 0, 30)
      expect(grid.move(entity, 200, 10, 0, 30)).toBe(true)
      step(grid, 10, 10)
      expect(entity.isActive).toBe(false)
      step(grid, 210, 10)
      expect(entity.isActive).toBe(true)
    })

    it('keeps the other entries of the old cell', () => {
      const grid = createGrid()
      const a = fakeEntity()
      const b = fakeEntity()
      grid.add(a, 10, 10, 0, 30)
      grid.add(b, 12, 10, 0, 30)
      grid.move(a, 200, 10, 0, 30)
      step(grid, 10, 10)
      expect(a.isActive).toBe(false)
      expect(b.isActive).toBe(true)
    })

    it('returns false for an unknown entity', () => {
      const grid = createGrid()
      expect(grid.move(fakeEntity(), 0, 0, 0, 10)).toBe(false)
    })
  })
})
