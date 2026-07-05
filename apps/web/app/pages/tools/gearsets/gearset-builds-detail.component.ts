import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { IonContent, IonHeader, IonSegment, IonSegmentButton, IonToolbar, ToastController } from '@ionic/angular/standalone'
import { getDamageScalingForWeapon, patchPrecision } from '@nw-data/common'
import { compressToEncodedURIComponent } from 'lz-string'
import { filter, switchMap } from 'rxjs'
import { GearsetsService } from '~/data'
import { BackendService } from '~/data/backend'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import {
  svgChevronLeft,
  svgDiamond,
  svgFileImport,
  svgShareNodes,
  svgSwords,
  svgUser,
} from '~/ui/icons/svg'
import { ModalService, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { GearsetStore } from '~/data/gearsets/gearset.store'
import { CharacterStore } from '~/data/characters/character.store'
import { SkillTreeEditorModule } from '~/widgets/skill-tree'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ItemCardComponent } from '~/widgets/data/item-detail/item-card.component'
import { Mannequin } from '~/nw/mannequin'
import { damageModStack } from '~/widgets/damage-calculator/damage-mod-stack'

@Component({
  selector: 'nwb-gearset-builds-detail',
  templateUrl: './gearset-builds-detail.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NwModule,
    IconsModule,
    TooltipModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonSegment,
    IonSegmentButton,
    SkillTreeEditorModule,
    ItemDetailModule,
    ItemCardComponent,
  ],
  providers: [GearsetStore, CharacterStore, Mannequin],
  host: {
    class: 'ion-page',
  },
})
export class GearsetBuildsDetailComponent {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private gearsetService = inject(GearsetsService)
  private modal = inject(ModalService)
  private backend = inject(BackendService)
  private store = inject(GearsetStore)
  private char = inject(CharacterStore)
  private mannequin = inject(Mannequin)
  private toast = inject(ToastController)

  protected iconBack = svgChevronLeft
  protected iconUser = svgUser
  protected iconRating = svgDiamond
  protected iconImport = svgFileImport
  protected iconShare = svgShareNodes
  protected iconCalculator = svgSwords

  protected isLiking = signal<boolean>(false)
  
  // Collapsible section state
  protected showDamageTypes = signal(false)
  protected showAbsorption = signal(false)
  protected showWeakness = signal(false)

  // Convert route params to signal
  protected routeParams = toSignal(this.route.params, { initialValue: {} as any })
  
  // Convert query params to signal for tab state and selected slot
  protected queryParams = toSignal(this.route.queryParams, { initialValue: {} as any })
  
  // Selected slot from URL
  protected selectedSlot = computed(() => this.queryParams()?.slot || null)
  
  // Internal tab state from URL
  private tabFromUrl = computed(() => {
    const tab = this.queryParams()?.tab
    return tab === 'abilities' ? 'abilities' : 'stats'
  })
  
  // Active tab synced with URL query param - returns null when item detail is showing
  protected activeTab = computed(() => {
    // When item detail is showing, no tab should be highlighted
    if (this.selectedSlot()) {
      return null
    }
    return this.tabFromUrl()
  })

  // Resource for fetching gearset data
  protected gearsetResource = resource({
    params: () => {
      const { userid, id } = this.routeParams()
      if (!userid || !id) return undefined
      return { userid, id }
    },
    loader: async ({ params }) => {
      return await this.backend.publicTables.gearsets.read({ 
        user: params.userid, 
        id: params.id 
      })
    }
  })

  protected gearset = computed(() => this.gearsetResource.value())
  protected isLoading = computed(() => this.gearsetResource.isLoading())
  protected hasError = computed(() => this.gearsetResource.status() === 'error')

  protected level = computed(() => this.gearset()?.level || 60)
  protected slots = computed(() => this.gearset()?.slots || {})
  protected attrs = computed(() => this.gearset()?.attrs || { str: 0, dex: 0, int: 0, foc: 0, con: 0 })
  protected skills = computed(() => this.gearset()?.skills || {})
  protected tags = computed(() => this.gearset()?.tags || [])
  protected description = computed(() => this.gearset()?.description || '')
  
