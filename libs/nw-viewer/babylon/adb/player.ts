import { AnimationGroup, AssetContainer, Node, TransformNode } from '@babylonjs/core'
import { BehaviorSubject } from 'rxjs'
import { GameServiceContainer } from '../../ecs'
import { ContentProvider, GltfAsset } from '../services/content-provider'
import { AdbFragment, AdbPlayerState, AnimationLayer } from './types'
import { compileAnimation, compileProcLayers, getFragmentState, goToFragmentTime } from './utils'

export interface AdbPlayerOptions {
  game: GameServiceContainer
}

export class AdbPlayer {
  #loadingAssets: Record<string, Promise<GltfAsset>> = {}
  #loadingLayers: Record<number, Promise<AnimationLayer>> = {}
  #fragment$ = new BehaviorSubject<AdbFragment>(null)
  #state$ = new BehaviorSubject<AdbPlayerState>({
    playing: false,
    progress: 0,
    time: 0,
    duration: 0,
  })
  private target: Node[]
  private game: GameServiceContainer

  public playbackState$ = this.#state$.asObservable()
  public fragment$ = this.#fragment$
  public get fragment() {
    return this.#fragment$.value
  }
  public set fragment(value: AdbFragment) {
    this.executeFragment(value)
  }

  public async reset(game: GameServiceContainer, target: Node[]) {
    this.game = game
    this.target = target
    const animations = this.#loadingAssets
    const layers = this.#loadingLayers
    this.#loadingAssets = {}
    this.#loadingLayers = {}

    await Promise.all(
      Object.values(animations).map((it) => {
        return it
          .then((asset) => {
            asset.container.dispose()
          })
          .catch(() => {})
      }),
    )
    await Promise.all(
      Object.values(layers).map((it) => {
        return it
          .then((layer) => {
            for (const item of layer.sequence) {
              item.animation?.dispose()
            }
          })
          .catch(() => {})
      }),
    )
  }

  public async dispose() {
    return this.reset(null, null)
  }

  public async executeFragment(fragment: AdbFragment) {
    stopFragment(this.fragment)
    await this.ensureFragmentIsLoaded(fragment)
    this.#fragment$.next(fragment)
    startFragment(this.fragment)
  }

  public update() {
    this.#state$.next(getFragmentState(this.fragment))
  }

  private async ensureFragmentIsLoaded(fragment: AdbFragment) {
    if (fragment) {
      await Promise.all(fragment.animLayers.map((layer) => this.ensureLayerIsLoaded(layer)))
      compileProcLayers(fragment)
    }
    return fragment
  }

  private async ensureLayerIsLoaded(layer: AnimationLayer) {
    return (this.#loadingLayers[layer.id] ||= this.loadAnimationLayer(layer))
  }

  private async loadAnimationLayer(layer: AnimationLayer) {
    await Promise.all(
      layer.sequence.map(async (animation) => {
        if (animation.file) {
          const asset = await this.loadAnimationAsset(animation.file)
          animation.animation = buildAnimationGroup(animation.name, asset?.container, this.target)
        }
      }),
    )
    layer.sequence = layer.sequence.filter((it) => !!it.animation)
    compileAnimation(layer)
    return layer
  }

  private async loadAnimationAsset(file: string) {
    const content = this.game.get(ContentProvider)
    return (this.#loadingAssets[file] ||= content.loadAsset(file, content.rootUrl))
  }

  public goToTime(time: number) {
    if (this.fragment) {
      goToFragmentTime(this.fragment, time)
      this.update()
    }
  }
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

function buildAnimationGroup(name: string, animationAsset: AssetContainer, target: Node[]) {
  const oldGroup = animationAsset?.animationGroups[0]
  if (!oldGroup) {
    return null
  }
  const transformNodes = getTransformNodes(target)
  const scene = transformNodes[0].getScene()
  const newGroup = new AnimationGroup(name, scene, 1, oldGroup.playOrder)
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
    const targetNodes = transformNodes.filter((it) => getMeta(it.metadata, 'controllerId') === controlId)
    for (const target of targetNodes) {
      newGroup.addTargetedAnimation(anim.animation, target)
    }
  }
  return newGroup
}

function getMeta<T>(extra: any, key: string) {
  return extra?.['gltf']?.['extras']?.[key]
}

function getTransformNodes(nodes: Node[], result: TransformNode[] = []) {
  if (!nodes) {
    return result
  }
  for (const node of nodes) {
    if (node instanceof TransformNode) {
      result.push(node)
    }
    const children = node['_children']
    getTransformNodes(children, result)
  }
  return result
}
