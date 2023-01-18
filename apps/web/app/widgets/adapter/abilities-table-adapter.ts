import { Injectable } from '@angular/core'
import { Ability } from '@nw-data/types'
import { ColDef, GridOptions } from 'ag-grid-community'
import { sortBy } from 'lodash'
import { combineLatest, defer, map, Observable, of, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService,  } from '~/nw'
import { NwWeaponType, NwWeaponTypesService } from '~/nw/weapon-types'
import { getWeaponTagLabel } from '~/nw/utils'
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'
import { NwExpressionService } from '~/nw/expression'
import { NW_FALLBACK_ICON, NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE_BASE, NW_MAX_GEAR_SCORE_UPGRADABLE } from '~/nw/utils/constants'

export type AbilityTableItem = Ability & {
  $weaponType: NwWeaponType
}

@Injectable()
export class AbilitiesTableAdapter extends DataTableAdapter<AbilityTableItem> {
  public static provider() {
    return dataTableProvider({
      adapter: AbilitiesTableAdapter,
    })
  }

  public entityID(item: AbilityTableItem): string {
    return item.AbilityID
  }

  public entityCategory(item: AbilityTableItem): DataTableCategory {
    if (!item.WeaponTag) {
      return null
    }
    return {
      value: item.WeaponTag,
      label: this.i18n.get(getWeaponTagLabel(item.WeaponTag)),
      icon: item.$weaponType?.IconPathSmall,
    }
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 62,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: this.info.link('ability', data.AbilityID),
              target: '_blank',
              icon: data.Icon || NW_FALLBACK_ICON,
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          width: 250,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.DisplayName)),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'abilityId',
          headerValueGetter: () => 'Ability ID',
          field: this.fieldName('AbilityID'),
          hide: true,
        }),
        this.colDef({
          colId: 'description',
          headerValueGetter: () => 'Description',
          field: this.fieldName('Description'),
          width: 400,
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic'],
          filterValueGetter: ({ data }) => this.i18n.get(data.Description),
          cellRenderer: this.cellRendererAsync(),
          cellRendererParams: this.cellRendererAsyncParams<string>({
            update: (el, text) => {
              el.innerHTML = text
            },
            source: ({ data, value }) => {
              return this.i18n
                .observe(data.Description)
                .pipe(
                  switchMap((v) => {
                    return this.expr.solve({
                      text: v,
                      charLevel: NW_MAX_CHARACTER_LEVEL,
                      itemId: data.AbilityID,
                      gearScore: NW_MAX_GEAR_SCORE_BASE,
                    })
                  })
                )
                .pipe(map((it) => it.replace(/\\n/gi, '<br>')))
            },
          }),
        }),
        this.colDef({
          colId: 'weaponTag',
          headerValueGetter: () => 'Weapon Tag',
          field: this.fieldName('WeaponTag'),
          valueFormatter: ({ value }) => this.i18n.get(getWeaponTagLabel(value)),
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'source',
          headerValueGetter: () => 'Source',
          valueGetter: this.valueGetter(({ data }) => data['$source']),
          hide: true,
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'attackType',
          headerValueGetter: () => 'Attack Type',
          field: this.fieldName('AttackType'),
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'uiCategory',
          headerValueGetter: () => 'UI Category',
          field: this.fieldName('UICategory'),
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'afterAction',
          headerValueGetter: () => 'After Action',
          field: this.fieldName('AfterAction'),
          filter: SelectboxFilter,
        }),
        this.colDef({
          colId: 'onAction',
          headerValueGetter: () => 'On Action',
          valueGetter: this.valueGetter(({ data }) => {
            const result = Object.keys(data)
              .filter((it) => it.startsWith('On') && !!data[it])
              .map((it) => humanize(it).split(' '))
              .map((it) => it[0] === 'On' ? it.slice(1).join('') : null)
              .filter((it) => !!it)
            return result.length ? result : null
          }),
          cellRenderer: this.cellRendererTags(humanize),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showCondition: true,
            showSearch: true
          })
        }),
      ],
    }).pipe(map((options) => appendFields(options, Array.from(Object.entries(FIELDS)))))
  )

  public entities: Observable<AbilityTableItem[]> = defer(() =>
    combineLatest({
      abilities: this.db.abilities,
      weaponTypes: this.weaponTypes.byTag$,
    })
  )
    .pipe(
      map(({ abilities, weaponTypes }) => {
        return abilities
          .map((it): AbilityTableItem => {
            return {
              ...it,
              $weaponType: weaponTypes.get(it.WeaponTag),
            }
          })
      })
    )
    .pipe(map((list) => sortBy(list, (it) => (!!it.WeaponTag && !!it.DisplayName && !!it.Description) ? -1 : 1)))
    .pipe(shareReplayRefCount(1))

  public constructor(
    private db: NwDbService,
    private i18n: TranslateService,
    private expr: NwExpressionService,
    private weaponTypes: NwWeaponTypesService,
    private info: NwLinkService
  ) {
    super()
  }
}

