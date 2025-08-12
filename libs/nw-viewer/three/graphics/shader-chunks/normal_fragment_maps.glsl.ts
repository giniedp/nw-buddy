export default /* glsl */ `

#ifdef USE_NORMALMAP_OBJECTSPACE

  #ifdef USE_NORMALMAP_RG_UNSIGNED

    normal = texture2D( normalMap, vNormalMapUv ).xyz;
    normal.z = sqrt(clamp(1.0 - dot(normal.xy, normal.xy), 0.0, 1.0));

  #else

    normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

  #endif

	#ifdef FLIP_SIDED

		normal = - normal;

	#endif

	#ifdef DOUBLE_SIDED

		normal = normal * faceDirection;

	#endif

	normal = normalize( normalMatrix * normal );

#elif defined( USE_NORMALMAP_TANGENTSPACE )

  #ifdef USE_NORMALMAP_RG_UNSIGNED

    vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz;
    mapN.z = sqrt(clamp(1.0 - dot(mapN.xy, mapN.xy), 0.0, 1.0));

  #else

    vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;

  #endif

	mapN.xy *= normalScale;

	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )

	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );

#endif
`
