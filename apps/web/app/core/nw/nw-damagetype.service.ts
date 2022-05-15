import { Injectable } from '@angular/core'
import { Damagetypes } from '@nw-data/types';
import { NwDbService } from './nw-db.service';

const ICON_MAP: Record<string, string> = {
  Arcane: 'icon_tooltip_arcane_opaque',
  Corruption: 'icon_tooltip_corruption_opaque',
  Fire: 'icon_tooltip_fire_opaque',
  Ice: 'icon_tooltip_ice_opaque',
  Lightning: 'icon_tooltip_lightning_opaque',
  Nature: 'icon_tooltip_nature',
  Siege: 'icon_tooltip_siege_opaque',
  Slash: 'icon_tooltip_slash_opaque',
  Standard: 'icon_tooltip_standard_opaque',
  Strike: 'icon_tooltip_strike_opaque',
  Thrust: 'icon_tooltip_thrust_opaque',
}

@Injectable({
  providedIn: 'root',
})
export class NwDamagetypeService {

  public get damagetypes() {
    return this.db.damagetypes
  }

  public get damagetypesMap() {
    return this.db.damagetypesMap
  }

  public get damageTypeToWeaponType() {
    return this.db.viewDamageTypeToWeaponType
  }

  public constructor(private db: NwDbService) {

  }

  public damageTypeIdIcon(type: string) {
    return `assets/icons/tooltip/${ICON_MAP[type] || 'icon_unknown'}.png`
  }

  public damageTypeIcon(type: Damagetypes) {
    return this.damageTypeIdIcon(type?.TypeID)
  }
}
