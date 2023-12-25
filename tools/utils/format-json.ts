import { format } from 'prettier'

export async function jsonStringifyFormatted(object: Object): Promise<string> {
  return format(JSON.stringify(object), { parser: 'json' })
}
