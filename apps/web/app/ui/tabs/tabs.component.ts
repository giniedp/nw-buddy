import { Component, computed, contentChildren, ElementRef, inject, Input } from '@angular/core'
import { outputFromObservable, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { EMPTY, Observable, skip, switchMap } from 'rxjs'
import { IconsModule } from '../icons'
import { TabComponent } from './tab.component'
import { TabsStore } from './tabs.store'

@Component({
  selector: 'nwb-tabs',
  template: ` <ng-content /> `,
  host: {
    class: 'flex flex-row overflow-hidden flex-nowrap',
  },
  imports: [IconsModule],
  providers: [TabsStore],
  styles: [
    `
      :host {
        grid-area: t;
        min-width: 0;
      }
    `,
  ],
})
export class TabsComponent<T> {
  private store = inject(TabsStore)
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)

  public tabs = contentChildren(TabComponent)
  public activeChange = outputFromObservable(toObservable(this.store.active).pipe(skip(1)))

  private tabFirst = computed(() => this.tabs()?.[0])
  private tabLast = computed(() => this.tabs()?.[this.tabs()?.length - 1])
  private tabFirstVisible$ = toObservable(this.tabFirst).pipe(
    switchMap((it) => this.observeVisibility(it?.elRef?.nativeElement)),
  )
  private tabFirstVisible = toSignal(this.tabFirstVisible$, { initialValue: true })

  private tabLastVisible$ = toObservable(this.tabLast).pipe(
    switchMap((it) => this.observeVisibility(it?.elRef?.nativeElement)),
  )
  private tabLastVisible = toSignal(this.tabLastVisible$, { initialValue: true })

  public canScrollLeft = computed(() => {
    return !!this.tabFirst() && !this.tabFirstVisible()
  })
  public canScrollRight = computed(() => {
    return !!this.tabLast() && !this.tabLastVisible()
  })
  public canScroll = computed(() => this.canScrollLeft() || this.canScrollRight())

  @Input()
  public set active(value: T) {
    this.store.activate(value)
  }
  public get active(): T {
    return this.store.active() as T
  }

  public scrollLeft() {
    const el = this.elRef.nativeElement
    el.scrollTo({
      left: el.scrollLeft - el.clientWidth / 2,
      behavior: 'smooth',
    })
  }

  public scrollRight() {
    const el = this.elRef.nativeElement
    el.scrollTo({
      left: el.scrollLeft + el.clientWidth / 2,
      behavior: 'smooth',
    })
  }

  private observeVisibility(el: HTMLElement) {
    if (!el || typeof IntersectionObserver === 'undefined') {
      return EMPTY
    }
    return new Observable((sub) => {
      const io = new IntersectionObserver(
        (it) => {
          for (const entry of it) {
            sub.next(entry.isIntersecting)
          }
        },
        {
          root: el.parentElement,
          threshold: 0.95,
        },
      )
      io.observe(el)
      return () => {
        io.unobserve(el)
        io.disconnect()
      }
    })
  }
}
