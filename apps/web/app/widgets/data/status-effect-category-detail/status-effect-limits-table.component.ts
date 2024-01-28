import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { firstValueFrom, map } from 'rxjs'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { StatusEffectCategoryDetailStore } from './status-effect-category.store'
import { extractLimits } from './utils'

@Component({
  standalone: true,
  selector: 'nwb-status-effect-limits-table',
  template: `
    <ng-container *ngIf="store.limitsTable$ | async; let table">
      <table class="table table-compact">
        <tr>
          <th>Limits Table</th>
          <th *ngFor="let col of table.cols">
            <span class="text-secondary">{{ col }}</span>
          </th>
        </tr>
        <tr *ngFor="let row of table.rows">
          <th [class.text-primary]="row === propId">{{ row }}</th>
          <th *ngFor="let col of table.cols" class="text-center" [class.text-primary]="col === catId || row === propId">
            <pre>{{ table.data[row][col] | number: '0.0' }}</pre>
          </th>
        </tr>
      </table>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block',
  },
  providers: [StatusEffectCategoryDetailStore],
})
export class StatusEffectLimitsTableComponent {
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
  public constructor(protected db: NwDataService, protected store: StatusEffectCategoryDetailStore) {
    //
  }

  private loadById(id: string) {
    this.store.patchState({ categoryId: id })
  }

  private async loadByPropId(id: string) {
    const category = await firstValueFrom(
      this.db.statusEffectCategories.pipe(
        map((list) => {
          return list.find((it) => !!extractLimits(it.ValueLimits)?.[id])
        })
      )
    )
    this.store.patchState({ categoryId: category?.StatusEffectCategoryID })
  }
}
