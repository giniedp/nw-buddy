import { Injectable, Optional } from '@angular/core'
import { Spelltable } from '@nw-data/types'
import { ColDef, GridOptions } from 'ag-grid-community'
import { defer, map, Observable, of } from 'rxjs'
import { NwDbService } from '~/nw'
import { SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableAdapterOptions, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize } from '~/utils'

@Injectable()
export class SpellsTableAdapter extends DataTableAdapter<Spelltable> {
  public static provider(config?: DataTableAdapterOptions<Spelltable>) {
    return dataTableProvider({
      adapter: SpellsTableAdapter,
      options: config
    })
  }

  public entityID(item: Spelltable): string {
    return item.SpellID
  }

  public entityCategory(item: Spelltable): DataTableCategory {
    return {
      icon: null,
      label: item['$source'],
      value: item['$source']
    }

  }
  public override get persistStateId(): string {
    return this.config?.persistStateId
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'spellID',
          headerValueGetter: () => 'ID',
          field: this.fieldName('SpellID'),
        }),
      ],
    })
  ).pipe(map((options) => {
    appendFields(options.columnDefs, Array.from(Object.entries(FIELDS)))
    return options
  }))

  public entities: Observable<Spelltable[]> = defer(() => this.db.spells)

  public constructor(
    private db: NwDbService,
    @Optional()
    private config: DataTableAdapterOptions<Spelltable>,
  ) {
    super()
  }
}


function appendFields(columns: Array<ColDef>, fields: string[][]) {
  for (const [field, type] of fields) {
    const exists = columns.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      valueGetter: ({ data }) => data[field],
      hide: true,
    }
    colDef.filter = SelectFilter
    colDef.filterParams = SelectFilter.params({
      showSearch: true,
    })
    if (type.includes('number')) {
      colDef.filter = 'agNumberColumnFilter'
      colDef.filterParams = null
    }
    columns.push(colDef)
  }
}

const FIELDS: Record<keyof Spelltable, string> = {
  AbilityId: 'string',
  AmmoSlot: 'string',
  AttachProjectileOnCollision: 'boolean',
  AttachToOwner: 'boolean',
  BaseDamage: 'number',
  BeamEffect: 'string',
  CastDistance: 'number',
  CastHeight: 'number',
  CastRadius: 'number',
  CastingTypes: 'string',
  ChainDelayDuration: 'number',
  ChannelTime: 'number',
  CharRelPosOffsetX: 'number',
  CharRelPosOffsetY: 'number',
  CharRelPosOffsetZ: 'number',
  CharRelRotOffsetX: 'number',
  CharRelRotOffsetY: 'number',
  CharRelRotOffsetZ: 'number',
  CheckObstructions: 'boolean',
  ClearOnEnd: 'boolean',
  ClearOnExit: 'boolean | string',
  ConeAngle: 'number',
  ConeWidth: 'number',
  DamageTable: 'string',
  DamageTableRow: 'string',
  DamageType: 'string',
  Duration: 'number',
  EndOnCasterDeath: 'boolean',
  EvenlyDistributeMeteorSpawns: 'boolean',
  FireJointName: 'string',
  Height: 'number',
  HitAiTarget: 'boolean',
  IgnoreOverheadCollision: 'boolean',
  IgnoreRotationForSecondaryProjectileLaunchZSpd: 'boolean',
  IgnoreSelf: 'boolean',
  IgnoreStructures: 'boolean',
  IgnoreTargetIfAtDeathsDoor: 'boolean',
  IgnoreTargetIfDead: 'boolean',
  InnerRadius: 'number',
  IsUnaffiliated: 'boolean',
  Length: 'number',
  MaintainDistanceFromGround: 'boolean',
  ManaCost: 'string',
  MaxChainNum: 'number',
  MaxRadiusScaling: 'string',
  NumToSpawn: 'number',
  NumToSpawnBeforeFail: 'number',
  OverrideTargetForAiThreat: 'boolean',
  ProjPosOffsetX: 'number',
  ProjPosOffsetY: 'number',
  ProjPosOffsetZ: 'number',
  ProjRaycastOrientation: 'string',
  ProjRotOffsetX: 'number',
  ProjRotOffsetY: 'number',
  ProjRotOffsetZ: 'number',
  Radius: 'number',
  RadiusScaling: 'number',
  RangedAttackName: 'string',
  RangedAttackProfile: 'string',
  Revive: 'boolean',
  ScaleWithCharacterBoundingBox: 'boolean',
  ScaleWithDynamicScale: 'boolean',
  SecondaryPrefabPath: 'string',
  SecondaryProjectileLaunchMaxZSpeeds: 'string',
  SecondaryProjectileLaunchMinZSpeeds: 'string',
  SecondaryProjectileLaunchZOffset: 'number',
  SecondarySpellID: 'string',
  SecondarySpellProjectileLaunchAngles: 'string',
  ShapeTypes: 'string',
  Siphon: 'boolean',
  SpawnAngle: 'number',
  SpawnBeamCasterJoint: 'string',
  SpawnRate: 'number',
  SpawnSecondaryOnCollision: 'boolean',
  SpawnSecondaryOnElapsed: 'boolean',
  SpawnSecondaryOnPassthrough: 'boolean',
  SpellID: 'string',
  SpellPrefabPath: 'string',
  SpellTypes: 'string',
  StatusEffectDurations: 'number | string',
  StatusEffects: 'string',
  StickWhenAttached: 'boolean',
  StoreOffsetWhenStuckToGDE: 'boolean',
  TargetAbilityCondition: 'string',
  TargetTypes: 'string',
  TertiarySpellID: 'string',
  TrackNumInVolume: 'boolean',
  UseCameraTargetLock: 'boolean',
  UseChainCasterPaperdoll: 'boolean',
  UseDirectTargetAsAttachOwner: 'boolean',
  UseStatusEffectDuration: 'boolean',
  WeaponSlotOverride: 'string',
}

