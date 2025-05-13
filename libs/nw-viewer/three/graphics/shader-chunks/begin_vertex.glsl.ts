export default /* glsl */ `
vec3 transformed = vec3( position );

#ifdef USE_ALPHAHASH

	vPosition = vec3( position );

#endif

#ifdef USE_CLIPMAP

  transformed = (modelMatrix * vec4(transformed, 1.0)).xyz;
  float clipTexel = 1.0 / (clipSize + 1.0);
  vClipMapUv.xy = vec2(-1.0, 1.0) * ((transformed.xz - clipOrigin.xy  ) /  clipDensity       + 0.5) * clipTexel;
  vClipMapUv.zw = vec2(-1.0, 1.0) * ((transformed.xz - coarseOrigin.xy) / (clipDensity * 2.0)+ 0.5) * clipTexel;

  transformed.y = clipmapParams(transformed.xz).x;
  vNormal = clipmapNormal(2.0 / clipDensity, transformed.xz).xyz;

#endif

`
