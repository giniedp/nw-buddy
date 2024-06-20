import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core'
import { isEqual } from 'lodash'
import { Observable, Subject, combineLatest, distinctUntilChanged, switchMap, takeUntil } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwExpressionContext, NwExpressionService, NwTextContextService } from './expression'

export type NwTextPipeOptions = Partial<NwExpressionContext> &
  Record<string, string | number | boolean | Observable<string | number | boolean>>

@Pipe({
  standalone: true,
  name: 'nwText',
  pure: false,
})
export class NwTextPipe implements PipeTransform, OnDestroy {
  private dispose$ = new Subject<void>()
  private key: string | string[]
  private options: NwTextPipeOptions = null
  private value: string

  public constructor(
    private i18n: TranslateService,
    private expr: NwExpressionService,
    private ctx: NwTextContextService,
    private cdRef: ChangeDetectorRef,
  ) {}

  public transform(key: string | string[], options: NwTextPipeOptions = null) {
    if (!isEqual(this.key, key) || !isEqual(this.options, options)) {
      this.update(key, options)
    }
    return this.value
  }

  public ngOnDestroy(): void {
    this.dispose$.next()
  }

  private update(key: string | string[], options: NwTextPipeOptions = null) {
    this.dispose$.next()
    this.key = key
    this.options = options
    combineLatest({
      text: this.i18n.observe(key),
      context: this.ctx.derive(options || {}),
    })
      .pipe(
        switchMap(({ text, context }) =>
          this.expr.solve({
            ...(context as any),
            text: text,
          }),
        ),
        distinctUntilChanged(),
        takeUntil(this.dispose$),
      )
      .subscribe((value) => {
        this.value = value
        this.cdRef.markForCheck()
      })
  }
}

@Pipe({
  standalone: true,
  name: 'nwTextBreak',
  pure: true,
})
export class NwTextBreakPipe implements PipeTransform {
  public transform(value: string, separator = '<br>') {
    return value?.replace(/\\n/gi, separator)
  }
}