  // Use mannequin for all calculated stats (health, armor, damage, etc.)
  protected totalHealth = computed(() => this.mannequin.modMaxHealth().value)
  protected gearScoreAvg = computed(() => this.mannequin.gearScore())
  protected physicalArmor = computed(() => Math.round(this.mannequin.statRatingPhysical().value))
  protected elementalArmor = computed(() => Math.round(this.mannequin.statRatingElemental().value))
  
  // Additional stats from mannequin
  protected maxStamina = computed(() => Math.round(this.mannequin.modMaxStamina().value))
  protected maxMana = computed(() => Math.round(this.mannequin.modMaxMana().value))
  protected equippedWeight = computed(() => this.mannequin.equipLoad())
  protected equipLoadCategory = computed(() => this.mannequin.equipLoadCategory())
  
  // Damage modifiers by type
  protected damageByType = computed(() => {
    const dmg = this.mannequin.modDMG().byDamageType
    return Object.entries(dmg)
      .map(([type, mod]: [string, any]) => ({ type, value: mod.value }))
      .sort((a, b) => b.value - a.value)
  })
  
  // Weakness modifiers (damage taken)
  protected weaknessByType = computed(() => {
    const wkn = this.mannequin.modWKN()
    return Object.entries(wkn)
      .map(([type, mod]: [string, any]) => ({ type, value: mod.value }))
      .sort((a, b) => b.value - a.value)
  })
  
  // Absorption modifiers (damage reduction)
  protected absorptionByCategory = computed(() => {
    const abs = this.mannequin.modABS()
    const categories: Array<{ category: string; value: number }> = []
    
    // Add damage type categories
    for (const [type, mod] of Object.entries(abs.DamageCategories)) {
      categories.push({ category: type, value: mod.value })
    }
    
    // Add vitals categories
    for (const [cat, mod] of Object.entries(abs.VitalsCategories)) {
      categories.push({ category: cat, value: mod.value })
    }
    
    return categories.sort((a, b) => b.value - a.value)
  })
  
  // Crit stats
  protected critChance = computed(() => {
    const crit = this.mannequin.modCrit()
    return Math.round(crit.Chance.value * 100) / 100
  })
  
  protected critDamage = computed(() => {
    const crit = this.mannequin.modCrit()
    return Math.round((crit.Damage.value - 1) * 100)
  })
  
  // Grid layout for equipment slots - array of columns
  protected equipmentGrid = computed((): Array<Array<{ slotId: string; icon: string; isPlaceholder?: boolean }>> => {
    return [
      // Column 1: Armor (5 slots)
      [
        { slotId: 'head', icon: 'assets/icons/slots/iconhead.png' },
        { slotId: 'chest', icon: 'assets/icons/slots/iconchest.png' },
        { slotId: 'hands', icon: 'assets/icons/slots/iconhand.png' },
        { slotId: 'legs', icon: 'assets/icons/slots/iconlegs.png' },
        { slotId: 'feet', icon: 'assets/icons/slots/iconfeet.png' },
      ],
      // Column 2: Character model placeholder
      [
        { slotId: 'character', icon: 'assets/icons/item/icon_gearscore.png', isPlaceholder: true },
      ],
      // Column 3: Jewelry (3 slots)
      [
        { slotId: 'amulet', icon: 'assets/icons/slots/iconamulet.png' },
        { slotId: 'ring', icon: 'assets/icons/slots/iconring.png' },
        { slotId: 'earring', icon: 'assets/icons/slots/icontoken.png' },
      ],
      // Column 4: Weapons (3 slots)
      [
        { slotId: 'weapon1', icon: 'assets/icons/slots/iconweapon.png' },
        { slotId: 'weapon2', icon: 'assets/icons/slots/iconweapon.png' },
        { slotId: 'weapon3', icon: 'assets/icons/slots/iconshield.png' },
      ],
    ]
  })
  protected author = computed(() => {
    const gearset = this.gearset() as any
    return gearset?.username || gearset?.userId || 'Unknown'
  })
  protected avatarUrl = computed(() => {
    const gearset = this.gearset() as any
    return gearset?.avatarUrl || ''
  })
  protected isOwned = computed(() => {
    const userId = this.backend.sessionUserId() || 'local'
    return this.gearset()?.userId === userId
  })

