import type { AbstractViewer } from 'babylonjs-viewer'
import { Dialog, DialogConfig, DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  NgZone,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { NwModule } from '~/nw'
import { ItemModelInfo } from './model-viewer.service'
import { IconsModule } from '~/ui/icons'
import { svgXmark } from '~/ui/icons/svg'

async function loadBabylon() {
  return import('babylonjs-viewer')
}
@Component({
  standalone: true,
  selector: 'nwb-model-viewer',
  templateUrl: './model-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule, IconsModule],
  host: {
    class: 'layout-col bg-base-300 relative',
  },
  schemas: [NO_ERRORS_SCHEMA],
})
export class ModelViewerComponent implements OnInit, OnDestroy {
  public static open(dialog: Dialog, options: DialogConfig<ItemModelInfo[]>) {
    return dialog.open(ModelViewerComponent, options)
  }

  protected index: number = 0
  protected buttons: Array<{ index: number, label: string }> = []
  protected isLoaded = false

  protected iconClose = svgXmark

  private viewer: AbstractViewer
  public constructor(
    private ref: DialogRef,
    @Inject(DIALOG_DATA)
    private data: ItemModelInfo[],
    private elRef: ElementRef<HTMLElement>,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.data.forEach((it, i) => {
      this.buttons.push({
        index: i,
        label: it.isFemale ? 'Female' : it.isMale ? 'Male' : 'Model'
      })
    })
    if (this.buttons.length === 1) {
      this.buttons.length = 0
    }
  }

  public async ngOnInit() {
    const { DefaultViewer } = await loadBabylon()
    this.zone.runOutsideAngular(() => {
      this.viewer = new DefaultViewer(this.elRef.nativeElement, {
        model: {
          rotationOffsetAngle: 0,
          url: this.data[0]?.url,
        },
        templates: {
          navBar: {
            html: '<div></div>'
          }
        } as any,
      })

      this.viewer.onModelLoadedObservable.add((model) => {
        this.zone.run(() => {
          this.isLoaded = true
          this.cdRef.markForCheck()
        })
      })
    })
  }

  public ngOnDestroy(): void {
    this.viewer.dispose()
  }

  protected show(index: number) {
    this.index = index
    this.viewer.loadModel(this.data[index]?.url)
  }

  protected close() {
    this.ref.close()
  }
}
