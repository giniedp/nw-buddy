export type * as monaco from 'monaco-editor'

const BASE_URL = '/assets/monaco-editor/esm/vs'
function getWorkerUrl(moduleId: string, label: string) {
  const base = BASE_URL
  console.log('getWorkerUrl', moduleId, label)
  if (label === 'json') {
    return `${base}/language/json/json.worker.js`
  }
  if (label === 'css' || label === 'scss' || label === 'less') {
    return `${base}/language/css/css.worker.js`
  }
  if (label === 'html' || label === 'handlebars' || label === 'razor') {
    return `${base}/language/html/html.worker.js`
  }
  if (label === 'typescript' || label === 'javascript') {
    return `${base}/language/typescript/ts.worker.js`
  }
  return `${base}/editor/editor.worker.js`
}

function getWorker(moduleId: string, label: string) {
  return new Worker(getWorkerUrl(moduleId, label), {
    name: label,
    type: 'module',
  })
}

self.MonacoEnvironment = {
  getWorker,
}

// export async function loadEditor() {
//   return new Promise<any>((resolve) => {
//     const loaderScript: HTMLScriptElement = document.createElement('script')
//     loaderScript.type = 'text/javascript'
//     loaderScript.src = `/assets/monaco-editor/min/vs/loader.js`
//     loaderScript.addEventListener('load', (res) => {
//       console.log('monaco-editor loaded', res)
//       resolve(res)
//     })
//     document.head.appendChild(loaderScript)
//   })
//   // /esm/vs/editor/editor.main.js
//   //return import('monaco-editor')
// }
