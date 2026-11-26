package gltf

import (
	"log/slog"
	"math"
	"slices"
	"strings"

	"nw-buddy/tools/formats/gltf/extensions"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/ext/texturetransform"
	"github.com/qmuntal/gltf/ext/unlit"
)

// Maps a New World material to glTF PBR for previews in other tools (Babylon sandbox, Blender).
//
// New World uses the specular workflow: metallic 0 + KHR_materials_specular + KHR_materials_ior with ior 0, so
// F0 = specular color (or an ior > 1 with a scaled specular color, ImportCgfMaterialsOptions.SpecularIOR). The
// mapping follows the viewer materials and the game shaders.
// It is a preview, not a match. Not expressed:
//   - overlay / dye masks
//   - blend layers
//   - detail maps
//   - dissolve
//   - view dependent effects
//
// The raw material stays in EXT_nw_mtl.
func (doc *Document) augmentMaterialWithPbr(material *gltf.Material, m *mtl.Material, options ImportCgfMaterialsOptions) {
	if material.Extensions == nil {
		material.Extensions = gltf.Extensions{}
	}
	p := newPbrInputs(m)

	material.AlphaMode = gltf.AlphaOpaque
	material.AlphaCutoff = nil
	material.DoubleSided = p.mtlFlags&mtl.MTL_FLAG_2SIDED != 0
	material.PBRMetallicRoughness = &gltf.PBRMetallicRoughness{
		BaseColorFactor: float4(1, 1, 1, 1),
		MetallicFactor:  gltf.Float(0),
		RoughnessFactor: gltf.Float(1),
	}

	switch p.shader {
	case "nodraw":
		// hidden, the primitives are skipped by the geometry import (plan 2.6)
	case "glass", "water", "watervolume":
		doc.pbrGlass(material, p, options)
	case "fxmeshadvancedtransp":
		doc.pbrFxTransp(material, p)
	case "geometrybeam", "geometrybeamsimple", "geometryfog", "geometryfognovertalpha",
		"meshparticle", "particleimposter", "particles", "distanceclouds",
		"silhouette_always", "silhouette_visible", "silhouette_never", "silhouette_xray":
		doc.pbrUnlit(material, p)
	default:
		// illum, illum_oceansplash, vegetation, humanskin, hair, fxmeshadvanced and unknown shaders
		doc.pbrLit(material, p, options)
	}
	material.Extras = ExtrasStore(material.Extras, extraKeyVertexColors, p.vertexColors())
	doc.augmentMaterialWithNw(material, p)
}

// extraKeyVertexColors marks materials whose shader tints with the vertex colors, read by applyVertexColorUse
const extraKeyVertexColors = "vertexColors"

// pbrInputs are the material attributes as the viewer materials read them
type pbrInputs struct {
	mtl *mtl.Material
	// the texture slots as the engine binds them, see mtl.WithNormalMapSmoothness
	textures  []mtl.Texture
	shader    string
	flags     map[string]bool
	diffuse   [4]float32
	specular  [4]float32
	emittance [4]float32
	opacity   float32
	alphaTest float32
	gloss     float32 // smoothness factor, multiplied with the smoothness map
	mtlFlags  int
}

func newPbrInputs(m *mtl.Material) pbrInputs {
	p := pbrInputs{
		mtl:       m,
		textures:  mtl.WithNormalMapSmoothness(m.Textures.Texture),
		shader:    strings.ToLower(m.Shader),
		flags:     map[string]bool{},
		diffuse:   vec4Or(m.Diffuse, [4]float32{1, 1, 1, 1}),
		specular:  vec4Or(m.Specular, [4]float32{1, 1, 1, 1}),
		emittance: vec4Or(m.Emittance, [4]float32{0, 0, 0, 0}),
		opacity:   1,
	}
	for _, flag := range strings.Split(strings.ToUpper(m.StringGenMask), "%") {
		if flag != "" {
			p.flags[flag] = true
		}
	}
	for i := range p.emittance {
		// some files have garbage, e.g. Emittance="-341776551831207702696034304.000000,0,0,0"
		p.emittance[i] = max(p.emittance[i], 0)
	}
	if m.Opacity != nil {
		p.opacity = *m.Opacity
	}
	if m.AlphaTest != nil {
		p.alphaTest = *m.AlphaTest
	}
	if m.MtlFlags != nil {
		p.mtlFlags = *m.MtlFlags
	}
	// the viewer: SpecularColor.w = Shininess / 255 when Shininess is set and not 0, else the Specular alpha
	p.gloss = p.specular[3]
	if m.Shininess != nil && *m.Shininess != 0 {
		p.gloss = *m.Shininess / 255
	}
	p.gloss = min(max(p.gloss, 0), 1)
	return p
}

