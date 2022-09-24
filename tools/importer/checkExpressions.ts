import { writeJSONFile } from "../utils"

export async function checkExpressions({
  locales,
  output,
}: {
  locales: Map<string, Record<string, string>>
  output: string
}) {
  const expressions = new Set<string>()
  const resources = new Set<string>()
  locales.forEach((file) => {
    Object.values(file).forEach((text) => {
      extractExpressions(text).forEach((exp) => {
        expressions.add(exp)
        extractVariables(exp).forEach((variable) => {
          const split = variable.split('.')
          if (!split[0]) {
            console.log(exp, variable)
          }
          resources.add(split[0])
        })
      })
    })
  })

  await writeJSONFile({
    expressions: Array.from(expressions.values()).sort(),
    resources: Array.from(resources.values()).sort(),
  }, output)
}

function extractExpressions(text: string) {
  let outside = true
  const result: string[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (outside && text[i] === '{' && text[i+1] === '[') {
      start = i
      outside = !outside
    }
    if (!outside && text[i] === ']' && text[i+1] === '}') {
      result.push(text.substring(start + 2, i))
      outside = !outside
    }
  }
  return result
}

function extractVariables(exp: string) {
  const match = exp.match(/[a-zA-Z]\w+(\.\w+)*/gi)
  if (!match) {
    return []
  }
  return match.map((exp) => exp)
}
