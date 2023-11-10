import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { EQUIP_SLOTS, EquipSlotId } from '@nw-data/common'
import { ItemInstance } from '~/data'
import { ItemRecognitionResult } from './item-scanner'

export interface GearImporterState {
  file: File
  slotId: EquipSlotId
  selection: number
  filter: string
  isScanning: boolean
  hasError: boolean
  results: Array<ItemRecognitionResult>
}

@Injectable()
export class GearImporterStore extends ComponentStore<GearImporterState> {
  public readonly itemType$ = this.select(({ slotId }) => EQUIP_SLOTS.find((it) => it.id === slotId)?.itemType)
  public readonly imageFile$ = this.select(({ file }) => file)
  public readonly imageUrl$ = this.select(this.imageFile$, (it) => (it ? URL.createObjectURL(it) : null))
  public readonly selection$ = this.select(({ selection }) => selection)
  public readonly filter$ = this.select(({ filter }) => filter)
  public readonly working$ = this.select(({ isScanning }) => isScanning)

  public readonly result$ = this.select(({ results }) => results)

  public readonly filteredResult$ = this.select(this.filter$, this.result$, (query, results) => {
    if (!query || !results?.length) {
      return results
    }
    query = query.toLowerCase()
    return results.filter((it) => it.name.toLowerCase().includes(query))
  })

  public constructor() {
    super({
      file: null,
      slotId: null,
      isScanning: false,
      hasError: false,
      selection: 0,
      filter: null,
      results: [],
    })
  }
}