func (p pbrInputs) tex(slot mtl.TexMap) *mtl.Texture {
	var tex *mtl.Texture
	for i := range p.textures {
		if p.textures[i].Map == slot {
			tex = &p.textures[i]
			break
		}
	}
	if tex == nil {
		return nil
	}
	file := strings.TrimSpace(tex.File)
	// engine bound textures ($...) and probes are not in the archive
	if strings.HasPrefix(file, "$") || strings.HasPrefix(strings.ToLower(file), "nearest_cubemap") {
		return nil
	}
	return tex
}

func (p pbrInputs) param(name string, fallback float32) float32 {
	if p.mtl.Params == nil {
		return fallback
	}
	if v, ok := p.mtl.Params.Load(name); ok {
		// some params are written as vectors ("1,0,0,0"), the first component is the value
		return vec4Or(mtl.ParamColor(v), [4]float32{fallback})[0]
	}
	return fallback
}

func (p pbrInputs) paramVec(name string, fallback [4]float32) [4]float32 {
	if p.mtl.Params == nil {
		return fallback
	}
	if v, ok := p.mtl.Params.Load(name); ok {
		return vec4Or(mtl.ParamColor(v), fallback)
	}
	return fallback
}

// blended reports whether the viewer draws the material alpha blended
func (p pbrInputs) blended() bool {
	switch p.shader {
	case "illum", "illum_oceansplash":
		return p.opacity < 1 || p.flags["DECAL"]
	case "fxmeshadvanced":
		return p.opacity < 1
	}
	return false
}

// vertexColors reports whether the shader multiplies the vertex colors into the base color
func (p pbrInputs) vertexColors() bool {
	switch p.shader {
	case "illum", "illum_oceansplash", "fxmeshadvanced", "hair":
		return p.flags["VERTCOLORS"]
	case "geometrybeam", "geometrybeamsimple", "geometryfog", "geometryfognovertalpha":
		return true
	}
	// vegetation keeps bending data in the colors, the other shaders ignore them
	return false
}

