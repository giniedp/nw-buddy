import { Directive, Input } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { ItemDetailService } from './item-detail.service'

@Directive({
  selector: '[nwbItemDetail]',
  providers: [ItemDetailService]
})
export class ItemDetailDirective {

  @Input()
  public set nwbItemDetail(value: string | ItemDefinitionMaster | Housingitems) {
    this.service.update(value)
  }

  public constructor(private service: ItemDetailService) {
    //
  }
}
