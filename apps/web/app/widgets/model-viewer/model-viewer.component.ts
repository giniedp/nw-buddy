import type { AbstractViewer } from 'babylonjs-viewer'
import { Dialog, DialogConfig, DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  NgZone,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  OnInit,
  Optional,
  Output,
} from '@angular/core'
import { NwModule } from '~/nw'
import { ItemModelInfo } from './model-viewer.service'
import { IconsModule } from '~/ui/icons'
import { svgExpand, svgXmark } from '~/ui/icons/svg'
import { Subject } from 'rxjs'

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

  @Input()
  public set models(value: ItemModelInfo[]) {
    this.data = value || []
    this.buttons = []
    if (this.data.length > 1) {
      this.buttons = this.data.map((it, i) => {
        return {
          index: i,
          label: it.label,
        }
      })
    }

    this.show(this.index)
  }

  @Output()
  public readonly close = new Subject<void>()

  protected index: number = 0
  protected buttons: Array<{ index: number, label: string }> = []
  protected isLoaded = false
  protected isModal = false

  protected iconClose = svgXmark
  protected iconFullscreen = svgExpand

  private viewer: AbstractViewer

  public constructor(
    @Optional()
    private ref: DialogRef,
    @Inject(DIALOG_DATA)
    @Optional()
    private data: ItemModelInfo[],
    private elRef: ElementRef<HTMLElement>,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.isModal = !!ref
    this.models = data
  }

  public async ngOnInit() {
    const { DefaultViewer } = await loadBabylon()
    this.zone.runOutsideAngular(() => {
      this.viewer = new DefaultViewer(this.elRef.nativeElement, {
        model: {
          rotationOffsetAngle: 0,
          url: this.data[0]?.url,
        },
        engine: {
          antialiasing: true
        },
        camera: {
          fov: 1
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
    this.index = Math.max(Math.min(index, this.data.length - 1), 0)
    if (this.viewer) {
      this.viewer.loadModel(this.data[index]?.url)
    }
  }

  protected toggleFullscreen () {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      this.elRef.nativeElement.requestFullscreen()
    }
  }

  protected onClose() {
    this.ref?.close()
    this.close.next()
  }
}
