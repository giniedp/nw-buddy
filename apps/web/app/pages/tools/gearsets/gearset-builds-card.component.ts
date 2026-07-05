import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { getAbilityCategoryTag } from '@nw-data/common'
import { GearsetRecord, injectNwData } from '~/data'
import { BackendService } from '~/data/backend'
import { GearsetStore } from '~/data/gearsets/gearset.store'
import { CharacterStore } from '~/data/characters/character.store'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { getWeaponTypeInfo } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgDiamond, svgFileImport, svgSwords, svgUser } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { AbilityDetailModule } from '~/widgets/data/ability-detail'
import { selectSignal } from '~/utils'

@Component({
  selector: 'nwb-gearset-builds-card',
  templateUrl: './gearset-builds-card.component.html',
  styleUrl: './gearset-builds-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, IconsModule, TooltipModule, ItemDetailModule, AbilityDetailModule],
  providers: [GearsetStore, CharacterStore, Mannequin],
  host: {
    class: 'block',
  },
})
export class GearsetBuildsCardComponent {
  private db = injectNwData()
  private router = inject(Router)
  private backend = inject(BackendService)
  private store = inject(GearsetStore)
  private char = inject(CharacterStore)
  private mannequin = inject(Mannequin)

  public gearset = input.required<GearsetRecord>()
  public import = output<GearsetRecord>()

  protected iconUser = svgUser
  protected iconRating = svgDiamond
  protected iconImport = svgFileImport
  protected iconWeapons = svgSwords

  protected isOwnBuild = computed(() => {
    const currentUserId = this.backend.session()?.id
    const gearsetUserId = this.gearset()?.userId
    return currentUserId && gearsetUserId && currentUserId === gearsetUserId
  })

  protected importTooltip = computed(() => {
    return this.isOwnBuild() ? 'You own this build' : 'Import to your collection'
  })

  // Use mannequin for calculated stats
  protected gearScore = computed(() => {
    const gs = this.mannequin.gearScore()
    return gs ? Math.floor(gs).toString() : '-'
  })

  // Like count from gearset data
  protected likeCount = computed(() => {
    const gearset = this.gearset() as any
    return gearset?.likeCount || 0
  })

  public constructor() {
    // Connect gearset to mannequin for calculated stats
    this.store.connectLevel(this.char.level)
    this.store.connectGearset(this.gearset)
    this.store.connectToMannequin(this.mannequin)
  }

  protected handleViewClick() {
    const gearset = this.gearset()
    this.router.navigate(['/builds', gearset.userId, gearset.id])
  }

  protected handleImportClick(event: Event) {
    event.stopPropagation()
    this.import.emit(this.gearset())
  }


  protected getWeaponNames() {
    const skills = this.gearset()?.skills || {}
    const weapons: string[] = []
    if (skills.primary) {
      const skill = typeof skills.primary === 'string' ? null : skills.primary
      if (skill?.weapon) {
        weapons.push(skill.weapon)
      }
    }
    if (skills.secondary) {
      const skill = typeof skills.secondary === 'string' ? null : skills.secondary
      if (skill?.weapon) {
        weapons.push(skill.weapon)
      }
    }
    return weapons.join(' / ') || 'No weapons'
  }

  protected getTotalAttributes() {
    const attrs = this.gearset()?.attrs || {}
    return Object.values(attrs).reduce((sum: number, val: number) => sum + (val || 0), 0)
  }

  protected getAttributeValue(attr: string): number {
    const attrs = this.gearset()?.attrs || {}
    return attrs[attr] || 0
  }

  protected hasAttributes(): boolean {
    const total = this.getTotalAttributes()
    return typeof total === 'number' && total > 0
  }

  protected getEquipmentCount(): number {
    const slots = this.gearset()?.slots || {}
    return Object.values(slots).filter((item) => !!item).length
  }


  protected getPortraitImage(): string {
    const imageId = this.gearset()?.imageId
    if (imageId) {
      // If custom image is set, use it (from local storage or backend)
      return `data:image/${imageId}` // Placeholder - adjust based on your image storage
    }
    // Fallback to game artwork
    return 'assets/landing.webp'
  }

  protected canUseShield(weaponTag: string): boolean {
    // Weapons that can equip shields
    return weaponTag === 'Sword' || weaponTag === 'Flail'
  }

