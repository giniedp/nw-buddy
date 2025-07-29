import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { AttributeRef, NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { debounceTime, of, Subject } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgAnglesLeft } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { AttributesStore, AttributeState } from './attributes.store'
import { CheckpointTipComponent } from './checkpoint-tip.component'
@Component({
  selector: 'nwb-attributes-editor',
  templateUrl: './attributes-editor.component.html',
  styleUrl: './attributes-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, TooltipModule, LayoutModule, CheckpointTipComponent],
  providers: [AttributesStore],
  host: {
    class: 'layout-content',
  },
})
export class AttributesEditorComponent {
  private store = inject(AttributesStore)

  public level = input<number>(NW_MAX_CHARACTER_LEVEL)
  public base = input<Record<AttributeRef, number>>(null)
  public assigned = input<Record<AttributeRef, number>>(null)
  public buffs = input<Record<AttributeRef, number>>(null)
  public magnify = input<number[]>([])
  public magnifyPlacement = input<AttributeRef>(null)
  public freeMode = input<boolean>(false)

  private assignedSubject = new Subject<Record<AttributeRef, number>>()
  public assignedChanged = output<Record<AttributeRef, number>>()
  public magnifyPlacementChanged = output<AttributeRef>()

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

  public constructor() {
    this.store.setLevel(this.level)
    this.store.setBase(this.base)
    this.store.setAssigned(this.assigned)
    this.store.setBuffs(this.buffs)
    this.store.setMagnify(this.magnify)
    this.store.setMagnifyPlacement(this.magnifyPlacement)
    this.store.setUnlocked(this.freeMode)
    this.assignedSubject.pipe(debounceTime(150), takeUntilDestroyed()).subscribe((assigned) => {
      this.assignedChanged.emit(assigned)
    })
  }

  protected handleMagnifyUpdate(value: AttributeRef) {
    this.store.setMagnifyPlacement(value)
    this.magnifyPlacementChanged.emit(value)
  }

  protected handleAttributeToggle(state: AttributeState, points: number) {
    const total = state.total - state.magnify
    if (total === points) {
      this.store.update({ attribute: state.ref, value: points - 50 })
    } else {
      this.store.update({ attribute: state.ref, value: points })
    }
    this.assignedSubject.next(this.store.assigned())
  }

  protected handleAttributeUpdate(state: AttributeState, points: number) {
    if (points > state.inputMax) {
      points = state.inputMax
    }
    const value = state.base + state.buffs + points
    this.store.update({ attribute: state.ref, value: value })
    this.assignedSubject.next(this.store.assigned())
  }

  protected handleAttributeWheel(state: AttributeState, e: Event) {
    const value = (e.target as HTMLInputElement).valueAsNumber
    this.handleAttributeUpdate(state, value)
  }

  protected handleAttributeBlur(state: AttributeState, e: Event) {
    const value = Math.max(Math.min(state.assigned, state.inputMax), state.inputMin)
    const input = e.target as HTMLInputElement
    input.valueAsNumber = value
  }

  protected handleAttributeFocus(e: Event) {
    ;(e.target as HTMLInputElement).select()
  }

  protected stateVlaue(stat: AttributeState) {
    return of(stat.total)
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
