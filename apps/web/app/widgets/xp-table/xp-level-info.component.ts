import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { combineLatest, map } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwDbService } from '~/nw'

function accumulate<T>(data: T[], startIndex: number, endIndex: number, key: keyof T) {
  let result = 0
  for (let i = startIndex; i <= endIndex; i++) {
    result += (data[i] as any)[key] as number
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

  protected data$ = combineLatest({
    level: this.char.level$,
    data: this.db.xpAmounts,
  }).pipe(
    map(({ level, data }) => {

      const row = data[level - 1]
      const next = data[level]
      const xpTotal = accumulate(data, 0, data.length - 1, 'XPToLevel')
      const xpAmount = accumulate(data, 0, level - 1, 'XPToLevel')
      const xpToLast = xpTotal - xpAmount

      return {
        level: level,
        xpToNext: next?.XPToLevel,
        xpToNextPercent: (next?.XPToLevel / xpTotal) || null,
        xpToLast: xpToLast,
        xpToLastPercent: xpToLast / xpTotal,
        xpAmount: xpAmount,
        xpAmountPercent: xpAmount / xpTotal,
        attributePoints: accumulate(data, 0, level - 1, 'AttributePoints'),
        respecCosts: row.AttributeRespecCost / 100,
        maxEquipGs: row.MaxEquippableGearScore
      }
    })
  )
  public constructor(private char: CharacterStore, private db: NwDbService) {}
}
