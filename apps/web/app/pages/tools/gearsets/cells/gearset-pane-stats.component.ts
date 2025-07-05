import { ChangeDetectionStrategy, Component, input, Input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { injectElementWidth } from '~/ui/layout/resize-observer.directive'
import { GearCellModsAbsComponent } from '../cells/gear-cell-mods-abs.component'
import { GearCellModsCooldownComponent } from '../cells/gear-cell-mods-cooldown.component'
import { GearCellModsCraftingComponent } from '../cells/gear-cell-mods-crafting.component'
import { GearCellModsDmgComponent } from '../cells/gear-cell-mods-dmg.component'
import { GearCellModsDurationComponent } from '../cells/gear-cell-mods-duration.component'
import { GearCellModsLuckComponent } from '../cells/gear-cell-mods-luck.component'
import { GearCellModsMiscComponent } from '../cells/gear-cell-mods-misc.component'
import { GearCellPerkStacksComponent } from '../cells/gear-cell-perk-stacks.component'
import { GearCellWeaponComponent } from '../cells/gear-cell-weapon.component'

@Component({
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
    GearCellModsCooldownComponent,
  ],
  host: {
    class: '',
  },
})
export class GearsetPaneStatsComponent {
  public disabled = input(false)
  protected width = toSignal(injectElementWidth())
}
