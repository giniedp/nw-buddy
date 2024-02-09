import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { CharacterStore, NwDataService } from '~/data'

function accumulate<T>(data: T[], startIndex: number, endIndex: number, key: keyof T) {
  let result = 0
  for (let i = startIndex; i <= endIndex; i++) {
    if (i <= data.length - 1) {
      result += (data[i] as any)[key] as number
    }
  }
  return result
}

@Component({
  standalone: true,
  selector: 'nwb-xp-level-info',
  templateUrl: './xp-level-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'block',
  },
})
export class XpLevelInfoComponent {
  private level = toSignal(inject(CharacterStore).level$, {
    initialValue: NW_MAX_CHARACTER_LEVEL,
  })

  private data = toSignal(inject(NwDataService).xpAmounts, {
    initialValue: [],
  })

  protected stats = computed(() => {
    const level = this.level()
    const data = this.data()

    const currentRow = data[level - 1]
    const nextRow = data[level]
    const endRow = data[data.length - 1]

    const xpCurrent = currentRow?.XPToLevel ?? 0
    const xpNext = nextRow?.XPToLevel ?? xpCurrent
    const xpEnd = endRow?.XPToLevel ?? xpCurrent

    const xpAmount = xpCurrent - (data[level - 1]?.XPToLevel || 0)
    const xpToMax = xpCurrent - xpAmount

    return {
      level: level,
      xpCurrent: xpCurrent,
      xpToNext: xpNext - xpCurrent,
      xpToMax: xpEnd - xpCurrent,
      xpToMaxPercent: (xpEnd - xpCurrent) / xpEnd,
      attributePoints: accumulate(data, 0, level - 1, 'AttributePoints'),
      respecCosts: (currentRow?.AttributeRespecCost ?? 0) / 100,
      maxEquipGs: currentRow?.MaxEquippableGearScore ?? 0,
    }
  })

  protected get attributePoints() {
    return this.stats().attributePoints
  }

  protected get respecCosts() {
    return this.stats().respecCosts
  }

  protected get maxEquipGs() {
    return this.stats().maxEquipGs
  }

  protected get currentLevel() {
    return this.stats().level
  }

  protected get maxLevel() {
    return NW_MAX_CHARACTER_LEVEL
  }

  protected get xpToMax() {
    return this.stats().xpToMax
  }

  protected get xpToNext() {
    return this.stats().xpToNext
  }

  protected get xpToMaxPercent() {
    return this.stats().xpToMaxPercent
  }
}
