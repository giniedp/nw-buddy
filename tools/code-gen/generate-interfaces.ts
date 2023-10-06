import { InputData, jsonInputForTargetLanguage, quicktype, TypeScriptTargetLanguage } from 'quicktype-core'

export async function generateInterfaces(samples: Map<string, any[]>) {
  const result: string[] = []
  for (const [type, candidates] of Array.from(samples.entries())) {
    const samples: string[] = candidates.flat(1).map((it) => {
      it = JSON.parse(JSON.stringify(it))
      // Object.keys(it).forEach((key) => {
      //   // map non enum strings to emtpy strings, so that enums are not generated
      //   if (typeof it[key] === 'string') {
      //     it[key] = ''
      //   }
      //   // map arrays of strings to `['']` so that enums are not generated
      //   if (Array.isArray(it[key])) {
      //     it[key] = ['']
      //   }
      // })
      return JSON.stringify(it)
    })
    const rendered = await tsFromJson(type, samples)
    const tsCode = rendered.lines.join('\n').trim()
    if (tsCode) {
      result.push(tsCode)
    }
  }
  return result.join('\n')
}

async function tsFromJson(typeName: string, samples: string[]) {
  const lang = new TypeScriptTargetLanguage()
  const jsonInput = jsonInputForTargetLanguage(lang)
  await jsonInput.addSource({
    name: typeName,
    samples: samples,
  })

  const inputData = new InputData()
  inputData.addInput(jsonInput)

  return await quicktype({
    inputData,
    lang: lang,
    inferEnums: false,
    inferBooleanStrings: false,
    inferDateTimes: false,
    inferIntegerStrings: false,
    inferMaps: false,
    inferUuids: false,
    alphabetizeProperties: true,
    rendererOptions: {
      'just-types': true as any,
    },
  })
}
