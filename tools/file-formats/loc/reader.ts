import { XMLParser } from 'fast-xml-parser'
import * as fs from 'fs'
import { LocDict, LocDocument } from './types'

export async function readLocalizationFile(file: string): Promise<LocDict> {
  const data = await fs.promises.readFile(file, { encoding: 'utf-8' })
  return parseLocalizationFile(data)
}

export function parseLocalizationFile(data: string | Buffer): LocDict {
  const parser = new XMLParser({
    preserveOrder: false,
    allowBooleanAttributes: true,
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true,
    ignoreAttributes: false,
    attributeNamePrefix: '',
    attributesGroupName: 'props',
    textNodeName: 'value',
    isArray: (tag: string, jPath: string, isLeafNode: boolean, isAttribute: boolean) => {
      return !isAttribute && tag === 'string'
    },
  })
  const doc = parser.parse(data) as LocDocument
  return convertLocalizationDocument(doc)
}

export function convertLocalizationDocument(doc: LocDocument): LocDict {
  const result: LocDict = {}
  for (const entry of doc.resources.string || []) {
    if (!entry.props.key) {
      continue
    }
    if (!entry.value) {
      continue
    }
    const attr: Record<string, string> = {}
    for (const key in entry.props) {
      if (key !== 'key' && entry.props[key]) {
        attr[key] = entry.props[key]
      }
    }
    result[entry.props.key] = {
      value: entry.value,
      attrs: attr,
    }
  }
  return result
}
