import { Component, ElementRef, inject } from '@angular/core'
import { Subject } from 'rxjs'

@Component({
  standalone: true,
  selector: 'nwb-split-gutter',
  template: `
    <button class="btn btn-sm btn-ghost btn-square cursor-grab" (mousedown)="start.next($event)">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" class="w-5 h-5">
        <path
          fill="currentColor"
          d="M64 128a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm0 160a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM96 416a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96-288a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm32 128a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM192 448a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"
        />
      </svg>
    </button>
  `,
  host: {
    class: 'divider divider-horizontal w-0 m-0 z-10',
  },
  exportAs: 'gutter',
})
export class SplitGutterComponent {
  public elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  public start = new Subject<MouseEvent>()
}