func (doc *Document) pbrLit(material *gltf.Material, p pbrInputs, options ImportCgfMaterialsOptions) {
	pbr := material.PBRMetallicRoughness
	isIllum := p.shader == "illum" || p.shader == "illum_oceansplash"
	isHair := p.shader == "hair"
	isSkin := p.shader == "humanskin"
	isVegetation := p.shader == "vegetation"

	// the Diffuse TexMod moves the base uv, which every base slot samples
	diffuse := p.tex(mtl.MtlMap_Diffuse)
	baseTransform := resolveTextureTransform(diffuse)

	// the colors of an armor appearance and its dyes, baked into the textures (glTF has no masks)
	overlay, hasOverlay := overlayMaskOf(p)
	hasOverlay = hasOverlay && options.TextureBaking

	// --- base color and alpha
	pbr.BaseColorFactor = float4(float64(p.diffuse[0]), float64(p.diffuse[1]), float64(p.diffuse[2]), 1)
	if baked := doc.overlayAlbedo(diffuse, p, overlay, hasOverlay); baked != nil {
		// the diffuse color is in the bake
		pbr.BaseColorFactor = float4(1, 1, 1, 1)
		pbr.BaseColorTexture = doc.textureInfo(baked, baseTransform)
	} else if tex := doc.LoadOrStoreMtlTexture(diffuse); tex != nil {
		pbr.BaseColorTexture = doc.textureInfo(tex, baseTransform)
	}
	switch {
	case isHair:
		// hair always tests the alpha, 0.05 without an AlphaTest (the clip of the game's blended hair passes)
		material.AlphaMode = gltf.AlphaMask
		material.AlphaCutoff = gltf.Float(0.05)
		if p.alphaTest > 0 {
			material.AlphaCutoff = gltf.Float(float64(p.alphaTest))
		}
		material.DoubleSided = true
	case p.blended():
		// a blended material with an alpha test is drawn blended and tested in the viewer, glTF can only blend
		material.AlphaMode = gltf.AlphaBlend
		pbr.BaseColorFactor[3] = float64(p.opacity)
	case p.alphaTest > 0 && p.alphaTest < 1:
		// tests the diffuse alpha only, not the vertex alpha
		material.AlphaMode = gltf.AlphaMask
		material.AlphaCutoff = gltf.Float(float64(p.alphaTest))
	}
	if isVegetation && (p.flags["LEAVES"] || p.flags["GRASS"]) {
		material.DoubleSided = true
	}
	if options.DiffuseOnly {
		doc.setSpecular(material, [3]float32{0, 0, 0}, nil, nil, options)
		return
	}

	// --- normal
	bump := p.tex(mtl.MtlMap_Bumpmap)
	if (isSkin || isHair) && !p.flags["NORMAL_MAP"] {
		bump = nil
	}
	if tex := doc.LoadOrStoreMtlTexture(bump); tex != nil {
		info := doc.textureInfo(tex, baseTransform)
		material.NormalTexture = &gltf.NormalTexture{Index: gltf.Index(info.Index), Scale: gltf.Float(1), Extensions: info.Extensions}
	}

	// --- specular reflectance (F0)
	f0 := [3]float32{p.specular[0], p.specular[1], p.specular[2]}
	var specMap *mtl.Texture
	switch {
	case isHair:
		// the hair F0 is the specular map, the attribute is not applied
		specMap = p.tex(mtl.MtlMap_Specular)
		f0 = [3]float32{1, 1, 1}
	case isVegetation:
		if !p.flags["GRASS"] {
			specMap = p.tex(mtl.MtlMap_Specular)
		}
	case isIllum:
		// %SPECULAR_MAP follows the bound Specular texture, not the authored flag (Illum.ext DependencySet/Reset,
		// CShaderMan::mfModifyGenFlags; legacy materials name it %SPEC_MAP)
		specMap = p.tex(mtl.MtlMap_Specular)
		if specMap == nil && p.blended() && !p.flags["DECAL"] {
			// forward Illum has no F0 without the specular map, the deferred (opaque, decal) path uses the attribute
			f0 = [3]float32{0, 0, 0}
		}
	case p.flags["SPECULAR_MAP"]:
		specMap = p.tex(mtl.MtlMap_Specular)
	}
	if isIllum && p.flags["DECAL"] {
		lum := luminance(f0)
		f0 = [3]float32{lum, lum, lum}
	}
	if hasOverlay && isIllum && !p.flags["DECAL"] {
		if baked := doc.bakeOverlaySpecular(specMap, f0, overlay); baked != nil {
			// f0 is in the bake
			doc.setSpecular(material, [3]float32{1, 1, 1}, baked, baseTransform, options)
		} else {
			doc.setSpecular(material, f0, doc.LoadOrStoreMtlTexture(specMap), baseTransform, options)
		}
	} else {
		doc.setSpecular(material, f0, doc.LoadOrStoreMtlTexture(specMap), baseTransform, options)
	}

	// --- roughness = 1 - smoothness
	if baked := doc.overlayRoughness(p.tex(mtl.MtlMap_Smoothness), p, overlay, hasOverlay); baked != nil {
		pbr.RoughnessFactor = gltf.Float(1)
		pbr.MetallicRoughnessTexture = doc.textureInfo(baked, baseTransform)
	} else {
		doc.setRoughness(material, p.tex(mtl.MtlMap_Smoothness), p.gloss, baseTransform, options)
	}

	// --- occlusion
	if isIllum && p.flags["OCCLUSION_MAP"] {
		if tex := doc.LoadOrStoreMtlTexture(p.tex(mtl.MtlMap_Occlusion)); tex != nil {
			info := doc.textureInfo(tex, baseTransform)
			material.OcclusionTexture = &gltf.OcclusionTexture{Index: gltf.Index(info.Index), Extensions: info.Extensions}
		}
	}

	// --- emittance
	if !isHair {
		doc.setEmissive(material, p, options)
	}
}

