import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { Component, TrackByFunction, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
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
import { ItemDefinitionMaster } from '@nw-data/generated'
import { environment } from 'apps/web/environments'
import { filter, firstValueFrom, map, switchMap } from 'rxjs'
import {
  GearsetRecord,
  GearsetSignalStore,
  GearsetsDB,
  ImagesDB,
  ItemInstance,
  ItemInstancesDB,
  NwDataService,
  ResolvedItemPerkInfo,
  resolveGearsetSlotItems,
} from '~/data'
import { NwModule } from '~/nw'
import { ShareDialogComponent } from '~/pages/share'
import { ChipsInputModule } from '~/ui/chips-input'
import { IconsModule } from '~/ui/icons'
import {
  svgCalculator,
  svgCamera,
  svgChevronLeft,
  svgCompress,
  svgEllipsisVertical,
  svgEraser,
  svgPaste,
  svgShareNodes,
  svgTags,
  svgTrashCan,
} from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectRouteParam } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'
import { InventoryPickerService } from '../inventory/inventory-picker.service'
import { SlotsPickerComponent } from './dialogs'
import { GearsetDetailComponent } from './gearset.component'
import { GEARSET_TAGS } from './tags'

@Component({
  standalone: true,
  selector: 'nwb-gearsets-detail-page',
  templateUrl: './gearsets-detail-page.component.html',
  imports: [
    CommonModule,
    NwModule,
    DialogModule,
    FormsModule,
    IconsModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    IonHeader,
    GearsetDetailComponent,
    LayoutModule,
    ChipsInputModule,
    OverlayModule,
  ],
  providers: [GearsetSignalStore],
  host: {
    class: 'layout-col flex-none',
  },
})
export class GearsetsDetailPageComponent {
  private store = inject(GearsetSignalStore)

  protected compact = false
  protected calculator = false
  protected iconCamera = svgCamera
  protected iconDelete = svgTrashCan
  protected iconCopy = svgPaste
  protected iconBack = svgChevronLeft
  protected iconCompact = svgCompress
  protected iconShare = svgShareNodes
  protected iconTags = svgTags
  protected iconCalculator = svgCalculator
  protected iconMenu = svgEllipsisVertical
  protected iconReset = svgEraser
  protected presetTags = GEARSET_TAGS.map((it) => it.value)
  protected isTagEditorOpen = false
  protected trackByIndex: TrackByFunction<any> = (i) => i
  protected menuIsOpen = false

  protected get gearset() {
    return this.store.gearset()
  }
  protected get isLoaded() {
    return this.store.isLoaded()
  }

  public constructor(
    private router: Router,
    private route: ActivatedRoute,
    private gearDb: GearsetsDB,
    private db: NwDataService,
    private picker: InventoryPickerService,

    private itemsDb: ItemInstancesDB,
    private imagesDb: ImagesDB,
    private dialog: Dialog,
  ) {
    this.store.connectGearsetDB(injectRouteParam('id'))
  }

  protected updateName(value: string) {
    this.store.patchGearset({ name: value })
  }

  protected onCompactClicked() {
    this.compact = !this.compact
  }

