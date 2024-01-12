import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
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

@Component({
  standalone: true,
  selector: 'nwb-damage-calculator',
  templateUrl: './damage-calculator.component.html',
  providers: [DamageCalculatorStore],
  imports: [CommonModule, NwModule, CdkMenuModule, FormsModule, IconsModule, TooltipModule],
  host: {
    class: 'layout-content'
  }
})
export class DamageCalculatorComponent {
  protected store = inject(DamageCalculatorStore)
  private mannequin = inject(Mannequin)

  public constructor() {
    combineLatest({
      weapon: this.mannequin.activeWeapon$,
      damage: this.mannequin.statDamageBase$,
      empowerMods: this.mannequin.statDmg$,
      attributes: this.mannequin.activeAttributes$,
    })
      .pipe(takeUntilDestroyed())
      .subscribe(({ weapon, damage, empowerMods, attributes }) => {

        patchState(this.store, {
          attributes: {
            str: attributes.str.scale,
            dex: attributes.dex.scale,
            int: attributes.int.scale,
            foc: attributes.foc.scale,
            con: attributes.con.scale,
          },
          convertScaling: damageScaleAttrs(damage.AffixStats) ,
          weaponGearScore: weapon.gearScore,
          weaponScaling: damageScaleAttrs(weapon.weapon),
          baseDamage: weapon.weapon?.BaseDamage ?? 0,
          damageCoef: damage.DamageCoef?.value ?? 0,
          pvpMods: damage.DamagePvpBalance?.value ?? 0,
          ammoMods: damage.DamageCoefAmmo?.value ? damage.DamageCoefAmmo?.value - 1 : 0,
          baseMods: damage.MainDamageMod?.value ?? 0,
          convertBaseMods: damage.ElemDamageMod?.value ?? 0,
          critMods: damage.CritDamageMod?.value ?? 0,

          weaponDamageType: damage.MainDamageType,
          convertDamageType: damage.ElemDamageType,

          empowerMods: empowerMods.DamageCategories[damage.MainDamageType]?.value ?? 0,
          convertEmpowerMods: empowerMods.DamageCategories[damage.ElemDamageType]?.value ?? 0,

          convertPercent: damage.ConvertPercent,
        })
      })
  }
}
