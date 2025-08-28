import { signal } from '@angular/core'
import { BehaviorSubject, defer, map, Observable, of, switchMap, take } from 'rxjs'

export interface PageResult<T> {
  page: number
  data: T[]
  total?: number
}

export interface PageSource<T> {
  fetch: (page: number) => Observable<PageResult<T>>
}

export interface PaginationState<T> {
  page: number
  data: T[]
  total?: number
  perPage: number
  canLoad: boolean
}

export interface PaginationOptions<T> {
  source: PageSource<T>
  perPage: number
  update?: (state: PaginationState<T>, page: PageResult<T>) => PaginationState<T>
}

function updateCommon<T>(state: PaginationState<T>, page: PageResult<T>): PaginationState<T> {
  return {
    ...state,
    ...page,
  }
}

export class Pagination<T> {
  public static fromArray<T>(data: T[], options: Omit<PaginationOptions<T>, 'source'>) {
    data ||= []
    return new Pagination<T>({
      update: options.update,
      perPage: options.perPage,
      source: {
        fetch: (page) => {
          return of<PageResult<T>>({
            page: page,
            data: data.slice(page * options.perPage, page * options.perPage + options.perPage),
            total: data.length,
          })
        },
      },
    })
  }

  public state = signal<PaginationState<T>>(null)

  private source: PageSource<T>
  private update: (state: PaginationState<T>, page: PageResult<T>) => PaginationState<T>

  public constructor({ source, perPage, update }: PaginationOptions<T>) {
    this.update = update || updateCommon
    this.source = source
    this.state.set({
      page: -1,
      perPage: perPage,
      data: [],
      canLoad: true,
    })
  }

  public connect(next$: Observable<void>) {
    return next$.pipe(switchMap(() => this.next()))
  }

  public next() {
    const state = this.state()
    return this.load(state.page + 1)
  }

  public load(page: number) {
    return this.source
      .fetch(page)
      .pipe(take(1))
      .pipe(
        map((result) => {
          const state = this.update(this.state(), result)
          this.state.set(state)
          return {
            ...state,
          }
        }),
      )
  }
}
