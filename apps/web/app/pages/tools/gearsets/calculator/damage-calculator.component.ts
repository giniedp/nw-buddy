import { Dialog } from '@angular/cdk/dialog'
import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { Component, Injector, Pipe, PipeTransform, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { damageScaleAttrs } from '@nw-data/common'
import { combineLatest, filter, map, take } from 'rxjs'
import { GearsetsStore } from '~/data'
import { NwDbService, NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { CollapsibleComponent } from '~/ui/collapsible'
import { DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft, svgEllipsisVertical } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { VitalTableAdapter, VitalTableRecord } from '~/widgets/data/vital-table'
import { DamageCalculatorStore } from './damage-calculator.store'
import { LabelControlComponent } from './label-control.component'
import { TweakControlComponent } from './tweak-control.component'

@Pipe({ standalone: true, name: 'floor' })
export class FloorPipe implements PipeTransform {
  public transform(value: number): number {
    return Math.floor(value)
  }
}

@Component({
  standalone: true,
  selector: 'nwb-damage-calculator',
  templateUrl: './damage-calculator.component.html',
  providers: [DamageCalculatorStore, FloorPipe, GearsetsStore],
  imports: [
    CommonModule,
    NwModule,
    CdkMenuModule,
    FormsModule,
    IconsModule,
    TooltipModule,
    TweakControlComponent,
    LabelControlComponent,
    FloorPipe,
    CollapsibleComponent,
  ],

  host: {
    class: 'layout-content',
  },
})
export class DamageCalculatorComponent {
  protected store = inject(DamageCalculatorStore)
  private mannequin = inject(Mannequin)
  private dialog = inject(Dialog)
  private injector = inject(Injector)
  private db = inject(NwDbService)
  private gearsets = inject(GearsetsStore)
  protected svgChevronLeft = svgChevronLeft
  protected svgMore = svgEllipsisVertical

  public constructor() {
    this.gearsets.loadAll()

    combineLatest({
      level: this.mannequin.level$,
      gearScore: this.mannequin.gearScore$,
      weapon: this.mannequin.activeWeapon$,
      damage: this.mannequin.statDamageBase$,
      empowerMods: this.mannequin.statDmg$,
      attributes: this.mannequin.activeAttributes$,
    })
      .pipe(takeUntilDestroyed())
      .subscribe(({ level, gearScore, weapon, damage, empowerMods, attributes }) => {
        patchState(this.store, {
          attackerLevel: level,
          attackerGearScore: gearScore,
          attributes: {
            str: attributes.str.scale,
            dex: attributes.dex.scale,
            int: attributes.int.scale,
            foc: attributes.foc.scale,
            con: attributes.con.scale,
          },
          convertScaling: damageScaleAttrs(damage.ConvertAffix),
          weaponGearScore: weapon.gearScore,
          weaponScaling: damageScaleAttrs(weapon.weapon),
          baseDamage: weapon.weapon?.BaseDamage ?? 0,
          damageCoef: damage.DamageCoef?.value ?? 0,
          pvpMods: damage.ModPvp?.value ?? 0,
          ammoMods: damage.ModAmmo?.value ? damage.ModAmmo?.value - 1 : 0,
          baseMods: damage.ModBase?.value ?? 0,
          convertBaseMods: damage.ModBaseConvert?.value ?? 0,
          critMods: damage.ModCrit?.value ?? 0,

          weaponDamageType: damage.DamageType,
          convertDamageType: damage.ConvertType,

          empowerMods: empowerMods.DamageCategories[damage.DamageType]?.value ?? 0,
          convertEmpowerMods: empowerMods.DamageCategories[damage.ConvertType]?.value ?? 0,

          convertPercent: damage.ConvertPercent,
        })
      })
  }

  public pickVitalDefender() {
    DataViewPicker.open<VitalTableRecord>(this.dialog, {
      title: 'Pick Vital Defender',
      selection: [this.store.defenderCreature()?.VitalsID].filter((it) => !!it),
      dataView: {
        adapter: VitalTableAdapter,
      },
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
      .closed.pipe(
        map((it) => it?.[0]),
        filter((it) => !!it),
        take(1),
      )
      .subscribe((result) => {
        this.store.loadVital(result)
      })
  }

  public setPvPMode() {
    patchState(this.store, {
      defenderIsPlayer: true,
    })
  }

  public setPvEMode() {
    patchState(this.store, {
      defenderIsPlayer: false,
    })
  }
}
