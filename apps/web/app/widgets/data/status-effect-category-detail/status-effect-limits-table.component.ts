import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { firstValueFrom, map } from 'rxjs'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { StatusEffectCategoryDetailStore } from './status-effect-category.store'
import { extractLimits } from './utils'

@Component({
  standalone: true,
  selector: 'nwb-status-effect-limits-table',
  template: `
    @if (store.table(); as table) {
      <table class="table table-xs">
        <tr>
          <th>Limits Table</th>
          @for (col of table.cols; track $index) {
            <th>
              <span class="text-secondary">{{ col }}</span>
            </th>
          }
        </tr>
        @for (row of table.rows; track $index) {
          <tr>
            <th [class.text-primary]="row === propId">{{ row }}</th>
            @for (col of table.cols; track $index) {
              <th class="text-center" [class.text-primary]="col === catId || row === propId">
                <pre>{{ table.data[row][col] > 0 ? '+' : '' }}{{ table.data[row][col] | number: '0.0' }}</pre>
              </th>
            }
          </tr>
        }
      </table>
      <ng-content/>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block',
  },
  providers: [StatusEffectCategoryDetailStore],
})
export class StatusEffectLimitsTableComponent {
  protected db = inject(NwDataService)
  protected store = inject(StatusEffectCategoryDetailStore)

  @Input()
  public set categoryId(value: string) {
    this.catId = value
    this.loadById(value)
  }

  @Input()
  public set property(value: string) {
    this.propId = value
    this.loadByPropId(value)
  }

  protected catId: string
  protected propId: string

  private loadById(id: string) {
    patchState(this.store, { categoryId: id })
  }

  private async loadByPropId(id: string) {
    const category = await firstValueFrom(
      this.db.statusEffectCategories.pipe(
        map((list) => {
          return list.find((it) => !!extractLimits(it.ValueLimits)?.[id])
        }),
      ),
    )
    patchState(this.store, { categoryId: category?.StatusEffectCategoryID })
  }
}
