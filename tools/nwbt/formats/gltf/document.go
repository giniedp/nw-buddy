package gltf

import (
	"fmt"
	"io"
	"nw-buddy/tools/formats/gltf/extensions"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils/math/mat4"
	"os"
	"path"
	"slices"
	"strings"
	"sync"

	"maps"

	"github.com/qmuntal/gltf"
)

const (
	ExtraKeyRefID        = "refId"
	ExtraKeyControllerID = "controllerId"
	ExtraKeyLimbID       = "limbId"
	ExtraKeySource       = "source"
	ExtraKeyMtlRef       = "mtlRef"
	ExtraKeyName         = "name"
	ExtraKeyInverse      = "inverse"
	ExtraKeyAlpha        = "alpha"
	ExtraKeyLOD          = "lod"
	ExtraKeyClip         = "clip"
	// the game does not draw the node by default (a character attachment with FLAGS_ATTACH_HIDE_ATTACHMENT)
	ExtraKeyHidden = "hidden"
	// scene extras: the bone attachments of a character file (name, joint, position, rotation x,y,z,w)
	ExtraKeySockets = "sockets"
)

type Document struct {
	*gltf.Document
	TargetFile  string
	ImageLoader image.Loader
	ImageLinker ImageLinker
	// BakeImageLoader loads the png inputs of the texture bakes when ImageLoader converts to another format (DDS).
	// Nil: the bakes use ImageLoader.
	BakeImageLoader image.Loader
	Options         ImportOptions
	// AsyncImages loads (converts) and writes linked images in the background, the glTF waits for them on Encode.
	// The images of a model convert in parallel, bounded process wide (see imageSlots). Linked mode only.
	AsyncImages bool
	// LinkedImages shares the linked images with other documents of the same output directory (optional)
	LinkedImages *LinkedImages

	// converted cgf mesh chunks, shared by all subsets and nodes that reference them
	geometries map[meshGeometryKey]*meshGeometry
	// background image loads of AsyncImages
	pendingImages sync.WaitGroup
}

func NewDocument() *Document {
	return &Document{
		Document: gltf.NewDocument(),
	}
}

func (doc *Document) Save() error {
	file := doc.TargetFile
	if file == "" {
		return fmt.Errorf("no target file specified")
	}
	outDir := path.Dir(file)
	if err := os.MkdirAll(outDir, os.ModePerm); err != nil {
		return err
	}

	f, err := os.Create(file)
	if err != nil {
		return err
	}
	defer f.Close()
	return doc.Encode(f, path.Ext(file) == ".glb")
}

func (doc *Document) Encode(f io.Writer, binary bool) error {
	// the uris of background images are set when they are written
	doc.WaitImages()
	e := gltf.NewEncoder(f)
	e.SetJSONIndent("", "\t")
	e.AsBinary = binary
	return e.Encode(doc.Document)
}

func (doc *Document) DefaultScene() *gltf.Scene {
	if doc.Scene == nil {
		doc.Scene = doc.AppendScene(&gltf.Scene{})
	}
	return doc.Scenes[*doc.Scene]
}

func (doc *Document) AppendScene(scene *gltf.Scene) *int {
	doc.Document.Scenes = append(doc.Document.Scenes, scene)
	return gltf.Index(slices.Index(doc.Document.Scenes, scene))
}

func (doc *Document) AppendMesh(mesh *gltf.Mesh) *int {
	doc.Document.Meshes = append(doc.Document.Meshes, mesh)
	return gltf.Index(slices.Index(doc.Document.Meshes, mesh))
}

func (doc *Document) AppendNode(node *gltf.Node) int {
	doc.Document.Nodes = append(doc.Document.Nodes, node)
	return slices.Index(doc.Document.Nodes, node)
}

func (doc *Document) NodeAddChild(parent *gltf.Node, child ...*gltf.Node) {
	for _, c := range child {
		parent.Children = append(parent.Children, slices.Index(doc.Nodes, c))
	}
}

