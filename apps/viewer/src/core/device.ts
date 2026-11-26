import type { CreateDeviceOptions } from '@gglib/graphics'

/**
 * The device of a viewer: WebGPU with the limits the viewer's materials and passes need. The render size is set by
 * the {@link RenderSizeSystem}, not by the device.
 */
export function viewerDeviceOptions(canvas: HTMLCanvasElement): CreateDeviceOptions {
  return {
    canvas,
    webgpu: {
      deviceOptions: (adapter: GPUAdapter) => {
        return {
          requiredLimits: {
            // terrain virtual texture page cache, see VT_PAGE_CAPACITY
            maxTextureArrayLayers: VIEWER_REQUIRED_LIMITS.maxTextureArrayLayers,
            // Illum has 16 textures (default limit) plus the two cube arrays of the environment probes and the
            // froxel fog volume
            maxSampledTexturesPerShaderStage: Math.min(
              VIEWER_REQUIRED_LIMITS.maxSampledTexturesPerShaderStage,
              adapter.limits.maxSampledTexturesPerShaderStage,
            ),
          },
        }
      },
    },
    platform: 'webgpu',
    // the render size is set by the RenderSizeSystem, from the config
    autosize: false,
  }
}

/**
 * Whether the browser can run a viewer: WebGPU with an adapter that has the limits of {@link VIEWER_REQUIRED_LIMITS}.
 * Creates no device. Texture compression is optional (the KTX2 transcoder falls back to uncompressed data).
 */
export async function isViewerSupported(): Promise<boolean> {
  const gpu = (globalThis.navigator as Navigator | undefined)?.gpu
  if (!gpu) {
    return false
  }
  try {
    const adapter = await gpu.requestAdapter()
    if (!adapter) {
      return false
    }
    return (
      adapter.limits.maxTextureArrayLayers >= VIEWER_REQUIRED_LIMITS.maxTextureArrayLayers &&
      adapter.limits.maxSampledTexturesPerShaderStage >= VIEWER_REQUIRED_LIMITS.maxSampledTexturesPerShaderStage
    )
  } catch {
    return false
  }
}

/**
 * Whether the GPU is a mobile one, judged by the missing BC texture compression. Creates no device.
 */
export async function isMobileGpu(): Promise<boolean> {
  const gpu = (globalThis.navigator as Navigator | undefined)?.gpu
  const adapter = await gpu?.requestAdapter().catch(() => null)
  return !!adapter && !adapter.features.has('texture-compression-bc')
}

/**
 * The device limits a viewer asks for, see {@link viewerDeviceOptions}
 */
export const VIEWER_REQUIRED_LIMITS = {
  maxTextureArrayLayers: 1024,
  maxSampledTexturesPerShaderStage: 20,
} as const
