import { Color, SpriteBatch, type Device, type Texture } from '@gglib/graphics'

// TODO: move this out of global
// spriteBatch needs time to compile the shader, therefore can't be re-created for a single frame
// better pass a re-usable spritebatch from outside, or have one on the graphics device
let spriteBatch: SpriteBatch | null = null
/**
 * The device of {@link spriteBatch}: a new app mount has a new device
 */
let spriteBatchDevice: Device | null = null

/**
 * Renders the texture into a square image of the given size
 */
export async function renderThumbnail(texture: Texture, size: number): Promise<ImageBitmap> {
  const device = texture.device
  const target = device.createRenderTarget({
    width: size,
    height: size,
    depth: 1,
    format: 'rgba8unorm',
    sampleCount: 1,
    mipLevelCount: 1,
  })

  if (spriteBatchDevice !== device) {
    spriteBatch = new SpriteBatch(device, {})
    spriteBatchDevice = device
  }
  await spriteBatch.shader.compiled
  spriteBatch.begin()
  spriteBatch.next(texture).source(0, 0, texture.width, texture.height).destination(0, 0, size, size).alpha(1.0)
  spriteBatch.end()

  const pass = device.renderPass
  pass.flush()
  pass.setRenderTarget(0, target)
  pass.setClearColor(0, Color.Black)
  pass.clear()
  pass.render(spriteBatch)
  pass.submit()
  pass.flush()

  const pixels = await target.readPixelData(0, 0, size, size)
  target.dispose()

  return createImageBitmap(new ImageData(pixels, size, size))
}
