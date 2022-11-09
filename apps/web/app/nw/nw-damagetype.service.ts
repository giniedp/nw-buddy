import { Injectable } from '@angular/core'
import { Damagetypes } from '@nw-data/types'
import { groupBy } from 'lodash'
import { defer, map, of } from 'rxjs'
import { shareReplayRefCount } from '../utils'
import { NwDbService } from './nw-db.service'

const ICON_MAP: Record<string, string> = {
  Acid: '',
  Arcane: 'icon_tooltip_arcane_opaque',
  Brimstone: '',
  Corruption: 'icon_tooltip_corruption_opaque',
  Falling: 'icon_tooltip_falling_opaque',
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

const WARD_ICON: Record<string, string> = {
  Ancient: 'ancientward1',
  Corrupted: 'corruptedward1',
  AngryEarth: 'angryearthward1',
  Lost: 'lostward1',
  Bestial: 'bestialward1',
}

export interface WeaponTypes {
  WeaponTypeID: string
  GroupName: string
  IconPath: string
  DamageType: string
}

const WEAPON_TYPES: Array<WeaponTypes> = [
  {
    WeaponTypeID: 'Hatchets',
    GroupName: 'Hatchets_GroupName',
    DamageType: 'Slash',
    IconPath: 'assets/icons/weapons/1hhatchetsmall.png',
  },
  {
    WeaponTypeID: 'Rapiers',
    GroupName: 'Rapiers_GroupName',
    DamageType: 'Thrust',
    IconPath: 'assets/icons/weapons/1hrapiersmall.png',
  },
  {
    WeaponTypeID: 'Swords',
    GroupName: 'Swords_GroupName',
    DamageType: 'Slash',
    IconPath: 'assets/icons/weapons/1hswordsmall.png',
  },
  {
    WeaponTypeID: 'WarHammers',
    GroupName: 'WarHammers_GroupName',
    DamageType: 'Strike',
    IconPath: 'assets/icons/weapons/2hdemohammersmall.png',
  },
  {
    WeaponTypeID: 'GreatAxe',
    GroupName: 'GreatAxe_GroupName',
    DamageType: 'Slash',
    IconPath: 'assets/icons/weapons/2hgreataxesmall.png',
  },
  {
    WeaponTypeID: 'Muskets',
    GroupName: 'Muskets_GroupName',
    DamageType: 'Thrust',
    IconPath: 'assets/icons/weapons/2hmusketasmall.png',
  },
  {
    WeaponTypeID: 'Bows',
    GroupName: 'Bows_GroupName',
    DamageType: 'Thrust',
    IconPath: 'assets/icons/weapons/bowbsmall.png',
  },
  {
    WeaponTypeID: 'Spears',
    GroupName: 'Spears_GroupName',
    DamageType: 'Thrust',
    IconPath: 'assets/icons/weapons/spearasmall.png',
  },
  {
    WeaponTypeID: 'StavesFire',
    GroupName: 'StavesFire_GroupName',
    DamageType: 'Fire',
    IconPath: 'assets/icons/weapons/stafffiresmall.png',
  },
  {
    WeaponTypeID: 'StavesLife',
    GroupName: 'StavesLife_GroupName',
    DamageType: 'Nature',
    IconPath: 'assets/icons/weapons/stafflifesmall.png',
  },
  {
    WeaponTypeID: 'GauntletVoid',
    GroupName: 'GauntletVoid_GroupName',
    DamageType: 'Corruption',
    IconPath: 'assets/icons/weapons/voidgauntletsmall.png',
  },
  {
    WeaponTypeID: 'GauntletIce',
    GroupName: 'GauntletIce_GroupName',
    DamageType: 'Ice',
    IconPath: 'assets/icons/weapons/icegauntletsmall.png',
  },
  {
    WeaponTypeID: 'Blunderbuss',
    GroupName: 'Blunderbuss_GroupName',
    DamageType: 'Thrust',
    IconPath: 'assets/icons/weapons/blunderbusssmall.png',
  },
]

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

  public weaponTypes = defer(() => of(WEAPON_TYPES)).pipe(shareReplayRefCount(1))

  public damageTypeToWeaponType = defer(() => this.weaponTypes).pipe(
    map((table) => groupBy(table, (it) => it.DamageType))
  )

  public constructor(private db: NwDbService) {
    //
  }

  public damageTypeIdIcon(type: string) {
    return `assets/icons/tooltip/${ICON_MAP[type] || 'icon_unknown'}.png`
  }

  public wardTypeIcon(type: string) {
    if (WARD_ICON[type]) {
      return `assets/icons/families/${WARD_ICON[type]}.png`
    }
    return ''
  }

  public damageTypeIcon(type: Damagetypes) {
    return this.damageTypeIdIcon(type?.TypeID)
  }
}
