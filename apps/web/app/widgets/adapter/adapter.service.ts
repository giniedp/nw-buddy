import { Injectable, Injector, Type } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'

@Injectable({ providedIn: 'root' })
export class TableAdapterService {
  public constructor(private injector: Injector) {
    //
  }

  public createInstance<T extends DataTableAdapter<unknown>>(type: Type<T>): T {
    return Injector.create({
      providers: [
        {
          provide: type,
          useClass: type,
        },
      ],
      parent: this.injector,
    }).get<T>(type, null)
  }
}
