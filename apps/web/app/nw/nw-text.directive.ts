import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit } from '@angular/core'
import {
  distinctUntilChanged,
  map,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs'
import { TranslateService } from '~/i18n'

import { NwExpressionService } from './nw-expression.service'

interface TextContext {
  text: string
  itemId: string
  charLevel: number
  gearScore: number
}

@Directive({
  standalone: true,
  selector: '[nwText]',
})
export class NwTextDirective implements OnInit, OnChanges, OnDestroy {
  @Input()
  public nwText: string

  @Input()
  public nwTextAttr: string

  @Input()
  public itemId: string

  @Input()
  public charLevel: number = 60

  @Input()
  public gearScore: number = 600

  private destroy$ = new Subject()
  private change$ = new ReplaySubject<TextContext>(1)

  public constructor(private elRef: ElementRef<HTMLElement>, private i18n: TranslateService, private expr: NwExpressionService) {
    //
  }

  public ngOnInit(): void {
    this.change$
      .pipe(distinctUntilChanged())
      .pipe(switchMap((context) => {
        return this.i18n.observe(context.text).pipe(map((text) => {
          return {
            ...context,
            text
          }
        }))
      }))
      .pipe(switchMap((context) => this.expr.solve(context)))
      .pipe(map((res) => String(res).replace(/\\n/g, ' ')))
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (this.nwTextAttr) {
          this.elRef.nativeElement.setAttribute(this.nwTextAttr, res)
        } else {
          this.elRef.nativeElement.innerHTML = res
        }
      })
  }

  public ngOnChanges(): void {
    this.change$.next({
      text: this.nwText,
      itemId: this.itemId,
      charLevel: this.charLevel,
      gearScore: this.gearScore
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
