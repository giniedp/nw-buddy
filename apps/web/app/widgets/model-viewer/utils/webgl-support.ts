let doesSupportWebGL: boolean
export function supportsWebGL() {
  if (doesSupportWebGL === undefined) {
    doesSupportWebGL = checkWebGLSupport()
  }
  return doesSupportWebGL
}

function checkWebGLSupport() {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  return gl instanceof WebGLRenderingContext
}
