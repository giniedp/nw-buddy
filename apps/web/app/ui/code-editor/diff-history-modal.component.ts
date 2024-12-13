import { Component } from '@angular/core'
import { LayoutModule, ModalService } from '../layout'
import { DiffHistoryEditorComponent } from './diff-history-editor.component'

@Component({
  standalone: true,
  selector: 'nwb-diff-history-modal',
  template: `
    <ion-header></ion-header>
    <ion-content [scrollY]="false">
      <nwb-diff-history-editor />
    </ion-content>
  `,
  imports: [LayoutModule, DiffHistoryEditorComponent],
})
export class DiffHistoyrModalComponent {
  public static open(modal: ModalService) {
    modal.open({
      content: DiffHistoyrModalComponent,
      inputs: {},
    })
  }
}
