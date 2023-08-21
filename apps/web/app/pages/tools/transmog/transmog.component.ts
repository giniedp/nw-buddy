import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { TransmogAppearance, TransmogService } from './transmog.service'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { observeRouteParam } from '~/utils'
import { PaginationModule } from '~/ui/pagination'
import { ItemFrameModule } from '~/ui/item-frame'
import { IconsModule } from '~/ui/icons'
import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { Itemappearancedefinitions, ItemdefinitionsWeaponappearances } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { QuicksearchService } from '~/ui/quicksearch'
import { combineLatest, debounceTime, map, startWith } from 'rxjs'

@Component({
  standalone: true,
  templateUrl: './transmog.component.html',
  styleUrls: ['./transmog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, PaginationModule, ItemFrameModule, IconsModule],
  host: {
    class: 'layout-row',
  },
  animations: [
    trigger('list', [
      transition('* => *', [
        query(':enter', stagger(1, animateChild()), {
          optional: true,
        }),
      ]),
    ]),
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-1rem)' }),
        animate('0.15s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class TransmogComponent {
  private readonly service = inject(TransmogService)
  private readonly search = inject(QuicksearchService)
  private readonly categoryId$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected readonly data$ = combineLatest({
    gender: this.service.select(({ genderFilter }) => genderFilter),
    sections: this.service.byCategory(this.categoryId$),
    search: this.search.query$.pipe(debounceTime(500), startWith(null)),
  }).pipe(
    map(({ gender, sections, search }) => {
      search = search?.trim()?.toLocaleLowerCase()
      if (search) {
        sections = sections.map(({ category, items }) => {
          return {
            category,
            items: items.filter((item) => {
              return item.name?.toLocaleLowerCase()?.includes(search) || item.id?.toLocaleLowerCase()?.includes(search)
            }),
          }
        })
      }
      if (gender) {
        sections = sections.map(({ category, items }) => {
          return {
            category,
            items: items.filter((it) => !it.gender || it.gender === gender),
          }
        })
      }
      return sections
    })
  )

  protected trackByIndex = (index: number) => index

  public constructor() {}

  protected getAppearanceId(item: TransmogAppearance) {
    return (item as Itemappearancedefinitions)?.ItemID || (item as ItemdefinitionsWeaponappearances)?.WeaponAppearanceID
  }
}
