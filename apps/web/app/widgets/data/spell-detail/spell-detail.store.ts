import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { SpellData } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'
import { rejectKeys } from '~/utils'

export interface SpellDetailState {
  spellId: string
  spell: SpellData
}

export const SpellDetailStore = signalStore(
  withState<SpellDetailState>({
    spellId: null,
    spell: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async (spellId: string) => {
        return {
          spellId,
          spell: await db.spellsById(spellId),
        }
      },
    }
  }),
  withComputed(({ spell }) => {
    return {
      properties: computed(() => selectProperties(spell())),
    }
  }),
)

function selectProperties(item: SpellData) {
  const reject: Array<keyof SpellData> = ['SpellPrefabPath']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key) || key.startsWith('$'))
}
