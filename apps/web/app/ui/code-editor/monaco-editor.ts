export type * as monaco from 'monaco-editor'

function getWorkerUrl(moduleId: string, label: string) {
  const base = '/assets/monaco-editor/esm/vs'
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

export async function loadEditor() {
  return import('monaco-editor')
}
