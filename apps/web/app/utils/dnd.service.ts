import { DOCUMENT } from '@angular/common'
import { Inject, Injectable, OnDestroy } from '@angular/core'
import { fromEvent, Subject, takeUntil } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class DnDService implements OnDestroy {
  public data: any

  private destroy$ = new Subject<void>()
  public constructor(@Inject(DOCUMENT) document: Document) {
    fromEvent(document, 'dragend', {
      capture: true,
      passive: true,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.data = null
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