  protected getWeapons() {
    const skills = this.gearset()?.skills || {}
    const slots = this.gearset()?.slots || {}
    const weapons: Array<{ 
      name: string
      icon: string
      slot: string
      hasShield: boolean
      shieldIcon?: string
      itemId?: string
      shieldItemId?: string
    }> = []
    
    if (skills.primary) {
      const skill = typeof skills.primary === 'string' ? null : skills.primary
      if (skill?.weapon) {
        const weaponInfo = getWeaponTypeInfo(skill.weapon)
        const weapon1Slot = slots['weapon1']
        const weapon3Slot = slots['weapon3']
        const canHaveShield = this.canUseShield(skill.weapon)
        const hasShield = canHaveShield && !!weapon3Slot
        
        weapons.push({
          name: weaponInfo?.UIName || skill.weapon,
          icon: weaponInfo?.IconPathSmall || weaponInfo?.IconPath || 'assets/icons/weapons/1hsword.png',
          slot: 'Primary',
          hasShield,
          shieldIcon: hasShield ? 'assets/icons/slots/1hshieldd.png' : undefined,
          itemId: typeof weapon1Slot === 'string' ? null : weapon1Slot?.itemId,
          shieldItemId: typeof weapon3Slot === 'string' ? null : weapon3Slot?.itemId
        })
      }
    }
    
    if (skills.secondary) {
      const skill = typeof skills.secondary === 'string' ? null : skills.secondary
      if (skill?.weapon) {
        const weaponInfo = getWeaponTypeInfo(skill.weapon)
        const weapon2Slot = slots['weapon2']
        weapons.push({
          name: weaponInfo?.UIName || skill.weapon,
          icon: weaponInfo?.IconPathSmall || weaponInfo?.IconPath || 'assets/icons/weapons/1hsword.png',
          slot: 'Secondary',
          hasShield: false,
          itemId: typeof weapon2Slot === 'string' ? null : weapon2Slot?.itemId
        })
      }
    }
    
    return weapons
  }

  protected hasWeapons(): boolean {
    return this.getWeapons().length > 0
  }

  protected getPrimaryWeapon() {
    const weapons = this.getWeapons()
    return weapons.find(w => w.slot === 'Primary') || null
  }

  protected getSecondaryWeapon() {
    const weapons = this.getWeapons()
    return weapons.find(w => w.slot === 'Secondary') || null
  }

  protected getUserAvatar(): string {
    // Avatar URL is now included in the gearset data from the expanded relation
    const gearset = this.gearset() as any
    return gearset?.avatarUrl || ''
  }

  protected getUserUsername(): string {
    // Username is now included in the gearset data from the expanded relation
    const gearset = this.gearset() as any
    return gearset?.username || gearset?.userId?.substring(0, 12) || 'Unknown'
  }

  protected primaryAbilities = selectSignal(
    {
      skills: computed(() => this.gearset()?.skills || {}),
      abilityMap: this.db.abilitiesByIdMap(),
    },
    ({ skills, abilityMap }) => {
      const abilities: Array<{ icon: string; name: string; id: string; type: string; isActive: boolean } | null> = []
      
      if (!abilityMap) {
        return [null, null, null]
      }
      
      if (skills.primary) {
        const skill = typeof skills.primary === 'string' ? null : skills.primary
        if (skill) {
          const tree1Abilities = (skill.tree1 || []).map(id => abilityMap.get(id)).filter(Boolean)
          const tree2Abilities = (skill.tree2 || []).map(id => abilityMap.get(id)).filter(Boolean)
          const allAbilities = [...tree1Abilities, ...tree2Abilities]
          
          allAbilities.slice(0, 3).forEach(ability => {
            abilities.push({
              icon: ability.Icon,
              name: ability.DisplayName,
              id: ability.AbilityID,
              type: getAbilityCategoryTag(ability),
              isActive: !!ability.IsActiveAbility
            })
          })
        }
      }
      
      while (abilities.length < 3) {
        abilities.push(null)
      }
      
      return abilities
    }
  )

  protected secondaryAbilities = selectSignal(
    {
      skills: computed(() => this.gearset()?.skills || {}),
      abilityMap: this.db.abilitiesByIdMap(),
    },
    ({ skills, abilityMap }) => {
      const abilities: Array<{ icon: string; name: string; id: string; type: string; isActive: boolean } | null> = []
      
      if (!abilityMap) {
        return [null, null, null]
      }
      
      if (skills.secondary) {
        const skill = typeof skills.secondary === 'string' ? null : skills.secondary
        if (skill) {
          const tree1Abilities = (skill.tree1 || []).map(id => abilityMap.get(id)).filter(Boolean)
          const tree2Abilities = (skill.tree2 || []).map(id => abilityMap.get(id)).filter(Boolean)
          const allAbilities = [...tree1Abilities, ...tree2Abilities]
          
          allAbilities.slice(0, 3).forEach(ability => {
            abilities.push({
              icon: ability.Icon,
              name: ability.DisplayName,
              id: ability.AbilityID,
              type: getAbilityCategoryTag(ability),
              isActive: !!ability.IsActiveAbility
            })
          })
        }
      }
      
      while (abilities.length < 3) {
        abilities.push(null)
      }
      
      return abilities
    }
  )

  protected getUpdatedTime(): string | null {
    const updated = (this.gearset() as any)?.updated
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
}

