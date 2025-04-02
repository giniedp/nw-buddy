import {
  AbstractMesh,
  AnimationGroup,
  AssetContainer,
  LoadAssetContainerAsync,
  Observer,
  Scene,
  TransformNode,
} from '@babylonjs/core'
import { eq } from 'lodash'
import { BehaviorSubject, defer, distinctUntilChanged, Subject } from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import {
  AdbAction,
  AdbFragment,
  AnimationFile,
  AnimationLayer,
  AnimationStateInfo,
  compileAnimation,
  compileProcLayers,
  getFragmentState,
  goToFragmentTime,
  loadAdbActions,
} from './nw-adb'

export interface NwCharacterOptions {
  url: string
  rootUrl: string
  adbUrl: string
  tags: string[]
}

export class NwViewerCharacter {
  public readonly loaded: Promise<void> = null

  private container: AssetContainer = null
  private animationFiles: Record<string, Promise<AssetContainer>> = {}
  private animationLayers: Record<number, Promise<AnimationLayer>> = {}

  public actions: AdbAction[] = []
  public animations: AnimationFile[] = []
  public fragmentStart$ = new Subject<AdbFragment>()
  private fragment: AdbFragment = null
  private observers: Observer<any>[] = []

  private animationInfo = new BehaviorSubject<AnimationStateInfo>({
    playing: false,
    progress: 0,
    time: 0,
    duration: 0,
  })
  public animationInfo$ = defer(() => this.animationInfo.asObservable()).pipe<AnimationStateInfo, AnimationStateInfo>(
    distinctUntilChanged(eq),
    shareReplayRefCount(1),
  )

  public get asset() {
    return this.container
  }

  public get meshes() {
    return this.container.meshes
  }

  public get activeFragment() {
    return this.fragment
  }

  public get tags() {
    return this.options.tags || []
  }

  public constructor(
    private scene: Scene,
    private options: NwCharacterOptions,
  ) {
    this.loaded = this.load()
  }

  public async enable() {
    await this.loaded
    this.container.addToScene()
  }

  public async disable() {
    await this.loaded
    this.container.removeFromScene()
  }

  public async dispose() {
    await this.disable().catch(console.error)
    const toRemove = this.observers
    this.observers = []
    for (const observer of toRemove) {
      observer.remove()
    }
    if (this.container) {
      this.container.dispose()
    }
  }

  public findAction(actionName: string) {
    return this.actions
      .filter((action) => action.name.toLowerCase() === actionName.toLowerCase())
      .find((it) => checkTags({ reqiured: it.tags, tags: this.tags }))
  }

  public findFragment(action: AdbAction, orLast = false) {
    if (!action?.fragments?.length) {
      return null
    }
    let result = action.fragments.find((it) => {
      return checkTags({ reqiured: it.tags, tags: this.tags })
    })
    if (!result && orLast) {
      result = action.fragments[action.fragments.length - 1]
    }
    return result
  }

  public async executeActionByName(actionName: string, force = false) {
    return this.executeAction(this.findAction(actionName), force)
  }

  public async executeAction(action: AdbAction, force = false) {
    const fragment = this.findFragment(action, force)
    await this.executeFragment(fragment)
    return fragment
  }

  public async executeFragment(fragment: AdbFragment) {
    stopFragment(this.fragment)
    this.fragment = await this.ensureFragmentIsLoaded(fragment)
    startFragment(this.fragment)
    this.fragmentStart$.next(this.fragment)
  }

  private async load() {
    const { url, rootUrl, adbUrl } = this.options
    const engine = this.scene.getEngine()
    this.container = await LoadAssetContainerAsync(url, this.scene, {
      rootUrl: rootUrl,
      pluginOptions: {
        gltf: {
          onParsed: (data) => {
            this.animations = data.json['extras']['animationList'] || []
          },
        },
      },
    })
    if (adbUrl) {
      this.actions = await loadAdbActions(rootUrl, adbUrl, this.animations).catch((err) => {
        console.error('Error loading ADB file:', err)
        return []
      })
    }
    this.observers.push(engine.onBeginFrameObservable.add(() => this.onBeginFrame()))
    this.observers.push(engine.onEndFrameObservable.add(() => this.onEndFrame()))
  }

