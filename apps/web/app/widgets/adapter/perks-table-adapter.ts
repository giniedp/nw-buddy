import { Injectable, Optional } from '@angular/core'
import { Ability, Affixstats, Perks } from '@nw-data/types'
import { ColDef, ColGroupDef, GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, of, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwLinkService, NwService } from '~/nw'
import { NwExpressionContextService } from '~/nw/expression'
import { getPerksInherentMODs, hasPerkInherentAffix, isPerkGenerated, isPerkInherent } from '~/nw/utils'
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableAdapterOptions, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class PerksTableAdapter extends DataTableAdapter<Perks> {
  public static provider(config?: DataTableAdapterOptions<Perks>) {
    return dataTableProvider({
      adapter: PerksTableAdapter,
      options: config
    })
  }

  public entityID(item: Perks): string {
    return item.PerkID
  }

  public entityCategory(item: Perks): DataTableCategory {
    return {
      icon: null,
      label: isPerkInherent(item) ? 'Attributes' : isPerkGenerated(item) ? 'Perks' : item.PerkType,
      value: item.PerkType
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
        this.colGroupDef({
          headerName: 'Perk',
          marryChildren: true,
          children: [
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
                  target: '_blank',
                  href: this.info.link('perk', String(data.PerkID)),
                  icon: data.IconPath,
                  iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1']
                })
              }),
            }),
            this.colDef({
              colId: 'name',
              headerValueGetter: () => 'Name',
              wrapText: true,
              autoHeight: true,
              width: 300,
              valueGetter: this.valueGetter(({ data }) => {
                return {
                  name: data.DisplayName && this.i18n.get(data.DisplayName),
                  suffix: data.AppliedSuffix && this.i18n.get(data.AppliedSuffix),
                  prefix: data.AppliedPrefix && this.i18n.get(data.AppliedPrefix),
                }
              }),
              filterValueGetter: ({ data }) => {
                const name = data.DisplayName && this.i18n.get(data.DisplayName)
                const suffix = data.AppliedSuffix && this.i18n.get(data.AppliedSuffix)
                const prefix = data.AppliedPrefix && this.i18n.get(data.AppliedPrefix)
                return [name || '', suffix || '', prefix || ''].join(' ')
              },
              cellRenderer: this.cellRenderer(({ value }) => {
                return this.createElement({
                  tag: 'div',
                  classList: ['flex', 'flex-col', 'text-sm'],
                  children: [
                    value.name
                      ? {
                        tag: 'span',
                        classList: [],
                        text: value.name as string,
                      }
                      : null,
                    value.prefix
                      ? {
                        tag: 'span',
                        classList: ['italic', 'text-accent'],
                        text: `${value.prefix} …`,
                      }
                      : null,
                    value.suffix
                      ? {
                        tag: 'span',
                        classList: ['italic', 'text-accent'],
                        text: `… ${value.suffix}`,
                      }
                      : null,
                  ],
                })
              }),
            }),
            this.colDef({
              colId: 'description',
              headerValueGetter: () => 'Description',
              width: 500,
              wrapText: true,
              autoHeight: true,
              cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
              filterValueGetter: ({ data }) => this.i18n.get(data.Description),
              valueGetter: ({ data }) => this.i18n.get(data.Description),
              cellRenderer: this.cellRendererAsync(),
              cellRendererParams: this.cellRendererAsyncParams<string>({
                source: ({ data }) => {
                  return combineLatest({
                    ctx: this.ctx.value,
                    text: this.i18n.observe(data.Description),
                    stats: this.nw.db.affixStatsMap,
                  }).pipe(
                    switchMap(({ ctx, text, stats }) => {
                      if (hasPerkInherentAffix(data)) {
                        const affix = stats.get(data.Affix)
                        const result = getPerksInherentMODs(data, affix, ctx.gs)
                          .map((it) => `+${it.value} <b>${this.i18n.get(it.label)}</b>`)
                          .join('<br>')
                        return of(result)
                      }

                      let gs = ctx.gs
                      if (data.ItemClassGSBonus && ctx.gsBonus) {
                        gs += Number(data.ItemClassGSBonus.split(':')[1]) || 0
                      }
                      return this.nw.expression.solve({
                        text: text,
                        charLevel: ctx.level,
                        gearScore: gs,
                        itemId: data.PerkID,
                      })
                    })
                  )
                },
                update: (el, text) => {
                  el.innerHTML = this.makeLineBreaks(text)
                },
              }),
            }),
            this.colDef({
              colId: 'perkType',
              headerValueGetter: () => 'Type',
              field: this.fieldName('PerkType'),
              width: 120,
              filter: SelectboxFilter,
            }),
            {
              colId: 'itemClassGSBonus',
              headerName: 'Item Class GS Bonus',
              field: this.fieldName('ItemClassGSBonus'),
              marryChildren: true,
              children: [
                this.colDef({
                  colId: 'itemClassGSBonusClass',
                  headerValueGetter: () => 'Class',
                  valueGetter: this.valueGetter(({ data }) => {
                    return data.ItemClassGSBonus?.split(':')[0]
                  }),
                  width: 90,
                  minWidth: 90,
                  maxWidth: 90,
                  resizable: false,
                  filter: SelectboxFilter,
                }),
                this.colDef({
                  colId: 'itemClassGSBonusGS',
                  headerValueGetter: () => 'GS',
                  headerName: 'GS',
                  valueGetter: this.valueGetter(({ data }) => {
                    return data.ItemClassGSBonus?.split(':')[1]
                  }),
                  width: 50,
                  minWidth: 50,
                  maxWidth: 50,
                  resizable: false,

                }),
              ],
            },
            this.colDef({
              colId: 'itemClass',
              headerValueGetter: () => 'Item Class',
              width: 500,
              field: this.fieldName('ItemClass'),
              wrapText: true,
              autoHeight: true,
              cellClass: ['multiline-cell', 'py-2'],
              filter: SelectboxFilter,
              cellRenderer: this.cellRendererTags(humanize),
              filterParams: SelectboxFilter.params({
                showCondition: true,
                conditionAND: true,
                showSearch: true,
              }),
            }),
            this.colDef({
              colId: 'exclusiveLabels',
              headerValueGetter: () => 'Exclusive Labels',
              field: this.fieldName('ExclusiveLabels'),
              wrapText: true,
              autoHeight: true,
              cellClass: ['multiline-cell', 'py-2'],
              filter: SelectboxFilter,
              cellRenderer: this.cellRendererTags(humanize),
              filterParams: SelectboxFilter.params({
                showCondition: true,
                conditionAND: true,
                showSearch: true,
              }),
            }),
            this.colDef({
              colId: 'excludeItemClass',
              headerValueGetter: () => 'Exclude Item Class',
              field: this.fieldName('ExcludeItemClass'),
              wrapText: true,
              autoHeight: true,
              cellClass: ['multiline-cell', 'py-2'],
              filter: SelectboxFilter,
              cellRenderer: this.cellRendererTags(humanize),
              filterParams: SelectboxFilter.params({
                showCondition: true,
                conditionAND: true,
                showSearch: false,
              }),
            }),
            this.colDef({
              colId: 'isStackableAbility',
              headerValueGetter: () => 'Is Stackable Ability',
              filter: SelectboxFilter,
              valueGetter: this.valueGetter(({ data }) => {
                const ability = data['$ability'] as Ability
                return ability?.IsStackableAbility
              }),
            }),
          ]
        }),
        this.colGroupDef({
          headerName: 'Affix',
          marryChildren: true,
          children: []
        })
      ],
    }).pipe(map((options) => {
      appendFields((options.columnDefs[0] as ColGroupDef).children, Array.from(Object.entries(FIELDS)), '')
      appendFields((options.columnDefs[1] as ColGroupDef).children, Array.from(Object.entries(AFFIX_FIELDS)), '$affix')
      return options
    }))
  )

  public entities: Observable<Perks[]> = defer(() =>
    combineLatest({
      perks: this.config?.source || this.nw.db.perks,
      affixstats: this.nw.db.affixstatsMap,
    })
  )
    .pipe(
      map(({ perks, affixstats }) => {
        return perks.map((it) => {
          return {
            ...it,
            $affix: affixstats.get(it.Affix),
          }
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(
    private nw: NwService,
    private i18n: TranslateService,
    @Optional()
    private config: DataTableAdapterOptions<Perks>,
    private ctx: NwExpressionContextService,
    private info: NwLinkService
  ) {
    super()
  }
}


function appendFields(columns: Array<ColDef>, fields: string[][], fieldPrefix: string) {
  for (const [field, type] of fields) {
    const exists = columns.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      valueGetter: ({ data }) => {
        if (fieldPrefix) {
          return data[fieldPrefix]?.[field]
        } else {
          return data[field]
        }
      },
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
    columns.push(colDef)
  }
}

const FIELDS: Record<keyof Perks, string> = {
  Affix:                    'string',
  AppliedPrefix:            'string',
  AppliedSuffix:            'string',
  Category:                 'string',
  Channel:                   'number',
  ConditionEvent:            'ConditionEvent',
  DayPhases:                'DayPhases',
  DeprecatedPerkId:         'string',
  Description:               'string',
  DisplayName:               'string',
  EquipAbility:             'string[]',
  ExcludeFromTradingPost:   'string',
  ExcludeItemClass:         'string[]',
  ExclusiveLabels:          'string[]',
  FishingWaterType:         'string',
  GroupName:                'string',
  IconPath:                  'string',
  ItemClass:                 'ItemClass[]',
  ItemClassGSBonus:         'string',
  ItemPerkConflictsLocText: 'string',
  PerkID:                    'string',
  PerkType:                  'PerkType',
  ScalingPerGearScore:       'number',
  Tier:                      'number',
  WeaponTag:                'string',
}


const AFFIX_FIELDS: Record<keyof Affixstats, string> = {
  ABABleed:                   'number',
  ABACurse:                   'number',
  ABADisease:                 'number',
  ABAFrostbite:               'number',
  ABAPoison:                  'number',
  ABSArcane:                  'number',
  ABSCorruption:              'number',
  ABSFire:                    'number',
  ABSIce:                     'number',
  ABSLightning:               'number',
  ABSNature:                  'number',
  ABSSiege:                   'number',
  ABSSlash:                   'number',
  ABSStandard:                'number',
  ABSStrike:                  'number',
  ABSThrust:                  'number',
  ABSVitalsCategory:         'string',
  AFABlight:                  'number',
  AFACurse:                   'number',
  AFAPoison:                  'number',
  AdditionalDamage:          'string',
  AppendToTooltip:           'string',
  AttributeModifiers:        'string',
  BLAArcane:                  'number',
  BLACorruption:              'number',
  BLAFire:                    'number',
  BLALightning:               'number',
  BLASiege:                   'number',
  BLASlash:                   'number',
  BLAStandard:                'number',
  BLAStrike:                  'number',
  BLAThrust:                  'number',
  BaseDamageModifier:         'number',
  BaseDamageType:            'string',
  DMGArcane:                  'number',
  DMGCorruption:              'number',
  DMGFire:                    'number',
  DMGIce:                     'number',
  DMGLightning:               'number',
  DMGNature:                  'number',
  DMGSlash:                   'number',
  DMGStrike:                  'number',
  DMGThrust:                  'number',
  DMGVitalsCategory:         'string',
  DamagePercentage:           'number',
  DamageType:                'string',
  DisableDurabilityLoss:      'boolean',
  DurabilityMod:              'number',
  Encumbrance:                'number',
  FastTravelEncumbranceMod:   'number',
  FishRarityRollModifier:     'number',
  FishSizeRollModifier:       'number',
  FishingLineStrength:        'number',
  GatheringEfficiency:        'number',
  IsAdditiveDamage:           'boolean',
  MODConstitution:            'number',
  MODDexterity:               'number',
  MODFocus:                   'number',
  MODIntelligence:            'number',
  MODStrength:                'number',
  MP_FinalNotePerfectXPBonus: 'number',
  MP_GroupXPBonus:            'number',
  MP_IgnoreMissedNotes:       'number',
  MP_OpeningNotesPerfect:     'number',
  MP_RakeReduction:           'number',
  MP_SoloXPBonus:             'number',
  ManaRate:                   'number',
  MaxCastDistance:            'number',
  MaxHealthMod:               'number',
  MaxManaMod:                 'number',
  MaxStaminaMod:              'number',
  PreferHigherScaling:        'boolean',
  RESBlight:                  'number',
  RESCurse:                   'number',
  RESPoison:                  'number',
  ScalingDexterity:           'number',
  ScalingFocus:               'number',
  ScalingIntelligence:        'number',
  ScalingStrength:            'number',
  StaminaDamageModifier:      'number',
  StaminaRate:                'number',
  StatusEffect:              'string',
  StatusID:                   'string',
  UseCountMultiplier:         'number',
  WeaponEffectType:          'string',
  WeightMultiplier:           'number',
}
