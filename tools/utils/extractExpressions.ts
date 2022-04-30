import { readFile } from 'fs/promises'
import { firstValueFrom, of } from 'rxjs'
import { parseNwexpression } from './nw-expression'

export async function extractExpressions(file: string, cb: (expression: string) => void) {
  const data = await readFile(file)
  const json = JSON.parse(data.toString('utf-8'))
  for (const [_, it] of Array.from(Object.entries(json))) {
    await firstValueFrom(parseNwexpression(it['value']).eval((expression) => {
      cb(expression)
      return of(expression)
    }))
  }
}
