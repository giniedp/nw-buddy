import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { AttributeRef } from '@nw-data/common'
import { isEqual } from 'lodash'
import { debounceTime, distinctUntilChanged, of } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft, svgAnglesLeft } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { AttributeState, AttributesStore } from './attributes.store'
import { CheckpointTipComponent } from './checkpoint-tip.component'
@Component({
  selector: 'nwb-attributes-editor',
  templateUrl: './attributes-editor.component.html',
  styleUrls: ['./attributes-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, TooltipModule, LayoutModule, CheckpointTipComponent],
  providers: [AttributesStore],
  host: {
    class: 'layout-content',
  },
})
export class AttributesEditorComponent {
  private store = inject(AttributesStore)

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
    toObservable(this.store.assigned).pipe(distinctUntilChanged((a, b) => isEqual(a, b))),
  )

  public magnifyPlacementChanged = outputFromObservable(
    toObservable(this.store.magnifyPlacement).pipe(distinctUntilChanged()),
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
