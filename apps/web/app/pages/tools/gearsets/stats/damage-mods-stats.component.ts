import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2 } from '@angular/core'
import { combineLatest, map, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { ModifierResult } from '~/nw/mannequin/modifier'
import { damageTypeIcon } from '~/nw/weapon-types'
import { TooltipModule } from '~/ui/tooltip'
import { ModifierTipComponent } from './modifier-tip.component'

@Component({
  standalone: true,
  selector: 'nwb-damage-mods-stats',
  templateUrl: './damage-mods-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent],
  host: {
    class: 'block hidden',
  },
})
export class DamageModsStatsComponent {
  protected trackBy = (i: number) => i

  protected vm$ = combineLatest({
    base: this.mannequin.statDamageBase$,
    mods: this.mannequin.statDamageMods$,
    attack: this.mannequin.activeDamageTableRow$,
  }).pipe(
    map(({ base, mods, attack }) => {
      const result: Array<ModifierResult & { label: string; icon?: string; prefix?: string }> = []

      result.push({ prefix: '+', label: `Damage Coefficient`, ...base.DamageCoef })

      if (base.DamagePvpBalance) {
        result.push({
          prefix: base.DamagePvpBalance.value < 0 ? '-' : '+',
          label: `Damage PvP Balance`,
          ...base.DamagePvpBalance,
        })
      }

      if (base.DamageCoefAmmo) {
        result.push({ prefix: '+', label: `Ammo Coefficient`, ...base.DamageCoefAmmo })
      }

      if (base.BaseDamageMod?.value) {
        result.push({
          prefix: '+',
          label: `Damage Bonus`,
          icon: damageTypeIcon(base.BaseDamageType),
          ...base.BaseDamageMod,
        })
      }
      if (base.ConvertedDamageMod?.value) {
        result.push({
          prefix: '+',
          label: `Damage Bonus`,
          icon: damageTypeIcon(base.ConvertedDamageType),
          ...base.ConvertedDamageMod,
        })
      }

      result.push({ prefix: '+', label: 'Crit Bonus', ...mods.Crit })
      result.push({ prefix: '+', label: 'Backstab Bonus', ...mods.Backstab })
      if (attack?.IsRanged) {
        result.push({ prefix: '+', label: 'Headshot Bonus', ...mods.Headshot })
      }
      // result.push({ prefix: '+', label: 'Stagger Damage', ...mods.StaggerDamage })
      result.push({ prefix: '+', label: 'Threat', ...mods.Threat })

      // if (base.HealMod) {
      //   result.push({ prefix: '+', label: 'Heal Bonus', ...base.HealMod })
      // }

      // result.push({ prefix: '+', label: 'Armor Penetration', ...mods.ArmorPenetration })
      // result.push({ prefix: '+', label: 'Armor Penetration Backstab', ...mods.ArmorPenetrationBack })
      // if (attack?.IsRanged) {
      //   result.push({ prefix: '+', label: 'Armor Penetration Headshot', ...mods.ArmorPenetrationHead })
      // }

      result.push({ prefix: '', label: 'Crit Chance', ...mods.ChritChance })

      // result.push({ prefix: '+', label: `Base Damage Reduction`, ...mods.BaseReduction })
      // result.push({ prefix: '+', label: 'Crit Damage Reduction', ...mods.CritReduction })
      //result.push({ prefix: '+', label: 'Stagger Damage Reduction', ...mods.StaggerDamageReduction })

      return result.filter((it) => !!it.value)
    }),
    tap((it) => {
      if (it?.length) {
        this.renderer.removeClass(this.elRef.nativeElement, 'hidden')
      } else {
        this.renderer.addClass(this.elRef.nativeElement, 'hidden')
      }
    })
  )

  public constructor(
    private mannequin: Mannequin,
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {
    //
  }
}