// pbrGlass: the glass color is the background tinted by TintColor, clouded towards the lit tint by TintCloudiness.
// The Diffuse is only read with %DIRT_MAP, not mapped.
func (doc *Document) pbrGlass(material *gltf.Material, p pbrInputs, options ImportCgfMaterialsOptions) {
	pbr := material.PBRMetallicRoughness
	baseTransform := resolveTextureTransform(p.tex(mtl.MtlMap_Diffuse))

	tint := p.paramVec("TintColor", [4]float32{1, 1, 1, 1})
	pbr.BaseColorFactor = float4(float64(tint[0]), float64(tint[1]), float64(tint[2]), 1)
	if p.flags["TINT_COLOR_MAP"] {
		if tex := doc.LoadOrStoreMtlTexture(p.tex(mtl.MtlMap_Custom)); tex != nil {
			pbr.BaseColorTexture = doc.textureInfo(tex, baseTransform)
		}
	}
	cloudiness := min(max(p.param("TintCloudiness", 0), 0), 1)
	material.Extensions[extensions.KHR_materials_transmission] = extensions.KHRMaterialsTransmission{
		Factor: float64(1 - cloudiness),
	}
	doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, extensions.KHR_materials_transmission)

	if tex := doc.LoadOrStoreMtlTexture(p.tex(mtl.MtlMap_Bumpmap)); tex != nil {
		info := doc.textureInfo(tex, baseTransform)
		material.NormalTexture = &gltf.NormalTexture{Index: gltf.Index(info.Index), Scale: gltf.Float(1), Extensions: info.Extensions}
	}
	var specMap *mtl.Texture
	if p.flags["SPECULAR_MAP"] {
		specMap = p.tex(mtl.MtlMap_Specular)
	}
	doc.setSpecular(material, [3]float32{p.specular[0], p.specular[1], p.specular[2]}, doc.LoadOrStoreMtlTexture(specMap), baseTransform, options)
	doc.setRoughness(material, p.tex(mtl.MtlMap_Smoothness), p.gloss, baseTransform, options)
}

// pbrUnlit: FX shaders (beams, fog, particles, clouds, outlines) are unlit and blended. Additive blending does not exist
// in glTF, the color is alpha blended instead.
func (doc *Document) pbrUnlit(material *gltf.Material, p pbrInputs) {
	material.DoubleSided = true
	tex := p.tex(mtl.MtlMap_Diffuse)
	if tex == nil {
		tex = p.tex(mtl.MtlMap_Custom)
	}
	color := [3]float64{float64(p.diffuse[0]), float64(p.diffuse[1]), float64(p.diffuse[2])}
	doc.setUnlit(material, p, color, float64(p.opacity), tex)
}

// pbrFxTransp: FxMeshAdvancedTransp tints the source map by the emittance (color times brightness, its hue is kept above
// 1) and is additive, alpha blended here. The alpha is the shader's with white maps and nothing behind the mesh.
func (doc *Document) pbrFxTransp(material *gltf.Material, p pbrInputs) {
	color := [3]float64{}
	for i := range color {
		color[i] = float64(p.emittance[i] * p.emittance[3])
	}
	if peak := max(color[0], color[1], color[2]); peak > 1 {
		for i := range color {
			color[i] /= peak
		}
	}
	tex := p.tex(mtl.MtlMap_Custom)
	if tex == nil {
		tex = p.tex(mtl.MtlMap_Diffuse)
	}
	doc.setUnlit(material, p, color, p.fxTranspAlpha(), tex)
}

// fxTranspAlpha is the alpha of FxMeshAdvancedTransp with white maps and nothing behind the mesh, the fresnel averaged
// over a sphere
func (p pbrInputs) fxTranspAlpha() float64 {
	param := func(name string, fallback float32) float64 {
		return float64(p.param(name, fallback))
	}
	alpha := 1.0
	if p.flags["USE_OUTSIDE_FRESNEL_ALPHA"] || p.flags["USE_INSIDE_FRESNEL_ALPHA"] {
		const steps = 32
		sum := 0.0
		for i := range steps {
			// equal areas of the sphere as seen by the camera
			facing := math.Sqrt((float64(i) + 0.5) / steps)
			fresnel := 1.0
			if p.flags["USE_OUTSIDE_FRESNEL_ALPHA"] {
				fresnel *= math.Pow(facing, param("FRESNEL_OUT_FALLOFF", 1)) * param("FRESNEL_OUT_STRENGTH", 1)
			}
			if p.flags["USE_INSIDE_FRESNEL_ALPHA"] {
				fresnel *= math.Pow(1-facing, param("FRESNEL_IN_FALLOFF", 1)) * param("FRESNEL_IN_STRENGTH", 1)
			}
			sum += min(max(fresnel*10, 0), 1)
		}
		alpha *= sum / steps
	}
	if p.flags["USE_INTERSECTION_GLOW"] {
		alpha += math.Pow(max(1-param("INTERSECT_GLOW_INV", 0), 0), param("INTERSECT_GLOW_FALLOFF", 1))
	}
	if p.flags["USE_INTERSECTION_FADE"] {
		alpha *= math.Pow(max(1-param("INTERSECT_FADE_INV", 0), 0), param("INTERSECT_FADE_FALLOFF", 1))
	}
	alpha = math.Pow(alpha, param("GlobalAlphaFalloff", 1)) * param("GlobalAlphaFill", 1)
	alpha = min(max(alpha, 0), 1) * param("GlobalAlphaStrength", 1)
	if math.IsNaN(alpha) {
		return 0
	}
	return min(max(alpha, 0), 1)
}

