import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core'
import { ReplaySubject, Subject, distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs'
import { TranslateService } from '~/i18n'

import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE_BASE } from '@nw-data/common'
import { NwExpressionService } from './expression'
import { NwHtmlService } from './nw-html.service'

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
  public charLevel: number = NW_MAX_CHARACTER_LEVEL

  @Input()
  public gearScore: number = NW_MAX_GEAR_SCORE_BASE

  private destroy$ = new Subject()
  private change$ = new ReplaySubject<TextContext>(1)
  private html = inject(NwHtmlService)

  public constructor(
    private elRef: ElementRef<HTMLElement>,
    private i18n: TranslateService,
    private expr: NwExpressionService,
  ) {
    //
  }

  public ngOnInit(): void {
    this.change$
      .pipe(distinctUntilChanged())
      .pipe(
        switchMap((context) => {
          return this.i18n.observe(context.text).pipe(
            map((text) => {
              return {
                ...context,
                text,
              }
            }),
          )
        }),
      )
      .pipe(switchMap((context) => this.expr.solve(context)))
      .pipe(map((res) => String(res).replace(/\\n/g, ' ')))
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (this.nwTextAttr) {
          this.elRef.nativeElement.setAttribute(this.nwTextAttr, res)
        } else {
          this.elRef.nativeElement.innerHTML = this.html.sanitize(res)
        }
      })
  }

  public ngOnChanges(): void {
    this.change$.next({
      text: this.nwText,
      itemId: this.itemId,
      charLevel: this.charLevel,
      gearScore: this.gearScore,
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
