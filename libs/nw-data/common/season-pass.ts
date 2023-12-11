import { SeasonPassData } from '../generated/types'

export function getSeasonPassDataId(item: SeasonPassData) {
  return [item['$source'], item.Level].join('-').toLowerCase()
}
