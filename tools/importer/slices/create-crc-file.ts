import { writeJSONFile } from '../../utils/file-utils'
import { crc32 } from '../../utils/crc-32'

export async function createCrcFile({ values, targetFile }: { values: string[]; targetFile: string }) {
  const entries = values.map((it) => {
    const value = it.toLowerCase()
    return [crc32(value), value] as const
  })
  return writeJSONFile(entries, targetFile)
}
