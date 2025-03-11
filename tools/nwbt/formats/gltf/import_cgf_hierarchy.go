package gltf

import (
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/utils/maps"
	"slices"

	"github.com/qmuntal/gltf"
)

func (d *Document) ImportCgfHierarchy(file *cgf.File, handleObject func(node *gltf.Node, chunk cgf.Chunker)) []*gltf.Node {
	rootNodes := make([]*gltf.Node, 0)
	nodeMap := newIdToNodeMap(d)
	for _, chunk := range cgf.SelectChunks[cgf.ChunkNode](file) {
		// TODO:
		// const isLOD = chunk.name.match(/\$lod\d+/i)
		// if (isLOD && chunk.objectId) {
		//   console.log('LOD', chunk.name, chunk.objectId)
		//   continue
		// }
		node, nodeIndex := nodeMap.lookup(chunk.ChunkHeader.Id)
		if !Mat4IsIdentity(chunk.Transform) {
			node.Matrix = Mat4ToFloat64(CryToGltfMat4(Mat4Transpose(chunk.Transform)))
		}
		if chunk.ParentId == -1 {
			rootNodes = append(rootNodes, node)
		} else {
			parent, _ := nodeMap.lookup(chunk.ParentId)
			parent.Children = append(parent.Children, nodeIndex)
		}
		if object, ok := cgf.FindChunk[cgf.Chunker](file, chunk.ObjectId); ok {
			handleObject(node, object)
		}
	}
	return rootNodes
}

type idToNodeMap struct {
	converter *Document
	idToNode  *maps.Map[int32, *gltf.Node]
}

func newIdToNodeMap(converter *Document) *idToNodeMap {
	return &idToNodeMap{
		converter: converter,
		idToNode:  maps.NewMap[int32, *gltf.Node](),
	}
}

func (n *idToNodeMap) lookup(id int32) (*gltf.Node, int) {
	node, loaded := n.idToNode.LoadOrStore(id, &gltf.Node{})
	if !loaded {
		n.converter.AppendNode(node)
	}
	return node, slices.Index(n.converter.Document.Nodes, node)
}
