import { Overlay } from '@angular/cdk/overlay'
import { Component, effect, ElementRef, HostListener, inject, input, untracked, viewChild } from '@angular/core'
import { GameViewerToolbarComponent } from './game-viewer-toolbar.component'
import { GameViewerService } from './game-viewer.service'
import { NwViewer } from './nw-viewer'
import { CharacterActionTrackbarComponent } from './character-action-trackbar.component'

@Component({
  selector: 'nw-game-viewer',
  template: `
    <div class="absolute top-0 right-0 p-2">
      <nw-game-viewer-toolbar #toolbar />
    </div>
    <div class="flex flex-col items-center absolute bottom-0 left-0 right-0 p-2 pointer-events-none">
      @if (service.character(); as character) {
        <nwb-character-action-trackbar [character]="character" class="w-full max-w-[800px] pointer-events-auto"/>
      }
    </div>
    <canvas #canvas class="w-full h-full"></canvas>
    <div class="absolute top-0 right-0 bottom-0 left-0 pointer-events-none">
    </div>
  `,
  host: {
    class: 'relative',
  },
  providers: [GameViewerService, Overlay],
  imports: [GameViewerToolbarComponent, CharacterActionTrackbarComponent],
})
export class GameViewerComponent {
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  public readonly service = inject(GameViewerService)
  public readonly canvas = viewChild<string, ElementRef<HTMLCanvasElement>>('canvas', { read: ElementRef })
  public readonly groundFeature = input<boolean>(false)

  public constructor() {
    effect(() => {
      const canvas = this.canvas().nativeElement
      untracked(() => {
        this.service.setViewer(new NwViewer(canvas), this.elRef)
      })
    })
  }

  @HostListener('wheel', ['$event'])
  protected onWheel(event: WheelEvent) {
    if (event.target === this.canvas().nativeElement) {
      event.preventDefault()
      event.stopPropagation()
    }
  }
}
