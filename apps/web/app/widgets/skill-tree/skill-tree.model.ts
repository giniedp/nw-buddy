import { getAbilityCategoryTag } from '@nw-data/common'
import { AbilityData, UICategory } from '@nw-data/generated'
import { CaseInsensitiveSet } from '~/utils'

export type SkillTreeGrid = SkillTreeCell[][]
export interface SkillTreeCell {
  /**
   * Position in column
   */
  col: number
  /**
   * Position in row
   */
  row: number
  /**
   * Ability name
   */
  label: string
  /**
   * Ability value
   */
  value: string
  /**
   * Required parent ability id
   */
  parentId: string
  /**
   * Whether the cell is selected by user
   */
  checked: boolean
  /**
   * Whether the cell is unlocked, all conditions are met
   */
  unlocked: boolean
  /**
   * Whether current state of the cell is invalid
   */
  invalid: boolean
  /**
   * The ability
   */
  ability?: AbilityData
  /**
   * Display as square
   */
  square: boolean
  /**
   * Scale down in size on display
   */
  shrink: boolean
  /**
   *
   */
  type: 'none' | Lowercase<UICategory>
  /**
   * Additional tooltip message
   */
  tooltip?: string
  /**
   * Color for additional tooltip message
   */
  tooltipColor?: '' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  /**
   * Render connection edge top
   */
  edgeTop?: boolean
  /**
   * Render connection edge right
   */
  edgeRight?: boolean
  /**
   * Render connection edge left
   */
  edgeLeft?: boolean
  /**
   * Render connection edge top left
   */
  edgeTopRight?: boolean
  /**
   * Render connection edge top right
   */
  edgeTopLeft?: boolean
  parentLabel: string
}

export function buildGrid(abilities: AbilityData[]) {
  const maxCol = 1 + Math.max(0, ...abilities.map((it) => it.TreeColumnPosition || 0))
  const maxRow = 1 + Math.max(0, ...abilities.map((it) => it.TreeRowPosition || 0))
  const grid = new Array(maxRow).fill(0).map((_, row) => {
    return new Array(maxCol).fill(0).map((_, col): SkillTreeCell => {
      const ability = abilities.find((it) => isAbilityForCell(it, row, col))
      const value = ability?.AbilityID
      return {
        col: col,
        row: row,
        label: ability?.DisplayName,
        square: !!ability?.IsActiveAbility,
        shrink: !ability?.IsActiveAbility && !ability?.UnlockDefault && row !== maxRow - 1,
        value: ability?.UnlockDefault ? null : value,
        checked: !!ability?.UnlockDefault,
        unlocked: !!ability?.UnlockDefault,
        invalid: false,
        ability: ability,
        parentId: getAbilityParent(ability, abilities),
        type: getAbilityCategoryTag(ability),
        parentLabel: null,
      }
    })
  })
  updateConnections(grid)
  return grid
}

export function updateGrid(grid: SkillTreeGrid, points: number, selection: ReadonlyArray<string>) {
  const selected = new CaseInsensitiveSet(selection || [])
  let spent = 0
  let rowUnlocked = true
  grid.forEach((row, rowIndex) => {
    const parentRow = grid[rowIndex - 1]
    rowUnlocked = rowUnlocked && (rowIndex === 0 || parentRow?.some((it) => selected.has(it.value)))
    row.forEach((cell) => {
      if (!cell.value) {
        return
      }
      cell.checked = selected.has(cell.value)

      const parentId = cell.parentId
      const parentOk = !parentId || (selected.has(parentId) && checkPath(grid, cell, parentId))
      const limitOk = spent < points
      const pointsOk = rowIndex < grid.length - 1 || spent >= 10
      if (!limitOk) {
        cell.tooltip = 'ui_ability_unavailable_nopoints'
        cell.tooltipColor = 'error'
        if (cell.checked) {
          cell.invalid = true
        }
        return
      }
      if (!pointsOk) {
        if (parentId) {
          cell.tooltip = 'ui_ability_unavailable_parent_lastrow'
          cell.tooltipColor = 'error'
        } else {
          cell.tooltip = 'ui_ability_unavailable_noparent_lastrow'
          cell.tooltipColor = 'error'
        }
        if (cell.checked) {
          cell.invalid = true
        }
        return
      }
      if (cell.value && (!rowUnlocked || !parentOk)) {
        if (parentId) {
          cell.tooltip = 'ui_ability_unavailable_parent'
          cell.tooltipColor = 'error'
        } else {
          cell.tooltip = 'ui_ability_unavailable_noparent'
          cell.tooltipColor = 'error'
        }
        if (cell.checked) {
          cell.invalid = true
        }
        return
      }
      cell.unlocked = true
      if (cell.checked) {
        spent += 1
      } else {
        cell.tooltip = 'ui_ability_available'
        cell.tooltipColor = 'warning'
      }
    })
  })
  if (spent === points) {
    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.unlocked && !cell.checked) {
          cell.unlocked = false
          cell.tooltip = 'ui_ability_unavailable_nopoints'
          cell.tooltipColor = 'error'
        }
      })
    })
  }
  updateConnections(grid)
}

