import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { Component, Pipe, PipeTransform, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { damageScaleAttrs } from '@nw-data/common'
import { combineLatest } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'
import { DamageCalculatorStore } from './damage.store'
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
  providers: [DamageCalculatorStore, FloorPipe],
  imports: [
    CommonModule,
    NwModule,
    CdkMenuModule,
    FormsModule,
    IconsModule,
    TooltipModule,
    TweakControlComponent,
    LabelControlComponent,
    FloorPipe
  ],
  host: {
    class: 'layout-content',
  },
})
export class DamageCalculatorComponent {
  protected store = inject(DamageCalculatorStore)
  private mannequin = inject(Mannequin)

  public constructor() {
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
}
