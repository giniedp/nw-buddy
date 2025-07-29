import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, Injector, model, signal } from '@angular/core'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { filter, map, of, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES, NwWeaponType, NwWeaponTypesService } from '~/nw/weapon-types'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { openWeaponTypePicker } from '../data/weapon-type'
import { SkillTreeEditorStore } from './skill-tree-editor.store'
import { SkillTreeInputComponent } from './skill-tree-input.component'

let trackId = 0
export interface SkillTreeValue {
  weapon: string
  tree1: string[]
  tree2: string[]
}

@Component({
  selector: 'nwb-skill-tree-editor',
  templateUrl: './skill-tree-editor.component.html',
  styleUrl: './skill-tree-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, SkillTreeInputComponent, FormsModule, LayoutModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SkillTreeEditorComponent,
    },
    SkillTreeEditorStore,
  ],
  host: {
    class: 'flex flex-col layout-gap @container',
  },
})
export class SkillTreeEditorComponent implements ControlValueAccessor {
  private weaponTypes = inject(NwWeaponTypesService)
  private injector = inject(Injector)
  private character = inject(CharacterStore)
  private store = inject(SkillTreeEditorStore)

  private weapon = this.store.weapon
  private tree1 = this.store.tree1
  private tree2 = this.store.tree2
  protected tree1Spent = computed(() => this.tree1()?.length || 0)
  protected tree2Spent = computed(() => this.tree2()?.length || 0)
  protected trees = computed(() => {
    return [
      {
        id: 0,
        weaponTag: this.weapon(),
        value: computed(() => this.tree1()),
        points: computed(() => this.points().points1),
      },
      {
        id: 1,
        weaponTag: this.weapon(),
        value: computed(() => this.tree2()),
        points: computed(() => this.points().points2),
      },
    ]
  })

  public readonly disabled = model<boolean>()

  protected weaponType$ = toObservable(this.weapon).pipe(switchMap((it) => this.weaponTypes.forWeaponTag(it)))
  protected weaponLevel$ = this.weaponType$.pipe(
    switchMap((it) => {
      if (!it) {
        return of(0)
      }
      return this.character.observeWeaponLevel(it.ProgressionId)
    }),
  )
  protected weaponType = toSignal(this.weaponType$)
  protected weaponLevel = toSignal(this.weaponLevel$)
  protected weaponLevelMax = signal(NW_MAX_WEAPON_LEVEL)
  protected weaponPoints = computed(() => Math.max(0, this.weaponLevel() - 1))
  protected points = computed(() => {
    const points = this.weaponPoints()
    const spent1 = this.tree1Spent()
    const spent2 = this.tree2Spent()
    const available = points - spent1 - spent2
    if (available >= 0) {
      return {
        available: available,
        points1: points - spent2,
        points2: points - spent1,
      }
    }
    const points1 = Math.min(Math.max(spent1, points - spent2), points)
    return {
      available: available,
      points1: points1,
      points2: points - points1,
    }
  })

  protected touched = false
  protected onChange = (value: SkillTreeValue) => {}
  protected onTouched = () => {}

  public constructor() {
    this.store.change.pipe(takeUntilDestroyed()).subscribe(() => {
      this.commit(this.store.value())
    })
  }

  public writeValue(value: SkillTreeValue): void {
    this.store.patchState(value || { weapon: null, tree1: [], tree2: [] })
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

  protected updateTree(treeId: number, tree: string[]) {
    this.store.updateTree(treeId, tree)
  }

  protected updateWeapon(item: NwWeaponType) {
    this.store.updateWeapon(item)
  }

  protected commit(value: SkillTreeValue) {
    this.onChange(value)
  }

  public switchWeapon() {
    openWeaponTypePicker({
      injector: this.injector,
    })
      .pipe(
        filter((it) => !!it?.length),
        map((it) => NW_WEAPON_TYPES.find((type) => type.WeaponTypeID === String(it[0]))),
      )
      .subscribe((weapon) => {
        this.store.updateWeapon(weapon)
      })
  }
}
