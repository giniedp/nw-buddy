import { Injectable } from '@angular/core'
import type * as monaco from 'monaco-editor'
import { injectWindow } from '~/utils/injection/window'
import './monaco-editor'

@Injectable({ providedIn: 'root' })
export class MonacoService {
  private window = injectWindow()
  private loader: Promise<typeof monaco>
  public loadMonaco() {
    const window = this.window
    const baseUrl = '/assets/monaco-editor/min/vs'
    this.loader ||= new Promise<any>(async (resolve) => {
      const onGotAmdLoader: any = (require?: any) => {
        let usedRequire = require || window.require
        let requireConfig = { paths: { vs: `${baseUrl}` } }
        usedRequire.config(requireConfig)
        usedRequire([`vs/editor/editor.main`], (main: any) => {
          resolve(main)
        })
      }

      if (!window.require) {
        const loaderScript: HTMLScriptElement = document.createElement('script')
        loaderScript.type = 'text/javascript'
        loaderScript.src = `${baseUrl}/loader.js`
        loaderScript.addEventListener('load', () => {
          onGotAmdLoader()
        })
        document.body.appendChild(loaderScript)
      } else {
        const code = await fetch(`${baseUrl}/loader.js`).then((res) => res.text())
        let scriptElem = document.createElement('script')
        scriptElem.type = 'text/javascript'
        scriptElem.text = [
          // Monaco uses a custom amd loader that over-rides node's require.
          // Keep a reference to node's require so we can restore it after executing the amd loader file.
          'var nodeRequire = require;',
          code.replace('"use strict";', ''),
          // Save Monaco's amd require and restore Node's require
          'var monacoAmdRequire = require;',
          'require = nodeRequire;',
          'require.nodeRequire = require;',
        ].join('\n')
        document.body.appendChild(scriptElem)
        onGotAmdLoader((<any>window).monacoAmdRequire)
      }
    })
    return this.loader
  }
}
