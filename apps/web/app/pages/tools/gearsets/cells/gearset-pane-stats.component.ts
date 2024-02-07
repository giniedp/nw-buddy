import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { GearCellModsAbsComponent } from '../cells/gear-cell-mods-abs.component'
import { GearCellModsDmgComponent } from '../cells/gear-cell-mods-dmg.component'
import { GearCellModsLuckComponent } from '../cells/gear-cell-mods-luck.component'
import { GearCellPerkStacksComponent } from '../cells/gear-cell-perk-stacks.component'
import { GearCellWeaponComponent } from '../cells/gear-cell-weapon.component'
import { GearCellModsCraftingComponent } from '../cells/gear-cell-mods-crafting.component'
import { GearCellModsDurationComponent } from '../cells/gear-cell-mods-duration.component'
import { GearCellModsCooldownComponent } from '../cells/gear-cell-mods-cooldown.component'
import { GearCellModsMiscComponent } from '../cells/gear-cell-mods-misc.component'

@Component({
  standalone: true,
  selector: 'nwb-gearset-pane-stats',
  templateUrl: './gearset-pane-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GearCellModsMiscComponent,
    GearCellModsDurationComponent,
    GearCellModsAbsComponent,
    GearCellModsCraftingComponent,
    GearCellModsDmgComponent,
    GearCellModsDurationComponent,
    GearCellModsLuckComponent,
    GearCellPerkStacksComponent,
    GearCellWeaponComponent,
    GearCellModsCooldownComponent
  ],
  host: {
    class: '@container'
  }
})
export class GearsetPaneStatsComponent {
  @Input()
  public disabled: boolean
}
