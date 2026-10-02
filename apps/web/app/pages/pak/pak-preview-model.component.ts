import { Component, computed, inject, input } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { FileResource, PakService } from './pak.service'

@Component({
  selector: 'nwb-pak-preview-model',
  template: ` <iframe class="w-full h-full bg-base-300" [attr.src]="iframeUrl()"></iframe> `,
  host: {
    class: 'ion-page',
  },
})
export class PakPreviewModelComponent {
  private sanitizer = inject(DomSanitizer)
  public service = inject(PakService)
  public source = input<FileResource>()
  public type = input<'model' | 'image' | 'material'>('model')

  public iframeUrl = computed(() => {
    // const url = new URL(env.nwbtUrl)
    const url = new URL('http://localhost:5173/')
    url.searchParams.set(this.type(), this.source().resource)
    return this.sanitizer.bypassSecurityTrustResourceUrl(url.toString())
  })
}
