import { readFile } from 'fs/promises'
import { firstValueFrom, of } from 'rxjs'
import { parseNwExpression } from '../../apps/web/app/core/nw/utils/expressions'

export async function extractExpressions(file: string, cb: (expression: string) => void) {
  const data = await readFile(file)
  const json = JSON.parse(data.toString('utf-8'))
  for (const [_, it] of Array.from(Object.entries(json))) {
    await firstValueFrom(parseNwExpression(it['value']).eval((expression) => {
      cb(expression)
      return of(expression)
    }))
  }
}
