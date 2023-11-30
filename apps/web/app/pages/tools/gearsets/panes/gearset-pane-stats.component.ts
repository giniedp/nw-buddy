import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { ActiveWeaponComponent } from '../stats/active-weapon.component'
import { AttributesStatsComponent } from '../stats/attributes-stats.component'
import { CraftingStatsComponent } from '../stats/crafting-stats.component'
import { DamageModsStatsComponent } from '../stats/damage-mods-stats.component'
import { EmpowerStatsComponent } from '../stats/empower-stats.component'
import { FortifyStatsComponent } from '../stats/fortify-stats.component'
import { LuckStatsComponent } from '../stats/luck-stats.component'
import { StackedPerksComponent } from '../stats/stacked-perks.component'
import { VitalityStatsComponent } from '../stats/vitality-stats.component'
import { EffectDurationStatsComponent } from '../stats/effect-duration-stats.component'
import { CooldownRedutionStatsComponent } from '../stats/cooldown-stats.component'

@Component({
  standalone: true,
  selector: 'nwb-gearset-pane-stats',
  templateUrl: './gearset-pane-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    EmpowerStatsComponent,
    FortifyStatsComponent,
    LuckStatsComponent,
    VitalityStatsComponent,
    DamageModsStatsComponent,
    AttributesStatsComponent,
    CraftingStatsComponent,
    StackedPerksComponent,
    ActiveWeaponComponent,
    EffectDurationStatsComponent,
    CooldownRedutionStatsComponent
  ],

  host: {
    class: 'flex flex-col gap-2',
  },
})
export class GearsetPaneStatsComponent {
  @Input()
  public disabled: boolean

  public constructor() {
    //
  }

  protected editAttributes() {}
}
