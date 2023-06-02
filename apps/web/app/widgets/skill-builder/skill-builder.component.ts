import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { isEqual } from 'lodash'
import { BehaviorSubject, asyncScheduler, combineLatest, defer, filter, map, of, subscribeOn, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NwWeaponType, NwWeaponTypesService } from '~/nw/weapon-types'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { mapDistinct } from '~/utils'
import { SkillTreeComponent } from './skill-tree.component'
import { SkillWeaponDialogComponent } from './skill-weapon-dialog.component'

export interface SkillBuildValue {
  weapon: string
  tree1: string[]
  tree2: string[]
}

const TOTAL_POINTS = 19

@Component({
  standalone: true,
  selector: 'nwb-skill-builder',
  templateUrl: './skill-builder.component.html',
  styleUrls: ['./skill-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, SkillTreeComponent, FormsModule, LayoutModule, DialogModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SkillBuilderComponent,
    },
  ],
  host: {
    class: 'flex flex-col layout-gap',
  },
})
export class SkillBuilderComponent implements ControlValueAccessor {
  @Input()
  public set weaponTag(value: string) {
    this.weapon$.next(value)
  }
  public get weaponTag() {
    return this.weapon$.value
  }
  @Input()
  public set tree1(value: string[]) {
    this.tree1$.next(value)
  }
  public get tree1() {
    return this.tree1$.value
  }

  @Input()
  public set tree2(value: string[]) {
    this.tree2$.next(value)
  }
  public get tree2() {
    return this.tree2$.value
  }

  @Input()
  public disabled = false

  @ViewChild('tplWeapon')
  protected tplWeapon: TemplateRef<any>

  protected weapon$ = new BehaviorSubject<string>(null)
  protected tree1$ = new BehaviorSubject<string[]>([])
  protected tree2$ = new BehaviorSubject<string[]>([])
  protected tree1Spent$ = this.tree1$.pipe(map((it) => it?.length || 0))
  protected tree2Spent$ = this.tree2$.pipe(map((it) => it?.length || 0))
  protected weaponType$ = this.weapon$.pipe(switchMap((it) => this.types.forWeaponTag(it)))
  protected weaponLevel$ = this.weapon$.pipe(switchMap((it) => this.char.selectWeaponLevel(it)))
  protected weaponPoints$ = this.weaponLevel$.pipe(map((it) => Math.max(0, it - 1)))
  protected weapons$ = this.types.all$
  protected points$ = combineLatest({
    points: this.weaponPoints$,
    spent1: this.tree1Spent$,
    spent2: this.tree2Spent$,
  }).pipe(
    map(({ points, spent1, spent2 }) => {
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
  )

  protected vm$ = defer(() =>
    combineLatest({
      tree1: this.tree1$,
      tree2: this.tree2$,
      weaponTag: this.weapon$,
      weaponType: this.weaponType$,
      weaponLevel: this.weaponLevel$,
      weaponLevelMax: of(NW_MAX_WEAPON_LEVEL),
      weaponPoints: this.weaponPoints$,
      pointsAvailable: this.points$.pipe(mapDistinct(({ available }) => available)),
      pointsTree1: this.points$.pipe(mapDistinct(({ points1 }) => points1)),
      pointsTree2: this.points$.pipe(mapDistinct(({ points2 }) => points2)),
    })
  ).pipe(subscribeOn(asyncScheduler))

  protected touched = false
  protected trackByIndex = (i: number) => i
  protected onChange = (value: SkillBuildValue) => {}
  protected onTouched = () => {}

  public constructor(private types: NwWeaponTypesService, private char: CharacterStore, private dialog: Dialog) {
    //
  }

  public writeValue(value: SkillBuildValue): void {
    this.tree1$.next(value?.tree1)
    this.tree2$.next(value?.tree2)
    this.weapon$.next(value?.weapon)
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled
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
    const old: SkillBuildValue = {
      weapon: this.weaponTag,
      tree1: this.tree1,
      tree2: this.tree2,
    }
    if (!isEqual(value, old)) {
      this.weaponTag = value.weapon
      this.tree1 = value.tree1
      this.tree2 = value.tree2
      this.onChange(value)
    }
  }

  protected getValue(): SkillBuildValue {
    return {
      weapon: this.weaponTag,
      tree1: this.tree1,
      tree2: this.tree2,
    }
  }

  public switchWeapon() {
    SkillWeaponDialogComponent.open(this.dialog, {
      data: this.weaponTag,
      width: '100vw',
      maxWidth: 400,
      height: '100vh',
      maxHeight: 600,
    })
      .closed.pipe(filter((it) => it != null))
      .subscribe((value) => {
        this.commit({
          weapon: value,
          tree1: [],
          tree2: [],
        })
      })
  }
}