export function getGridSelection(grid: SkillTreeGrid) {
  return gridMap(grid, (cell) => (cell.value && cell.unlocked && cell.checked ? cell.value : null))
    .flat(1)
    .filter((it) => !!it)
}

function compare(a: string, b: string) {
  return a?.toUpperCase() === b?.toUpperCase()
}

function isAbilityForCell(ability: AbilityData, row: number, col: number) {
  return !ability.EquipWhenUnsheathed && ability.TreeColumnPosition === col && ability.TreeRowPosition === row
}

function getAbilityParent(ability: AbilityData, abilities: AbilityData[]) {
  if (!ability) {
    return null
  }
  if (ability.RequiredAbilityId) {
    if (ability.RequiredAbilityId === 'Upgrade_Musket_TrapWeakenAOE') {
      return 'Upgrade_Musket_TrapLifeSteal'
    }
    if (ability.RequiredAbilityId !== 'Ability_Flail_Defense') {
      return ability.RequiredAbilityId
    }
  }
  // TODO: hackedy hack, fix this
  if (ability.AbilityID.startsWith('Upgrade_')) {
    const prefix = ability.AbilityID.replace('Upgrade_', 'Ability_')
      .replace(/_\d/, '')
      .replace(/_Upgrade\d$/, '')
      .replace('Greatsword_Break', 'Greatsword_DefenseBreak')
    return abilities.find((it) => it.AbilityID.startsWith(prefix))?.AbilityID
  }
  return null
}

function gridFind(grid: SkillTreeGrid, predicate: (cell: SkillTreeCell) => boolean): SkillTreeCell {
  for (const row of grid) {
    for (const cell of row) {
      if (predicate(cell)) {
        return cell
      }
    }
  }
  return null
}

function gridMap<T>(grid: SkillTreeGrid, map: (cell: SkillTreeCell) => T): T[][] {
  return grid.map((row) => row.map(map))
}

function checkPath(grid: SkillTreeGrid, cell: SkillTreeCell, parent: string) {
  const target = findCell(grid, parent)
  if (!cell || !target) {
    return false
  }
  return isPathChecked(grid, grid[cell.row - 1][target.col], target)
}

function isPathChecked(grid: SkillTreeGrid, cell: SkillTreeCell, target: SkillTreeCell) {
  if (!cell || !target) {
    return false
  }
  if (cell.value) {
    return cell.checked
  }
  return isPathChecked(grid, grid[cell.row - 1][cell.col], target)
}

function findCell(grid: SkillTreeGrid, value: string) {
  return value ? gridFind(grid, (cell) => compare(cell.value, value)) : null
}

function updateConnections(grid: SkillTreeGrid) {
  grid.forEach((row) => {
    row.forEach((cell) => {
      const end = findCell(grid, cell.parentId)
      cell.parentLabel = end?.label
      connect(grid, cell, end, {
        invalid: cell.invalid,
        unlocked: cell.unlocked,
      })
    })
  })
}

function connect(
  grid: SkillTreeGrid,
  start: SkillTreeCell,
  end: SkillTreeCell,
  propagate: { unlocked: boolean; invalid: boolean },
) {
  if (!start || !end) {
    return
  }
  start.unlocked = start.unlocked || propagate.unlocked
  start.invalid = start.invalid || propagate.invalid
  if (start.row === end.row) {
    if (start.col === end.col) {
      return
    }
    if (start.col < end.col) {
      start.edgeRight = true
    } else {
      start.edgeLeft = true
    }
    return
  }
  if (start.row > end.row) {
    if (start.col === end.col) {
      start.edgeTop = true
      const next = grid[start.row - 1][start.col]
      connect(grid, next, end, propagate)
    } else if (start.col < end.col) {
      start.edgeTopRight = true
      const next = grid[start.row - 1][start.col + 1]
      connect(grid, next, end, propagate)
    } else {
      start.edgeTopLeft = true
      const next = grid[start.row - 1][start.col - 1]
      connect(grid, next, end, propagate)
    }
  }
}

// ui_ability_unavailable_nopoints         "No points available"
// ui_ability_unavailable_noparent_lastrow "Purchase an ability in the previous row and 10 abilities in this tree to unlock"
// ui_ability_unavailable_parent_lastrow   "Purchase an ability in the previous row and 10 abilities in this tree including {parent} to unlock"
// ui_ability_unavailable_noparent         "Purchase an ability in the previous row to unlock"
// ui_ability_unavailable_parent_firstrow  "Purchase {parent} to unlock"
// ui_ability_unavailable_parent           "Purchase an ability in the previous row and {parent} to unlock"
// ui_ability_available                    "Click to select ability"
