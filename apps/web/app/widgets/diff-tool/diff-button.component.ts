import { Component, HostListener, inject, input, TemplateRef, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CodeEditorModule } from '~/ui/code-editor'
import { IconsModule } from '~/ui/icons'
import { svgCode, svgExclamation } from '~/ui/icons/svg'
import { LayoutModule, ModalService } from '~/ui/layout'
import { ComponentInputs, PropertyGridCell } from '~/ui/property-grid'
import { DiffToolStore } from './diff-tool.store'
@Component({
  selector: 'nwb-diff-button',
  template: `
    <nwb-icon [icon]="icon" class="w-4 h-4" />
    <ng-template #tplModal>
      <ion-header class="bg-base-300">
        <ion-toolbar class="bg-black">
          <ion-title>
            @if (store.isLoading()) {
              ...loading data
            } @else if (store.hasHistory()) {
              Object History
            } @else {
              Raw Object
            }
          </ion-title>
          <button type="button" slot="end" class="btn btn-ghost btn-circle mr-2 text-xl" [nwbModalClose]>
            &times;
          </button>
        </ion-toolbar>
      </ion-header>
      <ion-content [scrollY]="false" class="bg-base-200">
        @if (store.isLoading()) {
          <div class="ion-page flex items-center justify-center">
            <span class="loading loading-infinity loading-lg"></span>
          </div>
        } @else if (store.hasHistory()) {
          <nwb-diff-history-editor class="ion-page" [history]="store.history()" />
        } @else {
          <nwb-code-editor class="ion-page" [ngModel]="store.currentDocument()" [language]="'json'" [disabled]="true" />
        }
      </ion-content>
    </ng-template>
  `,
  imports: [IconsModule, LayoutModule, CodeEditorModule, FormsModule],
  providers: [DiffToolStore],
  host: {
    role: 'button',
    class: 'btn btn-xs btn-square btn-ghost',
    '[class.float-right]': 'isCell()',
  },
})
export class DiffButtonComponent<T = unknown> {
  protected icon = svgCode
  protected iconError = svgExclamation
  protected store = inject(DiffToolStore)
  private modal = inject(ModalService)
  private tplModal = viewChild('tplModal', { read: TemplateRef })
  public record = input.required<T>()
  public idKey = input.required<keyof T>()
  public isCell = input<boolean>(false)
  @HostListener('click')
  protected onClick() {
    this.store.loadRecord(this.record(), this.idKey())
    this.modal.open({
      content: this.tplModal(),
      size: ['y-lg', 'x-lg'],
    })
  }
}

export function diffButtonCell<T>({ record, idKey }: ComponentInputs<DiffButtonComponent<T>>): PropertyGridCell {
  return {
    value: String(idKey),
    component: DiffButtonComponent,
    componentInputs: {
      record,
      idKey,
      isCell: true,
    },
  }
}
