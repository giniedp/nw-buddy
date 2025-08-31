import { Component, inject, viewChild } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import JSZip from 'jszip'
import { filter, firstValueFrom, map, switchMap } from 'rxjs'
import { CodeEditorComponent, CodeEditorModule, CodeEditorSelectionRange } from '~/ui/code-editor'
import { ConfirmDialogComponent, LayoutModule, ModalService } from '~/ui/layout'
import { SplitGutterComponent, SplitPaneDirective } from '~/ui/split-container'
import { injectNwData } from '../../data'
import { saveBlobToFile } from '../../utils/file-handling'
import { ActionlistsSidebarComponent } from './actionlists-sidebar.component'
import { ActionlistsStore } from './actionlists.store'

@Component({
  selector: 'nwb-actionlists-page',
  imports: [
    ActionlistsSidebarComponent,
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
        <nwb-actionlists-sidebar class="w-full" />
      </ion-menu>
      <nwb-split-gutter class="order-2" #gutter="gutter" />
      <div class="ion-page order-1" id="editor">
        <ion-header class="bg-base-300">
          <ion-toolbar>
            <ion-title>Actionlists</ion-title>
            <button slot="end" class="btn" (click)="download()">Download ZIP</button>
          </ion-toolbar>
        </ion-header>
        <ion-content [scrollY]="false">
          @if (selected(); as sheet) {
            <nwb-code-editor
              class="h-full w-full"
              [ngModel]="sheet.content"
              [language]="'xml'"
              [disabled]="true"
              (selectionChanged)="handleSelectionChanged($event)"
              (editorLoaded)="handleEditorLoaded()"
            />
          }
        </ion-content>
      </div>
    </ion-split-pane>
  `,
})
export class ActionlistsPageComponent {
  private db = injectNwData()
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private store = inject(ActionlistsStore)
  private modal = inject(ModalService)

  protected files = this.store.actionlists
  protected fileParam$ = this.route.queryParams.pipe(map((params) => params['file']))
  protected fileParam = toSignal(this.fileParam$)
  protected rangeParam$ = this.route.queryParams.pipe(map((params) => decodeSelection(params['selection'])))
  protected rangeParam = toSignal(this.rangeParam$)
  protected selected = this.store.selectedSheet
  protected selected$ = toObservable(this.store.selectedSheet)
  protected editor = viewChild(CodeEditorComponent)

  public constructor() {
    this.store.select(toObservable(this.fileParam))
  }

  protected handleSelectionChanged(selection: CodeEditorSelectionRange) {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams: {
        selection: encodeSelection(selection),
      },
      replaceUrl: true,
    })
  }

  protected async handleEditorLoaded() {
    await firstValueFrom(this.selected$.pipe(filter((it) => !!it.content || !!it.error)))
    setTimeout(() => {
      this.editor().restoreSelection(this.rangeParam())
    })
  }

  protected async download() {
    const files = this.store.actionlists()
    const zip = new JSZip()
    let blob: Blob = null
    await this.modal.withLoadingIndicator(
      {
        message: 'Generating zip file',
        backdropDismiss: false,
        keyboardClose: false,
        showBackdrop: true,
      },
      async () => {
        for (const file of files) {
          await this.db
            .fetchText(file.url)
            .then((content) => {
              file.content = content
              return zip.file(file.id, content)
            })
            .catch((e) => {
              file.error = e
            })
        }
        blob = await zip.generateAsync({ type: 'blob' })
        console.log({ blob })
      },
    )
    if (!blob) {
      return
    }
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Download ZIP',
        body: `Zip is ready. Click below to download.`,
        positive: 'Download',
      },
    })
      .result$.pipe(
        filter((ok) => !!ok),
        switchMap(() => saveBlobToFile(blob, 'actionlists.zip')),
      )
      .subscribe({
        next: () => {
          this.modal.showToast({
            color: 'success',
            message: 'ZIP has been downloaded',
          })
        },
        error: () => {
          this.modal.showToast({
            color: 'danger',
            message: 'Download failed or cancelled',
          })
        },
      })
  }
}

function encodeSelection(selection: CodeEditorSelectionRange) {
  return [selection.startLine, selection.startColumn, selection.endLine, selection.endColumn].join(',')
}

function decodeSelection(value: string): CodeEditorSelectionRange {
  if (!value) {
    return null
  }
  try {
    const result = value.split(',')
    if (!Array.isArray(result) || result.length !== 4) {
      return null
    }
    return {
      startLine: Number(result[0]) || 1,
      startColumn: Number(result[1]) || 1,
      endLine: Number(result[2]) || 1,
      endColumn: Number(result[3]) || 1,
    }
  } catch {
    return null
  }
}
