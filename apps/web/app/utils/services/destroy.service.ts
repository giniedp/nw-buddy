import { Injectable, OnDestroy } from "@angular/core"
import { Observable, Subject } from "rxjs"

@Injectable()
export class DestroyService implements OnDestroy {

  public get $(): Observable<unknown> {
    return this.destroy$
  }

  private destroy$ = new Subject()

  public constructor() {

  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
