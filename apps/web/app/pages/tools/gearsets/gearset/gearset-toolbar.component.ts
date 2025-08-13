import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { Component, Injector, Input, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import {
  EquipSlotId,
  NW_MAX_GEAR_SCORE,
  NW_MIN_GEAR_SCORE,
  isItemArmor,
  isItemJewelery,
  isItemWeapon,
  isPerkEmptyGemSlot,
  isPerkGem,
  isPerkInherent,
} from '@nw-data/common'
import { MasterItemDefinitions } from '@nw-data/generated'
import { filter, firstValueFrom, map, switchMap } from 'rxjs'
import {
  GearsetRecord,
  GearsetSection,
  GearsetStore,
  GearsetsService,
  ItemInstance,
  ItemsService,
  ResolvedItemPerkInfo,
  getGearsetSections,
} from '~/data'
import { BackendService } from '~/data/backend'
import { NwModule } from '~/nw'
import { ShareDialogComponent } from '~/pages/share'
import { ChipsInputModule } from '~/ui/chips-input'
import { DataViewPicker } from '~/ui/data/data-view/data-view-picker.component'
import { IconsModule } from '~/ui/icons'
import {
  svgBars,
  svgCalculator,
  svgCamera,
  svgChevronLeft,
  svgEraser,
  svgFileImport,
  svgFrame,
  svgGlobe,
  svgInfoCircle,
  svgPaste,
  svgRectangleHistory,
  svgShareNodes,
  svgSwords,
  svgTags,
  svgTrashCan,
  svgXmark,
} from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { queryParamModel } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { GearsetTableAdapter } from '~/widgets/data/gearset-table'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SyncBadgeComponent } from '../../../../ui/sync-badge'
import { InventoryPickerService } from '../../inventory/inventory-picker.service'
import { EmbedGearsetDialogComponent, SlotsPickerComponent } from '../dialogs'

@Component({
  selector: 'nwb-gearset-toolbar',
  templateUrl: './gearset-toolbar.component.html',
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    IconsModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    LayoutModule,
    ChipsInputModule,
    OverlayModule,
    SyncBadgeComponent,
  ],
  host: {
    class: 'flex-1 flex flex-row items-center gap-1 overflow-x-auto overflow-y-hidden',
  },
})
export class GearsetToolbarComponent {
  private backend = inject(BackendService)
  protected store = inject(GearsetStore)
  private injector = inject(Injector)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private vsQueryParam = queryParamModel('vs')
  private calcQueryParam = queryParamModel('calc')
  private gearService = inject(GearsetsService)
  private picker = inject(InventoryPickerService)
  private itemsDb = inject(ItemsService)
  private modal = inject(ModalService)
  private platform = inject(PlatformService)
  protected sections = toSignal(
    this.route.queryParamMap.pipe(
      map((it): GearsetSection[] => {
        return getGearsetSections().filter((key) => !it.has(key) || (it.get(key) !== 'false' && it.get(key) !== '0'))
      }),
    ),
  )

  protected iconCamera = svgCamera
  protected iconDelete = svgTrashCan
  protected iconCopy = svgPaste
  protected iconBack = svgChevronLeft
  protected iconClose = svgXmark
  protected iconInfo = svgInfoCircle
  protected iconShare = svgShareNodes
  protected iconTags = svgTags
  protected iconCalculator = svgCalculator
  protected iconMenu = svgBars
  protected iconReset = svgEraser
  protected iconSwords = svgSwords
  protected iconGlobe = svgGlobe
  protected iconImport = svgFileImport
  protected iconBatch = svgRectangleHistory
  protected iconFrame = svgFrame
  protected presetTags = computed(() => this.gearService.tags().map((it) => it.value))
  protected isTagEditorOpen = false

  protected gearset = this.store.gearset
  protected isEditable = computed(() => !!this.gearset() && this.store.isOwned())
  protected hasLinkedItems = this.store.hasLinkedItems
  protected isPublic = this.store.isPublished
  protected isOwned = this.store.isOwned
  protected isSyncPending = this.store.isSyncPending
  protected isSyncConflict = this.store.isSyncConflict
  protected isSignedIn = this.backend.isSignedIn
  protected isLoaded = this.store.isLoaded
  protected isLoading = this.store.isLoading

  @Input()
  public mode: 'player' | 'opponent' = 'player'

  public constructor() {
    this.store.setShowCalculator(this.calcQueryParam.value() === 'true')
  }

