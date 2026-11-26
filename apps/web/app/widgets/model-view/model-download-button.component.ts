import { CdkMenuModule } from '@angular/cdk/menu'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import type { ModelItemInfo } from '../model-viewer/model-viewer.service'
import { ModelDownloadService } from './model-download.service'

/**
 * Opens the downloads of a model without its 3D view. With several models (genders, variants) a menu asks which one.
 */
@Component({
  selector: 'nwb-model-download-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkMenuModule],
  host: {
    '[class.flex]': '!!available().length',
    '[class.hidden]': '!available().length',
  },
  template: `
    @if (available().length > 1) {
      <button class="btn btn-xs btn-outline btn-block btn-ghost rounded-md opacity-50" [cdkMenuTriggerFor]="tplModels">
        Download Model
      </button>
    } @else if (available()[0]; as model) {
      <button class="btn btn-xs btn-outline btn-block btn-ghost rounded-md opacity-50" (click)="service.open(model)">
        Download Model
      </button>
    }
    <ng-template #tplModels>
      <ul
        cdkMenu
        class="dropdown-content menu menu-compact flex-nowrap bg-base-300 border border-base-200 min-w-64 rounded-md max-h-96 shadow-md overflow-y-auto"
      >
        @for (model of available(); track $index) {
          <li>
            <a cdkMenuItem (cdkMenuItemTriggered)="service.open(model, { withLabel: true })">{{ model.label }}</a>
          </li>
        }
      </ul>
    </ng-template>
  `,
})
export class ModelDownloadButtonComponent {
  /**
   * The models of the 3D view
   */
  public readonly models = input<ModelItemInfo[] | null>()

  protected service = inject(ModelDownloadService)
  protected available = computed(() => (this.models() ?? []).filter((it) => !!it.url))
}
