import { Directive, effect, inject, input, OnDestroy, output, untracked } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { nwbtAssetsUrl, nwbtFetch, nwbtFileStatUrl } from '@nw-serve'
import { IDisposable } from 'monaco-editor'
import { from } from 'rxjs'
import { environment } from '../../../../environments'
import { CodeEditorComponent } from '../../../ui/code-editor'
import { monaco as m } from '../../../ui/code-editor/monaco-editor'
import { MonacoService } from '../../../ui/code-editor/monaco.service'

export type MonacoSliceAssetCommand = {
  action: 'open' | 'search' | 'newTab'
  assetId: AssetRef | string
  assetPath: string
}

@Directive({
  selector: '[nwbMonacoSliceExtension]',
})
export class MonacoSliceExtensionDirective implements OnDestroy {
  public nwbMonacoSliceExtension = input<void>()
  public nwbMonacoAssetCommand = output<MonacoSliceAssetCommand>()

  private monaco = toSignal(from(inject(MonacoService).loadMonaco()))
  private editor = inject(CodeEditorComponent).editor
  private disposables: IDisposable[] = []

  public constructor() {
    effect(() => {
      const monaco = this.monaco()
      const editor = this.editor()
      if (monaco && editor) {
        untracked(() => {
          this.disposables.push(this.registerHover())
          this.disposables.push(this.registerCodeLensJson())
        })
      }
    })
  }

  public ngOnDestroy(): void {
    this.disposables.forEach((d) => d.dispose())
    this.disposables = []
  }

  private registerHover(): IDisposable {
    const monaco = this.monaco()
    const editor = this.editor()
    return monaco.languages.registerHoverProvider(['json', 'xml'], {
      provideHover: async (model, position) => {
        const line = model.getLineContent(position.lineNumber)
        const sliceAssetId = matchJsonSliceAssetId(line)
        if (sliceAssetId) {
          const text = await fetchAssetInfo(sliceAssetId).then((it) => JSON.stringify(it, null, 2))
          return {
            range: new monaco.Range(
              position.lineNumber,
              line.indexOf(sliceAssetId),
              position.lineNumber,
              model.getLineMaxColumn(position.lineNumber),
            ),
            contents: [
              {
                value: '```json\n' + text + '\n```',
              },
            ],
          }
        }
        const assetRef = matchAsset(model, position.lineNumber)
        if (assetRef) {
          const text = await fetchAssetInfos(assetRef.guid).then((it) => JSON.stringify(it, null, 2))
          return {
            range: new monaco.Range(
              position.lineNumber,
              line.indexOf(assetRef.guid),
              position.lineNumber,
              model.getLineMaxColumn(position.lineNumber),
            ),
            contents: [
              {
                isTrusted: true,
                value: '```json\n' + text + '\n```',
              },
            ],
          }
        }
        const textureAssetId = matchTextureAssetId(line)
        if (textureAssetId) {
          const asset = await fetchAssetInfo(textureAssetId)
          const text = JSON.stringify(asset, null, 2)
          return {
            range: new monaco.Range(
              position.lineNumber,
              line.indexOf(textureAssetId),
              position.lineNumber,
              model.getLineMaxColumn(position.lineNumber),
            ),
            contents: [
              !asset.file
                ? null
                : {
                    isTrusted: true,
                    value: `![monaco-img-preview](${location.origin}${environment.nwbtUrl}/files/${asset.file}.png?size=256)`,
                  },
              {
                isTrusted: true,
                value: '```json\n' + text + '\n```',
              },
            ].filter((it) => !!it),
          }
        }
        return null
      },
    })
  }

