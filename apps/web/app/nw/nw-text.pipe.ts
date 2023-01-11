import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core'
import { isEqual } from 'lodash'
import { Subject, switchMap, takeUntil } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwExpressionContext, NwExpressionService } from './expression'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE_BASE } from './utils/constants'

export type NwTextPipeOptions = Partial<NwExpressionContext> & Record<string, string | number>

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
    private cdRef: ChangeDetectorRef
  ) {}

  public transform(key: string | string[], options: NwTextPipeOptions = null) {
    if (isEqual(this.key, key) && isEqual(this.options, options)) {
      return this.value
    }
    this.dispose$.next()
    this.key = key
    this.options = options
    this.i18n
      .observe(key)
      .pipe(
        switchMap((value) =>
          this.expr.solve({
            charLevel: NW_MAX_CHARACTER_LEVEL,
            gearScore: NW_MAX_GEAR_SCORE_BASE,
            ...(options || {}),
            text: value,
          })
        )
      )
      .pipe(takeUntil(this.dispose$))
      .subscribe((value) => {
        this.value = value
        this.cdRef.markForCheck()
      })
    return this.value
  }

  public ngOnDestroy(): void {
    this.dispose$.next()
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