  private onBeginFrame() {
    this.updateFragmentProgress()
  }

  private onEndFrame() {
    //
  }

  private updateFragmentProgress() {
    this.animationInfo.next(getFragmentState(this.fragment))
  }

  private async ensureFragmentIsLoaded(fragment: AdbFragment) {
    if (fragment) {
      await Promise.all(fragment.animLayers.map((layer) => this.ensureLayerIsLoaded(layer)))
      compileProcLayers(fragment)
    }
    return fragment
  }

  private async ensureLayerIsLoaded(layer: AnimationLayer) {
    return (this.animationLayers[layer.id] ||= this.loadAnimationLayer(layer))
  }

  private async loadAnimationLayer(layer: AnimationLayer) {
    await Promise.all(
      layer.sequence.map(async (animation) => {
        if (animation.file) {
          const asset = await this.loadAnimationFile(animation.file).catch(() => null)
          animation.animation = buildAnimationGroup(animation.name, asset, this.container)
        }
      }),
    )
    layer.sequence = layer.sequence.filter((it) => !!it.animation)
    compileAnimation(layer)
    return layer
  }

  private async loadAnimationFile(file: string) {
    return (this.animationFiles[file] ||= LoadAssetContainerAsync(file, this.scene, {
      rootUrl: this.options.rootUrl,
      pluginOptions: {
        gltf: {
          loadNodeAnimations: true,
        },
      },
    }))
  }

  public toggleMesh(mesh: AbstractMesh) {
    mesh.setEnabled(!mesh.isEnabled())
  }

  public goToTime(time: number) {
    if (this.fragment) {
      goToFragmentTime(this.fragment, time)
      this.updateFragmentProgress()
    }
  }
}

function getMeta<T>(extra: any, key: string) {
  return extra?.['gltf']?.['extras']?.[key]
}

function startFragment(fragment: AdbFragment) {
  for (const layer of fragment?.animLayers || []) {
    layer.start()
  }
}

function stopFragment(fragment: AdbFragment) {
  for (const layer of fragment?.animLayers || []) {
    layer.stop()
  }
}

function checkTags({ reqiured, tags }: { reqiured: string[]; tags: string[] }) {
  if (!reqiured.length) {
    return true
  }
  return reqiured.every((tag) => tags.some((it) => it.toLowerCase() === tag.toLowerCase()))
}

function buildAnimationGroup(name: string, animationAsset: AssetContainer, characterAsset: AssetContainer) {
  const oldGroup = animationAsset?.animationGroups[0]
  if (!oldGroup) {
    return null
  }
  const newGroup = new AnimationGroup(name, characterAsset.scene, 1, oldGroup.playOrder)
  newGroup['_from'] = oldGroup.from
  newGroup['_to'] = oldGroup.to
  newGroup['_speedRatio'] = oldGroup.speedRatio
  newGroup['_loopAnimation'] = oldGroup.loopAnimation
  newGroup['_isAdditive'] = oldGroup.isAdditive
  newGroup['_enableBlending'] = oldGroup.enableBlending
  newGroup['_blendingSpeed'] = oldGroup.blendingSpeed
  newGroup.metadata = oldGroup.metadata
  newGroup.mask = oldGroup.mask

  for (const anim of oldGroup.targetedAnimations) {
    const oldTarget = anim.target
    if (!(oldTarget instanceof TransformNode)) {
      continue
    }
    const controlId = getMeta(oldTarget.metadata, 'controllerId')
    const targetNodes = characterAsset.transformNodes.filter((it) => getMeta(it.metadata, 'controllerId') === controlId)
    for (const target of targetNodes) {
      newGroup.addTargetedAnimation(anim.animation, target)
    }
  }
  return newGroup
}
