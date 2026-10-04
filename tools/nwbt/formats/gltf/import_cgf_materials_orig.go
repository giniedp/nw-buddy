package gltf

import (
	"nw-buddy/tools/formats/gltf/extensions"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils"
	"slices"

	"github.com/qmuntal/gltf"
)

// simply translates the xml materials into a gltf structure by keeping all parameters.
func (doc *Document) augmentMaterialWithOriginal(gltfMtl *gltf.Material, cgfMat *mtl.Material, options ImportCgfMaterialsOptions) {
	nwMtl := extensions.ExtNwMtl{}
	nwMtl.Attributes = cgfMat.MaterialAttrs
	nwMtl.Params = cgfMat.Params
	nwMtl.VertexDeform = cgfMat.VertexDeform

	for _, nwTex := range cgfMat.Textures.Texture {
		// smoothness is stored in the attached alpha of the normal map (_ddna.dds.a),
		// the engine binds that alpha for the smoothness slots
		readAlpha := nwTex.Map == mtl.MtlMap_Smoothness || nwTex.Map == mtl.MtlMap_SecondSmoothness || nwTex.Map == mtl.MtlMap_5_Smoothness
		gltfTex := doc.LoadOrStoreMtlTexture(&nwTex, readAlpha)
		gltfTexExt := gltf.Extensions{}
		gltfTexExt[extensions.EXT_nw_tex] = nwTex
		nwMtl.Textures = append(nwMtl.Textures, &gltf.TextureInfo{
			Index:      slices.Index(doc.Textures, gltfTex),
			Extensions: gltfTexExt,
		})
	}
	if gltfMtl.Extensions == nil {
		gltfMtl.Extensions = gltf.Extensions{}
	}
	gltfMtl.Extensions[extensions.EXT_nw_mtl] = nwMtl
	doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, extensions.EXT_nw_mtl, extensions.EXT_nw_tex)
}
