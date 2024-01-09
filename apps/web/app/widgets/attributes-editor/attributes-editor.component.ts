import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnInit, Output, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AttributeRef, NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { Attributeconstitution } from '@nw-data/generated'
import { isEqual } from 'lodash'
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgAnglesLeft } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { shareReplayRefCount } from '~/utils'
import { AttributeState, AttributesStore } from './attributes.store'

@Component({
  standalone: true,
  selector: 'nwb-attributes-editor',
  templateUrl: './attributes-editor.component.html',
  styleUrls: ['./attributes-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, TooltipModule],
  providers: [AttributesStore],
  host: {
    class: 'layout-content',
  },
})
export class AttributesEditorComponent implements OnInit {
  private store = inject(AttributesStore)
  private db = inject(NwDbService)

  @Input()
  public set level(value: number) {
    this.level$.next(value)
  }
  public get level() {
    return this.level$.value
  }

  @Input()
  public set freeMode(value: boolean) {
    this.freeMode$.next(value)
  }
  public get freeMode() {
    return this.freeMode$.value
  }

  @Input()
  public set base(value: Record<AttributeRef, number>) {
    this.base$.next(value)
  }
  public get base() {
    return this.base$.value
  }

  @Input()
  public set assigned(value: Record<AttributeRef, number>) {
    this.assigned$.next(value)
  }
  public get assigned() {
    return this.assigned$.value
  }

  @Input()
  public set buffs(value: Record<AttributeRef, number>) {
    this.buffs$.next(value)
  }
  public get buffs() {
    return this.buffs$.value
  }

  @Input()
  public set magnify(value: number[]) {
    this.magnify$.next(value)
  }
  public get magnify() {
    return this.magnify$.value
  }

  @Output()
  public assignedChanged = this.store.assigned$.pipe(distinctUntilChanged((a, b) => isEqual(a, b)))

  protected stats$ = this.store.stats$
  protected steps$ = this.store.steps$
  protected pointsSpent$ = this.store.pointsSpent$
  protected pointsAvailable$ = this.store.pointsAvailable$
  protected arrowLeft = svgAngleLeft
  protected arrowsLeft = svgAnglesLeft
  protected trackById = (i: number) => i
  private magnify$ = new BehaviorSubject<number[]>([])
  private freeMode$ = new BehaviorSubject<boolean>(false)
  private level$ = new BehaviorSubject<number>(NW_MAX_CHARACTER_LEVEL)
  private base$ = new BehaviorSubject<Record<AttributeRef, number>>({
    con: 0,
    dex: 0,
    foc: 0,
    int: 0,
    str: 0,
  })
  private assigned$ = new BehaviorSubject<Record<AttributeRef, number>>({
    con: 0,
    dex: 0,
    foc: 0,
    int: 0,
    str: 0,
  })
  private buffs$ = new BehaviorSubject<Record<AttributeRef, number>>({
    con: 0,
    dex: 0,
    foc: 0,
    int: 0,
    str: 0,
  })

  public readonly totalDex$ = this.store.totalDex$.pipe(debounceTime(300))
  public readonly totalStr$ = this.store.totalStr$.pipe(debounceTime(300))
  public readonly totalInt$ = this.store.totalInt$.pipe(debounceTime(300))
  public readonly totalFoc$ = this.store.totalFoc$.pipe(debounceTime(300))
  public readonly totalCon$ = this.store.totalCon$.pipe(debounceTime(300))

  public ngOnInit() {
    const src = combineLatest({
      level: this.level$,
      points: this.freeMode$.pipe(map((it) => (it ? 380 : 0))), // TODO: calculate points
      base: this.freeMode$.pipe(
        switchMap((it) => {
          if (!it) {
            return this.base$
          }
          const base: Record<AttributeRef, number> = {
            con: 5,
            dex: 5,
            foc: 5,
            int: 5,
            str: 5,
          }
          return of(base)
        }),
      ),
      assigned: this.assigned$,
      buffs: this.buffs$,
      magnify: this.magnify$,
    })
    this.store.loadLazy(src)
  }

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
      abilities: this.db.abilitiesMap,
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
        return this.db.attrCon
      case 'str':
        return this.db.attrStr
      case 'foc':
        return this.db.attrFoc
      case 'int':
        return this.db.attrInt
      case 'dex':
        return this.db.attrDex
      default:
        return of<Attributeconstitution[]>([])
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
