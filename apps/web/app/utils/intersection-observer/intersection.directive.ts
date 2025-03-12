import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core'
import { isEqual } from 'lodash'

import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs'
import { distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators'

import { IntersectionObserverResult, IntersectionObserverService } from './intersection-observer.service'

@Directive({
  selector: '[nwbIntxnOptions],[nwbIntxnRoot],[nwbIntxnMargin],[nwbIntxnThreshold],[nwbIntxnTarget]',
  standalone: false,
})
export class IntersectionOptionsDirective implements OnChanges, OnDestroy {
  @Input('nwbIntxnOptions')
  public options: IntersectionObserverInit

  @Input('nwbIntxnTarget')
  public target: Element | ElementRef<any>

  @Input('nwbIntxnRoot')
  public root: Element

  @Input('nwbIntxnMargin')
  public margin: string | number

  @Input('nwbIntxnThreshold')
  public threshold: number | number[]

  public get config$(): Observable<IntersectionObserverInit> {
    return this.changeSubject
  }
  public get target$(): Observable<Element> {
    return this.targetSubject
  }

  private destroy$ = new Subject<void>()
  private changeSubject = new BehaviorSubject<IntersectionObserverInit>({})
  private targetSubject = new BehaviorSubject<Element>(void 0)

  public ngOnChanges(ch: SimpleChanges) {
    if (ch['target']) {
      this.targetSubject.next(this.resolveTarget())
    }
    this.changeSubject.next(this.resolveConfig())
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private resolveConfig(): IntersectionObserverInit {
    if (this.options) {
      return this.options
    }
    const result: IntersectionObserverInit = {}
    if (this.root) {
      result.root = this.root
    }
    if (this.margin) {
      if (typeof this.margin === 'number') {
        const px = `${this.margin}px`
        result.rootMargin = `${px} ${px} ${px} ${px}`
      } else {
        result.rootMargin = this.margin
      }
    }
    if (this.threshold) {
      result.threshold = this.threshold
    }
    return result
  }

  private resolveTarget(): Element {
    let result = this.target
    if ('nativeElement' in result) {
      result = result.nativeElement
    }
    if (result instanceof Element) {
      return result
    }
    return null
  }
}

@Directive()
export abstract class ItersectionBaseDirective {
  protected abstract base?: IntersectionOptionsDirective
  protected abstract service: IntersectionObserverService

  protected source(elRef?: ElementRef<any>) {
    const config$ = this.config().pipe(distinctUntilChanged((a, b) => isEqual(a, b)))
    const target$ = this.target(elRef)
    return combineLatest([config$, target$]).pipe(
      switchMap(([config, element]) => {
        return this.service.observe(element, config)
      }),
    )
  }
  protected config() {
    return this.base?.config$ || of<IntersectionObserverInit>(void 0)
  }

  protected target(elRef?: ElementRef<any>) {
    return (this.base?.target$ || of<Node>(void 0)).pipe(
      map((it) => {
        if (!it) {
          it = elRef?.nativeElement
        }
        if (it instanceof Element) {
          return it
        }
        if (it) {
          return it.parentElement
        }
        return null
      }),
    )
  }
}

@Directive({
  selector: '[nwbIntxnChange]',
  standalone: false,
})
export class IntersectionChangeDirective extends ItersectionBaseDirective implements OnInit, OnDestroy {
  @Output('nwbIntxnChange')
  public intersectionChange = new EventEmitter<IntersectionObserverResult>()

  private destroy$ = new Subject<void>()

  constructor(
    @Optional()
    protected base: IntersectionOptionsDirective,
    protected elRef: ElementRef<HTMLElement>,
    protected service: IntersectionObserverService,
    private zone: NgZone,
  ) {
    super()
  }

  public ngOnInit() {
    this.source(this.elRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe((it) => {
        this.zone.run(() => {
          this.intersectionChange.emit(it)
        })
      })
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}

@Directive({
  selector: '[nwbIntxnEnter]',
  standalone: false,
})
export class IntersectionEnterDirective extends ItersectionBaseDirective implements OnInit, OnDestroy {
  @Output('nwbIntxnEnter')
  public intersectionEnter = new EventEmitter<IntersectionObserverResult>()

  private destroy$ = new Subject<void>()

  constructor(
    @Optional()
    protected base: IntersectionOptionsDirective,
    protected elRef: ElementRef<HTMLElement>,
    protected service: IntersectionObserverService,
    private zone: NgZone,
  ) {
    super()
  }

  public ngOnInit() {
    this.source(this.elRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe((it) => {
        if (it.supported && it.entry.isIntersecting) {
          this.zone.run(() => {
            this.intersectionEnter.emit(it)
          })
        }
      })
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}

@Directive({
  selector: '[nwbIntxnLeave]',
  standalone: false,
})
export class IntersectionLeaveDirective extends ItersectionBaseDirective implements OnInit, OnDestroy {
  @Output('nwbIntxnLeave')
  public intersectionLeave = new EventEmitter<IntersectionObserverResult>()

  private destroy$ = new Subject<void>()

  constructor(
    @Optional()
    protected base: IntersectionOptionsDirective,
    protected elRef: ElementRef<HTMLElement>,
    protected service: IntersectionObserverService,
    private zone: NgZone,
  ) {
    super()
  }

  public ngOnInit() {
    this.source(this.elRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe((it) => {
        if (it.supported && !it.entry.isIntersecting) {
          this.zone.run(() => {
            this.intersectionLeave.emit(it)
          })
        }
      })
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
@Directive({
  selector: '[nwbIntxn]',
  exportAs: 'nwbIntxn',
  standalone: false,
})
export class IntersectionDirective extends ItersectionBaseDirective implements OnInit, OnDestroy {
  public isSupported: boolean
  public isIntersecting: boolean
  public didIntersect: boolean

  private destroy$ = new Subject<void>()

  constructor(
    @Optional()
    protected base: IntersectionOptionsDirective,
    protected elRef: ElementRef<HTMLElement>,
    protected service: IntersectionObserverService,
    private zone: NgZone,
    private cdRef: ChangeDetectorRef,
  ) {
    super()
  }

  public ngOnInit() {
    this.source(this.elRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe((it) => {
        this.isSupported = it.supported
        this.isIntersecting = it.supported && it.entry.isIntersecting
        this.didIntersect = this.didIntersect || this.isIntersecting
        this.zone.run(() => {
          this.cdRef.markForCheck()
        })
      })
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}

@Directive({
  selector: '[nwbIntxnClasses]',
  standalone: false,
})
export class IntersectionClassesDirective extends ItersectionBaseDirective implements OnInit, OnDestroy {
  public isSupported: boolean = this.service.isSupported
  public isIntersecting: boolean = false
  public didIntersect: boolean = false

  private destroy$ = new Subject<void>()

  constructor(
    @Optional()
    protected base: IntersectionOptionsDirective,
    protected elRef: ElementRef<HTMLElement>,
    protected service: IntersectionObserverService,
    private renderer: Renderer2,
    private zone: NgZone,
  ) {
    super()
    this.updateClasses()
  }

  public ngOnInit() {
    this.source(this.elRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe((it) => {
        this.isSupported = it.supported
        this.isIntersecting = it.supported && it.entry.isIntersecting
        this.didIntersect = this.didIntersect || this.isIntersecting
        this.updateClasses()
      })
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private updateClasses() {
    this.zone.runOutsideAngular(() => {
      this.setClassName('nwb-intersection-supported', this.isSupported)
      this.setClassName('nwb-intersection-unsupported', !this.isSupported)
      this.setClassName('nwb-is-intersecting', this.isIntersecting)
      this.setClassName('nwb-is-not-intersecting', !this.isIntersecting)
      this.setClassName('nwb-did-intersect', this.didIntersect)
      this.setClassName('nwb-did-not-intersect', !this.didIntersect)
    })
  }

  private setClassName(className: string, active: boolean) {
    if (active) {
      this.renderer.addClass(this.elRef.nativeElement, className)
    } else {
      this.renderer.removeClass(this.elRef.nativeElement, className)
    }
  }
}

@Directive({
  selector: '[nwbIsIntersecting]',
  standalone: false,
})
export class IsIntersectingDirective extends ItersectionBaseDirective implements OnInit, OnDestroy {
  @Input('nwbIsIntersecting')
  public input: any

  public value: boolean = false
  private destroy$ = new Subject<void>()
  private viewRef: EmbeddedViewRef<unknown>

  constructor(
    @Optional()
    protected base: IntersectionOptionsDirective,
    protected service: IntersectionObserverService,
    private cdRef: ChangeDetectorRef,
    private vcRef: ViewContainerRef,
    private tpl: TemplateRef<unknown>,
    private zone: NgZone,
  ) {
    super()
  }

  public ngOnInit() {
    this.source(this.vcRef.element)
      .pipe(map((it) => it.supported && it.entry.isIntersecting))
      .pipe(takeUntil(this.destroy$))
      .subscribe((visible) => {
        this.value = visible
        this.zone.run(() => {
          if (visible && !this.viewRef) {
            this.viewRef = this.vcRef.createEmbeddedView(this.tpl)
          }
          if (!visible) {
            this.viewRef?.destroy()
            this.viewRef = null
          }
          this.cdRef.markForCheck()
          this.viewRef?.markForCheck()
        })
      })
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
    this.viewRef?.destroy()
    this.viewRef = null
  }
}

@Directive({
  selector: '[nwbDidIntersect]',
  standalone: false,
})
export class DidIntersectDirective extends ItersectionBaseDirective implements OnInit, OnDestroy {
  public value: boolean = false
  private destroy$ = new Subject<void>()
  private viewRef: EmbeddedViewRef<unknown>

  constructor(
    @Optional()
    protected base: IntersectionOptionsDirective,
    protected service: IntersectionObserverService,
    private cdRef: ChangeDetectorRef,
    private vcRef: ViewContainerRef,
    private tpl: TemplateRef<unknown>,
    private zone: NgZone,
  ) {
    super()
  }

  public ngOnInit() {
    this.source(this.vcRef.element)
      .pipe(map((it) => it.supported && it.entry.isIntersecting))
      .pipe(filter((it) => it))
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.value = true
        this.zone.run(() => {
          this.viewRef = this.vcRef.createEmbeddedView(this.tpl)
          this.cdRef.markForCheck()
          this.viewRef.markForCheck()
        })
      })
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
    this.viewRef?.destroy()
    this.viewRef = null
  }
}
