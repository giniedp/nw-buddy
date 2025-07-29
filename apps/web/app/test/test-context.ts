import { DOCUMENT } from '@angular/common'
import { InjectOptions, ProviderToken, Type } from '@angular/core'
import { ComponentFixture, discardPeriodicTasks, flush, flushMicrotasks, TestBed, tick } from '@angular/core/testing'
import { By } from '@angular/platform-browser'

export class TestContext<C> {
  public readonly fixture: ComponentFixture<C>

  public get component(): C {
    return this.fixture.componentInstance
  }

  public get debugElement() {
    return this.fixture.debugElement
  }

  public get document() {
    return this.inject(DOCUMENT)
  }

  constructor(typeOrFixture: Type<C> | ComponentFixture<C>) {
    if (typeOrFixture instanceof ComponentFixture) {
      this.fixture = typeOrFixture
    } else {
      this.fixture = TestBed.createComponent(typeOrFixture)
    }
  }

  public static create<T>(type: Type<T>) {
    return new TestContext(TestBed.createComponent(type))
  }

  /**
   * gets an injectable from current injector
   */
  public inject<S>(token: ProviderToken<S>, notFoundValue?: S, flags?: InjectOptions): S {
    return this.debugElement.injector.get<S>(token, notFoundValue, flags)
  }

  /**
   * calls `detectsChanges` followed by `flush`
   */
  public stabilize() {
    this.detectChanges()
    this.flush()
  }

  /**
   * alias for `fixture.whenStable()`
   */
  public whenStable() {
    return this.fixture.whenStable()
  }

  /**
   * alias for `fixture.detectChanges()`
   */
  public detectChanges(checkNoChanges?: boolean) {
    return this.fixture.detectChanges(checkNoChanges)
  }

  /**
   * alias for `fixture.autoDetectChanges`
   */
  public autoDetectChanges(autoDetect?: boolean) {
    return this.fixture.autoDetectChanges(autoDetect)
  }

  /**
   * alias for `flush()`
   */
  public flush(maxTurns?: number) {
    return flush(maxTurns)
  }

  /**
   * alias for `flushMicrotasks()`
   */
  public flushMicrotasks() {
    return flushMicrotasks()
  }

  /**
   * alias for `discardPeriodicTasks()`
   */
  public discardPeriodicTasks() {
    return discardPeriodicTasks()
  }

  /**
   * alias for `tick()`
   */
  public tick(millis?: number) {
    return tick(millis)
  }

  public queryByCss(selector: string) {
    return this.debugElement.query(By.css(selector))
  }

  public queryElementByCss<E extends Element = Element>(selector: string): E {
    return this.queryByCss(selector)?.nativeElement
  }

  public queryAllByCss(selector: string) {
    return this.debugElement.queryAll(By.css(selector))
  }
  public queryAllElementsByCss<E extends Element = Element>(selector: string): E[] {
    return this.queryAllByCss(selector).map((it) => it.nativeElement)
  }

  public queryByType<T>(type: Type<T>) {
    return this.debugElement.query(By.directive(type))
  }
  public queryElementByType<E extends Element = Element, T = any>(type: Type<T>): E {
    return this.queryByType(type)?.nativeElement || null
  }
  public queryComponentByType<T>(type: Type<T>): T {
    return this.queryByType(type)?.componentInstance
  }

  public queryAllByType<T>(type: Type<T>) {
    return this.debugElement.queryAll(By.directive(type))
  }
  public queryAllElementsByType<E extends Element = Element, T = any>(type: Type<T>): E[] {
    return this.queryAllByType(type).map((it) => it.nativeElement)
  }
  public queryAllComponentsByType<T>(type: Type<T>): T[] {
    return this.queryAllByType(type).map((it) => it.componentInstance)
  }
}
