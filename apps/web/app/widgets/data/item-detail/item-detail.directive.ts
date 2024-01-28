import { ChangeDetectorRef, Directive, forwardRef, Input } from '@angular/core'
import { NwDataService } from '~/data'
import { ModelViewerService } from '../../model-viewer'
import { ItemDetailStore } from './item-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbItemDetail]',
  exportAs: 'itemDetail',
  providers: [
    {
      provide: ItemDetailStore,
      useExisting: forwardRef(() => ItemDetailDirective),
    },
  ],
})
export class ItemDetailDirective extends ItemDetailStore {
  @Input()
  public set nwbItemDetail(value: string) {
    this.patchState({ recordId: value })
  }

  @Input()
  public set gsOverride(value: number) {
    this.patchState({ gsOverride: value })
  }

  @Input()
  public set perkOverride(value: Record<string, string>) {
    this.patchState({ perkOverride: value })
  }
  public constructor(db: NwDataService, models: ModelViewerService, cdRef: ChangeDetectorRef) {
    super(db, models, cdRef)
  }
}