// setUnlit writes an unlit, alpha blended base color
func (doc *Document) setUnlit(material *gltf.Material, p pbrInputs, color [3]float64, alpha float64, tex *mtl.Texture) {
	pbr := material.PBRMetallicRoughness
	material.Extensions[unlit.ExtensionName] = unlit.Unlit{}
	doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, unlit.ExtensionName)
	material.AlphaMode = gltf.AlphaBlend
	pbr.BaseColorFactor = float4(color[0], color[1], color[2], alpha)
	if gltfTex := doc.LoadOrStoreMtlTexture(tex); gltfTex != nil {
		transform := resolveTextureTransform(tex)
		if transform == nil {
			transform = resolveTextureTransformPublic(p.mtl.Params)
		}
		pbr.BaseColorTexture = doc.textureInfo(gltfTex, transform)
	}
}

// setSpecular writes the F0 of the specular workflow (E5): F0 = ((ior-1)/(ior+1))² × specularColorFactor ×
// specularColorTexture. With options.SpecularIOR 0 the ior is 0, the spec's case for F0 = specular color. With an
// ior > 1 the color factor is divided by ((ior-1)/(ior+1))², the same F0 for renderers without the ior 0 case
// (Blender). specularFactor (F90) stays 1.
func (doc *Document) setSpecular(material *gltf.Material, f0 [3]float32, specMap *gltf.Texture, transform *texturetransform.TextureTranform, options ImportCgfMaterialsOptions) {
	ior := float64(options.SpecularIOR)
	scale := 1.0
	if ior > 1 {
		r := (ior - 1) / (ior + 1)
		scale = 1 / (r * r)
	} else {
		ior = 0
	}
	spec := extensions.KHRMaterialsSpecular{
		SpecularFactor:      gltf.Float(1),
		SpecularColorFactor: float3(float64(f0[0])*scale, float64(f0[1])*scale, float64(f0[2])*scale),
	}
	if specMap != nil {
		spec.SpecularColorTexture = doc.textureInfo(specMap, transform)
	}
	material.Extensions[extensions.KHR_materials_specular] = &spec
	material.Extensions[extensions.KHR_materials_ior] = extensions.KHRMaterialsIOR{IOR: gltf.Float(ior)}
	doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, extensions.KHR_materials_specular, extensions.KHR_materials_ior)
}

// setRoughness writes roughness = 1 - smoothness: the viewer's (1 - s)² is the GGX alpha, glTF squares its roughness.
// With baking the smoothness map goes into the metallicRoughness texture. Without, the map is not readable: the
// roughness assumes a smoothness map average of 0.5.
func (doc *Document) setRoughness(material *gltf.Material, smoothness *mtl.Texture, gloss float32, transform *texturetransform.TextureTranform, options ImportCgfMaterialsOptions) {
	pbr := material.PBRMetallicRoughness
	if smoothness == nil {
		pbr.RoughnessFactor = gltf.Float(float64(1 - gloss))
		return
	}
	if options.TextureBaking {
		if tex := doc.bakeRoughness(smoothness, gloss); tex != nil {
			pbr.RoughnessFactor = gltf.Float(1)
			pbr.MetallicRoughnessTexture = doc.textureInfo(tex, transform)
			return
		}
	}
	pbr.RoughnessFactor = gltf.Float(float64(1 - gloss*0.5))
}

