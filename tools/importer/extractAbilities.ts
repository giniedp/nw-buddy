import { sortBy, uniqBy } from "lodash"
import { glob, readJSONFile, writeFile, writeJSONFile } from "../utils"
import { pathToDatatables } from "./loadDatatables"

export async function extractAbilities(inputDir: string, outDir: string) {
  const tablesDir = pathToDatatables(inputDir)
  const files = await glob(tablesDir + '/weaponabilities/*')
  const data = await Promise.all(files.map((file) => readJSONFile<Array<Object>>(file)))
    .then((list) => list.flat(1))
    // .then((list) => list.map((it) => nonFalseyProps(it)))

  const keys = new Map<string, number>()
  data.forEach((item) => {
    Object.keys(item)
      .filter((key) => !isFalsey(item[key]))
      .forEach((key) => {
        if (!keys.has(key)) {
          keys.set(key, 0)
        }
        keys.set(key, keys.get(key) + 1)
      })
  })


  const result = sortBy(Array.from(keys.entries()), ([ key, count ]) => count)
    .map(([ key, count]) => `${key}: ${count}`).join('\n')
  return writeFile(result, outDir + '/abilities.txt')
}

function nonFalseyProps(obj: Object) {
  return Object.keys(obj).filter((key) => !isFalsey(obj[key])).sort()
}

function isFalsey(value: any) {
  if (!value) {
    return true
  }
  if (value === 'false' || value === 'FALSE') {
    return true
  }
  return false
}
