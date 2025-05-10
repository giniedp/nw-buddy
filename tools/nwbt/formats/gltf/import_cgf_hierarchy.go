package gltf

import (
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
	"slices"
	"strings"

	"github.com/qmuntal/gltf"
)

func (d *Document) ImportCgfHierarchy(cgfile *cgf.File, handleObject func(node *gltf.Node, chunk cgf.Chunker, name string)) []*gltf.Node {
	rootNodes := make([]*gltf.Node, 0)
	nodeMap := newIdToNodeMap(d)
	for _, chunk := range cgf.SelectChunks[cgf.ChunkNode](cgfile) {
		if strings.Contains(chunk.Name, "$lod") {
			continue
		}

		node, nodeIndex := nodeMap.lookup(chunk.ChunkHeader.Id)
		if !mat4.IsIdentity(chunk.Transform) {
			node.Matrix = mat4.ToFloat64(math.CryToGltfMat4(mat4.Transpose(chunk.Transform)))
		}
		if chunk.ParentId == -1 {
			rootNodes = append(rootNodes, node)
		} else {
			parent, _ := nodeMap.lookup(chunk.ParentId)
			parent.Children = append(parent.Children, nodeIndex)
		}
		if object, ok := cgf.FindChunk[cgf.Chunker](cgfile, chunk.ObjectId); ok {
			handleObject(node, object, chunk.Name)
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
