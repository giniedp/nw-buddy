package gltf

// CleanExtras removes all temporary extras that are not needed for the output glTF file.
func (doc *Document) CleanExtras() {
	for _, tex := range doc.Textures {
		tex.Extras = ExtrasDelete(tex.Extras, ExtraKeySource)
		tex.Extras = ExtrasDelete(tex.Extras, ExtraKeyRefID)
	}
	for _, mat := range doc.Materials {
		mat.Extras = ExtrasDelete(mat.Extras, ExtraKeyRefID)
	}
	for _, it := range doc.Nodes {
		it.Extras = ExtrasDelete(it.Extras, ExtraKeyRefID)
	}
	for _, it := range doc.Meshes {
		it.Extras = ExtrasDelete(it.Extras, ExtraKeyRefID)
		for _, prim := range it.Primitives {
			prim.Extras = ExtrasDelete(prim.Extras, ExtraKeyRefID)
		}
	}
}