  protected updateName(value: string) {
    this.store.patchGearset({ name: value })
  }

  protected onPublishClicked() {
    this.store.update({ status: 'public' })
  }

  protected onUnpublishClicked() {
    this.store.update({ status: 'private' })
  }

  protected onEmbedClicked() {
    EmbedGearsetDialogComponent.open(this.modal, {
      inputs: {
        gearset: this.store.gearset(),
      },
    })
  }

  protected onImportClicked() {
    const record = this.gearset()
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Import Gearset',
        body: 'Rename imported gearset if needed',
        value: record.name,
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) => {
          return this.gearService.dublicate({
            ...record,
            name: newName,
          })
        }),
      )
      .subscribe((newSet) => {
        this.router.navigate(['/gearsets', newSet.userId, newSet.id])
      })
  }

  protected onCloneClicked() {
    const record = this.gearset()
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Create copy',
        label: 'Name',
        value: `${record.name} (Copy)`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) => {
          return this.gearService.create({
            ...record,
            id: null,
            ipnsKey: null,
            ipnsName: null,
            name: newName,
          })
        }),
      )
      .subscribe((newSet) => {
        this.router.navigate(['/gearsets', newSet.userId, newSet.id])
      })
  }

  protected onDeleteClicked() {
    const record = this.gearset()
    const userId = record.userId
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Delete Gearset',
        body: 'Are you sure you want to delete this gearset?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe(() => {
        if (record.id) {
          this.gearService.delete(record.id)
        }
        this.router.navigate(['/gearsets', userId])
      })
  }

  protected async onShareClicked() {
    const record = this.store.getCopy()
    const ipnsKey = record.ipnsKey
    const ipnsName = record.ipnsName
    delete record.userId
    delete record.imageId
    delete record.createMode
    delete record.ipnsKey
    delete record.ipnsName

    for (const [slot, it] of Object.entries(record.slots || {})) {
      if (typeof it === 'string') {
        record.slots[slot] = await this.itemsDb
          .read(it)
          .then((it): ItemInstance => {
            return {
              gearScore: it.gearScore,
              itemId: it.itemId,
              perks: it.perks,
            }
          })
          .catch(() => null as ItemInstance)
      }
    }

    ShareDialogComponent.open(this.modal, {
      inputs: {
        data: {
          ipnsKey: ipnsKey,
          ipnsName: ipnsName,
          content: {
            ref: record.id,
            type: 'gearset',
            data: record,
          },
          published: (res) => {
            if (res.ipnsKey) {
              this.gearService.update(record.id, {
                ipnsName: res.ipnsName,
                ipnsKey: res.ipnsKey,
              })
            }
          },
          buildEmbedSnippet: (url: string) => {
            if (!url) {
              return null
            }
            return [
              `<script src="${this.platform.websiteUrl}/embed.js"></script>`,
              `<object data="${url}" style="width: 100%"></object>`,
            ].join('\n')
          },
          buildEmbedUrl: (cid, name) => {
            if (!cid && !name) {
              return null
            }
            const command = name ? ['/gearsets/embed/ipns', name] : ['/gearsets/embed/ipfs', cid]
            return this.router.createUrlTree(command).toString()
          },
          buildShareUrl: (cid, name) => {
            if (!cid && !name) {
              return null
            }
            const command = name ? ['/gearsets/share/ipns', name] : ['/gearsets/share/ipfs', cid]
            return this.router.createUrlTree(command).toString()
          },
        },
      },
    })
  }

  protected updateTags(record: GearsetRecord, tags: string[]) {
    this.gearService.update(record.id, {
      ...record,
      tags: tags || [],
    })
  }

  protected handleBackClicked() {
    if (this.mode === 'opponent') {
      this.vsQueryParam.update(null)
    } else {
      history.back()
    }
  }

  protected async onBatchResetClicked() {
    const record = this.gearset()
    const recordSlots = await firstValueFrom(this.gearService.resolveGearsetSlotItems(record))
    const resetableIds: EquipSlotId[] = [
      'head',
      'chest',
      'hands',
      'legs',
      'feet',
      'amulet',
      'ring',
      'earring',
      'weapon1',
      'weapon2',
      'weapon3',
    ]
    const perkSlots = recordSlots.filter((it) => resetableIds.includes(it.slot as EquipSlotId))

    SlotsPickerComponent.open(this.modal, {
      inputs: {
        title: 'Select items to reset',
        slots1: perkSlots.map((it) => it.slot as EquipSlotId),
        selection: resetableIds,
      },
    })
      .result$.pipe(filter((it) => it?.length > 0))
      .subscribe((slots) => {
        const patch = perkSlots
          .filter((it) => slots.includes(it.slot as EquipSlotId))
          .map(({ slot, perks }) => {
            return {
              slot: slot,
              perks: perks.filter(canResetPerk).map(({ key }) => {
                return { key: key, perkId: null }
              }),
            }
          })
        this.store.updateGearsetSlots(patch)
      })
  }

  protected async onBatchGemClicked() {
    const record = this.gearset()
    const recordSlots = await firstValueFrom(this.gearService.resolveGearsetSlotItems(record))
    const gemSlots = recordSlots.filter(({ item, perks }) =>
      perks.some(
        ({ perk, bucket }) => isPerkGem(bucket) || isPerkEmptyGemSlot(perk) || (isPerkGem(perk) && item?.CanReplaceGem),
      ),
    )
    const armorSlotIds: EquipSlotId[] = ['head', 'chest', 'hands', 'legs', 'feet', 'amulet', 'ring', 'earring']
    const weaponSlotIds: EquipSlotId[] = ['weapon1', 'weapon2']
    const armorSlots = gemSlots.filter((it) => armorSlotIds.includes(it.slot as any))
    const weaponSlots = gemSlots.filter((it) => weaponSlotIds.includes(it.slot as any))

    SlotsPickerComponent.open(this.modal, {
      inputs: {
        title: 'Which slots to update',
        slots1: armorSlots.map((it) => it.slot as any),
        slots2: weaponSlots.map((it) => it.slot as any),
        selection: null,
      },
    })
      .result$.pipe(filter((it) => it?.length > 0))
      .pipe(
        switchMap((slots) => {
          return this.picker
            .pickGemForSlot({ slots: slots })
            .pipe(filter((it) => it?.length > 0))
            .pipe(map((perks) => ({ slots, perk: perks[0] })))
        }),
      )
      .subscribe(({ perk, slots }) => {
        this.store.updateGearsetSlots(
          gemSlots
            .filter((it) => slots.includes(it.slot as any))
            .map(({ slot, perks, item }) => {
              const found = perks.find((it) => canReplaceGem(it, item))
              return {
                slot: slot,
                perks: [
                  {
                    key: found.key,
                    perkId: perk.PerkID,
                  },
                ],
              }
            }),
        )
      })
  }

  protected async onBatchAttributeClicked() {
    const record = this.gearset()
    const recordSlots = await firstValueFrom(this.gearService.resolveGearsetSlotItems(record))
    const gearSlots = recordSlots.filter(({ item }) => isItemArmor(item) || isItemWeapon(item) || isItemJewelery(item))
    const armorSlotIds: EquipSlotId[] = ['head', 'chest', 'hands', 'legs', 'feet', 'amulet', 'ring', 'earring']
    const weaponSlotIds: EquipSlotId[] = ['weapon1', 'weapon2', 'weapon3']
    const armorSlots = gearSlots.filter((it) => armorSlotIds.includes(it.slot as any))
    const weaponSlots = gearSlots.filter((it) => weaponSlotIds.includes(it.slot as any))

    SlotsPickerComponent.open(this.modal, {
      inputs: {
        title: 'Choose slots for Attribute update',
        slots1: armorSlots.map((it) => it.slot as any),
        slots2: weaponSlots.map((it) => it.slot as any),
        selection: null,
        positive: 'Next',
      },
    })
      .result$.pipe(filter((it) => it?.length > 0))
      .pipe(
        switchMap((slots) => {
          return this.picker
            .pickAttributeForItems({
              items: [...armorSlots, ...weaponSlots]
                .filter((it) => !!it.item && slots.includes(it.slot as any))
                .map((it) => it.item),
            })
            .pipe(filter((it) => it?.length > 0))
            .pipe(map((perks) => ({ slots, perk: perks[0] })))
        }),
      )
      .subscribe(({ perk, slots }) => {
        const data = gearSlots
          .filter((it) => slots.includes(it.slot as any))
          .map(({ slot, perks, item }) => {
            const found = perks.find((it) => canPlaceMod(it, item))
            if (!found) {
              return null
            }
            return {
              slot: slot,
              perks: [
                {
                  key: found.key,
                  perkId: perk.PerkID,
                },
              ],
            }
          })
          .filter((it) => !!it)
        this.store.updateGearsetSlots(data)
      })
  }

  protected async handleOpponentSelection() {
    const result = await DataViewPicker.open({
      title: 'Pick Opponent Gearset',
      selection: [this.vsQueryParam.value() || null],
      dataView: {
        adapter: GearsetTableAdapter,
        source: this.gearService.observeRows(this.backend.sessionUserId()),
      },
      injector: this.injector,
    })
    if (!result) {
      return
    }
    this.vsQueryParam.update(result, {
      replaceUrl: true,
    })
  }

  protected onToggleItemInfoClicked() {
    this.store.setShowItemInfo(!this.store.showItemInfo())
    // this.calcQueryParam.update(showCalculator ? String(showCalculator) : null, {
    //   replaceUrl: true,
    // })
  }

  protected onToggleCalculatorClicked() {
    const showCalculator = !this.store.showCalculator()
    this.store.setShowCalculator(showCalculator)
    this.calcQueryParam.update(showCalculator ? String(showCalculator) : null, {
      replaceUrl: true,
    })
  }

  protected async onBatchGearScoreClicked() {
    const record = this.gearset()
    const recordSlots = await firstValueFrom(this.gearService.resolveGearsetSlotItems(record))
    const gearSlotIds: EquipSlotId[] = [
      'head',
      'chest',
      'hands',
      'legs',
      'feet',
      'amulet',
      'ring',
      'earring',
      'weapon1',
      'weapon2',
      'weapon3',
    ]
    const gearSlots = recordSlots
      .filter(({ item }) => isItemArmor(item) || isItemWeapon(item) || isItemJewelery(item))
      .filter((it) => gearSlotIds.includes(it.slot as any))

    SlotsPickerComponent.open(this.modal, {
      inputs: {
        title: 'Choose slots to change GS',
        slots1: gearSlots.map((it) => it.slot as any),
        selection: gearSlots.map((it) => it.slot as any),
      },
    })
      .result$.pipe(filter((it) => it?.length > 0))
      .pipe(
        switchMap((slots) => {
          return PromptDialogComponent.open(this.modal, {
            inputs: {
              title: 'Gear Score',
              positive: 'OK',
              negative: 'Cancel',
              value: String(NW_MAX_GEAR_SCORE),
              inputType: 'number',
              min: NW_MIN_GEAR_SCORE,
              max: NW_MAX_GEAR_SCORE,
              body: 'Enter the new gear score',
            },
          })
            .result$.pipe(filter((it) => !!it && isFinite(Number(it))))
            .pipe(
              map((gs) => {
                return { slots, gs: Number(gs) }
              }),
            )
        }),
      )
      .subscribe(({ slots, gs }) => {
        this.store.updateGearsetSlots(
          gearSlots
            .filter((it) => slots.includes(it.slot as any))
            .map(({ slot }) => {
              return {
                slot: slot,
                gearScore: gs,
              }
            }),
        )
      })
  }

  protected toggleSection(section: GearsetSection) {
    let sections = this.sections()
    if (!sections?.length) {
      sections = getGearsetSections()
    }

    if (sections.includes(section)) {
      sections = sections.filter((it) => it !== section)
    } else {
      sections = [...sections, section]
    }
    const allSet = !sections.length || sections.length === getGearsetSections().length
    const entries = getGearsetSections().map((key) => {
      if (allSet) {
        return [key, null]
      }
      return [key, sections.includes(key) ? null : 'false']
    })

    const params = Object.fromEntries(entries)
    this.router.navigate(['.'], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParamsHandling: 'merge',
      queryParams: params,
    })
  }
}

function canResetPerk(info: ResolvedItemPerkInfo) {
  if (info.bucket) {
    return true
  }
  if (isPerkGem(info.perk)) {
    return true
  }
  return false
}

function canReplaceGem(info: ResolvedItemPerkInfo, item: MasterItemDefinitions) {
  if (isPerkGem(info.bucket)) {
    return true
  }
  if (isPerkGem(info.perk) && item.CanReplaceGem) {
    return true
  }
  if (isPerkEmptyGemSlot(info.perk)) {
    return true
  }
  return false
}

function canPlaceMod(info: ResolvedItemPerkInfo, item: MasterItemDefinitions) {
  if (isPerkInherent(info.bucket)) {
    return true
  }
  return false
}
