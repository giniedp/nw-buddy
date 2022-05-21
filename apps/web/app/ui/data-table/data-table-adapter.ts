import { ClassProvider, Type } from "@angular/core"
import { GridOptions, ValueGetterFunc, ValueGetterParams } from "ag-grid-community"
import { Observable, Subject, takeUntil } from "rxjs"
import { AgGridComponent, mithrilCell, MithrilCellAttrs } from "../ag-grid"
import m from 'mithril'

export interface TypedValueGetterParams<T> extends ValueGetterParams {
  data: T
}
export abstract class DataTableAdapter<T> {

  public static provideClass(useClass: Type<DataTableAdapter<any>>): ClassProvider {
    return {
      provide: DataTableAdapter,
      useClass: useClass,
    }
  }

  public moneyFormatter = Intl.NumberFormat(navigator.language, {
    minimumFractionDigits: 2,
  })

  public abstract entityID(item: T): string
  public abstract entityCategory(item: T): string
  public abstract buildGridOptions(base: GridOptions): GridOptions
  public abstract entities: Observable<T[]>

  public setActiveCategories(grid: AgGridComponent, value: string[]) {
    //
  }

  public getActiveCategories(): string[] {
    return []
  }

  public fieldName(k: keyof T) {
    return String(k)
  }
  public valueGetter(fn: keyof T | ((params: TypedValueGetterParams<T>) => any)): string | ValueGetterFunc {
    return fn as any
  }
  public mithrilCell(comp: m.Component<MithrilCellAttrs<T>>) {
    return mithrilCell<T>(comp)
  }
  public asyncCell(fn: (data: T) => Observable<string>, options?: { trustHtml: boolean }) {
    return mithrilCell<T, { d: Subject<any>, value: string }>({
      oncreate: ({ attrs, state }) => {
        state.d = new Subject()
        fn(attrs.data).pipe(takeUntil(state.d)).subscribe((v) => {
          state.value = v
          m.redraw()
        })
      },
      onremove: ({ state }) => {
        state.d.next(null)
        state.d.complete()
      },
      view: ({ state }) => {
        if (options?.trustHtml) {
          return m.trust(state.value)
        } else {
          return state.value
        }
      }
    })
  }
  public cellRendererTags(format?: (value: any) => string) {
    return this.mithrilCell({
      view: ({ attrs }) => {
        return m(
          'div.flex.flex-row.flex-wrap.gap-1.h-full.items-center',
          attrs.value?.map?.((it: string) => m('span.badge.badge-secondary.badge-sm', format ? format(it) : it))
        )
      },
    })
  }
}
