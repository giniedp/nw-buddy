package gltf

func (d *Document) Clean() {
	for _, tex := range d.Textures {
		tex.Extras = ExtrasDelete(tex.Extras, ExtraKeySource)
		tex.Extras = ExtrasDelete(tex.Extras, ExtraKeyRefID)
	}
	for _, mat := range d.Materials {
		mat.Extras = ExtrasDelete(mat.Extras, ExtraKeyRefID)
	}
	for _, it := range d.Nodes {
		it.Extras = ExtrasDelete(it.Extras, ExtraKeyRefID)
	}
	for _, it := range d.Meshes {
		it.Extras = ExtrasDelete(it.Extras, ExtraKeyRefID)
		for _, prim := range it.Primitives {
			prim.Extras = ExtrasDelete(prim.Extras, ExtraKeyRefID)
		}
	}
}
