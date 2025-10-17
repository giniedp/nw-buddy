import { inject, Pipe, PipeTransform, signal, untracked } from '@angular/core'
import { isEqual } from 'lodash'
import { debounceTime, Observable, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { rxResourceValue } from '../utils'
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
  private template = rxResourceValue({
    keepPrevious: true,
    defaultValue: '',
    params: this.key,
    stream: ({ params }) => this.i18n.observe(params),
  })

  private value = rxResourceValue({
    keepPrevious: true,
    defaultValue: '',
    params: () => {
      return {
        text: this.template(),
        options: this.options(),
      }
    },
    stream: ({ params: { text, options } }) => {
      return this.ctx.derive(options || {}).pipe(
        debounceTime(0),
        switchMap((context) => {
          return this.expr.solve({
            ...(context as any),
            text,
          })
        }),
      )
    },
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
