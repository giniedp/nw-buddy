import { computed, Directive, input, untracked } from '@angular/core'
import { Pagination } from './pagination'

@Directive({
  standalone: true,
  selector: '[nwbInfniteScroll]',
  exportAs: 'infiniteScroll',
})
export class InfiniteScrollDirective<T> {
  public perPage = input(50, {
    alias: 'nwbInfniteScrollPerPage',
  })

  public items = input<T[]>([], {
    alias: 'nwbInfniteScroll',
  })

  public pagination = computed(() => {
    const items = this.items() || []
    const perPage = this.perPage()
    return untracked(() => {
      return Pagination.fromArray(items, {
        perPage: perPage,
        update: (state, page) => {
          const data = [...state.data, ...page.data]
          return {
            data: data,
            page: page.page,
            perPage: perPage,
            total: page.total,
            canLoad: data.length < items.length,
          }
        },
      })
    })
  })

  public state = computed(() => this.pagination().state())
  public data = computed(() => this.state()?.data)
  public canLoad = computed(() => this.state()?.canLoad ?? false)
  public count = computed(() => this.data()?.length || 0)
  public offset = computed(() => (this.state()?.page || 0) * (this.state()?.perPage || 0))
}
