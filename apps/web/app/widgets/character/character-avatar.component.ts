import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NwModule } from '~/nw'
import { CharacterRecord } from '../../data'
import { CharacterAvatarStore } from './character-avatar.store'

@Component({
  standalone: true,
  selector: 'nwb-character-avatar',
  template: `
    <div
      class="ring-offset-base-100 w-full rounded-full ring-2 ring-offset-2 bg-gradient-to-b gradien avatar relative"
      [class.from-covenant-light]="isCovenant()"
      [class.to-covenant-dark]="isCovenant()"
      [class.ring-covenant-dark]="isCovenant()"

      [class.from-marauder-light]="isMarauder()"
      [class.to-marauder-dark]="isMarauder()"
      [class.ring-marauder-dark]="isMarauder()"

      [class.from-syndicate-light]="isSyndicate()"
      [class.to-syndicate-dark]="isSyndicate()"
      [class.ring-syndicate-dark]="isSyndicate()"
    >
      @if (faceLayer(); as url) {
        <img [src]="url" class="absolute top-0 left-0" />
      }
      @if (hairLayer(); as url) {
        <img [src]="url" class="absolute top-0 left-0" />
      }
      @if (beardLayer(); as url) {
        <img [src]="url" class="absolute top-0 left-0" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CharacterAvatarStore],
  imports: [CommonModule, NwModule],
  host: {
    class: 'avatar min-w-10',
  },
})
export class CharacterAvatarComponent {
  protected store = inject(CharacterAvatarStore)
  protected icon = this.store.icon
  protected faceLayer = computed(() => this.icon()?.face)
  protected hairLayer = computed(() => this.icon()?.hair)
  protected beardLayer = computed(() => this.icon()?.beard)

  public character = input<CharacterRecord>()
  public isCovenant = computed(() => this.store.faction() === 'covenant')
  public isMarauder = computed(() => this.store.faction() === 'marauder')
  public isSyndicate = computed(() => this.store.faction() === 'syndicate')
  public faceOptions = this.store.faceOptions
  public skinOptions = this.store.skinOptions
  public hairOptions = this.store.hairStyleOptions
  public hairColorOptions = this.store.hairColorOptions
  public beardOptions = this.store.beardStyleOptions
  public beardColorOptions = this.store.beardColorOptions

  public constructor() {
    this.store.connectCharacter(this.character)
  }
}
