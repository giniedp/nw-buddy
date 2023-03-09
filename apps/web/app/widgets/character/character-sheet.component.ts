import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { combineLatest } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-character-sheet',
  templateUrl: './character-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'layout-content',
  },
})
export class CharacterSheetComponent {

  public vm$ = combineLatest({
    name: this.store.name$,
    level: this.store.level$,
    serverName: this.store.serverName$,
    companyName: this.store.companyName$,
    faction: this.store.faction$,
  })

  public constructor(private store: CharacterStore) {
    //
  }
}
