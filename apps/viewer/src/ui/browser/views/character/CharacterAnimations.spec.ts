import { describe, expect, it } from 'vitest'
import type { CharacterAnimationFile } from '../../../../api'
import { filterGroups, groupByFolder, groupNames, sharedFolder } from './CharacterAnimations.store'

const animation = (name: string, file: string, type: CharacterAnimationFile['type'] = 'caf') => ({ name, file, type })

describe('sharedFolder', () => {
  it('finds the folder all files share', () => {
    expect(sharedFolder(['a/b/c/x.caf', 'a/b/d/y.caf', 'a/b/z.caf'])).toBe('a/b/')
    expect(sharedFolder(['a/x.caf', 'b/y.caf'])).toBe('')
    expect(sharedFolder([])).toBe('')
  })

  it('does not stop in the middle of a folder name', () => {
    expect(sharedFolder(['anims/run/a.caf', 'anims/runner/b.caf'])).toBe('anims/')
  })
})

describe('groupByFolder', () => {
  it('groups by folder below the shared one, folders sorted, game order within', () => {
    const groups = groupByFolder([
      animation('walk', 'chars/male/locomotion/walk.caf'),
      animation('idle', 'chars/male/idle.caf'),
      animation('attack', 'chars/male/combat/attack.caf'),
      animation('run', 'chars/male/locomotion/run.caf'),
    ])
    expect(groups.map((it) => [it.folder, groupNames(it)])).toEqual([
      ['', ['idle']],
      ['combat', ['attack']],
      ['locomotion', ['walk', 'run']],
    ])
  })
})

describe('filterGroups', () => {
  const groups = groupByFolder([
    animation('walk', 'chars/locomotion/walk.caf'),
    animation('run', 'chars/locomotion/run.caf'),
    animation('swing_walk', 'chars/combat/swing_walk.caf'),
    animation('swing', 'chars/combat/swing.caf'),
  ])

  it('keeps a folder that matches with all its animations', () => {
    expect(filterGroups(groups, 'LOCO').map((it) => [it.folder, groupNames(it)])).toEqual([
      ['locomotion', ['walk', 'run']],
    ])
  })

  it('keeps the matching animations of the other folders', () => {
    expect(filterGroups(groups, 'walk').map((it) => [it.folder, groupNames(it)])).toEqual([
      ['combat', ['swing_walk']],
      ['locomotion', ['walk']],
    ])
  })

  it('returns all groups without a filter', () => {
    expect(filterGroups(groups, '')).toBe(groups)
  })
})
