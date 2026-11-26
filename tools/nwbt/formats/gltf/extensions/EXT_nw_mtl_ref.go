package extensions

const (
	EXT_nw_tex     = "EXT_nw_tex"     // new world texture attributes
	EXT_nw_mtl_ref = "EXT_nw_mtl_ref" // reference to the source material file and sub material
)

// ExtNwMtlRef identifies the material by its source, so clients can load and share it by ID
// instead of using the material embedded in the document.
// `<File>.glb` serves all sub materials of the file, `Index` is the material index in that document
type ExtNwMtlRef struct {
	File  string `json:"file"`
	Index int    `json:"index"`
}
