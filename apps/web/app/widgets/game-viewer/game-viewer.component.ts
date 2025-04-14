import { Overlay } from '@angular/cdk/overlay'
import { Component, effect, ElementRef, HostListener, inject, input, untracked, viewChild } from '@angular/core'
import { CharacterActionTrackbarComponent } from './character-action-trackbar.component'
import { GameViewerToolbarComponent } from './game-viewer-toolbar.component'
import { GameSystemService } from './game-viewer.service'

@Component({
  selector: 'nwb-game-viewer',
  template: `
    <div class="flex-1 relative h-full w-full">
      <div class="absolute top-0 right-0 p-2">
        <nwb-game-viewer-toolbar #toolbar />
        <ng-content select="[slot='toolbar']"/>
      </div>
      <div class="flex flex-col items-center absolute bottom-0 left-0 right-0 p-2 pointer-events-none">
        <nwb-character-action-trackbar class="w-full max-w-[800px] pointer-events-auto" />
      </div>
      <canvas #canvas class="w-full h-full"></canvas>
      <div class="absolute top-0 right-0 bottom-0 left-0 pointer-events-none"></div>
    </div>
    <div id="inspector" class="flex-none empty:hidden"></div>
    <ng-content />
  `,
  host: {
    class: 'relative flex flex-row',
  },
  providers: [GameSystemService, Overlay],
  imports: [GameViewerToolbarComponent, CharacterActionTrackbarComponent],
  styles: [
    `
      div:has(+ #embed-host) {
        position: relative;
      }
    `,
  ],
})
export class GameViewerComponent {
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  public readonly service = inject(GameSystemService)
  public readonly canvas = viewChild<string, ElementRef<HTMLCanvasElement>>('canvas', { read: ElementRef })
  public readonly cameraMode = input<'orbit' | 'free'>('orbit')
  public readonly cameraPosition = input<{ x: number; y: number; z: number }>(null)

  public constructor() {
    effect(() => {
      const canvas = this.canvas().nativeElement
      untracked(() => this.service.create(this.elRef, canvas))
    })

    effect(() => {
      // const game = this.service.game()
      // if (!game) {
      //   return
      // }
      // const scene = game.system(SceneProvider).main
      // scene.camerac
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
