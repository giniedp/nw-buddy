package gltf

import "github.com/qmuntal/gltf"

func (doc *Document) ImportMaterials(file string) {
	materials, _ := doc.Options.LoadMaterials(file)

	for i, mtl := range materials {
		doc.FindOrAddMaterialFromFile(mtl, file, i)
	}

}

// ImportMaterialCollection adds all materials of the file in collection order without merging equal materials,
// so the index of a material in the document equals its index in the collection.
// Must be called before other materials are added to the document.
func (doc *Document) ImportMaterialCollection(file string) {
	materials, _ := doc.Options.LoadMaterials(file)

	for i, mtl := range materials {
		refId, _ := mtl.CalculateHash()
		gltfMtl := &gltf.Material{}
		gltfMtl.Name = mtl.Name
		gltfMtl.Extras = map[string]any{"refId": refId, "mtl": mtl}
		gltfMtl.Extras = ExtrasStore(gltfMtl.Extras, ExtraKeyMtlRef, newMtlRef(file, i))
		doc.Materials = append(doc.Materials, gltfMtl)
	}
}
