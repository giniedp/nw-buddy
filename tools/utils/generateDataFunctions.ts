import * as path from 'path'

export function generateDataFunctions(input: Map<string, string[]>, relativeTo: string, localeSources: string[]) {

  const types = Array.from(input.keys())
  const functionStatements: string[] = []

  for (const typeName of types) {
    for (const filePath of input.get(typeName)) {
      const relativePath = path.relative(relativeTo, filePath)

      const dirName = path.dirname(relativePath)
      const basename = path.basename(relativePath)

      const assetPath = path.join(dirName, basename).replace(/[\\/]+/g, '/')
      const functionName = assetPath
        .split(/[_/.]/)
        .filter((it) => it && it !== 'javelindata' && it !== 'json')
        .map((it, i) => {
          return i === 0 ? it : (it[0].toLocaleUpperCase() + it.substring(1))
        })
        .join('')

      functionStatements.push([
        `  public ${functionName}() {`,
        `    return this.load<${typeName}[]>('${assetPath}')`,
        '  }',
      ].join('\n'))
    }
  }


  return [
    'import type {',
    ...types.map((type) => `  ${type},`),
    '} from \'./types\'',
    'import { Observable } from \'rxjs\'',
    '',
    'export abstract class NwDataloader {',
    '  public static localeFiles = [',
    ...localeSources.map((it) => `    ${JSON.stringify(it)},`),
    '  ]',
    '  public abstract load<T>(path: string): Observable<T>',
    ...functionStatements,
    '}'
  ].join('\n')
}

export function generateLocaleFunctions() {

}
