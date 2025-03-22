import { Component, computed, HostBinding, inject, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ItemDetailStore } from '~/widgets/data/item-detail'
import { IN_OUT_ANIM, IS_HIDDEN_ANIM } from '~/widgets/data/item-detail/animation'
import { ModelsService, ModelViewerModule } from '~/widgets/model-viewer'

@Component({
  selector: 'nwb-item-detail-model-viewer',
  imports: [ModelViewerModule],
  animations: [IS_HIDDEN_ANIM, IN_OUT_ANIM],
  template: `
    @if (!isHidden()) {
      @if (viewerActive()) {
        <div class="aspect-square rounded-md overflow-clip" @inOut>
          <nwb-model-viewer [models]="models()" class="w-full h-full" />
        </div>
      }
      <button
        @inOut
        class="btn btn-xs flex-1 btn-outline btn-ghost opacity-50 w-full"
        (click)="viewerActive.set(!viewerActive())"
      >
        {{ viewerActive() ? 'Close' : 'View 3D Model' }}
      </button>
    }
  `,
  host: {
    class: 'block',
  },
})
export class ItemDetailModelViewerComponent {
  private service = inject(ModelsService)
  private store = inject(ItemDetailStore)
  protected models = toSignal(this.service.byItemId(toObservable(this.store.recordId)))
  protected viewerActive = signal(false)
  protected isHidden = computed(() => {
    return !this.models()?.length
  })
  @HostBinding('@isHidden')
  protected get isHiddenTrigger() {
    return this.isHidden()
  }
}
