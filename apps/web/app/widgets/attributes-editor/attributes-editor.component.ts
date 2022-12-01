import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnInit, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { isEqual } from 'lodash'
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, of, switchMap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { AttributeRef } from '~/nw/nw-attributes'
import { NwAttributesService } from '~/nw/nw-attributes.service'
import { NW_MAX_CHARACTER_LEVEL } from '~/nw/utils/constants'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgAnglesLeft } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { AttributesStore, AttributeState } from './attributes.store'

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

  @Output()
  public assignedChanged = this.store.assigned$.pipe(distinctUntilChanged((a, b) => isEqual(a, b)))

  protected stats$ = this.store.stats$
  protected pointsSpent$ = this.store.pointsSpent$
  protected pointsAvailable$ = this.store.pointsAvailable$
  protected arrowLeft = svgAngleLeft
  protected arrowsLeft = svgAnglesLeft
  protected trackById = (i: number) => i
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

  public constructor(
    private store: AttributesStore,
    private attrs: NwAttributesService,
    private db: NwDbService,
  ) {
    //
  }

  public ngOnInit() {
    const src = combineLatest({
      level: this.level$,
      points: this.freeMode$.pipe(map((it) => (it ? 270 : 0))),
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
    })
    this.store.loadLazy(src)
  }

  protected updateAttribute(state: AttributeState, points: number) {
    this.store.update({ attribute: state.ref, value: points })
  }

  protected attributeToggle(state: AttributeState, points: number) {
    if (state.total === points) {
      this.store.update({ attribute: state.ref, value: points - 50 })
    } else {
      this.store.update({ attribute: state.ref, value: points })
    }
  }

  protected attributeInput(state: AttributeState, points: number) {
    this.store.update({ attribute: state.ref, value: points })
  }

  protected attributeBlur(state: AttributeState, e: Event) {
    const value = (e.target as HTMLInputElement).valueAsNumber
    const newValue = Math.min(Math.max(value || 0, state.inputMin), state.inputMax)
    if (!Number.isFinite(value) || value !== newValue) {
      (e.target as HTMLInputElement).value = newValue as any
    }
  }

  protected attributeFocus(e: Event) {
    (e.target as HTMLInputElement).select()
  }

  protected stateVlaue(stat: AttributeState) {
    return of(stat.total)
  }

  protected getAbilities(state: AttributeState, points: number) {
    return combineLatest({
      abilities: this.db.abilitiesMap,
      levels: this.attrs.abilitiesLevels(state.ref)
    }).pipe(map(({ abilities, levels }) => {
      const ids = levels.find((it) => it.Level === points)?.EquipAbilities || []
      return ids.map((id) => {
        const ability = abilities.get(id)
        console.log(ability)
        return {
          Name: ability.DisplayName,
          Description: ability.Description,
          Icon: ability.Icon
        }
      })
    }))
  }

}