  protected onCalculatorClicked() {
    this.calculator = !this.calculator
  }
  protected onCloneClicked() {
    const record = this.store.gearset()
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Create copy',
        body: 'New gearset name',
        input: `${record.name} (Copy)`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) => {
          return this.gearDb.create({
            ...record,
            id: null,
            ipnsKey: null,
            ipnsName: null,
            name: newName,
          })
        }),
      )
      .subscribe((newSet) => {
        this.router.navigate(['..', newSet.id], { relativeTo: this.route })
      })
  }

  protected onDeleteClicked() {
    const record = this.store.gearset()
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Delete Gearset',
        body: 'Are you sure you want to delete this gearset?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe(() => {
        if (record.imageId) {
          this.imagesDb.destroy(record.imageId)
        }
        if (record.id) {
          this.gearDb.destroy(record.id)
        }
        this.router.navigate(['..'], { relativeTo: this.route })
      })
  }

  protected async onShareClicked() {
    const record = this.store.clone()
    const ipnsKey = record.ipnsKey
    const ipnsName = record.ipnsName
    delete record.imageId
    delete record.createMode
    delete record.ipnsKey
    delete record.ipnsName

    for (const [slot, it] of Object.entries(record.slots)) {
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

    ShareDialogComponent.open(this.dialog, {
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
            this.gearDb.update(record.id, {
              ipnsName: res.ipnsName,
              ipnsKey: res.ipnsKey,
            })
          }
        },
        buildEmbedSnippet: (url: string) => {
          if (!url) {
            return null
          }
          const host = environment.standalone ? 'https://www.nw-buddy.de' : location.origin
          return [
            `<script src="${host}/embed.js"></script>`,
            `<object data="${url}" style="width: 100%"></object>`,
          ].join('\n')
        },
        buildEmbedUrl: (cid, name) => {
          if (!cid && !name) {
            return null
          }
          const command = name ? ['../embed/ipns', name] : ['../embed/ipfs', cid]
          return this.router
            .createUrlTree(command, {
              relativeTo: this.route,
            })
            .toString()
        },
        buildShareUrl: (cid, name) => {
          if (!cid && !name) {
            return null
          }
          const command = name ? ['../share/ipns', name] : ['../share/ipfs', cid]
          return this.router
            .createUrlTree(command, {
              relativeTo: this.route,
            })
            .toString()
        },
      },
    })
  }

  protected updateTags(record: GearsetRecord, tags: string[]) {
    this.gearDb.update(record.id, {
      ...record,
      tags: tags || [],
    })
  }

  protected goBack() {
    history.back()
  }

  protected async onBatchResetClicked() {
    const record = this.store.gearset()
    const recordSlots = await firstValueFrom(resolveGearsetSlotItems(record, this.itemsDb, this.db))
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

    SlotsPickerComponent.open(this.dialog, {
      data: {
        title: 'Select items to reset',
        slots1: perkSlots.map((it) => it.slot as EquipSlotId),
        selection: resetableIds,
      },
    })
      .closed.pipe(filter((it) => it?.length > 0))
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
    const record = this.store.gearset()
    const recordSlots = await firstValueFrom(resolveGearsetSlotItems(record, this.itemsDb, this.db))
    const gemSlots = recordSlots.filter(({ item, perks }) =>
      perks.some(
        ({ perk, bucket }) => isPerkGem(bucket) || isPerkEmptyGemSlot(perk) || (isPerkGem(perk) && item?.CanReplaceGem),
      ),
    )
    const armorSlotIds: EquipSlotId[] = ['head', 'chest', 'hands', 'legs', 'feet', 'amulet', 'ring', 'earring']
    const weaponSlotIds: EquipSlotId[] = ['weapon1', 'weapon2']
    const armorSlots = gemSlots.filter((it) => armorSlotIds.includes(it.slot as any))
    const weaponSlots = gemSlots.filter((it) => weaponSlotIds.includes(it.slot as any))

    SlotsPickerComponent.open(this.dialog, {
      data: {
        title: 'Which slots to update',
        slots1: armorSlots.map((it) => it.slot as any),
        slots2: weaponSlots.map((it) => it.slot as any),
        selection: null,
      },
    })
      .closed.pipe(filter((it) => it?.length > 0))
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
    const record = this.store.gearset()
    const recordSlots = await firstValueFrom(resolveGearsetSlotItems(record, this.itemsDb, this.db))
    const gearSlots = recordSlots.filter(({ item }) => isItemArmor(item) || isItemWeapon(item) || isItemJewelery(item))
    const armorSlotIds: EquipSlotId[] = ['head', 'chest', 'hands', 'legs', 'feet', 'amulet', 'ring', 'earring']
    const weaponSlotIds: EquipSlotId[] = ['weapon1', 'weapon2', 'weapon3']
    const armorSlots = gearSlots.filter((it) => armorSlotIds.includes(it.slot as any))
    const weaponSlots = gearSlots.filter((it) => weaponSlotIds.includes(it.slot as any))

    SlotsPickerComponent.open(this.dialog, {
      data: {
        title: 'Which slots to update',
        slots1: armorSlots.map((it) => it.slot as any),
        slots2: weaponSlots.map((it) => it.slot as any),
        selection: null,
        positive: 'Next',
      },
    })
      .closed.pipe(
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
        this.store.updateGearsetSlots(
          gearSlots
            .filter((it) => slots.includes(it.slot as any))
            .map(({ slot, perks, item }) => {
              const found = perks.find((it) => canPlaceMod(it, item))
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

  protected async onBatchGearScoreClicked() {
    const record = this.store.gearset()
    const recordSlots = await firstValueFrom(resolveGearsetSlotItems(record, this.itemsDb, this.db))
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

    SlotsPickerComponent.open(this.dialog, {
      data: {
        title: 'Which slots to update',
        slots1: gearSlots.map((it) => it.slot as any),
        selection: gearSlots.map((it) => it.slot as any),
      },
    })
      .closed.pipe(filter((it) => it?.length > 0))
      .pipe(
        switchMap((slots) => {
          return PromptDialogComponent.open(this.dialog, {
            data: {
              title: 'Gear Score',
              positive: 'OK',
              negative: 'Cancel',
              input: String(NW_MAX_GEAR_SCORE),
              type: 'number',
              min: NW_MIN_GEAR_SCORE,
              max: NW_MAX_GEAR_SCORE,
              body: 'Enter the new gear score',
            },
          })
            .closed.pipe(filter((it) => !!it && isFinite(Number(it))))
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

function canReplaceGem(info: ResolvedItemPerkInfo, item: ItemDefinitionMaster) {
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

function canPlaceMod(info: ResolvedItemPerkInfo, item: ItemDefinitionMaster) {
  if (isPerkInherent(info.bucket)) {
    return true
  }
  return false
}
