import { ChangeDetectionStrategy, Component, ElementRef, OnInit, Renderer2, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { injectIsBrowser } from './utils/injection/platform'

@Component({
  selector: 'nw-buddy-frame',
  template: `<router-outlet />`,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ion-page',
  },
})
export class AppFrameComponent implements OnInit {
  private elRef = inject(ElementRef)
  private renderer = inject(Renderer2)
  private isServer = !injectIsBrowser()

  public ngOnInit() {
    if (this.isServer) {
      // Hide the app frame on the server
      // Ionic uses components that can not be fully prerendered which looks bad
      this.renderer.setStyle(this.elRef.nativeElement, 'display', 'none')
    } else {
      this.renderer.removeStyle(this.elRef.nativeElement, 'display')
    }
  }
}
