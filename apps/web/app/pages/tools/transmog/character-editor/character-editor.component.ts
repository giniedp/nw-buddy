import { NgTemplateOutlet } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { LayoutModule, ModalService } from '~/ui/layout'
import { injectBreakpoint } from '~/utils'
import { CharacterSlotModel, CharacterViewComponent } from '~/widgets/character-view'
import { ComposeRequest, ModelDownloadDialogComponent, ModelFile } from '~/widgets/model-view'
import { CharacterEditorPanelComponent } from './character-editor-panel.component'
import { CharacterEditorStore, CharacterEditorValue } from './character-editor.store'

/**
 * The character editor: the character view and the panel on the editor's store. A form control of the transmog set's
 * gender and slots (`TransmogRecord`), like the classic `nwb-transmog-editor` it replaces.
 *
 * @remarks
 * Projects `[header]` content above the panel and the default content below it.
 */
@Component({
  selector: 'nwb-character-editor',
  templateUrl: './character-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CharacterViewComponent, CharacterEditorPanelComponent, LayoutModule, NgTemplateOutlet],
  providers: [
    CharacterEditorStore,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CharacterEditorComponent),
      multi: true,
    },
  ],
  host: {
    class: 'ion-page relative h-full',
  },
})
export class CharacterEditorComponent implements ControlValueAccessor {
  protected store = inject(CharacterEditorStore)
  private view = viewChild(CharacterViewComponent)
  private isLargeContent = toSignal(injectBreakpoint('(min-width: 992px)'))
  protected showSidebar = computed(() => !!this.isLargeContent())
  protected showModal = computed(() => !this.isLargeContent())
  protected isDisabled = signal(false)
  private modal = inject(ModalService)

  private onChange: (value: CharacterEditorValue) => void = () => {
    //
  }
  private onTouched: () => void = () => {
    //
  }

  public constructor() {
    // the user's edits, loads don't count
    effect(() => {
      const revision = this.store.revision()
      if (revision > 0) {
        untracked(() => {
          this.onChange(this.store.getValue())
          this.onTouched()
        })
      }
    })
  }

  public writeValue(value: Partial<CharacterEditorValue> | null): void {
    this.store.load(value)
  }

  public registerOnChange(fn: (value: CharacterEditorValue) => void): void {
    this.onChange = fn
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  public setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled)
  }

  /**
   * Saves a screenshot of the view
   */
  public capturePhoto() {
    return this.view()?.capturePhoto()
  }

  /**
   * Opens the downloads of the character as the view shows it: worn models, hidden parts and weapons. The nwbt export
   * also has the dyes and the playing animation (the emote's clips or the idle).
   */
  protected openDownloads() {
    ModelDownloadDialogComponent.open(this.modal, {
      files: {
        model: { url: this.store.characterUrl(), rootUrl: this.store.characterRootUrl() },
        parts: Object.values(this.store.viewSlots())
          .flat()
          .map((it) => modelFile(it)),
        hidden: this.exportHidden(),
        sockets: Object.entries(this.store.viewSockets()).map(([socket, { models, offset }]) => {
          return { name: socket, offset, models: models.map((it) => modelFile(it)) }
        }),
      },
      filesNote: 'Without dyes and animation.',
      compose: async () => this.composeRequest(),
      gameFile: null,
      name: this.exportName(),
    })
  }

  private composeRequest(): ComposeRequest {
    const view = this.view()
    return {
      model: this.store.characterFile(),
      hidden: this.exportHidden(),
      parts: this.store.exportParts().map((it) => {
        return {
          name: it.name,
          skin: it.skin,
          material: it.material,
          clothFrom: it.clothFrom,
          params: view?.materialParamsOf(it.model) ?? null,
        }
      }),
      sockets: Object.entries(this.store.viewSockets()).map(([name, { models, offset }]) => {
        return {
          name,
          offset,
          models: models.map((it) => {
            return { model: it.source.model, params: view?.materialParamsOf(it) ?? undefined }
          }),
        }
      }),
      animations: this.store.exportAnimations(),
      name: this.exportName(),
    }
  }

  private exportName() {
    return `character-${this.store.gender()}`
  }

  /**
   * The parts an export leaves out
   */
  private exportHidden(): string[] {
    // xray: the silhouette skin over the whole body, the game and the viewer don't draw it
    return [...this.store.hiddenParts(), 'xray']
  }
}

function modelFile({ url, rootUrl }: CharacterSlotModel): ModelFile {
  return { url, rootUrl: rootUrl ?? url }
}
