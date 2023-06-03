import * as path from 'path'

export function generateApiService(input: Map<string, string[]>) {
  const types = Array.from(input.keys()).sort((a, b) => a < b ? -1 : 1)
  const functionStatements: string[] = types.map((typeName) => {
    return input.get(typeName).map((filePath) => {
      const extName = path.extname(filePath)
      const dirName = path.dirname(filePath)
      const basename = path.basename(filePath, extName)

      const assetPath = path.join(dirName, basename).replace(/[\\/]+/g, '/')
      const functionName = assetPath
        .split(/[_/.\-]/)
        .filter((it) => it && it !== 'javelindata')
        .map((it, i) => {
          return i === 0 ? it : (it[0].toLocaleUpperCase() + it.substring(1))
        })
        .join('')

        return {
          name: functionName,
          code: [
            `  public ${functionName}() {`,
            `    return this.load<${typeName}[]>('${assetPath}${extName}')`,
            '  }',
          ].join('\n')
        }
    })
  })
  .flat()
  .sort((a, b) => a.name < b.name ? -1 : 1)
  .map(({ code }) => code)

  return [
    'import type {',
    ...types.map((type) => `  ${type},`),
    '} from \'./types\'',
    'import { Observable } from \'rxjs\'',
    '',
    'export abstract class NwDataLoader {',
    '  public abstract load<T>(path: string): Observable<T>',
    ...functionStatements,
    '}'
  ].join('\n')
}
