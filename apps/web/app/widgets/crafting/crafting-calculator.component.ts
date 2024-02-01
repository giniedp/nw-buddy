import { LayoutModule } from '@angular/cdk/layout'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Crafting } from '@nw-data/generated'
import { combineLatest } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDollarSign, svgGears, svgPercent } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { PriceImporterModule } from '../price-importer/price-importer.module'
import { CraftingCalculatorStore } from './crafting-calculator.store'
import { CraftingChanceMenuComponent } from './crafting-chance-menu'
import { CraftingStepComponent } from './crafting-step'
import { CraftingSummaryComponent } from './crafting-summary'
import { AmountMode } from './types'
import { CdkMenuModule } from '@angular/cdk/menu'

@Component({
  standalone: true,
  selector: 'nwb-crafting-calculator',
  templateUrl: './crafting-calculator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    IconsModule,
    FormsModule,
    PriceImporterModule,
    TooltipModule,
    LayoutModule,
    CraftingStepComponent,
    OverlayModule,
    CraftingChanceMenuComponent,
    CraftingSummaryComponent,
    CdkMenuModule,
  ],
  providers: [CraftingCalculatorStore],
  host: {
    class: 'block',
  },
})
export class CraftingCalculatorComponent implements OnInit {
  @Input()
  public set amount(value: number) {
    this.store.patchState({ amount: value })
  }

  @Input()
  public set amountMode(value: AmountMode) {
    this.store.patchState({ amountMode: value })
  }

  @Input()
  public set recipe(value: Crafting) {
    this.store.patchState({
      recipeId: value?.RecipeID,
    })
  }

  @Input()
  public set recipeId(value: string) {
    this.store.patchState({
      recipeId: value,
    })
  }

  protected iconImporter = svgDollarSign
  protected iconMode = svgPercent
  protected iconOptions = svgGears
  protected isToolOpen = false

  protected vm$ = combineLatest({
    recipe: this.store.recipe$,
    amount: this.store.amount$,
    amountMode: this.store.amountMode$,
    tree: this.store.tree$,
  })

  public constructor(private store: CraftingCalculatorStore) {}

  public ngOnInit(): void {
    this.store.load()
  }

  protected toggleQuantityMode() {
    this.store.toggleQuantityMode()
  }
}
