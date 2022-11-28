import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, OnChanges } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { getItemId } from '~/nw/utils'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailDescriptionComponent } from './item-detail-description.component'
import { ItemDetailDivider } from './item-detail-divider.component'
import { ItemDetailHeaderComponent } from './item-detail-header.component'
import { ItemDetailInfoComponent } from './item-detail-info.component'
import { ItemDetailPerksComponent } from './item-detail-perks.component'
import { ItemDetailStatsComponent } from './item-detail-stats.component'
import { ItemDetailService } from './item-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-item-card',
  templateUrl: './item-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ItemDetailHeaderComponent,
    ItemDetailDescriptionComponent,
    ItemDetailDivider,
    ItemDetailInfoComponent,
    ItemDetailPerksComponent,
    ItemDetailStatsComponent,
    ItemFrameModule
  ],
  exportAs: 'card',
  host: {
    class: 'block bg-black rounded-md overflow-clip font-nimbus',
  },
  providers: [
    {
      provide: ItemDetailService,
      useExisting: forwardRef(() => ItemCardComponent),
    },
  ],
})
export class ItemCardComponent extends ItemDetailService implements OnChanges {
  @Input()
  public set entityId(value: string) {
    this.entityId$.next(value)
  }

  @Input()
  public set entity(value: ItemDefinitionMaster | Housingitems) {
    this.entityId$.next(getItemId(value))
  }

  @Input()
  public enableTracker: boolean

  @Input()
  public enableInfoLink: boolean

  @Input()
  public disableStats: boolean

  @Input()
  public disableInfo: boolean

  @Input()
  public disableDescription: boolean

  public get isLoading$() {
    return this.vm$.pipe(map((it) => it.loading))
  }

  public constructor(db: NwDbService, cdRef: ChangeDetectorRef) {
    super(db, cdRef)
  }

  public ngOnChanges() {
    this.cdRef.markForCheck()
  }
}
