package gltf

import (
	"nw-buddy/tools/formats/gltf/extensions"
	"nw-buddy/tools/utils"

	"github.com/qmuntal/gltf"
)

// ApplyTextureBasisu references the KTX2 images of the textures through KHR_texture_basisu, as the glTF spec wants
// it: the core `source` of a texture only takes png and jpeg. The extension is required, there is no fallback image.
func (doc *Document) ApplyTextureBasisu() {
	doc.applyTextureExtension("image/ktx2", extensions.KHR_texture_basisu, func(source int) any {
		return extensions.KHRTextureBasisu{Source: source}
	})
}

// ApplyTextureWebp references the WebP images of the textures through EXT_texture_webp, like ApplyTextureBasisu
func (doc *Document) ApplyTextureWebp() {
	doc.applyTextureExtension("image/webp", extensions.EXT_texture_webp, func(source int) any {
		return extensions.EXTTextureWebp{Source: source}
	})
}

// applyTextureExtension moves the source of the textures with an image of the mime type into the (required) texture
// extension
func (doc *Document) applyTextureExtension(mimeType string, name string, extension func(source int) any) {
	applied := false
	for _, texture := range doc.Textures {
		if texture.Source == nil {
			continue
		}
		image := doc.Images[*texture.Source]
		if image == nil || image.MimeType != mimeType {
			continue
		}
		if texture.Extensions == nil {
			texture.Extensions = gltf.Extensions{}
		}
		texture.Extensions[name] = extension(*texture.Source)
		texture.Source = nil
		applied = true
	}
	if applied {
		doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, name)
		doc.ExtensionsRequired = utils.AppendUniq(doc.ExtensionsRequired, name)
	}
}
