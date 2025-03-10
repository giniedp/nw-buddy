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

func (c *Converter) ImportCgfMaterials() {
	shadersToIgnore := []string{
		"nodraw",
		"geometrybeam",
		"geometrybeamsimple",
		"meshparticle",
		"geometryfog",
	}

	for _, mesh := range c.Doc.Meshes {
		toDetach := make([]*gltf.Primitive, 0)
		for _, primitive := range mesh.Primitives {
			if primitive.Material != nil {
				material := c.Doc.Materials[*primitive.Material]
				if slices.Contains(shadersToIgnore, strings.ToLower(material.Name)) {
					toDetach = append(toDetach, primitive)
				}
			}
		}
		for len(toDetach) > 0 {
			prim := toDetach[0]
			fmt.Sprintln("Detaching primitive")
			toDetach = toDetach[1:]
			index := slices.Index(mesh.Primitives, prim)
			mesh.Primitives = slices.Delete(mesh.Primitives, index, index+1)
		}
	}

	{
		toDetach := make([]*gltf.Material, 0)
		for _, material := range c.Doc.Materials {
			if slices.Contains(shadersToIgnore, strings.ToLower(material.Name)) {
				toDetach = append(toDetach, material)
			}
		}
		for len(toDetach) > 0 {
			mat := toDetach[0]
			toDetach = toDetach[1:]
			fmt.Sprintln("Detaching material", mat.Name)
			index := slices.Index(c.Doc.Materials, mat)
			c.Doc.Materials = slices.Delete(c.Doc.Materials, index, index+1)
		}
	}

	for _, material := range c.Doc.Materials {
		m := pluckMaterial(material)
		if m == nil {
			continue
		}

		if material.Extensions == nil {
			material.Extensions = gltf.Extensions{}
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

		isGlass := strings.EqualFold(m.Shader, "glass")
		isHair := strings.EqualFold(m.Shader, "hair")
		isFxTransp := strings.EqualFold(m.Shader, "Fxmeshadvancedtransp") // only isabella gaze has this shader

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

		// Bumpmap and Smoothness are the same texture
		// - rgb -> Bumpmap
		// - a -> Smoothness
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
				return image.MixPngImages(specBytes, smoothImg.Alpha, func(spec, smooth color.Color) color.Color {
					r, g, b, _ := spec.RGBA()
					_, _, _, a := smooth.RGBA()
					return color.RGBA{
						uint8(r), uint8(g), uint8(b), uint8(a),
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
				return image.MixPngImages(emitImg.Data, decalImg.Data, func(emit, decal color.Color) color.Color {
					r1, g1, b1, a1 := emit.RGBA()
					r2, g2, b2, a2 := decal.RGBA()
					return color.RGBA{
						uint8(float32(uint8(r1)) / 255.0 * float32(uint8(r2))),
						uint8(float32(uint8(g1)) / 255.0 * float32(uint8(g2))),
						uint8(float32(uint8(b1)) / 255.0 * float32(uint8(b2))),
						uint8(float32(uint8(a1)) / 255.0 * float32(uint8(a2))),
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
			diffuse := [4]float64{
				float64(mtlDiffuse[0]),
				float64(mtlDiffuse[1]),
				float64(mtlDiffuse[2]),
			}
			if len(mtlDiffuse) == 4 {
				diffuse[3] = float64(mtlDiffuse[3])
			} else {
				diffuse[3] = 1
			}
			if material.PBRMetallicRoughness == nil {
				material.PBRMetallicRoughness = &gltf.PBRMetallicRoughness{}
			}
			material.PBRMetallicRoughness.BaseColorFactor = &diffuse
		}
		if texDiffuse != nil {
			metallicFactor := float64(0)
			if material.PBRMetallicRoughness == nil {
				material.PBRMetallicRoughness = &gltf.PBRMetallicRoughness{}
			}
			material.PBRMetallicRoughness.MetallicFactor = &metallicFactor
			material.PBRMetallicRoughness.BaseColorTexture = &gltf.TextureInfo{
				Index: slices.Index(c.Doc.Textures, texDiffuse),
			}
			if texTransform != nil {
				addTexTransform(material.PBRMetallicRoughness.BaseColorTexture, *texTransform)
			}
		}
		if texBumpmap != nil {
			index := slices.Index(c.Doc.Textures, texBumpmap)
			material.NormalTexture = &gltf.NormalTexture{
				Index: &index,
			}
			// if (texTransformProps) {
			//   material.getNormalTextureInfo().setExtension(KHRTextureTransform.EXTENSION_NAME, texTransformProps)
			// }
		}
		if texSpecular != nil && !isGlass && !isHair {
			ext := specular.PBRSpecularGlossiness{}
			if material.PBRMetallicRoughness != nil && material.PBRMetallicRoughness.BaseColorTexture != nil {
				ext.DiffuseTexture = &gltf.TextureInfo{
					Index: material.PBRMetallicRoughness.BaseColorTexture.Index,
				}
			}
			ext.SpecularGlossinessTexture = &gltf.TextureInfo{
				Index: slices.Index(c.Doc.Textures, texSpecular),
			}
			if texTransform != nil {
				addTexTransform(ext.DiffuseTexture, *texTransform)
				addTexTransform(ext.SpecularGlossinessTexture, *texTransform)
			}
			if len(mtlSpecular) >= 3 {
				specular := [3]float64{
					float64(mtlSpecular[0]),
					float64(mtlSpecular[1]),
					float64(mtlSpecular[2]),
				}
				ext.SpecularFactor = &specular
			}
			if len(mtlDiffuse) >= 3 {
				diffuse := [4]float64{
					float64(mtlDiffuse[0]),
					float64(mtlDiffuse[1]),
					float64(mtlDiffuse[2]),
				}
				if len(mtlDiffuse) == 4 {
					diffuse[3] = float64(mtlDiffuse[3])
				} else {
					diffuse[3] = 1
				}
				ext.DiffuseFactor = &diffuse
			}

			material.Extensions[specular.ExtensionName] = &ext
			c.Doc.ExtensionsRequired = utils.AppendUniq(c.Doc.ExtensionsRequired, specular.ExtensionName)
			c.Doc.ExtensionsUsed = utils.AppendUniq(c.Doc.ExtensionsUsed, specular.ExtensionName)

			if material.PBRMetallicRoughness == nil {
				material.PBRMetallicRoughness = &gltf.PBRMetallicRoughness{}
			}
			material.PBRMetallicRoughness.BaseColorFactor = nil
			material.PBRMetallicRoughness.BaseColorTexture = nil
			factor := float64(1)
			material.PBRMetallicRoughness.MetallicFactor = &factor

			if mtlShininess >= 0 {
				factor := float64(1.0 - mtlShininess/255)
				material.PBRMetallicRoughness.RoughnessFactor = &factor
			}
		}

		if texEmissive != nil {
			material.EmissiveFactor = [3]float64{1, 1, 1}
			material.EmissiveTexture = &gltf.TextureInfo{
				Index: slices.Index(c.Doc.Textures, texEmissive),
			}
		}

		if (isFxTransp || texEmissive != nil) && !shaderEmissiveDecal && len(mtlEmittance) >= 4 {
			value := [3]float64{
				float64(mtlEmittance[0]),
				float64(mtlEmittance[1]),
				float64(mtlEmittance[2]),
			}
			scale := math.Log(1+float64(mtlEmittance[3])) / 10
			value[0] *= scale
			value[1] *= scale
			value[2] *= scale
			material.EmissiveFactor = value
		} else if len(mtlEmittance) >= 3 {
			value := [3]float64{
				float64(mtlEmittance[0]),
				float64(mtlEmittance[1]),
				float64(mtlEmittance[2]),
			}
			material.EmissiveFactor = value
		}

		material.AlphaMode = gltf.AlphaOpaque
		if mtlAlphaTest >= 0 {
			cutoff := float64(mtlAlphaTest)
			material.AlphaCutoff = &cutoff
			material.AlphaMode = gltf.AlphaMask
			material.DoubleSided = true
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
			c.Doc.ExtensionsUsed = utils.AppendUniq(c.Doc.ExtensionsUsed, "KHR_materials_transmission")
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

func pluckMaterial(material *gltf.Material) *mtl.Material {
	if mtl, ok := extrasLoad[mtl.Material](material.Extras, "mtl"); ok {
		material.Extras = extrasDelete(material.Extras, "mtl")
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
		Scale: [2]float64{1, 1},
	}
	if m.Params.Has("SOURCE_2D_TILE_X") {
		v1, _ := strconv.ParseFloat(m.Params.Get("SOURCE_2D_TILE_X"), 32)
		v2, _ := strconv.ParseFloat(m.Params.Get("SOURCE_2D_TILE_Y"), 32)
		texTransform.Scale = [2]float64{v1, v2}
	}
	if m.Params.Has("SOURCE_2D_PHASE_X") {
		v1, _ := strconv.ParseFloat(m.Params.Get("SOURCE_2D_PHASE_X"), 32)
		v2, _ := strconv.ParseFloat(m.Params.Get("SOURCE_2D_PHASE_Y"), 32)
		texTransform.Offset = [2]float64{v1, v2}
	}
	return &texTransform
}

func addTexTransform(info *gltf.TextureInfo, transform texturetransform.TextureTranform) {
	if info.Extensions == nil {
		info.Extensions = gltf.Extensions{}
	}
	info.Extensions[texturetransform.ExtensionName] = &transform
}