  // Like functionality - using junction table approach
  protected likeCount = computed(() => {
    const gearset = this.gearset() as any
    // This will be populated by backend via count query or computed field
    return gearset?.likeCount || 0
  })

  protected isLikedByCurrentUser = computed(() => {
    const gearset = this.gearset() as any
    // This will be populated by backend via existence check
    return gearset?.isLikedByUser || false
  })

  protected canLike = computed(() => {
    return this.backend.isSignedIn() && !this.isOwned()
  })

  public constructor() {
    this.store.connectLevel(this.char.level)
    this.store.connectGearset(this.gearset)
    // Connect gearset store to mannequin for calculated stats
    this.store.connectToMannequin(this.mannequin)
  }

  protected goBack() {
    this.router.navigate(['/builds'])
  }

  protected handleTabChange(event: any) {
    const value = event.detail.value as 'stats' | 'abilities'
    const currentTab = this.tabFromUrl()
    
    // Always clear selected slot when clicking any tab
    // This handles both: switching tabs AND clicking same tab to close item detail
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        tab: value === 'stats' ? null : value,
        slot: null // Clear selected slot
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }

  protected async handleImport() {
    const gearset = this.gearset()
    if (!gearset) return

    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Import Gearset',
        label: 'Name',
        value: gearset.name,
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .result$.pipe(
        filter((it) => !!it),
        switchMap((newName) => {
          return this.gearsetService.create({
            ...gearset,
            id: null,
            name: newName,
            status: 'private',
            syncState: undefined,
            ipnsKey: undefined,
            ipnsName: undefined,
          })
        }),
      )
      .subscribe((record) => {
        this.router.navigate(['/gearsets', record.userId, record.id])
      })
  }

  protected async handleLike() {
    if (!this.canLike() || this.isLiking()) return
    
    const gearset = this.gearset()
    if (!gearset) return

    this.isLiking.set(true)
    try {
      const isLiked = this.isLikedByCurrentUser()
      
      if (isLiked) {
        await this.backend.publicTables.gearsets.unlike({ 
          user: gearset.userId, 
          id: gearset.id 
        })
        this.toast
          .create({
            message: 'Like removed',
            duration: 2000,
            position: 'top',
          })
          .then((toast) => toast.present())
      } else {
        await this.backend.publicTables.gearsets.like({ 
          user: gearset.userId, 
          id: gearset.id 
        })
        this.toast
          .create({
            message: 'Build liked!',
            duration: 2000,
            position: 'top',
          })
          .then((toast) => toast.present())
      }
      
      // Reload the gearset to get updated like count and status
      this.gearsetResource.reload()
    } catch (error) {
      console.error('Failed to like/unlike build:', error)
      this.toast
        .create({
          message: 'Failed to update like',
          duration: 2000,
          position: 'top',
          color: 'danger',
        })
        .then((toast) => toast.present())
    } finally {
      this.isLiking.set(false)
    }
  }

  protected getSlotItemId(slotId: string): string | null {
    const slot = this.slots()[slotId]
    if (!slot) return null
    if (typeof slot === 'string') return null
    return slot.itemId || null
  }

  protected getSlotGearScore(slotId: string): number | null {
    const slot = this.slots()[slotId]
    if (!slot) return null
    if (typeof slot === 'string') return null
    return slot.gearScore || null
  }

  protected getSlotPerks(slotId: string): any {
    const slot = this.slots()[slotId]
    if (!slot) return null
    if (typeof slot === 'string') return null
    return slot.perks || null
  }


  protected getPortraitImage(): string {
    const imageId = this.gearset()?.imageId
    if (imageId) {
      return `data:image/${imageId}`
    }
    return 'assets/landing.webp'
  }

