import { ClassProvider, Type } from "@angular/core"
import { GridOptions } from "ag-grid-community"
import { Observable } from "rxjs"

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
}
