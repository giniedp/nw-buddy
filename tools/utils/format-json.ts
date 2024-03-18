import { format } from 'prettier'

export async function jsonStringifyFormatted(object: Object): Promise<string> {
  return format(JSON.stringify(object), { parser: 'json' })
}

export async function formatTs(data: string): Promise<string> {
  return format(data, { parser: 'typescript' })
}
