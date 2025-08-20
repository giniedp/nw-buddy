import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { switchMap } from 'rxjs'
import { NwModule } from '~/nw'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { SkillTreeInputStore } from './skill-tree-input.store'
import { SkillTreeCell } from './skill-tree.model'

@Component({
  selector: 'nwb-skill-tree-input',
  templateUrl: './skill-tree-input.component.html',
  styleUrl: './skill-tree-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, LayoutModule],
  providers: [
    SkillTreeInputStore,
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SkillTreeInputComponent,
    },
  ],
  host: {
    class: 'layout-content',
  },
})
export class SkillTreeInputComponent implements ControlValueAccessor {
  private store = inject(SkillTreeInputStore)
  private weaponTypes = inject(NwWeaponTypesService)
  public readonly weaponTag = input<string>()
  public readonly treeID = input<number>()
  public readonly points = input<number>()
  public readonly disabled = model<boolean>()
  public readonly value = this.store.value

  protected rows = this.store.rows
  protected spent = this.store.spent
  protected colsClass = computed(() => `grid-cols-${this.store.numCols()}`)
  protected weaponType = toSignal(
    toObservable(this.weaponTag).pipe(switchMap((tag) => this.weaponTypes.forWeaponTag(tag))),
  )
  protected title = computed(() => {
    const type = this.weaponType()
    const id = this.treeID()
    return id === 0 ? type?.Tree1Name : type?.Tree2Name
  })

  protected touched = false
  protected trackByIndex = (i: number) => i
  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}

  public constructor() {
    this.store.change.pipe(takeUntilDestroyed()).subscribe(() => {
      this.onChange(this.store.value())
    })
    this.store.setPoints(this.points)
    this.store.load(
      computed(() => {
        const weaponTag = this.weaponTag()
        const treeId = this.treeID()
        return {
          weaponTag,
          treeId,
        }
      }),
    )
  }

  public writeValue(value: string[]): void {
    this.store.setSelection(value)
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled)
  }

  protected toggle(cell: SkillTreeCell) {
    if (this.disabled()) {
      return
    }
    this.store.toggleAbility(cell.value)
  }
}