  private registerCodeLensJson(): IDisposable {
    const monaco = this.monaco()
    const editor = this.editor()
    const cmdOpenByAssetId = editor.addCommand(0, async (cmd, assetId) => {
      this.nwbMonacoAssetCommand.emit({
        assetId: assetId,
        assetPath: null,
        action: 'open',
      })
    })
    const cmdOpenTabByAssetId = editor.addCommand(0, async (cmd, assetId) => {
      this.nwbMonacoAssetCommand.emit({
        assetId: assetId,
        assetPath: null,
        action: 'newTab',
      })
    })
    const cmdSearchByAssetId = editor.addCommand(0, async (cmd, assetId) => {
      this.nwbMonacoAssetCommand.emit({
        assetId: assetId,
        assetPath: null,
        action: 'search',
      })
    })

    const cmdOpenByAssetPath = editor.addCommand(0, async (cmd, assetPath) => {
      this.nwbMonacoAssetCommand.emit({
        assetId: null,
        assetPath: assetPath,
        action: 'open',
      })
    })
    const cmdOpenTabByAssetPath = editor.addCommand(0, async (cmd, assetPath) => {
      this.nwbMonacoAssetCommand.emit({
        assetId: null,
        assetPath: assetPath,
        action: 'newTab',
      })
    })

    return monaco.languages.registerCodeLensProvider(['json', 'xml'], {
      provideCodeLenses: (model, token) => {
        const lenses: m.languages.CodeLens[] = []
        for (let i = 0; i < model.getLineCount(); i++) {
          const line = model.getLineContent(i + 1)
          const sliceAssetId = matchJsonSliceAssetId(line)
          if (sliceAssetId) {
            const range = {
              startLineNumber: i + 1,
              startColumn: line.indexOf(sliceAssetId),
              endLineNumber: i + 1,
              endColumn: line.length,
            }
            lenses.push({
              range,
              command: {
                id: cmdSearchByAssetId,
                title: 'Search',
                arguments: [sliceAssetId],
              },
            })
            lenses.push({
              range,
              command: {
                id: cmdOpenByAssetId,
                title: 'Open',
                arguments: [sliceAssetId],
              },
            })
            lenses.push({
              range,
              command: {
                id: cmdOpenTabByAssetId,
                title: 'New tab',
                arguments: [sliceAssetId],
              },
            })
          }
          const assetRef = matchAsset(model, i + 1)
          if (assetRef) {
            const range = {
              startLineNumber: i + 1,
              startColumn: line.indexOf(sliceAssetId),
              endLineNumber: i + 1,
              endColumn: line.length,
            }
            lenses.push({
              range,
              command: {
                id: cmdSearchByAssetId,
                title: 'Search',
                arguments: [assetRef],
              },
            })
            lenses.push({
              range,
              command: {
                id: cmdOpenByAssetId,
                title: 'Open',
                arguments: [assetRef],
              },
            })
            lenses.push({
              range,
              command: {
                id: cmdOpenTabByAssetId,
                title: 'New tab',
                arguments: [assetRef],
              },
            })
          }
          const textureAssetId = matchTextureAssetId(line)
          if (textureAssetId) {
            lenses.push({
              range: {
                startLineNumber: i + 1,
                startColumn: line.indexOf(textureAssetId),
                endLineNumber: i + 1,
                endColumn: line.length,
              },
              command: {
                id: cmdOpenByAssetId,
                title: 'Open',
                arguments: [textureAssetId],
              },
            })
            lenses.push({
              range: {
                startLineNumber: i + 1,
                startColumn: line.indexOf(textureAssetId),
                endLineNumber: i + 1,
                endColumn: line.length,
              },
              command: {
                id: cmdOpenTabByAssetId,
                title: 'New tab',
                arguments: [textureAssetId],
              },
            })
          }
          const assetPath = matchJsonSliceAssetPath(line)
          if (assetPath) {
            lenses.push({
              range: {
                startLineNumber: i + 1,
                startColumn: line.indexOf(assetPath),
                endLineNumber: i + 1,
                endColumn: line.length,
              },
              command: {
                id: cmdOpenByAssetPath,
                title: 'Open',
                arguments: [assetPath],
              },
            })
            lenses.push({
              range: {
                startLineNumber: i + 1,
                startColumn: line.indexOf(assetPath),
                endLineNumber: i + 1,
                endColumn: line.length,
              },
              command: {
                id: cmdOpenTabByAssetPath,
                title: 'New tab',
                arguments: [assetPath],
              },
            })
          }
        }
        return {
          lenses: lenses,
          dispose: () => {},
        }
      },
      resolveCodeLens: function (model, codeLens, token) {
        return codeLens
      },
    })
  }
}

export type AssetRef = {
  guid: string
  subId: string
  type: string
  hint: string
}
function matchAsset(model: m.editor.ITextModel, line: number): AssetRef {
  // "guid": "D589E902-9E55-5E48-973D-669A24AA7A25",
  // "subid": "00000000-0000-0000-0000-000000000000",
  // "type": "C2869E3B-DDA0-4E01-8FE3-6770D788866B",
  // "hint": "objects/default/primitive_box.cgf"
  const guid = matchJsonStringProperty(model.getLineContent(line), 'guid')
  if (!guid) {
    return null
  }
  const subId =
    matchJsonStringProperty(model.getLineContent(line + 1), 'subid') ||
    matchJsonNumberProperty(model.getLineContent(line + 1), 'subid')
  if (!subId) {
    return null
  }
  const type = matchJsonStringProperty(model.getLineContent(line + 2), 'type')
  const hint = matchJsonStringProperty(model.getLineContent(line + 3), 'hint')
  return {
    guid,
    subId,
    type,
    hint,
  }
}

function matchJsonStringProperty(line: string, propertyName: string) {
  // "sliceAssetId": "{2DCF02DE-BBA1-5C04-853D-4CA7EAE1F9E8}:8f09fd"
  // "assetpath": "materials/water/rivers/jav_fst_riverwater_a.mtl"
  const regex = `"${propertyName}"\\s*:\\s*"(.*?)"`
  const match = line.match(regex)
  if (match) {
    return match[1]
  }
  return null
}

function matchJsonNumberProperty(line: string, propertyName: string) {
  // "subid": 2
  const regex = `"${propertyName}"\\s*:\\s*(\\d+)`
  const match = line.match(regex)
  if (match) {
    return match[1]
  }
  return null
}

function matchTextureAssetId(line: string) {
  // <Texture Map="Emittance" File="..." AssetId="{6DA11128-9011-5C41-90A1-FBB9C0DD6697}:0"/>
  const regex = `<\\s*Texture\\s+[^>]*AssetId\\s*=\\s*"(.*?)"`
  const match = line.match(regex)
  if (match) {
    return match[1]
  }
  return null
}

function matchJsonSliceAssetId(line: string) {
  return matchJsonStringProperty(line, 'sliceAssetId')
}

function matchJsonSliceAssetPath(line: string) {
  return matchJsonStringProperty(line, 'assetpath')
}

async function fetchAssetInfo(assetId: string) {
  return fetchAssetInfos(assetId).then((it) => it.asset)
}

async function fetchAssetInfos(assetId: string) {
  return nwbtFetch(environment.nwbtUrl, nwbtAssetsUrl(assetId))
}

async function fetchAssetFileInfos(assetFile: string) {
  return nwbtFetch(environment.nwbtUrl, nwbtFileStatUrl(assetFile)).then((it) => it.items)
}
