import { AbstractViewer, DefaultViewer } from 'babylonjs-viewer'
import { Dialog, DialogConfig, DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { NwModule } from '~/nw'
import { ItemModelInfo } from './model-viewer.service'

@Component({
  standalone: true,
  selector: 'nwb-model-viewer',
  templateUrl: './model-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule],
  host: {
    class: 'layout-col bg-base-300',
  },
  schemas: [NO_ERRORS_SCHEMA],
})
export class ModelViewerComponent implements OnInit, OnDestroy {
  public static open(dialog: Dialog, options: DialogConfig<ItemModelInfo[]>) {
    return dialog.open(ModelViewerComponent, options)
  }

  private viewer: AbstractViewer
  public constructor(
    private ref: DialogRef,
    @Inject(DIALOG_DATA)
    private data: ItemModelInfo[],
    private elRef: ElementRef<HTMLElement>
  ) {
    //
  }

  public ngOnInit(): void {
    const url = this.data[0].url
    this.viewer = new DefaultViewer(this.elRef.nativeElement, {
      model: {
        url: url,
        rotationOffsetAngle: 0,
      },
      // templates: {
      //   main: {
      //     html: '<canvas></canvas>'
      //   }
      // }
    })
  }

  public ngOnDestroy(): void {
    this.viewer.dispose()
  }
}
