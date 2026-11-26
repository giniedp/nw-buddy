import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { IonContent, IonFooter, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone'
import { saveAs } from 'file-saver'
import { IconsModule } from '~/ui/icons'
import { svgCubes, svgDownload, svgFolderOpen, svgRotate } from '~/ui/icons/svg'
import { ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { DesktopService } from '~/desktop'
import { environment } from '../../../environments'
import { viewerLibUrl } from '../nw-viewer'
import { NwbtService } from '../nwbt-setup'
import {
  ComposeRequest,
  fetchNwbtGlb,
  hasModelFile,
  ModelFiles,
  SocketPlacement,
  zipModelFiles,
} from './model-download'

type ViewerLib = typeof import('@nw-buddy/viewer')

export interface ModelDownloadDialogInputs {
  /**
   * The files the view loads, null until known
   */
  files: ModelFiles | null
  /**
   * The request of the nwbt export, built for the export only. Null without game files
   */
  compose: (() => Promise<ComposeRequest>) | null
  /**
   * The game file for the Pak Browser, null offers none
   */
  gameFile: string | null
  /**
   * What the files of this site lack, shown with their download
   */
  filesNote?: string
  /**
   * File name without extension
   */
  name: string
}

/**
 * The downloads of a model: the files the view loads (a GLB and its textures as a zip), the quality GLB built by nwbt,
 * the game file in the Pak Browser
 */
@Component({
  selector: 'nwb-model-download-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonFooter, IonHeader, IonTitle, IonToolbar, IconsModule, RouterLink],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
  template: `
    <ion-header>
      <ion-toolbar class="ion-color ion-color-black rounded-t-md">
        <ion-title>Download</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-p-4">
      <div class="flex flex-col gap-3">
        <div class="flex gap-4 rounded-box border border-base-300 bg-base-100 p-4">
          <div class="flex flex-col gap-1 min-w-0 flex-1">
            <b>Model from this site</b>
            <span class="text-sm opacity-70">
              The files this page shows, as a zip with a GLB: textures are heavily compressed for the web (KTX2).
              {{ filesNote() }}
            </span>
          </div>
          <button
            class="btn btn-primary btn-sm self-center"
            [disabled]="!webAvailable() || busy()"
            [title]="webAvailable() === false ? 'Not available' : ''"
            (click)="downloadWeb()"
          >
            @if (busy() === 'web') {
              <span class="loading loading-spinner size-4"></span>
            } @else {
              <nwb-icon [icon]="iconDownload" class="size-4" />
            }
            Zip
          </button>
        </div>
        @if (compose()) {
          @if (nwbtUp()) {
            <div class="flex gap-4 rounded-box border border-base-300 bg-base-100 p-4">
              <div class="flex flex-col gap-1 min-w-0 flex-1">
                <b>Model from game files</b>
                <span class="text-sm opacity-70">
                  Built by nwbt from the game files of your New World installation: full textures (DDS).
                </span>
              </div>
              <button class="btn btn-sm self-center" [disabled]="busy()" (click)="downloadQuality()">
                @if (busy() === 'quality') {
                  <span class="loading loading-spinner size-4"></span>
                } @else {
                  <nwb-icon [icon]="iconDownload" class="size-4" />
                }
                GLB
              </button>
            </div>
            @if (gameFile(); as file) {
              <div class="flex gap-4 rounded-box border border-base-300 bg-base-100 p-4">
                <div class="flex flex-col gap-1 min-w-0 flex-1">
                  <b>Game file</b>
                  <span class="text-sm opacity-70 break-all">{{ file }}</span>
                </div>
                <a
                  class="btn btn-sm self-center"
                  routerLink="/pak/browser"
                  [queryParams]="{ file: file }"
                  (click)="close()"
                >
                  <nwb-icon [icon]="iconBrowse" class="size-4" />
                  Pak Browser
                </a>
              </div>
            }
          } @else if (nwbtChecking()) {
            <div class="flex items-center gap-2 p-4 text-sm opacity-70">
              <span class="loading loading-spinner size-4"></span>
              Connecting to the New World Buddy tools
            </div>
          } @else {
            <div class="flex gap-4 rounded-box border border-base-300 bg-base-200 p-4">
              <div class="flex flex-col gap-1 min-w-0 flex-1">
                <b>More download options</b>
                <span class="text-sm opacity-70">
                  To enable more download options, run the New World Buddy tools on this computer.
                </span>
              </div>
              <div class="flex flex-col gap-2 self-center">
                <a class="btn btn-sm" routerLink="/pak" (click)="close()">
                  <nwb-icon [icon]="iconTools" class="size-4" />
                  See how
                </a>
                <button class="btn btn-sm" (click)="checkNwbt()">
                  <nwb-icon [icon]="iconCheck" class="size-4" />
                  Check
                </button>
              </div>
            </div>
          }
        }
      </div>
    </ion-content>
    <ion-footer class="rounded-b-md">
      <ion-toolbar class="ion-color ion-color-base-300">
        <div slot="end" class="flex items-center gap-2 px-2">
          <button class="btn btn-ghost" (click)="close()">Close</button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
})
export class ModelDownloadDialogComponent {
  public static open(
    modal: ModalService,
    inputs: ModelDownloadDialogInputs,
    options: ModalOpenOptions<ModelDownloadDialogComponent> = {},
  ) {
    options.size ??= ['y-auto', 'x-md']
    options.content = ModelDownloadDialogComponent
    options.inputs = inputs
    return modal.open<ModelDownloadDialogComponent, void>(options)
  }

  public readonly files = input<ModelDownloadDialogInputs['files']>(null)
  public readonly compose = input<ModelDownloadDialogInputs['compose']>(null)
  public readonly gameFile = input<ModelDownloadDialogInputs['gameFile']>(null)
  public readonly filesNote = input<string>('')
  public readonly name = input<string>('model')

  private dialog = inject<ModalRef<void>>(ModalRef, { optional: true })
  private modal = inject(ModalService)

  protected iconDownload = svgDownload
  protected iconTools = svgCubes
  protected iconBrowse = svgFolderOpen
  protected iconCheck = svgRotate
  private nwbt = inject(NwbtService)
  /**
   * Whether nwbt answered a check, null while asking or without a check: the dialog asks only in the desktop app,
   * where nwbt runs on the page's origin. Elsewhere a request to localhost makes the browser ask for permission
   */
  protected nwbtUp = this.nwbt.available
  protected nwbtChecking = this.nwbt.checking
  /**
   * Whether the models server has the GLB, null while asking
   */
  protected webAvailable = signal<boolean | null>(null)
  protected busy = signal<'quality' | 'web' | null>(null)

  public constructor() {
    if (inject(DesktopService).isDesktop) {
      this.nwbt.check()
    }
    effect(() => {
      const url = this.files()?.model.url
      this.webAvailable.set(null)
      if (url) {
        hasModelFile(url).then((it) => this.webAvailable.set(it))
      }
    })
  }

  protected checkNwbt() {
    this.nwbt.check()
  }

  protected async downloadQuality() {
    const compose = this.compose()
    if (!compose) {
      return
    }
    await this.run('quality', async () => {
      saveAs(await fetchNwbtGlb(environment.nwbtUrl, await compose()), `${this.name()}.glb`)
    })
  }

  protected async downloadWeb() {
    const files = this.files()
    if (!files) {
      return
    }
    await this.run('web', async () => {
      const lib: ViewerLib = await import(/* @vite-ignore */ viewerLibUrl('nw-viewer.module.js'))
      const placement: SocketPlacement = (gltf, name, offset) => {
        return lib.socketPlacement(gltf as Parameters<ViewerLib['socketPlacement']>[0], name, offset)
      }
      saveAs(await zipModelFiles(files, this.name(), placement), `${this.name()}.zip`)
    })
  }

  protected close() {
    this.dialog?.close()
  }

  private async run(kind: 'quality' | 'web', task: () => Promise<void>) {
    if (this.busy()) {
      return
    }
    this.busy.set(kind)
    try {
      await task()
    } catch (err) {
      console.error('download failed', String(err))
      this.modal.showToast({ message: 'Download failed', color: 'danger', duration: 3000, position: 'bottom' })
    } finally {
      this.busy.set(null)
    }
  }
}
