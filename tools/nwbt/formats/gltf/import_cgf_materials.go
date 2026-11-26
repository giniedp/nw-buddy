package gltf

import (
	"nw-buddy/tools/formats/gltf/extensions"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils"
	"path"

	"github.com/qmuntal/gltf"
)

type ImportCgfMaterialsOptions struct {
	TextureBaking bool
	DiffuseOnly   bool
	Original      bool
	// EmissiveRef is the luminance (cd/m²) that becomes emissive 1.0, see DefaultEmissiveRef
	EmissiveRef float32
	// SpecularIOR is the ior of the specular workflow (setSpecular). 0 (default): KHR_materials_ior 0, F0 = specular
	// color, exact per spec. > 1: that ior with the specular color scaled to the same F0, for renderers without the
	// ior 0 case (Blender renders ior 0 as total reflection, the base color is lost).
	SpecularIOR float32
}

// WithSpecularIOR sets the ior of the specular workflow, see ImportCgfMaterialsOptions.SpecularIOR. Values <= 1 keep
// ior 0: at ior 1 there is no reflection to scale, below 1 Blender reflects totally.
func WithSpecularIOR(value float32) func(*ImportCgfMaterialsOptions) {
	return func(o *ImportCgfMaterialsOptions) {
		o.SpecularIOR = 0
		if value > 1 {
			o.SpecularIOR = value
		}
	}
}

// DefaultEmissiveRef is the saturation luminance 1.2 · 2^EV100 of a day exposure (EV100 12). glTF viewers light like
// daylight by default; a night exposure (EV100 7, ≈ 154 cd/m²) blows emitters out there.
const DefaultEmissiveRef = 1.2 * 4096

// WithEmissiveRef sets the luminance (cd/m²) that maps to emissive 1.0: lower values make emitters brighter.
// Values <= 0 keep the default.
func WithEmissiveRef(value float32) func(*ImportCgfMaterialsOptions) {
	return func(o *ImportCgfMaterialsOptions) {
		if value > 0 {
			o.EmissiveRef = value
		}
	}
}

func WithTextureBaking(value bool) func(*ImportCgfMaterialsOptions) {
	return func(o *ImportCgfMaterialsOptions) {
		o.TextureBaking = value
	}
}

func WithDiffuseOnly(value bool) func(*ImportCgfMaterialsOptions) {
	return func(o *ImportCgfMaterialsOptions) {
		o.DiffuseOnly = value
	}
}

func WithOriginal(value bool) func(*ImportCgfMaterialsOptions) {
	return func(o *ImportCgfMaterialsOptions) {
		o.Original = value
	}
}

func (doc *Document) ProcessMaterials(opts ...func(*ImportCgfMaterialsOptions)) {
	options := ImportCgfMaterialsOptions{
		TextureBaking: false,
		EmissiveRef:   DefaultEmissiveRef,
	}
	for _, o := range opts {
		o(&options)
	}

	for _, gltfMtl := range doc.Materials {
		if !doc.IsMaterialReferenced(gltfMtl) && doc.Options.SkipUnlinkedMtl {
			continue
		}

		cgfMtl := pluckMtl(gltfMtl)
		if cgfMtl == nil {
			continue
		}

		doc.augmentMaterialWithPbr(gltfMtl, cgfMtl, options)
		doc.augmentMaterialWithOriginal(gltfMtl, cgfMtl, options)
		doc.augmentMaterialWithRef(gltfMtl)
	}
	doc.applyVertexColorUse()
}

// applyVertexColorUse keeps COLOR_0 only on primitives whose shader tints with the vertex colors.
// glTF multiplies COLOR_0 into the base color, so the other primitives get the colors as the app attribute _COLOR_0.
// Opaque and masked primitives get an RGB view of the colors: the vertex alpha must not reach the alpha test.
func (doc *Document) applyVertexColorUse() {
	rgbViews := map[int]int{} // RGBA accessor → its RGB accessor
	for _, mesh := range doc.Meshes {
		for _, prim := range mesh.Primitives {
			color, ok := prim.Attributes[gltf.COLOR_0]
			if !ok || prim.Material == nil {
				continue
			}
			mat := doc.Materials[*prim.Material]
			tints, known := ExtrasLoad[bool](mat.Extras, extraKeyVertexColors)
			if !known {
				continue
			}
			if !tints {
				delete(prim.Attributes, gltf.COLOR_0)
				prim.Attributes["_COLOR_0"] = color
				continue
			}
			if mat.AlphaMode == gltf.AlphaBlend || doc.Accessors[color].Type != gltf.AccessorVec4 {
				continue
			}
			rgb, ok := rgbViews[color]
			if !ok {
				view := *doc.Accessors[color]
				view.Type = gltf.AccessorVec3
				view.Min, view.Max = nil, nil
				// a tightly packed RGBA view (inline colors) needs its stride, the RGB element is only 3 bytes
				if bv := doc.BufferViews[*view.BufferView]; bv.ByteStride == 0 {
					bv.ByteStride = 4
				}
				doc.Accessors = append(doc.Accessors, &view)
				rgb = len(doc.Accessors) - 1
				rgbViews[color] = rgb
			}
			prim.Attributes[gltf.COLOR_0] = rgb
		}
	}
	for _, mat := range doc.Materials {
		mat.Extras = ExtrasDelete(mat.Extras, extraKeyVertexColors)
	}
}

func (doc *Document) augmentMaterialWithRef(gltfMtl *gltf.Material) {
	ref, ok := ExtrasLoad[extensions.ExtNwMtlRef](gltfMtl.Extras, ExtraKeyMtlRef)
	if !ok {
		return
	}
	gltfMtl.Extras = ExtrasDelete(gltfMtl.Extras, ExtraKeyMtlRef)
	if gltfMtl.Extensions == nil {
		gltfMtl.Extensions = gltf.Extensions{}
	}
	gltfMtl.Extensions[extensions.EXT_nw_mtl_ref] = ref
	doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, extensions.EXT_nw_mtl_ref)
}

func lookupMtl(material *gltf.Material) *mtl.Material {
	if material == nil {
		return nil
	}
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

func float4(r, g, b, a float64) *[4]float64 {
	res := [4]float64{r, g, b, a}
	return &res
}

func float3(r, g, b float64) *[3]float64 {
	res := [3]float64{r, g, b}
	return &res
}

func buildTexturePath(tex *gltf.Texture, affix ...string) string {
	result, ok := ExtrasLoad[string](tex.Extras, ExtraKeySource)
	if !ok {
		result, ok = ExtrasLoad[string](tex.Extras, ExtraKeyRefID)
	}
	if !ok {
		result = tex.Name
	}
	return result + "_" + hashString(path.Join(affix...))
}
