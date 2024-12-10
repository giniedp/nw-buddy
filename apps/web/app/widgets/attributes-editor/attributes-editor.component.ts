import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { AttributeRef } from '@nw-data/common'
import { AttributeDefinition } from '@nw-data/generated'
import { isEqual } from 'lodash'
import { combineLatest, debounceTime, distinctUntilChanged, from, map, of, skip } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgAnglesLeft } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { shareReplayRefCount } from '~/utils'
import { AttributeState, AttributesStore } from './attributes.store'

@Component({
  standalone: true,
  selector: 'nwb-attributes-editor',
  templateUrl: './attributes-editor.component.html',
  styleUrls: ['./attributes-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, TooltipModule, LayoutModule],
  providers: [AttributesStore],
  host: {
    class: 'layout-content',
  },
})
export class AttributesEditorComponent {
  private store = inject(AttributesStore)
  private db = injectNwData()

  @Input()
  public set level(value: number) {
    this.store.setLevel(value)
  }
  public get level() {
    return this.store.level()
  }

  @Input()
  public set base(value: Record<AttributeRef, number>) {
    this.store.setBase(value)
  }
  public get base() {
    return this.store.base()
  }

  @Input()
  public set assigned(value: Record<AttributeRef, number>) {
    this.store.setAssigned(value)
  }
  public get assigned() {
    return this.store.assigned()
  }

  @Input()
  public set buffs(value: Record<AttributeRef, number>) {
    this.store.setBuffs(value)
  }
  public get buffs() {
    return this.store.buffs()
  }

  @Input()
  public set magnify(value: number[]) {
    this.store.setMagnify(value)
  }
  public get magnify() {
    return this.store.magnify()
  }

  @Input()
  public set magnifyPlacement(value: AttributeRef) {
    this.store.setMagnifyPlacement(value)
  }
  public get magnifyPlacement() {
    return this.store.magnifyPlacement()
  }

  @Input()
  public set freeMode(value: boolean) {
    this.store.setUnlocked(value)
  }
  public get freeMode() {
    return this.store.unlocked()
  }


  public assignedChanged = outputFromObservable(
    toObservable(this.store.assigned)
      .pipe(skip(1))
      .pipe(distinctUntilChanged((a, b) => isEqual(a, b))),
  )

  public magnifyPlacementChanged = outputFromObservable(
    toObservable(this.store.magnifyPlacement).pipe(skip(1)).pipe(distinctUntilChanged()),
  )

  protected magnifyOptions: Array<{ label: string; value: AttributeRef }> = [
    { label: 'ui_Strength_short', value: 'str' },
    { label: 'ui_Dexterity_short', value: 'dex' },
    { label: 'ui_Intelligence_short', value: 'int' },
    { label: 'ui_Focus_short', value: 'foc' },
    { label: 'ui_Constitution_short', value: 'con' },
  ]
  protected stats = this.store.stats
  protected steps = this.store.steps
  protected pointsSpent = this.store.pointsSpent
  protected pointsAvailable = this.store.pointsAvailable
  protected arrowLeft = svgAngleLeft
  protected arrowsLeft = svgAnglesLeft

  public readonly totalDex$ = toObservable(this.store.totalDex).pipe(debounceTime(300))
  public readonly totalStr$ = toObservable(this.store.totalStr).pipe(debounceTime(300))
  public readonly totalInt$ = toObservable(this.store.totalInt).pipe(debounceTime(300))
  public readonly totalFoc$ = toObservable(this.store.totalFoc).pipe(debounceTime(300))
  public readonly totalCon$ = toObservable(this.store.totalCon).pipe(debounceTime(300))

  // public ngOnInit() {
  //   const src = combineLatest({
  //     level: this.level$,
  //     points: this.freeMode$.pipe(map((it) => (it ? 380 : 0))), // TODO: calculate points
  //     base: this.freeMode$.pipe(
  //       switchMap((it) => {
  //         if (!it) {
  //           return this.base$
  //         }
  //         const base: Record<AttributeRef, number> = {
  //           con: 5,
  //           dex: 5,
  //           foc: 5,
  //           int: 5,
  //           str: 5,
  //         }
  //         return of(base)
  //       }),
  //     ),
  //     assigned: this.assigned$,
  //     buffs: this.buffs$,
  //     magnify: this.magnify$,
  //     magnifyPlacement: this.magnifyPlacement$,
  //   })
  //   this.store.loadLazy(src)
  // }

  protected attributeToggle(state: AttributeState, points: number) {
    const total = state.total - state.magnify
    if (total === points) {
      this.store.update({ attribute: state.ref, value: points - 50 })
    } else {
      this.store.update({ attribute: state.ref, value: points })
    }
  }

  protected attributeInput(state: AttributeState, points: number) {
    if (points > state.inputMax) {
      points = state.inputMax
    }
    const value = state.base + state.buffs + points
    this.store.update({ attribute: state.ref, value: value })
  }

  protected attributeWheel(state: AttributeState, e: Event) {
    setTimeout(() => {
      const value = (e.target as HTMLInputElement).valueAsNumber
      this.attributeInput(state, value)
    })
  }

  protected attributeBlur(state: AttributeState, e: Event) {
    const value = Math.max(Math.min(state.assigned, state.inputMax), state.inputMin)
    const input = e.target as HTMLInputElement
    input.valueAsNumber = value
  }

  protected attributeFocus(e: Event) {
    ;(e.target as HTMLInputElement).select()
  }

  protected stateVlaue(stat: AttributeState) {
    return of(stat.total)
  }

  protected getAbilities(state: AttributeState, points: number) {
    return combineLatest({
      abilities: this.db.abilitiesByIdMap(),
      levels: this.abilitiesLevels(state.ref),
    }).pipe(
      map(({ abilities, levels }) => {
        const ids = levels.find((it) => it.Level === points)?.EquipAbilities || []
        return ids.map((id) => {
          const ability = abilities.get(id)
          return {
            Name: ability.DisplayName,
            Description: ability.Description,
            Icon: ability.Icon,
          }
        })
      }),
    )
  }

  protected getBulletColor(attr: AttributeState, step: number) {
    const base = attr.base
    const buffs = base + attr.buffs
    const assigned = buffs + attr.assigned
    const magnify = assigned + attr.magnify
    if (base >= step) {
      return 'base' as const
    }
    if (buffs >= step) {
      return 'buff' as const
    }
    if (assigned >= step) {
      return 'assign' as const
    }
    if (magnify >= step) {
      return 'magnify' as const
    }
    return 'zink' as const
  }

  private attrLevels(ref: AttributeRef) {
    switch (resolveShortType(ref)) {
      case 'con':
        return from(this.db.attrCon())
      case 'str':
        return from(this.db.attrStr())
      case 'foc':
        return from(this.db.attrFoc())
      case 'int':
        return from(this.db.attrInt())
      case 'dex':
        return from(this.db.attrDex())
      default:
        return of<AttributeDefinition[]>([])
    }
  }

  public abilitiesLevels(ref: AttributeRef) {
    return this.attrLevels(ref)
      .pipe(
        map((table) => {
          return table
            .filter((it) => it.EquipAbilities?.length)
            .map((it) => ({
              Level: it.Level,
              EquipAbilities: it.EquipAbilities,
            }))
        }),
      )
      .pipe(shareReplayRefCount(1))
  }
}

function resolveShortType(type: string) {
  if (!type) {
    return null
  }
  if (type.length !== 3) {
    type = type.substring(0, 3)
  }
  return type.toLowerCase()
}
