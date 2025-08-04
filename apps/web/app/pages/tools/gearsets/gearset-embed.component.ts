import { Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { GearsetStore } from '../../../data'
import { Mannequin } from '../../../nw/mannequin'
import { injectRouteParam } from '../../../utils'
import { EmbedHeightDirective } from '../../../utils/directives'
import { GearsetGridComponent } from './gearset/gearset-grid.component'

@Component({
  selector: 'nwb-gearset-embed',
  template: ` <nwb-gearset-grid /> `,
  imports: [GearsetGridComponent],
  providers: [GearsetStore, Mannequin],
  hostDirectives: [EmbedHeightDirective],
  host: {
    class: 'block min-h-80 p-4',
  },
})
export class GearsetEmbedComponent {
  private store = inject(GearsetStore)
  private mannequin = inject(Mannequin)
  protected userId = toSignal(injectRouteParam('userid'))
  protected id = toSignal(injectRouteParam('id'))
  public constructor() {
    this.store.connectGearsetId(
      computed(() => {
        return {
          userId: this.userId(),
          id: this.id(),
        }
      }),
    )
    this.store.connectToMannequin(this.mannequin)
  }
}
