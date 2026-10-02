import { Component, computed, inject, input } from '@angular/core'
import { FileResource, PakService } from './pak.service'

@Component({
  selector: 'nwb-pak-preview-image',
  template: ` <img [src]="imageUrl()" /> `,
})
export class PakPreviewImageComponent {
  public service = inject(PakService)
  public source = input<FileResource>()
  public imageUrl = computed(() => this.source().resource)
}
