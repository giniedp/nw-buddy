import { Component, computed, inject, input, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { GearsetRecord, GearsetSection, getGearsetSections } from '../../../../data'
import { LayoutModule, ModalOpenOptions, ModalService } from '../../../../ui/layout'
import { PlatformService } from '../../../../utils/services/platform.service'
import { NwModule } from '../../../../nw'

@Component({
  selector: 'nwb-enbed-gearset-dialog',
  templateUrl: './embed-dialog.component.html',
  imports: [FormsModule, LayoutModule, NwModule],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class EmbedGearsetDialogComponent {
  private platform = inject(PlatformService)
  private modal = inject(ModalService)

  public static open(modal: ModalService, options: ModalOpenOptions<EmbedGearsetDialogComponent>) {
    options.size ??= ['y-auto', 'x-sm']
    options.content = EmbedGearsetDialogComponent
    return modal.open<EmbedGearsetDialogComponent, void>(options)
  }
  public gearset = input<GearsetRecord>()
  protected allSections = signal(getGearsetSections())
  protected sections = signal(getGearsetSections())

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
    if (sections.length === 0) {
      sections = getGearsetSections()
    }
    this.sections.set(sections)
  }

  protected embedUrl = computed(() => {
    const userId = this.gearset().userId
    const gearsetId = this.gearset().id
    const sections = this.sections()
    const allSet = !sections.length || sections.length === getGearsetSections().length

    const url = new URL(`${this.platform.websiteUrl}/gearsets/embed/${userId}/${gearsetId}`)
    for (const key of getGearsetSections()) {
      if (!allSet && !sections.includes(key)) {
        url.searchParams.set(key, 'false')
      }
    }

    return url.toString()
  })

  protected embedSnippet = computed(() => {
    return [
      `<script src="${this.platform.websiteUrl}/embed.js"></script>`,
      `<iframe src="${this.embedUrl()}" style="width: 100%; border: none;"></iframe>`,
    ].join('\n')
  })

  protected handleCopyUrl() {
    navigator.clipboard
      .writeText(this.embedUrl())
      .then(() => {
        this.modal.showToast({
          message: 'Embed URL copied to clipboard',
          color: 'success',
          duration: 2000,
        })
      })
      .catch(() => {
        this.modal.showToast({
          message: 'Failed to copy embed URL',
          color: 'error',
          duration: 2000,
        })
      })
  }

  protected handleCopySnippet() {
    navigator.clipboard
      .writeText(this.embedSnippet())
      .then(() => {
        this.modal.showToast({
          message: 'Embed snipped copied to clipboard',
          color: 'success',
          duration: 2000,
        })
      })
      .catch(() => {
        this.modal.showToast({
          message: 'Failed to copy embed snippet',
          color: 'error',
          duration: 2000,
        })
      })
  }
}
