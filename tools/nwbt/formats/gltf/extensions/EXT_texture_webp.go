package extensions

// EXT_texture_webp: a texture's source is a WebP image. The core `source` may hold a png/jpeg fallback, or be omitted
// when the extension is required.
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_webp
const EXT_texture_webp = "EXT_texture_webp"

type EXTTextureWebp struct {
	Source int `json:"source"`
}
