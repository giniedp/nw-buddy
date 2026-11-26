/**
 * Localization of the Data tool: `@key` cells resolved by the `.loc.xml` files of one language. The files are found
 * by their extension in the catalog; the language is the folder they are in (`<lang>/<name>.loc.xml`).
 */
import { createSignal, type Accessor, type Setter } from 'solid-js'
import type { NwbtClient } from '../../api/browse'
import { parseLocXml } from '../../formats/loc/loc'
import type { FileContents } from '../../api/files'

const PREFERRED_LANGUAGE = 'en-us'
const PARALLEL_FILES = 8

/**
 * The loc strings of one selected language
 */
export class Localization {
  /**
   * The selected language, null until the first loc cell asks for one (reactive)
   */
  public readonly language: Accessor<string | null>

  private readonly nwbt: NwbtClient
  private readonly files: FileContents
  private readonly setLanguageSignal: Setter<string | null>
  /**
   * The strings of the selected language, by lowercase key without `@`; null until loaded
   */
  private readonly strings: Accessor<Map<string, string> | null>
  private readonly setStrings: Setter<Map<string, string> | null>
  /**
   * Loc files by language folder
   */
  private byLanguage: Promise<Map<string, string[]>> | null = null
  private loading: Promise<void> | null = null
  private loadingLanguage: string | null = null

  public constructor(nwbt: NwbtClient, files: FileContents) {
    this.nwbt = nwbt
    this.files = files
    const [language, setLanguage] = createSignal<string | null>(null)
    this.language = language
    this.setLanguageSignal = setLanguage
    const [strings, setStrings] = createSignal<Map<string, string> | null>(null)
    this.strings = strings
    this.setStrings = setStrings
  }

  /**
   * The languages that have loc files, sorted
   */
  public async languages(): Promise<string[]> {
    return [...(await this.locFiles()).keys()].sort()
  }

  /**
   * Selects the language and loads its strings
   */
  public setLanguage(value: string) {
    this.setLanguageSignal(value)
    void this.load(value)
  }

  /**
   * Starts loading the preferred language (or the first one) unless a language is selected
   */
  public ensure() {
    if (this.language() != null) {
      return
    }
    void this.languages().then((languages) => {
      if (this.language() == null && languages.length) {
        this.setLanguage(languages.includes(PREFERRED_LANGUAGE) ? PREFERRED_LANGUAGE : languages[0])
      }
    })
  }

  /**
   * The text of a loc key (`@ui_name` or `ui_name`). Undefined while loading or when the key is unknown. Reactive:
   * reads the loaded strings.
   */
  public text(key: string): string | undefined {
    const map = this.strings()
    if (!map) {
      return undefined
    }
    return map.get((key.startsWith('@') ? key.slice(1) : key).toLowerCase())
  }

  /**
   * Whether the strings of the selected language are loaded (reactive)
   */
  public ready() {
    return this.strings() != null
  }

  private locFiles() {
    if (!this.byLanguage) {
      this.byLanguage = this.nwbt.searchFiles('.loc.xml', [], undefined, 20000).then((result) => {
        const byLanguage = new Map<string, string[]>()
        for (const file of result.files) {
          if (!file.path.toLowerCase().endsWith('.loc.xml')) {
            continue
          }
          const parts = file.path.split('/')
          const language = parts.length > 1 ? parts[parts.length - 2] : ''
          const list = byLanguage.get(language) ?? []
          list.push(file.path)
          byLanguage.set(language, list)
        }
        return byLanguage
      })
      this.byLanguage.catch(() => (this.byLanguage = null))
    }
    return this.byLanguage
  }

  private async load(value: string) {
    if (this.loadingLanguage === value && this.loading) {
      return this.loading
    }
    this.loadingLanguage = value
    this.setStrings(null)
    this.loading = (async () => {
      const paths = (await this.locFiles()).get(value) ?? []
      const result = new Map<string, string>()
      let next = 0
      const worker = async () => {
        while (next < paths.length) {
          const path = paths[next++]
          try {
            const text = new TextDecoder().decode(await this.files.fileBytes(path))
            for (const it of parseLocXml(text)) {
              result.set(it.key.toLowerCase(), it.value)
            }
          } catch (err) {
            console.warn('loc file not read:', path, String(err))
          }
        }
      }
      await Promise.all(Array.from({ length: PARALLEL_FILES }, worker))
      if (this.loadingLanguage === value) {
        this.setStrings(result)
      }
    })()
    return this.loading
  }
}
