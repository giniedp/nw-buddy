package gltf

import (
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/math/mat4"
	"regexp"
	"slices"
	"strconv"
	"strings"

	"github.com/qmuntal/gltf"
)

type HandleObjectFunc func(node *gltf.Node, chunk cgf.Chunker, name string, lod int)

var lodRegex = regexp.MustCompile(`\$lod(\d+)`)

func (doc *Document) ImportCgfHierarchy(cgfile *cgf.File, handleObject HandleObjectFunc) []*gltf.Node {
	base := doc.Options.Base

	nodes := cgf.SelectChunks[cgf.ChunkNode](cgfile)
	// a skin keeps only the node translation, as its mesh offset (see skinMeshOffset)
	singleMesh := isSingleMeshObject(cgfile, nodes) || hasCompiledBones(cgfile)

	rootNodes := make([]*gltf.Node, 0)
	nodeMap := newIdToNodeMap(doc)
	for _, chunk := range nodes {

		isLod := strings.Contains(chunk.Name, "$lod")
		isHelper := isHelperNode(chunk.Name)
		lod := 0

		shouldSkip := false
		if isLod && doc.Options.SkipLod {
			shouldSkip = true
		}
		if !isLod && isHelper && doc.Options.SkipHelper {
			shouldSkip = true
		}

		if isLod {
			lod, _ = strconv.Atoi(lodRegex.FindStringSubmatch(chunk.Name)[1])
		}

		node, nodeIndex := nodeMap.lookup(chunk.ChunkHeader.Id)
		if !singleMesh && !mat4.IsIdentity(chunk.Transform) {
			// the node tm has the same layout as glTF (column major, translation at 12-14), see CGFLoader.cpp SetFromVectors
			node.Matrix = mat4.ToFloat64(base.Mat4(chunk.Transform))
		}

		if chunk.ParentId == -1 {
			rootNodes = append(rootNodes, node)
		} else {
			parent, _ := nodeMap.lookup(chunk.ParentId)
			parent.Children = append(parent.Children, nodeIndex)
		}
		if shouldSkip {
			continue
		}

		if object, ok := cgf.FindChunk[cgf.Chunker](cgfile, chunk.ObjectId); ok {
			handleObject(node, object, chunk.Name, lod)
		}
	}
	return rootNodes
}

// isHelperNode reports nodes that are not rendered (same rules as nw-viewer isRenderNode, src/formats/cgf/geometry.ts):
// helpers (`$…`), physics proxies by name like the engine CGFLoader (`PhysicsProxy`, `$collision`, `$physics_proxy`)
// and merged collision meshes of old files (`Merged_phys`). `$lodN_…` nodes are handled as LODs by the caller.
func isHelperNode(name string) bool {
	lower := strings.ToLower(name)
	if strings.HasPrefix(lower, "$") {
		return true
	}
	return strings.Contains(lower, "physicsproxy") ||
		strings.Contains(lower, "$collision") ||
		strings.Contains(lower, "$physics") ||
		strings.HasSuffix(lower, "_phys")
}

const cgfExportMergeAllNodes = 0x0001

// isSingleMeshObject reports whether the engine loads the file as one mesh and ignores the node transforms
// (CStatObj::LoadCGF): all nodes merged (export flag), or at most one rendered mesh node and no `$joint`.
// E.g. bananaplant: `render_meshes` is rotated to Y-up, its vertices are already Z-up.
func isSingleMeshObject(cgfile *cgf.File, nodes []cgf.ChunkNode) bool {
	for _, flags := range cgf.SelectChunks[cgf.ChunkExportFlags](cgfile) {
		if flags.Flags&cgfExportMergeAllNodes != 0 {
			return true
		}
	}
	meshNodes := 0
	for _, node := range nodes {
		if strings.HasPrefix(node.Name, "$joint") {
			return false
		}
		if isHelperNode(node.Name) || strings.Contains(node.Name, "$lod") {
			continue
		}
		if _, ok := cgf.FindChunk[cgf.ChunkMesh](cgfile, node.ObjectId); ok {
			meshNodes++
		}
	}
	return meshNodes <= 1
}

// hasCompiledBones reports a skin (`.skin`): the file has a CompiledBones chunk
func hasCompiledBones(cgfile *cgf.File) bool {
	return len(cgf.SelectChunks[cgf.ChunkCompiledBones](cgfile)) > 0
}

// skinMeshOffset is the render mesh offset of a skinned mesh: the world translation of the node that references it.
// A compiled skin stores its vertices relative to that translation (a pivot for 16 bit positions). The engine adds it
// to every vertex before skinning and ignores the node rotation (CLoaderCGF::ProcessSkinning,
// CModelMesh::m_vRenderMeshOffset). Without it the vertices of e.g. lostsoulharvester.skin lie 1.8 m off their joints.
func skinMeshOffset(cgfile *cgf.File, meshId int32) [3]float32 {
	nodes := cgf.SelectChunks[cgf.ChunkNode](cgfile)
	byId := make(map[int32]cgf.ChunkNode, len(nodes))
	for _, node := range nodes {
		byId[node.Id] = node
	}
	for _, node := range nodes {
		if node.ObjectId != meshId {
			continue
		}
		// world = parent world × local: the parent's rotation applies to the local translation
		t := [3]float32{node.Transform[12], node.Transform[13], node.Transform[14]}
		for depth, parent := 0, node.ParentId; depth < len(nodes); depth++ {
			p, ok := byId[parent]
			if !ok || p.Id == node.Id {
				break
			}
			m := p.Transform
			t = [3]float32{
				m[0]*t[0] + m[4]*t[1] + m[8]*t[2] + m[12],
				m[1]*t[0] + m[5]*t[1] + m[9]*t[2] + m[13],
				m[2]*t[0] + m[6]*t[1] + m[10]*t[2] + m[14],
			}
			parent = p.ParentId
		}
		return t
	}
	return [3]float32{}
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
