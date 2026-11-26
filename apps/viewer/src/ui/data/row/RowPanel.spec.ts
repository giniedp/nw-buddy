import { describe, expect, it } from 'vitest'
import type { SheetColumn } from '../../../api/browse'
import { audioTitle } from './AudioButton.store'
import { iconField, nameField } from './RowPanel.store'
import { exportFiles, fileStem, preferredOption } from './RowPreview.store'
import type { RowField } from './types'

const field = (name: string, kind: SheetColumn['kind'] | undefined, text: string): RowField => ({
  column: { name, kind } as SheetColumn,
  text,
})

describe('row head', () => {
  const fields = [
    field('ItemID', 'key', 'Sword_T5'),
    field('Description', 'loc', '@desc'),
    field('Name', 'loc', '@name'),
    field('IconPath', 'asset', 'lyshineui/images/icons/sword.png'),
  ]

  it('takes the localized name field', () => {
    expect(nameField(fields)?.text).toBe('@name')
    expect(nameField([fields[0]])).toBeUndefined()
  })

  it('takes an image of an icon field', () => {
    expect(iconField(fields)?.text).toBe('lyshineui/images/icons/sword.png')
    expect(iconField([field('IconPath', 'asset', 'objects/a.cgf')])).toBeUndefined()
  })
})

describe('preview', () => {
  it('prefers the Skin1 of the row or of an appearance', () => {
    const options = (...labels: string[]) => labels.map((label) => ({ label }))
    expect(preferredOption(options('MeshOverride', 'Appearance · Skin1', 'FemaleAppearance · Skin1'))).toBe(1)
    expect(preferredOption(options('Skin1', 'Skin overrides'))).toBe(0)
    expect(preferredOption(options('MeshOverride', 'Prefab'))).toBe(0)
    expect(preferredOption([])).toBe(0)
  })

  it('exports each model with its material, or the slice', () => {
    expect(exportFiles(undefined)).toEqual([])
    expect(exportFiles({ slice: 'slices/a.dynamicslice' } as never)).toEqual([
      { path: 'slices/a.dynamicslice', material: undefined },
    ])
    expect(
      exportFiles({
        parts: [
          { mesh: 'a.skin', material: '' },
          { mesh: 'b.skin', material: 'b.mtl' },
        ],
      } as never),
    ).toEqual([
      { path: 'a.skin', material: undefined },
      { path: 'b.skin', material: 'b.mtl' },
    ])
    expect(fileStem('objects/a/b.skin')).toBe('b')
  })
})

describe('audioTitle', () => {
  it('tells the error, else how many media the trigger plays', () => {
    expect(audioTitle('decode failed', 3)).toBe('decode failed')
    expect(audioTitle(null, null)).toBe('Play')
    expect(audioTitle(null, 1)).toBe('Play')
    expect(audioTitle(null, 4)).toBe('Play (4 media, each click plays the next)')
  })
})
