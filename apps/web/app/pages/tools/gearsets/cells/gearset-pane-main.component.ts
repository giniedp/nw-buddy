import { DecimalPipe, PercentPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, Input, signal } from '@angular/core'
import { GearCellAttributesComponent } from '../cells/gear-cell-attributes.component'
import { GearCellAvatarComponent } from '../cells/gear-cell-avatar.component'
import { GearCellEquipLoadComponent } from '../cells/gear-cell-equip-load.component'
import { GearCellVitalityComponent } from '../cells/gear-cell-vitality.component'
import { GearCellSlotsBuffsComponent } from '../cells/gear-cell-slots-buffs.component'
import { GearCellSlotsConsumablesComponent } from '../cells/gear-cell-slots-consumables.component'
import { GearCellSlotsTrophiesComponent } from '../cells/gear-cell-slots-trophies.component'
import { GearCellSlotsTownBuffsComponent } from '../cells/gear-cell-slots-town-buffs.component'

@Component({
  selector: 'nwb-gearset-pane-main',
  templateUrl: './gearset-pane-main.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GearCellAvatarComponent,
    GearCellAttributesComponent,
    GearCellVitalityComponent,
    GearCellEquipLoadComponent,
    GearCellSlotsBuffsComponent,
    GearCellSlotsConsumablesComponent,
    GearCellSlotsTrophiesComponent,
    GearCellSlotsTownBuffsComponent,
  ],
  providers: [PercentPipe, DecimalPipe],
})
export class GearsetPaneMainComponent {
  public disabled = input(false)
}
