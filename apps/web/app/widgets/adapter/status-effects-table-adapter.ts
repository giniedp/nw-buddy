import { Inject, Injectable, Optional } from '@angular/core'
import { Perks, Statuseffect } from '@nw-data/types'
import { ColDef, GridOptions } from 'ag-grid-community'
import { sortBy } from 'lodash'
import { defer, map, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwLinkService, NwService } from '~/nw'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableAdapterOptions, dataTableProvider } from '~/ui/data-table'
import { CaseInsensitiveMap, humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class StatusEffectsTableAdapterConfig extends DataTableAdapterOptions<Statuseffect> {
  //
}

@Injectable()
export class StatusEffectsTableAdapter extends DataTableAdapter<Statuseffect> {
  public static provider(config?: StatusEffectsTableAdapterConfig) {
    return dataTableProvider({
      adapter: StatusEffectsTableAdapter,
      options: config,
    })
  }

  public entityID(item: Statuseffect): string {
    return item.StatusID
  }

  public entityCategory(item: Statuseffect): string {
    return item['$source']
  }

  public override get persistStateId(): string {
    return this.config?.persistStateId
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      suppressAnimationFrame: true,
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
              href: this.info.link('status-effect', data.StatusID),
              target: '_blank',
              icon: data.PlaceholderIcon || data['IconPath'] || NW_FALLBACK_ICON,
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'statusID',
          headerValueGetter: () => 'Status ID',
          hide: true,
          field: this.fieldName('StatusID'),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.DisplayName) || data.StatusID),
          width: 300,
        }),
        this.colDef({
          colId: 'description',
          headerValueGetter: () => 'Description',
          width: 300,
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
          valueGetter: ({ data }) => this.i18n.get(data.Description),
          cellRenderer: this.cellRendererAsync(),
          cellRendererParams: this.cellRendererAsyncParams<string>({
            source: ({ data, value }) =>
              this.nw.expression.solve({
                text: value,
                charLevel: 60,
                itemId: data.Description,
                gearScore: 600,
              }),
            update: (el, text) => {
              el.innerHTML = this.makeLineBreaks(text)
            },
          }),
        }),
        this.colDef({
          colId: 'baseDuration',
          headerValueGetter: () => 'Duration',
          field: this.fieldName('BaseDuration'),
        }),
        this.colDef({
          colId: 'effectCategories',
          headerValueGetter: () => 'Effect Categories',
          field: this.fieldName('EffectCategories'),
          autoHeight: true,
          filter: SelectboxFilter,
          cellRenderer: this.cellRendererTags(humanize),
          filterParams: SelectboxFilter.params({
            showCondition: true,
            conditionAND: true,
            showSearch: true,
          }),
        }),
      ],
    }).pipe(
      map((options) => {
        return appendFields(options, Array.from(Object.entries(EFFECT_FIELDS)))
      })
    )
  )

  public entities: Observable<Statuseffect[]> = defer(() => {
    return this.config?.source || this.nw.db.statusEffects
  })
    .pipe(map((list) => sortBy(list, (it) => it.StatusID)))
    .pipe(map((list) => sortBy(list, (it) => (it.Description ? -1 : 1))))
    .pipe(shareReplayRefCount(1))

  public constructor(
    private nw: NwService,
    private i18n: TranslateService,
    private info: NwLinkService,
    @Inject(DataTableAdapterOptions)
    @Optional()
    private config: StatusEffectsTableAdapterConfig
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

const EFFECT_FIELDS: Record<keyof Statuseffect, string> = {
  AllowAddIfDead: 'boolean',
  ABABleed: 'number',
  ABABlight: 'number',
  ABACurse: 'number',
  ABADisease: 'number',
  ABAFrostbite: 'number',
  ABAPoison: 'number',
  ABSAcid: 'number',
  ABSArcane: 'number',
  ABSCorruption: 'number',
  ABSFire: 'number',
  ABSIce: 'number',
  ABSLightning: 'number',
  ABSNature: 'number',
  ABSSiege: 'number',
  ABSSlash: 'number',
  ABSStandard: 'number',
  ABSStrike: 'number',
  ABSThrust: 'number',
  ABSVitalsCategory: 'number | string',
  AFABleed: 'number',
  AFABlight: 'number',
  AFACurse: 'number',
  AFADisease: 'number',
  AFAFrostbite: 'number',
  AFAPoison: 'number',
  AddOnStackSize: 'number',
  AddOnStackSizeComparison: 'string',
  Afflictions: 'string',
  AllowSelfOnlyAsSourceForAbilities: 'boolean',
  ApplicationCooldown: 'number',
  AzothMod: 'number',
  BLAArcane: 'number',
  BLACorruption: 'number',
  BLAFire: 'number',
  BLAIce: 'number',
  BLALightning: 'number',
  BLASiege: 'number',
  BLASlash: 'number',
  BLAStandard: 'number',
  BLAStrike: 'number',
  BLAThrust: 'number',
  BaseDuration: 'number',
  BlockMultipleEffectsFromSameSource: 'boolean',
  CastSpell: 'string',
  CoreTempMod: 'number',
  CritChanceModifier: 'number',
  DMGArcane: 'number',
  DMGCorruption: 'number',
  DMGFire: 'number',
  DMGIce: 'number',
  DMGLightning: 'number',
  DMGNature: 'number',
  DMGSiege: 'number',
  DMGSlash: 'number',
  DMGStandard: 'number',
  DMGStrike: 'number',
  DMGThrust: 'number',
  DMGVitalsCategory: 'number | string',
  DMGVitalsCategory_Tooltip: 'number',
  DamageSkipsDeathsDoor: 'boolean',
  DamageType: 'string',
  DelayInitialTick: 'boolean | number | string',
  Description: 'string',
  DisableAllNonAttributePerks: 'boolean',
  DisableAllNonAttributePerksExceptionLabels: 'string',
  DisableCastSpellDurability: 'boolean',
  DisableSupportContributionRewards: 'boolean',
  DisableTelemetry: 'boolean | string',
  DisplayName: 'string',
  DontApplyOnEndEffectOnRemove: 'boolean',
  DontApplyOnEndEffectOnTimeOutDeath: 'boolean',
  DontReplaceStack: 'boolean',
  Drink: 'number',
  DrinkBurn: 'number',
  DurationMax: 'number',
  DynamicModelScaleFactor: 'number',
  DynamicModelScaleRampTimeSecs: 'number',
  EFFHarvesting: 'number',
  EFFLogging: 'number',
  EFFMining: 'number',
  EFFSkinning: 'number',
  EXPFishing: 'number',
  EXPHarvesting: 'number',
  EXPLeatherworking: 'number',
  EXPLogging: 'number',
  EXPMining: 'number',
  EXPSkinning: 'number',
  EXPSmelting: 'number',
  EXPStonecutting: 'number',
  EXPWeaving: 'number',
  EXPWoodworking: 'number | string',
  EffectCategories: 'string[]',
  EffectDurationMods: 'string',
  EffectPotencyMods: 'string',
  Encumbrance: 'number',
  EquipAbility: 'string',
  FactionReputationMod: 'number',
  FactionTokensMod: 'number',
  FishSizeRollModifier: 'number',
  FishingLineStrength: 'number',
  Food: 'number',
  FoodBurn: 'number',
  ForceReplicateToRemotes: 'boolean',
  FromAlchemy: 'number',
  FromSpell: 'number',
  FxScriptOff: 'string',
  FxScriptOn: 'string',
  GameEventId: 'string',
  GlobalRollMod: 'number',
  GrantSanctuary: 'number',
  HealMod: 'number',
  HealRewardGameEventId: 'string',
  HealRewardThreshold: 'number',
  HealScalingValueMultiplier: 'number | string',
  HealThreatMultiplier: 'number',
  Health: 'number',
  HealthMin: 'number',
  HealthModifierBasePercent: 'number',
  HealthModifierDamageBased: 'number',
  HealthModifierPercent: 'number',
  HealthRate: 'number',
  HideHudDurationNumbers: 'boolean',
  HidesOtherStatusEffectIcons: 'boolean',
  HitCondition: 'string',
  INSLogging: 'number',
  INSMining: 'number',
  IgnoreDiminishingReturns: 'boolean | string',
  IgnoreFxScriptWhenPotencyIsZero: 'boolean',
  IgnoreInvulnerable: 'boolean',
  InheritDuration: 'boolean | number | string',
  InheritTotalDuration: 'boolean | string',
  IsClientPredicted: 'boolean | number | string',
  IsNegative: 'boolean | string',
  IsTrueDamage: 'boolean',
  ItemClassWeightMods: 'string',
  ItemLootVolumeMods: 'string',
  KeepOnTickEffectOnEnd: 'boolean',
  LootTags: 'string',
  MGSArcana: 'number',
  MGSArmoring: 'number',
  MGSEngineering: 'number',
  MGSJewelcrafting: 'number',
  MGSWeaponsmithing: 'number',
  MODConstitution: 'number',
  MODDexterity: 'number',
  MODFocus: 'number',
  MODIntelligence: 'number',
  MODStrength: 'number',
  MULTFishing: 'number',
  MULTHarvesting: 'number',
  MULTLogging: 'number',
  MULTMining: 'number',
  MULTSkinning: 'number',
  Mana: 'number',
  ManaModifierDamageBased: 'number',
  ManaRate: 'number',
  MaxGSArcana: 'number',
  MaxGSArmoring: 'number',
  MaxGSEngineering: 'number',
  MaxGSJewelcrafting: 'number',
  MaxGSWeaponsmithing: 'number',
  MaxHealthMod: 'number',
  MoveSpeedMod: 'number',
  NoDodge: 'number',
  NoHealthRegen: 'number',
  NoNav: 'number',
  NoRun: 'number',
  NoSprint: 'number',
  NonConsumableHealMod: 'number',
  'NotCombatAction ': 'string',
  Notes: 'string',
  Notification: 'string',
  OnDeathStatusEffect: 'string',
  OnEndStatusEffect: 'string',
  OnHitAffixes: 'string',
  OnStackStatusEffect: 'string',
  OnTickStatusEffect: 'string',
  OverrideOtherNameplateText: 'boolean',
  PlaceholderIcon: 'string',
  PotencyMax: 'number',
  PotencyPerLevel: 'number',
  PreventPassiveAbilitiesOnEquip: 'boolean',
  RESBleed: 'number',
  RESBlight: 'number',
  RESCurse: 'number',
  RESDisease: 'number',
  RESFrostbite: 'number',
  RESPoison: 'number',
  ROLCooking: 'number',
  ROLFishing: 'number',
  ROLHarvesting: 'number',
  ROLLeatherworking: 'number',
  ROLLogging: 'number',
  ROLMining: 'number',
  ROLSkinning: 'number',
  ROLSmelting: 'number',
  ROLStonecutting: 'number',
  ROLWeaving: 'number',
  ROLWoodworking: 'number',
  RankSorting: 'number',
  ReapplyAfterPersistenceReload: 'boolean',
  RefreshDuration: 'boolean | string',
  RemoveEffectModsOnInactive: 'boolean',
  RemoveOnDeath: 'number | string',
  RemoveOnDeathsDoor: 'number | string',
  RemoveOnGameModeExit: 'number | string',
  RemoveOnRespawn: 'number',
  RemoveStatusEffectCategories: 'string',
  RemoveStatusEffects: 'string',
  RemoveUnappliedStacks: 'boolean | string',
  RequireReaction: 'boolean',
  RespecAttributes: 'number',
  RespecTradeskills: 'number',
  ScaleAmountOverTime: 'number',
  ScaleAmountOverTimeMax: 'number',
  ShouldRefreshFxScript: 'number',
  ShowInNameplates: 'boolean | string',
  ShowInUITray: 'boolean | string',
  ShowTextInDamageNumbers: 'boolean',
  ShowTextInNameplates: 'boolean | string',
  ShowUiDamageNumbersOnHeal: 'boolean',
  Silenced: 'number',
  SlotToFillWeaponDamageInfo: 'string',
  SourceRuneChargeOnApply: 'number',
  SourceRuneChargeOnHealthChangeOnly: 'boolean',
  SourceRuneChargeOnTick: 'number',
  SprintSpeedMod: 'number',
  StackDuration: 'boolean | number | string',
  StackMax: 'number',
  Stamina: 'number',
  StaminaDamageModifier: 'number',
  StaminaRate: 'number',
  StatusID: 'string',
  StopOnHitCount: 'number',
  Stunned: 'number',
  TargetOwnsSpell: 'boolean',
  TempMod: 'number',
  TerritoryStandingMod: 'number',
  TickCondition: 'string',
  TickRate: 'number',
  UIPriority: 'number',
  UiNameplatePriority: 'number',
  UseHealScalingValue: 'boolean',
  UseLightweightReplication: 'boolean',
  UseSourceWeaponForAbilityEffect: 'boolean',
  UseSourceWeaponForSpell: 'boolean',
  WKNArcane: 'number',
  WKNCorruption: 'number',
  WKNFire: 'number',
  WKNIce: 'number',
  WKNLightning: 'number',
  WKNNature: 'number',
  WKNSiege: 'number',
  WKNSlash: 'number',
  WKNStandard: 'number',
  WKNStrike: 'number',
  WKNThrust: 'number',
  WeaponEffectType: 'string',
  WeaponMasteryCategoryId: 'number | string',
  WindowHeader: 'string',
  XPIncreases: 'number | string',
  XPIncreasesTooltip: 'number',
}
