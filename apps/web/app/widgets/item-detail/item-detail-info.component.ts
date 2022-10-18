import { CommonModule } from "@angular/common"
import { ChangeDetectionStrategy, Component } from "@angular/core"
import { combineLatest, map } from "rxjs"
import { NwModule } from "~/nw"
import { getItemTierAsRoman } from "~/nw/utils"
import { ItemDetailService } from "./item-detail.service"

@Component({
  standalone: true,
  selector: 'nwb-item-detail-info',
  templateUrl: './item-detail-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block p-3'
  }
})
export class ItemDetailInfoComponent {

  protected vm$ = combineLatest({
    entity: this.detail.entity$,
    item: this.detail.item$,
    housing: this.detail.housingItem$,
    weapon: this.detail.weaponStats$,
    armor: this.detail.armorStats$,
    ingCats: this.detail.ingredientCategories$,
  }).pipe(map(({ entity, item, weapon, armor, ingCats }) => {
    return {
      bindOnEquip: !!item?.BindOnEquip,
      bindOnPickup: !!entity?.BindOnPickup,
      tier: getItemTierAsRoman(entity?.Tier),
      canReplaceGem: item && item.CanHavePerks && item.CanReplaceGem,
      cantReplaceGem: item && item.CanHavePerks && !item.CanReplaceGem,
      weight: (weapon?.WeightOverride || armor?.WeightOverride || item?.Weight) / 10,
      durability: item?.Durability,
      maxStackSize: entity?.MaxStackSize,
      requiredLevel: item?.RequiredLevel,
      ingredientTypes: ingCats
    }
  }))

  public constructor(private detail: ItemDetailService) {

  }
}
