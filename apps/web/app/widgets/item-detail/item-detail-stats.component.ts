import { Component, Input } from "@angular/core"
import { Housingitems, ItemDefinitionMaster } from "@nw-data/types"
import { ItemDetailService } from "./item-detail.service"

@Component({
  selector: 'nwb-item-detail-stats',
  templateUrl: './item-detail-stats.component.html'
})
export class ItemDetailStatsComponent {

  @Input()
  public item: ItemDefinitionMaster | Housingitems

  public constructor(private service: ItemDetailService) {
    //
  }
}