  protected handleSlotClick(slotId: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { slot: slotId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }

  protected getUpdatedTime(): string | null {
    const updated = this.gearset()?.updated
    if (!updated) return null
    
    const now = Date.now()
    const updatedTime = new Date(updated).getTime()
    const diffMs = now - updatedTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Updated just now'
    if (diffMins < 60) return `Updated ${diffMins}m ago`
    if (diffHours < 24) return `Updated ${diffHours}h ago`
    if (diffDays < 7) return `Updated ${diffDays}d ago`
    if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)}w ago`
    return `Updated ${Math.floor(diffDays / 30)}mo ago`
  }

  protected async handleShare() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      this.toast
        .create({
          message: 'Link copied to clipboard',
          duration: 2000,
          position: 'top',
        })
        .then((toast) => toast.present())
    } catch (err) {
      console.error('Failed to copy URL:', err)
      this.toast
        .create({
          message: 'Failed to copy link',
          duration: 2000,
          position: 'top',
          color: 'danger',
        })
        .then((toast) => toast.present())
    }
  }

  protected handleCalculator() {
    // Build damage calculator state from current mannequin
    const mannequin = this.mannequin
    const attributes = mannequin.activeAttributes()
    const weapon = mannequin.activeWeapon()
    const modBase = mannequin.modBaseDamage()
    
    const state = {
      offender: {
        isBound: false,
        level: mannequin.level(),
        gearScore: patchPrecision(mannequin.gearScore()),
        attributePoints: {
          str: attributes?.str?.total || 5,
          dex: attributes?.dex?.total || 5,
          int: attributes?.int?.total || 5,
          foc: attributes?.foc?.total || 5,
          con: attributes?.con?.total || 5,
        },
        attributeModSums: {
          str: attributes?.str?.scale || 0,
          dex: attributes?.dex?.scale || 0,
          int: attributes?.int?.scale || 0,
          foc: attributes?.foc?.scale || 0,
          con: attributes?.con?.scale || 0,
        },
        attributeHealSum: 0,
        armorPenetration: damageModStack(),
        
        affixId: modBase?.Affix?.Affix?.StatusID || null,
        affixPercent: modBase?.Affix?.Percent ?? 0,
        affixScaling: getDamageScalingForWeapon(modBase?.Affix?.Affix),
        affixDamageType: modBase?.Affix?.Type || null,
        
        dotDamageType: null,
        dotDamagePercent: 0,
        dotDamagePotency: 0,
        dotDamageDuration: 0,
        dotDamageRate: 0,
        
        weaponTag: weapon?.weaponTag || null,
        weaponGearScore: weapon?.gearScore ?? 0,
        weaponScaling: getDamageScalingForWeapon(weapon?.weapon),
        weaponDamageType: modBase?.Weapon?.Type || null,
        weaponDamage: weapon?.weapon?.BaseDamage ?? 0,
        
        damageRow: null,
        damageCoef: mannequin.modDmgCoef()?.value ?? 0,
        damageAdd: 0,
        attackType: null,
        attackKind: 'Melee',
        
        modPvP: damageModStack(),
        modAmmo: damageModStack(),
        modCrit: damageModStack(),
        modBase: damageModStack(),
        modBaseDot: damageModStack(),
        modBaseAffix: damageModStack(),
        modDMG: damageModStack(),
        modDMGDot: damageModStack(),
        modDMGAffix: damageModStack(),
      },
      defender: {
        isBound: false,
        isPlayer: true,
        vitalId: null,
        level: 70,
        gearScore: 725,
        
        physicalArmor: damageModStack(),
        physicalArmorFortify: damageModStack(),
        physicalArmorAdd: damageModStack(),
        
        elementalArmor: damageModStack(),
        elementalArmorFortify: damageModStack(),
        elementalArmorAdd: damageModStack(),
        
        modABS: damageModStack(),
        modABSDot: damageModStack(),
        modABSAffix: damageModStack(),
        modWKN: damageModStack(),
        modWKNDot: damageModStack(),
        modWKNAffix: damageModStack(),
        modBaseReduction: damageModStack(),
        modBaseReductionDot: damageModStack(),
        modBaseReductionAffix: damageModStack(),
        modCritReduction: damageModStack(),
      }
    }
    
    const encodedState = compressToEncodedURIComponent(JSON.stringify(state))
    this.router.navigate(['/damage-calculator'], {
      queryParams: { state: encodedState }
    })
  }
}
