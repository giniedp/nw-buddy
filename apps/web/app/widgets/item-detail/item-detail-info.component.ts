import { Component, Input } from "@angular/core"
import { Housingitems, ItemDefinitionMaster } from "@nw-data/types"
import { getItemTierAsRoman, isMasterItem } from "~/core/nw/utils"

@Component({
  selector: 'nwb-item-detail-info',
  templateUrl: './item-detail-info.component.html',
  host: {
    class: 'block'
  }
})
export class ItemDetailInfoComponent {

  @Input()
  public item: ItemDefinitionMaster | Housingitems

  protected get bindOnPickup() {
    return !!this.item?.BindOnPickup
  }

  protected get tier() {
    return getItemTierAsRoman(this.item?.Tier)
  }

  protected get bindOnEquip() {
    return isMasterItem(this.item) && this.item.BindOnEquip
  }

  protected get canReplaceGem() {
    return isMasterItem(this.item) && this.item.CanReplaceGem
  }

  protected get requiredLevel() {
    return isMasterItem(this.item) && this.item.RequiredLevel
  }

  protected get weight() {
    return this.item?.Weight / 10
  }

  protected get durability() {
    return isMasterItem(this.item) ? this.item.Durability : null
  }

  protected get maxStackSize() {
    return this.item.MaxStackSize
  }
}
