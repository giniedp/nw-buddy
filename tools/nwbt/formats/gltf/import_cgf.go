package gltf

import (
	"log/slog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/mtl"
	"slices"

	"github.com/qmuntal/gltf"
)

func (c *Converter) ImportCgf(cgfile *cgf.File, materials []mtl.Material) {

	var skin *int
	var err error
	if !c.IgnoreSkin {
		bones := cgf.SelectChunks[cgf.ChunkCompiledBones](cgfile)
		if len(bones) > 0 {
			skin, err = c.ImportCgfSkin(cgfile, bones[0])
			if err != nil {
				slog.Warn("cgf skin not imported", "file", cgfile.Source, "err", err)
			}
		}
	}

	if c.IgnoreGeometry {
		return
	}

	gltfMaterials := make([]*gltf.Material, 0)
	for _, mtl := range materials {
		gltfMtl := c.FindOrAddMaterial(mtl)
		gltfMaterials = append(gltfMaterials, gltfMtl)
	}

	rootNodes := c.ImportCgfHierarchy(cgfile, func(node *gltf.Node, chunk cgf.Chunker) {
		switch meshChunk := chunk.(type) {
		case cgf.ChunkMesh:
			node.Mesh, _ = c.ImportCgfMesh(meshChunk, cgfile, gltfMaterials)
			node.Skin = skin
		}
	})

	scene := c.DefaultScene()
	for _, rootNode := range rootNodes {
		scene.Nodes = append(scene.Nodes, slices.Index(c.Doc.Nodes, rootNode))
	}
}
