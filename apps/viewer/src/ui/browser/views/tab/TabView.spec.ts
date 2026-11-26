import { describe, expect, it } from 'vitest'
import type { FileStat } from '../../../../api/browse'
import type { AssetView, ViewContext } from '../registry'
import { modeOf, viewsFor } from './TabView.store'

/**
 * A context of a file for `applies`: path, content kind, optional sheet and slice
 */
function ctx(path: string, kind: ViewContext['kind'], extra: Partial<ViewContext> = {}): ViewContext {
  return { app: null, path, stat: { path } as FileStat, type: undefined, kind, ...extra } as unknown as ViewContext
}

const ids = (views: AssetView[]) => views.map((it) => it.id)

describe('viewsFor', () => {
  it('has no modes before the file is read', () => {
    expect(viewsFor(null)).toEqual([])
  })

  it('offers the modes of the content first, Details and Hex last', () => {
    expect(ids(viewsFor(ctx('textures/x_diff.dds', 'binary')))).toEqual(['texture', 'details', 'hex'])
    expect(ids(viewsFor(ctx('objects/x.cgf', 'binary')))).toEqual(['model', 'inspect', 'details', 'hex'])
    expect(ids(viewsFor(ctx('scripts/x.luac', 'binary')))).toEqual(['lua', 'details', 'hex'])
    expect(ids(viewsFor(ctx('game.cfg', 'text')))).toEqual(['text', 'details', 'hex'])
  })

  it('offers the 3D view of a slice only with models', () => {
    const slice = (meshes: number) => ({ root: 'a', slices: {}, meshes })
    expect(ids(viewsFor(ctx('slices/a.dynamicslice', 'objectstream', { slice: slice(0) })))).toEqual([
      'xml',
      'json',
      'details',
      'hex',
    ])
    expect(ids(viewsFor(ctx('slices/a.dynamicslice', 'objectstream', { slice: slice(3) })))[0]).toBe('slice')
  })
})

describe('modeOf', () => {
  const views = viewsFor(ctx('objects/x.cgf', 'binary'))

  it('shows the chosen mode', () => {
    expect(modeOf(views, 'hex')?.id).toBe('hex')
  })

  it('shows the first mode when none is chosen or the chosen one does not apply', () => {
    expect(modeOf(views, undefined)?.id).toBe('model')
    expect(modeOf(views, 'texture')?.id).toBe('model')
    expect(modeOf([], 'hex')).toBeUndefined()
  })
})