// setEmissive maps the shader emittance: emit.rgb · lum^(gamma−1) · decal.rgb · emit.a · Emittance.rgb · Emittance.a ·
// 0.1, in renderer units (cd/m² / 10000). Without %EMITTANCE_MAP the maps are white and the decal 0.5.
func (doc *Document) setEmissive(material *gltf.Material, p pbrInputs, options ImportCgfMaterialsOptions) {
	e := p.emittance
	maxc := max(e[0], e[1], e[2])
	if luminance([3]float32{e[0], e[1], e[2]}) <= 0 || maxc <= 0 || e[3] <= 0 {
		return
	}
	material.EmissiveFactor = [3]float64{float64(e[0] / maxc), float64(e[1] / maxc), float64(e[2] / maxc)}

	decalScale := float32(0.5) // engine default of the emissive intensity map: gray
	// Illum: %EMITTANCE_MAP follows the bound Emittance texture (Illum.ext DependencySet/Reset), other shaders: the flag
	hasEmittanceMap := p.flags["EMITTANCE_MAP"]
	if p.shader == "illum" || p.shader == "illum_oceansplash" {
		hasEmittanceMap = p.tex(mtl.MtlMap_Emittance) != nil
	}
	if hasEmittanceMap {
		emit := p.tex(mtl.MtlMap_Emittance)
		decal := p.tex(mtl.MtlMap_Decal)
		if p.shader == "vegetation" && p.flags["BLENDLAYER"] {
			decal = nil
		}
		var tex *gltf.Texture
		if options.TextureBaking {
			if tex = doc.bakeEmissive(emit, decal, p.param("EmittanceMapGamma", 1)); tex != nil && decal != nil {
				decalScale = 1
			}
		}
		if tex == nil {
			tex = doc.LoadOrStoreMtlTexture(emit)
		}
		if tex != nil {
			material.EmissiveTexture = doc.textureInfo(tex, resolveTextureTransform(emit))
			if p.flags["EMITTANCE_MAP_UV_SET_2"] {
				material.EmissiveTexture.TexCoord = 1
			}
		}
	}

	// cd/m² of the brightest channel, relative to the reference
	ref := options.EmissiveRef
	if ref <= 0 {
		ref = DefaultEmissiveRef
	}
	strength := float64(maxc*e[3]*0.1*decalScale) * 10000 / float64(ref)
	if strength <= 1 {
		for i := range material.EmissiveFactor {
			material.EmissiveFactor[i] *= strength
		}
		return
	}
	material.Extensions[extensions.KHR_materials_emissive_strength] = extensions.KHRMaterialsEmissiveStrength{
		EmissiveStrength: strength,
	}
	doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, extensions.KHR_materials_emissive_strength)
}

// augmentMaterialWithNw writes the raw mask and smoothness textures to EXT_nw_material
func (doc *Document) augmentMaterialWithNw(material *gltf.Material, p pbrInputs) {
	var mask *mtl.Texture
	if p.flags["OVERLAY_MASK"] || p.flags["COLOR_SAMPLER_OVERLAY_MASK"] {
		mask = p.tex(mtl.MtlMap_Custom)
	}
	smoothness := p.tex(mtl.MtlMap_Smoothness)
	if mask == nil && smoothness == nil {
		return
	}
	ext := extensions.EnsureNwMaterial(material)
	ext.VertColors = p.vertexColors()
	if tex := doc.LoadOrStoreMtlTexture(mask); tex != nil {
		ext.MaskTexture = &gltf.TextureInfo{Index: slices.Index(doc.Textures, tex)}
	}
	if smoothness != nil {
		if tex := doc.LoadOrStoreMtlTexture(smoothness, true); tex != nil {
			ext.SmoothTexture = doc.textureInfo(tex, resolveTextureTransform(p.tex(mtl.MtlMap_Diffuse)))
		} else {
			slog.Warn("Smoothness texture not loaded", "file", smoothness.File)
		}
	}
	doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, extensions.EXT_nw_material)
}

func (doc *Document) textureInfo(tex *gltf.Texture, transform *texturetransform.TextureTranform) *gltf.TextureInfo {
	info := &gltf.TextureInfo{Index: slices.Index(doc.Textures, tex)}
	if transform != nil {
		info.Extensions = gltf.Extensions{texturetransform.ExtensionName: transform}
		doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, texturetransform.ExtensionName)
	}
	return info
}

func vec4Or(values []float32, fallback [4]float32) [4]float32 {
	res := fallback
	for i := 0; i < len(values) && i < 4; i++ {
		if !math.IsNaN(float64(values[i])) && !math.IsInf(float64(values[i]), 0) {
			res[i] = values[i]
		}
	}
	return res
}

func luminance(c [3]float32) float32 {
	return c[0]*0.2126 + c[1]*0.7152 + c[2]*0.0722
}
