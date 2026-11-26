import { CameraComponent, EcsGame, TransformComponent } from '@gglib/components'
import type { GameComponent } from '@gglib/ecs'
import { DEGREE_TO_RAD } from '@gglib/math'

export interface ViewerCameraOptions {
  /**
   * The far plane in meters
   */
  far: number
  /**
   * Components of the camera entity besides the camera, e.g. the movement (WASD, orbit)
   */
  components?: GameComponent[]
}

/**
 * The camera of the main view: perspective with 90° field of view and reversed Z, from `onInitialize`
 */
export function createViewerCamera(game: EcsGame, options: ViewerCameraOptions): CameraComponent {
  const camera = game
    .createEntity({
      name: 'Camera',
      parent: game.scene.entity,
      transform: new TransformComponent({
        keepWorld: true,
      }),
      components: [
        new CameraComponent({
          type: 'perspective',
          near: 0.1,
          far: options.far,
          perspectiveFov: 90 * DEGREE_TO_RAD,
          reversedZ: true,
          aspect: game.device.output.aspectRatio,
        }),
        ...(options.components ?? []),
      ],
    })
    .component(CameraComponent)
  game.scene.getView(0).camera = camera
  return camera
}
