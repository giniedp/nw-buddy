import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input, QueryList, ViewChildren } from '@angular/core'
import { combineLatest, map } from 'rxjs'
import { NwModule } from '~/nw'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { CraftingStepToggleComponent } from '../crafting-step-toggle'
import { CraftingStepStore } from './crafting-step.store'
import { FormsModule } from '@angular/forms'
import { CdkMenuModule } from '@angular/cdk/menu'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { TooltipModule } from '~/ui/tooltip'
import { selectStream, shareReplayRefCount, tapDebug } from '~/utils'
import { AmountMode, CraftingStep } from '../types'
import { animate, style, transition, trigger } from '@angular/animations'

@Component({
  standalone: true,
  selector: 'nwb-crafting-step',
  templateUrl: './crafting-step.component.html',
  styleUrls: ['./crafting-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    CraftingStepToggleComponent,
    ItemTrackerModule,
    CdkMenuModule,
    ItemDetailModule,
    TooltipModule,
  ],
  providers: [CraftingStepStore],
  animations: [
    trigger('expand', [
      transition(':enter', [
        style({
          height: 0,
          opacity: 0
        }),
        animate('0.15s ease-out', style({ height: '*' })),
        animate('0.15s ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        style({ height: '*', opacity: '*' }),
        animate('0.15s ease-out', style({ opacity: 0 })),
        animate('0.15s ease-out', style({ height: 0 })),
      ]),
    ]),
  ]
})
export class CraftingStepComponent {
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


  protected vm$ = selectStream({
    expand: this.store.expand$,
    amountMode: this.store.amountMode$,
    amountIsGross: this.store.amountIsGross$,
    amount: this.store.amount$,
    item: this.store.item$,
    currency: this.store.currency$,
    itemId: this.store.itemId$,
    category: this.store.category$,
    options: this.store.options$,
    children: this.store.children$,
    hasChildren: this.store.children$.pipe(map((it) => !!it?.length))
  }, (it) => it, {
    debounce: true
  })

  public trackByIndex = (i: number) => i

  public constructor(private store: CraftingStepStore) {
    //
  }

  protected setExpand(value: boolean) {
    this.store.setExpand(value)
  }

  protected setSelection(value: string) {
    this.store.selectOption(value)
  }
}
