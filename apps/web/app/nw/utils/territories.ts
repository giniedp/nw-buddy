import { Territorydefinitions } from "@nw-data/types"

export function territoryImage(territory: Territorydefinitions, type: 'territory' | 'settlement' | 'fort') {
  let id: string | number = territory?.TerritoryID
  if (!(Number(id) >= 2 && Number(id) <= 16)) {
    id = '_default'
  }
  if (type !== 'territory' && !territoryHasFort(territory)) {
    id = '_default'
  }
  return `assets/icons/territories/mappanel_${type}${id}.png`
}

export function territoryHasFort(territory: Territorydefinitions) {
  return territory?.FactionControlBuff !== 'None'
}
