import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core'
import { getItemId } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { ModelsService } from '../../model-viewer/model-viewer.service'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-item-detail',
  templateUrl: './item-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  exportAs: 'detail',
  host: {
    class: 'block font-nimbus',
  },
  providers: [
    {
      provide: ItemDetailStore,
      useExisting: forwardRef(() => ItemDetailComponent),
    },
  ],
})
export class ItemDetailComponent extends ItemDetailStore {
  @Input()
  public set entityId(value: string) {
    this.patchState({ recordId: value })
  }

  @Input()
  public set entity(value: MasterItemDefinitions | HouseItems) {
    this.patchState({ recordId: getItemId(value) })
  }
  @Input()
  public set perkOverride(value: Record<string, string>) {
    this.patchState({ perkOverride: value })
  }
  public constructor(db: NwDataService, ms: ModelsService, cdRef: ChangeDetectorRef) {
    super(db, ms, cdRef)
  }
}
