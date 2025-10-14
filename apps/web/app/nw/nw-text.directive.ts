import { Directive, ElementRef, effect, inject, input } from '@angular/core'
import { map, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'

import { rxResource } from '@angular/core/rxjs-interop'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE_BASE } from '@nw-data/common'
import { resourceValueOf } from '../utils'
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
export class NwTextDirective {
  private elRef = inject(ElementRef<HTMLElement>)
  private i18n = inject(TranslateService)
  private expr = inject(NwExpressionService)
  private html = inject(NwHtmlService)

  public nwText = input<string>()
  public itemId = input<string>()
  public charLevel = input<number>(NW_MAX_CHARACTER_LEVEL)
  public gearScore = input<number>(NW_MAX_GEAR_SCORE_BASE)

  private htmlResource = rxResource({
    params: () => {
      return {
        text: this.nwText(),
        itemId: this.itemId(),
        charLevel: this.charLevel(),
        gearScore: this.gearScore(),
      }
    },
    stream: ({ params }) => {
      return this.i18n.observe(params.text).pipe(
        map((text) => {
          return {
            ...params,
            text,
          }
        }),
        switchMap((context) => this.expr.solve(context)),
        map((res) => String(res).replace(/\\n/g, ' ')),
        map((res) => this.html.sanitize(res)),
      )
    },
  })
  private htmlContent = resourceValueOf(this.htmlResource, {
    keepPrevious: true,
  })

  public constructor() {
    effect(() => {
      this.elRef.nativeElement.innerHTML = this.htmlContent() || ''
    })
  }
}
