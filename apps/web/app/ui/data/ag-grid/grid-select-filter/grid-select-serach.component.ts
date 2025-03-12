import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { IconsModule } from '~/ui/icons'
import { svgMagnifyingGlass, svgXmark } from '~/ui/icons/svg'
import { GridSelectFilterStore } from './grid-select-filter.store'

@Component({
  selector: 'nwb-grid-select-search',
  template: `
    <input
      class="input input-sm w-full focus:outline-none focus:border focus:border-primary"
      [class.text-primary]="!!value"
      #input
      type="text"
      placeholder="search"
      [(ngModel)]="value"
    />
    <button
      class="absolute right-0 btn btn-sm btn-ghost btn-square swap swap-rotate"
      [class.swap-active]="!!value"
      [class.text-primary]="!!value"
      (click)="value = ''"
    >
      <nwb-icon [icon]="svgXmark" class="swap-on w-4 h-4" />
      <nwb-icon [icon]="svgSearch" class="swap-off w-4 h-4 md:hidden" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule],
  host: {
    class: 'block relative',
  },
})
export class GridSelectSearchComponent {
  private store = inject(GridSelectFilterStore)
  protected svgSearch = svgMagnifyingGlass
  protected svgXmark = svgXmark

  protected get value() {
    return this.store.search()
  }

  protected set value(value: string) {
    patchState(this.store, { search: value })
  }
}
