import { Directive, ElementRef, OnInit, inject } from '@angular/core'
import { Platform } from '@ionic/angular/standalone'

@Directive({
  standalone: true,
  selector: 'ion-content',
})
export class IonContentDirective implements OnInit {
  private elRef = inject(ElementRef)
  private platform = inject(Platform)
  public ngOnInit() {
    if (this.platform.is('desktop')) {
      this.installScrollbarPatch()
    }
  }
  private installScrollbarPatch() {
    const scrollbarStyle = `
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
    `
    const styles = document.createElement('style')
    styles.textContent = scrollbarStyle
    this.elRef.nativeElement.shadowRoot.appendChild(styles)
  }
}
