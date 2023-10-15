import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, forwardRef } from '@angular/core'
import { NwDbService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { GatherableDetailStore } from './gatherable-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-gatherable-detail',
  templateUrl: './gatherable-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule],
  providers: [
    DecimalPipe,
    {
      provide: GatherableDetailStore,
      useExisting: forwardRef(() => GatherableDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class GatherableDetailComponent extends GatherableDetailStore {
  @Input()
  public set gatherableId(value: string) {
    this.patchState({ gatherableId: value })
  }
  public constructor(db: NwDbService) {
    super(db)
  }
}
