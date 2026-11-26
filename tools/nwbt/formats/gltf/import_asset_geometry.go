package gltf

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils/math"

	"github.com/qmuntal/gltf"
)

type LoadGeometryFunc func(asset importer.GeometryAsset) (*cgf.File, []byte, []mtl.Material)
type LoadAnimationFunc func(asset importer.AnimationAsset) *cgf.File
type LoadMaterialsFunc func(materialFile string) ([]mtl.Material, error)

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

type ImportOptions struct {
	Simplify        bool              // simple geometry data, position and texture only, no normals, tangents, colors, etc.
	Quantize        bool              // normals and tangents as snorm16 (KHR_mesh_quantization, not supported by all viewers)
	Base            math.Base         // base transformation for 3D models, e.g. to convert between y-up and z-up coordinate systems
	LoadGeometry    LoadGeometryFunc  // for geometry + material loading (2 files)
	LoadAnimation   LoadAnimationFunc // additional animation loading (1 file)
	LoadMaterials   LoadMaterialsFunc // special case for single material file loading
	SkipLod         bool              // skip LOD nodes, e.g. nodes with $lod in their name
	SkipHelper      bool              // skip helper nodes, e.g. nodes with $physics (or leading $) in their name
	SkipShadowProxy bool              // skip geometries that have shadow proxy materials assigned
	KeepNoDraw      bool              // keep subsets with NoDraw materials (skipped by default, the game does not draw them)
	SkipUnlinkedMtl bool              // skip materials that are not linked to any geometry
}

func (doc *Document) ImportAssetGeometry(asset importer.GeometryAsset) {
	modelRefId := hashString(fmt.Sprintf("%s#%s", asset.GeometryFile, asset.MaterialFile))
	if len(asset.MaterialParams) > 0 {
		modelRefId = hashString(fmt.Sprintf("%s#%v", modelRefId, asset.MaterialParams))
	}
	if asset.OverrideMaterialIndex != nil {
		modelRefId = fmt.Sprintf("%s#%d", modelRefId, *asset.OverrideMaterialIndex)
	}
	if asset.OvercoatFile != "" {
		modelRefId = hashString(fmt.Sprintf("%s#overcoat#%s", modelRefId, asset.OvercoatFile))
	}
	var joint *gltf.Node
	if asset.Joint != "" {
		if joint = doc.FindJoint(asset.Joint); joint == nil {
			slog.Warn("joint not found", "joint", asset.Joint, "model", asset.GeometryFile)
			return
		}
	}
	place := func(node *gltf.Node) {
		if joint != nil {
			doc.AddToJoint(joint, node, asset.Transform)
		} else {
			doc.AddToSceneWithTransform(doc.DefaultScene(), node, asset.Transform)
		}
	}
	if reference, _ := doc.FindNodeByRefID(modelRefId); reference != nil {
		node, _ := doc.CopyNode(reference)
		place(node)
		return
	}

	cgfFile, heapData, materials := doc.Options.LoadGeometry(asset)
	if cgfFile == nil {
		return
	}

	var skinIndex *int
	var err error
	if !asset.SkipSkin {
		bones := cgf.SelectChunks[cgf.ChunkCompiledBones](cgfFile)
		if len(bones) > 0 {
			skinIndex, err = doc.ImportCgfSkin(cgfFile, bones[0], doc.Options.Base)
			if err != nil {
				slog.Warn("cgf skin not imported", "file", cgfFile.Source, "err", err)
			}
		}
	}

	if asset.SkipGeometry {
		return
	}

	gltfMaterials := make([]*gltf.Material, 0)
	for i, mtl := range materials {
		if len(asset.MaterialParams) > 0 {
			// a copy: the material hash includes the params, the overridden material is one of its own
			mtl.Params = mtl.Params.WithOverrides(asset.MaterialParams)
		}
		gltfMtl := doc.FindOrAddMaterialFromFile(mtl, asset.MaterialFile, i)
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

	overcoatLookup := doc.overcoatLookup(asset.OvercoatFile)

	rootNodes := doc.ImportCgfHierarchy(cgfFile, func(node *gltf.Node, chunk cgf.Chunker, name string, lod int) {
		switch meshChunk := chunk.(type) {
		case cgf.ChunkMesh:
			node.Name = name
			_, node.Mesh = doc.ImportCgfMesh(name, meshChunk, cgfFile, heapData, materialLookup, overcoatLookup)
			node.Skin = skinIndex
			node.Extras = ExtrasStore(node.Extras, ExtraKeyName, name)
			node.Extras = ExtrasStore(node.Extras, ExtraKeyLOD, lod)
		}
	})
	if len(rootNodes) == 0 {
		return
	}

	rootNode := rootNodes[0]
	if len(rootNodes) > 1 {
		parent, _ := doc.NewNode()
		doc.NodeAddChild(parent, rootNodes...)
		rootNode = parent
	}
	rootNode.Name = asset.Name
	rootNode.Extras = ExtrasStore(rootNode.Extras, ExtraKeyRefID, modelRefId)
	rootNode.Extras = ExtrasStore(rootNode.Extras, ExtraKeyName, asset.Name)
	for key, value := range asset.Extra {
		rootNode.Extras = ExtrasStore(rootNode.Extras, key, value)
	}
	place(rootNode)
}

// overcoatLookup adds the materials of an overcoat file, empty without one
func (doc *Document) overcoatLookup(file string) MaterialLookup {
	result := MaterialLookup{}
	if file == "" {
		return result
	}
	materials, err := doc.Options.LoadMaterials(file)
	if err != nil {
		slog.Warn("overcoat not loaded", "file", file, "err", err)
		return result
	}
	for i, material := range materials {
		result.List = append(result.List, doc.FindOrAddMaterialFromFile(material, file, i))
	}
	if len(result.List) > 0 {
		result.Fallback = result.List[0]
	}
	return result
}

func hashString(s string) string {
	sum := md5.Sum([]byte(s))
	return hex.EncodeToString(sum[:])
}
