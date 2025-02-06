import { Component, effect, inject, untracked } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { map } from 'rxjs'
import { CodeEditorModule } from '~/ui/code-editor'
import { LayoutModule } from '~/ui/layout'
import { DatasheetsSidebarComponent } from './datasheets-sidebar.component'
import { DatasheetsTabbarComponent } from './datasheets-tabbar.component'
import { DatasheetsStore } from './datasheets.store'

@Component({
  standalone: true,
  selector: 'nwb-datasheets-page',
  imports: [DatasheetsTabbarComponent, DatasheetsSidebarComponent, LayoutModule, CodeEditorModule, FormsModule],
  host: {
    class: 'ion-page flex flex-row',
  },
  template: `
    <ion-split-pane contentId="editor">
      <ion-menu contentId="editor" class="w-80">
        <nwb-datasheets-sidebar class="w-80" [files]="files()" />
      </ion-menu>
      <div class="ion-page" id="editor">
        <ion-header>
          <ion-toolbar>
            <ion-title>Header</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content [scrollY]="false">
          @if (selected(); as sheet) {
            <nwb-code-editor class="h-full w-full" [ngModel]="sheet.content" [language]="'json'" [disabled]="true" />
          }
        </ion-content>
        <!-- <ion-footer></ion-footer> -->
      </div>
    </ion-split-pane>
  `,
})
export class DatasheetsPageComponent {
  private store = inject(DatasheetsStore)
  protected files = this.store.datasheets
  protected fileParam$ = inject(ActivatedRoute).queryParams.pipe(map((params) => params['file']))
  protected fileParam = toSignal(this.fileParam$)
  protected selected = this.store.selectedSheet

  #fxParam = effect(() => {
    const id = this.fileParam()
    untracked(() => {
      this.store.select(id)
    })
  })
}