function appendFields(options: GridOptions, fields: string[][]) {
  for (const [field, type] of fields) {
    const exists = options.columnDefs.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      field: field,
      hide: true,
    }
    colDef.filter = SelectboxFilter
    colDef.filterParams = SelectboxFilter.params({
      showCondition: true,
      showSearch: true,
    })
    if (type.includes('number')) {
      colDef.filter = 'agNumberColumnFilter'
      colDef.filterParams = null
    }
    options.columnDefs.push(colDef)
  }
  return options
}

const FIELDS: Record<keyof Ability, string> = {
  AbilityCooldownComparisonType: 'string',
  AbilityID: 'string',
  AbilityIdToCheckForTrackedHits: 'string',
  AbilityList: 'string',
  AbilityOnCooldownOptions: 'string',
  AbilityTrigger: 'string',
  ActivationCooldown: 'number',
  AfterAction: 'string',
  AllowSelfDamageForHitEvents: 'boolean',
  ArmorPenetration: 'number',
  AttachedTargetSpellIds: 'string',
  AttackType: 'string',
  AttackerVitalsCategory: 'string',
  Azoth: 'number',
  BaseDamage: 'number',
  BaseDamageReduction: 'number',
  BlockDamage: 'number',
  BlockDamageReduction: 'number',
  CDRImmediatelyOptions: 'string',
  CanBeUnapplied: 'boolean',
  CanBlockRangedOverride: 'boolean',
  CastSpell: 'string',
  CheckStatusEffectsOnTargetOwned: 'boolean',
  ConsumableHealMod: 'number',
  ConsumeTargetStatusEffectMult: 'number',
  CooldownId: 'string',
  CooldownTimer: 'number',
  CritChance: 'number',
  CritDamage: 'number',
  CritDamageReduction: 'number',
  DamageCategory: 'string',
  DamageIsMelee: 'boolean',
  DamageIsRanged: 'boolean',
  DamageTableRow: 'string',
  DamageTableRowOverride: 'string',
  DamageTableStatusEffectOverride: 'string',
  DamageTypes: 'string',
  Description: 'string',
  DisableApplyPerStatusEffectStack: 'boolean',
  DisableCastSpellDurability: 'boolean',
  DisableConsecutivePotency: 'boolean',
  DisplayName: 'string',
  DistComparisonType: 'string',
  DistFromDefender: 'number',
  DmgPctToHealth: 'number',
  DoNotUnequipSelfAppliedSE: 'boolean',
  DontHaveStatusEffect: 'string',
  Duration: 'number',
  ElementalArmor: 'number',
  EnableHoldConditionIfTrackedSpellExistsOfType: 'string',
  EnableTaunt: 'boolean',
  EquipLoadCategory: 'string',
  EquipWhenUnsheathed: 'number',
  ExcludeFromGameModes: 'string',
  FastTravelAzothCostMod: 'number',
  FastTravelInnCooldownMod: 'number',
  ForceStatusEffectDamageTableRow: 'boolean',
  GatheringTradeskill: 'string',
  GiveAzothPercentChance: 'number',
  HasGritActive: 'boolean',
  HeadshotArmorPenetration: 'number',
  HeadshotDamage: 'number',
  HealScalingValueMultiplier: 'number',
  HitFromBehindArmorPenetration: 'number',
  HitFromBehindDamage: 'number',
  HoldConditionButtonIcon: 'string',
  Icon: 'string',
  IgnoreDisabledAttackTypes: 'string',
  IgnoreResetConsecutiveOnDeath: 'boolean',
  InAction: 'string',
  InActionTime: 'number',
  IsActiveAbility: 'boolean',
  IsGlobalAbility: 'boolean',
  IsInCombatState: 'boolean',
  IsNonCombatAbility: 'boolean',
  IsNotConsumableIds: 'string',
  IsNotInCombatState: 'boolean',
  IsStackableAbility: 'boolean',
  Knockback: 'number',
  LinearlyScaleToDistance: 'number',
  LoadedAmmoCount: 'number',
  LoadedAmmoCountComparisonType: 'string',
  Mana: 'number',
  ManaCostList: 'string',
  ManaCostMult: 'number',
  MaxConsecutiveHits: 'number',
  MaxHealth: 'number',
  MaxHitCountMultiplier: 'number',
  MaxMana: 'number',
  MaxNumAroundMe: 'number',
  MaxTrackedHitCounts: 'number',
  ModifySelfApplyStatusEffectDuration: 'number',
  MyComparisonType: 'string',
  MyHealthPercent: 'number',
  MyManaComparisonType: 'string',
  MyManaPercent: 'number',
  MyMarker: 'string',
  MyStaminaComparisonType: 'string',
  MyStaminaPercent: 'number',
  NumAroundComparisonType: 'string',
  NumAroundMe: 'number',
  NumConsecutiveHits: 'number',
  NumFreeCooldownsPerUse: 'number',
  NumStatusEffectStacksToRemove: 'number',
  NumStatusEffectsToRemove: 'number',
  NumStatusEffectsToTransfer: 'number',
  NumSuccessfulHits: 'number',
  NumTargetStatusEffectsToRemove: 'number',
  NumberOfHitsComparisonType: 'string',
  NumberOfTrackedHits: 'number',
  OnAttachedSpellTargetDied: 'boolean',
  OnBlockBreak: 'boolean',
  OnBlockedHit: 'boolean',
  OnBlockedHitTaken: 'boolean',
  OnContributedKill: 'boolean',
  OnCrit: 'boolean',
  OnCritTaken: 'boolean',
  OnDeath: 'boolean',
  OnDeathsDoor: 'boolean',
  OnEquipStatusEffect: 'string',
  OnEventConditionalActivationChance: 'boolean',
  OnEventPassiveConditionsPass: 'boolean',
  OnExecuted: 'boolean',
  OnFatalDamageTaken: 'boolean',
  OnGatheringComplete: 'boolean',
  OnHasDied: 'boolean',
  OnHeadShot: 'boolean',
  OnHealed: 'boolean',
  OnHealthChanged: 'boolean',
  OnHit: 'boolean',
  OnHitBehind: 'boolean',
  OnHitTaken: 'boolean',
  OnHitTakenWhileInvulnerable: 'boolean',
  OnInActionLongEnough: 'boolean',
  OnKill: 'boolean',
  OnLegShot: 'boolean',
  OnProjPassedThrough: 'boolean',
  OnSelfDamage: 'boolean',
  OnStatusEffectApplied: 'boolean',
  OnTargetBlockBreak: 'boolean',
  OnTargetSet: 'boolean',
  OnTargetStatusEffectRemoved: 'boolean',
  OnUsedConsumable: 'boolean',
  OnWeaponSwap: 'boolean',
  OnlyChangeOwnedStatusEffects: 'boolean',
  OtherApplyStatusEffect: 'string',
  PerStatusEffectOnSelf: 'boolean',
  PerStatusEffectOnSelfMax: 'number',
  PerStatusEffectOnTarget: 'boolean',
  PerStatusEffectOnTargetMax: 'number',
  PhysicalArmor: 'number',
  PhysicalArmorMaxHealthMod: 'number',
  PowerLevelOverride: 'number',
  RangedAttackName: 'string',
  RangedAttackNameOverride: 'string',
  RefundAmmoPercentChance: 'number',
  RefundConsumablePercentChance: 'number',
  RemoteDamageTableRow: 'string',
  RemoveStatusEffects: 'string',
  RemoveTargetStatusEffectCats: 'string',
  RemoveTargetStatusEffectsList: 'string',
  RepairDustYieldMod: 'number',
  RequireReaction: 'string',
  RequiredAbilityId: 'string',
  RequiredEquippedAbilityId: 'string',
  ResetConsecutiveOnSuccess: 'number',
  ResetConsumableCooldowns: 'string',
  ResetCooldownTimers: 'string',
  ResetTrackedOnSuccess: 'boolean',
  SelfApplyStatusEffect: 'string',
  SelfApplyStatusEffectDurations: 'number',
  SetHealthOnFatalDamageTaken: 'number',
  SetMannequinTag: 'string',
  SetMannequinTagStatus: 'boolean',
  Sound: 'string',
  StaggerDamage: 'number',
  StaggerDamageReduction: 'number',
  Stamina: 'number',
  StaminaCostFlatMod: 'number',
  StaminaCostList: 'string',
  StatusEffect: 'string',
  StatusEffectBeingApplied: 'string',
  StatusEffectCategories: 'string',
  StatusEffectCategoriesList: 'string',
  StatusEffectCategoryToTransfer: 'string',
  StatusEffectComparison: 'string',
  StatusEffectDamageTableIdForRowOverride: 'string',
  StatusEffectDamageTableRowOverride: 'string',
  StatusEffectDurationCats: 'string',
  StatusEffectDurationMod: 'number',
  StatusEffectDurationMult: 'number',
  StatusEffectDurationReduction: 'number',
  StatusEffectStackSize: 'number',
  StatusEffectsList: 'string',
  TargetCollisionFilters: 'string',
  TargetComparisonType: 'string',
  TargetHasGritActive: 'boolean',
  TargetHealthPercent: 'number',
  TargetMarker: 'string',
  TargetStatusEffect: 'string',
  TargetStatusEffectCategory: 'string',
  TargetStatusEffectComparison: 'string',
  TargetStatusEffectDurationCats: 'string',
  TargetStatusEffectDurationList: 'string',
  TargetStatusEffectDurationMod: 'number',
  TargetStatusEffectDurationMult: 'number',
  TargetStatusEffectStackSize: 'number',
  TargetVitalsCategory: 'string',
  ThreatDamage: 'number',
  ToolDurabilityLossMod: 'number',
  TrackHitCount: 'boolean',
  TreeColumnPosition: 'number',
  TreeId: 'number',
  TreeRowPosition: 'number',
  UICategory: 'string',
  UISpellForManaCheck: 'string',
  UnlockDefault: 'boolean',
  UseMinAttackInfoForSelfAppliedSE: 'boolean',
  WeaponAccuracy: 'number',
  WeaponTag: 'string',
}
