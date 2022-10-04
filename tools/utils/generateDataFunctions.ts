import * as path from 'path'

export function generateDataFunctions(input: Map<string, string[]>) {


  const types = Array.from(input.keys())
  const functionStatements: string[] = []

  for (const typeName of types) {
    for (const filePath of input.get(typeName)) {
      const extName = path.extname(filePath)
      const dirName = path.dirname(filePath)
      const basename = path.basename(filePath, extName)

      const assetPath = path.join(dirName, basename).replace(/[\\/]+/g, '/')
      const functionName = assetPath
        .split(/[_/.]/)
        .filter((it) => it && it !== 'javelindata')
        .map((it, i) => {
          return i === 0 ? it : (it[0].toLocaleUpperCase() + it.substring(1))
        })
        .join('')

      functionStatements.push([
        `  public ${functionName}() {`,
        `    return this.load<${typeName}[]>('${assetPath}${extName}')`,
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
    '  public abstract load<T>(path: string): Observable<T>',
    ...functionStatements,
    '}'
  ].join('\n')
}

export function generateLocaleFunctions() {

}
