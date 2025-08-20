import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject, input } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { TreeNodeToggleComponent } from '~/ui/tree'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { CraftingStep } from '../loader/load-recipe'
import { AmountMode } from '../types'
import { CraftingStepStore } from './crafting-step.store'
import { IngredientPickerComponent } from './ingredient-picker.component'

@Component({
  selector: 'nwb-crafting-step',
  templateUrl: './crafting-step.component.html',
  styleUrls: ['./crafting-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    ItemTrackerModule,
    CdkMenuModule,
    ItemDetailModule,
    TooltipModule,
    ItemFrameModule,
    RouterModule,
    TreeNodeToggleComponent,
    IngredientPickerComponent,
  ],
  providers: [CraftingStepStore],
})
export class CraftingStepComponent {
  protected store = inject(CraftingStepStore)
  public bordered = input<boolean>(false)

  @Input()
  public set step(value: CraftingStep) {
    this.store.patchState({ step: value })
  }

  @Input()
  public set amount(value: number) {
    this.store.patchState({ amount: value })
  }

  @Input()
  public set amountMode(value: AmountMode) {
    this.store.patchState({ amountMode: value })
  }

  public totalCraft = outputFromObservable(toObservable(this.store.amountGross))

  protected setExpand(value: boolean) {
    this.store.setExpand(value)
  }

  protected setSelection(value: string) {
    this.store.setSelection(value)
  }
}
