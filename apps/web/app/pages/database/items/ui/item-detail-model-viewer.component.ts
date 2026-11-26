import { Component, computed, inject, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ItemDetailStore } from '~/widgets/data/item-detail'
import { ModelDownloadButtonComponent, ModelViewComponent } from '~/widgets/model-view'
import { ModelsService } from '~/widgets/model-viewer'

@Component({
  selector: 'nwb-item-detail-model-viewer',
  imports: [ModelViewComponent, ModelDownloadButtonComponent],
  template: `
    @if (!isHidden()) {
      @if (viewerActive()) {
        <div
          class="aspect-square rounded-md overflow-clip"
          animate.enter="fade-grow-y-in"
          animate.leave="fade-grow-y-out"
        >
          <nwb-model-view [models]="models()" [downloads]="true" class="w-full h-full" />
        </div>
      }
      <div class="flex flex-col gap-2" animate.enter="fade-grow-y-in" animate.leave="fade-grow-y-out">
        <button
          class="btn btn-xs btn-outline btn-block btn-ghost rounded-md opacity-50"
          (click)="viewerActive.set(!viewerActive())"
        >
          {{ viewerActive() ? 'Close' : 'View 3D Model' }}
        </button>
        <nwb-model-download-button [models]="models()" />
      </div>
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
}
