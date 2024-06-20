import { SeasonPassRankData } from '../generated/types'

export function getSeasonPassDataId(item: SeasonPassRankData) {
  return [item['$source'], item.Level].join('-').toLowerCase()
}
