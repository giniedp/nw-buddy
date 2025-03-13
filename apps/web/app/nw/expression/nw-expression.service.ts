import { Injectable } from '@angular/core'
import { getPerkMultiplier, parseNwExpression } from '@nw-data/common'
import { catchError, from, isObservable, map, Observable, of, throwError } from 'rxjs'
import { injectNwData } from '~/data'
import { eqCaseInsensitive } from '~/utils'
import { NwExpressionContext } from './nw-expression-context.service'
import { resourceLookup } from './resource-lookup'
import { ExpressionConstant } from './types'

@Injectable({ providedIn: 'root' })
export class NwExpressionService {
  private db = injectNwData()

  public parse(expression: string) {
    return parseNwExpression(expression)
  }

  public solve(context: NwExpressionContext & { text: string }) {
    return this.parse(context.text)
      .eval((key) => this.evaluate(key, context))
      .pipe(map((value) => String(value)))
      .pipe(
        catchError((err) => {
          console.error(err)
          return of(context.text)
        }),
      )
  }

  private evaluate(token: string, context: NwExpressionContext & { text: string }): Observable<string | number> {
    if (token in context && context[token] != null) {
      const value = context[token]
      return isObservable(value) ? value as Observable<string | number> : of(value)
    }

    if (token.includes('.')) {
      return this.evaluateResource(token, context)
    }

    return this.evaluateConstant(token as any, context)
  }

  private evaluateResource(
    token: string,
    context: NwExpressionContext & { text: string },
  ): Observable<string | number> {
    const [resource, id, attr] = token.split('.')
    return from(resourceLookup(resource as any, this.db))
      .pipe(
        map((data) => {
          if (!data) {
            throw new Error(`Unknown resource "${resource}" (for token "${token}" in text "${context.text}")`)
          }
          let object: any
          if (data.has(id)) {
            object = data.get(id)
          } else if (data.has(Number(id))) {
            object = data.get(Number(id))
          }
          if (!object) {
            throw new Error(`Object for ID "${id}" not found (for token "${token}" in text "${context.text}")`)
          }
          if (attr in object) {
            return object[attr]
          }
          for (const key of Object.keys(object)) {
            if (eqCaseInsensitive(key, attr)) {
              return object[key]
            }
          }
          throw new Error(`Object has no attribute "${attr}" (for token "${token}" in text "${context.text}")`)
        }),
      )
      .pipe(
        map((it) => {
          if (String(it).includes('=')) {
            const [_, value] = String(it).split('=')
            console.debug(`[expr] found key=value pair in "${it}", use "${value}"`)
            return value
          }
          return it
        }),
      )
  }

  private evaluateConstant(
    token: ExpressionConstant,
    context: NwExpressionContext & { text: string },
  ): Observable<string | number> {
    switch (token) {
      case 'ConsumablePotency': {
        return from(this.db.statusEffectsByIdMap()).pipe(
          map((it) => {
            if (it.get(context.itemId)?.PotencyPerLevel) {
              return it.get(context.itemId).PotencyPerLevel * context.charLevel
            }
            console.error(
              `ConsumablePotency not resolved (for token "${token}" and id "${context.itemId}" in text "${context.text}")`,
            )
            return 1
          }),
        )
      }
      case 'perkMultiplier':
      case 'attributePerkMultiplier':
        return from(this.db.perksByIdMap()).pipe(
          map((it) => {
            if (it.has(context.itemId)) {
              return getPerkMultiplier(it.get(context.itemId), context.gearScore)
            }
            throw new Error(
              `perkMultiplier not resolved (for token "${token}" and id "${context.itemId}" in text "${context.text}")`,
            )
          }),
        )
    }

    return throwError(() => new Error(`unresolved token: "${token}" in text "${context.text}"`))
  }
}
