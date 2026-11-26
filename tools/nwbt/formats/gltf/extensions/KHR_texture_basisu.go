package extensions

// KHR_texture_basisu: a texture's source is a KTX2 image with Basis Universal data. The core `source` may hold a
// png/jpeg fallback, or be omitted when the extension is required.
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_basisu
const KHR_texture_basisu = "KHR_texture_basisu"

type KHRTextureBasisu struct {
	Source int `json:"source"`
}
