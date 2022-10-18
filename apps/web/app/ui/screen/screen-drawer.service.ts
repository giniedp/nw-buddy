import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class ScreenDrawerService {
  public get isOpen() {
    return this.isOpen$.value
  }

  public set isOpen(value: boolean) {
    this.isOpen$.next(value)
  }

  public readonly isOpen$ = new BehaviorSubject(false)

  public toggle() {
    this.isOpen = !this.isOpen
  }

  public close() {
    this.isOpen = false
  }

  public open() {
    this.isOpen = true
  }
}
