import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import type { ViewerOutputInfo } from '@nw-buddy/viewer'
import { ViewerOutputService } from './viewer-output.service'

/**
 * The list of debug outputs of a 3D view, see {@link ViewerOutputService}. It sits inside the view, a CDK overlay would
 * not show while the view is fullscreen.
 */
@Component({
  selector: 'nwb-viewer-output',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block pointer-events-none',
  },
  template: `
    <ul
      class="menu menu-sm flex-nowrap w-full max-h-full overflow-y-auto pointer-events-auto bg-base-300/80 border border-base-200 rounded-md shadow-md"
    >
      @for (group of groups(); track group.name) {
        <li class="menu-title">{{ group.name }}</li>
        @for (item of group.items; track item.id) {
          <li>
            <a [class.text-primary]="item.id === service.output()" (click)="service.select(item.id)">
              {{ item.label }}
            </a>
          </li>
        }
      }
    </ul>
  `,
})
export class ViewerOutputComponent {
  /**
   * The outputs of the viewer lib (`VIEWER_OUTPUTS`)
   */
  public readonly outputs = input.required<readonly ViewerOutputInfo[]>()

  protected service = inject(ViewerOutputService)
  protected groups = computed(() => {
    const names = [...new Set(this.outputs().map((it) => it.group))]
    return names.map((name) => {
      return { name, items: this.outputs().filter((it) => it.group === name) }
    })
  })
}
