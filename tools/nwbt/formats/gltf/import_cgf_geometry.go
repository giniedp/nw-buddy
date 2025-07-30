package gltf

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/mtl"

	"github.com/qmuntal/gltf"
)

// type LoadGeometryFunc func(asset string) (*cgf.File, error)
// type LoadMaterialFunc func(asset string) ([]mtl.Material, error)
type LoadAssetFunc func(asset importer.GeometryAsset) (*cgf.File, []byte, []mtl.Material)
type MaterialLookup struct {
	List     []*gltf.Material
	Fallback *gltf.Material
}

func (c MaterialLookup) Get(index int) *gltf.Material {
	result := c.Fallback
	if index >= 0 && index < len(c.List) {
		result = c.List[index]
	}
	return result
}

func (c *Document) ImportGeometry(asset importer.GeometryAsset, load LoadAssetFunc) {
	modelRefId := hashString(fmt.Sprintf("%s#%s", asset.GeometryFile, asset.MaterialFile))
	if asset.OverrideMaterialIndex != nil {
		modelRefId = fmt.Sprintf("%s#%d", modelRefId, *asset.OverrideMaterialIndex)
	}
	if reference, _ := c.FindNodeByRefID(modelRefId); reference != nil {
		node, _ := c.CopyNode(reference)
		c.AddToSceneWithTransform(c.DefaultScene(), node, asset.Transform)
		return
	}

	model, heap, materials := load(asset)
	if model == nil {
		return
	}

	var skin *int
	var err error
	if !asset.SkipSkin {
		bones := cgf.SelectChunks[cgf.ChunkCompiledBones](model)
		if len(bones) > 0 {
			skin, err = c.ImportCgfSkin(model, bones[0])
			if err != nil {
				slog.Warn("cgf skin not imported", "file", model.Source, "err", err)
			}
		}
	}

	if asset.SkipGeometry {
		return
	}

	gltfMaterials := make([]*gltf.Material, 0)
	for _, mtl := range materials {
		gltfMtl := c.FindOrAddMaterial(mtl)
		gltfMaterials = append(gltfMaterials, gltfMtl)
	}
	materialLookup := MaterialLookup{
		List: gltfMaterials,
	}
	if len(gltfMaterials) > 0 {
		materialLookup.Fallback = gltfMaterials[0]
	}
	if asset.OverrideMaterialIndex != nil {
		materialLookup.Fallback = gltfMaterials[*asset.OverrideMaterialIndex]
		materialLookup.List = []*gltf.Material{materialLookup.Fallback}
	}

	rootNodes := c.ImportCgfHierarchy(model, func(node *gltf.Node, chunk cgf.Chunker, name string) {
		switch meshChunk := chunk.(type) {
		case cgf.ChunkMesh:
			node.Name = name
			node.Mesh, _ = c.ImportCgfMesh(name, meshChunk, model, heap, materialLookup)
			node.Skin = skin
			node.Extras = ExtrasStore(node.Extras, ExtraKeyName, name)
		}
	})
	if len(rootNodes) == 0 {
		return
	}

	rootNode := rootNodes[0]
	if len(rootNodes) > 1 {
		parent, _ := c.NewNode()
		c.NodeAddChild(parent, rootNodes...)
		rootNode = parent
	}
	rootNode.Name = asset.Name
	rootNode.Extras = ExtrasStore(rootNode.Extras, ExtraKeyRefID, modelRefId)
	rootNode.Extras = ExtrasStore(rootNode.Extras, ExtraKeyName, asset.Name)
	c.AddToSceneWithTransform(c.DefaultScene(), rootNode, asset.Transform)
}

func hashString(s string) string {
	sum := md5.Sum([]byte(s))
	return hex.EncodeToString(sum[:])
}
