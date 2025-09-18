import { Directive, ElementRef, OnInit, inject, input } from '@angular/core'
import { injectDocument } from '~/utils/injection/document'
import { PlatformService } from '~/utils/services/platform.service'

@Directive({
  standalone: true,
  selector: 'ion-content',
})
export class IonContentDirective implements OnInit {
  public gutterStable = input(false)
  private elRef = inject(ElementRef)
  private platform = inject(PlatformService)
  private document = injectDocument()
  public ngOnInit() {
    if (this.platform.isDesktop && this.platform.isBrowser) {
      this.installScrollbarPatch()
    }
  }
  private installScrollbarPatch() {
    const scrollbarStyle = [
      `
      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      ::-webkit-scrollbar-track {
        background-color: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background-color: rgba(155, 155, 155, 0.5);
        border-radius: 20px;
        border: 4px solid transparent;
        background-clip: content-box;
      }
      ::-webkit-scrollbar-thumb:hover {
        background-color: rgba(155, 155, 155, 0.75);
      }

      ::-webkit-scrollbar-corner {
        background: transparent;
      }
    `,
    ]
    if (this.gutterStable()) {
      scrollbarStyle.push(`
        .inner-scroll.scroll-y {
          scrollbar-gutter: stable;
        }
      `)
    }
    const styles = this.document.createElement('style')
    styles.textContent = scrollbarStyle.join('\n')
    this.elRef.nativeElement.shadowRoot.appendChild(styles)
  }
}
