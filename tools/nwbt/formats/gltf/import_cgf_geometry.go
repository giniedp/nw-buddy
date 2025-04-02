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

func (c *Document) ImportGeometry(asset importer.GeometryAsset, load func(asset importer.GeometryAsset) (*cgf.File, []mtl.Material)) {
	modelRefId := hashString(fmt.Sprintf("%s#%s", asset.GeometryFile, asset.MaterialFile))
	if reference, _ := c.FindNodeByRefID(modelRefId); reference != nil {
		node, _ := c.CopyNode(reference)
		c.AddToSceneWithTransform(c.DefaultScene(), node, asset.Transform)
		return
	}

	model, materials := load(asset)
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

	rootNodes := c.ImportCgfHierarchy(model, func(node *gltf.Node, chunk cgf.Chunker) {
		switch meshChunk := chunk.(type) {
		case cgf.ChunkMesh:
			node.Name = asset.Name
			node.Mesh, _ = c.ImportCgfMesh(meshChunk, model, gltfMaterials)
			node.Skin = skin
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
	rootNode.Extras = ExtrasStore(rootNode.Extras, ExtraKeyRefID, modelRefId)
	c.AddToSceneWithTransform(c.DefaultScene(), rootNode, asset.Transform)
}

func hashString(s string) string {
	sum := md5.Sum([]byte(s))
	return hex.EncodeToString(sum[:])
}
