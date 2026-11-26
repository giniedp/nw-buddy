import { mat4Identity } from '@gglib/math'
import { describe, expect, it } from 'vitest'
import { findSocket, readSockets, socketOffsetMatrix, socketPlacement, type GltfSocketDefinition } from './GltfSockets'

function definitions(...names: string[]): GltfSocketDefinition[] {
  return names.map((name) => ({ name, joint: `${name}_joint`, matrix: mat4Identity() }))
}

describe('findSocket', () => {
  it('finds the socket by name', () => {
    const sockets = definitions('righthandattach', 'lefthandattach')
    expect(findSocket(sockets, 'lefthandattach')).toBe(sockets[1])
  })

  it('takes the mirror of a missing socket', () => {
    const sockets = definitions('spear', 'left_sword')
    expect(findSocket(sockets, 'right_sword')).toBe(sockets[1])
  })

  it('takes the first socket when the mirror is missing, too', () => {
    const sockets = definitions('spear', 'bow')
    expect(findSocket(sockets, 'righthandattach')).toBe(sockets[0])
    expect(findSocket(sockets, '')).toBe(sockets[0])
  })

  it('is null without sockets', () => {
    expect(findSocket([], 'righthandattach')).toBeNull()
  })
})

describe('readSockets', () => {
  it('reads the sockets of the scene', () => {
    const sockets = [{ name: 'bow', joint: 'spine', position: [1, 2, 3], rotation: [0, 0, 0, 1] }]
    const [socket] = readSockets({ scene: 0, scenes: [{ nodes: [], extras: { sockets } }] } as never)
    expect(socket.name).toBe('bow')
    expect(socket.joint).toBe('spine')
    expect([socket.matrix[12], socket.matrix[13], socket.matrix[14]]).toEqual([1, 2, 3])
  })

  it('is empty without them', () => {
    expect(readSockets({ scene: 0, scenes: [{ nodes: [] }] } as never)).toEqual([])
  })
})

describe('socketOffsetMatrix', () => {
  it('rotates about x, then y, then z, then moves', () => {
    const matrix = Array.from(socketOffsetMatrix({ position: [0, 0, 5], rotation: [90, 90, 0] }))
    // game axes: y → z by the rotation about x, z → x by the one about y. The export's z is the game's y, its -x the
    // game's x
    const zAxis = matrix.slice(8, 11)
    expect(zAxis[0]).toBeCloseTo(-1)
    expect(zAxis[1]).toBeCloseTo(0)
    expect(zAxis[2]).toBeCloseTo(0)
    expect(matrix[12]).toBeCloseTo(0)
    expect(matrix.slice(13, 15)).toEqual([5, 0])
  })
})

describe('socketPlacement', () => {
  it('is the socket with the offset relative to its joint', () => {
    const sockets = [{ name: 'bow', joint: 'spine', position: [1, 2, 3], rotation: [0, 0, 0, 1] }]
    const gltf = { scene: 0, scenes: [{ nodes: [], extras: { sockets } }] } as never
    const placement = socketPlacement(gltf, 'bow', { position: [0, 0, 5] })
    expect(placement?.joint).toBe('spine')
    expect(placement?.matrix.slice(12, 15)).toEqual([1, 7, 3])
  })

  it('is null without sockets', () => {
    expect(socketPlacement({ scene: 0, scenes: [{ nodes: [] }] } as never, 'bow')).toBeNull()
  })
})
