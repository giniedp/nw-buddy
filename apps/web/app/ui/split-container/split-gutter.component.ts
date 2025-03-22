import { Component, ElementRef, inject } from '@angular/core'
import { Subject } from 'rxjs'
import { IconsModule } from '../icons'
import { svgGripDotsVertical } from '../icons/svg'

@Component({
  selector: 'nwb-split-gutter',
  template: `
    <button class="btn btn-sm btn-ghost btn-square cursor-grab" (mousedown)="start.next($event)">
      <nwb-icon [icon]="icon" class="w-5 h-5"/>
    </button>
  `,
  host: {
    class: 'divider divider-horizontal w-0 m-0 z-10',
  },
  exportAs: 'gutter',
  imports: [IconsModule]
})
export class SplitGutterComponent {
  public elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  public start = new Subject<MouseEvent>()
  protected icon = svgGripDotsVertical
}
