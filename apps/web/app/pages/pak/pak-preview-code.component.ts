import { httpResource } from '@angular/common/http'
import { Component, inject, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CodeEditorModule } from '../../ui/code-editor'
import { MonacoSliceExtensionDirective } from './monaco'
import { FileResource, PakService } from './pak.service'

@Component({
  selector: 'nwb-pak-preview-code',
  template: `
    <nwb-code-editor
      class="ion-page"
      [nwbMonacoSliceExtension]=""
      (nwbMonacoAssetCommand)="service.handleMonacoAssetCommand($event)"
      [ngModel]="textContent.value()"
      [language]="source().lang || 'txt'"
      [disabled]="true"
    />
  `,
  host: {
    class: 'ion-page',
  },
  imports: [CodeEditorModule, MonacoSliceExtensionDirective, FormsModule],
})
export class PakPreviewCodeComponent {
  public service = inject(PakService)
  public source = input<FileResource>()
  protected textContent = httpResource.text(() => this.source().resource)
}
