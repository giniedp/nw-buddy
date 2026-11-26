// The dev page of the CharacterViewer (character.html, dev server only): the transmog stage, the player and armor glbs.
// The viewer is `window.characterViewer` for scripts.
import { CharacterViewer } from './character-viewer'

/**
 * Local files through vite's `/@fs/`
 */
const FS = `${location.origin}/@fs/E:/nw-buddy`
const CDN = 'https://cdn.nw-buddy.de/models/'
/**
 * The local models root served by nwbt, the character editor's assets are below it in `character/`
 */
const ASSETS = `${location.origin}/nw-cdn/models/`
/**
 * The stages describe themselves (spot, camera, time, exposure), their probe cubes are next to them
 */
const STAGES: Record<string, string> = {
  ship: `${ASSETS}character/stage.glb`,
}
const CHARACTERS: Record<string, string> = {
  male: `${ASSETS}objects/characters/player/male/player_male.cdf.glb`,
  female: `${ASSETS}objects/characters/player/female/player_female.cdf.glb`,
  'male (old)': `${FS}/apps/web/assets/models/player_male.glb`,
  'female (old)': `${FS}/apps/web/assets/models/player_female.glb`,
}
const SLOTS: Record<string, string> = {
  head: `${CDN}armorappearances/conquistador_helm_t1-skin1.glb`,
  chest: '',
  hands: '',
  legs: '',
  feet: '',
}

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const status = element<HTMLDivElement>('status')
const stageFile = element<HTMLSelectElement>('stageFile')
const characterFile = element<HTMLSelectElement>('characterFile')
for (const [name, url] of Object.entries(STAGES)) {
  stageFile.add(new Option(name, url))
}
for (const [name, url] of Object.entries(CHARACTERS)) {
  characterFile.add(new Option(name, url))
}
const slotInputs = new Map<string, HTMLInputElement>()
for (const [slot, url] of Object.entries(SLOTS)) {
  const label = document.createElement('label')
  label.textContent = slot
  const input = document.createElement('input')
  input.type = 'text'
  input.value = url
  label.append(input)
  element('slots').append(label)
  slotInputs.set(slot, input)
}

const viewer = new CharacterViewer({ canvas: element<HTMLCanvasElement>('canvas') })
Object.assign(window, { characterViewer: viewer })
viewer.run()

async function run(label: string, task: () => Promise<void>) {
  status.textContent = `${label}…`
  const start = performance.now()
  try {
    await task()
    status.textContent = `${label} in ${Math.round(performance.now() - start)} ms`
  } catch (err) {
    status.textContent = `${label}: ${String(err)}`
  }
}

async function applySlots() {
  await Promise.all(
    [...slotInputs].map(([slot, input]) => {
      // several models per slot: comma separated
      const urls = input.value
        .split(',')
        .map((it) => it.trim())
        .filter((it) => !!it)
      return viewer.setSlot(
        slot,
        urls.map((url) => ({ url, rootUrl: url.startsWith(CDN) ? CDN : undefined })),
      )
    }),
  )
  renderParts()
}

const hiddenParts = new Set<string>()
/**
 * Starts the part toggles with what the character file hides
 */
function resetHiddenParts() {
  hiddenParts.clear()
  for (const name of viewer.defaultHiddenParts) {
    hiddenParts.add(name)
  }
  viewer.setHiddenParts(hiddenParts)
}
function renderParts() {
  const container = element('parts')
  container.replaceChildren()
  for (const name of new Set(viewer.parts)) {
    const label = document.createElement('label')
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = !hiddenParts.has(name)
    box.addEventListener('change', () => {
      if (box.checked) {
        hiddenParts.delete(name)
      } else {
        hiddenParts.add(name)
      }
      viewer.setHiddenParts(hiddenParts)
    })
    label.append(box, ` ${name}`)
    container.append(label)
  }
}

stageFile.addEventListener('change', () => run('stage', showStage))
characterFile.addEventListener('change', () =>
  run('character', async () => {
    await viewer.showCharacter(characterFile.value, { rootUrl: ASSETS })
    resetHiddenParts()
    renderParts()
  }),
)
element('apply').addEventListener('click', () => run('slots', applySlots))
element<HTMLInputElement>('rotation').addEventListener('input', (event) => {
  viewer.characterRotation = (Number((event.target as HTMLInputElement).value) * Math.PI) / 180
})
for (const key of ['height', 'back', 'look', 'side'] as const) {
  element<HTMLInputElement>(key).addEventListener('input', (event) => {
    viewer.view[key] = Number((event.target as HTMLInputElement).value)
  })
}
/**
 * The exposure of the loaded stage, the slider moves in stops from it
 */
let stageExposure = 1
const exposureStops = element<HTMLInputElement>('exposure')
exposureStops.addEventListener('input', () => {
  viewer.exposure = stageExposure * 2 ** Number(exposureStops.value)
})
async function showStage() {
  await viewer.showStage(stageFile.value)
  stageExposure = Number(viewer.exposure)
  exposureStops.value = '0'
  // the stage's view
  for (const key of ['height', 'back', 'look', 'side'] as const) {
    element<HTMLInputElement>(key).value = String(viewer.view[key])
  }
}
element<HTMLInputElement>('sun').addEventListener('change', (event) => {
  viewer.sun = (event.target as HTMLInputElement).checked
})

run('scene', async () => {
  await showStage()
  await viewer.showCharacter(characterFile.value, { rootUrl: ASSETS })
  resetHiddenParts()
  await applySlots()
})
