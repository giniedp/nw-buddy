export default /* glsl */`
vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_BATCHING

	mvPosition = batchingMatrix * mvPosition;

#endif

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

#ifdef USE_CLIPMAP

  mvPosition = viewMatrix * mvPosition;

#else

  mvPosition = modelViewMatrix * mvPosition;

#endif

gl_Position = projectionMatrix * mvPosition;

`;
