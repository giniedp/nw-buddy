/// <reference lib="webworker" />
import { ItemRarity } from '@nw-data/common'
import { environment } from 'apps/web/environments'
import { expose } from 'comlink'

interface SearchIndex {
  headers: string[]
  records: Array<Array<any>>
}
export interface SearchRecord {
  id: string
  text: string
  type: string
  icons: string
  tier: number
  rarity: ItemRarity
}
export interface SearchQueryTasks {
  search: (args: { text: string; lang: string }) => Promise<SearchRecord[]>
}

const index: Record<string, Promise<any>> = {}

function fetchIndex(lang: string): Promise<SearchRecord[]> {
  if (!index[lang]) {
    index[lang] = fetch(`${environment.nwDataUrl}/search/${lang}.json`)
      .then((res) => res.json())
      .then((index: SearchIndex) => {
        return index.records.map((record) => {
          const item = {}
          for (const i in index.headers) {
            item[index.headers[i]] = record[i]
          }
          return item
        })
      })
  }
  return index[lang]
}

const api: SearchQueryTasks = {
  search: async ({ text, lang }) => {
    text = text.toLocaleLowerCase()
    const records = await fetchIndex(lang).catch(console.error)
    if (!records) {
      return []
    }
    const result = records
      .map((it) => {
        return {
          rank:
            stringSearch((it.text || '').toLocaleLowerCase(), text) +
            stringSearch(String(it.id || '').toLocaleLowerCase(), text),
          record: it,
        }
      })
      .filter((it) => it.rank > 0)
      .sort((a, b) => a.rank - b.rank)
    return result.map((it) => it.record)
  },
}

expose(api)

function stringSearch(hay: string, needle: string) {
  let count = 0
  for (let i = 0; i < hay.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (needle[j] !== hay[i + j]) break
      if (j === needle.length - 1) count++
    }
  }
  return count
}
