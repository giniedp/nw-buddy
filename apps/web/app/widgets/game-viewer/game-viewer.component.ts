import { Overlay } from '@angular/cdk/overlay'
import { Component, effect, ElementRef, HostListener, inject, untracked, viewChild } from '@angular/core'
import { CharacterActionBrowserComponent } from './character-action-browser.component'
import { CharacterActionTrackbarComponent } from './character-action-trackbar.component'
import { GameViewerToolbarComponent } from './game-viewer-toolbar.component'
import { GameViewerService } from './game-viewer.service'

@Component({
  selector: 'nwb-game-viewer',
  template: `
    <div class="flex-1 relative h-full w-full">
      @if (!service.isEmpty()) {
        <div class="absolute top-0 right-0 p-2">
          <nwb-game-viewer-toolbar #toolbar />
          <ng-content select="[slot='toolbar']" />
        </div>
        <div class="flex flex-col items-center absolute bottom-0 left-0 right-0 p-2 pointer-events-none">
          <nwb-character-action-trackbar class="w-full max-w-[800px] pointer-events-auto" />
        </div>
        @if (service.showTagBrowser()) {
          <nwb-character-action-browser
            class="absolute top-10 right-2 h-1/2 bg-base-300 bg-opacity-80 border border-base-200 w-full max-w-md"
            [actions]="service.adbActions()"
            [tags]="service.adbTags()"
            (fragmentClicked)="service.adbPlayer()?.executeFragment($event)"
          />
        }
      }
      <canvas #canvas class="w-full h-full"></canvas>
      <div class="absolute inset-0 pointer-events-none"></div>
    </div>
    <div id="inspector" class="flex-none empty:hidden"></div>
    @if (service.isLoading()) {
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span class="loading loading-spinner"></span>
      </div>
    } @else if (service.hasError()) {
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span>Error</span>
      </div>
    } @else if (service.isEmpty()) {
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span>no data</span>
      </div>
    } @else {
      <ng-content />
    }
  `,
  host: {
    class: 'relative flex flex-row',
  },
  providers: [GameViewerService, Overlay],
  imports: [GameViewerToolbarComponent, CharacterActionTrackbarComponent, CharacterActionBrowserComponent],
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

  public readonly service = inject(GameViewerService)
  public readonly canvas = viewChild<string, ElementRef<HTMLCanvasElement>>('canvas', { read: ElementRef })

  public constructor() {
    effect(() => {
      const canvas = this.canvas().nativeElement
      untracked(() => this.service.create(this.elRef, canvas))
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
