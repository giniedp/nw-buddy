import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { PerkSlotExplained } from './selectors'

@Injectable()
export class ItemEditorEventsService {
  public editGearScore = new Subject<MouseEvent>()
  public editPerk = new Subject<PerkSlotExplained>()
}
