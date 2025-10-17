import { inject, Pipe, PipeTransform, signal, untracked } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { isEqual } from 'lodash'
import { combineLatest, debounceTime, Observable, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { resourceValueOf } from '../utils'
import { NwExpressionContext, NwExpressionService, NwTextContextService } from './expression'

export type NwTextPipeOptions = Partial<NwExpressionContext> &
  Record<string, string | number | boolean | Observable<string | number | boolean>>

@Pipe({
  standalone: true,
  name: 'nwText',
  pure: false,
})
export class NwTextPipe implements PipeTransform {
  private i18n = inject(TranslateService)
  private expr = inject(NwExpressionService)
  private ctx = inject(NwTextContextService)
  private key = signal<string | string[]>(null, { equal: isEqual })
  private options = signal<NwTextPipeOptions>(null, { equal: isEqual })
  private valueResource = rxResource({
    defaultValue: '',
    params: () => {
      return {
        key: this.key(),
        options: this.options(),
      }
    },
    stream: ({ params: { key, options } }) => {
      return combineLatest({
        text: this.i18n.observe(key),
        context: this.ctx.derive(options || {}),
      }).pipe(
        debounceTime(0),
        switchMap(({ text, context }) => {
          return this.expr.solve({
            ...(context as any),
            text: text,
          })
        }),
      )
    },
  })
  private value = resourceValueOf(this.valueResource, {
    keepPrevious: true,
  })

  public transform(key: string | string[], options: NwTextPipeOptions = null) {
    untracked(() => {
      this.key.set(key)
      this.options.set(options)
    })
    return this.value()
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
