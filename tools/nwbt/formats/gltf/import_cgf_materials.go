package gltf

import (
	"fmt"
	"image/color"
	"log/slog"
	"math"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils"
	"slices"
	"strconv"
	"strings"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/ext/specular"
	"github.com/qmuntal/gltf/ext/texturetransform"
)

func (c *Document) ImportCgfMaterials() {
	// shadersToIgnore := []string{
	// 	"nodraw",
	// }

	// for _, mesh := range c.Document.Meshes {
	// 	toDetach := make([]*gltf.Primitive, 0)
	// 	for _, primitive := range mesh.Primitives {
	// 		if primitive.Material != nil {
	// 			material := c.Document.Materials[*primitive.Material]
	// 			m := lookupMtl(material)
	// 			if m == nil {
	// 				continue
	// 			}
	// 			if slices.Contains(shadersToIgnore, strings.ToLower(m.Shader)) {
	// 				toDetach = append(toDetach, primitive)
	// 			}
	// 		}
	// 	}
	// 	for len(toDetach) > 0 {
	// 		prim := toDetach[0]
	// 		fmt.Sprintln("Detaching primitive")
	// 		toDetach = toDetach[1:]
	// 		index := slices.Index(mesh.Primitives, prim)
	// 		mesh.Primitives = slices.Delete(mesh.Primitives, index, index+1)
	// 	}
	// }

	// {
	// 	toDetach := make([]*gltf.Material, 0)
	// 	for _, material := range c.Materials {
	// 		if slices.Contains(shadersToIgnore, strings.ToLower(material.Name)) {
	// 			toDetach = append(toDetach, material)
	// 		}
	// 	}
	// 	for len(toDetach) > 0 {
	// 		mat := toDetach[0]
	// 		toDetach = toDetach[1:]
	// 		fmt.Sprintln("Detaching material", mat.Name)
	// 		index := slices.Index(c.Materials, mat)
	// 		c.Materials = slices.Delete(c.Materials, index, index+1)
	// 	}
	// }

	for _, material := range c.Materials {
		if !c.IsMaterialReferenced(material) {
			continue
		}

		m := pluckMtl(material)
		if m == nil {
			continue
		}

		// gltf defaults
		material.Extensions = gltf.Extensions{}
		material.AlphaMode = gltf.AlphaOpaque
		material.AlphaCutoff = gltf.Float(0.5)
		material.DoubleSided = false
		material.PBRMetallicRoughness = &gltf.PBRMetallicRoughness{
			BaseColorFactor: float4(1, 1, 1, 1),
			MetallicFactor:  gltf.Float(1),
			RoughnessFactor: gltf.Float(1),
		}

		mtlDiffuse := mtl.ParamColor(m.Diffuse)
		mtlSpecular := mtl.ParamColor(m.Specular)
		// mtlEmissive := mtl.ParamColor(m.Emissive)
		mtlEmittance := mtl.ParamColor(m.Emittance)
		mtlOpacity := m.Opacity
		mtlAlphaTest := m.AlphaTest
		mtlShininess := m.Shininess

		mapDiffuse := m.TextureByMapType(mtl.MtlMap_Diffuse)
		mapBumpmap := m.TextureByMapType(mtl.MtlMap_Bumpmap)
		mapSmoothness := m.TextureByMapType(mtl.MtlMap_Smoothness)
		mapSpecular := m.TextureByMapType(mtl.MtlMap_Specular)
		mapCustom := m.TextureByMapType(mtl.MtlMap_Custom)
		mapEmittance := m.TextureByMapType(mtl.MtlMap_Emittance)
		// mapOpacitty := m.TextureWithMap(mtl.MtlMap_Opacity)
		mapDecal := m.TextureByMapType(mtl.MtlMap_Decal)

		shader := strings.ToLower(m.Shader)
		isGlass := shader == "glass"
		isHair := shader == "hair"
		isFxTransp := shader == "fxmeshadvancedtransp" // only isabella gaze has this shader
		isGeometryFog := shader == "geometryfog"
		isGeometryBeam := shader == "geometrybeam" || shader == "geometrybeamsimple"
		isParticle := shader == "meshparticle"
		isNoDraw := shader == "nodraw"

		features := strings.Split(m.StringGenMask, "%")
		// shaderOverlayMask := slices.Contains(features, "OVERLAY_MASK")
		shaderEmittanceMap := slices.Contains(features, "EMITTANCE_MAP")
		shaderEmissiveDecal := slices.Contains(features, "EMISSIVE_DECAL")
		shaderTintColorMap := slices.Contains(features, "TINT_COLOR_MAP")

		// TODO
		// if (givenAppearance || givenAppearance === false) {
		//   // armor items, mounts, weapons have a custom appearance definitions
		//   appearance = givenAppearance
		// } else if (shaderOverlayMask) {
		//   // resolve appearance params from the material
		//   appearance = mtlParamsToAppearance(mtl)
		// } else {
		//   appearance = null
		// }

		// HINT: Bumpmap and Smoothness are usually the same texture source
		if mapSmoothness == nil && mapBumpmap != nil {
			mapSmoothness = mapBumpmap
		}
		if isFxTransp && mapDiffuse == nil {
			mapDiffuse = mapCustom
			mapCustom = nil
		}
		if shaderTintColorMap && mapDiffuse == nil {
			mapDiffuse = mapCustom
			mapCustom = nil
		}
		if shaderEmissiveDecal && mapEmittance == nil {
			mapEmittance = mapDecal
			mapDecal = nil
		}

		//var texCustom *gltf.Texture
		// if mapCustom != nil {
		// 	texCustom = c.LoadTexture(mapCustom)
		// }
		var texDiffuse *gltf.Texture
		if mapDiffuse != nil {
			texDiffuse = c.LoadTexture(mapDiffuse)
		}
		var texBumpmap *gltf.Texture
		if mapBumpmap != nil {
			texBumpmap = c.LoadTexture(mapBumpmap)
		}

		var texSpecular *gltf.Texture
		if mapSpecular != nil {
			texSpecular = c.LoadTexture(mapSpecular)
		}
		if texSpecular != nil && mapSmoothness != nil {
			key := fmt.Sprintf("%s-%s-%s", texSpecular.Name, mapSmoothness.File, mapSmoothness.AssetId)
			tex, err := c.LoadTextureFunc(key, func() ([]byte, error) {
				specBytes, err := c.ReadTextureImage(texSpecular)
				if err != nil {
					return nil, err
				}
				if specBytes == nil {
					return nil, fmt.Errorf("specBytes is nil")
				}
				smoothImg, err := c.LoadTextureImage(mapSmoothness)
				if err != nil {
					return nil, err
				}
				if smoothImg == nil {
					return nil, fmt.Errorf("smoothImg is nil")
				}
				if smoothImg.Alpha == nil {
					return nil, fmt.Errorf("smoothImg.Alpha is nil")
				}
				return image.MixPngImages(specBytes, smoothImg.Alpha, func(spec, smooth color.NRGBA) color.NRGBA {
					return color.NRGBA{
						spec.R,
						spec.G,
						spec.B,
						smooth.R, // HINT: don't read the alpha channel. Its a grayscale image, hence just access .R
					}
				})
			})
			if err != nil {
				slog.Warn("Failed to combine spce+smooth", "file", key, "err", err)
			} else {
				texSpecular = tex
			}
		}

		var texEmissive *gltf.Texture
		if shaderEmissiveDecal && mapEmittance != nil && mapDecal != nil {
			key := fmt.Sprintf("%s-%s", mapEmittance.File, mapDecal.File)
			tex, err := c.LoadTextureFunc(key, func() ([]byte, error) {
				emitImg, err := c.LoadTextureImage(mapEmittance)
				if err != nil {
					return nil, err
				}
				decalImg, err := c.LoadTextureImage(mapDecal)
				if err != nil {
					return nil, err
				}
				return image.MixPngImages(emitImg.Data, decalImg.Data, func(emit, decal color.NRGBA) color.NRGBA {
					return color.NRGBA{
						uint8(float32(emit.R) / 255.0 * float32(decal.R)),
						uint8(float32(emit.G) / 255.0 * float32(decal.G)),
						uint8(float32(emit.B) / 255.0 * float32(decal.B)),
						uint8(float32(emit.A) / 255.0 * float32(decal.A)),
					}
				})
			})
			if err != nil {
				slog.Warn("Failed to combine emit+decal", "file", key, "err", err)
			} else {
				texEmissive = tex
			}
		}

		if (shaderEmissiveDecal || shaderEmittanceMap) && texEmissive == nil && mapEmittance != nil {
			texEmissive = c.LoadTexture(mapEmittance)
		}

		texTransform := getTexTransform(m)

		if len(mtlDiffuse) >= 3 {
			factor := [4]float64{
				float64(mtlDiffuse[0]),
				float64(mtlDiffuse[1]),
				float64(mtlDiffuse[2]),
				1,
			}
			if len(mtlDiffuse) == 4 {
				factor[3] = float64(mtlDiffuse[3])
			}
			material.PBRMetallicRoughness.BaseColorFactor = &factor
		}
		if texDiffuse != nil {
			material.PBRMetallicRoughness.MetallicFactor = nil
			material.PBRMetallicRoughness.BaseColorTexture = &gltf.TextureInfo{
				Index:      slices.Index(c.Textures, texDiffuse),
				Extensions: gltf.Extensions{},
			}
			if texTransform != nil {
				material.PBRMetallicRoughness.BaseColorTexture.Extensions[texturetransform.ExtensionName] = &texTransform
			}
		}
		if texBumpmap != nil {
			material.NormalTexture = &gltf.NormalTexture{
				Index:      gltf.Index(slices.Index(c.Textures, texBumpmap)),
				Scale:      gltf.Float(1),
				Extensions: gltf.Extensions{},
			}
			if texTransform != nil {
				material.NormalTexture.Extensions[texturetransform.ExtensionName] = &texTransform
			}
		}
		if texSpecular != nil && !isGlass && !isHair {
			ext := specular.PBRSpecularGlossiness{
				DiffuseFactor:    float4(1, 1, 1, 1),
				SpecularFactor:   float3(1, 1, 1),
				GlossinessFactor: gltf.Float(1),
			}
			if material.PBRMetallicRoughness.BaseColorTexture != nil {
				ext.DiffuseTexture = &gltf.TextureInfo{
					Index:      material.PBRMetallicRoughness.BaseColorTexture.Index,
					Extensions: gltf.Extensions{},
				}
				if texTransform != nil {
					ext.DiffuseTexture.Extensions[texturetransform.ExtensionName] = &texTransform
				}
			}
			ext.SpecularGlossinessTexture = &gltf.TextureInfo{
				Index:      slices.Index(c.Textures, texSpecular),
				Extensions: gltf.Extensions{},
			}
			if texTransform != nil {
				ext.SpecularGlossinessTexture.Extensions[texturetransform.ExtensionName] = &texTransform
			}
			if len(mtlSpecular) >= 3 {
				ext.SpecularFactor = float3(float64(mtlSpecular[0]), float64(mtlSpecular[1]), float64(mtlSpecular[2]))
			}
			if len(mtlDiffuse) >= 3 {
				factor := float4(
					float64(mtlDiffuse[0]),
					float64(mtlDiffuse[1]),
					float64(mtlDiffuse[2]),
					1,
				)
				if len(mtlDiffuse) == 4 {
					factor[3] = float64(mtlDiffuse[3])
				}
				ext.DiffuseFactor = factor
			}

			material.Extensions[specular.ExtensionName] = &ext
			c.ExtensionsRequired = utils.AppendUniq(c.ExtensionsRequired, specular.ExtensionName)
			c.ExtensionsUsed = utils.AppendUniq(c.ExtensionsUsed, specular.ExtensionName)

			// need to remove the pbrMetallicRoughness, otherwise playcanvas would pick that up instead
			material.PBRMetallicRoughness.BaseColorFactor = nil
			material.PBRMetallicRoughness.BaseColorTexture = nil
			material.PBRMetallicRoughness.MetallicFactor = gltf.Float(0)
			if mtlShininess >= 0 {
				material.PBRMetallicRoughness.RoughnessFactor = gltf.Float(float64(1.0 - mtlShininess/255))
			}
		}

		if texEmissive != nil {
			material.EmissiveFactor = [3]float64{1, 1, 1}
			material.EmissiveTexture = &gltf.TextureInfo{
				Index: slices.Index(c.Textures, texEmissive),
			}
		}

		if (isFxTransp || texEmissive != nil) && !shaderEmissiveDecal && len(mtlEmittance) >= 4 {
			scale := math.Log(1+float64(mtlEmittance[3])) / 10
			material.EmissiveFactor = [3]float64{
				float64(mtlEmittance[0]) * scale,
				float64(mtlEmittance[1]) * scale,
				float64(mtlEmittance[2]) * scale,
			}
		} else if len(mtlEmittance) >= 3 {
			material.EmissiveFactor = [3]float64{
				float64(mtlEmittance[0]),
				float64(mtlEmittance[1]),
				float64(mtlEmittance[2]),
			}
		}

		material.AlphaMode = gltf.AlphaOpaque
		if mtlAlphaTest >= 0 {
			cutoff := float64(mtlAlphaTest)
			material.AlphaCutoff = &cutoff
			material.AlphaMode = gltf.AlphaMask
			material.DoubleSided = true
		}
		if isGeometryFog || isGeometryBeam || isParticle || isNoDraw {
			mtlOpacity = 0.1
		}
		if mtlOpacity >= 0 && mtlOpacity < 1 {
			opacity := float64(mtlOpacity)
			if material.PBRMetallicRoughness == nil {
				material.PBRMetallicRoughness = &gltf.PBRMetallicRoughness{}
			}
			if material.PBRMetallicRoughness.BaseColorFactor == nil {
				material.PBRMetallicRoughness.BaseColorFactor = &[4]float64{1, 1, 1, 1}
			}
			material.PBRMetallicRoughness.BaseColorFactor[3] = opacity
			material.AlphaCutoff = nil
			material.AlphaMode = gltf.AlphaBlend
			material.DoubleSided = true
		}

		if isGlass {
			//   "extensions": {
			//     "KHR_materials_transmission": {
			//       "transmissionFactor": 0.8,
			//       "transmissionTexture": {
			//         "index": 0
			//       }
			//     }
			//  }
			factor := mtlOpacity
			if factor == 0 {
				factor = 1
			}
			material.DoubleSided = true
			material.Extensions["KHR_materials_transmission"] = map[string]any{
				"transmissionFactor": factor,
			}
			c.ExtensionsUsed = utils.AppendUniq(c.ExtensionsUsed, "KHR_materials_transmission")
		}

		// if (shaderOverlayMask && texCustom && appearance != null) {
		//   const extension = doc.createExtension(NwMaterialExtension)
		//   extension.setRequired(false)
		//   const props = extension.createProps()
		//   if (typeof appearance === 'object') {
		//     props.setParams({
		//       ...appearance,
		//     })
		//   }
		//   props.setMaskTexture(texCustom)
		//   material.setExtension(NwMaterialExtension.EXTENSION_NAME, props)
		// }
	}

}

