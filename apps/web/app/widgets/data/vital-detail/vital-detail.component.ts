import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { GsInputComponent } from '~/ui/gs-input'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { VitalDetailStore } from './vital-detail.store'
import { VitalDetailHeaderComponent } from './vital-detail-header.component'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail',
  templateUrl: './vital-detail.component.html',
  exportAs: 'vitalDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    VitalDetailHeaderComponent
  ],
  providers: [VitalDetailStore],
  host: {
    class: 'flex flex-col rounded-md overflow-clip',
  },
})
export class VitalDetailComponent {
  public readonly store = inject(VitalDetailStore)

  @Input({ required: true })
  public set vitalId(value: string) {
    this.store.patchState({ vitalId: value })
  }

  @Input()
  public set level(value: number) {
    this.store.patchState({ level: value })
  }

  @Input()
  public set mutaElement(value: string) {
    this.store.patchState({ mutaElementId: value })
  }

  @Input()
  public set mutaDifficulty(value: number) {
    this.store.patchState({ mutaDifficulty: value })
  }
}
