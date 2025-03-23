import { Component, effect, inject, untracked } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { map } from 'rxjs'
import { CodeEditorModule } from '~/ui/code-editor'
import { LayoutModule } from '~/ui/layout'
import { SplitGutterComponent, SplitPaneDirective } from '~/ui/split-container'
import { DatasheetsSidebarComponent } from './datasheets-sidebar.component'
import { DatasheetsStore } from './datasheets.store'

@Component({
  selector: 'nwb-datasheets-page',
  imports: [
    DatasheetsSidebarComponent,
    LayoutModule,
    CodeEditorModule,
    FormsModule,
    SplitGutterComponent,
    SplitPaneDirective,
  ],
  host: {
    class: 'ion-page flex flex-row',
  },
  template: `
    <ion-split-pane contentId="editor">
      <ion-menu contentId="editor" class="order-3" [nwbSplitPane]="gutter" [nwbSplitPaneWidth]="420">
        <nwb-datasheets-sidebar class="w-full" />
      </ion-menu>
      <nwb-split-gutter class="order-2" #gutter="gutter" />
      <div class="ion-page order-1" id="editor">
        <ion-header>
          <ion-toolbar>
            <ion-title>Datasheets</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content [scrollY]="false">
          @if (selected(); as sheet) {
            <nwb-code-editor class="h-full w-full" [ngModel]="sheet.content" [language]="'json'" [disabled]="true" />
          }
        </ion-content>
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
