import { Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDollarSign, svgGears, svgPercent } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { CraftingCalculatorStore } from './crafting-calculator.store'
import { CraftingChanceMenuComponent } from './crafting-chance-menu'
import { PriceImporterModule } from '../price-importer/price-importer.module'

@Component({
  standalone: true,
  selector: 'nwb-crafting-calculator-header',
  template: `
    <label class="join">
      <span class="join-item btn btn-sm text-xs">Amount</span>
      <input
        data-cy="amount"
        type="number"
        min="1"
        [ngModel]="store.amount()"
        (ngModelChange)="store.updateAmount($event)"
        class="join-item input input-bordered input-sm pr-0 w-20"
      />
    </label>
    <div class="flex-1"></div>
    <div class="flex flex-row gap-1 items-center">
      @if (skillLevel()) {
        <span class="badge badge-success" [tooltip]="skill()?.ID">
          <nwb-icon [icon]="skill()?.Icon" class="w-4 h-4 mr-1" />
          {{ skillLevel() }}
        </span>
      }
      @if (store.craftedGearScore()) {
        <span [tooltip]="tplGsBonusInfo" class="badge badge-secondary">
          <img [nwImage]="'assets/icons/item/icon_gearscore.png'" class="w-4 h-4" />
          {{ store.craftedGearScore() }}
        </span>
      }
      <div class="join">
        <button
          class="join-item btn btn-sm btn-ghost btn-square"
          [nwbModalOpen]="{ content: tplChances }"
          [tooltip]="'Edit crafting bonuses'"
        >
          <nwb-icon [icon]="iconOptions" class="w-4 h-4" />
        </button>

        <button
          class="join-item btn btn-sm btn-ghost btn-square"
          [tooltip]="'Toggle net/gross mode'"
          (click)="store.toggleQuantityMode()"
          [class.text-primary]="store.amountMode() === 'gross'"
        >
          <nwb-icon [icon]="iconMode" class="w-4 h-4" />
        </button>
        <nwb-price-importer-button
          class="join-item btn btn-sm btn-ghost btn-square"
          [tooltip]="'Open price importer'"
        />
      </div>
    </div>

    <ng-template #tplChances>
      <ion-header class="bg-base-300">
        <ion-toolbar>
          <ion-title>Crafting bonuses</ion-title>
          <button slot="end" class="btn btn-sm btn-circle btn-neutral mr-2" [nwbModalClose]>&times;</button>
        </ion-toolbar>
      </ion-header>
      <ion-content class="bg-base-200">
        <nwb-crafting-chance-menu />
      </ion-content>
    </ng-template>

    <ng-template #tplGsBonusInfo>
      @if (store.gearScoreDetails(); as info) {
        <table class="table table-xs">
          <tr>
            <td>Base GS</td>
            <td class="text-right">{{ info.base }}</td>
          </tr>
          @for (bonus of info.bonuses; track $index) {
            @if (bonus.max) {
              <tr [class.opacity-50]="!bonus.enabled || !!info.override">
                <td [class.line-through]="!bonus.enabled">{{ bonus.label | nwText }}</td>
                <td class="text-right" [class.line-through]="!bonus.enabled" [class.text-accent]="bonus.enabled">
                  +{{ bonus.max }}
                </td>
              </tr>
            }
          }
          @if (info.override) {
            <tr>
              <td>Override</td>
              <td class="text-right text-primary">{{ info.override }}</td>
            </tr>
          } @else if (info.maxCraftGs) {
            <tr [class.opacity-50]="info.finalMax < info.maxCraftGs">
              <td>Max Craft GS</td>
              <td class="text-right" [class.text-primary]="!(info.finalMax < info.maxCraftGs)">
                {{ info.maxCraftGs }}
              </td>
            </tr>
          }
          <tr class="text-primary">
            <th>Final GS</th>
            <th class="text-right">
              @if (info.uncappedMax > info.finalMax) {
                <span class="line-through text-error">{{ info.uncappedMax }}</span>
              }
              {{ info.finalMax }}
            </th>
          </tr>
        </table>
      }
    </ng-template>
  `,
  imports: [
    FormsModule,
    NwModule,
    TooltipModule,
    IconsModule,
    LayoutModule,
    CraftingChanceMenuComponent,
    PriceImporterModule,
  ],
  host: {
    class: 'flex flex-row items-center',
  },
})
export class CraftingCalculatorHeaderComponent {
  protected store = inject(CraftingCalculatorStore)
  protected skill = this.store.tradeskill
  protected skillLevel = computed(() => this.store.recipe()?.RecipeLevel)

  protected iconImporter = svgDollarSign
  protected iconMode = svgPercent
  protected iconOptions = svgGears
}
