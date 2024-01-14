import { animate, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-collapsible',
  templateUrl: './collapsible.component.html',
  imports: [CommonModule],
  exportAs: 'collapsible',
  animations: [
    trigger('collapse', [
      state('true', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('false', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition('true <=> false', [animate('0.3s ease')]),
    ]),
  ],
  host: {
    class: 'block',
  },
})
export class CollapsibleComponent {
  @Input()
  public collapsed = false

  @Input()
  public paneClass = ''

  public toggle() {
    this.collapsed = !this.collapsed
  }

  public expand() {
    this.collapsed = false
  }

  public collapse() {
    this.collapsed = true
  }
}
