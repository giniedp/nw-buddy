export default /* glsl */`

#ifdef USE_CLIPMAP

  uniform vec2 coarseCenter;
  uniform vec2 coarseOrigin;
  uniform float coarseBlend;
  uniform vec2 clipCenter;
  uniform vec2 clipOrigin;
  uniform float clipSize;
  uniform float clipDensity;
  uniform float clipHeight;
  uniform sampler2D clipTex1; // heightmap current layer
  uniform sampler2D clipTex2; // heightmap next layer

  // Calculates the blend factor to morph between LOD levels
  // p: current position in world space
  // N: Number of vertices on a side of the clip (Clipsize)
  // G: Units between vertices (Density)
  // center: camera position projected on the xy plane
  float clipmapBlend(vec2 p, float N, float G, vec2 center) {
    float ng =  N * G;
    vec2 d = abs(p - center);
    d -= ((ng - G) / 2.0 - ng / 10.0 - 2.0 * G);
    d /= (ng / 10.0);
    return clamp(max(d.x, d.y), 0.0, 1.0);
  }

  float clipmapHeight(vec3 color) {
    // Convert RGB components from [0.0, 1.0] to [0, 255]
    vec3 rgb = color.rgb * 255.0;
    // Reconstruct the 24-bit integer value
    float value = rgb.r * 65536.0 + rgb.g * 256.0 + rgb.b;
    // Convert back to height in range [0.0, mountainHeight]
    return value * (clipHeight / 16777215.0);
  }

  vec3 clipmapNormal(float scale) {
    float texel = 1.0 / (clipSize + 1.0);
    float heightL = clipmapHeight(texture(clipTex1, vClipMapUv.xy - vec2(texel, 0.0)).rgb);
    float heightR = clipmapHeight(texture(clipTex1, vClipMapUv.xy + vec2(texel, 0.0)).rgb);
    float heightD = clipmapHeight(texture(clipTex1, vClipMapUv.xy - vec2(0.0, texel)).rgb);
    float heightU = clipmapHeight(texture(clipTex1, vClipMapUv.xy + vec2(0.0, texel)).rgb);
    // Compute gradient
    float dx = (heightR - heightL) * scale;
    float dy = (heightU - heightD) * scale;
    return normalize(vec3(-dx, 1.0, -dy));
  }

  vec2 clipmapParams(vec2 vWorld) {
    float blend = clipmapBlend(vWorld, clipSize, clipDensity, cameraPosition.xz);
    float h1 = clipmapHeight(texture(clipTex1, vClipMapUv.xy).xyz);
    float h2 = clipmapHeight(texture(clipTex2, vClipMapUv.zw).xyz);
    float h = mix(h1, h2, blend * coarseBlend);
    return vec2(h, blend);
  }
#endif
`
