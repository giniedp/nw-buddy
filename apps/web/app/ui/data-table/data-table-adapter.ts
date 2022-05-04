import { ClassProvider, Type } from "@angular/core"
import { GridOptions, ValueGetterFunc, ValueGetterParams } from "ag-grid-community"
import { Observable } from "rxjs"
import { mithrilCell, MithrilCellAttrs } from "../ag-grid"
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

  public abstract entityID(item: T): string
  public abstract entityCategory(item: T): string
  public abstract buildGridOptions(base: GridOptions): GridOptions
  public abstract entities: Observable<T[]>

  public fieldName(k: keyof T) {
    return String(k)
  }
  public valueGetter(fn: keyof T | ((params: TypedValueGetterParams<T>) => any)): string | ValueGetterFunc {
    return fn as any
  }
  public mithrilCell(comp: m.Component<MithrilCellAttrs<T>>) {
    return mithrilCell<T>(comp)
  }
}
