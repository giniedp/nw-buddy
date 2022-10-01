import { Component, Input } from "@angular/core"
import { GameEvent } from "@nw-data/types"
import { combineLatest } from "rxjs"
import { NwDbService } from "~/nw"

@Component({
  selector: 'nwb-item-detail-salvage',
  templateUrl: './item-detail-salvage.component.html',
  host: {
    class: 'block'
  }
})
export class ItemDetailSalvageComponent {

  @Input()
  public event: GameEvent

  public get azothReward() {
    return this.event?.AzothReward
  }

  public get azothSalt() {
    return this.event?.AzothSalt
  }

  public get currencyReward() {
    if (this.event?.CurrencyReward) {
      return this.event.CurrencyReward.split('-').map((it) => Number(it) / 100).join(' - ')
    }
    return null
  }
}
