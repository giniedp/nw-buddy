import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { NwDbService } from '~/nw'
import { getItemId } from '~/nw/utils'
import { ItemDetailService } from './item-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-item-detail',
  templateUrl: './item-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  exportAs: 'detail',
  host: {
    class: 'block rounded-md overflow-clip font-nimbus',
  },
  providers: [
    {
      provide: ItemDetailService,
      useExisting: forwardRef(() => ItemDetailComponent),
    },
  ],
})
export class ItemDetailComponent extends ItemDetailService {
  @Input()
  public set entityId(value: string) {
    this.entityId$.next(value)
  }

  @Input()
  public set entity(value: ItemDefinitionMaster | Housingitems) {
    this.entityId$.next(getItemId(value))
  }

  public constructor(db: NwDbService, cdRef: ChangeDetectorRef) {
    super(db, cdRef)
  }
}
