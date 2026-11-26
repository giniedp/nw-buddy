package gltf

import (
	"nw-buddy/tools/formats/gltf/extensions"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils"
	"slices"

	"github.com/qmuntal/gltf"
)

// simply translates the xml materials into a gltf structure by keeping all parameters (EXT_nw_material)
func (doc *Document) augmentMaterialWithOriginal(gltfMtl *gltf.Material, cgfMat *mtl.Material, options ImportCgfMaterialsOptions) {
	nwMtl := extensions.EnsureNwMaterial(gltfMtl)
	attrs := cgfMat.MaterialAttrs
	nwMtl.Attributes = &attrs
	nwMtl.Params = cgfMat.Params
	nwMtl.VertexDeform = cgfMat.VertexDeform
	nwMtl.Textures = nil

	// the smoothness slots as the engine binds them: the attached alpha of a _ddna normal map, also when unnamed
	for _, nwTex := range mtl.WithNormalMapSmoothness(cgfMat.Textures.Texture) {
		// TODO: smoothness is stored in the attached alpha of the normal map (_ddna.dds.a) and the engine binds
		// that alpha for the smoothness slots. Reading it here breaks alpha tested materials in the viewer
		// (meshes with AlphaTest render invisible), so this is disabled until it is handled elsewhere.
		readAlpha := nwTex.Map == mtl.MtlMap_Smoothness || nwTex.Map == mtl.MtlMap_SecondSmoothness || nwTex.Map == mtl.MtlMap_5_Smoothness
		gltfTex := doc.LoadOrStoreMtlTexture(&nwTex, readAlpha)
		// gltfTex := doc.LoadOrStoreMtlTexture(&nwTex)
		gltfTexExt := gltf.Extensions{}
		gltfTexExt[extensions.EXT_nw_tex] = nwTex
		nwMtl.Textures = append(nwMtl.Textures, &gltf.TextureInfo{
			Index:      slices.Index(doc.Textures, gltfTex),
			Extensions: gltfTexExt,
		})
	}
	doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, extensions.EXT_nw_material, extensions.EXT_nw_tex)
}
