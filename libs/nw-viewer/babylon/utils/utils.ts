import { toSignal, ToSignalOptions } from '@angular/core/rxjs-interop'
import { ArcRotateCamera, AssetContainer, computeMaxExtents, FramingBehavior, Vector3 } from '@babylonjs/core'
import { Observable as BJSObservable } from '@babylonjs/core/Misc/observable'
import { Observable } from 'rxjs'

/**
 * Converts a Babylon.js Observable to an RxJS Observable.
 */
export function fromBObservable<T>(bjsObservable: BJSObservable<T> | null): Observable<T> | null {
  if (!bjsObservable) {
    return null
  }
  return new Observable<T>((subscriber) => {
    const handler = bjsObservable.add((value) => subscriber.next(value))
    return () => bjsObservable.remove(handler)
  })
}

export interface BoundingInfo {
  extents: {
    min: [x: number, y: number, z: number]
    max: [x: number, y: number, z: number]
  }
  size: [x: number, y: number, z: number]
  center: [x: number, y: number, z: number]
}

export function computeAssetBoundingInfo(asset: AssetContainer): BoundingInfo {
  const extents = computeMaxExtents(asset.meshes)
  return reduceMeshesExtendsToBoundingInfo(extents)
}

export function reduceMeshesExtendsToBoundingInfo(
  maxExtents: Array<{ minimum: Vector3; maximum: Vector3 }>,
): BoundingInfo {
  const min = new Vector3(
    Math.min(...maxExtents.map((e) => e.minimum.x)),
    Math.min(...maxExtents.map((e) => e.minimum.y)),
    Math.min(...maxExtents.map((e) => e.minimum.z)),
  )
  const max = new Vector3(
    Math.max(...maxExtents.map((e) => e.maximum.x)),
    Math.max(...maxExtents.map((e) => e.maximum.y)),
    Math.max(...maxExtents.map((e) => e.maximum.z)),
  )
  const size = max.subtract(min)
  const center = min.add(size.scale(0.5))

  return {
    extents: {
      min: min.asArray(),
      max: max.asArray(),
    },
    size: size.asArray(),
    center: center.asArray(),
  }
}
const tempVectors = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()]

export function reframeCamera(camera: ArcRotateCamera, boundingInfo: BoundingInfo, interpolate = true) {
  camera.useFramingBehavior = true
  const framingBehavior = camera.getBehaviorByName('Framing') as FramingBehavior
  framingBehavior.framingTime = 0
  framingBehavior.elevationReturnTime = -1

  camera.useAutoRotationBehavior = false
  camera.useBouncingBehavior = true

  const currentAlpha = camera.alpha
  const currentBeta = camera.beta
  const currentRadius = camera.radius
  const currentTarget = camera.target

  const goalAlpha = currentAlpha // Math.PI / 2
  const goalBeta = Math.PI / 2.4
  let goalRadius = 1
  let goalTarget = currentTarget

  if (boundingInfo) {
    // get bounds and prepare framing/camera radius from its values
    camera.lowerRadiusLimit = null

    const worldExtentsMin = tempVectors[0].copyFromFloats(...boundingInfo.extents.min)
    const worldExtentsMax = tempVectors[1].copyFromFloats(...boundingInfo.extents.max)
    framingBehavior.zoomOnBoundingInfo(worldExtentsMin, worldExtentsMax)

    goalRadius = Vector3.FromArray(boundingInfo.size).length() * 1.1
    goalTarget = Vector3.FromArray(boundingInfo.center)
    if (!isFinite(goalRadius)) {
      goalRadius = 1
      goalTarget.copyFromFloats(0, 0, 0)
    }
  }
  // camera.alpha = Math.PI / 2
  // camera.beta = Math.PI / 2.4
  // camera.radius = goalRadius
  // camera.target = goalTarget
  // camera.lowerRadiusLimit = goalRadius * 0.001
  // camera.upperRadiusLimit = goalRadius * 5
  // camera.minZ = goalRadius * 0.001
  // camera.maxZ = goalRadius * 1000
  // camera.wheelDeltaPercentage = 0.01
  // camera.useNaturalPinchZoom = true
  // camera.restoreStateInterpolationFactor = 0.1
  // camera.storeState()

  if (interpolate) {
    camera.alpha = currentAlpha
    camera.beta = currentBeta
    camera.radius = currentRadius
    camera.target = currentTarget
    camera.interpolateTo(goalAlpha, goalBeta, goalRadius, goalTarget)
  }
}
