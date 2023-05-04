import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { NwDbService } from '~/nw'
import { getItemId } from '~/nw/utils'
import { ModelViewerService } from '../../model-viewer/model-viewer.service'
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
    this.patchState({ entityId: value })
  }

  @Input()
  public set entity(value: ItemDefinitionMaster | Housingitems) {
    this.patchState({ entityId: getItemId(value) })
  }
  @Input()
  public set perkOverride(value: Record<string, string>) {
    this.patchState({ perkOverride: value })
  }
  public constructor(db: NwDbService, ms: ModelViewerService, cdRef: ChangeDetectorRef) {
    super(db, ms, cdRef)
  }
}
