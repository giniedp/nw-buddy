import { tsFromJson } from './ts-from-json'

export async function generateInterfaces(
  samples: Map<string, any[]>,
  {
    onEmptyType,
    enumProps
  }: {
    onEmptyType: (type: string) => void,
    enumProps: (type: string) => string[]
  }
) {
  const result: string[] = []
  for (const [type, candidates] of Array.from(samples.entries())) {
    const enums = enumProps(type)
    const samples: string[] = candidates.flat(1).map((it) => {
      it = JSON.parse(JSON.stringify(it))
      Object.keys(it).forEach((key) => {
        if (enums.includes(key)) {
          return
        }
        // map non enum strings to emtpy strings, so that enums are not generated
        if (typeof it[key] === 'string') {
          it[key] = ''
        }
        // map arrays of strings to `['']` so that enums are not generated
        if (Array.isArray(it[key])) {
          it[key] = ['']
        }
      })
      return JSON.stringify(it)
    })
    const rendered = await tsFromJson(type, samples)
    const tsCode = rendered.lines.join('\n').trim()
    if (tsCode) {
      result.push(tsCode)
    } else {
      onEmptyType?.(type)
    }
  }
  return result.join('\n')
}
