import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, Injector, model, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { patchState, signalState } from '@ngrx/signals'
import { NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { isEqual } from 'lodash'
import { filter, map, of, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES, NwWeaponType, NwWeaponTypesService } from '~/nw/weapon-types'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { openWeaponTypePicker } from '../data/weapon-type'
import { SkillTreeComponent } from './skill-tree.component'

export interface SkillBuildValue {
  weapon: string
  tree1: string[]
  tree2: string[]
}

@Component({
  selector: 'nwb-skill-builder',
  templateUrl: './skill-builder.component.html',
  styleUrls: ['./skill-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, SkillTreeComponent, FormsModule, LayoutModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SkillBuilderComponent,
    },
  ],
  host: {
    class: 'flex flex-col layout-gap @container',
  },
})
export class SkillBuilderComponent implements ControlValueAccessor {
  private weaponTypes = inject(NwWeaponTypesService)
  private injector = inject(Injector)
  private character = inject(CharacterStore)
  private state = signalState<SkillBuildValue>({
    weapon: null,
    tree1: [],
    tree2: [],
  })

  public readonly weaponTag = this.state.weapon
  public readonly tree1 = this.state.tree1
  public readonly tree2 = this.state.tree2
  public readonly disabled = model<boolean>()

  protected tree1Spent = computed(() => this.state.tree1()?.length || 0)
  protected tree2Spent = computed(() => this.state.tree2()?.length || 0)
  protected weaponType$ = toObservable(this.weaponTag).pipe(switchMap((it) => this.weaponTypes.forWeaponTag(it)))
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
  protected trackByIndex = (i: number) => i
  protected onChange = (value: SkillBuildValue) => {}
  protected onTouched = () => {}

  public writeValue(value: SkillBuildValue): void {
    patchState(this.state, value || { weapon: null, tree1: [], tree2: [] })
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
    const value = this.getValue()
    if (treeId === 0) {
      value.tree1 = tree
    }
    if (treeId === 1) {
      value.tree2 = tree
    }
    this.commit(value)
  }

  protected updateWeapon(item: NwWeaponType) {
    this.commit({
      weapon: item.WeaponTag,
      tree1: [],
      tree2: [],
    })
  }

  protected commit(value: SkillBuildValue) {
    const old = this.state()
    if (!isEqual(value, old)) {
      patchState(this.state, value)
      this.onChange(value)
    }
  }

  protected getValue(): SkillBuildValue {
    return this.state()
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
        this.commit({
          weapon: weapon.WeaponTag,
          tree1: [],
          tree2: [],
        })
      })
  }
}
