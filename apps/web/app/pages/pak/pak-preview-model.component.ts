import { Component, computed, input } from '@angular/core'
import { ItemModelInfo, ModelViewerModule } from '~/widgets/model-viewer'

@Component({
  selector: 'pak-preview-model',
  imports: [ModelViewerModule],
  template: `
    @if (models()) {
      <nwb-model-viewer [models]="models()" />
    }
  `,
})
export class AssetContentModelComponent {
  public file = input<string>()
  public models = computed((): ItemModelInfo[] => {
    if (!this.file()) {
      return null
    }
    return [
      {
        itemId: null,
        label: null,
        name: null,
        url: `http://localhost:8000/file/${this.file()}.glb`,
        itemClass: null,
        appearance: null,
      },
    ]
  })
}