func lookupMtl(material *gltf.Material) *mtl.Material {
	if mtl, ok := ExtrasLoad[mtl.Material](material.Extras, "mtl"); ok {
		return &mtl
	}
	return nil
}

func pluckMtl(material *gltf.Material) *mtl.Material {
	if mtl, ok := ExtrasLoad[mtl.Material](material.Extras, "mtl"); ok {
		material.Extras = ExtrasDelete(material.Extras, "mtl")
		return &mtl
	}
	return nil
}

func getTexTransform(m *mtl.Material) *texturetransform.TextureTranform {
	if m.Params == nil {
		return nil
	}
	hasTile := m.Params.Has("SOURCE_2D_TILE_X")
	hasPhase := m.Params.Has("SOURCE_2D_PHASE_X")
	if !hasTile && !hasPhase {
		return nil
	}

	texTransform := texturetransform.TextureTranform{
		Scale:  [2]float64{1, 1},
		Offset: [2]float64{0, 0},
	}
	if m.Params.Has("SOURCE_2D_TILE_X") {
		if v1, err := strconv.ParseFloat(m.Params.Get("SOURCE_2D_TILE_X"), 32); err == nil {
			texTransform.Scale[0] = v1
		}
		if v2, err := strconv.ParseFloat(m.Params.Get("SOURCE_2D_TILE_Y"), 32); err == nil {
			texTransform.Scale[1] = v2
		}
	}
	if m.Params.Has("SOURCE_2D_PHASE_X") {
		if v1, err := strconv.ParseFloat(m.Params.Get("SOURCE_2D_PHASE_X"), 32); err == nil {
			texTransform.Offset[0] = v1
		}
		if v2, err := strconv.ParseFloat(m.Params.Get("SOURCE_2D_PHASE_Y"), 32); err == nil {
			texTransform.Offset[1] = v2
		}
	}
	return &texTransform
}

func float4(r, g, b, a float64) *[4]float64 {
	res := [4]float64{r, g, b, a}
	return &res
}

func float3(r, g, b float64) *[3]float64 {
	res := [3]float64{r, g, b}
	return &res
}
