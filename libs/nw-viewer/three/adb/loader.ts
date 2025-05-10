import { AdbAction, AdbFragment, AnimationFile, AnimationLayer, ProceduralBar, ProceduralLayer } from '../adb'

function adbBuilder() {
  let id = 0
  const actions: AdbAction[] = []
  return {
    newAction(name: string) {
      const action: AdbAction = {
        name: name,
        tags: [],
        fragments: [],
        valid: false,
      }
      actions.push(action)
      return action
    },
    newFragment(action: AdbAction) {
      const fragment: AdbFragment = {
        tags: [],
        animLayers: [],
        procLayers: [],
      }
      action.fragments.push(fragment)
      return fragment
    },
    newAnimLayer(fragment: AdbFragment) {
      const layer: AnimationLayer = {
        id: id++,
        sequence: [],
      }
      fragment.animLayers.push(layer)
      return layer
    },
    newProcLayer(fragment: AdbFragment) {
      const layer: ProceduralLayer = {
        sequence: [],
      }
      fragment.procLayers.push(layer)
      return layer
    },
    build() {
      const result = actions.filter((it) => {
        it.fragments = it.fragments.filter((it) => !!it.animLayers.length)
        return it.fragments.length
      })
      for (const action of result) {
        action.valid = action.fragments.every((fragment) => {
          return fragment.animLayers.every((layer) => {
            return layer.sequence.every((it) => !!it.file)
          })
        })
      }
      return result
    },
  }
}

export async function loadAdbActions(options: { url: string; rootUrl: string; files: ReadonlyArray<AnimationFile> }) {
  const documents = await loadAdbDocuments(options.rootUrl, options.url)
  return documents.map((it) => parseAdbDocument(it, options.files)).flat()
}

interface Tagged<T> {
  tags: string[]
  value: T
}

async function loadAdbDocuments(rootUrl: string, url: string) {
  const done: string[] = []
  const pending: Array<Tagged<string>> = [{ value: url, tags: [] }]
  const documents: Array<Tagged<Document>> = []
  while (pending.length > 0) {
    const url = pending.shift()
    if (done.includes(url.value)) {
      continue
    }
    done.push(url.value)
    const doc = await loadAdbDocument(rootUrl, url.value)
    documents.push({ value: doc, tags: url.tags })
    const subAdbs = doc.querySelectorAll('SubADB')
    for (const subAdb of eachNode(subAdbs)) {
      const tags = (subAdb.getAttribute('Tags') || '').split('+').filter((it) => !!it)
      const file = subAdb.getAttribute('File')?.toLowerCase()
      if (file) {
        pending.push({
          value: file,
          tags: [...url.tags, ...tags],
        })
      }
    }
  }
  return documents
}

async function loadAdbDocument(rootUrl: string, url: string) {
  return fetch(rootUrl + url)
    .then((res) => res.text())
    .then((text) => new DOMParser().parseFromString(text, 'application/xml'))
}

function parseAdbDocument(document: Tagged<Document>, files: ReadonlyArray<AnimationFile>): AdbAction[] {
  const doc = document.value
  const adb = adbBuilder()
  const nodes = doc.querySelectorAll('FragmentList > *')
  for (const node of eachNode(nodes)) {
    const actionName = node.tagName
    const action = adb.newAction(actionName)
    action.tags = [...document.tags]

    for (const fragNode of eachNode(node.childNodes)) {
      if (fragNode.tagName !== 'Fragment') {
        continue
      }
      const animNodes = fragNode.querySelectorAll('AnimLayer')
      const procNodes = fragNode.querySelectorAll('ProcLayer')
      if (!animNodes) {
        continue
      }
      const fragment = adb.newFragment(action)
      fragment.tags = (fragNode.getAttribute('Tags') || '').split('+').filter((it) => !!it?.trim())

      let barId = 0
      for (const layerNode of eachNode(animNodes)) {
        const layer = adb.newAnimLayer(fragment)

        let time = 0
        let startAt = 0
        for (const child of eachNode(layerNode.childNodes)) {
          if (child.tagName == 'Blend') {
            time = Number(child.getAttribute('ExitTime')) || 0
            startAt = Number(child.getAttribute('StartTime')) || 0
          }
          if (child.tagName == 'Animation') {
            const name = child.getAttribute('name')
            if (!name) {
              continue
            }
            layer.sequence.push({
              id: barId++,
              name: name,
              loop: child.getAttribute('flags') === 'Loop',
              speed: Number(child.getAttribute('speed')) || 1,
              file: files.find((it) => it.name === name)?.file,
              time: time,
              startAt: startAt,
            })
          }
        }
        if (!layer.sequence.length) {
          continue
        }
        fragment.animLayers.push(layer)
      }
      for (const procNode of eachNode(procNodes)) {
        const layer: ProceduralLayer = {
          sequence: [],
        }
        fragment.procLayers.push(layer)
        let time = 0
        for (const child of eachNode(procNode.childNodes)) {
          if (child.tagName == 'Blend') {
            time = Number(child.getAttribute('ExitTime')) || 0
            if (time > 0 && !layer.sequence.length) {
              // dummy leading bar, needed for trackbar layout
              layer.sequence.push({
                id: barId++,
                time: 0,
                type: null,
                contextType: null,
                params: null,
              })
            }
          }
          if (child.tagName == 'Procedural') {
            const bar: ProceduralBar = {
              id: barId++,
              time: time,
              type: child.getAttribute('type'),
              contextType: child.getAttribute('contextType'),
              params: null,
            }
            layer.sequence.push(bar)

            const params = child.querySelector('ProceduralParams')
            if (params) {
              for (const param of eachNode(params.childNodes)) {
                bar.params = bar.params || {}
                bar.params[param.tagName] = parseValue(param.getAttribute('value'))
              }
            }
          }
        }
      }
    }
  }
  return adb.build()
}

function parseValue(value: string) {
  if (value === 'true' || value === 'false') {
    return value === 'true'
  }
  const num = Number(value)
  if (!isNaN(num) && isFinite(num)) {
    return num
  }
  return value
}

function* eachNode(list: NodeListOf<Element | ChildNode>) {
  for (let i = 0; i < list.length; i++) {
    const node = list.item(i)
    if (node.nodeType === Node.ELEMENT_NODE) {
      yield node as Element
    }
  }
}
