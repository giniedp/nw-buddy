import { describe, expect, it } from 'vitest'
import type { AssetType } from '../../api/browse'
import { fileName, tabItems, typeIndices } from './BrowserTool.store'
import type { Tab } from './tabs'

const type = (key: string, label = key): AssetType => ({ key, label, group: 'geometry' }) as AssetType

describe('typeIndices', () => {
  it('maps the stored type keys to indices of the current type list', () => {
    const types = [type('texture'), type('model'), type('sound')]
    expect([...typeIndices(types, ['sound', 'texture'])].sort()).toEqual([0, 2])
  })

  it('drops keys the server does not know', () => {
    expect([...typeIndices([type('texture')], ['gone'])]).toEqual([])
  })
})

describe('tabItems', () => {
  it('names a tab by the file name, the path as tooltip', () => {
    const tabs = [{ id: 1, path: 'objects/a/chair.cgf', type: 0, preview: true } as Tab]
    const [item] = tabItems(tabs, [type('model')])
    expect(item).toMatchObject({ id: 1, title: 'chair.cgf', tooltip: 'objects/a/chair.cgf', preview: true })
    expect(typeof item.icon).toBe('string')
  })

  it('names a file at the root', () => {
    expect(fileName('game.cfg')).toBe('game.cfg')
  })
})
