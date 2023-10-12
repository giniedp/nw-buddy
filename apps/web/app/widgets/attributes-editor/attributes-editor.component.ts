import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnInit, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AttributeRef, NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { isEqual } from 'lodash'
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, of, switchMap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { NwAttributesService } from '~/nw/attributes'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgAnglesLeft } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
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

  public constructor(private store: AttributesStore, private attrs: NwAttributesService, private db: NwDbService) {
    //
  }

  public ngOnInit() {
    const src = combineLatest({
      level: this.level$,
      points: this.freeMode$.pipe(map((it) => (it ? 270 : 0))), // TODO: calculate points
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
        })
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
    const value = state.base + state.buffs + points
    this.store.update({ attribute: state.ref, value: value })
  }

  protected attributeWheel(state: AttributeState, e: Event) {
    setTimeout(() => {
      const value = (e.target as HTMLInputElement).valueAsNumber
      this.attributeInput(state, value)
    })
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
      levels: this.attrs.abilitiesLevels(state.ref),
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
      })
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
}