func (doc *Document) NodeHasChild(parent *gltf.Node, child *gltf.Node) bool {
	return slices.Contains(parent.Children, doc.NodeIndex(child))
}

func (doc *Document) NewNode() (*gltf.Node, int) {
	node := &gltf.Node{}
	index := doc.AppendNode(node)
	return node, index
}

func (doc *Document) NodeIndex(node *gltf.Node) int {
	return slices.Index(doc.Nodes, node)
}

func (doc *Document) NodeParent(node *gltf.Node) *gltf.Node {
	index := doc.NodeIndex(node)
	for _, n := range doc.Nodes {
		if slices.Index(n.Children, index) != -1 {
			return n
		}
	}
	return nil
}

func (doc *Document) FindNodeByRefID(instanceRef string) (*gltf.Node, int) {
	for i, node := range doc.Nodes {
		if ref, ok := ExtrasLoad[string](node.Extras, ExtraKeyRefID); ok && ref == instanceRef {
			return node, i
		}
	}
	return nil, -1
}

func (doc *Document) FindNodeByControllerId(controllerId uint32) (*gltf.Node, int) {
	for i, node := range doc.Nodes {
		if ref, ok := ExtrasLoad[uint32](node.Extras, ExtraKeyControllerID); ok && ref == controllerId {
			return node, i
		}
	}
	return nil, -1
}

func (doc *Document) AddToSceneWithTransform(scene *gltf.Scene, node *gltf.Node, transform [16]float32) {
	if mat4.IsIdentity(transform) && doc.NodeParent(node) == nil {
		// no wrapper for identity: keeps skinned mesh nodes at the root (glTF ignores parent transforms of skinned meshes)
		doc.AddToScene(scene, node)
		return
	}
	parent, _ := doc.NewNode()
	parent.Matrix = mat4.ToFloat64(transform)
	doc.NodeAddChild(parent, node)
	doc.AddToScene(scene, parent)
}

// AddToJoint attaches a node to a joint, with a transform relative to it
func (doc *Document) AddToJoint(joint *gltf.Node, node *gltf.Node, transform [16]float32) {
	holder, _ := doc.NewNode()
	holder.Name = node.Name
	holder.Matrix = mat4.ToFloat64(transform)
	doc.NodeAddChild(holder, node)
	doc.NodeAddChild(joint, holder)
}

// FindJoint returns the joint of a name (else ignoring case) that deforms a mesh. The first one wins: without MergeSkins
// each skinned part has its own skeleton. Call it after MergeSkins.
func (doc *Document) FindJoint(name string) *gltf.Node {
	for _, equal := range []func(a, b string) bool{func(a, b string) bool { return a == b }, strings.EqualFold} {
		for _, node := range doc.Nodes {
			if node.Mesh == nil || node.Skin == nil {
				continue
			}
			for joint := range doc.EachSkinNode(doc.Skins[*node.Skin]) {
				if equal(joint.Name, name) {
					return joint
				}
			}
		}
	}
	return nil
}

func (doc *Document) AddToScene(scene *gltf.Scene, node *gltf.Node) {
	scene.Nodes = append(scene.Nodes, doc.NodeIndex(node))
}

func (doc *Document) CopyNode(node *gltf.Node) (*gltf.Node, int) {
	copy, index := doc.NewNode()

	copy.Camera = node.Camera
	copy.Matrix = node.Matrix
	copy.Mesh = node.Mesh
	copy.Skin = node.Skin
	copy.Rotation = node.Rotation
	copy.Scale = node.Scale
	copy.Translation = node.Translation
	copy.Name = node.Name
	copy.Weights = node.Weights

	for _, child := range node.Children {
		_, childIndex := doc.CopyNode(doc.Nodes[child])
		copy.Children = append(copy.Children, childIndex)
	}
	return copy, index
}

func (doc *Document) FindPrimitiveByRef(refId string) *gltf.Primitive {
	if refId == "" {
		return nil
	}
	for _, mesh := range doc.Meshes {
		for _, prim := range mesh.Primitives {
			if ref, ok := ExtrasLoad[string](prim.Extras, ExtraKeyRefID); ok && ref == refId {
				return prim
			}
		}
	}
	return nil
}

