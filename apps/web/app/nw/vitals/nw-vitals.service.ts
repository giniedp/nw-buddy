import { Injectable } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { defer } from 'rxjs'
import { NwDbService } from '../nw-db.service'
import { getVitalFamilyInfo, getVitalTypeMarker } from '../utils/vitals'

@Injectable({ providedIn: 'root' })
export class NwVitalsService {
  public all$ = defer(() => this.db.vitals)
  public byId$ = defer(() => this.db.vitalsMap)

  public iconStronattack = 'assets/icons/strongattack.png'
  public iconWeakattack = 'assets/icons/weakattack.png'

  public constructor(private db: NwDbService) {}

  public vitalMarkerIcon(vital: Vitals) {
    return getVitalTypeMarker(vital)
  }

  public vitalFamilyIcon(vital: Vitals) {
    return getVitalFamilyInfo(vital)?.Icon
  }
}
