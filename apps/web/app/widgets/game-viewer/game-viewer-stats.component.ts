import { Component, effect, ElementRef, Host, HostListener, inject } from '@angular/core'
import { GameViewerService } from './game-viewer.service'

@Component({
  selector: 'nwb-game-viewer-stats',
  template: ``,
  host: {
    class: 'flex flex-col empty:hidden',
  },
})
export class GameViewerStatsComponent {
  private service = inject(GameViewerService)
  private bridge = this.service.bridge
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)

  constructor() {
    effect(() => {
      const panels = this.bridge()?.statsPanel?.panels
      if (panels?.length) {
        for (const panel of panels) {
          this.elRef.nativeElement.append(panel.canvas)
        }
      }
    })
  }

  @HostListener('click')
  public onClick() {
    const panels = this.bridge()?.statsPanel?.panels
    if (panels?.length) {
      for (const panel of panels) {
        panel.reset()
      }
    }
  }
}
