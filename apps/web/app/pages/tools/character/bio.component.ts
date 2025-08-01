import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { filter, switchMap } from 'rxjs'
import { CharacterRecord, CharactersService, CharacterStore } from '../../../data'
import { BackendService } from '../../../data/backend'
import { NwModule } from '../../../nw'
import { SvgIconComponent } from '../../../ui/icons'
import { svgPlus } from '../../../ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService, PromptDialogComponent } from '../../../ui/layout'
import { CharacterAvatarComponent } from '../../../widgets/character'

export type FactionOption = {
  value: CharacterRecord['faction']
  label: string
}

const FACTION_OPTIONS: Array<FactionOption> = [
  {
    value: null,
    label: '',
  },
  {
    value: 'covenant',
    label: 'ftue_archetypes_name_covenant',
  },
  {
    value: 'marauder',
    label: 'ftue_archetypes_name_marauders',
  },
  {
    value: 'syndicate',
    label: 'ftue_archetypes_name_syndicate',
  },
]

@Component({
  selector: 'nwb-bio-page',
  templateUrl: './bio.component.html',
  imports: [NwModule, CharacterAvatarComponent, SvgIconComponent, FormsModule, LayoutModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ion-page',
  },
})
export class BioComponent {
  private backend = inject(BackendService)
  private service = inject(CharactersService)
  private store = inject(CharacterStore)
  private modal = inject(ModalService)

  protected plusIcon = svgPlus
  protected character = this.store.record
  protected characterName = this.store.name
  protected characterIsMale = this.store.isMale
  protected serverName = computed(() => this.character()?.serverName)
  protected faction = computed(() => this.character()?.faction || null)
  protected canDelete = computed(() => this.service.count() > 1)
  protected canCreate = computed(() => this.service.count() < 5)

  protected factionOptions = FACTION_OPTIONS

  protected characters = toSignal(
    toObservable(this.backend.sessionUserId).pipe(switchMap((userId) => this.service.observeRecords(userId))),
  )

  protected handleSelectCharacter(character: CharacterRecord) {
    // update, so its updatedAt field is bumped
    this.service.update(character.id, character)
    // load without params, loads least recently used
    this.store.load()
  }

  protected handleNameChange(value: string) {
    this.store.update({ name: value })
  }

  protected handleServerChange(value: string) {
    this.store.update({ serverName: value })
  }

  protected handleFactionChange(value: CharacterRecord['faction']) {
    this.store.update({ faction: value })
  }

  protected handleToggleGender() {
    this.store.update({
      gender: this.store.isMale() ? 'female' : 'male',
    })
  }

  protected handleSkinChange(value: number) {
    this.store.update({ skin: value })
  }

  protected handleFaceChange(value: number) {
    this.store.update({ face: value })
  }

  protected handleHairStyleChange(value: number) {
    this.store.update({ hairStyle: value })
  }

  protected handleHairColorChange(value: number) {
    this.store.update({ hairColor: value })
  }

  protected handleBeardStyleChange(value: number) {
    this.store.update({ beardStyle: value })
  }

  protected handleBeardColorChange(value: number) {
    this.store.update({ beardColor: value })
  }

  protected handleDeleteCharacter() {
    if (!this.canDelete()) {
      return
    }
    const toDelete = this.character().id
    //const toLoad = this.service.table.countWhere({ userId: })
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Delete',
        body: 'Are you sure you want to delete the character?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .result$.pipe(
        filter((it) => !!it),
        switchMap(async () => {
          return this.service.delete(this.character().id)
        }),
      )
      .subscribe({
        error: () => {
          this.modal.showToast({
            message: 'Failed to delete character',
            duration: 3000,
            color: 'danger',
          })
        },
        next: () => {
          this.store.load()
          this.modal.showToast({
            message: `Character ${this.character().name} deleted`,
            duration: 3000,
            color: 'success',
          })
        },
      })
  }

  protected handleCreateCharacter() {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Create new character',
        label: 'Name',
        value: 'New Character Name',
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .result$.pipe(
        filter((it) => !!it),
        switchMap((newName) => {
          return this.service.create({
            name: newName,
          })
        }),
      )
      .subscribe({
        error: () => {
          this.modal.showToast({
            message: 'Failed to create character',
            duration: 3000,
            color: 'danger',
          })
        },
        next: (record) => {
          this.store.load(record.id)
          this.modal.showToast({
            message: `Character ${record.name} created`,
            duration: 3000,
            color: 'success',
          })
        },
      })
  }
}
