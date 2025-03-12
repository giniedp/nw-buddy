import { LayoutModule } from '@angular/cdk/layout'
import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { injectRouteParam, selectStream } from '~/utils'
import { LootBucketDetailModule } from '~/widgets/data/loot-bucket-detail'
import { LootGraphComponent } from '~/widgets/loot/loot-graph.component'

@Component({
  selector: 'nwb-loot-bucket-detail-page',
  templateUrl: './loot-bucket-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, LayoutModule, LootBucketDetailModule, ItemFrameModule, LootGraphComponent],
  host: {
    class: 'block',
  },
})
export class LootBucketDetailPageComponent {
  protected id$ = injectRouteParam('id')
  protected bucketId$ = selectStream(this.id$, (id) => id.split('-')[0])
  protected rowId$ = selectStream(this.id$, (id) => Number(id.split('-')[1]))

  public constructor() {
    //
  }
}