func (doc *Document) CopyPrimitive(prim *gltf.Primitive) *gltf.Primitive {
	copy := &gltf.Primitive{}
	copy.Attributes = copyPrimitiveAttributes(prim.Attributes)
	copy.Indices = prim.Indices
	copy.Material = prim.Material
	copy.Mode = prim.Mode
	copy.Targets = make([]gltf.PrimitiveAttributes, len(prim.Targets))
	for i, target := range prim.Targets {
		copy.Targets[i] = copyPrimitiveAttributes(target)
	}
	return copy
}

func copyPrimitiveAttributes(attrs gltf.PrimitiveAttributes) gltf.PrimitiveAttributes {
	copy := make(gltf.PrimitiveAttributes)
	maps.Copy(copy, attrs)
	return copy
}

func (doc *Document) FindMaterialByRef(ref string) *gltf.Material {
	index := slices.IndexFunc(doc.Materials, func(it *gltf.Material) bool {
		if lookup, ok := it.Extras.(map[string]any); ok {
			if refId, ok := lookup["refId"].(string); ok {
				return refId == ref
			}
		}
		return false
	})
	if index == -1 {
		return nil
	}
	return doc.Materials[index]
}

func (doc *Document) FindOrAddMaterial(material mtl.Material) *gltf.Material {
	refId, _ := material.CalculateHash()
	gltfMtl := doc.FindMaterialByRef(refId)
	if gltfMtl != nil {
		return gltfMtl
	}
	gltfMtl = &gltf.Material{}
	gltfMtl.Name = material.Name
	gltfMtl.Extras = map[string]any{"refId": refId, "mtl": material}
	doc.Materials = append(doc.Materials, gltfMtl)
	return gltfMtl
}

// FindOrAddMaterialFromFile adds the material like FindOrAddMaterial and remembers its source
// (material file and index in the material collection). Equal materials are added once and keep the first source.
func (doc *Document) FindOrAddMaterialFromFile(material mtl.Material, file string, index int) *gltf.Material {
	gltfMtl := doc.FindOrAddMaterial(material)
	if _, ok := ExtrasLoad[extensions.ExtNwMtlRef](gltfMtl.Extras, ExtraKeyMtlRef); !ok && file != "" {
		gltfMtl.Extras = ExtrasStore(gltfMtl.Extras, ExtraKeyMtlRef, newMtlRef(file, index))
	}
	return gltfMtl
}

func newMtlRef(file string, index int) extensions.ExtNwMtlRef {
	// normalized, so that clients get one url per material file
	file = strings.ToLower(strings.TrimPrefix(path.Clean(strings.ReplaceAll(file, "\\", "/")), "/"))
	return extensions.ExtNwMtlRef{File: file, Index: index}
}

func ExtrasLoad[T any](data any, key string) (value T, ok bool) {
	lookup, ok := data.(map[string]any)
	if !ok {
		return value, false
	}
	v, ok := lookup[key]
	if !ok {
		return value, false
	}
	return v.(T), true
}

func ExtrasStore[T any](data any, key string, value T) any {
	if data == nil {
		data = make(map[string]any)
	}
	lookup, ok := data.(map[string]any)
	if !ok {
		return lookup
	}
	lookup[key] = value
	return lookup
}

func ExtrasDelete(data any, key string) any {
	if data == nil {
		return data
	}
	lookup, ok := data.(map[string]any)
	if !ok {
		return lookup
	}
	delete(lookup, key)
	return lookup
}

func (doc *Document) IsMaterialReferenced(material *gltf.Material) bool {
	index := slices.Index(doc.Materials, material)
	for _, mesh := range doc.Meshes {
		for _, primitive := range mesh.Primitives {
			if primitive.Material != nil && *primitive.Material == index {
				return true
			}
		}
	}
	return false
}
