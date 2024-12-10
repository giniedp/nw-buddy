import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { AbilityData } from '@nw-data/generated'
import { combineLatest, distinctUntilChanged, filter, map, tap } from 'rxjs'
import { injectNwData } from '~/data'
import { CaseInsensitiveSet, eqCaseInsensitive, mapDistinct } from '~/utils'
import { buildGrid, getGridSelection, SkillTreeGrid, updateGrid } from './skill-tree.model'

export interface SkillTreeEditorState {
  isLoaded?: boolean
  points: number
  abilities: AbilityData[]
  selection: string[]
  numCols: number
  numRows: number
  rows: SkillTreeGrid
}

@Injectable()
export class SkillTreeStore extends ComponentStore<SkillTreeEditorState> {
  private db = injectNwData()
  public readonly isLoaded$ = this.select(({ isLoaded }) => isLoaded)
  public readonly whenLoaded$ = this.isLoaded$.pipe(filter((it) => !!it)).pipe(distinctUntilChanged())
  public readonly abilities$ = this.select(({ abilities }) => abilities)
  public readonly selection$ = this.select(({ selection }) => selection)
  public readonly rows$ = this.select(({ rows }) => rows)
  public readonly numCols$ = this.select(({ numCols }) => numCols)

  public constructor() {
    super(createState(19, [], []))
  }

  /**
   * Loads abilities into state
   */
  public readonly load = this.updater((state, update: Partial<SkillTreeEditorState>) => {
    state = {
      ...state,
      ...update,
    }
    return {
      ...state,
      ...createState(state.points, state.abilities, state.selection),
      isLoaded: true,
    }
  })

  /**
   * Loads abilities into state
   */
  public readonly loadPoints = this.updater((state, points: number) => {
    return {
      ...state,
      ...createState(points, state.abilities, state.selection),
    }
  })

  /**
   * Loads abilities into state
   */
  public readonly loadAbilities = this.updater((state, abilities: AbilityData[]) => {
    return {
      ...state,
      ...createState(state.points, abilities, state.selection),
    }
  })

  /**
   * Loads selection into state
   */
  public readonly loadSelection = this.updater((state, selection: string[]) => {
    return {
      ...state,
      ...createState(state.points, state.abilities, selection),
    }
  })

  /**
   * Loads tree by weapon tag and tree id
   */
  public readonly loadTree = this.effect<{ weapon: string; tree: number; points: number; selection: string[] }>(
    (value$) => {
      const abilities$ = combineLatest({
        abilities: this.db.abilitiesAll(),
        weapon: value$.pipe(mapDistinct(({ weapon }) => weapon)),
        tree: value$.pipe(mapDistinct(({ tree }) => tree)),
      }).pipe(
        map(({ abilities, weapon, tree }) => {
          return abilities
            .filter(({ WeaponTag }) => eqCaseInsensitive(WeaponTag, weapon))
            .filter(({ TreeId }) => TreeId === tree)
        }),
      )

      return combineLatest({
        abilities: abilities$,
        points: value$.pipe(mapDistinct(({ points }) => points)),
        selection: value$.pipe(mapDistinct(({ selection }) => selection)),
      }).pipe(
        tap(({ abilities, points, selection }) => {
          this.load({
            abilities,
            points,
            selection,
          })
        }),
      )
    },
  )

  /**
   * Adds ability to selection
   */
  public readonly addAbility = this.updater((state, name: string) => {
    const selection = new CaseInsensitiveSet(this.get().selection || [])
    selection.add(name)
    state = createState(state.points, state.abilities, Array.from(selection))
    state.selection = getGridSelection(state.rows)
    return state
  })

  /**
   * Removes ability to selection
   */
  public readonly removeAbility = this.updater((state, name: string) => {
    const selection = new CaseInsensitiveSet(this.get().selection || [])
    selection.delete(name)
    state = createState(state.points, state.abilities, Array.from(selection))
    state.selection = getGridSelection(state.rows)
    return state
  })
}

function createState(points: number, abilities: AbilityData[], selection: string[]): SkillTreeEditorState {
  const rows = buildGrid(abilities)
  updateGrid(rows, points, selection)
  const result: SkillTreeEditorState = {
    points: points,
    abilities: abilities,
    selection: selection,
    numCols: rows[0]?.length || 0,
    numRows: rows.length,
    rows: rows,
  }
  return result
}

// ui_ability_unavailable_nopoints         "No points available"
// ui_ability_unavailable_noparent_lastrow "Purchase an ability in the previous row and 10 abilities in this tree to unlock"
// ui_ability_unavailable_parent_lastrow   "Purchase an ability in the previous row and 10 abilities in this tree including {parent} to unlock"
// ui_ability_unavailable_noparent         "Purchase an ability in the previous row to unlock"
// ui_ability_unavailable_parent_firstrow  "Purchase {parent} to unlock"
// ui_ability_unavailable_parent           "Purchase an ability in the previous row and {parent} to unlock"
// ui_ability_available                    "Click to select ability"
